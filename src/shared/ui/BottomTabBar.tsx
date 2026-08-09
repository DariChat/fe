'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/rooms', label: '채팅', icon: '💬' },
  { href: '/friends', label: '친구', icon: '👥' },
  { href: '/profile', label: '내 정보', icon: '👤' },
];

/** 모바일 전용 하단 탭. 데스크톱에서는 Sidebar 가 같은 역할을 한다. */
export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden border-t border-gray-200 bg-white pb-safe">
      <div className="flex">
        {TABS.map((tab) => {
          const isActive = pathname === tab.href;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={isActive ? 'page' : undefined}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 transition ${
                isActive ? 'text-indigo-600' : 'text-gray-400'
              }`}
            >
              <span className="text-xl leading-none">{tab.icon}</span>
              <span className="text-[11px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
