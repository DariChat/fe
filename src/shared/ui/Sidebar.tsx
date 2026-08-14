'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LANGUAGE_LABELS, PreferredLanguage } from '@/shared/types/api.types';
import { Avatar } from '@/shared/ui/Avatar';
import { ThemeToggle } from '@/shared/ui/ThemeToggle';
import {
  ChatIcon,
  FriendsIcon,
  HelpIcon,
  LogoutIcon,
  SearchIcon,
  UserIcon,
} from '@/shared/ui/icons';
import { authService } from '@/features/auth/service/authService';
import { useRoomsStore } from '@/features/rooms/model/roomsStore';
import { useFriendsStore } from '@/features/friends/model/friendsStore';
import { useTutorialStore } from '@/features/tutorial/model/tutorialStore';

interface SidebarProps {
  nickname: string;
  language: PreferredLanguage;
}

/**
 * 데스크톱 왼쪽 레일.
 *
 * 화면 폭은 대화에 써야 하므로 폭은 좁게 두되, 앱 헤더가 하던 일(로고·내 계정)까지
 * 여기로 모았다 — 그래서 데스크톱에는 위쪽 헤더가 따로 없다.
 *
 *   위   : 로고
 *   가운데: 채팅 · 친구 (안 읽은 수, 받은 요청 수를 배지로)
 *   아래 : 사용법 안내 · 테마 · 내 언어 · 내 계정
 *
 * 모바일에서는 BottomTabBar 와 Header 가 이 역할을 나눠 갖는다.
 */
export function Sidebar({ nickname, language }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const unreadTotal = useRoomsStore((state) =>
    state.rooms.reduce((sum, room) => sum + room.unreadCount, 0)
  );
  const requestCount = useFriendsStore((state) => state.requests.length);
  const startTutorial = useTutorialStore((state) => state.start);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 메뉴 밖을 누르거나 Esc 를 누르면 닫는다
  useEffect(() => {
    if (!isMenuOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMenuOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isMenuOpen]);

  const handleLogout = async () => {
    try {
      await authService.logout();
      router.push('/');
    } catch (error) {
      console.error('로그아웃에 실패했습니다:', error);
    }
  };

  const navItems = [
    {
      // 로그인하면 여기가 첫 화면이다 (홈)
      href: '/discover',
      label: '찾기',
      tour: 'nav-discover',
      icon: SearchIcon,
      match: ['/discover'],
      badge: 0,
    },
    {
      href: '/rooms',
      label: '채팅',
      tour: 'nav-rooms',
      icon: ChatIcon,
      match: ['/rooms', '/chat'],
      badge: unreadTotal,
    },
    {
      href: '/friends',
      label: '친구',
      tour: 'nav-friends',
      icon: FriendsIcon,
      match: ['/friends'],
      badge: requestCount,
    },
  ];

  return (
    <aside className="hidden md:flex w-[76px] flex-col items-center bg-surface border-r border-line py-3 shrink-0">
      <Link
        href="/discover"
        data-tour="brand"
        aria-label="DariChat 홈"
        className="mb-3 rounded-2xl p-1.5 hover:bg-surface-2 transition"
      >
        <Image
          src="/icons/icon-512.png"
          alt=""
          width={512}
          height={512}
          className="w-9 h-9 rounded-[26%]"
          priority
        />
      </Link>

      <nav className="flex flex-col gap-1 w-full px-2">
        {navItems.map((item) => {
          const isActive = item.match.some((path) => pathname.startsWith(path));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              data-tour={item.tour}
              aria-current={isActive ? 'page' : undefined}
              title={item.label}
              className={`relative flex flex-col items-center gap-1 py-2.5 rounded-xl transition ${
                isActive
                  ? 'bg-accent-soft text-accent-ink'
                  : 'text-ink-muted hover:bg-surface-2 hover:text-ink'
              }`}
            >
              <Icon />
              <span className="text-[11px] font-medium">{item.label}</span>

              {item.badge > 0 && (
                <span className="absolute top-1.5 right-3 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-accent text-accent-fg text-[10px] font-semibold">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />

      <div className="w-full px-2 pt-3 border-t border-line flex flex-col items-center gap-1">
        <button
          type="button"
          data-tour="help"
          onClick={startTutorial}
          title="사용법 다시 보기"
          aria-label="사용법 다시 보기"
          className="w-10 h-10 flex items-center justify-center rounded-xl text-ink-muted hover:bg-surface-2 hover:text-ink transition"
        >
          <HelpIcon className="w-[18px] h-[18px]" />
        </button>

        <ThemeToggle
          data-tour="theme-toggle"
          className="w-10 h-10"
        />

        <Link
          href="/profile"
          data-tour="language"
          title={`내 언어: ${LANGUAGE_LABELS[language]} (프로필에서 변경)`}
          className="w-10 h-8 flex items-center justify-center rounded-lg border border-line text-[11px] font-semibold text-ink-muted hover:border-line-strong hover:text-ink transition"
        >
          {language}
        </Link>

        <div className="relative mt-1" ref={menuRef}>
          <button
            type="button"
            data-tour="profile-menu"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
            aria-label={`${nickname} 메뉴 열기`}
            className="rounded-full hover:opacity-90 transition"
          >
            <Avatar nickname={nickname} size="sm" />
          </button>

          {isMenuOpen && (
            <div
              role="menu"
              className="absolute bottom-0 left-full ml-2 w-52 bg-surface border border-line rounded-xl shadow-pop overflow-hidden animate-pop-in z-50"
            >
              <div className="px-4 py-3 border-b border-line">
                <p className="text-sm font-semibold truncate">{nickname}</p>
                <p className="text-xs text-ink-subtle mt-0.5">
                  {LANGUAGE_LABELS[language]}
                </p>
              </div>

              <Link
                href="/profile"
                role="menuitem"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-ink-muted hover:bg-surface-2 hover:text-ink transition"
              >
                <UserIcon className="w-[18px] h-[18px]" />내 프로필
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-danger hover:bg-danger-soft transition border-t border-line"
              >
                <LogoutIcon className="w-[18px] h-[18px]" />
                로그아웃
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
