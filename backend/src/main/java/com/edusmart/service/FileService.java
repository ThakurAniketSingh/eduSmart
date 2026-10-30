package com.edusmart.service;

import com.edusmart.dto.FileRequest;
import com.edusmart.dto.FileResponse;
import com.edusmart.entity.Room;
import com.edusmart.entity.RoomFile;
import com.edusmart.exception.DuplicateFileNameException;
import com.edusmart.exception.FileNotFoundInRoomException;
import com.edusmart.repository.RoomFileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Manages the Java files that live inside a room: create, list, rename/update, delete.
 */
@Service
public class FileService {

    private final RoomFileRepository roomFileRepository;

    public FileService(RoomFileRepository roomFileRepository) {
        this.roomFileRepository = roomFileRepository;
    }

    @Transactional(readOnly = true)
    public List<FileResponse> listFiles(Room room) {
        return roomFileRepository.findByRoomOrderByCreatedAtAsc(room).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public FileResponse createFile(Room room, FileRequest request) {
        String fileName = normalizeFileName(request.getFileName());

        if (roomFileRepository.existsByRoomAndFileName(room, fileName)) {
            throw new DuplicateFileNameException("A file named \"" + fileName + "\" already exists in this room.");
        }

        RoomFile file = RoomFile.builder()
                .room(room)
                .fileName(fileName)
                .content(request.getContent() == null ? "" : request.getContent())
                .build();

        return toResponse(roomFileRepository.save(file));
    }

    @Transactional
    public FileResponse updateFile(Long fileId, FileRequest request) {
        RoomFile file = getFileOrThrow(fileId);

        if (request.getFileName() != null && !request.getFileName().isBlank()) {
            String newName = normalizeFileName(request.getFileName());
            if (!newName.equals(file.getFileName())
                    && roomFileRepository.existsByRoomAndFileName(file.getRoom(), newName)) {
                throw new DuplicateFileNameException("A file named \"" + newName + "\" already exists in this room.");
            }
            file.setFileName(newName);
        }

        if (request.getContent() != null) {
            file.setContent(request.getContent());
        }

        RoomFile saved = roomFileRepository.save(file);

        return toResponse(saved);
    }

    @Transactional
    public void deleteFile(Long fileId) {
        RoomFile file = getFileOrThrow(fileId);
        roomFileRepository.delete(file);
    }

    @Transactional(readOnly = true)
    public RoomFile getFileOrThrow(Long fileId) {
        return roomFileRepository.findById(fileId)
                .orElseThrow(() -> new FileNotFoundInRoomException("File not found: " + fileId));
    }

    // ---------------------------------------------------------------------

    private String normalizeFileName(String fileName) {
        String trimmed = fileName.trim();
        return trimmed;
    }

    private FileResponse toResponse(RoomFile file) {
        return FileResponse.builder()
                .id(file.getId())
                .fileName(file.getFileName())
                .content(file.getContent())
                .createdAt(file.getCreatedAt())
                .updatedAt(file.getUpdatedAt())
                .build();
    }
}
