'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChatIcon, FriendsIcon, SearchIcon, UserIcon } from '@/shared/ui/icons';
import { useRoomsStore } from '@/features/rooms/model/roomsStore';
import { useFriendsStore } from '@/features/friends/model/friendsStore';

/** 모바일 전용 하단 탭. 데스크톱에서는 Sidebar 가 같은 역할을 한다. */
export function BottomTabBar() {
  const pathname = usePathname();

  const unreadTotal = useRoomsStore((state) =>
    state.rooms.reduce((sum, room) => sum + room.unreadCount, 0)
  );
  const requestCount = useFriendsStore((state) => state.requests.length);

  const tabs = [
    {
      // 로그인하면 여기가 첫 화면이다 (홈)
      href: '/discover',
      label: '찾기',
      tour: 'nav-discover',
      icon: SearchIcon,
      badge: 0,
    },
    {
      href: '/rooms',
      label: '채팅',
      tour: 'nav-rooms',
      icon: ChatIcon,
      badge: unreadTotal,
    },
    {
      href: '/friends',
      label: '친구',
      tour: 'nav-friends',
      icon: FriendsIcon,
      badge: requestCount,
    },
    {
      href: '/profile',
      /*
       * 데스크톱 레일은 언어 배지와 계정 메뉴가 따로지만 모바일에는 이 탭 하나뿐이다.
       * 튜토리얼의 두 단계(언어·계정)가 여기를 함께 가리키게 둔다 —
       * 이름을 안 달아두면 모바일에서는 언어 단계가 통째로 건너뛰어진다.
       */
      label: '내 정보',
      tour: 'language',
      icon: UserIcon,
      badge: 0,
    },
  ];

  return (
    <nav className="md:hidden border-t border-line bg-surface pb-safe shrink-0">
      <div className="flex">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              data-tour={tab.tour}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex-1 flex flex-col items-center gap-0.5 py-2 transition ${
                isActive ? 'text-accent-ink' : 'text-ink-subtle'
              }`}
            >
              <Icon />
              <span className="text-[11px] font-medium">{tab.label}</span>

              {tab.badge > 0 && (
                <span className="absolute top-1 right-[28%] min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-accent text-accent-fg text-[10px] font-semibold">
                  {tab.badge > 99 ? '99+' : tab.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
