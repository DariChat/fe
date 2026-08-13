import { act, render } from '@testing-library/react';
import { useAutoRefresh } from './useAutoRefresh';

function Probe({ refresh }: { refresh: () => void }) {
  useAutoRefresh(refresh, { intervalMs: 1000 });
  return null;
}

const setVisibility = (state: 'visible' | 'hidden') => {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => state,
  });
};

describe('useAutoRefresh', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    setVisibility('visible');
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('화면에 들어오면 곧바로 한 번 불러온다', () => {
    const refresh = jest.fn();

    render(<Probe refresh={refresh} />);

    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('보고 있는 동안 주기적으로 다시 불러온다', () => {
    const refresh = jest.fn();
    render(<Probe refresh={refresh} />);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(refresh).toHaveBeenCalledTimes(3); // 최초 1 + 2회
  });

  it('탭이 숨겨져 있으면 주기 갱신을 건너뛴다', () => {
    const refresh = jest.fn();
    render(<Probe refresh={refresh} />);
    setVisibility('hidden');

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(refresh).toHaveBeenCalledTimes(1); // 최초 1회뿐
  });

  it('창이 다시 활성화되면 불러온다', () => {
    const refresh = jest.fn();
    render(<Probe refresh={refresh} />);

    act(() => {
      window.dispatchEvent(new Event('focus'));
    });

    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it('화면을 벗어나면 타이머를 정리한다', () => {
    const refresh = jest.fn();
    const { unmount } = render(<Probe refresh={refresh} />);

    unmount();
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
