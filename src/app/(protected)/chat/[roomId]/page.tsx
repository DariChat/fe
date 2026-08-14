'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MessageResponse,
  PreferredLanguage,
  PublishStatus,
} from '@/shared/types/api.types';
import { readMyLanguage, readMyNickname } from '@/shared/lib/currentUser';
import { Avatar } from '@/shared/ui/Avatar';
import { ChevronLeftIcon, CloseIcon } from '@/shared/ui/icons';
import { chatService, toCursor } from '@/features/chat/service/chatService';
import { MessageList } from '@/features/chat/ui/MessageList';
import { ChatInput } from '@/features/chat/ui/ChatInput';
import { useRoomsStore } from '@/features/rooms/model/roomsStore';
import { toErrorMessage } from '@/shared/api/client';
import { StompSubscription } from '@stomp/stompjs';
import {
  connectWebSocket,
  createClientMessageId,
  onWebSocketConnect,
  sendChatMessage,
  subscribeErrors,
  subscribeRoom,
} from '@/shared/api/websocket';

const PAGE_SIZE = 30;

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = Number(params.roomId);

  const fetchRooms = useRoomsStore((state) => state.fetchRooms);
  const markRoomRead = useRoomsStore((state) => state.markRoomRead);
  const applyMessagePreview = useRoomsStore(
    (state) => state.applyMessagePreview
  );
  const leaveRoomFromStore = useRoomsStore((state) => state.leaveRoom);
  // 목록과 같은 출처를 써야 방을 만들거나 나갔을 때 양쪽이 어긋나지 않는다
  const room = useRoomsStore(
    (state) => state.rooms.find((r) => r.roomId === roomId) ?? null
  );

  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [currentUserNickname, setCurrentUserNickname] = useState('');
  const [myLanguage, setMyLanguage] = useState(PreferredLanguage.KO);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  /** 전송 중이거나 실패해 재시도를 기다리는 메시지 (clientMessageId 를 그대로 재사용해야 중복 저장되지 않는다) */
  const pendingRef = useRef<{ clientMessageId: string; content: string } | null>(
    null
  );

  /**
   * 브로드캐스트로 되돌아온 메시지를 목록에 반영한다.
   * 내가 낙관적으로 그려둔 임시 메시지가 있으면 clientMessageId 로 찾아 교체한다.
   */
  const upsertMessage = useCallback(
    (incoming: MessageResponse) => {
      setMessages((prev) => {
        const index = prev.findIndex(
          (m) =>
            m.id === incoming.id ||
            (Boolean(m.clientMessageId) &&
              m.clientMessageId === incoming.clientMessageId)
        );
        if (index === -1) {
          return [...prev, incoming];
        }
        const next = [...prev];
        next[index] = incoming;
        return next;
      });

      // 옆에 목록이 함께 떠 있는 데스크톱에서 미리보기가 뒤처지지 않도록 한다
      applyMessagePreview(roomId, incoming);

      // 서버까지 도달했으므로 재시도 대기 상태를 해제한다
      if (pendingRef.current?.clientMessageId === incoming.clientMessageId) {
        pendingRef.current = null;
      }
    },
    [applyMessagePreview, roomId]
  );

  useEffect(() => {
    if (Number.isNaN(roomId)) {
      setError('잘못된 채팅방입니다');
      setIsLoading(false);
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    const fetchChatData = async () => {
      try {
        // 목록을 아직 안 받아왔다면(대화방 주소로 바로 들어온 경우) 여기서 채운다
        await fetchRooms();
        if (!useRoomsStore.getState().rooms.some((r) => r.roomId === roomId)) {
          setError('채팅방을 찾을 수 없습니다');
          return;
        }

        const msgs = await chatService.getMessages(roomId, undefined, PAGE_SIZE);
        setMessages(msgs);
        setHasMore(msgs.length === PAGE_SIZE);

        setCurrentUserNickname(readMyNickname());
        setMyLanguage(readMyLanguage());
      } catch (err) {
        setError(toErrorMessage(err, '채팅을 불러오지 못했습니다'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchChatData();
  }, [roomId, router, fetchRooms]);

  useEffect(() => {
    if (Number.isNaN(roomId)) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    /*
     * 연결 자체는 레이아웃(useServerEvents)이 잡고 있다.
     * 여기서는 이 방의 토픽만 얹고, 방을 벗어날 때 그 구독만 푼다.
     * 연결까지 끊으면 대화방을 나가는 순간 개인 큐 알림이 죽는다.
     *
     * 레이아웃보다 자식 effect 가 먼저 도는 경우가 있어 연결 호출은 그대로 둔다
     * (이미 연결돼 있으면 기존 클라이언트를 그대로 돌려준다).
     */
    connectWebSocket(token);

    let subscriptions: (StompSubscription | null)[] = [];

    // 재연결될 때도 다시 호출되므로 구독을 여기서 건다
    const off = onWebSocketConnect(() => {
      subscriptions = [
        subscribeRoom(roomId, upsertMessage),
        subscribeErrors((detail) => {
          setNotice(detail.message);
          // 실패한 메시지는 pendingRef 에 남겨 두고 FAILED 로 표시해 재시도를 열어둔다
          setMessages((prev) =>
            prev.map((m) =>
              m.clientMessageId === pendingRef.current?.clientMessageId
                ? { ...m, publishStatus: PublishStatus.FAILED }
                : m
            )
          );
        }),
      ];
      // 서버는 구독을 받은 시점에 이 방을 읽음 처리한다 (RoomSubscriptionListener)
      markRoomRead(roomId);
    });

    return () => {
      off();
      subscriptions.forEach((subscription) => subscription?.unsubscribe());
    };
  }, [roomId, upsertMessage, markRoomRead]);

  /** OWNER 가 나가면 서버가 소유권을 넘기거나(남은 멤버 있음) 방을 지운다 */
  const handleLeaveRoom = async () => {
    if (!window.confirm('이 채팅방에서 나갈까요? 대화 목록에서 사라집니다.')) {
      return;
    }

    setIsLeaving(true);
    try {
      await leaveRoomFromStore(roomId);
      // 구독 해제는 이 화면이 사라질 때 effect 정리에서 함께 처리된다
      router.push('/rooms');
    } catch (err) {
      setNotice(toErrorMessage(err, '채팅방을 나가지 못했습니다'));
      setIsLeaving(false);
    }
  };

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    try {
      const older = await chatService.getMessages(
        roomId,
        toCursor(messages),
        PAGE_SIZE
      );
      setMessages((prev) => [...older, ...prev]);
      setHasMore(older.length === PAGE_SIZE);
    } catch (err) {
      setNotice(toErrorMessage(err, '이전 메시지를 불러오지 못했습니다'));
    } finally {
      setIsLoadingMore(false);
    }
  };

  const publish = (content: string, clientMessageId: string) => {
    pendingRef.current = { clientMessageId, content };
    setNotice('');

    if (!sendChatMessage(roomId, content, clientMessageId)) {
      setMessages((prev) =>
        prev.map((m) =>
          m.clientMessageId === clientMessageId
            ? { ...m, publishStatus: PublishStatus.FAILED }
            : m
        )
      );
      throw new Error('서버와 연결되어 있지 않습니다');
    }
  };

  const handleSendMessage = async (content: string) => {
    const clientMessageId = createClientMessageId();

    // 서버 저장 전 임시 메시지를 먼저 그리고, /sub 로 되돌아온 응답으로 교체한다
    setMessages((prev) => [
      ...prev,
      {
        id: -Date.now(),
        content,
        senderNickname: currentUserNickname,
        clientMessageId,
        publishStatus: PublishStatus.PENDING,
        // 번역은 서버가 저장하면서 채워 브로드캐스트로 되돌아온다
        translations: {},
        createdAt: new Date().toISOString(),
      },
    ]);

    publish(content, clientMessageId);
  };

  /** 실패한 메시지를 같은 clientMessageId 로 재전송한다 */
  const handleRetry = (message: MessageResponse) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.clientMessageId === message.clientMessageId
          ? { ...m, publishStatus: PublishStatus.PENDING }
          : m
      )
    );

    try {
      publish(message.content, message.clientMessageId);
    } catch {
      setNotice('서버와 연결되어 있지 않습니다');
    }
  };

  // 나가는 중에는 방이 목록에서 이미 빠졌으므로 '찾을 수 없음' 을 띄우지 않는다
  if (isLoading || isLeaving) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-line-strong border-t-accent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-ink-muted">
            {isLeaving ? '채팅방에서 나가는 중...' : '채팅을 불러오는 중...'}
          </p>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-sm text-danger mb-4">
            {error || '채팅방을 찾을 수 없습니다'}
          </p>
          <Link
            href="/rooms"
            className="inline-block px-4 py-2 text-sm font-medium bg-accent text-accent-fg rounded-xl hover:bg-accent-hover transition"
          >
            채팅 목록으로
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* 모바일에서는 앱 헤더가 숨겨지므로 이 헤더가 상단 안전영역까지 책임진다 */}
      <div className="border-b border-line bg-surface px-3 md:px-5 py-3 md:py-4 pt-safe-3 md:pt-4 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* 모바일: 뒤로가기 / 데스크톱: 목록이 옆에 있으므로 불필요 */}
          <Link
            href="/rooms"
            aria-label="채팅 목록으로"
            className="md:hidden -ml-1 p-1.5 rounded-lg text-ink-muted hover:bg-surface-2 transition"
          >
            <ChevronLeftIcon />
          </Link>
          <Avatar nickname={room.roomName || 'Chat'} size="sm" />
          <div className="min-w-0">
            <h2 className="font-semibold truncate leading-tight">
              {room.roomName || '1:1 채팅'}
            </h2>
            <p className="text-xs text-ink-subtle">{room.memberCount}명 참여</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleLeaveRoom}
            className="px-3 py-1.5 text-sm font-medium text-ink-muted rounded-lg hover:bg-danger-soft hover:text-danger transition"
          >
            나가기
          </button>
          <Link
            href="/rooms"
            aria-label="채팅 닫기"
            className="hidden md:flex w-8 h-8 items-center justify-center rounded-lg text-ink-subtle hover:bg-surface-2 hover:text-ink transition"
          >
            <CloseIcon className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {notice && (
        <div className="px-4 py-2 bg-danger-soft text-danger text-sm border-b border-danger-line">
          {notice}
        </div>
      )}

      <MessageList
        messages={messages}
        currentUserNickname={currentUserNickname}
        myLanguage={myLanguage}
        isLoading={false}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
        onLoadMore={handleLoadMore}
        onRetry={handleRetry}
      />
      <ChatInput onSendMessage={handleSendMessage} />
    </div>
  );
}
