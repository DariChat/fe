'use client';

import { useState } from 'react';

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
      className="border-t border-gray-200 bg-white p-3 md:p-4 pb-safe-2 md:pb-4 shrink-0"
    >
      <div className="flex gap-2 md:gap-3">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="메시지를 입력하세요..."
          disabled={isSending || isLoading}
          maxLength={500}
          className="flex-1 min-w-0 px-4 py-3 text-base border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition disabled:bg-gray-50"
        />
        <button
          type="submit"
          disabled={!message.trim() || isSending || isLoading}
          aria-label="전송"
          className="shrink-0 px-4 md:px-6 py-3 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white rounded-full font-semibold hover:shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSending ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              {/* 좁은 화면에서는 아이콘만 남겨 입력창 폭을 확보한다 */}
              <span className="hidden md:inline">전송 중</span>
            </>
          ) : (
            <>
              <span className="hidden md:inline">전송</span>
              <span>➤</span>
            </>
          )}
        </button>
      </div>
      <p className="hidden md:block text-xs text-gray-400 mt-2">
        {message.length}/500자
      </p>
    </form>
  );
}
