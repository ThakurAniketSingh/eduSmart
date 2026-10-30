package com.edusmart.dto;

import jakarta.validation.constraints.NotBlank;

public class CreateRoomRequest {

    @NotBlank(message = "Admin name is required")
    private String adminName;

    @NotBlank(message = "Classroom name is required")
    private String roomName;

    // --- Getters ---

    public String getAdminName() { return adminName; }
    public String getRoomName() { return roomName; }

    // --- Setters ---

    public void setAdminName(String adminName) { this.adminName = adminName; }
    public void setRoomName(String roomName) { this.roomName = roomName; }
}
