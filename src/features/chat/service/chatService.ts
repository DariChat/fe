import { apiClient } from '@/shared/api/client';
import { MessageResponse } from '@/shared/types/api.types';
import { getMockMessages } from '@/shared/api/mockData';
import { USE_MOCK } from '@/shared/config/env';

export const chatService = {
  async getMessages(
    roomId: number,
    cursor?: number,
    size: number = 30
  ): Promise<MessageResponse[]> {
    if (USE_MOCK) {
      return getMockMessages(roomId).slice(-size);
    }

    try {
      const params = new URLSearchParams();
      if (cursor) params.append('cursor', cursor.toString());
      params.append('size', size.toString());

      const response = await apiClient.get(`/api/rooms/${roomId}/messages`, {
        params,
      });
      return response.data;
    } catch (error) {
      console.warn('getMessages: API 호출 실패, mock 데이터로 대체합니다');
      return getMockMessages(roomId);
    }
  },
};
