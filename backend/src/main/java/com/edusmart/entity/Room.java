package com.edusmart.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * Represents a single collaborative classroom ("room").
 * A room is created by an admin and identified by a short, unique room code
 * that users use to join.
 */
@Entity
@Table(name = "rooms")
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "room_code", nullable = false, unique = true, length = 6)
    private String roomCode;

    @Column(name = "room_name", nullable = false)
    private String roomName;

    @Column(name = "admin_name", nullable = false)
    private String adminName;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "last_empty_at")
    private LocalDateTime lastEmptyAt;

    public Room() {
    }

    public Room(Long id, String roomCode, String roomName, String adminName, boolean active, LocalDateTime createdAt, LocalDateTime lastEmptyAt) {
        this.id = id;
        this.roomCode = roomCode;
        this.roomName = roomName;
        this.adminName = adminName;
        this.active = active;
        this.createdAt = createdAt;
        this.lastEmptyAt = lastEmptyAt;
    }

    // --- Getters ---

    public Long getId() { return id; }
    public String getRoomCode() { return roomCode; }
    public String getRoomName() { return roomName; }
    public String getAdminName() { return adminName; }
    public boolean isActive() { return active; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getLastEmptyAt() { return lastEmptyAt; }

    // --- Setters ---

    public void setId(Long id) { this.id = id; }
    public void setRoomCode(String roomCode) { this.roomCode = roomCode; }
    public void setRoomName(String roomName) { this.roomName = roomName; }
    public void setAdminName(String adminName) { this.adminName = adminName; }
    public void setActive(boolean active) { this.active = active; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setLastEmptyAt(LocalDateTime lastEmptyAt) { this.lastEmptyAt = lastEmptyAt; }

    // --- Builder ---

    public static RoomBuilder builder() { return new RoomBuilder(); }

    public static class RoomBuilder {
        private Long id;
        private String roomCode;
        private String roomName;
        private String adminName;
        private boolean active = true;
        private LocalDateTime createdAt;
        private LocalDateTime lastEmptyAt;

        public RoomBuilder id(Long id) { this.id = id; return this; }
        public RoomBuilder roomCode(String roomCode) { this.roomCode = roomCode; return this; }
        public RoomBuilder roomName(String roomName) { this.roomName = roomName; return this; }
        public RoomBuilder adminName(String adminName) { this.adminName = adminName; return this; }
        public RoomBuilder active(boolean active) { this.active = active; return this; }
        public RoomBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public RoomBuilder lastEmptyAt(LocalDateTime lastEmptyAt) { this.lastEmptyAt = lastEmptyAt; return this; }

        public Room build() {
            return new Room(id, roomCode, roomName, adminName, active, createdAt, lastEmptyAt);
        }
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
