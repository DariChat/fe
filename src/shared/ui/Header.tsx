'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService } from '@/features/auth/service/authService';

interface HeaderProps {
  userNickname?: string;
}

export function Header({ userNickname = '사용자' }: HeaderProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await authService.logout();
      router.push('/');
    } catch (error) {
      console.error('로그아웃에 실패했습니다:', error);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm pt-safe shrink-0">
      <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4">
        <Link href="/rooms" className="flex items-center gap-2">
          <Image src="/logo.png" alt="" width={32} height={32} priority />
          <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
            Talkieee
          </span>
        </Link>

        {/* 모바일에서는 하단 탭의 '내 정보'가 같은 역할을 하므로 감춘다 */}
        <div className="hidden md:flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 flex items-center justify-center text-white font-semibold">
                {userNickname.charAt(0).toUpperCase()}
              </div>
              <span className="text-gray-700 font-medium text-sm">{userNickname}</span>
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <Link
                  href="/profile"
                  className="block px-4 py-3 text-gray-700 hover:bg-gray-50 font-medium text-sm"
                >
                  내 프로필
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 font-medium text-sm border-t border-gray-200"
                >
                  로그아웃
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
