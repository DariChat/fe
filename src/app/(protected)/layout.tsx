'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { PreferredLanguage } from '@/shared/types/api.types';
import { Header } from '@/shared/ui/Header';
import { Sidebar } from '@/shared/ui/Sidebar';
import { BottomTabBar } from '@/shared/ui/BottomTabBar';
import { RoomList } from '@/features/rooms/ui/RoomList';
import { useFriendsStore } from '@/features/friends/model/friendsStore';
import { userService } from '@/features/users/service/userService';
import { TutorialOverlay } from '@/features/tutorial/ui/TutorialOverlay';
import { useServerEvents } from './useServerEvents';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [nickname, setNickname] = useState('사용자');
  const [language, setLanguage] = useState<PreferredLanguage>(
    PreferredLanguage.KO
  );
  const [isLoading, setIsLoading] = useState(true);

  const fetchFriends = useFriendsStore((state) => state.fetchAll);

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
        setNickname(user.nickname);
        setLanguage(user.preferredLanguage);
      } catch (error) {
        console.error('사용자 프로필을 불러오지 못했습니다:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [router]);

  /*
   * 받은 친구 요청 수는 친구 화면뿐 아니라 레일·탭바의 배지에도 쓰인다.
   * 어느 화면으로 들어오든 한 번은 받아둬야 배지가 비어 보이지 않는다.
   * (이후 변화는 /user/queue/friends 푸시가 채운다)
   */
  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-dvh bg-bg">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-line-strong border-t-accent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-ink-muted">불러오는 중...</p>
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
    ? 'flex w-full md:w-[320px]'
    : isChatRoom
      ? 'hidden md:flex md:w-[320px]'
      : 'hidden';

  return (
    <div className="flex flex-col h-dvh bg-bg">
      {/* 대화방에서는 방 자체 헤더를 쓰므로 모바일 앱 헤더를 감춘다 */}
      {!isChatRoom && <Header />}

      <div className="flex flex-1 min-h-0">
        <Sidebar nickname={nickname} language={language} />

        <aside
          data-tour="room-list"
          className={`${listPanelClass} flex-col bg-surface border-r border-line shrink-0 min-h-0`}
        >
          {/* 목록은 채팅 영역에서만 보이므로 그 밖에서는 아예 그리지 않는다 */}
          {isChatArea && <RoomList />}
        </aside>

        <main
          className={`${isRoomsRoute ? 'hidden md:flex' : 'flex'} flex-1 min-h-0 flex-col overflow-y-auto`}
        >
          {children}
        </main>
      </div>

      {/* 대화방에서는 입력창에 집중할 수 있도록 탭바를 감춘다 */}
      {!isChatRoom && <BottomTabBar />}

      <TutorialOverlay />
    </div>
  );
}
