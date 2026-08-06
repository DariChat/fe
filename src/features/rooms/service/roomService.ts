import { apiClient } from '@/shared/api/client';
import { RoomCreateRequest, RoomResponse } from '@/shared/types/api.types';

export const roomService = {
  async createRoom(data: RoomCreateRequest): Promise<RoomResponse> {
    const response = await apiClient.post('/api/rooms', data);
    return response.data;
  },

  async getMyRooms(): Promise<RoomResponse[]> {
    const response = await apiClient.get('/api/rooms');
    return response.data;
  },

  async leaveRoom(roomId: number): Promise<void> {
    await apiClient.delete(`/api/rooms/${roomId}/leave`);
  },
};
