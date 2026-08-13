import { create } from 'zustand';
import { FriendRequestResponse, FriendResponse } from '@/shared/types/api.types';
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
      set({ error: toErrorMessage(err, '친구 정보를 불러오지 못했습니다') });
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
    set({ friends: await friendService.getFriends() });
  },

  async rejectRequest(friendshipId) {
    await friendService.deleteRequest(friendshipId);
    set((state) => ({
      requests: state.requests.filter(
        (request) => request.friendshipId !== friendshipId
      ),
    }));
  },

  reset() {
    set({ ...initialState });
  },
}));
