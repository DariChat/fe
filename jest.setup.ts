import '@testing-library/jest-dom';

// 테스트는 항상 mock 모드로 동작시킨다 (실제 네트워크 호출 금지)
process.env.NEXT_PUBLIC_USE_MOCK = 'true';

// jsdom 에는 없는 API 보충
beforeEach(() => {
  localStorage.clear();
});

if (!window.HTMLElement.prototype.scrollIntoView) {
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
}
