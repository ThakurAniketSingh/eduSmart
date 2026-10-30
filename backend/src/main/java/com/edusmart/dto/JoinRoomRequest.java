package com.edusmart.dto;

import jakarta.validation.constraints.NotBlank;

public class JoinRoomRequest {

    @NotBlank(message = "Display name is required")
    private String displayName;

    @NotBlank(message = "Room code is required")
    private String roomCode;

    // --- Getters ---

    public String getDisplayName() { return displayName; }
    public String getRoomCode() { return roomCode; }

    // --- Setters ---

    public void setDisplayName(String displayName) { this.displayName = displayName; }
    public void setRoomCode(String roomCode) { this.roomCode = roomCode; }
}
