package com.edusmart.repository;

import com.edusmart.entity.ChatMessage;
import com.edusmart.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByRoomOrderByTimestampAsc(Room room);
    void deleteByRoom(Room room);
}
