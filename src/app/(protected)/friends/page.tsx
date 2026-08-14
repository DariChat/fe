'use client';

import { useCallback, useState } from 'react';
import { useAutoRefresh } from '@/shared/lib/useAutoRefresh';
import { useFriendsStore } from '@/features/friends/model/friendsStore';
import { FriendList } from '@/features/friends/ui/FriendList';
import { FriendRequestList } from '@/features/friends/ui/FriendRequestList';
import { UserSearchPanel } from '@/features/friends/ui/UserSearchPanel';

type FriendsTab = 'friends' | 'requests' | 'search';

const TABS: { key: FriendsTab; label: string }[] = [
  { key: 'friends', label: '친구' },
  { key: 'requests', label: '받은 요청' },
  { key: 'search', label: '친구 찾기' },
];

export default function FriendsPage() {
  const friends = useFriendsStore((state) => state.friends);
  const requests = useFriendsStore((state) => state.requests);
  const isLoading = useFriendsStore((state) => state.isLoading);
  const hasLoaded = useFriendsStore((state) => state.hasLoaded);
  const storeError = useFriendsStore((state) => state.error);
  const fetchAll = useFriendsStore((state) => state.fetchAll);

  const [activeTab, setActiveTab] = useState<FriendsTab>('friends');
  /** 목록 조회 실패(storeError)와 달리 화면을 비우지 않는 일시적 알림 */
  const [notice, setNotice] = useState('');

  // 요청 도착·수락은 /user/queue/friends 로 밀려온다. 이건 첫 조회 + 놓친 구간 보정용이다.
  useAutoRefresh(
    useCallback(() => {
      fetchAll({ force: true });
    }, [fetchAll])
  );

  if (isLoading || (!hasLoaded && !storeError)) {
    return (
      <div className="flex items-center justify-center min-h-full">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-line-strong border-t-accent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-ink-muted">친구 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (storeError) {
    return (
      <div className="flex items-center justify-center min-h-full p-6">
        <div className="text-center">
          <p className="text-sm text-danger mb-4">{storeError}</p>
          <button
            onClick={() => fetchAll({ force: true })}
            className="px-4 py-2 text-sm font-medium bg-accent text-accent-fg rounded-xl hover:bg-accent-hover transition"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-bg py-6 md:py-10">
      <div className="max-w-2xl mx-auto px-4">
        <header className="mb-5">
          <h1 className="text-2xl font-semibold tracking-tight">친구</h1>
          <p className="text-sm text-ink-muted mt-1">
            친구 {friends.length}명
            {requests.length > 0 && ` · 받은 요청 ${requests.length}건`}
          </p>
        </header>

        <div className="bg-surface border border-line rounded-2xl shadow-card overflow-hidden">
          <div
            data-tour="friends-tabs"
            className="flex gap-1 p-1.5 border-b border-line"
          >
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setNotice('');
                }}
                aria-current={activeTab === tab.key ? 'page' : undefined}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-sm font-medium transition ${
                  activeTab === tab.key
                    ? 'bg-accent-soft text-accent-ink'
                    : 'text-ink-muted hover:bg-surface-2 hover:text-ink'
                }`}
              >
                {tab.label}
                {tab.key === 'requests' && requests.length > 0 && (
                  <span className="min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-accent text-accent-fg text-[10px] font-semibold">
                    {requests.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="p-3 md:p-4">
            {notice && (
              <div className="mb-3 p-3 bg-danger-soft border border-danger-line text-danger rounded-xl text-sm">
                {notice}
              </div>
            )}

            {activeTab === 'friends' && (
              <FriendList friends={friends} onError={setNotice} />
            )}
            {activeTab === 'requests' && (
              <FriendRequestList requests={requests} onError={setNotice} />
            )}
            {activeTab === 'search' && <UserSearchPanel onError={setNotice} />}
          </div>
        </div>
      </div>
    </div>
  );
}
