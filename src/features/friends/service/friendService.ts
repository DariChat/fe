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
   *
   * 상대가 나에게 보낸 PENDING 요청이 있으면 서버는 새 요청을 만들지 않고
   * 그 요청을 그 자리에서 수락한다 (200, status=ACCEPTED). 즉 응답의 status 를 보고
   * "요청 보냄"과 "바로 친구가 됨"을 갈라야 한다 — 호출부는 friendsStore 가 처리한다.
   */
  async sendRequest(addresseeId: number): Promise<FriendRequestResponse> {
    if (USE_MOCK) {
      // 상대가 이미 나에게 보낸 요청이 있으면 서버처럼 즉시 수락으로 답한다
      const reverse = mockRequestState.find(
        (request) => request.requesterId === addresseeId
      );
      if (reverse) {
        mockRequestState = mockRequestState.filter(
          (request) => request.friendshipId !== reverse.friendshipId
        );
        mockFriendState = [
          ...mockFriendState,
          {
            friendshipId: reverse.friendshipId,
            userId: reverse.requesterId,
            nickname: reverse.requesterNickname,
            profileImageUrl: reverse.requesterProfileImageUrl,
          },
        ];
        return { ...reverse, status: FriendshipStatus.ACCEPTED };
      }

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
            friendshipId: accepted.friendshipId,
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

  /**
   * 친구 관계 끊기.
   * 서버는 요청 취소·거절과 같은 엔드포인트로 처리한다 (PENDING 이면 요청 삭제,
   * ACCEPTED 면 관계 삭제). 호출부에서 의도가 드러나도록 이름만 따로 둔다.
   */
  async deleteFriend(friendshipId: number): Promise<void> {
    if (USE_MOCK) {
      mockFriendState = mockFriendState.filter(
        (friend) => friend.friendshipId !== friendshipId
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
