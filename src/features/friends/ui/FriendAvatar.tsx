import { Avatar } from '@/shared/ui/Avatar';

/**
 * 친구·요청·검색 목록에서 쓰는 아바타.
 * 실제 구현은 공용 Avatar 하나로 모았고, 여기서는 목록에 맞는 크기 이름만 남겨 둔다.
 */
export function FriendAvatar({
  nickname,
  size = 'md',
}: {
  nickname: string;
  size?: 'sm' | 'md';
}) {
  return <Avatar nickname={nickname} size={size} />;
}
