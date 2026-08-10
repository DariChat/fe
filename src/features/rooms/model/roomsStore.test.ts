import { RoomType } from '@/shared/types/api.types';
import { mockRooms } from '@/shared/api/mockData';
import { useRoomsStore } from './roomsStore';

const store = () => useRoomsStore.getState();

describe('roomsStore (mock 모드)', () => {
  it('fetchRooms 는 한 번만 실제로 조회한다', async () => {
    await store().fetchRooms();
    expect(store().rooms).toHaveLength(mockRooms.length);

    store().leaveRoom(mockRooms[0].roomId);
    await store().fetchRooms();

    // 이미 받아온 뒤라면 다시 부르지 않으므로 방금 지운 방이 되살아나지 않는다
    expect(store().rooms.some((r) => r.roomId === mockRooms[0].roomId)).toBe(
      false
    );
  });

  it('force 를 주면 서버 상태로 다시 맞춘다', async () => {
    await store().fetchRooms();
    await store().leaveRoom(mockRooms[0].roomId);
    await store().fetchRooms({ force: true });

    expect(store().rooms).toHaveLength(mockRooms.length);
  });

  it('createRoom 은 새 방을 목록 맨 앞에 넣는다', async () => {
    await store().fetchRooms();

    const created = await store().createRoom({
      roomName: '스터디',
      roomType: RoomType.GROUP,
      memberIds: [2, 3],
    });

    expect(store().rooms[0]).toMatchObject({
      roomId: created.roomId,
      roomName: '스터디',
      lastMessage: null,
      unreadCount: 0,
    });
  });

  it('leaveRoom 은 목록에서 방을 제거한다', async () => {
    await store().fetchRooms();
    const target = store().rooms[0].roomId;

    await store().leaveRoom(target);

    expect(store().rooms.some((r) => r.roomId === target)).toBe(false);
  });

  it('markRoomRead 는 해당 방의 안읽음 배지를 지운다', async () => {
    await store().fetchRooms();
    const unread = store().rooms.find((r) => r.unreadCount > 0)!;

    store().markRoomRead(unread.roomId);

    expect(
      store().rooms.find((r) => r.roomId === unread.roomId)!.unreadCount
    ).toBe(0);
  });

  it('applyMessagePreview 는 마지막 메시지 미리보기를 갱신한다', async () => {
    await store().fetchRooms();
    const roomId = store().rooms[0].roomId;
    const createdAt = new Date().toISOString();

    store().applyMessagePreview(roomId, { content: '방금 온 메시지', createdAt });

    expect(store().rooms.find((r) => r.roomId === roomId)).toMatchObject({
      lastMessage: '방금 온 메시지',
      lastMessageAt: createdAt,
    });
  });
});
