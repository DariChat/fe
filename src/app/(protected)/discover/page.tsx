'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useAutoRefresh } from '@/shared/lib/useAutoRefresh';
import { useFriendsStore } from '@/features/friends/model/friendsStore';
import { FriendFinder } from '@/features/friends/ui/FriendFinder';

/**
 * 친구 찾기 — 로그인하면 가장 먼저 열리는 화면.
 *
 * 대화 목록을 홈으로 두면 갓 가입한 사람에게는 텅 빈 화면이 첫인상이 된다.
 * 이 앱에서 할 일은 "다른 언어를 쓰는 사람을 만나는 것"이므로 그 입구를 홈으로 둔다.
 *
 * 친구 목록·받은 요청은 /friends 가 맡는다. 여기서는 새로운 사람만 다룬다.
 */
export default function DiscoverPage() {
  const requests = useFriendsStore((state) => state.requests);
  const fetchAll = useFriendsStore((state) => state.fetchAll);

  /** 화면을 비우지 않는 일시적 알림 (요청 실패 등) */
  const [notice, setNotice] = useState('');

  /*
   * 추천 카드의 버튼 상태(친구·요청함)는 친구 목록에서 온다.
   * 홈으로 바로 들어오는 경로라 여기서도 한 번은 받아둬야 한다.
   */
  useAutoRefresh(
    useCallback(() => {
      fetchAll({ force: true });
    }, [fetchAll])
  );

  return (
    <div className="min-h-full bg-bg py-6 md:py-10">
      <div className="max-w-3xl mx-auto px-4">
        <header className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">친구 찾기</h1>
            <p className="text-sm text-ink-muted mt-1">
              언어가 달라도 괜찮아요. 메시지는 자동으로 번역됩니다.
            </p>
          </div>

          {requests.length > 0 && (
            <Link
              href="/friends"
              className="shrink-0 flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-surface border border-line rounded-xl hover:bg-surface-2 transition"
            >
              받은 요청
              <span className="min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-accent text-accent-fg text-[10px] font-semibold">
                {requests.length}
              </span>
            </Link>
          )}
        </header>

        {notice && (
          <div className="mb-3 p-3 bg-danger-soft border border-danger-line text-danger rounded-xl text-sm">
            {notice}
          </div>
        )}

        <FriendFinder onError={setNotice} />
      </div>
    </div>
  );
}
