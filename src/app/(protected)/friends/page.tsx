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
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">친구 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (storeError) {
    return (
      <div className="flex items-center justify-center min-h-full p-6">
        <div className="text-center">
          <p className="text-red-600 mb-4">{storeError}</p>
          <button
            onClick={() => fetchAll({ force: true })}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50 py-6 md:py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="flex border-b border-gray-200">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setNotice('');
                }}
                aria-current={activeTab === tab.key ? 'page' : undefined}
                className={`flex-1 py-4 px-2 font-semibold transition ${
                  activeTab === tab.key
                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {tab.label}
                {tab.key === 'requests' && requests.length > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 bg-indigo-600 text-white text-xs rounded-full">
                    {requests.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="p-4">
            {notice && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
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
