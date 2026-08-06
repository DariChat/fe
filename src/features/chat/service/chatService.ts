import { apiClient } from '@/shared/api/client';
import { MessageResponse } from '@/shared/types/api.types';

export const chatService = {
  async getMessages(
    roomId: number,
    cursor?: number,
    size: number = 30
  ): Promise<MessageResponse[]> {
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor.toString());
    params.append('size', size.toString());

    const response = await apiClient.get(`/api/rooms/${roomId}/messages`, {
      params,
    });
    return response.data;
  },
};
