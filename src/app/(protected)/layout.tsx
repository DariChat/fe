'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Header } from '@/shared/ui/Header';
import { Sidebar } from '@/shared/ui/Sidebar';
import { BottomTabBar } from '@/shared/ui/BottomTabBar';
import { RoomList } from '@/features/rooms/ui/RoomList';
import { userService } from '@/features/users/service/userService';
import { useServerEvents } from './useServerEvents';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [userNickname, setUserNickname] = useState('사용자');
  const [isLoading, setIsLoading] = useState(true);

  const isRoomsRoute = pathname === '/rooms';
  const isChatRoom = pathname.startsWith('/chat/');
  // 채팅 목록 패널을 띄우는 영역인지 (친구·프로필에서는 띄우지 않는다)
  const isChatArea = isRoomsRoute || isChatRoom;

  // 방·친구 변화는 서버가 개인 큐로 밀어준다. 연결은 로그인 영역 전체에서 하나만 쓴다.
  useServerEvents();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    const fetchUserProfile = async () => {
      try {
        const user = await userService.getProfile();
        setUserNickname(user.nickname);
      } catch (error) {
        console.error('사용자 프로필을 불러오지 못했습니다:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-dvh bg-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">불러오는 중...</p>
        </div>
      </div>
    );
  }

  /*
   * 목록은 이 레이아웃에서 한 번만 렌더링하고 위치만 화면 폭에 따라 바꾼다.
   * (페이지마다 따로 렌더링하면 데스크톱에서 목록을 두 번 불러오게 된다)
   *   - 모바일 /rooms      : 목록이 화면 전체
   *   - 모바일 /chat/{id}  : 목록 숨김, 대화창이 화면 전체
   *   - 데스크톱 채팅 영역 : 목록 패널 + 대화창 2단
   */
  const listPanelClass = isRoomsRoute
    ? 'flex w-full md:w-80'
    : isChatRoom
      ? 'hidden md:flex md:w-80'
      : 'hidden';

  return (
    <div className="flex flex-col h-dvh bg-gray-50">
      {/* 대화방에서는 방 자체 헤더를 쓰므로 모바일에서 앱 헤더를 감춘다 */}
      <div className={isChatRoom ? 'hidden md:block' : 'block'}>
        <Header userNickname={userNickname} />
      </div>

      <div className="flex flex-1 min-h-0">
        <Sidebar />

        <aside
          className={`${listPanelClass} flex-col bg-white border-r border-gray-200 shrink-0 min-h-0`}
        >
          <RoomList />
        </aside>

        <main
          className={`${isRoomsRoute ? 'hidden md:flex' : 'flex'} flex-1 min-h-0 flex-col overflow-y-auto`}
        >
          {children}
        </main>
      </div>

      {/* 대화방에서는 입력창에 집중할 수 있도록 탭바를 감춘다 */}
      {!isChatRoom && <BottomTabBar />}
    </div>
  );
}
