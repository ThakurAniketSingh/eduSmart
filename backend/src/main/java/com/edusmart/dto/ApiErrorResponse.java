package com.edusmart.dto;

import java.time.LocalDateTime;

public class ApiErrorResponse {
    private int status;
    private String error;
    private String message;
    private LocalDateTime timestamp;

    public ApiErrorResponse() {
    }

    public ApiErrorResponse(int status, String error, String message, LocalDateTime timestamp) {
        this.status = status;
        this.error = error;
        this.message = message;
        this.timestamp = timestamp;
    }

    // --- Getters ---

    public int getStatus() { return status; }
    public String getError() { return error; }
    public String getMessage() { return message; }
    public LocalDateTime getTimestamp() { return timestamp; }

    // --- Builder ---

    public static ApiErrorResponseBuilder builder() { return new ApiErrorResponseBuilder(); }

    public static class ApiErrorResponseBuilder {
        private int status;
        private String error;
        private String message;
        private LocalDateTime timestamp;

        public ApiErrorResponseBuilder status(int status) { this.status = status; return this; }
        public ApiErrorResponseBuilder error(String error) { this.error = error; return this; }
        public ApiErrorResponseBuilder message(String message) { this.message = message; return this; }
        public ApiErrorResponseBuilder timestamp(LocalDateTime timestamp) { this.timestamp = timestamp; return this; }

        public ApiErrorResponse build() {
            return new ApiErrorResponse(status, error, message, timestamp);
        }
    }
}
