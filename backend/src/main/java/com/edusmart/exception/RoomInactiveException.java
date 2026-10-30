package com.edusmart.exception;

public class RoomInactiveException extends RuntimeException {
    public RoomInactiveException(String message) {
        super(message);
    }
}
