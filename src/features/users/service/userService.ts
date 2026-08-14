import { apiClient, unwrap } from '@/shared/api/client';
import {
  PasswordUpdateRequest,
  UserRecommendationResponse,
  UserResponse,
  UserSearchResponse,
  UserUpdateRequest,
} from '@/shared/types/api.types';
import {
  mockUser,
  recommendMockUsers,
  searchMockUsers,
} from '@/shared/api/mockData';
import { USE_MOCK } from '@/shared/config/env';
import { cacheCurrentUser } from '@/shared/lib/currentUser';

export const userService = {
  async getProfile(): Promise<UserResponse> {
    if (USE_MOCK) {
      cacheCurrentUser(mockUser);
      return mockUser;
    }

    const response = await apiClient.get('/api/users/me');
    const user = unwrap<UserResponse>(response);
    cacheCurrentUser(user);
    return user;
  },

  async updateProfile(data: UserUpdateRequest): Promise<UserResponse> {
    if (USE_MOCK) {
      const user = { ...mockUser, ...data };
      cacheCurrentUser(user);
      return user;
    }

    const response = await apiClient.put('/api/users/update', data);
    const user = unwrap<UserResponse>(response);
    cacheCurrentUser(user);
    return user;
  },

  async updatePassword(data: PasswordUpdateRequest): Promise<UserResponse> {
    if (USE_MOCK) {
      return mockUser;
    }

    const response = await apiClient.put('/api/users/update/password', data);
    return unwrap<UserResponse>(response);
  },

  /**
   * 닉네임 부분일치 검색 (본인은 서버가 제외한다).
   * cursor 는 페이지의 마지막 유저 "닉네임" 문자열이다 — id 가 아니다.
   */
  async searchUsers(
    keyword: string,
    cursor?: string,
    size: number = 20
  ): Promise<UserSearchResponse[]> {
    if (USE_MOCK) {
      const found = searchMockUsers(keyword);
      const start = cursor
        ? found.findIndex((user) => user.nickname === cursor) + 1
        : 0;
      return found.slice(start, start + size);
    }

    const response = await apiClient.get('/api/users/search', {
      params: { keyword, size, ...(cursor && { cursor }) },
    });
    return unwrap<UserSearchResponse[]>(response);
  },

  /**
   * 홈 추천 유저 — 나와 다른 언어를 쓰고 아직 친구·요청 관계가 아닌 사람을 서버가 무작위로 고른다.
   *
   * 무작위라 커서를 쓸 수 없어서, 지금까지 받은 id 를 전부 넘겨 중복을 막는다.
   * 쿼리는 excludeIds=1&excludeIds=2 형태여야 한다 — axios 기본 직렬화(excludeIds[]=1)로는
   * 스프링이 List<Long> 에 바인딩하지 못해 직접 만든다.
   */
  async getRecommendations(
    excludeIds: number[] = [],
    size: number = 20
  ): Promise<UserRecommendationResponse[]> {
    if (USE_MOCK) {
      return recommendMockUsers(excludeIds, size);
    }

    const query = new URLSearchParams({ size: String(size) });
    excludeIds.forEach((id) => query.append('excludeIds', String(id)));

    const response = await apiClient.get(
      `/api/users/recommendations?${query.toString()}`
    );
    return unwrap<UserRecommendationResponse[]>(response);
  },
};

/** 다음 페이지 커서 — 서버가 닉네임 기준으로 페이징한다 */
export const toUserCursor = (
  users: UserSearchResponse[]
): string | undefined => users[users.length - 1]?.nickname;
