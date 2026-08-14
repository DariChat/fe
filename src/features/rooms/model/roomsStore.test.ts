import { RoomEventType, RoomType } from '@/shared/types/api.types';
import { mockRooms } from '@/shared/api/mockData';
import { roomService } from '../service/roomService';
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

  it('이미 있는 방을 다시 만들면 마지막 메시지·안읽음이 지워지지 않는다', async () => {
    await store().fetchRooms({ force: true });
    const existing = store().rooms.find((r) => r.lastMessage)!;

    // 서버는 같은 1:1 방을 새로 만들지 않고 기존 방을 그대로 돌려준다
    jest
      .spyOn(roomService, 'createRoom')
      .mockResolvedValueOnce({
        roomId: existing.roomId,
        roomName: existing.roomName,
        roomType: RoomType.DIRECT,
        memberCount: existing.memberCount,
        alreadyExists: true,
      });

    await store().createRoom({
      roomType: RoomType.DIRECT,
      memberIds: [2],
    });

    expect(store().rooms[0]).toMatchObject({
      roomId: existing.roomId,
      lastMessage: existing.lastMessage,
      unreadCount: existing.unreadCount,
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

  it('ROOM_UPDATED 푸시는 서버가 준 요약으로 갈아끼우고 맨 앞으로 올린다', async () => {
    await store().fetchRooms({ force: true });
    const target = store().rooms[store().rooms.length - 1];

    store().applyRoomEvent({
      type: RoomEventType.ROOM_UPDATED,
      room: { ...target, lastMessage: '안 보던 방에 온 메시지', unreadCount: 3 },
    });

    expect(store().rooms[0]).toMatchObject({
      roomId: target.roomId,
      lastMessage: '안 보던 방에 온 메시지',
      unreadCount: 3,
    });
    // 갈아끼운 것이지 새로 추가한 것이 아니다
    expect(
      store().rooms.filter((r) => r.roomId === target.roomId)
    ).toHaveLength(1);
  });

  it('ROOM_CREATED 푸시는 목록에 없던 방을 추가한다', async () => {
    await store().fetchRooms({ force: true });
    const before = store().rooms.length;

    store().applyRoomEvent({
      type: RoomEventType.ROOM_CREATED,
      room: {
        roomId: 987654,
        roomName: '초대받은 방',
        lastMessage: null,
        lastMessageAt: null,
        memberCount: 3,
        unreadCount: 0,
      },
    });

    expect(store().rooms).toHaveLength(before + 1);
    expect(store().rooms[0].roomId).toBe(987654);
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
