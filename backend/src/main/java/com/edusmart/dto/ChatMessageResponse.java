package com.edusmart.dto;

import java.time.LocalDateTime;

public class ChatMessageResponse {
    private Long id;
    private String sender;
    private String message;
    private LocalDateTime timestamp;
    private boolean isDeleted;
    private String deletedByRole;

    public ChatMessageResponse() {
    }

    public ChatMessageResponse(Long id, String sender, String message, LocalDateTime timestamp, boolean isDeleted, String deletedByRole) {
        this.id = id;
        this.sender = sender;
        this.message = message;
        this.timestamp = timestamp;
        this.isDeleted = isDeleted;
        this.deletedByRole = deletedByRole;
    }

    // --- Getters ---

    public Long getId() { return id; }
    public String getSender() { return sender; }
    public String getMessage() { return message; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public boolean isDeleted() { return isDeleted; }
    public String getDeletedByRole() { return deletedByRole; }

    // --- Builder ---

    public static ChatMessageResponseBuilder builder() { return new ChatMessageResponseBuilder(); }

    public static class ChatMessageResponseBuilder {
        private Long id;
        private String sender;
        private String message;
        private LocalDateTime timestamp;
        private boolean isDeleted;
        private String deletedByRole;

        public ChatMessageResponseBuilder id(Long id) { this.id = id; return this; }
        public ChatMessageResponseBuilder sender(String sender) { this.sender = sender; return this; }
        public ChatMessageResponseBuilder message(String message) { this.message = message; return this; }
        public ChatMessageResponseBuilder timestamp(LocalDateTime timestamp) { this.timestamp = timestamp; return this; }
        public ChatMessageResponseBuilder isDeleted(boolean isDeleted) { this.isDeleted = isDeleted; return this; }
        public ChatMessageResponseBuilder deletedByRole(String deletedByRole) { this.deletedByRole = deletedByRole; return this; }

        public ChatMessageResponse build() {
            return new ChatMessageResponse(id, sender, message, timestamp, isDeleted, deletedByRole);
        }
    }
}
