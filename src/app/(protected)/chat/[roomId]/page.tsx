'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { MessageResponse, RoomResponse } from '@/shared/types/api.types';
import { chatService } from '@/features/chat/service/chatService';
import { MessageList } from '@/features/chat/ui/MessageList';
import { ChatInput } from '@/features/chat/ui/ChatInput';
import { roomService } from '@/features/rooms/service/roomService';
import {
  connectWebSocket,
  disconnectWebSocket,
  onWebSocketConnect,
  sendChatMessage,
  subscribeErrors,
  subscribeRoom,
} from '@/shared/api/websocket';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;

  const [room, setRoom] = useState<RoomResponse | null>(null);
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [currentUserNickname, setCurrentUserNickname] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    const fetchChatData = async () => {
      try {
        const rooms = await roomService.getMyRooms();
        const foundRoom = rooms.find((r) => r.roomId === parseInt(roomId));
        if (!foundRoom) {
          setError('채팅방을 찾을 수 없습니다');
          return;
        }
        setRoom(foundRoom);

        const msgs = await chatService.getMessages(parseInt(roomId));
        setMessages(msgs);

        const userNickname = localStorage.getItem('userNickname') || '민수';
        setCurrentUserNickname(userNickname);
      } catch (err: any) {
        setError(err.response?.data?.message || '채팅을 불러오지 못했습니다');
      } finally {
        setIsLoading(false);
      }
    };

    fetchChatData();
  }, [roomId, router]);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    connectWebSocket(token);
    onWebSocketConnect(() => {
      subscribeRoom(parseInt(roomId), (message) => {
        setMessages((prev) => [...prev, message]);
      });
      subscribeErrors((message) => setError(message));
    });

    return () => {
      disconnectWebSocket();
    };
  }, [roomId]);

  const handleSendMessage = async (content: string) => {
    // 브로커가 /topic/rooms/{roomId} 로 되돌려주므로 여기서 목록에 직접 추가하지 않는다
    if (!sendChatMessage(parseInt(roomId), content)) {
      throw new Error('서버와 연결되어 있지 않습니다');
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

      <MessageList messages={messages} currentUserNickname={currentUserNickname} isLoading={false} />
      <ChatInput onSendMessage={handleSendMessage} />
    </div>
  );
}
