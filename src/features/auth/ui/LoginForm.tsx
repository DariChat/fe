'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { authService } from '../service/authService';
import { toErrorMessage } from '@/shared/api/client';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await authService.login({ email, password });
      router.push('/discover');
    } catch (err) {
      setError(toErrorMessage(err, '로그인에 실패했습니다. 다시 시도해 주세요.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-surface border border-line rounded-2xl shadow-card p-7 md:p-8 space-y-6">
        <div className="space-y-2 text-center">
          <Image
            src="/icons/icon-512.png"
            alt=""
            width={512}
            height={512}
            className="mx-auto w-16 h-16 rounded-[26%]"
            priority
          />
          <h1 className="text-2xl font-semibold tracking-tight">
            DariChat
          </h1>
          <p className="text-sm text-ink-muted">로그인하고 대화를 이어가세요</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-danger-soft border border-danger-line text-danger px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium">
              이메일
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full h-11 px-4 bg-surface-2 rounded-xl text-sm placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-accent transition"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium">
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              className="w-full h-11 px-4 bg-surface-2 rounded-xl text-sm placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-accent transition"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 bg-accent text-accent-fg text-sm font-semibold rounded-xl hover:bg-accent-hover transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-line"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-surface text-ink-subtle">아직 계정이 없으신가요?</span>
          </div>
        </div>

        <Link
          href="/auth/signup"
          className="flex items-center justify-center w-full h-11 border border-line text-sm font-semibold rounded-xl hover:bg-surface-2 transition"
        >
          회원가입
        </Link>
      </div>
    </div>
  );
}
