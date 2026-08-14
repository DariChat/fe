import {
  mockFriendRequests,
  mockFriends,
  mockRooms,
} from '@/shared/api/mockData';
import {
  freezeRemoteData,
  isRemoteDataFrozen,
  unfreezeRemoteData,
} from '@/shared/lib/remoteData';
import { useRoomsStore } from '@/features/rooms/model/roomsStore';
import { useFriendsStore } from '@/features/friends/model/friendsStore';

/**
 * 튜토리얼용 예시 데이터 주입.
 *
 * 갓 가입한 사람은 채팅방도 친구도 하나 없어서, 실제 데이터 위에서 안내하면
 * 정작 설명할 대상이 화면에 없다. 그래서 튜토리얼이 도는 동안만 목록 스토어에
 * 예시 데이터를 얹고, 끝나면 원래 상태로 되돌린 뒤 서버에서 다시 받는다.
 *
 * 되돌릴 상태는 여기 모듈 변수에 들고 있는다 — 스토어에 넣으면 예시 데이터와 함께
 * 화면에 새어 나갈 수 있고, 튜토리얼은 한 번에 하나만 돌기 때문이다.
 */

interface Snapshot {
  rooms: Pick<
    ReturnType<typeof useRoomsStore.getState>,
    'rooms' | 'hasLoaded' | 'isLoading' | 'error'
  >;
  friends: Pick<
    ReturnType<typeof useFriendsStore.getState>,
    'friends' | 'requests' | 'hasLoaded' | 'isLoading' | 'error'
  >;
}

let snapshot: Snapshot | null = null;

export const enterMockSession = () => {
  // 이미 예시 데이터가 올라가 있다면 그 위에 또 얹어 원본을 잃지 않는다
  if (snapshot) return;

  const rooms = useRoomsStore.getState();
  const friends = useFriendsStore.getState();

  snapshot = {
    rooms: {
      rooms: rooms.rooms,
      hasLoaded: rooms.hasLoaded,
      isLoading: rooms.isLoading,
      error: rooms.error,
    },
    friends: {
      friends: friends.friends,
      requests: friends.requests,
      hasLoaded: friends.hasLoaded,
      isLoading: friends.isLoading,
      error: friends.error,
    },
  };

  // 주입보다 먼저 얼려야 진행 중이던 조회가 예시 데이터를 덮지 않는다
  freezeRemoteData();

  useRoomsStore.setState({
    rooms: mockRooms,
    hasLoaded: true,
    isLoading: false,
    error: '',
  });
  useFriendsStore.setState({
    friends: mockFriends,
    requests: mockFriendRequests,
    hasLoaded: true,
    isLoading: false,
    error: '',
  });
};

export const exitMockSession = () => {
  if (!snapshot) {
    // 주입한 적이 없어도 혹시 얼어 있으면 풀어준다 (안전장치)
    if (isRemoteDataFrozen()) unfreezeRemoteData();
    return;
  }

  useRoomsStore.setState(snapshot.rooms);
  useFriendsStore.setState(snapshot.friends);
  snapshot = null;

  unfreezeRemoteData();

  // 얼려 둔 동안 놓친 변화를 메운다 (실패해도 다음 주기 갱신이 다시 시도한다)
  void useRoomsStore.getState().fetchRooms({ force: true });
  void useFriendsStore.getState().fetchAll({ force: true });
};
