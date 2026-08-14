'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ThemeToggle } from '@/shared/ui/ThemeToggle';
import { HelpIcon } from '@/shared/ui/icons';
import { useTutorialStore } from '@/features/tutorial/model/tutorialStore';

/**
 * 모바일 전용 상단 바.
 *
 * 데스크톱에서는 왼쪽 레일(Sidebar)이 로고와 내 계정을 모두 갖고 있어 헤더가 없다.
 * 화면 위쪽을 대화에 더 쓰기 위한 선택이다.
 */
export function Header() {
  const startTutorial = useTutorialStore((state) => state.start);

  return (
    <header className="md:hidden bg-surface border-b border-line pt-safe shrink-0">
      <div className="flex items-center justify-between px-4 py-2.5">
        <Link href="/rooms" data-tour="brand" className="flex items-center gap-2">
          <Image
            src="/icons/icon-512.png"
            alt=""
            width={512}
            height={512}
            className="w-8 h-8 rounded-[26%]"
            priority
          />
          <span className="text-lg font-semibold tracking-tight">DariChat</span>
        </Link>

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            data-tour="help"
            onClick={startTutorial}
            aria-label="사용법 다시 보기"
            className="w-9 h-9 flex items-center justify-center rounded-xl text-ink-muted hover:bg-surface-2 hover:text-ink transition"
          >
            <HelpIcon className="w-[18px] h-[18px]" />
          </button>
          <ThemeToggle data-tour="theme-toggle" className="w-9 h-9" />
        </div>
      </div>
    </header>
  );
}
