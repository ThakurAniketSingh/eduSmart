package com.edusmart.dto;

public class ParticipantResponse {
    private String displayName;
    private String role;
    private boolean online;
    private boolean canDraw;
    private boolean canCreateFile;
    private boolean canEditFile;
    private boolean canDeleteFile;

    public ParticipantResponse() {
    }

    public ParticipantResponse(String displayName, String role, boolean online, boolean canDraw, boolean canCreateFile, boolean canEditFile, boolean canDeleteFile) {
        this.displayName = displayName;
        this.role = role;
        this.online = online;
        this.canDraw = canDraw;
        this.canCreateFile = canCreateFile;
        this.canEditFile = canEditFile;
        this.canDeleteFile = canDeleteFile;
    }

    // --- Getters ---

    public String getDisplayName() { return displayName; }
    public String getRole() { return role; }
    public boolean isOnline() { return online; }
    public boolean isCanDraw() { return canDraw; }
    public boolean isCanCreateFile() { return canCreateFile; }
    public boolean isCanEditFile() { return canEditFile; }
    public boolean isCanDeleteFile() { return canDeleteFile; }

    // --- Builder ---

    public static ParticipantResponseBuilder builder() { return new ParticipantResponseBuilder(); }

    public static class ParticipantResponseBuilder {
        private String displayName;
        private String role;
        private boolean online;
        private boolean canDraw;
        private boolean canCreateFile;
        private boolean canEditFile;
        private boolean canDeleteFile;

        public ParticipantResponseBuilder displayName(String displayName) { this.displayName = displayName; return this; }
        public ParticipantResponseBuilder role(String role) { this.role = role; return this; }
        public ParticipantResponseBuilder online(boolean online) { this.online = online; return this; }
        public ParticipantResponseBuilder canDraw(boolean canDraw) { this.canDraw = canDraw; return this; }
        public ParticipantResponseBuilder canCreateFile(boolean canCreateFile) { this.canCreateFile = canCreateFile; return this; }
        public ParticipantResponseBuilder canEditFile(boolean canEditFile) { this.canEditFile = canEditFile; return this; }
        public ParticipantResponseBuilder canDeleteFile(boolean canDeleteFile) { this.canDeleteFile = canDeleteFile; return this; }

        public ParticipantResponse build() {
            return new ParticipantResponse(displayName, role, online, canDraw, canCreateFile, canEditFile, canDeleteFile);
        }
    }
}
