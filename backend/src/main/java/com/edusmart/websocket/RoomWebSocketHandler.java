package com.edusmart.websocket;

import com.edusmart.dto.ParticipantResponse;
import com.edusmart.entity.ChatMessage;
import com.edusmart.entity.Room;
import com.edusmart.service.ChatService;
import com.edusmart.service.PresenceService;
import com.edusmart.service.RoomService;
import com.edusmart.service.CodeExecutionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.ConcurrentWebSocketSessionDecorator;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

/**
 * Handles a single WebSocket endpoint: /ws/room/{roomCode}?displayName=...&role=...
 *
 * All room-based real-time features share this one handler and are distinguished by the
 * "type" field of the WsMessage envelope:
 *
 *   PRESENCE          - server -> clients, sent whenever someone joins/leaves
 *   CHAT              - client -> server -> broadcast, also persisted
 *   CODE_UPDATE       - client -> server -> broadcast (excluding sender), NOT persisted here
 *                       (explicit Save is a separate REST call that also creates history)
 *   WHITEBOARD_DRAW   - client -> server -> broadcast (excluding sender)
 *   WHITEBOARD_CLEAR  - client -> server -> broadcast (excluding sender)
 *
 * Kept deliberately simple: no CRDT/OT, no STOMP broker, just a room -> sessions map
 * and straightforward JSON broadcasting.
 */
@Component
public class RoomWebSocketHandler extends TextWebSocketHandler {

    private static final Logger log = LoggerFactory.getLogger(RoomWebSocketHandler.class);

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Map<String, Set<WebSocketSession>> roomSessions = new ConcurrentHashMap<>();
    private final Map<String, List<Map<String, Object>>> roomWhiteboardHistory = new ConcurrentHashMap<>();

    private final PresenceService presenceService;
    private final ChatService chatService;
    private final RoomService roomService;
    private final CodeExecutionService codeExecutionService;

    public RoomWebSocketHandler(PresenceService presenceService, ChatService chatService, RoomService roomService, CodeExecutionService codeExecutionService) {
        this.presenceService = presenceService;
        this.chatService = chatService;
        this.roomService = roomService;
        this.codeExecutionService = codeExecutionService;
    }

    // ---------------------------------------------------------------------
    // Connection lifecycle
    // ---------------------------------------------------------------------

    @Override
    public void afterConnectionEstablished(WebSocketSession rawSession) {
        // Wrap the session to handle concurrent sends safely (prevents TEXT_PARTIAL_WRITING errors with large audio/image messages)
        WebSocketSession session = new ConcurrentWebSocketSessionDecorator(rawSession, 5000, 1024 * 1024 * 10);
        
        String roomCode = extractRoomCode(session);
        String displayName = extractQueryParam(session, "displayName", "Guest");
        String role = extractQueryParam(session, "role", "USER");

        session.getAttributes().put("roomCode", roomCode);
        session.getAttributes().put("displayName", displayName);
        session.getAttributes().put("role", role);

        roomSessions.computeIfAbsent(roomCode, code -> new CopyOnWriteArraySet<>()).add(session);
        presenceService.addParticipant(roomCode, session, displayName, role);
        roomService.markRoomAsActive(roomCode);

        log.info("WebSocket connected: room={} user={} role={}", roomCode, displayName, role);

        broadcastPresence(roomCode, "JOIN", displayName);

        // Send existing whiteboard history to the newly connected client
        List<Map<String, Object>> wbHistory = roomWhiteboardHistory.get(roomCode);
        if (wbHistory != null && !wbHistory.isEmpty()) {
            sendSafely(session, writeJson(WsMessage.builder()
                    .type("WHITEBOARD_SNAPSHOT")
                    .payload(Map.of("events", wbHistory))
                    .build()));
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String roomCode = (String) session.getAttributes().get("roomCode");
        String displayName = (String) session.getAttributes().get("displayName");
        if (roomCode == null) {
            return;
        }

        Set<WebSocketSession> sessions = roomSessions.get(roomCode);
        if (sessions != null) {
            // Remove by session ID, not object reference, because the set
            // contains ConcurrentWebSocketSessionDecorator wrappers whose
            // equals() won't match the raw session received here.
            sessions.removeIf(s -> s.getId().equals(session.getId()));
            if (sessions.isEmpty()) {
                roomSessions.remove(roomCode);
            }
        }
        presenceService.removeParticipant(roomCode, session);

        log.info("WebSocket disconnected: room={} user={}", roomCode, displayName);

        codeExecutionService.stopRun(session.getId());

        if (presenceService.getParticipants(roomCode).isEmpty()) {
            roomService.markRoomAsEmpty(roomCode);
        } else {
            broadcastPresence(roomCode, "LEAVE", displayName);
        }
    }

    // ---------------------------------------------------------------------
    // Incoming messages
    // ---------------------------------------------------------------------

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        String roomCode = (String) session.getAttributes().get("roomCode");
        String displayName = (String) session.getAttributes().get("displayName");
        String role = (String) session.getAttributes().get("role");

        try {
            WsMessage incoming = objectMapper.readValue(message.getPayload(), WsMessage.class);
            if (incoming.getType() == null) {
                return;
            }

            switch (incoming.getType()) {
                case "CHAT" -> handleChat(roomCode, displayName, incoming);
                case "CHAT_DELETE" -> handleChatDelete(roomCode, displayName, role, incoming);
                case "CODE_UPDATE" -> broadcastExceptSender(roomCode, session, incoming, displayName);
                case "FILE_SYNC" -> broadcastExceptSender(roomCode, session, incoming, displayName);
                case "WHITEBOARD_DRAW" -> {
                    if (incoming.getPayload() != null) {
                        roomWhiteboardHistory
                                .computeIfAbsent(roomCode, k -> new java.util.concurrent.CopyOnWriteArrayList<>())
                                .add(incoming.getPayload());
                    }
                    broadcastExceptSender(roomCode, session, incoming, displayName);
                }
                case "WHITEBOARD_CLEAR" -> {
                    roomWhiteboardHistory.remove(roomCode);
                    broadcastExceptSender(roomCode, session, incoming, displayName);
                }
                case "CODE_RUN_START" -> handleCodeRunStart(session, incoming);
                case "CODE_RUN_INPUT" -> handleCodeRunInput(session, incoming);
                case "CODE_RUN_STOP" -> codeExecutionService.stopRun(session.getId());
                default -> log.debug("Ignoring unknown WS message type: {}", incoming.getType());
            }
        } catch (IOException ex) {
            log.warn("Failed to parse WebSocket message in room {}: {}", roomCode, ex.getMessage());
        }
    }

    private void handleCodeRunStart(WebSocketSession session, WsMessage incoming) {
        String fileName = (String) incoming.getPayload().get("fileName");
        String content = (String) incoming.getPayload().get("content");
        if (fileName == null || content == null) return;

        codeExecutionService.startInteractiveRun(
                session.getId(),
                fileName,
                content,
                (output) -> sendSafely(session, writeJson(WsMessage.builder()
                        .type("CODE_RUN_OUTPUT")
                        .payload(Map.of("text", output))
                        .build())),
                (exitCode) -> sendSafely(session, writeJson(WsMessage.builder()
                        .type("CODE_RUN_END")
                        .payload(Map.of("exitCode", exitCode))
                        .build()))
        );
    }

    private void handleCodeRunInput(WebSocketSession session, WsMessage incoming) {
        String input = (String) incoming.getPayload().get("input");
        if (input != null) {
            codeExecutionService.sendInput(session.getId(), input);
        }
    }

    private void handleChat(String roomCode, String displayName, WsMessage incoming) {
        Object text = incoming.getPayload() != null ? incoming.getPayload().get("message") : null;
        if (text == null || text.toString().isBlank()) {
            return;
        }

        Optional<Room> room = roomService.findEntityByCodeOptional(roomCode);
        String sender = incoming.getSender() != null ? incoming.getSender() : displayName;

        ChatMessage saved = room.map(r -> chatService.saveMessage(r, sender, text.toString())).orElse(null);

        WsMessage outgoing = WsMessage.builder()
                .type("CHAT")
                .sender(sender)
                .payload(Map.of(
                        "id", saved != null ? saved.getId() : null,
                        "message", text.toString(),
                        "timestamp", saved != null
                                ? saved.getTimestamp().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                                : java.time.LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                ))
                .build();

        broadcastToRoom(roomCode, outgoing);
    }

    private void handleChatDelete(String roomCode, String displayName, String role, WsMessage incoming) {
        if (incoming.getPayload() == null || !incoming.getPayload().containsKey("id")) {
            return;
        }
        Long messageId = ((Number) incoming.getPayload().get("id")).longValue();
        ChatMessage msg = chatService.findById(messageId);
        
        if (msg != null && (role.equals("ADMIN") || msg.getSender().equals(displayName))) {
            chatService.deleteMessage(messageId, role);
            WsMessage outgoing = WsMessage.builder()
                    .type("CHAT_DELETE")
                    .sender(displayName)
                    .payload(Map.of("id", messageId, "deletedByRole", role))
                    .build();
            broadcastToRoom(roomCode, outgoing);
        }
    }

    private void broadcastExceptSender(String roomCode, WebSocketSession sender, WsMessage incoming, String displayName) {
        if (incoming.getSender() == null) {
            incoming.setSender(displayName);
        }
        String json = writeJson(incoming);
        if (json == null) {
            return;
        }
        for (WebSocketSession s : roomSessions.getOrDefault(roomCode, Set.of())) {
            if (s.isOpen() && !s.getId().equals(sender.getId())) {
                sendSafely(s, json);
            }
        }
    }

    // ---------------------------------------------------------------------
    // Broadcasting helpers
    // ---------------------------------------------------------------------

    private void broadcastPresence(String roomCode, String eventType, String displayName) {
        List<ParticipantResponse> participants = presenceService.getParticipants(roomCode);

        WsMessage presenceMessage = WsMessage.builder()
                .type("PRESENCE")
                .sender(displayName)
                .payload(Map.of(
                        "event", eventType,
                        "displayName", displayName,
                        "participants", participants,
                        "count", participants.size()
                ))
                .build();

        broadcastToRoom(roomCode, presenceMessage);
    }

    public void broadcastToRoom(String roomCode, WsMessage message) {
        String json = writeJson(message);
        if (json == null) {
            return;
        }
        for (WebSocketSession s : roomSessions.getOrDefault(roomCode, Set.of())) {
            sendSafely(s, json);
        }
    }

    public void broadcastRoomDeleted(String roomCode) {
        roomWhiteboardHistory.remove(roomCode);
        WsMessage message = WsMessage.builder()
                .type("ROOM_DELETED")
                .sender("SYSTEM")
                .build();
        broadcastToRoom(roomCode, message);
        // Force close sessions
        for (WebSocketSession s : roomSessions.getOrDefault(roomCode, Set.of())) {
            try {
                s.close();
            } catch (IOException e) {
                log.warn("Error closing session for deleted room: {}", e.getMessage());
            }
        }
        roomSessions.remove(roomCode);
    }

    private void sendSafely(WebSocketSession session, String json) {
        try {
            if (session.isOpen()) {
                session.sendMessage(new TextMessage(json));
            }
        } catch (IOException ex) {
            log.warn("Failed to send WebSocket message to session {}: {}", session.getId(), ex.getMessage());
        }
    }

    private String writeJson(WsMessage message) {
        try {
            return objectMapper.writeValueAsString(message);
        } catch (IOException ex) {
            log.warn("Failed to serialize WebSocket message: {}", ex.getMessage());
            return null;
        }
    }

    // ---------------------------------------------------------------------
    // URI parsing helpers
    // ---------------------------------------------------------------------

    private String extractRoomCode(WebSocketSession session) {
        String path = session.getUri() != null ? session.getUri().getPath() : "";
        String[] segments = path.split("/");
        return segments.length > 0 ? segments[segments.length - 1].toUpperCase() : "UNKNOWN";
    }

    private String extractQueryParam(WebSocketSession session, String key, String fallback) {
        if (session.getUri() == null) {
            return fallback;
        }
        List<String> values = UriComponentsBuilder.fromUri(session.getUri())
                .build()
                .getQueryParams()
                .get(key);
        if (values == null || values.isEmpty() || values.get(0).isBlank()) {
            return fallback;
        }
        try {
            return java.net.URLDecoder.decode(values.get(0), java.nio.charset.StandardCharsets.UTF_8);
        } catch (Exception e) {
            return values.get(0);
        }
    }
}
