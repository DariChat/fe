import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RoomList } from './RoomList';

const push = jest.fn();

// 방 생성 후 대화방으로 이동하므로 라우터가 필요하다 (jsdom 에는 app router 가 없다)
jest.mock('next/navigation', () => ({
  usePathname: () => '/rooms',
  useRouter: () => ({ push }),
}));

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

  describe('방 만들기', () => {
    beforeEach(() => push.mockClear());

    const openModal = async () => {
      const user = userEvent.setup();
      render(<RoomList />);
      await screen.findByText('이서연');
      await user.click(screen.getByRole('button', { name: '새 채팅방 만들기' }));
      return user;
    };

    it('+ 버튼을 누르면 생성 폼이 열린다', async () => {
      await openModal();

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('그룹 채팅은 방 이름 없이 만들 수 없다', async () => {
      const user = await openModal();

      await user.click(screen.getByRole('button', { name: '그룹 채팅' }));
      await user.type(screen.getByLabelText('참여자 id'), '2, 3');
      await user.click(screen.getByRole('button', { name: '채팅방 만들기' }));

      expect(
        screen.getByText('그룹 채팅은 방 이름이 필요해요')
      ).toBeInTheDocument();
      expect(push).not.toHaveBeenCalled();
    });

    it('1:1 채팅은 참여자를 두 명 이상 지정할 수 없다', async () => {
      const user = await openModal();

      await user.type(screen.getByLabelText('참여자 id'), '2, 3');
      await user.click(screen.getByRole('button', { name: '채팅방 만들기' }));

      expect(
        screen.getByText('1:1 채팅은 참여자를 한 명만 지정할 수 있어요')
      ).toBeInTheDocument();
    });

    it('만들고 나면 목록 맨 위에 추가되고 그 방으로 이동한다', async () => {
      const user = await openModal();

      // 1:1 일 때는 라벨에 '(선택)' 이 붙는다
      await user.type(screen.getByLabelText(/방 이름/), '스터디');
      await user.type(screen.getByLabelText('참여자 id'), '2');
      await user.click(screen.getByRole('button', { name: '채팅방 만들기' }));

      expect(await screen.findByText('스터디')).toBeInTheDocument();
      expect(push).toHaveBeenCalledWith(
        expect.stringMatching(/^\/chat\/\d+$/)
      );
    });
  });
});
