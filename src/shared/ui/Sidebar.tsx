'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/rooms', label: '채팅', icon: '💬', match: ['/rooms', '/chat'] },
  { href: '/friends', label: '친구', icon: '👥', match: ['/friends'] },
];

/**
 * 데스크톱 전용 아이콘 레일.
 * 목록 패널과 대화창을 나란히 두려면 폭을 아껴야 해서 아이콘만 남겼다.
 * 모바일에서는 BottomTabBar 가 이 역할을 대신한다.
 *
 * 방 만들기 버튼은 여기 두지 않는다 — 채팅 목록 헤더의 + 가 그 역할을 한다.
 */
export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-20 flex-col items-center bg-white border-r border-gray-200 py-4 shrink-0">
      <nav className="flex flex-col gap-2 w-full px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = item.match.some((path) => pathname.startsWith(path));

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              title={item.label}
              className={`flex flex-col items-center gap-1 py-3 rounded-xl transition ${
                isActive
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <span className="text-xl leading-none">{item.icon}</span>
              <span className="text-[11px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
