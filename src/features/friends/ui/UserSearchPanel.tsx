'use client';

import { useState } from 'react';
import { UserSearchResponse } from '@/shared/types/api.types';
import { toErrorMessage } from '@/shared/api/client';
import { toUserCursor, userService } from '@/features/users/service/userService';
import { SearchIcon } from '@/shared/ui/icons';
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
        <div className="relative flex-1">
          <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" />
          <input
            type="search"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="닉네임으로 검색"
            aria-label="닉네임으로 검색"
            className="w-full h-11 pl-9 pr-3 bg-surface-2 rounded-xl text-sm placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-accent transition"
          />
        </div>
        <button
          type="submit"
          disabled={isSearching || !keyword.trim()}
          className="px-4 h-11 bg-accent text-accent-fg text-sm font-semibold rounded-xl hover:bg-accent-hover transition disabled:opacity-50"
        >
          검색
        </button>
      </form>

      {hasSearched && results.length === 0 && !isSearching && (
        <p className="text-center text-sm text-ink-muted py-12">
          검색 결과가 없어요
        </p>
      )}

      <ul className="space-y-0.5">
        {results.map((user) => (
          <li
            key={user.id}
            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-2 transition"
          >
            <FriendAvatar nickname={user.nickname} size="sm" />
            <span className="flex-1 min-w-0 font-medium truncate">
              {user.nickname}
            </span>
            <button
              type="button"
              onClick={() =>
                isRequested(user) ? handleCancel(user) : handleSend(user)
              }
              disabled={isFriend(user) || sendingId === user.id}
              className={`shrink-0 px-3 py-1.5 text-sm font-medium border rounded-lg transition disabled:opacity-50 ${
                isRequested(user)
                  ? 'text-ink-muted border-line hover:bg-surface-3'
                  : 'text-accent-ink border-line hover:bg-accent-soft'
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
          className="w-full py-2 text-sm font-medium text-accent-ink hover:bg-accent-soft rounded-lg transition disabled:opacity-50"
        >
          {isSearching ? '불러오는 중...' : '더 보기'}
        </button>
      )}
    </div>
  );
}
