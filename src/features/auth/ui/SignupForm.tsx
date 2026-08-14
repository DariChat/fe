'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { authService } from '../service/authService';
import { toErrorMessage } from '@/shared/api/client';
import { PreferredLanguage } from '@/shared/types/api.types';
import { LanguageSelect } from '@/shared/ui/LanguageSelect';

export function SignupForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    nickname: '',
    preferredLanguage: PreferredLanguage.KO,
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다');
      return;
    }

    setIsLoading(true);

    try {
      await authService.signup({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        nickname: formData.nickname,
        preferredLanguage: formData.preferredLanguage,
      });
      // 가입과 동시에 서버가 인증코드를 메일로 보낸다 — 인증 전에는 로그인이 막혀 있다
      router.push(
        `/auth/verify-email?email=${encodeURIComponent(formData.email)}`
      );
    } catch (err) {
      setError(toErrorMessage(err, '회원가입에 실패했습니다. 다시 시도해 주세요.'));
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
          <p className="text-sm text-ink-muted">계정을 만들고 대화를 시작하세요</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-danger-soft border border-danger-line text-danger px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium">
              이름
            </label>
            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="홍길동"
              required
              maxLength={100}
              className="w-full h-11 px-4 bg-surface-2 rounded-xl text-sm placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-accent transition"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium">
              이메일
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              required
              maxLength={100}
              className="w-full h-11 px-4 bg-surface-2 rounded-xl text-sm placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-accent transition"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="nickname" className="block text-sm font-medium">
              닉네임
            </label>
            <input
              id="nickname"
              type="text"
              name="nickname"
              value={formData.nickname}
              onChange={handleChange}
              placeholder="사용할 닉네임"
              required
              maxLength={20}
              className="w-full h-11 px-4 bg-surface-2 rounded-xl text-sm placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-accent transition"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="preferredLanguage"
              className="block text-sm font-medium"
            >
              사용 언어
            </label>
            <LanguageSelect
              id="preferredLanguage"
              value={formData.preferredLanguage}
              onChange={(preferredLanguage) =>
                setFormData((prev) => ({ ...prev, preferredLanguage }))
              }
            />
            <p className="text-xs text-ink-subtle">
              다른 언어로 온 메시지를 이 언어로 번역해서 보여드려요
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium">
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              minLength={8}
              className="w-full h-11 px-4 bg-surface-2 rounded-xl text-sm placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-accent transition"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="block text-sm font-medium">
              비밀번호 확인
            </label>
            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
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
            {isLoading ? '가입 중...' : '회원가입'}
          </button>

          <p className="text-xs text-ink-subtle text-center">
            가입하면 입력한 이메일로 인증코드가 발송돼요
          </p>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-line"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-surface text-ink-subtle">이미 계정이 있으신가요?</span>
          </div>
        </div>

        <Link
          href="/auth/login"
          className="flex items-center justify-center w-full h-11 border border-line text-sm font-semibold rounded-xl hover:bg-surface-2 transition"
        >
          로그인
        </Link>
      </div>
    </div>
  );
}
