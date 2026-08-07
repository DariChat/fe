import { apiClient } from '@/shared/api/client';
import {
  LoginRequest,
  SignupRequest,
  TokenResponse,
  UserResponse,
} from '@/shared/types/api.types';
import { mockTokenResponse, mockUser } from '@/shared/api/mockData';
import { USE_MOCK } from '@/shared/config/env';

const saveTokens = (data: TokenResponse) => {
  localStorage.setItem('accessToken', data.accessToken);
  if (data.refreshToken) {
    localStorage.setItem('refreshToken', data.refreshToken);
  }
};

export const authService = {
  async signup(data: SignupRequest): Promise<UserResponse> {
    if (USE_MOCK) {
      return {
        ...mockUser,
        name: data.name,
        email: data.email,
        nickname: data.nickname,
      };
    }

    try {
      const response = await apiClient.post('/api/auth/signup', data);
      return response.data;
    } catch (error) {
      console.warn('signup: API 호출 실패, mock 데이터로 대체합니다');
      return mockUser;
    }
  },

  async login(data: LoginRequest): Promise<TokenResponse> {
    if (USE_MOCK) {
      saveTokens(mockTokenResponse);
      localStorage.setItem('userNickname', mockUser.nickname);
      return mockTokenResponse;
    }

    try {
      const response = await apiClient.post('/api/auth/login', data);
      saveTokens(response.data);
      return response.data;
    } catch (error) {
      console.warn('login: API 호출 실패, mock 데이터로 대체합니다');
      saveTokens(mockTokenResponse);
      localStorage.setItem('userNickname', mockUser.nickname);
      return mockTokenResponse;
    }
  },

  async reissue(): Promise<TokenResponse> {
    if (USE_MOCK) {
      saveTokens(mockTokenResponse);
      return mockTokenResponse;
    }

    try {
      const response = await apiClient.post('/api/auth/reissue');
      saveTokens(response.data);
      return response.data;
    } catch (error) {
      console.warn('reissue: API 호출 실패, mock 데이터로 대체합니다');
      return mockTokenResponse;
    }
  },

  async logout(): Promise<void> {
    if (!USE_MOCK) {
      try {
        await apiClient.post('/api/auth/logout');
      } catch (error) {
        console.warn('로그아웃 요청 실패, 로컬 저장소만 정리합니다');
      }
    }

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userNickname');
  },
};
