import { render, screen } from '@testing-library/react';
import { RoomList } from './RoomList';

describe('RoomList', () => {
  it('처음에는 로딩 상태를 보여준다', () => {
    render(<RoomList />);

    expect(screen.getByText('채팅 목록을 불러오는 중...')).toBeInTheDocument();
  });

  it('mock 방 목록을 불러와 렌더링한다', async () => {
    render(<RoomList />);

    expect(await screen.findByText('이서연')).toBeInTheDocument();
    expect(screen.getByText('프로젝트 팀')).toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(4);
  });

  it('각 방은 /chat/{roomId} 로 연결된다 (main 세그먼트 없음)', async () => {
    render(<RoomList />);

    const firstRoom = await screen.findByRole('link', { name: /이서연/ });

    expect(firstRoom).toHaveAttribute('href', '/chat/1');
  });

  it('참여 인원 수를 표시한다', async () => {
    render(<RoomList />);
    await screen.findByText('이서연');

    // 숫자와 "명 참여" 가 서로 다른 텍스트 노드로 쪼개지므로 전체 문자열로 비교한다
    const memberCounts = screen
      .getAllByText(/명 참여/)
      .map((el) => el.textContent);

    expect(memberCounts).toEqual(['2명 참여', '5명 참여', '2명 참여', '3명 참여']);
  });
});
