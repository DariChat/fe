/**
 * 닉네임 첫 글자를 쓰는 원형 아바타.
 * profileImageUrl 은 임의의 외부 주소라 next/image 의 허용 도메인 설정이 필요해
 * 채팅방/메시지와 같은 방식(이니셜)으로 통일해 둔다.
 */
export function FriendAvatar({
  nickname,
  size = 'md',
}: {
  nickname: string;
  size?: 'sm' | 'md';
}) {
  const sizeClass = size === 'sm' ? 'w-10 h-10 text-sm' : 'w-12 h-12';

  return (
    <div
      aria-hidden
      className={`${sizeClass} rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 flex items-center justify-center text-white font-semibold shrink-0`}
    >
      {nickname.charAt(0).toUpperCase()}
    </div>
  );
}
