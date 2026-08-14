import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';
import { API_BASE_URL } from '@/shared/config/env';
import { ApiResponse, ErrorResponse } from '@/shared/types/api.types';
import { clearCurrentUser } from '@/shared/lib/currentUser';
import {
  clearAccessToken,
  readAccessToken,
  saveAccessToken,
} from '@/shared/lib/authToken';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

/** 재발급 자체가 401 이면 다시 재발급을 시도하지 않도록 제외한다 */
const AUTH_ENDPOINTS = [
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/reissue',
  '/api/auth/verify-email',
  '/api/auth/resend-verification',
];

/** { success, data } 래퍼를 벗겨 data 만 돌려준다 */
export const unwrap = <T>(response: AxiosResponse<ApiResponse<T>>): T =>
  response.data.data;

/** ErrorResponse 에서 사용자에게 보여줄 메시지를 뽑는다 */
export const toErrorMessage = (error: unknown, fallback: string): string => {
  const detail = (error as AxiosError<ErrorResponse>)?.response?.data?.error;
  return detail?.message || fallback;
};

/** ErrorResponse 의 서버 에러 코드 (AUTH_006 등). 화면 분기에 쓴다. */
export const toErrorCode = (error: unknown): string | undefined =>
  (error as AxiosError<ErrorResponse>)?.response?.data?.error?.code;

/** 이미 사라진 리소스인지 — 취소하려는 요청을 상대가 먼저 처리한 경우 등 */
export const isNotFound = (error: unknown): boolean =>
  (error as AxiosError)?.response?.status === 404;

apiClient.interceptors.request.use((config) => {
  const token = readAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (typeof error.config & { _retry?: boolean })
      | undefined;

    const isRetryable =
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !AUTH_ENDPOINTS.some((path) => originalRequest.url?.includes(path));

    if (!isRetryable) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      // 인터셉터 재진입을 피하려고 별도 axios 인스턴스로 호출한다
      const response = await axios.post<ApiResponse<{ accessToken: string }>>(
        `${API_BASE_URL}/api/auth/reissue`,
        {},
        { withCredentials: true }
      );

      const { accessToken } = response.data.data;
      saveAccessToken(accessToken);

      apiClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      clearAccessToken();
      clearCurrentUser();
      window.location.href = '/auth/login';
      return Promise.reject(refreshError);
    }
  }
);
