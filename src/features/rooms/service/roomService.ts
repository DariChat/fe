import { apiClient } from '@/shared/api/client';
import { RoomCreateRequest, RoomResponse } from '@/shared/types/api.types';
import { mockRooms } from '@/shared/api/mockData';
import { USE_MOCK } from '@/shared/config/env';

const buildMockRoom = (data: RoomCreateRequest): RoomResponse => ({
  roomId: Date.now(),
  roomName: data.roomName || '새 채팅방',
  roomType: data.roomType,
  memberCount: data.memberIds.length + 1,
});

export const roomService = {
  async createRoom(data: RoomCreateRequest): Promise<RoomResponse> {
    if (USE_MOCK) {
      return buildMockRoom(data);
    }

    try {
      const response = await apiClient.post('/api/rooms', data);
      return response.data;
    } catch (error) {
      console.warn('createRoom: API 호출 실패, mock 데이터로 대체합니다');
      return buildMockRoom(data);
    }
  },

  async getMyRooms(): Promise<RoomResponse[]> {
    if (USE_MOCK) {
      return mockRooms;
    }

    try {
      const response = await apiClient.get('/api/rooms');
      return response.data;
    } catch (error) {
      console.warn('getMyRooms: API 호출 실패, mock 데이터로 대체합니다');
      return mockRooms;
    }
  },

  async leaveRoom(roomId: number): Promise<void> {
    if (USE_MOCK) {
      return;
    }

    try {
      await apiClient.delete(`/api/rooms/${roomId}/leave`);
    } catch (error) {
      console.warn('leaveRoom: API 호출 실패, mock 동작으로 대체합니다');
    }
  },
};
