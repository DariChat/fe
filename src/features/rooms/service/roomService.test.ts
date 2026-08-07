import { roomService } from './roomService';
import { mockRooms } from '@/shared/api/mockData';
import { RoomType } from '@/shared/types/api.types';
import { apiClient } from '@/shared/api/client';

jest.mock('@/shared/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('roomService (mock 모드)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getMyRooms 는 mock 방 목록을 반환한다', async () => {
    const rooms = await roomService.getMyRooms();

    expect(rooms).toEqual(mockRooms);
    expect(rooms).toHaveLength(4);
  });

  it('mock 모드에서는 실제 API 를 호출하지 않는다', async () => {
    await roomService.getMyRooms();
    await roomService.leaveRoom(1);

    expect(apiClient.get).not.toHaveBeenCalled();
    expect(apiClient.delete).not.toHaveBeenCalled();
  });

  it('createRoom 은 요청값을 반영한 방을 만들어준다', async () => {
    const room = await roomService.createRoom({
      roomName: 'QA 회의',
      roomType: RoomType.GROUP,
      memberIds: [2, 3],
    });

    expect(room.roomName).toBe('QA 회의');
    expect(room.roomType).toBe(RoomType.GROUP);
    // 본인 + 초대한 인원
    expect(room.memberCount).toBe(3);
  });

  it('roomName 이 없으면 기본 이름을 쓴다', async () => {
    const room = await roomService.createRoom({
      roomType: RoomType.DIRECT,
      memberIds: [2],
    });

    expect(room.roomName).toBe('새 채팅방');
  });
});
