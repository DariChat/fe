'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserResponse } from '@/shared/types/api.types';
import { userService } from '@/features/users/service/userService';
import { authService } from '@/features/auth/service/authService';
import { ProfileForm } from '@/features/users/ui/ProfileForm';
import { toErrorMessage } from '@/shared/api/client';
import { HelpIcon } from '@/shared/ui/icons';
import { useTutorialStore } from '@/features/tutorial/model/tutorialStore';

export default function ProfilePage() {
  const router = useRouter();
  const startTutorial = useTutorialStore((state) => state.start);
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const handleLogout = async () => {
    try {
      await authService.logout();
      router.push('/');
    } catch (error) {
      console.error('로그아웃에 실패했습니다:', error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    const fetchUser = async () => {
      try {
        const userData = await userService.getProfile();
        setUser(userData);
      } catch (err) {
        setError(toErrorMessage(err, '프로필을 불러오지 못했습니다'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-full">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-line-strong border-t-accent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-ink-muted">프로필을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex items-center justify-center min-h-full">
        <div className="text-center">
          <p className="text-sm text-danger mb-4">
            {error || '프로필을 불러오지 못했습니다'}
          </p>
          <Link
            href="/rooms"
            className="inline-block px-4 py-2 text-sm font-medium bg-accent text-accent-fg rounded-xl hover:bg-accent-hover transition"
          >
            채팅 목록으로
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-bg py-6 md:py-10">
      <ProfileForm user={user} onUpdate={setUser} />

      <div className="max-w-2xl mx-auto px-4 mt-3 space-y-2">
        {/* 안내는 언제든 다시 볼 수 있어야 한다 — 레일·헤더의 ? 버튼과 같은 동작 */}
        <button
          onClick={startTutorial}
          className="w-full h-11 flex items-center justify-center gap-2 bg-surface border border-line text-sm font-medium rounded-xl hover:bg-surface-2 transition"
        >
          <HelpIcon className="w-[18px] h-[18px] text-ink-muted" />
          사용법 다시 보기
        </button>

        {/*
          모바일에는 레일 메뉴가 없어 여기가 유일한 로그아웃 경로다.
          데스크톱에서도 같은 자리에 있는 편이 찾기 쉬워 화면 폭과 무관하게 노출한다.
        */}
        <button
          onClick={handleLogout}
          className="w-full h-11 bg-surface border border-line text-danger text-sm font-semibold rounded-xl hover:bg-danger-soft transition"
        >
          로그아웃
        </button>
      </div>
    </div>
  );
}
