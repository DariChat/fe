'use client';

import { useState } from 'react';
import { SendIcon } from '@/shared/ui/icons';

interface ChatInputProps {
  onSendMessage: (content: string) => Promise<void>;
  isLoading?: boolean;
}

export function ChatInput({
  onSendMessage,
  isLoading = false,
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSending) return;

    setIsSending(true);
    try {
      await onSendMessage(message.trim());
      setMessage('');
    } catch (error) {
      console.error('메시지 전송에 실패했습니다:', error);
    } finally {
      setIsSending(false);
    }
  };

  // 대화방에서는 하단 탭바가 숨겨지므로 홈 인디케이터 여백을 입력창이 직접 확보한다
  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-line bg-surface px-3 md:px-5 pt-3.5 md:pt-4 pb-safe-3 md:pb-4 shrink-0"
    >
      <div className="flex items-end gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="메시지를 입력하세요"
          disabled={isSending || isLoading}
          maxLength={500}
          className="flex-1 min-w-0 h-11 px-4 text-base bg-surface-2 rounded-full placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-accent transition disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!message.trim() || isSending || isLoading}
          aria-label="전송"
          className="shrink-0 w-11 h-11 flex items-center justify-center bg-accent text-accent-fg rounded-full hover:bg-accent-hover active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {isSending ? (
            <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <SendIcon />
          )}
        </button>
      </div>

      {/* 글자 수는 한도가 가까워질 때만 알려준다 — 늘 떠 있으면 시선만 뺏는다 */}
      {message.length > 400 && (
        <p className="text-xs text-ink-subtle mt-2 text-right">
          {message.length}/500
        </p>
      )}
    </form>
  );
}
