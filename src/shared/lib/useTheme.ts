'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ThemeMode,
  applyThemeMode,
  readThemeMode,
  resolveTheme,
  saveThemeMode,
} from './theme';

/**
 * 테마 상태.
 *
 * 서버 렌더 결과와 어긋나지 않도록 첫 렌더는 항상 'system' 으로 시작하고,
 * 마운트된 뒤에 저장된 값을 읽어 맞춘다(mounted). 아이콘을 그릴 때 이 값을 보고
 * 깜빡임 없이 표시하면 된다.
 */
export const useTheme = () => {
  const [mode, setMode] = useState<ThemeMode>('system');
  const [resolved, setResolved] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = readThemeMode();
    setMode(stored);
    setResolved(resolveTheme(stored));
    setMounted(true);
  }, []);

  // 'system' 인 동안에는 OS 설정이 바뀌면 따라가야 한다
  useEffect(() => {
    if (mode !== 'system') return;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const sync = () => {
      applyThemeMode('system');
      setResolved(resolveTheme('system'));
    };

    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, [mode]);

  const changeMode = useCallback((next: ThemeMode) => {
    saveThemeMode(next);
    setMode(next);
    setResolved(resolveTheme(next));
  }, []);

  /** 지금 보이는 화면의 반대로 뒤집는다 (system 이었다면 그 순간 값의 반대로 고정된다) */
  const toggle = useCallback(() => {
    changeMode(resolveTheme(readThemeMode()) === 'dark' ? 'light' : 'dark');
  }, [changeMode]);

  return { mode, resolved, mounted, changeMode, toggle };
};
