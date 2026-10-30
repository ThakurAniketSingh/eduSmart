package com.edusmart.dto;

import java.time.LocalDateTime;

public class RoomResponse {
    private Long id;
    private String roomCode;
    private String roomName;
    private String adminName;
    private boolean active;
    private LocalDateTime createdAt;

    public RoomResponse() {
    }

    public RoomResponse(Long id, String roomCode, String roomName, String adminName, boolean active, LocalDateTime createdAt) {
        this.id = id;
        this.roomCode = roomCode;
        this.roomName = roomName;
        this.adminName = adminName;
        this.active = active;
        this.createdAt = createdAt;
    }

    // --- Getters ---

    public Long getId() { return id; }
    public String getRoomCode() { return roomCode; }
    public String getRoomName() { return roomName; }
    public String getAdminName() { return adminName; }
    public boolean isActive() { return active; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    // --- Builder ---

    public static RoomResponseBuilder builder() { return new RoomResponseBuilder(); }

    public static class RoomResponseBuilder {
        private Long id;
        private String roomCode;
        private String roomName;
        private String adminName;
        private boolean active;
        private LocalDateTime createdAt;

        public RoomResponseBuilder id(Long id) { this.id = id; return this; }
        public RoomResponseBuilder roomCode(String roomCode) { this.roomCode = roomCode; return this; }
        public RoomResponseBuilder roomName(String roomName) { this.roomName = roomName; return this; }
        public RoomResponseBuilder adminName(String adminName) { this.adminName = adminName; return this; }
        public RoomResponseBuilder active(boolean active) { this.active = active; return this; }
        public RoomResponseBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public RoomResponse build() {
            return new RoomResponse(id, roomCode, roomName, adminName, active, createdAt);
        }
    }
}
