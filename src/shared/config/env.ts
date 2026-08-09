/**
 * Mock 전용 모드.
 * true 면 실제 API / WebSocket 을 아예 호출하지 않고 mockData 로만 동작한다.
 * 백엔드가 없어도 화면이 즉시 뜨고, 실패-대기 시간도 발생하지 않는다.
 */
export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

/** 실제 백엔드 오리진. next.config.ts 의 rewrites 프록시 대상이자 WebSocket 접속 대상. */
export const API_ORIGIN =
  process.env.NEXT_PUBLIC_API_ORIGIN || 'http://localhost:8080';

/**
 * axios baseURL.
 * 빈 문자열이면 same-origin 으로 요청 → next.config.ts 의 rewrites 가 API_ORIGIN 으로 프록시한다.
 * 배포 서버 CORS 허용 오리진에 프론트 주소가 없어도 동작하고,
 * RefreshToken 쿠키(SameSite=Strict)도 same-origin 이라 정상적으로 오간다.
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

/** STOMP 엔드포인트 — WebSocketConfig 의 registry.addEndpoint("/ws-talkie") */
export const WS_ENDPOINT = '/ws-talkie';

/**
 * WebSocket 접속 URL.
 * rewrites 프록시로는 WS 업그레이드가 보장되지 않아 백엔드로 직접 접속한다.
 * → 백엔드 app.cors.allowed-origins 에 프론트 오리진이 등록돼 있어야 한다.
 */
export const WS_URL = `${API_ORIGIN.replace(/^http/, 'ws')}${WS_ENDPOINT}`;
