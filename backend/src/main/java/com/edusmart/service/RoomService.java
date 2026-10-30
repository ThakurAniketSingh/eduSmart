package com.edusmart.service;

import com.edusmart.dto.CreateRoomRequest;
import com.edusmart.dto.JoinRoomRequest;
import com.edusmart.dto.ParticipantResponse;
import com.edusmart.dto.RoomResponse;
import com.edusmart.entity.Room;
import com.edusmart.entity.RoomFile;
import com.edusmart.entity.RoomMember;
import com.edusmart.exception.RoomInactiveException;
import com.edusmart.exception.RoomNotFoundException;
import com.edusmart.repository.RoomFileRepository;
import com.edusmart.repository.RoomMemberRepository;
import com.edusmart.repository.RoomRepository;
import com.edusmart.repository.ChatMessageRepository;
import com.edusmart.util.RoomCodeGenerator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.scheduling.annotation.Scheduled;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Handles classroom creation, joining and lifecycle (active/inactive).
 * Deliberately has no authentication: an admin is simply "whoever created the room",
 * a user is simply "whoever joined with the room code" - identified only by display name.
 */
@Service
public class RoomService {

    private static final Logger log = LoggerFactory.getLogger(RoomService.class);

    private final RoomRepository roomRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final RoomFileRepository roomFileRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final PresenceService presenceService;

    public RoomService(RoomRepository roomRepository,
                        RoomMemberRepository roomMemberRepository,
                        RoomFileRepository roomFileRepository,
                        ChatMessageRepository chatMessageRepository,
                        PresenceService presenceService) {
        this.roomRepository = roomRepository;
        this.roomMemberRepository = roomMemberRepository;
        this.roomFileRepository = roomFileRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.presenceService = presenceService;
    }

    @Transactional
    public RoomResponse createRoom(CreateRoomRequest request) {
        String roomCode = generateUniqueRoomCode();

        Room room = Room.builder()
                .roomCode(roomCode)
                .roomName(request.getRoomName().trim())
                .adminName(request.getAdminName().trim())
                .active(true)
                .build();
        room = roomRepository.save(room);

        // Track the admin as the first member.
        roomMemberRepository.save(RoomMember.builder()
                .room(room)
                .displayName(room.getAdminName())
                .role(RoomMember.MemberRole.ADMIN)
                .canDraw(true)
                .canCreateFile(true)
                .canEditFile(true)
                .canDeleteFile(true)
                .build());


        return toResponse(room);
    }

    @Transactional
    public RoomResponse joinRoom(JoinRoomRequest request) {
        Room room = getActiveRoomOrThrow(request.getRoomCode());

        roomMemberRepository.save(RoomMember.builder()
                .room(room)
                .displayName(request.getDisplayName().trim())
                .role(RoomMember.MemberRole.USER)
                .build());

        return toResponse(room);
    }

    @Transactional(readOnly = true)
    public RoomResponse getRoomByCode(String roomCode) {
        return toResponse(getActiveRoomOrThrow(roomCode));
    }

    @Transactional(readOnly = true)
    public Room findEntityByCode(String roomCode) {
        return roomRepository.findByRoomCode(normalize(roomCode))
                .orElseThrow(() -> new RoomNotFoundException("Room not found: " + roomCode));
    }

    public java.util.Optional<Room> findEntityByCodeOptional(String roomCode) {
        return roomRepository.findByRoomCode(normalize(roomCode));
    }

    @Transactional(readOnly = true)
    public List<ParticipantResponse> getParticipants(String roomCode) {
        Room room = getActiveRoomOrThrow(roomCode);
        
        // Get all members who ever joined the room
        List<RoomMember> members = roomMemberRepository.findByRoomOrderByJoinedAtAsc(room);
        
        // Get currently online sessions
        java.util.Set<String> onlineNames = presenceService.getParticipantValues(normalize(roomCode))
                .stream()
                .map(PresenceService.Participant::displayName)
                .collect(java.util.stream.Collectors.toSet());
                
        return members.stream().map(member -> ParticipantResponse.builder()
                .displayName(member.getDisplayName())
                .role(member.getRole().name())
                .online(onlineNames.contains(member.getDisplayName()))
                .canDraw(member.isCanDraw())
                .canCreateFile(member.isCanCreateFile())
                .canEditFile(member.isCanEditFile())
                .canDeleteFile(member.isCanDeleteFile())
                .build()).collect(java.util.stream.Collectors.toList());
    }

    @Transactional
    public void updatePermissions(String roomCode, String displayName, com.edusmart.dto.UpdatePermissionsRequest request) {
        Room room = getActiveRoomOrThrow(roomCode);
        RoomMember member = roomMemberRepository.findByRoomAndDisplayName(room, displayName)
                .orElseThrow(() -> new IllegalArgumentException("Member not found"));
                
        if (request.isCanDraw() != null) member.setCanDraw(request.isCanDraw());
        if (request.isCanCreateFile() != null) member.setCanCreateFile(request.isCanCreateFile());
        if (request.isCanEditFile() != null) member.setCanEditFile(request.isCanEditFile());
        if (request.isCanDeleteFile() != null) member.setCanDeleteFile(request.isCanDeleteFile());
        
        roomMemberRepository.save(member);
    }

    @Transactional
    public void updateGlobalPermissions(String roomCode, com.edusmart.dto.UpdatePermissionsRequest request) {
        Room room = getActiveRoomOrThrow(roomCode);
        List<RoomMember> users = roomMemberRepository.findByRoomAndRole(room, RoomMember.MemberRole.USER);
        
        for (RoomMember user : users) {
            if (request.isCanDraw() != null) user.setCanDraw(request.isCanDraw());
            if (request.isCanCreateFile() != null) user.setCanCreateFile(request.isCanCreateFile());
            if (request.isCanEditFile() != null) user.setCanEditFile(request.isCanEditFile());
            if (request.isCanDeleteFile() != null) user.setCanDeleteFile(request.isCanDeleteFile());
        }
        
        roomMemberRepository.saveAll(users);
    }

    @Transactional
    public void closeRoom(String roomCode) {
        Room room = getActiveRoomOrThrow(roomCode);
        room.setActive(false);
        roomRepository.save(room);
    }

    @Transactional
    public void markRoomAsEmpty(String roomCode) {
        roomRepository.findByRoomCode(normalize(roomCode)).ifPresent(room -> {
            room.setLastEmptyAt(LocalDateTime.now());
            roomRepository.save(room);
            log.info("Room {} marked as empty. Will be deleted if inactive for 1 hour.", roomCode);
        });
    }

    @Transactional
    public void markRoomAsActive(String roomCode) {
        roomRepository.findByRoomCode(normalize(roomCode)).ifPresent(room -> {
            if (room.getLastEmptyAt() != null) {
                room.setLastEmptyAt(null);
                roomRepository.save(room);
                log.info("Room {} became active again. Deletion cancelled.", roomCode);
            }
        });
    }

    @Scheduled(fixedRateString = "600000") // Run every 10 minutes
    @Transactional
    public void cleanupStaleRooms() {
        LocalDateTime thirtyMinutesAgo = LocalDateTime.now().minusMinutes(30);
        List<Room> staleRooms = roomRepository.findByLastEmptyAtBefore(thirtyMinutesAgo);
        
        if (!staleRooms.isEmpty()) {
            log.info("Found {} stale rooms to delete...", staleRooms.size());
            for (Room room : staleRooms) {
                roomFileRepository.deleteByRoom(room);
                roomMemberRepository.deleteByRoom(room);
                chatMessageRepository.deleteByRoom(room);
                roomRepository.delete(room);
                log.info("Deleted stale room: {}", room.getRoomCode());
            }
        }
    }

    @Transactional
    public void deleteRoom(String roomCode) {
        Room room = roomRepository.findByRoomCode(normalize(roomCode))
                .orElseThrow(() -> new RoomNotFoundException("Room not found: " + roomCode));
        
        roomFileRepository.deleteByRoom(room);
        roomMemberRepository.deleteByRoom(room);
        chatMessageRepository.deleteByRoom(room);
        roomRepository.delete(room);
        log.info("Admin completely deleted room: {}", room.getRoomCode());
    }

    // ---------------------------------------------------------------------

    private Room getActiveRoomOrThrow(String roomCode) {
        Room room = roomRepository.findByRoomCode(normalize(roomCode))
                .orElseThrow(() -> new RoomNotFoundException("No classroom found for room code: " + roomCode));
        if (!room.isActive()) {
            throw new RoomInactiveException("This classroom has been closed by the admin.");
        }
        return room;
    }

    private String generateUniqueRoomCode() {
        String code;
        int attempts = 0;
        do {
            code = RoomCodeGenerator.generate();
            attempts++;
        } while (roomRepository.existsByRoomCode(code) && attempts < 20);
        return code;
    }

    private String normalize(String roomCode) {
        return roomCode == null ? null : roomCode.trim().toUpperCase();
    }

    private RoomResponse toResponse(Room room) {
        return RoomResponse.builder()
                .id(room.getId())
                .roomCode(room.getRoomCode())
                .roomName(room.getRoomName())
                .adminName(room.getAdminName())
                .active(room.isActive())
                .createdAt(room.getCreatedAt())
                .build();
    }
}
