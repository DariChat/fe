import { apiClient, unwrap } from '@/shared/api/client';
import {
  LoginRequest,
  SignupRequest,
  TokenResponse,
  UserResponse,
} from '@/shared/types/api.types';
import { mockTokenResponse, mockUser } from '@/shared/api/mockData';
import { USE_MOCK } from '@/shared/config/env';
import { useRoomsStore } from '@/features/rooms/model/roomsStore';

/** refreshToken 은 HttpOnly 쿠키로만 관리된다 (바디에는 null 이 온다) */
const saveTokens = (data: TokenResponse) => {
  localStorage.setItem('accessToken', data.accessToken);
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

    const response = await apiClient.post('/api/auth/signup', data);
    return unwrap<UserResponse>(response);
  },

  async login(data: LoginRequest): Promise<TokenResponse> {
    if (USE_MOCK) {
      saveTokens(mockTokenResponse);
      localStorage.setItem('userNickname', mockUser.nickname);
      return mockTokenResponse;
    }

    const response = await apiClient.post('/api/auth/login', data);
    const token = unwrap<TokenResponse>(response);
    saveTokens(token);

    // 내 메시지 판별에 닉네임이 필요하므로 로그인 직후 프로필을 함께 받아둔다
    const profile = await apiClient.get('/api/users/me');
    localStorage.setItem('userNickname', unwrap<UserResponse>(profile).nickname);

    return token;
  },

  async reissue(): Promise<TokenResponse> {
    if (USE_MOCK) {
      saveTokens(mockTokenResponse);
      return mockTokenResponse;
    }

    const response = await apiClient.post('/api/auth/reissue');
    const token = unwrap<TokenResponse>(response);
    saveTokens(token);
    return token;
  },

  async logout(): Promise<void> {
    if (!USE_MOCK) {
      try {
        await apiClient.post('/api/auth/logout');
      } catch {
        console.warn('로그아웃 요청 실패, 로컬 저장소만 정리합니다');
      }
    }

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userNickname');

    // 페이지 이동만으로는 메모리에 남은 방 목록이 지워지지 않아
    // 다른 계정으로 로그인하면 이전 사용자의 목록이 잠깐 보인다
    useRoomsStore.getState().reset();
  },
};
