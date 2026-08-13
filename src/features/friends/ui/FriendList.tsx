'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FriendResponse, RoomType } from '@/shared/types/api.types';
import { useRoomsStore } from '@/features/rooms/model/roomsStore';
import { toErrorMessage } from '@/shared/api/client';
import { FriendAvatar } from './FriendAvatar';

interface FriendListProps {
  friends: FriendResponse[];
  onError: (message: string) => void;
}

export function FriendList({ friends, onError }: FriendListProps) {
  const router = useRouter();
  const rooms = useRoomsStore((state) => state.rooms);
  const fetchRooms = useRoomsStore((state) => state.fetchRooms);
  const createRoom = useRoomsStore((state) => state.createRoom);

  const [openingUserId, setOpeningUserId] = useState<number | null>(null);

  /**
   * 서버는 DIRECT 방을 중복 검사 없이 매번 새로 만들고, 이름은 상대 닉네임으로 붙인다.
   * 누를 때마다 같은 상대와의 방이 늘어나지 않도록
   * 2명짜리 + 같은 이름의 방이 이미 있으면 그 방으로 들어간다.
   */
  const findDirectRoom = (friend: FriendResponse) =>
    rooms.find(
      (room) => room.memberCount === 2 && room.roomName === friend.nickname
    );

  const handleOpenChat = async (friend: FriendResponse) => {
    setOpeningUserId(friend.userId);

    try {
      // 목록을 아직 안 받아왔다면(친구 탭으로 바로 들어온 경우) 먼저 채운다
      await fetchRooms();

      const existing = findDirectRoom(friend);
      if (existing) {
        router.push(`/chat/${existing.roomId}`);
        return;
      }

      const room = await createRoom({
        roomType: RoomType.DIRECT,
        memberIds: [friend.userId],
      });
      router.push(`/chat/${room.roomId}`);
    } catch (err) {
      onError(toErrorMessage(err, '채팅방을 열지 못했습니다'));
      setOpeningUserId(null);
    }
  };

  if (friends.length === 0) {
    return (
      <p className="text-center text-gray-500 py-12">
        아직 친구가 없어요. 검색 탭에서 친구를 찾아보세요!
      </p>
    );
  }

  return (
    <ul className="space-y-1">
      {friends.map((friend) => (
        <li
          key={friend.userId}
          className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition"
        >
          <FriendAvatar nickname={friend.nickname} />
          <span className="flex-1 min-w-0 font-semibold text-gray-800 truncate">
            {friend.nickname}
          </span>
          <button
            type="button"
            onClick={() => handleOpenChat(friend)}
            disabled={openingUserId === friend.userId}
            className="px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-cyan-600 rounded-lg hover:shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-50"
          >
            {openingUserId === friend.userId ? '여는 중...' : '채팅'}
          </button>
        </li>
      ))}
    </ul>
  );
}
