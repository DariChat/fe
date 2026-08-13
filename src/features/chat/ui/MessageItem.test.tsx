import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessageItem } from './MessageItem';
import {
  MessageResponse,
  PreferredLanguage,
  PublishStatus,
} from '@/shared/types/api.types';

const message = (
  overrides: Partial<MessageResponse> = {}
): MessageResponse => ({
  id: 1,
  content: 'Good morning!',
  senderNickname: 'Emily',
  clientMessageId: 'c-1',
  publishStatus: PublishStatus.PUBLISHED,
  translations: {},
  createdAt: new Date().toISOString(),
  ...overrides,
});

describe('MessageItem 번역 표시', () => {
  it('내 언어 번역이 오면 번역문을 먼저 보여준다', () => {
    render(
      <MessageItem
        message={message({
          translations: { [PreferredLanguage.KO]: '좋은 아침이에요!' },
        })}
        isOwn={false}
        myLanguage={PreferredLanguage.KO}
      />
    );

    expect(screen.getByText('좋은 아침이에요!')).toBeInTheDocument();
    expect(screen.queryByText('Good morning!')).not.toBeInTheDocument();
  });

  it('원문 보기를 누르면 원문으로 바뀐다', async () => {
    const user = userEvent.setup();
    render(
      <MessageItem
        message={message({
          translations: { [PreferredLanguage.KO]: '좋은 아침이에요!' },
        })}
        isOwn={false}
        myLanguage={PreferredLanguage.KO}
      />
    );

    await user.click(screen.getByRole('button', { name: '원문 보기' }));

    expect(screen.getByText('Good morning!')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '번역문 보기' })
    ).toBeInTheDocument();
  });

  it('내 언어 번역이 없으면 원문만 보여준다', () => {
    render(
      <MessageItem
        message={message({
          translations: { [PreferredLanguage.JA]: 'おはよう!' },
        })}
        isOwn={false}
        myLanguage={PreferredLanguage.KO}
      />
    );

    expect(screen.getByText('Good morning!')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '원문 보기' })).toBeNull();
  });

  it('내가 보낸 메시지는 번역문으로 바꿔치지 않는다', () => {
    render(
      <MessageItem
        message={message({
          senderNickname: '민수',
          content: '좋은 아침이에요!',
          translations: { [PreferredLanguage.EN]: 'Good morning!' },
        })}
        isOwn
        myLanguage={PreferredLanguage.KO}
      />
    );

    expect(screen.getByText('좋은 아침이에요!')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '원문 보기' })).toBeNull();
  });
});
