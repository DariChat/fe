'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAutoRefresh } from '@/shared/lib/useAutoRefresh';
import { useRoomsStore } from '../model/roomsStore';
import { CreateRoomModal } from './CreateRoomModal';

const formatLastMessageAt = (timestamp: string | null) => {
  if (!timestamp) return '';

  const date = new Date(timestamp);
  const isToday = date.toDateString() === new Date().toDateString();

  return isToday
    ? date.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    : date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
};

export function RoomList() {
  const pathname = usePathname();
  const router = useRouter();

  const rooms = useRoomsStore((state) => state.rooms);
  const isLoading = useRoomsStore((state) => state.isLoading);
  const hasLoaded = useRoomsStore((state) => state.hasLoaded);
  const error = useRoomsStore((state) => state.error);
  const fetchRooms = useRoomsStore((state) => state.fetchRooms);

  const [isCreating, setIsCreating] = useState(false);

  /*
   * 남이 나를 새 방에 초대해도, 다른 방에 메시지가 쌓여도 알림이 오지 않는다.
   * (WebSocket 은 지금 보고 있는 방의 메시지만 밀어준다)
   *
   * 이 목록은 레이아웃에 항상 매달려 있고 친구·프로필 화면에서는 숨겨지기만 한다.
   * 숨어 있는 동안에는 받아와도 볼 사람이 없으므로 채팅 영역에서만 갱신한다.
   */
  const isListVisible =
    pathname === '/rooms' || pathname.startsWith('/chat/');

  useAutoRefresh(
    useCallback(() => {
      fetchRooms({ force: true });
    }, [fetchRooms]),
    { enabled: isListVisible }
  );

  const handleCreated = (roomId: number) => {
    setIsCreating(false);
    router.push(`/chat/${roomId}`);
  };

  const createRoomModal = isCreating && (
    <CreateRoomModal
      onClose={() => setIsCreating(false)}
      onCreated={handleCreated}
    />
  );

  if (isLoading || !hasLoaded) {
    return (
      <div className="flex items-center justify-center flex-1">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">채팅 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center flex-1 p-6">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => fetchRooms({ force: true })}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="flex items-center justify-center flex-1 p-6">
        <div className="text-center">
          <p className="text-gray-600 mb-4">아직 채팅방이 없어요</p>
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white rounded-lg hover:shadow-lg hover:shadow-indigo-500/30 transition-all"
          >
            + 채팅 시작하기
          </button>
        </div>
        {createRoomModal}
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
        <h2 className="text-lg font-bold text-gray-800">내 채팅</h2>
        <button
          onClick={() => setIsCreating(true)}
          aria-label="새 채팅방 만들기"
          className="w-8 h-8 flex items-center justify-center rounded-full bg-indigo-600 text-white text-lg leading-none hover:bg-indigo-700 active:bg-indigo-800 transition"
        >
          +
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-2">
        {rooms.map((room) => {
          const isActive = pathname === `/chat/${room.roomId}`;

          return (
            <Link
              key={room.roomId}
              href={`/chat/${room.roomId}`}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center gap-3 p-3 rounded-xl transition-colors group ${
                isActive ? 'bg-indigo-50' : 'hover:bg-gray-50 active:bg-gray-100'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 flex items-center justify-center text-white font-semibold shrink-0">
                {/* 목록 응답에는 roomType 이 없어서 인원 수로 1:1 을 구분한다 */}
                {room.memberCount === 2 ? '1:1' : 'G'}
              </div>

              <div className="flex-1 min-w-0">
                <h3
                  className={`font-semibold truncate transition ${
                    isActive
                      ? 'text-indigo-600'
                      : 'text-gray-800 group-hover:text-indigo-600'
                  }`}
                >
                  {room.roomName || '채팅방'}
                </h3>
                <p className="text-sm text-gray-500 truncate">
                  {room.lastMessage || `${room.memberCount}명 참여`}
                </p>
              </div>

              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-xs text-gray-400">
                  {formatLastMessageAt(room.lastMessageAt)}
                </span>
                {room.unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-indigo-600 text-white text-xs font-semibold rounded-full">
                    {room.unreadCount > 99 ? '99+' : room.unreadCount}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {createRoomModal}
    </div>
  );
}
