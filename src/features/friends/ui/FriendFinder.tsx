'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  LANGUAGE_LABELS,
  UserRecommendationResponse,
  UserSearchResponse,
} from '@/shared/types/api.types';
import { toErrorMessage } from '@/shared/api/client';
import { toUserCursor, userService } from '@/features/users/service/userService';
import { SearchIcon } from '@/shared/ui/icons';
import { useFriendsStore } from '../model/friendsStore';
import { FriendAvatar } from './FriendAvatar';

const PAGE_SIZE = 20;
const RECOMMEND_PAGE_SIZE = 10;

interface FriendFinderProps {
  onError: (message: string) => void;
}

/**
 * 친구 찾기 화면의 본체 — 추천 목록과 닉네임 검색.
 *
 * 로그인하면 가장 먼저 만나는 화면이라(=/discover) 기본 상태는 검색창이 아니라 추천이다.
 * 아직 아무도 모르는 사람에게 빈 검색창만 주면 무엇을 쳐야 할지 알 수 없다.
 */
export function FriendFinder({ onError }: FriendFinderProps) {
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

  /*
   * 추천은 서버가 무작위로 고르기 때문에 커서를 쓸 수 없다.
   * 지금까지 받은 id 를 전부 넘겨 중복을 막는 방식이라 목록 자체가 커서 역할을 한다.
   */
  const [recommendations, setRecommendations] = useState<
    UserRecommendationResponse[]
  >([]);
  const [isRecommendLoading, setIsRecommendLoading] = useState(true);
  /** 더 받아올 사람이 없는 상태 (요청한 만큼 못 받아오면 바닥이다) */
  const [isRecommendExhausted, setIsRecommendExhausted] = useState(false);

  const loadRecommendations = useCallback(
    async (exclude: number[]) => {
      setIsRecommendLoading(true);
      try {
        const more = await userService.getRecommendations(
          exclude,
          RECOMMEND_PAGE_SIZE
        );
        /*
         * 서버가 무작위로 고르는 데다 첫 조회가 두 번 돌 수도 있어(개발 모드의 이중 실행 등)
         * 같은 사람이 두 번 들어올 수 있다. 붙일 때 id 로 한 번 걸러낸다.
         */
        setRecommendations((prev) => {
          const seen = new Set(prev.map((user) => user.userId));
          return [...prev, ...more.filter((user) => !seen.has(user.userId))];
        });
        setIsRecommendExhausted(more.length < RECOMMEND_PAGE_SIZE);
      } catch (err) {
        // 추천은 덤이므로 실패해도 검색은 그대로 쓸 수 있어야 한다
        console.warn('추천 유저를 불러오지 못했습니다', err);
        setIsRecommendExhausted(true);
      } finally {
        setIsRecommendLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadRecommendations([]);
  }, [loadRecommendations]);

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

  const clearSearch = () => {
    setKeyword('');
    setResults([]);
    setHasSearched(false);
    setHasMore(false);
  };

  const isFriend = (userId: number) =>
    friends.some((friend) => friend.userId === userId);

  const isRequested = (userId: number) =>
    sentRequests.some((sent) => sent.userId === userId);

  const handleSend = async (userId: number) => {
    setSendingId(userId);
    try {
      await sendRequest(userId);
    } catch (err) {
      // 같은 방향으로 이미 요청했거나 친구면 서버가 409 로 막는다
      onError(toErrorMessage(err, '친구 요청을 보내지 못했습니다'));
    } finally {
      setSendingId(null);
    }
  };

  /** 보낸 요청 취소 — 거절과 같은 엔드포인트다 */
  const handleCancel = async (userId: number) => {
    setSendingId(userId);
    try {
      await cancelRequest(userId);
    } catch (err) {
      onError(toErrorMessage(err, '요청을 취소하지 못했습니다'));
    } finally {
      setSendingId(null);
    }
  };

  const labelFor = (userId: number) => {
    if (isFriend(userId)) return '친구';
    if (sendingId === userId) return '처리 중...';
    return isRequested(userId) ? '요청 취소' : '친구 요청';
  };

  const requestButton = (userId: number) => (
    <button
      type="button"
      onClick={() =>
        isRequested(userId) ? handleCancel(userId) : handleSend(userId)
      }
      disabled={isFriend(userId) || sendingId === userId}
      className={`shrink-0 px-3 py-1.5 text-sm font-medium border rounded-lg transition disabled:opacity-50 ${
        isRequested(userId)
          ? 'text-ink-muted border-line hover:bg-surface-3'
          : 'text-accent-ink border-line hover:bg-accent-soft'
      }`}
    >
      {labelFor(userId)}
    </button>
  );

  return (
    <div className="space-y-4">
      <form
        onSubmit={handleSearch}
        data-tour="user-search"
        className="flex gap-2"
      >
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

      {hasSearched ? (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-ink-muted">
              검색 결과 {results.length}명
            </p>
            <button
              type="button"
              onClick={clearSearch}
              className="text-sm font-medium text-accent-ink hover:underline"
            >
              추천 목록으로
            </button>
          </div>

          {results.length === 0 && !isSearching && (
            <p className="text-center text-sm text-ink-muted py-12">
              검색 결과가 없어요
            </p>
          )}

          {/* 검색 결과는 훑어보는 목록이라 한 사람이 한 줄에 들어오게 둔다 */}
          <ul className="space-y-0.5">
            {results.map((user) => (
              <li
                key={user.id}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-2 transition"
              >
                <FriendAvatar nickname={user.nickname} size="sm" />

                <div className="flex-1 min-w-0 flex items-baseline gap-2">
                  <span className="font-medium truncate shrink-0 max-w-[45%]">
                    {user.nickname}
                  </span>
                  {user.preferredLanguage && (
                    <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-surface-2 text-[11px] font-medium text-ink-muted">
                      {LANGUAGE_LABELS[user.preferredLanguage]}
                    </span>
                  )}
                  {user.bio && (
                    <span className="text-[13px] text-ink-muted truncate">
                      {user.bio}
                    </span>
                  )}
                </div>

                {requestButton(user.id)}
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
        </>
      ) : (
        <>
          {/*
            튜토리얼이 가리키는 자리다. 목록(ul)이 아니라 이 묶음에 이름을 달아야 한다 —
            추천을 불러오는 동안 목록은 높이가 0 이라 안내가 대상을 못 찾고 그 단계를 건너뛴다.
          */}
          <section data-tour="discover-list" className="space-y-3">
            <div>
              <h2 className="text-sm font-semibold">이런 사람은 어때요?</h2>
              <p className="text-xs text-ink-muted mt-0.5">
                나와 다른 언어를 쓰는 사람들이에요. 번역은 자동으로 됩니다.
              </p>
            </div>

            {recommendations.length === 0 && isRecommendLoading && (
              <p className="text-center text-sm text-ink-muted py-12">
                추천을 불러오는 중...
              </p>
            )}

            {recommendations.length === 0 && !isRecommendLoading && (
              <p className="text-center text-sm text-ink-muted py-12">
                지금은 추천할 사람이 없어요. 닉네임으로 직접 찾아보세요.
              </p>
            )}

            <ul className="grid gap-2 md:grid-cols-2">
            {recommendations.map((user) => (
              <li
                key={user.userId}
                className="flex items-start gap-3 p-3 bg-surface border border-line rounded-xl hover:border-line-strong transition"
              >
                <FriendAvatar nickname={user.nickname} size="sm" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">
                      {user.nickname}
                    </span>
                    <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-surface-2 text-[11px] font-medium text-ink-muted">
                      {LANGUAGE_LABELS[user.preferredLanguage]}
                    </span>
                  </div>
                  {user.bio && (
                    <p className="text-[13px] text-ink-muted mt-1 line-clamp-2">
                      {user.bio}
                    </p>
                  )}
                </div>

                {requestButton(user.userId)}
              </li>
            ))}
            </ul>

            {recommendations.length > 0 && !isRecommendExhausted && (
              <button
                type="button"
                onClick={() =>
                  loadRecommendations(
                    recommendations.map((user) => user.userId)
                  )
                }
                disabled={isRecommendLoading}
                className="w-full py-2 text-sm font-medium text-accent-ink hover:bg-accent-soft rounded-lg transition disabled:opacity-50"
              >
                {isRecommendLoading ? '불러오는 중...' : '다른 사람 더 보기'}
              </button>
            )}
          </section>
        </>
      )}
    </div>
  );
}
