import { apiClient, unwrap } from '@/shared/api/client';
import { MessageCursor, MessageResponse } from '@/shared/types/api.types';
import { getMockMessages } from '@/shared/api/mockData';
import { USE_MOCK } from '@/shared/config/env';

export const chatService = {
  /**
   * 커서 기반 조회. 서버는 최신순(DESC)으로 내려주므로 화면에 쓰기 전에 뒤집어야 한다.
   * cursor 를 생략하면 최신 메시지부터, 주면 그 메시지 이전(더 오래된) 구간을 가져온다.
   */
  async getMessages(
    roomId: number,
    cursor?: MessageCursor,
    size: number = 30
  ): Promise<MessageResponse[]> {
    if (USE_MOCK) {
      return getMockMessages(roomId).slice(-size);
    }

    const response = await apiClient.get(`/api/rooms/${roomId}/messages`, {
      params: {
        size,
        // cursorCreatedAt/cursorId 는 반드시 함께 보내야 한다 (하나만 보내면 400)
        ...(cursor && {
          cursorCreatedAt: cursor.createdAt,
          cursorId: cursor.id,
        }),
      },
    });

    // 오래된 → 최신 순으로 뒤집어 화면 순서와 맞춘다
    return unwrap<MessageResponse[]>(response).reverse();
  },
};

/** 다음 페이지(더 오래된 메시지)를 부르기 위한 커서 — 화면상 가장 위 메시지 기준 */
export const toCursor = (
  messages: MessageResponse[]
): MessageCursor | undefined => {
  const oldest = messages[0];
  return oldest ? { createdAt: oldest.createdAt, id: oldest.id } : undefined;
};
