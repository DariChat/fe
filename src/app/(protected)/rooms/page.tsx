/**
 * 채팅 목록 자체는 (protected)/layout.tsx 가 패널로 렌더링한다.
 * 이 페이지는 데스크톱 2단 레이아웃에서 오른쪽에 남는 영역을 채우는 역할만 한다.
 * (모바일에서는 목록이 화면 전체를 쓰므로 이 영역이 아예 숨겨진다)
 */
export default function RoomsPage() {
  return (
    <div className="flex items-center justify-center h-full bg-gray-50">
      <div className="text-center">
        <p className="text-5xl mb-4">💬</p>
        <p className="text-gray-600 font-medium">대화할 채팅방을 선택하세요</p>
        <p className="text-gray-400 text-sm mt-1">
          왼쪽 목록에서 채팅방을 골라 대화를 시작할 수 있어요
        </p>
      </div>
    </div>
  );
}
