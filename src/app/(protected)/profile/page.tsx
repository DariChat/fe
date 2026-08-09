'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserResponse } from '@/shared/types/api.types';
import { userService } from '@/features/users/service/userService';
import { ProfileForm } from '@/features/users/ui/ProfileForm';
import { toErrorMessage } from '@/shared/api/client';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">프로필을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || '프로필을 불러오지 못했습니다'}</p>
          <Link href="/rooms" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
            채팅 목록으로
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <ProfileForm user={user} onUpdate={setUser} />
    </div>
  );
}
