import { apiClient } from '@/shared/api/client';
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

    try {
      const response = await apiClient.get('/api/users/me');
      return response.data;
    } catch (error) {
      console.warn('getProfile: API 호출 실패, mock 데이터로 대체합니다');
      return mockUser;
    }
  },

  async updateProfile(data: UserUpdateRequest): Promise<UserResponse> {
    if (USE_MOCK) {
      return { ...mockUser, ...data };
    }

    try {
      const response = await apiClient.put('/api/users/update', data);
      return response.data;
    } catch (error) {
      console.warn('updateProfile: API 호출 실패, mock 데이터로 대체합니다');
      return { ...mockUser, ...data };
    }
  },

  async updatePassword(data: PasswordUpdateRequest): Promise<UserResponse> {
    if (USE_MOCK) {
      return mockUser;
    }

    try {
      const response = await apiClient.put('/api/users/update/password', data);
      return response.data;
    } catch (error) {
      console.warn('updatePassword: API 호출 실패, mock 데이터로 대체합니다');
      return mockUser;
    }
  },
};
