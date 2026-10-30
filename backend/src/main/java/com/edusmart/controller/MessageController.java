package com.edusmart.controller;

import com.edusmart.dto.ChatMessageResponse;
import com.edusmart.entity.Room;
import com.edusmart.service.ChatService;
import com.edusmart.service.RoomService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Read-only REST access to a room's chat history, used to hydrate the chat panel
 * when a user first opens (or reopens) a classroom. New messages arrive live over
 * the WebSocket (see RoomWebSocketHandler) and are persisted from there.
 */
@RestController
@RequestMapping("/api/rooms")
public class MessageController {

    private final ChatService chatService;
    private final RoomService roomService;

    public MessageController(ChatService chatService, RoomService roomService) {
        this.chatService = chatService;
        this.roomService = roomService;
    }

    @GetMapping("/{roomCode}/messages")
    public ResponseEntity<List<ChatMessageResponse>> getMessages(@PathVariable String roomCode) {
        Room room = roomService.findEntityByCode(roomCode);
        return ResponseEntity.ok(chatService.getHistory(room));
    }
}
