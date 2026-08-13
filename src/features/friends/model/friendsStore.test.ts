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

  it('친구 요청을 보내면 검색 결과 버튼용으로 상대 id 를 기억한다', async () => {
    await useFriendsStore.getState().sendRequest(24);

    expect(useFriendsStore.getState().requestedUserIds).toContain(24);
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
      friend: { userId: 24, nickname: '수아', profileImageUrl: null },
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

      const { friends, requestedUserIds } = useFriendsStore.getState();
      expect(friends.some((friend) => friend.userId === 24)).toBe(true);
      expect(requestedUserIds).not.toContain(24);
    });
  });
});
