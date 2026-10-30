package com.edusmart.service;

import com.edusmart.dto.ParticipantResponse;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.WebSocketSession;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Tracks who is currently connected to each room, purely in memory.
 *
 * Presence changes constantly (every join/leave/reconnect), so persisting it to
 * PostgreSQL on every change would be wasteful for an academic demo project.
 * If the backend restarts, live presence simply resets - which is expected and fine,
 * since it is derived state, not source-of-truth data (membership history still
 * lives in the room_members table via RoomService).
 */
@Service
public class PresenceService {

    /** roomCode -> (sessionId -> participant info) */
    private final Map<String, Map<String, Participant>> roomSessions = new ConcurrentHashMap<>();

    private final com.edusmart.repository.RoomMemberRepository roomMemberRepository;
    private final com.edusmart.repository.RoomRepository roomRepository;

    public PresenceService(com.edusmart.repository.RoomMemberRepository roomMemberRepository, com.edusmart.repository.RoomRepository roomRepository) {
        this.roomMemberRepository = roomMemberRepository;
        this.roomRepository = roomRepository;
    }

    public record Participant(String sessionId, String displayName, String role) {
    }

    public void addParticipant(String roomCode, WebSocketSession session, String displayName, String role) {
        Map<String, Participant> sessions = roomSessions
                .computeIfAbsent(roomCode, code -> new ConcurrentHashMap<>());
        // Clean up any stale sessions for the same displayName (e.g. rapid page refresh / reconnect)
        sessions.values().removeIf(p -> p.displayName().equalsIgnoreCase(displayName) && !p.sessionId().equals(session.getId()));
        sessions.put(session.getId(), new Participant(session.getId(), displayName, role));
    }

    public void removeParticipant(String roomCode, WebSocketSession session) {
        Map<String, Participant> sessions = roomSessions.get(roomCode);
        if (sessions != null) {
            sessions.remove(session.getId());
            if (sessions.isEmpty()) {
                roomSessions.remove(roomCode);
            }
        }
    }

    public List<ParticipantResponse> getParticipants(String roomCode) {
        Map<String, Participant> sessions = roomSessions.getOrDefault(roomCode, Map.of());
        
        com.edusmart.entity.Room room = roomRepository.findByRoomCode(roomCode).orElse(null);
        
        // Deduplicate by displayName — ensure only unique users are returned
        Map<String, Participant> uniqueByName = new java.util.LinkedHashMap<>();
        for (Participant p : sessions.values()) {
            uniqueByName.putIfAbsent(p.displayName(), p);
        }
        
        return uniqueByName.values().stream()
                .map(p -> {
                    boolean canDraw = true, canCreateFile = true, canEditFile = true, canDeleteFile = true;
                    if (room != null && !p.role().equals("ADMIN")) {
                        var member = roomMemberRepository.findByRoomAndDisplayName(room, p.displayName()).orElse(null);
                        if (member != null) {
                            canDraw = member.isCanDraw();
                            canCreateFile = member.isCanCreateFile();
                            canEditFile = member.isCanEditFile();
                            canDeleteFile = member.isCanDeleteFile();
                        }
                    }
                    return ParticipantResponse.builder()
                            .displayName(p.displayName())
                            .role(p.role())
                            .online(true)
                            .canDraw(canDraw)
                            .canCreateFile(canCreateFile)
                            .canEditFile(canEditFile)
                            .canDeleteFile(canDeleteFile)
                            .build();
                })
                .collect(Collectors.toList());
    }

    public int getParticipantCount(String roomCode) {
        return getParticipants(roomCode).size();
    }

    public Collection<Participant> getParticipantValues(String roomCode) {
        return roomSessions.getOrDefault(roomCode, Map.of()).values();
    }
}
