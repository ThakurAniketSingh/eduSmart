package com.edusmart.service;

import com.edusmart.dto.CreateRoomRequest;
import com.edusmart.dto.FileResponse;
import com.edusmart.dto.JoinRoomRequest;
import com.edusmart.dto.RoomResponse;
import com.edusmart.entity.Room;
import com.edusmart.exception.RoomNotFoundException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class RoomServiceTest {

    @Autowired
    private RoomService roomService;

    @Autowired
    private FileService fileService;

    @Test
    void createRoom_generatesRoomCode() {
        CreateRoomRequest request = new CreateRoomRequest();
        request.setAdminName("Prof. Smith");
        request.setRoomName("Data Structures 101");

        RoomResponse created = roomService.createRoom(request);

        assertNotNull(created.getRoomCode());
        assertEquals(6, created.getRoomCode().length());
        assertTrue(created.isActive());

        assertEquals("Prof. Smith", created.getAdminName());
    }

    @Test
    void joinRoom_withValidCode_succeeds() {
        CreateRoomRequest createRequest = new CreateRoomRequest();
        createRequest.setAdminName("Dr. Brown");
        createRequest.setRoomName("Algorithms");
        RoomResponse room = roomService.createRoom(createRequest);

        JoinRoomRequest joinRequest = new JoinRoomRequest();
        joinRequest.setDisplayName("Student One");
        joinRequest.setRoomCode(room.getRoomCode());

        RoomResponse joined = roomService.joinRoom(joinRequest);

        assertEquals(room.getRoomCode(), joined.getRoomCode());
    }

    @Test
    void joinRoom_withInvalidCode_throwsNotFound() {
        JoinRoomRequest joinRequest = new JoinRoomRequest();
        joinRequest.setDisplayName("Student One");
        joinRequest.setRoomCode("ZZZZZZ");

        assertThrows(RoomNotFoundException.class, () -> roomService.joinRoom(joinRequest));
    }
}
