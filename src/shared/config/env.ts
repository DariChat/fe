/**
 * Mock 전용 모드.
 * true 면 실제 API / WebSocket 을 아예 호출하지 않고 mockData 로만 동작한다.
 * 백엔드가 없어도 화면이 즉시 뜨고, 실패-대기 시간도 발생하지 않는다.
 */
export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8080';
