/**
 * 닉네임 첫 글자를 쓰는 원형 아바타.
 *
 * profileImageUrl 은 임의의 외부 주소라 next/image 허용 도메인 설정이 필요해
 * 화면 전체를 이니셜 방식으로 통일해 뒀다.
 *
 * 색은 닉네임에서 뽑는다 — 목록에서 사람이 서로 구분되고, 같은 사람은 어느 화면에서나
 * 같은 색으로 보인다. 배경이 모두 진한 색이라 흰 글자 대비는 라이트·다크 양쪽에서 유지된다.
 */

const PALETTE = [
  'from-indigo-500 to-violet-500',
  'from-sky-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
  'from-fuchsia-500 to-purple-500',
];

const SIZES = {
  xs: 'w-8 h-8 text-[11px]',
  sm: 'w-10 h-10 text-sm',
  md: 'w-12 h-12 text-base',
  lg: 'w-20 h-20 text-2xl',
};

export type AvatarSize = keyof typeof SIZES;

/** 닉네임이 같으면 항상 같은 색이 나오도록 하는 단순 해시 */
const paletteFor = (nickname: string) => {
  let sum = 0;
  for (let i = 0; i < nickname.length; i += 1) {
    sum = (sum + nickname.charCodeAt(i) * (i + 1)) % 997;
  }
  return PALETTE[sum % PALETTE.length];
};

interface AvatarProps {
  nickname: string;
  size?: AvatarSize;
  className?: string;
}

export function Avatar({ nickname, size = 'md', className = '' }: AvatarProps) {
  return (
    <div
      aria-hidden
      className={`${SIZES[size]} ${paletteFor(nickname)} bg-gradient-to-br rounded-full flex items-center justify-center text-white font-semibold shrink-0 select-none ${className}`}
    >
      {nickname.charAt(0).toUpperCase()}
    </div>
  );
}
