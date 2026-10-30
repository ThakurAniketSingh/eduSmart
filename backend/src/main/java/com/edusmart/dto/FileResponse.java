package com.edusmart.dto;

import java.time.LocalDateTime;

public class FileResponse {
    private Long id;
    private String fileName;
    private String content;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public FileResponse() {
    }

    public FileResponse(Long id, String fileName, String content, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.fileName = fileName;
        this.content = content;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // --- Getters ---

    public Long getId() { return id; }
    public String getFileName() { return fileName; }
    public String getContent() { return content; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    // --- Builder ---

    public static FileResponseBuilder builder() { return new FileResponseBuilder(); }

    public static class FileResponseBuilder {
        private Long id;
        private String fileName;
        private String content;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public FileResponseBuilder id(Long id) { this.id = id; return this; }
        public FileResponseBuilder fileName(String fileName) { this.fileName = fileName; return this; }
        public FileResponseBuilder content(String content) { this.content = content; return this; }
        public FileResponseBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public FileResponseBuilder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public FileResponse build() {
            return new FileResponse(id, fileName, content, createdAt, updatedAt);
        }
    }
}
