package com.edusmart.repository;

import com.edusmart.entity.Room;
import com.edusmart.entity.RoomFile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RoomFileRepository extends JpaRepository<RoomFile, Long> {
    List<RoomFile> findByRoomOrderByCreatedAtAsc(Room room);
    Optional<RoomFile> findByRoomAndFileName(Room room, String fileName);
    boolean existsByRoomAndFileName(Room room, String fileName);
    void deleteByRoom(Room room);
}
