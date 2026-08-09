import { apiClient, unwrap } from '@/shared/api/client';
import {
  RoomCreateRequest,
  RoomResponse,
  RoomSummaryResponse,
} from '@/shared/types/api.types';
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

    const response = await apiClient.post('/api/rooms', data);
    return unwrap<RoomResponse>(response);
  },

  /** 목록 응답은 RoomResponse 가 아니라 마지막 메시지/안읽은 수가 붙은 요약 DTO 다 */
  async getMyRooms(): Promise<RoomSummaryResponse[]> {
    if (USE_MOCK) {
      return mockRooms;
    }

    const response = await apiClient.get('/api/rooms');
    return unwrap<RoomSummaryResponse[]>(response);
  },

  async leaveRoom(roomId: number): Promise<void> {
    if (USE_MOCK) {
      return;
    }

    await apiClient.delete(`/api/rooms/${roomId}/leave`);
  },
};
