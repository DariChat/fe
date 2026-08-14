'use client';

import { useTheme } from '@/shared/lib/useTheme';
import { MoonIcon, SunIcon } from './icons';

type ThemeToggleProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'onClick' | 'children'
>;

/**
 * 라이트/다크 전환 버튼.
 * 마운트 전에는 저장된 값을 알 수 없어(서버 렌더와 어긋난다) 아이콘 자리를 비워 둔다.
 */
export function ThemeToggle({ className = '', ...props }: ThemeToggleProps) {
  const { resolved, mounted, toggle } = useTheme();

  const label = resolved === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환';

  return (
    <button
      type="button"
      onClick={toggle}
      title={label}
      aria-label={label}
      className={`flex items-center justify-center rounded-xl text-ink-muted hover:bg-surface-2 hover:text-ink transition ${className}`}
      {...props}
    >
      {mounted &&
        (resolved === 'dark' ? (
          <SunIcon className="w-[18px] h-[18px]" />
        ) : (
          <MoonIcon className="w-[18px] h-[18px]" />
        ))}
    </button>
  );
}
