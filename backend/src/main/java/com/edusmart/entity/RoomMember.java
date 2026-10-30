package com.edusmart.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * Records that a display-named user has joined a room, and with which role.
 * Live "who is online right now" presence is tracked separately in memory
 * (see PresenceService) because it changes far too often to persist on every event.
 */
@Entity
@Table(name = "room_members")
public class RoomMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @Column(name = "display_name", nullable = false)
    private String displayName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MemberRole role;

    @Column(name = "joined_at", nullable = false)
    private LocalDateTime joinedAt;

    @Column(name = "can_draw", nullable = false)
    private boolean canDraw = false;

    @Column(name = "can_create_file", nullable = false)
    private boolean canCreateFile = false;

    @Column(name = "can_edit_file", nullable = false)
    private boolean canEditFile = false;

    @Column(name = "can_delete_file", nullable = false)
    private boolean canDeleteFile = false;

    public enum MemberRole {
        ADMIN,
        USER
    }

    public RoomMember() {
    }

    public RoomMember(Long id, Room room, String displayName, MemberRole role, LocalDateTime joinedAt, boolean canDraw, boolean canCreateFile, boolean canEditFile, boolean canDeleteFile) {
        this.id = id;
        this.room = room;
        this.displayName = displayName;
        this.role = role;
        this.joinedAt = joinedAt;
        this.canDraw = canDraw;
        this.canCreateFile = canCreateFile;
        this.canEditFile = canEditFile;
        this.canDeleteFile = canDeleteFile;
    }

    // --- Getters ---

    public Long getId() { return id; }
    public Room getRoom() { return room; }
    public String getDisplayName() { return displayName; }
    public MemberRole getRole() { return role; }
    public LocalDateTime getJoinedAt() { return joinedAt; }
    public boolean isCanDraw() { return canDraw; }
    public boolean isCanCreateFile() { return canCreateFile; }
    public boolean isCanEditFile() { return canEditFile; }
    public boolean isCanDeleteFile() { return canDeleteFile; }

    // --- Setters ---

    public void setId(Long id) { this.id = id; }
    public void setRoom(Room room) { this.room = room; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }
    public void setRole(MemberRole role) { this.role = role; }
    public void setJoinedAt(LocalDateTime joinedAt) { this.joinedAt = joinedAt; }
    public void setCanDraw(boolean canDraw) { this.canDraw = canDraw; }
    public void setCanCreateFile(boolean canCreateFile) { this.canCreateFile = canCreateFile; }
    public void setCanEditFile(boolean canEditFile) { this.canEditFile = canEditFile; }
    public void setCanDeleteFile(boolean canDeleteFile) { this.canDeleteFile = canDeleteFile; }

    // --- Builder ---

    public static RoomMemberBuilder builder() { return new RoomMemberBuilder(); }

    public static class RoomMemberBuilder {
        private Long id;
        private Room room;
        private String displayName;
        private MemberRole role;
        private LocalDateTime joinedAt;
        private boolean canDraw = false;
        private boolean canCreateFile = false;
        private boolean canEditFile = false;
        private boolean canDeleteFile = false;

        public RoomMemberBuilder id(Long id) { this.id = id; return this; }
        public RoomMemberBuilder room(Room room) { this.room = room; return this; }
        public RoomMemberBuilder displayName(String displayName) { this.displayName = displayName; return this; }
        public RoomMemberBuilder role(MemberRole role) { this.role = role; return this; }
        public RoomMemberBuilder joinedAt(LocalDateTime joinedAt) { this.joinedAt = joinedAt; return this; }
        public RoomMemberBuilder canDraw(boolean canDraw) { this.canDraw = canDraw; return this; }
        public RoomMemberBuilder canCreateFile(boolean canCreateFile) { this.canCreateFile = canCreateFile; return this; }
        public RoomMemberBuilder canEditFile(boolean canEditFile) { this.canEditFile = canEditFile; return this; }
        public RoomMemberBuilder canDeleteFile(boolean canDeleteFile) { this.canDeleteFile = canDeleteFile; return this; }

        public RoomMember build() {
            return new RoomMember(id, room, displayName, role, joinedAt, canDraw, canCreateFile, canEditFile, canDeleteFile);
        }
    }

    @PrePersist
    protected void onCreate() {
        this.joinedAt = LocalDateTime.now();
    }
}
