/**
 * mock 브로커가 아니라 실제 STOMP 클라이언트를 쓰는 경로를 검증한다.
 * (@stomp/stompjs 만 가짜로 바꿔 끼우고 websocket.ts 는 그대로 돌린다)
 *
 * 여기서 잡고 싶은 건 둘이다.
 *  - 연결 콜백을 거는 쪽이 둘 이상이어도 나중에 등록한 쪽이 앞의 것을 지우지 않을 것
 *    (레이아웃은 개인 큐를, 대화방은 방 토픽을 이 시점에 구독한다 — 지워지면 조용히 죽는다)
 *  - 재연결할 때 낡은 토큰을 다시 쓰지 않을 것 (재발급된 토큰을 읽어와야 한다)
 */

jest.mock('@/shared/config/env', () => ({
  ...jest.requireActual('@/shared/config/env'),
  USE_MOCK: false,
}));

interface FakeConfig {
  connectHeaders?: Record<string, string>;
  onConnect?: () => void;
  beforeConnect?: () => void;
}

const subscribe = jest.fn(() => ({ id: 'sub', unsubscribe: jest.fn() }));
const deactivate = jest.fn();
let lastConfig: FakeConfig = {};
let lastClient: { connectHeaders?: Record<string, string> } | null = null;

jest.mock('@stomp/stompjs', () => ({
  Client: class {
    connected = false;
    connectHeaders?: Record<string, string>;
    constructor(config: FakeConfig) {
      lastConfig = config;
      this.connectHeaders = config.connectHeaders;
      lastClient = this;
    }
    activate() {}
    deactivate = deactivate;
    subscribe = subscribe;
  },
}));

import {
  connectWebSocket,
  disconnectWebSocket,
  onWebSocketConnect,
} from './websocket';

describe('websocket (실제 STOMP 클라이언트)', () => {
  beforeEach(() => {
    disconnectWebSocket();
    subscribe.mockClear();
    deactivate.mockClear();
    lastConfig = {};
    lastClient = null;
    localStorage.setItem('accessToken', 'token');
    connectWebSocket('token');
  });

  afterEach(() => {
    disconnectWebSocket();
  });

  it('연결되면 등록된 콜백이 모두 호출된다', () => {
    const onLayoutConnect = jest.fn();
    const onChatConnect = jest.fn();

    onWebSocketConnect(onLayoutConnect);
    onWebSocketConnect(onChatConnect);

    // 아직 연결 전이므로 아무도 불리지 않는다
    expect(onLayoutConnect).not.toHaveBeenCalled();

    lastConfig.onConnect?.();

    expect(onLayoutConnect).toHaveBeenCalledTimes(1);
    expect(onChatConnect).toHaveBeenCalledTimes(1);
  });

  it('재연결되면 구독을 다시 걸도록 콜백이 또 호출된다', () => {
    const onConnect = jest.fn();
    onWebSocketConnect(onConnect);

    lastConfig.onConnect?.();
    lastConfig.onConnect?.();

    expect(onConnect).toHaveBeenCalledTimes(2);
  });

  it('등록을 해제한 화면은 재연결 때 되살아나지 않는다', () => {
    const onGone = jest.fn();
    const onAlive = jest.fn();

    const off = onWebSocketConnect(onGone);
    onWebSocketConnect(onAlive);
    off();

    lastConfig.onConnect?.();

    expect(onGone).not.toHaveBeenCalled();
    expect(onAlive).toHaveBeenCalledTimes(1);
  });

  describe('재연결 시 토큰', () => {
    it('접속 직전에 저장소의 최신 토큰을 다시 읽는다', () => {
      expect(lastClient?.connectHeaders).toEqual({
        Authorization: 'Bearer token',
      });

      // 소켓이 끊겨 있는 동안 REST 쪽에서 재발급된 상황
      localStorage.setItem('accessToken', 'reissued-token');
      lastConfig.beforeConnect?.();

      expect(lastClient?.connectHeaders).toEqual({
        Authorization: 'Bearer reissued-token',
      });
    });

    it('토큰이 사라졌으면 재접속을 멈춘다', () => {
      localStorage.removeItem('accessToken');

      lastConfig.beforeConnect?.();

      expect(deactivate).toHaveBeenCalled();
    });
  });
});
