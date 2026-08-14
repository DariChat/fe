'use client';

import { useState } from 'react';
import {
  MessageResponse,
  PreferredLanguage,
  PublishStatus,
} from '@/shared/types/api.types';
import { Avatar } from '@/shared/ui/Avatar';

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
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`flex gap-2.5 max-w-[78%] lg:max-w-md ${isOwn ? 'flex-row-reverse' : ''}`}
      >
        {!isOwn && <Avatar nickname={message.senderNickname} size="xs" />}

        <div className={isOwn ? 'text-right' : ''}>
          {!isOwn && (
            <p className="text-xs text-ink-muted font-medium mb-1 px-1">
              {message.senderNickname}
            </p>
          )}
          {/*
            w-fit 이 없으면 말풍선이 열 너비(= 시각·"번역됨 ·" 같은 아래 줄 중 가장 긴 것)까지
            늘어나서 두 글자 메시지에도 빈 공간이 크게 남는다.
            내 메시지는 열 안에서 오른쪽 끝에 붙여야 꼬리 위치가 맞는다.
          */}
          <div
            className={`px-3.5 py-2 break-words w-fit max-w-full ${isOwn ? 'ml-auto' : ''} ${
              isOwn
                ? 'bg-accent text-accent-fg rounded-2xl rounded-br-md'
                : 'bg-bubble-in text-bubble-in-ink rounded-2xl rounded-bl-md'
            } ${isPending ? 'opacity-60' : ''} ${isFailed ? 'ring-2 ring-danger' : ''}`}
          >
            <p className="text-[15px] leading-relaxed">{body}</p>
          </div>

          {translated && (
            <button
              type="button"
              onClick={() => setShowOriginal((prev) => !prev)}
              aria-expanded={showOriginal}
              className="text-[11px] text-accent-ink hover:underline mt-1 px-1"
            >
              {showOriginal ? '번역문 보기' : '원문 보기'}
            </button>
          )}

          <p className="text-[11px] text-ink-subtle mt-1 px-1">
            {isPending && '전송 중 · '}
            {translated && !showOriginal && '번역됨 · '}
            {formatTime(message.createdAt)}
          </p>
          {isFailed && (
            <button
              type="button"
              onClick={() => onRetry?.(message)}
              className="text-xs text-danger hover:underline mt-1 px-1"
            >
              전송 실패 · 다시 시도
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
