import type { Config } from 'tailwindcss';

/**
 * 색은 globals.css 의 CSS 변수(토큰)만 참조한다.
 * 화면 코드에서는 bg-surface / text-ink-muted 처럼 역할 이름을 쓰고,
 * 라이트·다크 값은 globals.css 한 곳에서만 갈린다.
 *
 * 투명도 수식(bg-surface/50)은 var() 색에는 먹지 않으므로 쓰지 않는다.
 */
const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/shared/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: {
          DEFAULT: 'var(--surface)',
          2: 'var(--surface-2)',
          3: 'var(--surface-3)',
        },
        line: {
          DEFAULT: 'var(--line)',
          strong: 'var(--line-strong)',
        },
        ink: {
          DEFAULT: 'var(--ink)',
          muted: 'var(--ink-muted)',
          subtle: 'var(--ink-subtle)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          soft: 'var(--accent-soft)',
          ink: 'var(--accent-ink)',
          fg: 'var(--on-accent)',
        },
        danger: {
          DEFAULT: 'var(--danger)',
          soft: 'var(--danger-soft)',
          line: 'var(--danger-line)',
        },
        success: 'var(--success)',
        bubble: {
          in: 'var(--bubble-in)',
          'in-ink': 'var(--bubble-in-ink)',
        },
        overlay: 'var(--overlay)',
      },
      boxShadow: {
        soft: 'var(--shadow-sm)',
        card: 'var(--shadow-card)',
        pop: 'var(--shadow-pop)',
      },
      ringColor: {
        DEFAULT: 'var(--ring)',
        accent: 'var(--ring)',
      },
    },
  },
  plugins: [],
};
export default config;
