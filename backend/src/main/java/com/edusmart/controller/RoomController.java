package com.edusmart.controller;

import com.edusmart.dto.CreateRoomRequest;
import com.edusmart.dto.JoinRoomRequest;
import com.edusmart.dto.ParticipantResponse;
import com.edusmart.dto.RoomResponse;
import com.edusmart.service.RoomService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.edusmart.dto.UpdatePermissionsRequest;
import com.edusmart.websocket.RoomWebSocketHandler;

@RestController
@RequestMapping("/api/rooms")
public class RoomController {

    private static final Logger log = LoggerFactory.getLogger(RoomController.class);

    private final RoomService roomService;
    private final RoomWebSocketHandler roomWebSocketHandler;

    public RoomController(RoomService roomService, RoomWebSocketHandler roomWebSocketHandler) {
        this.roomService = roomService;
        this.roomWebSocketHandler = roomWebSocketHandler;
    }

    @PostMapping
    public ResponseEntity<RoomResponse> createRoom(@Valid @RequestBody CreateRoomRequest request) {
        RoomResponse response = roomService.createRoom(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/join")
    public ResponseEntity<RoomResponse> joinRoom(@Valid @RequestBody JoinRoomRequest request) {
        RoomResponse response = roomService.joinRoom(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{roomCode}")
    public ResponseEntity<RoomResponse> getRoom(@PathVariable String roomCode) {
        return ResponseEntity.ok(roomService.getRoomByCode(roomCode));
    }

    @GetMapping("/{roomCode}/participants")
    public ResponseEntity<List<ParticipantResponse>> getParticipants(@PathVariable String roomCode) {
        return ResponseEntity.ok(roomService.getParticipants(roomCode));
    }

    @PostMapping("/{roomCode}/close")
    public ResponseEntity<Void> closeRoom(@PathVariable String roomCode) {
        roomService.closeRoom(roomCode);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{roomCode}")
    public ResponseEntity<Void> deleteRoom(@PathVariable String roomCode) {
        roomWebSocketHandler.broadcastRoomDeleted(roomCode);
        roomService.deleteRoom(roomCode);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{roomCode}/participants/{displayName}/permissions")
    public ResponseEntity<Void> updatePermissions(
            @PathVariable String roomCode,
            @PathVariable String displayName,
            @RequestBody UpdatePermissionsRequest request) {
        
        roomService.updatePermissions(roomCode, displayName, request);
        
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("displayName", displayName);
            if (request.isCanDraw() != null) payload.put("canDraw", request.isCanDraw());
            if (request.isCanCreateFile() != null) payload.put("canCreateFile", request.isCanCreateFile());
            if (request.isCanEditFile() != null) payload.put("canEditFile", request.isCanEditFile());
            if (request.isCanDeleteFile() != null) payload.put("canDeleteFile", request.isCanDeleteFile());
            
            com.edusmart.websocket.WsMessage message = com.edusmart.websocket.WsMessage.builder()
                    .type("PERMISSIONS_UPDATED")
                    .sender("SYSTEM")
                    .payload(payload)
                    .build();
            roomWebSocketHandler.broadcastToRoom(roomCode, message);
        } catch (Exception e) {
            log.error("Failed to broadcast PERMISSIONS_UPDATED event", e);
        }
        
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{roomCode}/participants/global/permissions")
    public ResponseEntity<Void> updateGlobalPermissions(
            @PathVariable String roomCode,
            @RequestBody UpdatePermissionsRequest request) {
        
        roomService.updateGlobalPermissions(roomCode, request);
        
        try {
            Map<String, Object> payload = new HashMap<>();
            if (request.isCanDraw() != null) payload.put("canDraw", request.isCanDraw());
            if (request.isCanCreateFile() != null) payload.put("canCreateFile", request.isCanCreateFile());
            if (request.isCanEditFile() != null) payload.put("canEditFile", request.isCanEditFile());
            if (request.isCanDeleteFile() != null) payload.put("canDeleteFile", request.isCanDeleteFile());
            
            com.edusmart.websocket.WsMessage message = com.edusmart.websocket.WsMessage.builder()
                    .type("GLOBAL_PERMISSIONS_UPDATED")
                    .sender("SYSTEM")
                    .payload(payload)
                    .build();
            roomWebSocketHandler.broadcastToRoom(roomCode, message);
        } catch (Exception e) {
            log.error("Failed to broadcast GLOBAL_PERMISSIONS_UPDATED event", e);
        }
        
        return ResponseEntity.ok().build();
    }
}
