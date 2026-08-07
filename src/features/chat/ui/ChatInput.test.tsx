import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatInput } from './ChatInput';

describe('ChatInput', () => {
  it('입력이 비어 있으면 전송 버튼이 비활성화된다', () => {
    render(<ChatInput onSendMessage={jest.fn()} />);

    expect(screen.getByRole('button', { name: /전송/ })).toBeDisabled();
  });

  it('메시지를 입력하고 전송하면 onSendMessage 가 호출되고 입력창이 비워진다', async () => {
    const user = userEvent.setup();
    const onSendMessage = jest.fn().mockResolvedValue(undefined);
    render(<ChatInput onSendMessage={onSendMessage} />);

    const input = screen.getByPlaceholderText('메시지를 입력하세요...');
    await user.type(input, '안녕하세요');
    await user.click(screen.getByRole('button', { name: /전송/ }));

    expect(onSendMessage).toHaveBeenCalledWith('안녕하세요');
    await waitFor(() => expect(input).toHaveValue(''));
  });

  it('앞뒤 공백은 잘라서 보낸다', async () => {
    const user = userEvent.setup();
    const onSendMessage = jest.fn().mockResolvedValue(undefined);
    render(<ChatInput onSendMessage={onSendMessage} />);

    await user.type(screen.getByPlaceholderText('메시지를 입력하세요...'), '  hi  ');
    await user.click(screen.getByRole('button', { name: /전송/ }));

    expect(onSendMessage).toHaveBeenCalledWith('hi');
  });

  it('글자 수 카운터가 입력에 따라 갱신된다', async () => {
    const user = userEvent.setup();
    render(<ChatInput onSendMessage={jest.fn()} />);

    expect(screen.getByText('0/500자')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('메시지를 입력하세요...'), 'hello');

    expect(screen.getByText('5/500자')).toBeInTheDocument();
  });

  it('전송이 실패해도 입력값은 남아 있다', async () => {
    const user = userEvent.setup();
    const onSendMessage = jest.fn().mockRejectedValue(new Error('연결 끊김'));
    jest.spyOn(console, 'error').mockImplementation(() => {});
    render(<ChatInput onSendMessage={onSendMessage} />);

    const input = screen.getByPlaceholderText('메시지를 입력하세요...');
    await user.type(input, '재전송할 메시지');
    await user.click(screen.getByRole('button', { name: /전송/ }));

    await waitFor(() => expect(input).toHaveValue('재전송할 메시지'));
  });
});
