import { create } from 'zustand';
import {
  FriendEvent,
  FriendEventType,
  FriendRequestResponse,
  FriendResponse,
} from '@/shared/types/api.types';
import { toErrorMessage } from '@/shared/api/client';
import { friendService } from '../service/friendService';

/**
 * 친구 목록과 받은 요청은 화면 세 곳(친구 탭·요청 탭·검색 탭)이 함께 본다.
 * 요청을 수락하면 요청 목록에서 빠지고 친구 목록에 들어가야 해서 한 곳에 모아둔다.
 */

interface FriendsState {
  friends: FriendResponse[];
  requests: FriendRequestResponse[];
  /** 이미 요청을 보낸 상대 — 검색 결과에서 버튼을 되돌리지 않으려고 기억한다 */
  requestedUserIds: number[];
  hasLoaded: boolean;
  isLoading: boolean;
  error: string;
  fetchAll: (options?: { force?: boolean }) => Promise<void>;
  sendRequest: (addresseeId: number) => Promise<void>;
  acceptRequest: (friendshipId: number) => Promise<void>;
  rejectRequest: (friendshipId: number) => Promise<void>;
  applyFriendEvent: (event: FriendEvent) => void;
  reset: () => void;
}

const initialState = {
  friends: [] as FriendResponse[],
  requests: [] as FriendRequestResponse[],
  requestedUserIds: [] as number[],
  hasLoaded: false,
  isLoading: false,
  error: '',
};

export const useFriendsStore = create<FriendsState>((set, get) => ({
  ...initialState,

  async fetchAll({ force = false } = {}) {
    if (get().hasLoaded && !force) {
      return;
    }

    // 이미 목록이 있는 상태의 새로고침은 화면을 로딩으로 되돌리지 않는다
    set({ isLoading: !get().hasLoaded, error: '' });

    try {
      const [friends, requests] = await Promise.all([
        friendService.getFriends(),
        friendService.getReceivedRequests(),
      ]);
      set({ friends, requests, hasLoaded: true });
    } catch (err) {
      // 주기적 갱신이 한 번 실패했다고 이미 보고 있던 목록을 에러 화면으로 덮지 않는다
      if (get().hasLoaded) {
        console.warn('친구 정보 갱신 실패, 이전 목록을 유지합니다', err);
      } else {
        set({ error: toErrorMessage(err, '친구 정보를 불러오지 못했습니다') });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  async sendRequest(addresseeId) {
    await friendService.sendRequest(addresseeId);
    set((state) => ({
      requestedUserIds: [...state.requestedUserIds, addresseeId],
    }));
  },

  /** 수락하면 서버가 친구 관계를 만들므로 목록을 다시 받아 화면을 맞춘다 */
  async acceptRequest(friendshipId) {
    await friendService.acceptRequest(friendshipId);
    set((state) => ({
      requests: state.requests.filter(
        (request) => request.friendshipId !== friendshipId
      ),
    }));

    /*
     * 여기서 던지면 수락은 이미 성공했는데도 화면에는 실패로 보인다.
     * 친구 목록 갱신은 덤이므로 실패해도 수락 자체는 성공으로 남긴다.
     */
    try {
      set({ friends: await friendService.getFriends() });
    } catch {
      console.warn('친구 목록 갱신에 실패했습니다. 다음 조회 때 반영됩니다.');
    }
  },

  async rejectRequest(friendshipId) {
    await friendService.deleteRequest(friendshipId);
    set((state) => ({
      requests: state.requests.filter(
        (request) => request.friendshipId !== friendshipId
      ),
    }));
  },

  /**
   * /user/queue/friends 로 밀려온 변화를 반영한다.
   *
   * 같은 이벤트가 두 번 와도(재연결 직후 등) 목록이 불어나지 않도록
   * friendshipId · userId 로 이미 있는지 보고 넣는다.
   */
  applyFriendEvent(event) {
    if (event.type === FriendEventType.REQUEST_RECEIVED && event.request) {
      const request = event.request;
      set((state) =>
        state.requests.some((r) => r.friendshipId === request.friendshipId)
          ? state
          : { requests: [request, ...state.requests] }
      );
      return;
    }

    if (event.type === FriendEventType.REQUEST_ACCEPTED && event.friend) {
      const friend = event.friend;
      set((state) => ({
        friends: state.friends.some((f) => f.userId === friend.userId)
          ? state.friends
          : [...state.friends, friend],
        // 이제 친구가 됐으니 검색 결과의 '요청함' 표시를 붙들고 있을 이유가 없다
        requestedUserIds: state.requestedUserIds.filter(
          (id) => id !== friend.userId
        ),
      }));
    }
  },

  reset() {
    set({ ...initialState });
  },
}));
