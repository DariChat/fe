import { chatService, toCursor } from './chatService';
import { mockMessagesByRoom } from '@/shared/api/mockData';

jest.mock('@/shared/api/client', () => ({
  apiClient: { get: jest.fn(), post: jest.fn() },
}));

describe('chatService (mock 모드)', () => {
  it('방마다 서로 다른 대화를 반환한다', async () => {
    const room1 = await chatService.getMessages(1);
    const room2 = await chatService.getMessages(2);

    expect(room1).not.toEqual(room2);
    expect(room1[0].content).toBe('안녕! 잘 지냈어?');
    expect(room2[0].content).toBe('이번 스프린트 회고 언제 할까요?');
  });

  it('mockRooms 의 방 4개 모두 대화가 준비되어 있다', async () => {
    for (const roomId of [1, 2, 3, 4]) {
      const messages = await chatService.getMessages(roomId);
      expect(messages.length).toBeGreaterThan(0);
    }
  });

  it('정의되지 않은 방은 빈 배열을 반환한다', async () => {
    expect(await chatService.getMessages(999)).toEqual([]);
  });

  it('size 만큼 최근 메시지만 잘라서 준다', async () => {
    const messages = await chatService.getMessages(1, undefined, 2);

    expect(messages).toHaveLength(2);
    expect(messages).toEqual(mockMessagesByRoom[1].slice(-2));
  });

  it('toCursor 는 가장 오래된 메시지의 createdAt/id 를 커서로 만든다', async () => {
    const messages = await chatService.getMessages(1);
    const oldest = messages[0];

    expect(toCursor(messages)).toEqual({
      createdAt: oldest.createdAt,
      id: oldest.id,
    });
  });

  it('메시지가 없으면 커서를 만들지 않는다', () => {
    expect(toCursor([])).toBeUndefined();
  });
});
