'use client';

import { LANGUAGE_LABELS, PreferredLanguage } from '@/shared/types/api.types';

interface LanguageSelectProps {
  id?: string;
  value: PreferredLanguage;
  onChange: (language: PreferredLanguage) => void;
  disabled?: boolean;
}

/**
 * 선호 언어 선택. 서버는 이 값을 기준으로 방 참여자별 번역본을 만든다.
 * (회원가입 · 프로필 수정 두 곳에서 같은 목록을 쓴다)
 */
export function LanguageSelect({
  id,
  value,
  onChange,
  disabled,
}: LanguageSelectProps) {
  return (
    <select
      id={id}
      name="preferredLanguage"
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as PreferredLanguage)}
      className="w-full h-11 px-4 bg-surface-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent transition disabled:opacity-50"
    >
      {Object.values(PreferredLanguage).map((language) => (
        <option key={language} value={language}>
          {LANGUAGE_LABELS[language]}
        </option>
      ))}
    </select>
  );
}
