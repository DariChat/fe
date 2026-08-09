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

  it('마지막 메시지를 미리보기로 보여준다', async () => {
    render(<RoomList />);
    await screen.findByText('이서연');

    expect(
      screen.getByText('고마워! 의견 있으면 언제든 말해줘 😊')
    ).toBeInTheDocument();
    expect(screen.getByText('그럼 금요일 4시로 잡을게요.')).toBeInTheDocument();
  });

  it('안읽은 메시지가 있는 방만 배지를 표시한다', async () => {
    render(<RoomList />);
    await screen.findByText('이서연');

    // mockRooms 기준 unreadCount 는 2, 0, 1, 0
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });
});
