import { apiClient, unwrap } from '@/shared/api/client';
import {
  PasswordUpdateRequest,
  UserResponse,
  UserUpdateRequest,
} from '@/shared/types/api.types';
import { mockUser } from '@/shared/api/mockData';
import { USE_MOCK } from '@/shared/config/env';

export const userService = {
  async getProfile(): Promise<UserResponse> {
    if (USE_MOCK) {
      return mockUser;
    }

    const response = await apiClient.get('/api/users/me');
    return unwrap<UserResponse>(response);
  },

  async updateProfile(data: UserUpdateRequest): Promise<UserResponse> {
    if (USE_MOCK) {
      return { ...mockUser, ...data };
    }

    const response = await apiClient.put('/api/users/update', data);
    const user = unwrap<UserResponse>(response);
    localStorage.setItem('userNickname', user.nickname);
    return user;
  },

  async updatePassword(data: PasswordUpdateRequest): Promise<UserResponse> {
    if (USE_MOCK) {
      return mockUser;
    }

    const response = await apiClient.put('/api/users/update/password', data);
    return unwrap<UserResponse>(response);
  },
};
