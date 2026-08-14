import {
  FriendEvent,
  FriendEventType,
  FriendshipStatus,
} from '@/shared/types/api.types';
import { useFriendsStore } from './friendsStore';
import { resetFriendMocks } from '../service/friendService';

// mock 모드로 동작시켜 실제 API 없이 스토어 흐름만 검증한다
jest.mock('@/shared/config/env', () => ({
  ...jest.requireActual('@/shared/config/env'),
  USE_MOCK: true,
}));

describe('useFriendsStore (mock 모드)', () => {
  beforeEach(() => {
    resetFriendMocks();
    useFriendsStore.getState().reset();
  });

  it('친구 목록과 받은 요청을 함께 불러온다', async () => {
    await useFriendsStore.getState().fetchAll();

    const { friends, requests, hasLoaded } = useFriendsStore.getState();
    expect(friends.length).toBeGreaterThan(0);
    expect(requests.length).toBeGreaterThan(0);
    expect(hasLoaded).toBe(true);
  });

  it('이미 불러왔으면 force 없이는 다시 부르지 않는다', async () => {
    await useFriendsStore.getState().fetchAll();
    useFriendsStore.setState({ friends: [] });

    await useFriendsStore.getState().fetchAll();

    expect(useFriendsStore.getState().friends).toHaveLength(0);
  });

  it('요청을 수락하면 요청 목록에서 빠지고 친구 목록에 들어간다', async () => {
    await useFriendsStore.getState().fetchAll();
    const target = useFriendsStore.getState().requests[0];

    await useFriendsStore.getState().acceptRequest(target.friendshipId);

    const { friends, requests } = useFriendsStore.getState();
    expect(
      requests.some((request) => request.friendshipId === target.friendshipId)
    ).toBe(false);
    expect(
      friends.some((friend) => friend.userId === target.requesterId)
    ).toBe(true);
  });

  it('요청을 거절하면 요청 목록에서만 빠진다', async () => {
    await useFriendsStore.getState().fetchAll();
    const before = useFriendsStore.getState().friends.length;
    const target = useFriendsStore.getState().requests[0];

    await useFriendsStore.getState().rejectRequest(target.friendshipId);

    const { friends, requests } = useFriendsStore.getState();
    expect(
      requests.some((request) => request.friendshipId === target.friendshipId)
    ).toBe(false);
    expect(friends).toHaveLength(before);
  });

  it('친구 요청을 보내면 취소할 수 있도록 friendshipId 까지 기억한다', async () => {
    await useFriendsStore.getState().sendRequest(24);

    expect(useFriendsStore.getState().sentRequests).toEqual([
      { userId: 24, friendshipId: expect.any(Number) },
    ]);
  });

  it('보낸 요청을 취소하면 기록에서 지워진다', async () => {
    await useFriendsStore.getState().sendRequest(24);

    await useFriendsStore.getState().cancelRequest(24);

    expect(useFriendsStore.getState().sentRequests).toHaveLength(0);
  });

  it('보낸 적 없는 상대를 취소하려 하면 아무 일도 하지 않는다', async () => {
    await expect(
      useFriendsStore.getState().cancelRequest(999)
    ).resolves.toBeUndefined();
  });

  describe('서버 푸시 이벤트 (/user/queue/friends)', () => {
    const receivedEvent: FriendEvent = {
      type: FriendEventType.REQUEST_RECEIVED,
      request: {
        friendshipId: 9001,
        requesterId: 77,
        requesterNickname: '지훈',
        requesterProfileImageUrl: null,
        status: FriendshipStatus.PENDING,
        createdAt: '2026-08-14T10:00:00',
      },
      friend: null,
    };

    const acceptedEvent: FriendEvent = {
      type: FriendEventType.REQUEST_ACCEPTED,
      request: null,
      // 수락 푸시에는 관계 id 가 담기지 않는다 (목록 조회에만 있다)
      friend: {
        friendshipId: null,
        userId: 24,
        nickname: '수아',
        profileImageUrl: null,
      },
    };

    it('요청이 도착하면 받은 요청 맨 앞에 꽂힌다', async () => {
      await useFriendsStore.getState().fetchAll();
      const before = useFriendsStore.getState().requests.length;

      useFriendsStore.getState().applyFriendEvent(receivedEvent);

      const { requests } = useFriendsStore.getState();
      expect(requests).toHaveLength(before + 1);
      expect(requests[0].friendshipId).toBe(9001);
    });

    it('같은 이벤트가 두 번 와도 목록이 불어나지 않는다', async () => {
      await useFriendsStore.getState().fetchAll();

      useFriendsStore.getState().applyFriendEvent(receivedEvent);
      useFriendsStore.getState().applyFriendEvent(receivedEvent);

      expect(
        useFriendsStore
          .getState()
          .requests.filter((request) => request.friendshipId === 9001)
      ).toHaveLength(1);
    });

    it('상대가 수락하면 친구 목록에 들어가고 요청함 표시가 풀린다', async () => {
      await useFriendsStore.getState().sendRequest(24);

      useFriendsStore.getState().applyFriendEvent(acceptedEvent);

      const { friends, sentRequests } = useFriendsStore.getState();
      expect(friends.some((friend) => friend.userId === 24)).toBe(true);
      expect(sentRequests.some((sent) => sent.userId === 24)).toBe(false);
    });
  });

  describe('친구 삭제', () => {
    it('삭제하면 친구 목록에서 빠진다', async () => {
      await useFriendsStore.getState().fetchAll();
      const target = useFriendsStore.getState().friends[0];

      await useFriendsStore.getState().removeFriend(target.userId);

      expect(
        useFriendsStore
          .getState()
          .friends.some((friend) => friend.userId === target.userId)
      ).toBe(false);
    });

    it('관계 id 를 모르는 친구(수락 푸시로 들어온 경우)도 목록을 다시 받아 삭제한다', async () => {
      await useFriendsStore.getState().fetchAll();
      const target = useFriendsStore.getState().friends[0];

      // 푸시로 들어온 친구처럼 friendshipId 를 비워 둔다
      useFriendsStore.setState({
        friends: [{ ...target, friendshipId: null }],
      });

      await useFriendsStore.getState().removeFriend(target.userId);

      expect(
        useFriendsStore
          .getState()
          .friends.some((friend) => friend.userId === target.userId)
      ).toBe(false);
    });

    it('목록에 없는 상대를 삭제하려 하면 아무 일도 하지 않는다', async () => {
      await expect(
        useFriendsStore.getState().removeFriend(999)
      ).resolves.toBeUndefined();
    });
  });

  describe('상호 요청 자동 수락', () => {
    it('상대가 이미 보낸 요청이 있으면 보낸 요청이 아니라 친구가 된다', async () => {
      await useFriendsStore.getState().fetchAll();
      const incoming = useFriendsStore.getState().requests[0];

      await useFriendsStore.getState().sendRequest(incoming.requesterId);

      const { friends, requests, sentRequests } = useFriendsStore.getState();
      expect(
        friends.some((friend) => friend.userId === incoming.requesterId)
      ).toBe(true);
      expect(
        requests.some((r) => r.friendshipId === incoming.friendshipId)
      ).toBe(false);
      expect(
        sentRequests.some((sent) => sent.userId === incoming.requesterId)
      ).toBe(false);
    });
  });
});
