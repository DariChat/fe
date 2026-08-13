'use client';

import { useEffect, useRef } from 'react';
import { StompSubscription } from '@stomp/stompjs';
import {
  connectWebSocket,
  disconnectWebSocket,
  onWebSocketConnect,
  subscribeFriendEvents,
  subscribeRoomEvents,
} from '@/shared/api/websocket';
import { useRoomsStore } from '@/features/rooms/model/roomsStore';
import { useFriendsStore } from '@/features/friends/model/friendsStore';

/**
 * 로그인한 화면 전체가 공유하는 WebSocket 연결을 여기서 잡는다.
 *
 * 개인 큐(/user/queue/rooms · /user/queue/friends)는 어느 화면에 있든 받아야 한다.
 * 대화방 페이지에서 연결하면 대화방을 벗어나는 순간 끊겨서
 * "새 방에 초대됨", "친구 요청 도착" 같은 알림을 놓친다.
 *
 * 대화방 페이지는 이 연결에 방 토픽 구독만 얹는다. 끊는 건 여기서만 한다.
 */
export const useServerEvents = () => {
  const applyRoomEvent = useRoomsStore((state) => state.applyRoomEvent);
  const applyFriendEvent = useFriendsStore((state) => state.applyFriendEvent);

  // 재연결될 때마다 새 구독으로 덮이므로 최신 것만 붙들고 있다가 정리한다
  const subscriptionsRef = useRef<(StompSubscription | null)[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    connectWebSocket(token);

    const off = onWebSocketConnect(() => {
      subscriptionsRef.current = [
        subscribeRoomEvents(applyRoomEvent),
        subscribeFriendEvents(applyFriendEvent),
      ];
    });

    return () => {
      off();
      subscriptionsRef.current.forEach((subscription) =>
        subscription?.unsubscribe()
      );
      subscriptionsRef.current = [];
      disconnectWebSocket();
    };
  }, [applyRoomEvent, applyFriendEvent]);
};
