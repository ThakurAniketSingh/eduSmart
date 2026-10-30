package com.edusmart.exception;

public class FileNotFoundInRoomException extends RuntimeException {
    public FileNotFoundInRoomException(String message) {
        super(message);
    }
}
