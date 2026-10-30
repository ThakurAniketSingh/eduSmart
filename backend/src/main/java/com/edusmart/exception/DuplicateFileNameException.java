package com.edusmart.exception;

public class DuplicateFileNameException extends RuntimeException {
    public DuplicateFileNameException(String message) {
        super(message);
    }
}
