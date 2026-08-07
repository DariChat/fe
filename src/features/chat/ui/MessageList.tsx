'use client';

import { useEffect, useRef } from 'react';
import { MessageResponse } from '@/shared/types/api.types';
import { MessageItem } from './MessageItem';

interface MessageListProps {
  messages: MessageResponse[];
  currentUserNickname: string;
  isLoading: boolean;
}

export function MessageList({
  messages,
  currentUserNickname,
  isLoading,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">메시지를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-500 text-lg">아직 대화가 없어요</p>
          <p className="text-gray-400 text-sm mt-2">첫 메시지를 보내보세요!</p>
        </div>
      </div>
    );
  }

  return (
    // flex-1 + min-h-0 이라야 부모(h-full flex-col) 안에서 메시지 영역만 스크롤된다
    <div className="flex flex-col flex-1 min-h-0 p-6 overflow-y-auto">
      {messages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          isOwn={message.senderNickname === currentUserNickname}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
