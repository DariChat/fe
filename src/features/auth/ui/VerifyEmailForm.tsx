'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { authService } from '../service/authService';
import { toErrorCode, toErrorMessage } from '@/shared/api/client';
import {
  AUTH_ERROR,
  VERIFICATION_CODE_LENGTH,
  VERIFICATION_RESEND_COOLDOWN_SEC,
} from '@/shared/types/api.types';

export function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 가입 직후에는 쿼리로 이메일이 넘어오지만, 나중에 링크로 직접 들어올 수도 있어
  // 값이 없으면 직접 입력하게 둔다
  const emailFromQuery = searchParams.get('email') ?? '';
  const [email, setEmail] = useState(emailFromQuery);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }

    const timer = setTimeout(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setIsLoading(true);

    try {
      await authService.verifyEmail({ email, code });
      router.replace(
        `/auth/login?verified=1&email=${encodeURIComponent(email)}`
      );
    } catch (err) {
      // 이미 인증된 계정이면 더 할 일이 없으니 로그인으로 보낸다
      if (toErrorCode(err) === AUTH_ERROR.EMAIL_ALREADY_VERIFIED) {
        router.replace(
          `/auth/login?verified=1&email=${encodeURIComponent(email)}`
        );
        return;
      }

      setError(toErrorMessage(err, '인증에 실패했습니다. 다시 시도해 주세요.'));
      setIsLoading(false);
    }
  };

  const handleResend = useCallback(async () => {
    setError('');
    setNotice('');
    setIsResending(true);

    try {
      await authService.resendVerification(email);
      setCooldown(VERIFICATION_RESEND_COOLDOWN_SEC);
      setNotice('인증코드를 다시 보냈어요. 메일함을 확인해 주세요.');
    } catch (err) {
      // 서버가 간격 제한(429)을 걸었으면 남은 시간을 모르니 최대치부터 센다
      if (toErrorCode(err) === AUTH_ERROR.VERIFICATION_RESEND_TOO_SOON) {
        setCooldown(VERIFICATION_RESEND_COOLDOWN_SEC);
      }
      setError(toErrorMessage(err, '재발송에 실패했습니다. 잠시 후 다시 시도해 주세요.'));
    } finally {
      setIsResending(false);
    }
  }, [email]);

  const isCodeComplete = code.length === VERIFICATION_CODE_LENGTH;

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
          <h1 className="text-2xl font-semibold tracking-tight">이메일 인증</h1>
          <p className="text-sm text-ink-muted">
            {emailFromQuery ? (
              <>
                <span className="font-medium text-ink">{emailFromQuery}</span>
                <br />
                으로 보낸 6자리 코드를 입력해 주세요
              </>
            ) : (
              '가입한 이메일과 6자리 인증코드를 입력해 주세요'
            )}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-danger-soft border border-danger-line text-danger px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {notice && (
            <div className="bg-surface-2 border border-line text-ink-muted px-4 py-3 rounded-xl text-sm">
              {notice}
            </div>
          )}

          {!emailFromQuery && (
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
                maxLength={100}
                className="w-full h-11 px-4 bg-surface-2 rounded-xl text-sm placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-accent transition"
              />
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="code" className="block text-sm font-medium">
              인증코드
            </label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              // 숫자만 남긴다 — 메일에서 코드를 복사하면 공백이 딸려오는 경우가 많다
              onChange={(e) =>
                setCode(
                  e.target.value
                    .replace(/\D/g, '')
                    .slice(0, VERIFICATION_CODE_LENGTH)
                )
              }
              placeholder="000000"
              required
              autoFocus
              className="w-full h-14 px-4 bg-surface-2 rounded-xl text-center text-2xl font-semibold tracking-[0.4em] placeholder:text-ink-subtle placeholder:tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-accent transition"
            />
            <p className="text-xs text-ink-subtle">
              코드는 발송 후 5분 동안만 유효해요
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading || !isCodeComplete}
            className="w-full h-11 bg-accent text-accent-fg text-sm font-semibold rounded-xl hover:bg-accent-hover transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '확인 중...' : '인증하기'}
          </button>
        </form>

        <div className="space-y-3 text-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending || cooldown > 0 || !email}
            className="w-full h-11 border border-line text-sm font-semibold rounded-xl hover:bg-surface-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cooldown > 0
              ? `재발송 (${cooldown}초 후 가능)`
              : isResending
                ? '보내는 중...'
                : '인증코드 재발송'}
          </button>

          <Link
            href="/auth/login"
            className="inline-block text-sm text-ink-muted hover:text-ink transition"
          >
            로그인으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
