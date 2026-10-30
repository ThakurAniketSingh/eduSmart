package com.edusmart.controller;

import com.edusmart.dto.FileRequest;
import com.edusmart.dto.FileResponse;
import com.edusmart.entity.Room;
import com.edusmart.service.FileService;
import com.edusmart.service.RoomService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class RoomFileController {

    private final FileService fileService;
    private final RoomService roomService;

    public RoomFileController(FileService fileService, RoomService roomService) {
        this.fileService = fileService;
        this.roomService = roomService;
    }

    @GetMapping("/rooms/{roomCode}/files")
    public ResponseEntity<List<FileResponse>> listFiles(@PathVariable String roomCode) {
        Room room = roomService.findEntityByCode(roomCode);
        return ResponseEntity.ok(fileService.listFiles(room));
    }

    @PostMapping("/rooms/{roomCode}/files")
    public ResponseEntity<FileResponse> createFile(@PathVariable String roomCode, @RequestBody FileRequest request) {
        Room room = roomService.findEntityByCode(roomCode);
        return ResponseEntity.ok(fileService.createFile(room, request));
    }

    @PutMapping("/files/{fileId}")
    public ResponseEntity<FileResponse> updateFile(@PathVariable Long fileId, @RequestBody FileRequest request) {
        return ResponseEntity.ok(fileService.updateFile(fileId, request));
    }

    @DeleteMapping("/files/{fileId}")
    public ResponseEntity<Void> deleteFile(@PathVariable Long fileId) {
        fileService.deleteFile(fileId);
        return ResponseEntity.noContent().build();
    }
}
