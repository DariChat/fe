'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { RoomType } from '@/shared/types/api.types';
import { toErrorMessage } from '@/shared/api/client';
import { useFriendsStore } from '@/features/friends/model/friendsStore';
import { FriendAvatar } from '@/features/friends/ui/FriendAvatar';
import { useRoomsStore } from '../model/roomsStore';

interface CreateRoomModalProps {
  onClose: () => void;
  onCreated: (roomId: number) => void;
}

/**
 * 참여자는 친구 목록(GET /api/friends)에서 고른다.
 *
 * 예전에는 사용자 검색 API 가 없어서 유저 id 를 직접 입력받았다.
 * 친구 목록 API 가 생겨 그 입력을 걷어냈다 — 이제 id 를 알 필요가 없다.
 *
 * 1:1 은 방 이름을 받지 않는다. 서버가 DIRECT 방 이름을 항상 상대 닉네임으로
 * 내려주기 때문에 여기서 받아봐야 화면에 보이지 않는다.
 */
export function CreateRoomModal({ onClose, onCreated }: CreateRoomModalProps) {
  const createRoom = useRoomsStore((state) => state.createRoom);

  const friends = useFriendsStore((state) => state.friends);
  const hasLoadedFriends = useFriendsStore((state) => state.hasLoaded);
  const isLoadingFriends = useFriendsStore((state) => state.isLoading);
  const friendsError = useFriendsStore((state) => state.error);
  const fetchFriends = useFriendsStore((state) => state.fetchAll);

  const [roomType, setRoomType] = useState<RoomType>(RoomType.DIRECT);
  const [roomName, setRoomName] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [keyword, setKeyword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isDirect = roomType === RoomType.DIRECT;

  // 채팅 영역에서 바로 열렸다면 친구 목록을 아직 안 받아왔을 수 있다
  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  const visibleFriends = useMemo(() => {
    const trimmed = keyword.trim().toLowerCase();
    if (!trimmed) return friends;
    return friends.filter((friend) =>
      friend.nickname.toLowerCase().includes(trimmed)
    );
  }, [friends, keyword]);

  const toggleFriend = (userId: number) => {
    setError('');

    // 1:1 은 상대가 한 명뿐이라 고를 때마다 갈아끼운다
    if (isDirect) {
      setSelectedIds((prev) => (prev[0] === userId ? [] : [userId]));
      return;
    }

    setSelectedIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  /** 그룹에서 여럿 고른 뒤 1:1 로 돌아오면 서버가 첫 명만 쓰므로 선택도 맞춰 줄인다 */
  const changeRoomType = (type: RoomType) => {
    setRoomType(type);
    setError('');
    if (type === RoomType.DIRECT) {
      setSelectedIds((prev) => prev.slice(0, 1));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (selectedIds.length === 0) {
      setError(
        isDirect ? '대화할 친구를 선택하세요' : '초대할 친구를 선택하세요'
      );
      return;
    }
    if (!isDirect && !roomName.trim()) {
      setError('그룹 채팅은 방 이름이 필요해요');
      return;
    }

    setIsLoading(true);

    try {
      const room = await createRoom({
        // DIRECT 는 서버가 상대 닉네임으로 채운다 (빈 문자열을 보내면 그대로 저장된다)
        ...(isDirect ? {} : { roomName: roomName.trim() }),
        roomType,
        memberIds: selectedIds,
      });
      // 이미 있는 1:1 방이면 서버가 기존 방을 그대로 돌려준다 (alreadyExists)
      onCreated(room.roomId);
    } catch (err) {
      setError(toErrorMessage(err, '채팅방을 만들지 못했습니다'));
    } finally {
      setIsLoading(false);
    }
  };

  const friendPicker = () => {
    if (isLoadingFriends || (!hasLoadedFriends && !friendsError)) {
      return (
        <p className="text-center text-sm text-gray-500 py-8">
          친구 목록을 불러오는 중...
        </p>
      );
    }

    if (friendsError) {
      return (
        <div className="text-center py-8">
          <p className="text-sm text-red-600 mb-3">{friendsError}</p>
          <button
            type="button"
            onClick={() => fetchFriends({ force: true })}
            className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            다시 시도
          </button>
        </div>
      );
    }

    if (friends.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-sm text-gray-600 mb-3">아직 친구가 없어요</p>
          <Link
            href="/friends"
            onClick={onClose}
            className="inline-block px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            친구 찾으러 가기
          </Link>
        </div>
      );
    }

    if (visibleFriends.length === 0) {
      return (
        <p className="text-center text-sm text-gray-500 py-8">
          검색 결과가 없어요
        </p>
      );
    }

    return (
      <ul className="max-h-56 overflow-y-auto -mx-1 px-1">
        {visibleFriends.map((friend) => {
          const isSelected = selectedIds.includes(friend.userId);

          return (
            <li key={friend.userId}>
              <button
                type="button"
                onClick={() => toggleFriend(friend.userId)}
                aria-pressed={isSelected}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition ${
                  isSelected ? 'bg-indigo-50' : 'hover:bg-gray-50'
                }`}
              >
                <FriendAvatar nickname={friend.nickname} size="sm" />
                <span
                  className={`flex-1 min-w-0 font-medium truncate ${
                    isSelected ? 'text-indigo-600' : 'text-gray-800'
                  }`}
                >
                  {friend.nickname}
                </span>
                <span
                  aria-hidden
                  className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs shrink-0 ${
                    isSelected
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'border-gray-300 text-transparent'
                  }`}
                >
                  ✓
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 p-0 md:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="새 채팅방 만들기"
        className="w-full md:max-w-md bg-white rounded-t-2xl md:rounded-2xl shadow-xl p-6 pb-safe md:pb-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">새 채팅방</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            {[
              { type: RoomType.DIRECT, label: '1:1 채팅' },
              { type: RoomType.GROUP, label: '그룹 채팅' },
            ].map(({ type, label }) => (
              <button
                key={type}
                type="button"
                onClick={() => changeRoomType(type)}
                aria-pressed={roomType === type}
                className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition ${
                  roomType === type
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* 1:1 방 이름은 서버가 상대 닉네임으로 정한다 */}
          {!isDirect && (
            <div>
              <label
                htmlFor="roomName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                방 이름
              </label>
              <input
                id="roomName"
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="예: 프로젝트 팀"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>
          )}

          <div>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                {isDirect ? '대화할 친구' : '초대할 친구'}
              </span>
              {!isDirect && selectedIds.length > 0 && (
                <span className="text-xs text-indigo-600 font-medium">
                  {selectedIds.length}명 선택됨
                </span>
              )}
            </div>

            {friends.length > 0 && (
              <input
                type="search"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                aria-label="친구 검색"
                placeholder="닉네임으로 찾기"
                className="w-full px-4 py-2.5 mb-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            )}

            {friendPicker()}
          </div>

          {error && (
            <p className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading || friends.length === 0}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '만드는 중...' : '채팅방 만들기'}
          </button>
        </form>
      </div>
    </div>
  );
}
