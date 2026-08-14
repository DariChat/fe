import { create } from 'zustand';
import { TUTORIAL_STEPS } from './steps';
import { enterMockSession, exitMockSession } from '../lib/mockSession';

/**
 * 튜토리얼 진행 상태.
 *
 * 시작하면 예시 데이터를 얹고(mockSession), 끝나거나 건너뛰면 되돌린다.
 * "한 번 봤다"는 표시는 localStorage 에 남겨 다음 로그인 때 다시 뜨지 않게 한다.
 */

const SEEN_KEY = 'darichat.tutorial.seen';

const isBrowser = () => typeof window !== 'undefined';

export const hasSeenTutorial = (): boolean =>
  isBrowser() && localStorage.getItem(SEEN_KEY) === 'true';

const markSeen = () => {
  if (!isBrowser()) return;
  localStorage.setItem(SEEN_KEY, 'true');
};

/** 다시 보고 싶을 때 (프로필 화면 등에서 쓴다) */
export const forgetTutorial = () => {
  if (!isBrowser()) return;
  localStorage.removeItem(SEEN_KEY);
};

interface TutorialState {
  isActive: boolean;
  stepIndex: number;
  start: () => void;
  next: () => void;
  prev: () => void;
  /** 대상이 화면에 없는 단계를 건너뛸 때 오버레이가 쓴다 */
  skipTo: (index: number) => void;
  finish: () => void;
  abort: () => void;
}

export const useTutorialStore = create<TutorialState>((set, get) => ({
  isActive: false,
  stepIndex: 0,

  start() {
    if (get().isActive) return;

    enterMockSession();
    set({ isActive: true, stepIndex: 0 });
  },

  next() {
    const nextIndex = get().stepIndex + 1;

    if (nextIndex >= TUTORIAL_STEPS.length) {
      get().finish();
      return;
    }

    set({ stepIndex: nextIndex });
  },

  prev() {
    set((state) => ({ stepIndex: Math.max(0, state.stepIndex - 1) }));
  },

  /**
   * 대상이 화면에 없는 단계를 건너뛴다.
   * 범위를 벗어나면 (앞이든 뒤든) 안내를 끝낸다 — 같은 단계에 다시 머물면
   * "대상 없음 → 건너뛰기"가 제자리에서 반복된다.
   */
  skipTo(index) {
    if (index < 0 || index >= TUTORIAL_STEPS.length) {
      get().finish();
      return;
    }

    set({ stepIndex: index });
  },

  /** 끝까지 봤든 중간에 닫았든, 예시 데이터를 되돌리는 건 여기 한 곳이다 */
  finish() {
    if (!get().isActive) return;

    exitMockSession();
    markSeen();
    set({ isActive: false, stepIndex: 0 });
  },

  /**
   * 로그아웃처럼 화면이 통째로 사라질 때의 정리.
   * 사용자가 끝낸 게 아니므로 "봤음" 표시는 남기지 않는다 — 다음에 다시 안내한다.
   */
  abort() {
    if (!get().isActive) return;

    exitMockSession();
    set({ isActive: false, stepIndex: 0 });
  },
}));
