/**
 * accessToken 보관소.
 *
 * refreshToken 은 HttpOnly 쿠키라 브라우저가 알아서 들고 다니고,
 * accessToken 만 localStorage 에 둔다.
 *
 * 읽는 곳이 REST 인터셉터·WebSocket·화면 가드로 흩어져 있어서 키를 여기 한 곳에 모았다.
 * 특히 WebSocket 은 재연결할 때마다 "지금" 값을 다시 읽어야 한다 —
 * REST 쪽에서 재발급된 새 토큰을 소켓이 모르면 계속 거절당한다.
 */

const ACCESS_TOKEN_KEY = 'accessToken';

const isBrowser = () => typeof window !== 'undefined';

export const readAccessToken = (): string | null =>
  isBrowser() ? localStorage.getItem(ACCESS_TOKEN_KEY) : null;

export const saveAccessToken = (token: string) => {
  if (!isBrowser()) return;
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
};

export const clearAccessToken = () => {
  if (!isBrowser()) return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
};
