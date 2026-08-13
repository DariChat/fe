import { PreferredLanguage } from '@/shared/types/api.types';

/**
 * 로그인한 사람의 닉네임/선호 언어를 localStorage 에 캐시한다.
 *
 * 대화방은 렌더링할 때마다 두 값이 필요하다.
 *  - 닉네임: 내 메시지인지 판별 (서버가 senderNickname 만 내려준다)
 *  - 선호 언어: MessageResponse.translations 에서 내 언어 번역을 골라내기
 * 매번 GET /api/users/me 를 부르면 방을 옮길 때마다 왕복이 늘어나 캐시해 둔다.
 */

const NICKNAME_KEY = 'userNickname';
const LANGUAGE_KEY = 'userLanguage';

const isBrowser = () => typeof window !== 'undefined';

const isPreferredLanguage = (value: string): value is PreferredLanguage =>
  Object.values(PreferredLanguage).includes(value as PreferredLanguage);

export const cacheCurrentUser = (user: {
  nickname: string;
  preferredLanguage?: PreferredLanguage;
}) => {
  if (!isBrowser()) return;

  localStorage.setItem(NICKNAME_KEY, user.nickname);
  if (user.preferredLanguage) {
    localStorage.setItem(LANGUAGE_KEY, user.preferredLanguage);
  }
};

export const clearCurrentUser = () => {
  if (!isBrowser()) return;

  localStorage.removeItem(NICKNAME_KEY);
  localStorage.removeItem(LANGUAGE_KEY);
};

export const readMyNickname = (): string =>
  isBrowser() ? localStorage.getItem(NICKNAME_KEY) || '' : '';

/** 캐시가 없거나 서버 enum 이 늘어난 뒤라면 한국어로 본다 */
export const readMyLanguage = (): PreferredLanguage => {
  if (!isBrowser()) return PreferredLanguage.KO;

  const cached = localStorage.getItem(LANGUAGE_KEY);
  return cached && isPreferredLanguage(cached) ? cached : PreferredLanguage.KO;
};
