import { apiClient, unwrap } from '@/shared/api/client';
import {
  PasswordUpdateRequest,
  UserResponse,
  UserUpdateRequest,
} from '@/shared/types/api.types';
import { mockUser } from '@/shared/api/mockData';
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
};
