'use client';

import { useEffect, useRef } from 'react';
import { MessageResponse, PreferredLanguage } from '@/shared/types/api.types';
import { MessageItem } from './MessageItem';

interface MessageListProps {
  messages: MessageResponse[];
  currentUserNickname: string;
  myLanguage: PreferredLanguage;
  isLoading: boolean;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  onRetry?: (message: MessageResponse) => void;
}

export function MessageList({
  messages,
  currentUserNickname,
  myLanguage,
  isLoading,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  onRetry,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessage = messages[messages.length - 1];
  const lastMessageKey = lastMessage
    ? `${lastMessage.clientMessageId}-${lastMessage.id}`
    : '';

  useEffect(() => {
    // 이전 메시지를 위로 덧붙일 때는 스크롤을 내리지 않는다
    if (isLoadingMore) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lastMessageKey, isLoadingMore]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-line-strong border-t-accent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-ink-muted">메시지를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center px-6">
          <p className="font-medium">아직 대화가 없어요</p>
          <p className="text-sm text-ink-muted mt-1">
            첫 메시지를 보내보세요. 상대의 언어로 번역돼 전달됩니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    // flex-1 + min-h-0 이라야 부모(h-full flex-col) 안에서 메시지 영역만 스크롤된다
    <div className="flex flex-col flex-1 min-h-0 px-4 md:px-6 py-6 md:py-7 overflow-y-auto">
      {hasMore && onLoadMore && (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={isLoadingMore}
          className="self-center mb-4 px-4 py-1.5 text-sm font-medium text-ink-muted bg-surface-2 hover:bg-surface-3 rounded-full transition disabled:opacity-50"
        >
          {isLoadingMore ? '불러오는 중...' : '이전 메시지 더 보기'}
        </button>
      )}
      {messages.map((message) => (
        <MessageItem
          // 예전에 저장된 메시지는 clientMessageId 가 없을 수 있어 id 로 대체한다
          key={message.clientMessageId || `id-${message.id}`}
          message={message}
          isOwn={message.senderNickname === currentUserNickname}
          myLanguage={myLanguage}
          onRetry={onRetry}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
