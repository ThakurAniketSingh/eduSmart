package com.edusmart.dto;

import jakarta.validation.constraints.NotBlank;

public class CodeRunRequest {

    @NotBlank(message = "Source code is required")
    private String sourceCode;

    /**
     * Public class name in the source, e.g. "Main". Defaults to "Main" if not supplied.
     * Java requires the file name to match the public class name when compiling.
     */
    private String className = "Main";

    // --- Getters ---

    public String getSourceCode() { return sourceCode; }
    public String getClassName() { return className; }

    // --- Setters ---

    public void setSourceCode(String sourceCode) { this.sourceCode = sourceCode; }
    public void setClassName(String className) { this.className = className; }
}
