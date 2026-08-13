'use client';

import { useState } from 'react';
import {
  MessageResponse,
  PreferredLanguage,
  PublishStatus,
} from '@/shared/types/api.types';

interface MessageItemProps {
  message: MessageResponse;
  isOwn: boolean;
  /** 내 선호 언어 — translations 에서 보여줄 번역문을 고르는 기준 */
  myLanguage: PreferredLanguage;
  onRetry?: (message: MessageResponse) => void;
}

export function MessageItem({
  message,
  isOwn,
  myLanguage,
  onRetry,
}: MessageItemProps) {
  const [showOriginal, setShowOriginal] = useState(false);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  /*
   * 서버는 발행 직후 markPublished 를 하므로 브로드캐스트 시점의 publishStatus 는 PENDING 이다.
   * 즉 PENDING 을 "전송 중"으로 읽으면 안 된다. 아직 서버에 닿지 않은 낙관적 메시지는
   * 음수 임시 id 를 갖고 있으므로 그것으로 구분한다.
   */
  const isPending = message.id < 0;
  const isFailed = message.publishStatus === PublishStatus.FAILED;

  /*
   * 번역은 "보낸 사람의 언어를 뺀" 참여자 언어만 채워진다.
   * 내 언어 키가 없다 = 원문이 이미 내 언어이거나 번역이 실패한 경우라 원문을 그대로 보여준다.
   * 내가 보낸 메시지에는 내 언어 번역이 있을 수 없으므로 원문만 쓴다.
   */
  const translated = isOwn ? undefined : message.translations?.[myLanguage];
  const body = translated && !showOriginal ? translated : message.content;

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`flex gap-3 max-w-xs lg:max-w-md ${isOwn ? 'flex-row-reverse' : ''}`}
      >
        {!isOwn && (
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
            {message.senderNickname.charAt(0).toUpperCase()}
          </div>
        )}

        <div className={isOwn ? 'text-right' : ''}>
          {!isOwn && (
            <p className="text-xs text-gray-500 font-medium mb-1 px-1">
              {message.senderNickname}
            </p>
          )}
          <div
            className={`px-4 py-2 rounded-2xl break-words ${
              isOwn
                ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white'
                : 'bg-gray-100 text-gray-800'
            } ${isPending ? 'opacity-60' : ''} ${isFailed ? 'ring-2 ring-red-400' : ''}`}
          >
            <p className="text-sm">{body}</p>
          </div>

          {translated && (
            <button
              type="button"
              onClick={() => setShowOriginal((prev) => !prev)}
              aria-expanded={showOriginal}
              className="text-[11px] text-indigo-500 hover:text-indigo-600 mt-1 px-1 underline"
            >
              {showOriginal ? '번역문 보기' : '원문 보기'}
            </button>
          )}

          <p className="text-xs text-gray-400 mt-1 px-1">
            {isPending && '전송 중 · '}
            {translated && !showOriginal && '번역됨 · '}
            {formatTime(message.createdAt)}
          </p>
          {isFailed && (
            <button
              type="button"
              onClick={() => onRetry?.(message)}
              className="text-xs text-red-500 hover:text-red-600 mt-1 px-1 underline"
            >
              전송 실패 · 다시 시도
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
