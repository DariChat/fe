import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';
import { API_BASE_URL } from '@/shared/config/env';
import { ApiResponse, ErrorResponse } from '@/shared/types/api.types';

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
];

const getAccessToken = (): string | null =>
  typeof window === 'undefined' ? null : localStorage.getItem('accessToken');

/** { success, data } 래퍼를 벗겨 data 만 돌려준다 */
export const unwrap = <T>(response: AxiosResponse<ApiResponse<T>>): T =>
  response.data.data;

/** ErrorResponse 에서 사용자에게 보여줄 메시지를 뽑는다 */
export const toErrorMessage = (error: unknown, fallback: string): string => {
  const detail = (error as AxiosError<ErrorResponse>)?.response?.data?.error;
  return detail?.message || fallback;
};

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
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
      localStorage.setItem('accessToken', accessToken);

      apiClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userNickname');
      window.location.href = '/auth/login';
      return Promise.reject(refreshError);
    }
  }
);
