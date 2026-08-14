'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FriendResponse, RoomType } from '@/shared/types/api.types';
import { useRoomsStore } from '@/features/rooms/model/roomsStore';
import { toErrorMessage } from '@/shared/api/client';
import { ChatIcon, TrashIcon } from '@/shared/ui/icons';
import { useFriendsStore } from '../model/friendsStore';
import { FriendAvatar } from './FriendAvatar';

interface FriendListProps {
  friends: FriendResponse[];
  onError: (message: string) => void;
}

export function FriendList({ friends, onError }: FriendListProps) {
  const router = useRouter();
  const fetchRooms = useRoomsStore((state) => state.fetchRooms);
  const createRoom = useRoomsStore((state) => state.createRoom);
  const removeFriend = useFriendsStore((state) => state.removeFriend);

  const [openingUserId, setOpeningUserId] = useState<number | null>(null);
  /** 삭제는 되돌릴 수 없어 한 번 더 물어본다 — 그 확인을 기다리는 상대 */
  const [confirmingUserId, setConfirmingUserId] = useState<number | null>(null);
  const [removingUserId, setRemovingUserId] = useState<number | null>(null);

  /**
   * 같은 상대와의 DIRECT 방은 서버가 중복해서 만들지 않고 기존 방을 돌려준다
   * (RoomResponse.alreadyExists / 응답 코드 200). 그래서 프론트가 미리 찾아볼 필요가 없다.
   */
  const handleOpenChat = async (friend: FriendResponse) => {
    setOpeningUserId(friend.userId);

    try {
      // 목록을 아직 안 받아왔다면(친구 탭으로 바로 들어온 경우) 먼저 채운다
      await fetchRooms();

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

  const handleRemove = async (friend: FriendResponse) => {
    setRemovingUserId(friend.userId);

    try {
      await removeFriend(friend.userId);
      setConfirmingUserId(null);
    } catch (err) {
      onError(toErrorMessage(err, '친구를 삭제하지 못했습니다'));
    } finally {
      setRemovingUserId(null);
    }
  };

  if (friends.length === 0) {
    return (
      <div className="text-center py-14 px-6">
        <p className="font-medium">아직 친구가 없어요</p>
        <p className="text-sm text-ink-muted mt-1">
          &lsquo;친구 찾기&rsquo; 탭에서 닉네임으로 검색해 보세요.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-0.5">
      {friends.map((friend) => {
        const isConfirming = confirmingUserId === friend.userId;
        const isRemoving = removingUserId === friend.userId;

        return (
          <li
            key={friend.userId}
            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-2 transition"
          >
            <FriendAvatar nickname={friend.nickname} size="sm" />
            <span className="flex-1 min-w-0 font-medium truncate">
              {friend.nickname}
            </span>

            {isConfirming ? (
              /* 삭제하면 대화 목록과 달리 되돌릴 방법이 없어 한 번 더 확인받는다 */
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="hidden sm:inline text-xs text-ink-muted">
                  친구를 삭제할까요?
                </span>
                <button
                  type="button"
                  onClick={() => handleRemove(friend)}
                  disabled={isRemoving}
                  className="px-3 py-1.5 text-sm font-medium text-danger bg-danger-soft border border-danger-line rounded-lg hover:opacity-90 transition disabled:opacity-50"
                >
                  {isRemoving ? '삭제 중...' : '삭제'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingUserId(null)}
                  disabled={isRemoving}
                  className="px-3 py-1.5 text-sm font-medium text-ink-muted rounded-lg hover:bg-surface-3 transition disabled:opacity-50"
                >
                  취소
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleOpenChat(friend)}
                  disabled={openingUserId === friend.userId}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-accent-ink bg-accent-soft rounded-lg hover:opacity-90 transition disabled:opacity-50"
                >
                  <ChatIcon className="w-4 h-4" />
                  {openingUserId === friend.userId ? '여는 중...' : '채팅'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingUserId(friend.userId)}
                  aria-label={`${friend.nickname} 친구 삭제`}
                  title="친구 삭제"
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-subtle hover:bg-danger-soft hover:text-danger transition"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
