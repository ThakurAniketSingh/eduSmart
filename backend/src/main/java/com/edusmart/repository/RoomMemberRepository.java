package com.edusmart.repository;

import com.edusmart.entity.Room;
import com.edusmart.entity.RoomMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RoomMemberRepository extends JpaRepository<RoomMember, Long> {
    List<RoomMember> findByRoomOrderByJoinedAtAsc(Room room);
    List<RoomMember> findByRoomAndRole(Room room, RoomMember.MemberRole role);
    java.util.Optional<RoomMember> findByRoomAndDisplayName(Room room, String displayName);
    void deleteByRoom(Room room);
}
