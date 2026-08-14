/**
 * 라이트/다크 테마.
 *
 * 실제 색은 globals.css 의 토큰이 갖고 있고, 여기서는 html 에 .dark 를 붙이고 뗄 뿐이다.
 * 'system' 은 OS 설정을 그대로 따라가며, 사용자가 직접 고르면 그 선택을 저장한다.
 *
 * 첫 페인트 전에 클래스를 붙이는 건 app/layout.tsx 의 인라인 스크립트가 맡는다
 * (여기서만 하면 라이트 화면이 한 번 번쩍인 뒤 다크로 바뀐다).
 */

export type ThemeMode = 'light' | 'dark' | 'system';

export const THEME_STORAGE_KEY = 'darichat.theme';

const isBrowser = () => typeof window !== 'undefined';

const isThemeMode = (value: string | null): value is ThemeMode =>
  value === 'light' || value === 'dark' || value === 'system';

export const readThemeMode = (): ThemeMode => {
  if (!isBrowser()) return 'system';

  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return isThemeMode(stored) ? stored : 'system';
};

export const prefersDark = (): boolean =>
  isBrowser() && window.matchMedia('(prefers-color-scheme: dark)').matches;

export const resolveTheme = (mode: ThemeMode): 'light' | 'dark' =>
  mode === 'system' ? (prefersDark() ? 'dark' : 'light') : mode;

export const applyThemeMode = (mode: ThemeMode) => {
  if (!isBrowser()) return;

  document.documentElement.classList.toggle('dark', resolveTheme(mode) === 'dark');
};

export const saveThemeMode = (mode: ThemeMode) => {
  if (!isBrowser()) return;

  localStorage.setItem(THEME_STORAGE_KEY, mode);
  applyThemeMode(mode);
};

/**
 * layout 의 <head> 에 그대로 심는 스크립트.
 * 저장된 값이 없으면 OS 설정을 따르고, 실패해도 화면은 라이트로 뜨면 되므로 조용히 넘어간다.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var m=localStorage.getItem('${THEME_STORAGE_KEY}');var d=m==='dark'||((!m||m==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;
