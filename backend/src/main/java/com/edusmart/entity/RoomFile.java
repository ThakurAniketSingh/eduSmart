package com.edusmart.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * A single source file that lives inside a room (e.g. Main.java).
 * Content is stored as plain text; there is no version control system involved,
 * simple snapshots are kept separately in CodeHistory whenever a file is saved.
 */
@Entity
@Table(name = "room_files")
public class RoomFile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Lob
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public RoomFile() {
    }

    public RoomFile(Long id, Room room, String fileName, String content, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.room = room;
        this.fileName = fileName;
        this.content = content;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // --- Getters ---

    public Long getId() { return id; }
    public Room getRoom() { return room; }
    public String getFileName() { return fileName; }
    public String getContent() { return content; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    // --- Setters ---

    public void setId(Long id) { this.id = id; }
    public void setRoom(Room room) { this.room = room; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    public void setContent(String content) { this.content = content; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    // --- Builder ---

    public static RoomFileBuilder builder() { return new RoomFileBuilder(); }

    public static class RoomFileBuilder {
        private Long id;
        private Room room;
        private String fileName;
        private String content;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public RoomFileBuilder id(Long id) { this.id = id; return this; }
        public RoomFileBuilder room(Room room) { this.room = room; return this; }
        public RoomFileBuilder fileName(String fileName) { this.fileName = fileName; return this; }
        public RoomFileBuilder content(String content) { this.content = content; return this; }
        public RoomFileBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public RoomFileBuilder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public RoomFile build() {
            return new RoomFile(id, room, fileName, content, createdAt, updatedAt);
        }
    }

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
