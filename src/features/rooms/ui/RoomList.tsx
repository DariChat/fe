'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAutoRefresh } from '@/shared/lib/useAutoRefresh';
import { Avatar } from '@/shared/ui/Avatar';
import { PlusIcon, SearchIcon } from '@/shared/ui/icons';
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
  const [keyword, setKeyword] = useState('');

  /*
   * 초대·새 메시지는 서버가 /user/queue/rooms 로 밀어주므로(useServerEvents)
   * 여기서 주기적으로 물어보는 건 소켓이 끊겼던 구간을 메우는 안전망이다.
   *
   * 이 목록은 레이아웃에 매달려 있고 친구·프로필 화면에서는 숨겨지기만 한다.
   * 숨어 있는 동안에는 받아와도 볼 사람이 없으므로 채팅 영역에서만 갱신한다.
   */
  const isListVisible = pathname === '/rooms' || pathname.startsWith('/chat/');

  useAutoRefresh(
    useCallback(() => {
      fetchRooms({ force: true });
    }, [fetchRooms]),
    { enabled: isListVisible }
  );

  /** 방 이름과 마지막 메시지를 함께 훑는다 — 서버 검색이 아니라 화면에 있는 것만 거른다 */
  const visibleRooms = useMemo(() => {
    const trimmed = keyword.trim().toLowerCase();
    if (!trimmed) return rooms;

    return rooms.filter((room) =>
      `${room.roomName ?? ''} ${room.lastMessage ?? ''}`
        .toLowerCase()
        .includes(trimmed)
    );
  }, [rooms, keyword]);

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

  const newChatButton = (
    <button
      type="button"
      data-tour="new-chat"
      onClick={() => setIsCreating(true)}
      aria-label="새 채팅방 만들기"
      className="w-9 h-9 flex items-center justify-center rounded-xl bg-accent text-accent-fg hover:bg-accent-hover active:scale-95 transition"
    >
      <PlusIcon className="w-[18px] h-[18px]" />
    </button>
  );

  if (isLoading || !hasLoaded) {
    return (
      <div className="flex items-center justify-center flex-1">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-line-strong border-t-accent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-ink-muted">채팅 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center flex-1 p-6">
        <div className="text-center">
          <p className="text-sm text-danger mb-4">{error}</p>
          <button
            onClick={() => fetchRooms({ force: true })}
            className="px-4 py-2 text-sm font-medium bg-accent text-accent-fg rounded-xl hover:bg-accent-hover transition"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="px-4 pt-4 pb-3 shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[19px] font-semibold tracking-tight">채팅</h2>
          {newChatButton}
        </div>

        {rooms.length > 0 && (
          <div className="relative">
            <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" />
            <input
              type="search"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="대화 검색"
              aria-label="대화 검색"
              className="w-full h-9 pl-9 pr-3 text-sm bg-surface-2 rounded-xl placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-accent transition"
            />
          </div>
        )}
      </div>

      {rooms.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-[240px]">
            <p className="font-medium">아직 대화가 없어요</p>
            <p className="text-sm text-ink-muted mt-1 mb-4">
              친구를 초대해 첫 대화를 시작해 보세요.
            </p>
            <button
              onClick={() => setIsCreating(true)}
              className="px-4 py-2 text-sm font-semibold bg-accent text-accent-fg rounded-xl hover:bg-accent-hover transition"
            >
              새 대화 시작
            </button>
            <Link
              href="/discover"
              className="block mt-2 text-sm font-medium text-accent-ink hover:underline"
            >
              추천 친구 둘러보기
            </Link>
          </div>
        </div>
      ) : visibleRooms.length === 0 ? (
        <p className="flex-1 text-center text-sm text-ink-subtle pt-10 px-6">
          검색 결과가 없어요
        </p>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-2">
          {visibleRooms.map((room, index) => {
            const isActive = pathname === `/chat/${room.roomId}`;
            const name = room.roomName || '채팅방';
            const isGroup = room.memberCount > 2;

            return (
              <Link
                key={room.roomId}
                href={`/chat/${room.roomId}`}
                // 튜토리얼이 예시로 가리키는 항목 (맨 위 하나면 충분하다)
                data-tour={index === 0 ? 'room-item' : undefined}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${
                  isActive ? 'bg-accent-soft' : 'hover:bg-surface-2'
                }`}
              >
                <div className="relative shrink-0">
                  <Avatar nickname={name} />
                  {isGroup && (
                    <span className="absolute -bottom-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-surface border border-line text-[10px] font-semibold text-ink-muted">
                      {room.memberCount}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <h3
                      className={`font-medium truncate ${
                        isActive ? 'text-accent-ink' : ''
                      }`}
                    >
                      {name}
                    </h3>
                    <span className="ml-auto shrink-0 text-[11px] text-ink-subtle">
                      {formatLastMessageAt(room.lastMessageAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="flex-1 text-[13px] text-ink-muted truncate">
                      {room.lastMessage || `${room.memberCount}명 참여`}
                    </p>
                    {room.unreadCount > 0 && (
                      <span className="shrink-0 min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-accent text-accent-fg text-[11px] font-semibold">
                        {room.unreadCount > 99 ? '99+' : room.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {createRoomModal}
    </div>
  );
}
