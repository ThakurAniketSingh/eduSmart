package com.edusmart.service;

import com.edusmart.dto.ChatMessageResponse;
import com.edusmart.entity.ChatMessage;
import com.edusmart.entity.Room;
import com.edusmart.repository.ChatMessageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Persists chat messages so a user who joins late (or reconnects) can still
 * see what was discussed before they arrived.
 */
@Service
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;

    public ChatService(ChatMessageRepository chatMessageRepository) {
        this.chatMessageRepository = chatMessageRepository;
    }

    @Transactional
    public ChatMessage saveMessage(Room room, String sender, String message) {
        ChatMessage chatMessage = ChatMessage.builder()
                .room(room)
                .sender(sender)
                .message(message)
                .build();
        return chatMessageRepository.save(chatMessage);
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getHistory(Room room) {
        return chatMessageRepository.findByRoomOrderByTimestampAsc(room).stream()
                .map(m -> ChatMessageResponse.builder()
                        .id(m.getId())
                        .sender(m.getSender())
                        .message(m.getMessage())
                        .timestamp(m.getTimestamp())
                        .isDeleted(m.isDeleted())
                        .deletedByRole(m.getDeletedByRole())
                        .build())
                .toList();
    }

    @Transactional(readOnly = true)
    public ChatMessage findById(Long id) {
        return chatMessageRepository.findById(id).orElse(null);
    }

    @Transactional
    public void deleteMessage(Long id, String role) {
        chatMessageRepository.findById(id).ifPresent(msg -> {
            msg.setDeleted(true);
            msg.setDeletedByRole(role);
            chatMessageRepository.save(msg);
        });
    }
}
