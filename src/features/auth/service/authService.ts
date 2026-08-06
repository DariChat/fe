import { apiClient } from '@/shared/api/client';
import {
  LoginRequest,
  SignupRequest,
  TokenResponse,
  UserResponse,
} from '@/shared/types/api.types';

export const authService = {
  async signup(data: SignupRequest): Promise<UserResponse> {
    const response = await apiClient.post('/api/auth/signup', data);
    return response.data;
  },

  async login(data: LoginRequest): Promise<TokenResponse> {
    const response = await apiClient.post('/api/auth/login', data);
    const { accessToken, refreshToken } = response.data;

    localStorage.setItem('accessToken', accessToken);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }

    return response.data;
  },

  async reissue(): Promise<TokenResponse> {
    const response = await apiClient.post('/api/auth/reissue');
    const { accessToken } = response.data;

    localStorage.setItem('accessToken', accessToken);

    return response.data;
  },

  async logout(): Promise<void> {
    await apiClient.post('/api/auth/logout');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },
};
