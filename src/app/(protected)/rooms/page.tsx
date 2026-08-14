import Link from 'next/link';
import { ChatIcon } from '@/shared/ui/icons';

/**
 * 채팅 목록 자체는 (protected)/layout.tsx 가 패널로 렌더링한다.
 * 이 페이지는 데스크톱 2단 레이아웃에서 오른쪽에 남는 영역을 채우는 역할만 한다.
 * (모바일에서는 목록이 화면 전체를 쓰므로 이 영역이 아예 숨겨진다)
 */
export default function RoomsPage() {
  return (
    <div className="flex items-center justify-center h-full bg-bg">
      <div className="text-center max-w-xs px-6">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-surface border border-line flex items-center justify-center text-ink-subtle shadow-soft">
          <ChatIcon className="w-6 h-6" />
        </div>
        <p className="font-medium">대화를 선택하세요</p>
        <p className="text-sm text-ink-muted mt-1">
          왼쪽 목록에서 대화를 고르거나, + 버튼으로 새 대화를 시작할 수 있어요.
        </p>
        <Link
          href="/discover"
          className="inline-block mt-5 px-4 py-2 text-sm font-medium bg-surface border border-line rounded-xl hover:bg-surface-2 transition"
        >
          다른 언어 쓰는 친구 찾기
        </Link>
      </div>
    </div>
  );
}
