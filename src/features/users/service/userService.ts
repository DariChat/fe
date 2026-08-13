import { apiClient, unwrap } from '@/shared/api/client';
import {
  PasswordUpdateRequest,
  UserResponse,
  UserSearchResponse,
  UserUpdateRequest,
} from '@/shared/types/api.types';
import { mockUser, searchMockUsers } from '@/shared/api/mockData';
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
};

/** 다음 페이지 커서 — 서버가 닉네임 기준으로 페이징한다 */
export const toUserCursor = (
  users: UserSearchResponse[]
): string | undefined => users[users.length - 1]?.nickname;
