'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MessageResponse,
  PublishStatus,
  RoomSummaryResponse,
} from '@/shared/types/api.types';
import { chatService, toCursor } from '@/features/chat/service/chatService';
import { MessageList } from '@/features/chat/ui/MessageList';
import { ChatInput } from '@/features/chat/ui/ChatInput';
import { roomService } from '@/features/rooms/service/roomService';
import { toErrorMessage } from '@/shared/api/client';
import {
  connectWebSocket,
  createClientMessageId,
  disconnectWebSocket,
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

  const [room, setRoom] = useState<RoomSummaryResponse | null>(null);
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [currentUserNickname, setCurrentUserNickname] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
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
  const upsertMessage = useCallback((incoming: MessageResponse) => {
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

    // 서버까지 도달했으므로 재시도 대기 상태를 해제한다
    if (pendingRef.current?.clientMessageId === incoming.clientMessageId) {
      pendingRef.current = null;
    }
  }, []);

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
        const rooms = await roomService.getMyRooms();
        const foundRoom = rooms.find((r) => r.roomId === roomId);
        if (!foundRoom) {
          setError('채팅방을 찾을 수 없습니다');
          return;
        }
        setRoom(foundRoom);

        const msgs = await chatService.getMessages(roomId, undefined, PAGE_SIZE);
        setMessages(msgs);
        setHasMore(msgs.length === PAGE_SIZE);

        setCurrentUserNickname(localStorage.getItem('userNickname') || '');
      } catch (err) {
        setError(toErrorMessage(err, '채팅을 불러오지 못했습니다'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchChatData();
  }, [roomId, router]);

  useEffect(() => {
    if (Number.isNaN(roomId)) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    connectWebSocket(token);
    // 재연결될 때도 다시 호출되므로 구독을 여기서 건다
    onWebSocketConnect(() => {
      subscribeRoom(roomId, upsertMessage);
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
      });
    });

    return () => {
      disconnectWebSocket();
    };
  }, [roomId, upsertMessage]);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">채팅을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || '채팅방을 찾을 수 없습니다'}</p>
          <Link href="/rooms" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
            채팅 목록으로
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="border-b border-gray-200 bg-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 flex items-center justify-center text-white font-semibold text-sm">
            {room.roomName ? room.roomName.charAt(0).toUpperCase() : 'C'}
          </div>
          <div>
            <h2 className="font-semibold text-gray-800">{room.roomName || '1:1 채팅'}</h2>
            <p className="text-xs text-gray-500">{room.memberCount}명 참여</p>
          </div>
        </div>
        <Link href="/rooms" className="text-gray-500 hover:text-gray-700 transition text-xl">
          ✕
        </Link>
      </div>

      {notice && (
        <div className="px-4 py-2 bg-red-50 text-red-600 text-sm border-b border-red-100">
          {notice}
        </div>
      )}

      <MessageList
        messages={messages}
        currentUserNickname={currentUserNickname}
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
