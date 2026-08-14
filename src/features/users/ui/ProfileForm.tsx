'use client';

import { useState } from 'react';
import { PreferredLanguage, UserResponse } from '@/shared/types/api.types';
import { userService } from '../service/userService';
import { toErrorMessage } from '@/shared/api/client';
import { LanguageSelect } from '@/shared/ui/LanguageSelect';
import { Avatar } from '@/shared/ui/Avatar';

interface ProfileFormProps {
  user: UserResponse;
  onUpdate: (user: UserResponse) => void;
}

/** 서버 @Size(max = 200) 와 같은 값 — 넘겨 보내면 400 이 온다 */
const BIO_MAX_LENGTH = 200;

const FIELD_CLASS =
  'w-full h-11 px-4 bg-surface-2 rounded-xl text-sm placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-accent transition';

export function ProfileForm({ user, onUpdate }: ProfileFormProps) {
  /*
   * 서버는 받은 값으로 프로필을 통째로 덮어쓴다.
   * bio 를 빼고 보내면 기존 자기소개가 지워지므로 현재 값을 반드시 채워 둔다.
   */
  const [formData, setFormData] = useState({
    nickname: user.nickname,
    profileImageUrl: user.profileImageUrl || '',
    bio: user.bio || '',
    preferredLanguage: user.preferredLanguage ?? PreferredLanguage.KO,
  });
  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

  const handleProfileChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const updated = await userService.updateProfile({
        nickname: formData.nickname,
        profileImageUrl: formData.profileImageUrl || null,
        bio: formData.bio.trim() || null,
        preferredLanguage: formData.preferredLanguage,
      });
      onUpdate(updated);
      setSuccess('프로필이 저장되었습니다!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(toErrorMessage(err, '프로필 저장에 실패했습니다'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordData.password !== passwordData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다');
      return;
    }

    if (passwordData.password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다');
      return;
    }

    setIsLoading(true);

    try {
      await userService.updatePassword({
        password: passwordData.password,
      });
      setPasswordData({ password: '', confirmPassword: '' });
      setSuccess('비밀번호가 변경되었습니다!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(toErrorMessage(err, '비밀번호 변경에 실패했습니다'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4">
      <div className="bg-surface border border-line rounded-2xl shadow-card overflow-hidden">
        <div className="px-6 py-6 border-b border-line flex items-center gap-4">
          <Avatar nickname={user.nickname} size="lg" />
          <div className="min-w-0">
            <h1 className="text-xl font-semibold truncate">{user.name}</h1>
            <p className="text-sm text-ink-muted truncate">{user.email}</p>
          </div>
        </div>

        <div className="flex gap-1 p-1.5 border-b border-line">
          {[
            { key: 'profile' as const, label: '프로필' },
            { key: 'password' as const, label: '보안' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              aria-current={activeTab === tab.key ? 'page' : undefined}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${
                activeTab === tab.key
                  ? 'bg-accent-soft text-accent-ink'
                  : 'text-ink-muted hover:bg-surface-2 hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5 md:p-6">
          {error && (
            <div className="mb-4 p-3 bg-danger-soft border border-danger-line text-danger rounded-xl text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-accent-soft border border-line text-accent-ink rounded-xl text-sm">
              {success}
            </div>
          )}

          {activeTab === 'profile' && (
            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <div>
                <label
                  htmlFor="nickname"
                  className="block text-sm font-medium mb-2"
                >
                  닉네임
                </label>
                <input
                  id="nickname"
                  type="text"
                  name="nickname"
                  value={formData.nickname}
                  onChange={handleProfileChange}
                  maxLength={20}
                  className={FIELD_CLASS}
                />
              </div>

              <div>
                <div className="flex items-baseline justify-between mb-2">
                  <label htmlFor="bio" className="text-sm font-medium">
                    자기소개
                  </label>
                  <span className="text-xs text-ink-subtle">
                    {formData.bio.length}/{BIO_MAX_LENGTH}
                  </span>
                </div>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleProfileChange}
                  maxLength={BIO_MAX_LENGTH}
                  rows={3}
                  placeholder="어떤 이야기를 나누고 싶은지 적어 보세요"
                  className="w-full px-4 py-3 bg-surface-2 rounded-xl text-sm leading-relaxed resize-none placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-accent transition"
                />
                <p className="text-xs text-ink-subtle mt-1.5">
                  추천 목록에서 다른 사람에게 함께 보입니다
                </p>
              </div>

              <div>
                <label
                  htmlFor="profileImageUrl"
                  className="block text-sm font-medium mb-2"
                >
                  프로필 이미지 URL
                </label>
                <input
                  id="profileImageUrl"
                  type="url"
                  name="profileImageUrl"
                  value={formData.profileImageUrl}
                  onChange={handleProfileChange}
                  placeholder="https://example.com/image.jpg"
                  className={FIELD_CLASS}
                />
                <p className="text-xs text-ink-subtle mt-1.5">
                  이미지 파일의 주소를 입력하세요
                </p>
              </div>

              <div>
                <label
                  htmlFor="preferredLanguage"
                  className="block text-sm font-medium mb-2"
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
                <p className="text-xs text-ink-subtle mt-1.5">
                  다른 언어로 온 메시지를 이 언어로 번역해서 보여줍니다
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-accent text-accent-fg text-sm font-semibold rounded-xl hover:bg-accent-hover transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '저장 중...' : '프로필 저장'}
              </button>
            </form>
          )}

          {activeTab === 'password' && (
            <form onSubmit={handleUpdatePassword} className="space-y-5">
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium mb-2"
                >
                  새 비밀번호
                </label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  value={passwordData.password}
                  onChange={handlePasswordChange}
                  placeholder="••••••••"
                  minLength={8}
                  className={FIELD_CLASS}
                />
                <p className="text-xs text-ink-subtle mt-1.5">최소 8자 이상</p>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium mb-2"
                >
                  비밀번호 확인
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="••••••••"
                  minLength={8}
                  className={FIELD_CLASS}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-accent text-accent-fg text-sm font-semibold rounded-xl hover:bg-accent-hover transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '변경 중...' : '비밀번호 변경'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
