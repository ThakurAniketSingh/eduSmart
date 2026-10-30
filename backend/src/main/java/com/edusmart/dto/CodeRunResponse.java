package com.edusmart.dto;

public class CodeRunResponse {
    private String status;   // SUCCESS, COMPILATION_ERROR, RUNTIME_ERROR, TIMEOUT, DOCKER_UNAVAILABLE
    private String output;
    private String error;
    private long executionTimeMs;

    public CodeRunResponse() {
    }

    public CodeRunResponse(String status, String output, String error, long executionTimeMs) {
        this.status = status;
        this.output = output;
        this.error = error;
        this.executionTimeMs = executionTimeMs;
    }

    // --- Getters ---

    public String getStatus() { return status; }
    public String getOutput() { return output; }
    public String getError() { return error; }
    public long getExecutionTimeMs() { return executionTimeMs; }

    // --- Builder ---

    public static CodeRunResponseBuilder builder() { return new CodeRunResponseBuilder(); }

    public static class CodeRunResponseBuilder {
        private String status;
        private String output;
        private String error;
        private long executionTimeMs;

        public CodeRunResponseBuilder status(String status) { this.status = status; return this; }
        public CodeRunResponseBuilder output(String output) { this.output = output; return this; }
        public CodeRunResponseBuilder error(String error) { this.error = error; return this; }
        public CodeRunResponseBuilder executionTimeMs(long executionTimeMs) { this.executionTimeMs = executionTimeMs; return this; }

        public CodeRunResponse build() {
            return new CodeRunResponse(status, output, error, executionTimeMs);
        }
    }
}
