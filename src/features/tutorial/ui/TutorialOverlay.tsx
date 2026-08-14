'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { CloseIcon } from '@/shared/ui/icons';
import {
  TUTORIAL_STEPS,
  TutorialPlacement,
  TutorialStep,
} from '../model/steps';
import { hasSeenTutorial, useTutorialStore } from '../model/tutorialStore';

/**
 * 화면을 어둡게 덮고 설명할 요소만 밝게 남긴 뒤, 그 옆에 말풍선으로 안내한다.
 *
 * 어둡게 만드는 건 스포트라이트 한 겹으로 끝낸다 — 대상 크기의 투명한 사각형에
 * 아주 큰 box-shadow 를 둘러 바깥 전체를 덮는 방식이라, 창 크기가 바뀌어도
 * 구멍과 딤이 어긋나지 않는다. 클릭 차단은 그 아래 깔아둔 판이 맡는다.
 */

const BUBBLE_WIDTH = 320;
/** 스포트라이트와 말풍선 사이 간격 */
const GAP = 14;
/** 화면 가장자리에서 최소한 띄울 여백 */
const MARGIN = 12;
/**
 * 화면 전환 직후엔 대상이 아직 없을 수 있어 잠깐 기다린다.
 * 이 시간 동안은 말풍선이 뜨지 않으므로 너무 길면 "안내가 사라진" 것처럼 보인다.
 */
const TARGET_WAIT_MS = 800;

interface SpotRect {
  top: number;
  left: number;
  width: number;
  height: number;
  radius: number;
}

/**
 * 같은 data-tour 이름을 데스크톱 사이드바와 모바일 탭바가 함께 달고 있을 수 있다.
 * 지금 화면에 실제로 그려진 쪽(크기가 있는 요소)을 고른다.
 */
const findTarget = (selector: string): HTMLElement | null => {
  const nodes = Array.from(document.querySelectorAll<HTMLElement>(selector));
  return (
    nodes.find((node) => {
      const rect = node.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }) ?? null
  );
};

const toSpotRect = (element: HTMLElement, step: TutorialStep): SpotRect => {
  const padding = step.padding ?? 8;
  const rect = element.getBoundingClientRect();

  return {
    top: rect.top - padding,
    left: rect.left - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
    radius: step.radius ?? 16,
  };
};

export function TutorialOverlay() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = useTutorialStore((state) => state.isActive);
  const stepIndex = useTutorialStore((state) => state.stepIndex);
  const start = useTutorialStore((state) => state.start);
  const next = useTutorialStore((state) => state.next);
  const prev = useTutorialStore((state) => state.prev);
  const skipTo = useTutorialStore((state) => state.skipTo);
  const finish = useTutorialStore((state) => state.finish);
  const abort = useTutorialStore((state) => state.abort);

  const step: TutorialStep | undefined = TUTORIAL_STEPS[stepIndex];
  const isLast = stepIndex === TUTORIAL_STEPS.length - 1;

  const [spot, setSpot] = useState<SpotRect | null>(null);
  const [bubble, setBubble] = useState<{
    top: number;
    left: number;
    placement: TutorialPlacement;
  } | null>(null);

  const bubbleRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLElement | null>(null);
  /** 대상이 없는 단계를 어느 방향으로 건너뛸지 (이전 버튼으로 왔으면 뒤로) */
  const directionRef = useRef<1 | -1>(1);

  // 첫 로그인이면 한 번 자동으로 띄운다
  useEffect(() => {
    if (!hasSeenTutorial()) {
      start();
    }
  }, [start]);

  // 화면이 통째로 사라지면(로그아웃 등) 예시 데이터를 반드시 되돌린다
  useEffect(() => () => abort(), [abort]);

  // 단계가 요구하는 화면으로 먼저 옮긴다
  useEffect(() => {
    if (!isActive || !step?.route) return;
    if (pathname !== step.route) {
      router.push(step.route);
    }
  }, [isActive, step, pathname, router]);

  const measure = useCallback(() => {
    const element = targetRef.current;
    if (!element || !step) return;

    setSpot(toSpotRect(element, step));
  }, [step]);

  // 대상 찾기 — 화면 전환 직후엔 아직 없을 수 있어 잠시 기다렸다가, 끝내 없으면 건너뛴다
  useEffect(() => {
    if (!isActive || !step) return;

    let frame = 0;
    let cancelled = false;
    const startedAt = performance.now();

    const look = () => {
      if (cancelled) return;

      const element = findTarget(step.target);
      if (element) {
        targetRef.current = element;
        // 목록 아래쪽 항목이면 화면 안으로 끌어와야 스포트라이트가 보인다
        element.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        setSpot(toSpotRect(element, step));
        return;
      }

      if (performance.now() - startedAt > TARGET_WAIT_MS) {
        skipTo(stepIndex + directionRef.current);
        return;
      }

      frame = requestAnimationFrame(look);
    };

    /*
     * 앞 단계의 스포트라이트도 함께 지운다.
     * 남겨두면 대상이 없는 단계(예: 모바일에 없는 요소)를 건너뛰는 동안
     * 엉뚱한 곳이 밝게 강조된 채 말풍선만 사라진 화면이 된다.
     */
    setBubble(null);
    setSpot(null);
    look();

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [isActive, step, stepIndex, pathname, skipTo]);

  // 창 크기·스크롤이 바뀌면 구멍도 따라가야 한다
  useEffect(() => {
    if (!isActive) return;

    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);

    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [isActive, measure]);

  // 말풍선 위치는 실제로 그려진 크기를 재고 나서 정한다
  useLayoutEffect(() => {
    if (!spot || !step) return;

    const node = bubbleRef.current;
    if (!node) return;

    const width = node.offsetWidth;
    const height = node.offsetHeight;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const fits = (placement: TutorialPlacement) => {
      switch (placement) {
        case 'right':
          return spot.left + spot.width + GAP + width <= viewportWidth - MARGIN;
        case 'left':
          return spot.left - GAP - width >= MARGIN;
        case 'top':
          return spot.top - GAP - height >= MARGIN;
        case 'bottom':
          return spot.top + spot.height + GAP + height <= viewportHeight - MARGIN;
      }
    };

    const order: TutorialPlacement[] = [
      step.placement ?? 'bottom',
      'bottom',
      'top',
      'right',
      'left',
    ];
    const placement = order.find(fits) ?? 'bottom';

    const clamp = (value: number, max: number) =>
      Math.min(Math.max(value, MARGIN), Math.max(MARGIN, max));

    let top: number;
    let left: number;

    if (placement === 'right' || placement === 'left') {
      left =
        placement === 'right'
          ? spot.left + spot.width + GAP
          : spot.left - GAP - width;
      top = spot.top + spot.height / 2 - height / 2;
    } else {
      top =
        placement === 'bottom'
          ? spot.top + spot.height + GAP
          : spot.top - GAP - height;
      left = spot.left + spot.width / 2 - width / 2;
    }

    setBubble({
      top: clamp(top, viewportHeight - height - MARGIN),
      left: clamp(left, viewportWidth - width - MARGIN),
      placement,
    });
  }, [spot, step]);

  const goNext = useCallback(() => {
    directionRef.current = 1;
    next();
  }, [next]);

  const goPrev = useCallback(() => {
    directionRef.current = -1;
    prev();
  }, [prev]);

  // 키보드로도 넘길 수 있게 한다
  useEffect(() => {
    if (!isActive) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        finish();
        return;
      }
      if (event.key === 'ArrowRight' || event.key === 'Enter') {
        event.preventDefault();
        goNext();
        return;
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goPrev();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isActive, finish, goNext, goPrev]);

  if (!isActive || !step) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="사용법 안내"
      className="fixed inset-0 z-[60]"
    >
      {/* 안내 중에는 화면 조작을 막는다 — 말풍선의 버튼만 눌린다 */}
      <div className="absolute inset-0 animate-fade-in" />

      {spot && (
        <div
          className="fixed pointer-events-none transition-all duration-300 ease-out"
          style={{
            top: spot.top,
            left: spot.left,
            width: spot.width,
            height: spot.height,
            borderRadius: spot.radius,
            boxShadow: '0 0 0 9999px var(--overlay)',
            outline: '2px solid var(--accent)',
            outlineOffset: 2,
          }}
        />
      )}

      <div
        ref={bubbleRef}
        /* 화면이 아주 낮아도(가로 모드 등) 말풍선이 잘리지 않도록 높이를 제한하고 안에서 굴린다 */
        className="fixed w-[320px] max-w-[calc(100vw-24px)] max-h-[calc(100dvh-24px)] overflow-y-auto bg-surface text-ink rounded-2xl shadow-pop border border-line p-5 animate-pop-in"
        style={{
          top: bubble?.top ?? -9999,
          left: bubble?.left ?? -9999,
          // 위치를 정하기 전 한 프레임 동안 엉뚱한 자리에 보이지 않게 한다
          visibility: bubble ? 'visible' : 'hidden',
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-[15px] font-semibold leading-snug">{step.title}</p>
          <button
            type="button"
            onClick={finish}
            aria-label="안내 닫기"
            className="shrink-0 -mr-1 -mt-1 p-1 rounded-lg text-ink-subtle hover:bg-surface-2 hover:text-ink transition"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        <p className="mt-2 text-sm leading-relaxed text-ink-muted">{step.body}</p>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5" aria-hidden>
            {TUTORIAL_STEPS.map((item, index) => (
              <span
                key={item.id}
                className={`h-1.5 rounded-full transition-all ${
                  index === stepIndex
                    ? 'w-4 bg-accent'
                    : 'w-1.5 bg-surface-3'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-1">
            {stepIndex > 0 && (
              <button
                type="button"
                onClick={goPrev}
                className="px-3 py-1.5 text-sm font-medium text-ink-muted rounded-lg hover:bg-surface-2 transition"
              >
                이전
              </button>
            )}
            <button
              type="button"
              onClick={goNext}
              className="px-3.5 py-1.5 text-sm font-semibold bg-accent text-accent-fg rounded-lg hover:bg-accent-hover transition"
            >
              {isLast ? '시작하기' : '다음'}
            </button>
          </div>
        </div>

        {!isLast && (
          <button
            type="button"
            onClick={finish}
            className="mt-2 w-full text-center text-xs text-ink-subtle hover:text-ink-muted transition"
          >
            건너뛰기
          </button>
        )}

        <span className="sr-only">
          {stepIndex + 1} / {TUTORIAL_STEPS.length} 단계
        </span>
      </div>
    </div>
  );
}
