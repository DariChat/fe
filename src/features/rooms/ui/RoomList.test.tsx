import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { UserEvent } from '@testing-library/user-event';
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
    expect(screen.getAllByRole('link')).toHaveLength(5);
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

    // mockRooms 기준 unreadCount 는 2, 0, 1, 0, 0
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

    /** 참여자는 id 입력이 아니라 친구 목록(mockFriends)에서 고른다 */
    const pickFriend = async (user: UserEvent, nickname: string) =>
      user.click(await screen.findByRole('button', { name: new RegExp(nickname) }));

    it('참여자를 친구 목록에서 고른다 (id 입력이 아니다)', async () => {
      await openModal();

      expect(await screen.findByRole('button', { name: /서연/ })).toBeInTheDocument();
      expect(screen.queryByLabelText('참여자 id')).not.toBeInTheDocument();
    });

    it('친구를 고르지 않으면 만들 수 없다', async () => {
      const user = await openModal();
      await screen.findByRole('button', { name: /서연/ });

      await user.click(screen.getByRole('button', { name: '채팅방 만들기' }));

      expect(screen.getByText('대화할 친구를 선택하세요')).toBeInTheDocument();
      expect(push).not.toHaveBeenCalled();
    });

    it('그룹 채팅은 방 이름 없이 만들 수 없다', async () => {
      const user = await openModal();

      await user.click(screen.getByRole('button', { name: '그룹 채팅' }));
      await pickFriend(user, '준호');
      await user.click(screen.getByRole('button', { name: '채팅방 만들기' }));

      expect(
        screen.getByText('그룹 채팅은 방 이름이 필요해요')
      ).toBeInTheDocument();
      expect(push).not.toHaveBeenCalled();
    });

    it('1:1 은 한 명만 선택된다 — 다른 친구를 고르면 갈아끼운다', async () => {
      const user = await openModal();

      await pickFriend(user, '서연');
      await pickFriend(user, '준호');

      expect(screen.getByRole('button', { name: /서연/ })).toHaveAttribute(
        'aria-pressed',
        'false'
      );
      expect(screen.getByRole('button', { name: /준호/ })).toHaveAttribute(
        'aria-pressed',
        'true'
      );
    });

    it('그룹 채팅은 여러 명을 고를 수 있다', async () => {
      const user = await openModal();

      await user.click(screen.getByRole('button', { name: '그룹 채팅' }));
      await pickFriend(user, '서연');
      await pickFriend(user, '준호');

      expect(screen.getByText('2명 선택됨')).toBeInTheDocument();
    });

    it('닉네임으로 친구를 걸러낼 수 있다', async () => {
      const user = await openModal();
      await screen.findByRole('button', { name: /서연/ });

      await user.type(screen.getByLabelText('친구 검색'), '준');

      expect(screen.queryByRole('button', { name: /서연/ })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /준호/ })).toBeInTheDocument();
    });

    it('만들고 나면 목록 맨 위에 추가되고 그 방으로 이동한다', async () => {
      const user = await openModal();

      await user.click(screen.getByRole('button', { name: '그룹 채팅' }));
      await user.type(screen.getByLabelText('방 이름'), '스터디');
      await pickFriend(user, '서연');
      await user.click(screen.getByRole('button', { name: '채팅방 만들기' }));

      expect(await screen.findByText('스터디')).toBeInTheDocument();
      expect(push).toHaveBeenCalledWith(
        expect.stringMatching(/^\/chat\/\d+$/)
      );
    });
  });
});
