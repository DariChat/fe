'use client';

import { useEffect, useRef } from 'react';

/**
 * 목록을 새로고침 없이 최신으로 유지한다.
 *
 * 서버는 방 안의 메시지만 WebSocket 으로 밀어준다.
 * "상대가 내 친구 요청을 수락했다", "누가 나를 새 방에 초대했다" 같은 변화는
 * 알림이 오지 않아 화면이 직접 다시 물어봐야 한다. 그래서 세 시점에 새로 받아온다.
 *
 *  - 화면에 들어올 때 (다른 탭에서 돌아오는 경우 포함)
 *  - 창이 다시 활성화될 때 — 두 기기·두 계정으로 번갈아 보는 상황을 덮는다
 *  - 보고 있는 동안 주기적으로
 *
 * 탭이 숨겨져 있으면 아무것도 하지 않아 백그라운드에서 불필요한 요청이 쌓이지 않는다.
 * 주기를 더 줄이고 싶다면 서버가 "친구 요청 수락", "새 방 초대" 를
 * /user/queue 로 밀어주게 하는 편이 낫다. 그때는 이 훅을 걷어낼 수 있다.
 */
export const useAutoRefresh = (
  refresh: () => void,
  {
    intervalMs = 10000,
    enabled = true,
  }: { intervalMs?: number; enabled?: boolean } = {}
) => {
  // 콜백이 매 렌더 새로 만들어져도 타이머를 다시 걸지 않도록 참조만 갱신한다
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useEffect(() => {
    // 화면에 안 보이는 목록은 받아봐야 아무도 읽지 않는다
    if (!enabled) return;

    const run = () => refreshRef.current();

    run();

    const runIfVisible = () => {
      if (document.visibilityState === 'visible') {
        run();
      }
    };

    const timer = setInterval(runIfVisible, intervalMs);
    window.addEventListener('focus', runIfVisible);
    document.addEventListener('visibilitychange', runIfVisible);

    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', runIfVisible);
      document.removeEventListener('visibilitychange', runIfVisible);
    };
  }, [intervalMs, enabled]);
};
