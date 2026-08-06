import { apiClient } from '@/shared/api/client';
import {
  PasswordUpdateRequest,
  UserResponse,
  UserUpdateRequest,
} from '@/shared/types/api.types';

export const userService = {
  async getProfile(): Promise<UserResponse> {
    const response = await apiClient.get('/api/users/me');
    return response.data;
  },

  async updateProfile(data: UserUpdateRequest): Promise<UserResponse> {
    const response = await apiClient.put('/api/users/update', data);
    return response.data;
  },

  async updatePassword(data: PasswordUpdateRequest): Promise<UserResponse> {
    const response = await apiClient.put('/api/users/update/password', data);
    return response.data;
  },
};
