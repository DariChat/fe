import { apiClient, unwrap } from '@/shared/api/client';
import {
  FriendRequestResponse,
  FriendResponse,
  FriendshipStatus,
} from '@/shared/types/api.types';
import { mockFriendRequests, mockFriends } from '@/shared/api/mockData';
import { USE_MOCK } from '@/shared/config/env';

/** mock 모드에서 요청/수락 결과가 화면에 남도록 메모리에 들고 있는다 */
let mockFriendState = [...mockFriends];
let mockRequestState = [...mockFriendRequests];
let mockFriendshipId = 900;

export const friendService = {
  async getFriends(): Promise<FriendResponse[]> {
    if (USE_MOCK) {
      return [...mockFriendState];
    }

    const response = await apiClient.get('/api/friends');
    return unwrap<FriendResponse[]>(response);
  },

  async getReceivedRequests(): Promise<FriendRequestResponse[]> {
    if (USE_MOCK) {
      return [...mockRequestState];
    }

    const response = await apiClient.get('/api/friends/requests/received');
    return unwrap<FriendRequestResponse[]>(response);
  },

  /**
   * 이미 같은 방향의 요청/친구 관계가 있으면 409 가 온다.
   * (상대가 나에게 보낸 요청이 있어도 서버는 별개 요청으로 만든다)
   */
  async sendRequest(addresseeId: number): Promise<FriendRequestResponse> {
    if (USE_MOCK) {
      return {
        friendshipId: mockFriendshipId++,
        requesterId: 0,
        requesterNickname: '나',
        requesterProfileImageUrl: null,
        status: FriendshipStatus.PENDING,
        createdAt: new Date().toISOString(),
      };
    }

    const response = await apiClient.post(
      `/api/friends/requests/${addresseeId}`
    );
    return unwrap<FriendRequestResponse>(response);
  },

  /** 서버 응답은 ApiResponse<Void> 라 data 가 비어 있다 (수락 결과는 목록 재조회로 확인한다) */
  async acceptRequest(friendshipId: number): Promise<void> {
    if (USE_MOCK) {
      const accepted = mockRequestState.find(
        (request) => request.friendshipId === friendshipId
      );
      mockRequestState = mockRequestState.filter(
        (request) => request.friendshipId !== friendshipId
      );

      if (accepted) {
        mockFriendState = [
          ...mockFriendState,
          {
            userId: accepted.requesterId,
            nickname: accepted.requesterNickname,
            profileImageUrl: accepted.requesterProfileImageUrl,
          },
        ];
        return;
      }

      throw new Error('요청을 찾을 수 없습니다');
    }

    await apiClient.patch(`/api/friends/requests/${friendshipId}/accept`);
  },

  /** 보낸 요청 취소와 받은 요청 거절이 같은 엔드포인트다 */
  async deleteRequest(friendshipId: number): Promise<void> {
    if (USE_MOCK) {
      mockRequestState = mockRequestState.filter(
        (request) => request.friendshipId !== friendshipId
      );
      return;
    }

    await apiClient.delete(`/api/friends/requests/${friendshipId}`);
  },
};

/** 테스트에서 mock 상태를 되돌리기 위한 도우미 */
export const resetFriendMocks = () => {
  mockFriendState = [...mockFriends];
  mockRequestState = [...mockFriendRequests];
};
