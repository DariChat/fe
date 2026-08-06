'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { MessageResponse, RoomResponse } from '@/shared/types/api.types';
import { chatService } from '@/features/chat/service/chatService';
import { MessageList } from '@/features/chat/ui/MessageList';
import { ChatInput } from '@/features/chat/ui/ChatInput';
import { roomService } from '@/features/rooms/service/roomService';

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
        // Get room info
        const rooms = await roomService.getMyRooms();
        const foundRoom = rooms.find((r) => r.roomId === parseInt(roomId));
        if (!foundRoom) {
          setError('Room not found');
          return;
        }
        setRoom(foundRoom);

        // Get messages
        const msgs = await chatService.getMessages(parseInt(roomId));
        setMessages(msgs);

        // Get current user nickname from localStorage or fetch
        const userNickname = localStorage.getItem('userNickname') || 'User';
        setCurrentUserNickname(userNickname);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load chat');
      } finally {
        setIsLoading(false);
      }
    };

    fetchChatData();
  }, [roomId, router]);

  const handleSendMessage = async (content: string) => {
    try {
      // TODO: Implement WebSocket message sending
      // For now, this is a placeholder
      const newMessage: MessageResponse = {
        id: Date.now(),
        content,
        senderNickname: currentUserNickname,
        createdAt: new Date().toISOString(),
      };
      setMessages([...messages, newMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Room not found'}</p>
          <Link
            href="/main/rooms"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Back to Chats
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Chat Header */}
      <div className="border-b border-gray-200 bg-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 flex items-center justify-center text-white font-semibold text-sm">
            {room.roomName ? room.roomName.charAt(0).toUpperCase() : 'C'}
          </div>
          <div>
            <h2 className="font-semibold text-gray-800">
              {room.roomName || 'Direct Message'}
            </h2>
            <p className="text-xs text-gray-500">
              {room.memberCount} member{room.memberCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Link
          href="/main/rooms"
          className="text-gray-500 hover:text-gray-700 transition text-xl"
        >
          ✕
        </Link>
      </div>

      {/* Messages */}
      <MessageList
        messages={messages}
        currentUserNickname={currentUserNickname}
        isLoading={false}
      />

      {/* Input */}
      <ChatInput onSendMessage={handleSendMessage} />
    </div>
  );
}
