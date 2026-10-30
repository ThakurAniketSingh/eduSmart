package com.edusmart.dto;

import jakarta.validation.constraints.NotBlank;

public class FileRequest {

    @NotBlank(message = "File name is required")
    private String fileName;

    /** Content may be blank for a brand new empty file. */
    private String content;

    // --- Getters ---

    public String getFileName() { return fileName; }
    public String getContent() { return content; }

    // --- Setters ---

    public void setFileName(String fileName) { this.fileName = fileName; }
    public void setContent(String content) { this.content = content; }
}
