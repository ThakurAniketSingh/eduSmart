package com.edusmart.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * A single chat message sent inside a room. Persisted so the chat history
 * is visible to anyone who (re)joins the room.
 */
@Entity
@Table(name = "chat_messages")
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @Column(nullable = false)
    private String sender;

    @Lob
    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(nullable = false)
    private boolean isDeleted = false;

    @Column
    private String deletedByRole;

    public ChatMessage() {
    }

    public ChatMessage(Long id, Room room, String sender, String message, LocalDateTime timestamp, boolean isDeleted, String deletedByRole) {
        this.id = id;
        this.room = room;
        this.sender = sender;
        this.message = message;
        this.timestamp = timestamp;
        this.isDeleted = isDeleted;
        this.deletedByRole = deletedByRole;
    }

    // --- Getters ---

    public Long getId() { return id; }
    public Room getRoom() { return room; }
    public String getSender() { return sender; }
    public String getMessage() { return message; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public boolean isDeleted() { return isDeleted; }
    public String getDeletedByRole() { return deletedByRole; }

    // --- Setters ---

    public void setId(Long id) { this.id = id; }
    public void setRoom(Room room) { this.room = room; }
    public void setSender(String sender) { this.sender = sender; }
    public void setMessage(String message) { this.message = message; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
    public void setDeleted(boolean deleted) { isDeleted = deleted; }
    public void setDeletedByRole(String deletedByRole) { this.deletedByRole = deletedByRole; }

    // --- Builder ---

    public static ChatMessageBuilder builder() { return new ChatMessageBuilder(); }

    public static class ChatMessageBuilder {
        private Long id;
        private Room room;
        private String sender;
        private String message;
        private LocalDateTime timestamp;
        private boolean isDeleted;
        private String deletedByRole;

        public ChatMessageBuilder id(Long id) { this.id = id; return this; }
        public ChatMessageBuilder room(Room room) { this.room = room; return this; }
        public ChatMessageBuilder sender(String sender) { this.sender = sender; return this; }
        public ChatMessageBuilder message(String message) { this.message = message; return this; }
        public ChatMessageBuilder timestamp(LocalDateTime timestamp) { this.timestamp = timestamp; return this; }
        public ChatMessageBuilder isDeleted(boolean isDeleted) { this.isDeleted = isDeleted; return this; }
        public ChatMessageBuilder deletedByRole(String deletedByRole) { this.deletedByRole = deletedByRole; return this; }

        public ChatMessage build() {
            return new ChatMessage(id, room, sender, message, timestamp, isDeleted, deletedByRole);
        }
    }

    @PrePersist
    protected void onCreate() {
        this.timestamp = LocalDateTime.now();
    }
}
