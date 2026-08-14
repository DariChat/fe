'use client';

import { useState } from 'react';
import { UserSearchResponse } from '@/shared/types/api.types';
import { toErrorMessage } from '@/shared/api/client';
import { toUserCursor, userService } from '@/features/users/service/userService';
import { useFriendsStore } from '../model/friendsStore';
import { FriendAvatar } from './FriendAvatar';

const PAGE_SIZE = 20;

interface UserSearchPanelProps {
  onError: (message: string) => void;
}

export function UserSearchPanel({ onError }: UserSearchPanelProps) {
  const friends = useFriendsStore((state) => state.friends);
  const sentRequests = useFriendsStore((state) => state.sentRequests);
  const sendRequest = useFriendsStore((state) => state.sendRequest);
  const cancelRequest = useFriendsStore((state) => state.cancelRequest);

  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<UserSearchResponse[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [sendingId, setSendingId] = useState<number | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    setIsSearching(true);
    try {
      const found = await userService.searchUsers(
        keyword.trim(),
        undefined,
        PAGE_SIZE
      );
      setResults(found);
      setHasMore(found.length === PAGE_SIZE);
      setHasSearched(true);
    } catch (err) {
      onError(toErrorMessage(err, '검색에 실패했습니다'));
    } finally {
      setIsSearching(false);
    }
  };

  const handleLoadMore = async () => {
    setIsSearching(true);
    try {
      // 커서는 마지막 항목의 닉네임이다 (id 가 아니다)
      const more = await userService.searchUsers(
        keyword.trim(),
        toUserCursor(results),
        PAGE_SIZE
      );
      setResults((prev) => [...prev, ...more]);
      setHasMore(more.length === PAGE_SIZE);
    } catch (err) {
      onError(toErrorMessage(err, '검색 결과를 더 불러오지 못했습니다'));
    } finally {
      setIsSearching(false);
    }
  };

  const isFriend = (user: UserSearchResponse) =>
    friends.some((friend) => friend.userId === user.id);

  const isRequested = (user: UserSearchResponse) =>
    sentRequests.some((sent) => sent.userId === user.id);

  const handleSend = async (user: UserSearchResponse) => {
    setSendingId(user.id);
    try {
      await sendRequest(user.id);
    } catch (err) {
      // 같은 방향으로 이미 요청했거나 친구면 서버가 409 로 막는다
      onError(toErrorMessage(err, '친구 요청을 보내지 못했습니다'));
    } finally {
      setSendingId(null);
    }
  };

  /** 보낸 요청 취소 — 거절과 같은 엔드포인트다 */
  const handleCancel = async (user: UserSearchResponse) => {
    setSendingId(user.id);
    try {
      await cancelRequest(user.id);
    } catch (err) {
      onError(toErrorMessage(err, '요청을 취소하지 못했습니다'));
    } finally {
      setSendingId(null);
    }
  };

  const labelFor = (user: UserSearchResponse) => {
    if (isFriend(user)) return '친구';
    if (sendingId === user.id) return '처리 중...';
    return isRequested(user) ? '요청 취소' : '친구 요청';
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="search"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="닉네임으로 검색"
          aria-label="닉네임으로 검색"
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
        />
        <button
          type="submit"
          disabled={isSearching || !keyword.trim()}
          className="px-4 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
        >
          검색
        </button>
      </form>

      {hasSearched && results.length === 0 && !isSearching && (
        <p className="text-center text-gray-500 py-12">검색 결과가 없어요</p>
      )}

      <ul className="space-y-1">
        {results.map((user) => (
          <li
            key={user.id}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition"
          >
            <FriendAvatar nickname={user.nickname} size="sm" />
            <span className="flex-1 min-w-0 font-semibold text-gray-800 truncate">
              {user.nickname}
            </span>
            <button
              type="button"
              onClick={() =>
                isRequested(user) ? handleCancel(user) : handleSend(user)
              }
              disabled={isFriend(user) || sendingId === user.id}
              className={`px-3 py-1.5 text-sm font-medium border rounded-lg transition disabled:opacity-50 disabled:hover:bg-transparent ${
                isRequested(user)
                  ? 'text-gray-600 border-gray-200 hover:bg-gray-50'
                  : 'text-indigo-600 border-indigo-200 hover:bg-indigo-50'
              }`}
            >
              {labelFor(user)}
            </button>
          </li>
        ))}
      </ul>

      {hasMore && (
        <button
          type="button"
          onClick={handleLoadMore}
          disabled={isSearching}
          className="w-full py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition disabled:opacity-50"
        >
          {isSearching ? '불러오는 중...' : '더 보기'}
        </button>
      )}
    </div>
  );
}
