import {
  connectWebSocket,
  disconnectWebSocket,
  isConnected,
  onWebSocketConnect,
  sendChatMessage,
  subscribeErrors,
  subscribeRoom,
} from './websocket';
import { MessageResponse } from '@/shared/types/api.types';

const ROOM_ID = 1;

describe('websocket (mock 브로커)', () => {
  beforeEach(() => {
    disconnectWebSocket();
    localStorage.setItem('userNickname', '민수');
    connectWebSocket('mock-token');
  });

  afterEach(() => {
    disconnectWebSocket();
  });

  it('연결되면 onWebSocketConnect 콜백이 실행된다', () => {
    const onConnect = jest.fn();
    onWebSocketConnect(onConnect);

    expect(onConnect).toHaveBeenCalled();
    expect(isConnected()).toBe(true);
  });

  it('보낸 메시지가 구독 중인 방으로 되돌아온다', () => {
    const received: MessageResponse[] = [];
    subscribeRoom(ROOM_ID, (message) => received.push(message));

    expect(sendChatMessage(ROOM_ID, '안녕하세요')).toBe(true);

    expect(received).toHaveLength(1);
    expect(received[0].content).toBe('안녕하세요');
    expect(received[0].senderNickname).toBe('민수');
  });

  it('다른 방의 구독자에게는 전달되지 않는다', () => {
    const onRoom1 = jest.fn();
    const onRoom2 = jest.fn();
    subscribeRoom(1, onRoom1);
    subscribeRoom(2, onRoom2);

    sendChatMessage(1, 'room 1 전용');

    expect(onRoom1).toHaveBeenCalledTimes(1);
    expect(onRoom2).not.toHaveBeenCalled();
  });

  it('unsubscribe 하면 더 이상 수신하지 않는다', () => {
    const onMessage = jest.fn();
    const subscription = subscribeRoom(ROOM_ID, onMessage);

    sendChatMessage(ROOM_ID, '첫 메시지');
    subscription?.unsubscribe();
    sendChatMessage(ROOM_ID, '두 번째 메시지');

    expect(onMessage).toHaveBeenCalledTimes(1);
  });

  it('500자를 넘으면 백엔드처럼 검증 에러를 내려준다', () => {
    const onError = jest.fn();
    const onMessage = jest.fn();
    subscribeErrors(onError);
    subscribeRoom(ROOM_ID, onMessage);

    expect(sendChatMessage(ROOM_ID, 'a'.repeat(501))).toBe(false);

    expect(onError).toHaveBeenCalledWith('입력값이 올바르지 않습니다.');
    expect(onMessage).not.toHaveBeenCalled();
  });

  it('연결이 끊긴 상태에서는 전송에 실패한다', () => {
    disconnectWebSocket();

    expect(isConnected()).toBe(false);
    expect(sendChatMessage(ROOM_ID, '안녕')).toBe(false);
  });
});
