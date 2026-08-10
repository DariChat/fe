import '@testing-library/jest-dom';
import { useRoomsStore } from '@/features/rooms/model/roomsStore';

// 테스트는 항상 mock 모드로 동작시킨다 (실제 네트워크 호출 금지)
process.env.NEXT_PUBLIC_USE_MOCK = 'true';

beforeEach(() => {
  localStorage.clear();
  // 모듈 전역 상태라 테스트끼리 방 목록이 새어나가지 않게 초기화한다
  useRoomsStore.getState().reset();
});

if (!window.HTMLElement.prototype.scrollIntoView) {
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
}
