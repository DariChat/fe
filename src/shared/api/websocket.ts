import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import {
  ErrorDetail,
  ErrorResponse,
  FriendEvent,
  MessageResponse,
  PublishStatus,
  RoomEvent,
} from '@/shared/types/api.types';
import { USE_MOCK, WS_URL } from '@/shared/config/env';
import { readAccessToken } from '@/shared/lib/authToken';

/*
 * 배포 서버(WebSocketConfig) 기준 값.
 * - registry.addEndpoint("/ws-talkie")  ← withSockJS() 없음. 네이티브 WebSocket 으로 접속한다.
 * - enableSimpleBroker("/sub", "/queue")
 * - setApplicationDestinationPrefixes("/pub")
 */
const APP_PREFIX = '/pub';
const TOPIC_PREFIX = '/sub';
const USER_ERROR_QUEUE = '/user/queue/errors'; // @SendToUser("/queue/errors")
/* convertAndSendToUser(userId, "/queue/rooms" | "/queue/friends", ...) */
const USER_ROOM_QUEUE = '/user/queue/rooms';
const USER_FRIEND_QUEUE = '/user/queue/friends';

const MAX_CONTENT_LENGTH = 500; // ChatMessageRequest 의 @Size(max = 500)

let client: Client | null = null;

/*
 * 연결 시점에 구독을 거는 쪽이 둘 이상이다 — 레이아웃(개인 큐)과 대화방(방 토픽).
 * client.onConnect 는 자리가 하나뿐이라 나중에 등록한 쪽이 앞의 것을 지워버리므로
 * 콜백을 여기 모아두고 onConnect 에서 한 번에 호출한다.
 */
const connectListeners = new Set<() => void>();

const notifyConnected = () => {
  connectListeners.forEach((listener) => listener());
};

/** 전송 실패 후 재시도할 때 같은 id 를 다시 써야 서버가 중복 저장하지 않는다 */
export const createClientMessageId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `cmid-${Date.now()}-${Math.random().toString(36).slice(2)}`;

/* ------------------------------------------------------------------ */
/* mock 모드용 인메모리 브로커                                          */
/* ------------------------------------------------------------------ */

type RoomHandler = (message: MessageResponse) => void;
type ErrorHandler = (error: ErrorDetail) => void;
type RoomEventHandler = (event: RoomEvent) => void;
type FriendEventHandler = (event: FriendEvent) => void;

const mockRoomHandlers = new Map<number, Set<RoomHandler>>();
const mockErrorHandlers = new Set<ErrorHandler>();
const mockRoomEventHandlers = new Set<RoomEventHandler>();
const mockFriendEventHandlers = new Set<FriendEventHandler>();
/** 서버의 findByClientMessageId 멱등 처리를 흉내내기 위한 저장소 */
const mockSentMessages = new Map<string, MessageResponse>();
let mockConnected = false;
let mockMessageId = 1000;

const mockSubscription = (unsubscribe: () => void): StompSubscription =>
  ({ id: `mock-${Date.now()}`, unsubscribe }) as StompSubscription;

/* ------------------------------------------------------------------ */

export const connectWebSocket = (token: string): Client | null => {
  if (USE_MOCK) {
    mockConnected = true;
    return null;
  }

  if (client?.active) {
    return client;
  }

  const stomp = new Client({
    brokerURL: WS_URL,
    // StompChannelInterceptor 가 CONNECT 프레임의 Authorization 헤더를 읽는다
    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },
    /*
     * 재연결은 처음 만들 때 넣어둔 connectHeaders 를 그대로 다시 쓴다.
     * 그런데 accessToken 은 REST 쪽에서 401 을 만나면 /api/auth/reissue 로 갈리므로,
     * 소켓이 오래 끊겨 있다 붙으면 이미 만료된 토큰으로 CONNECT 를 보내 계속 거절당한다.
     * 매 접속 시도 직전에 저장소의 최신 토큰을 다시 읽어 헤더를 갈아끼운다.
     */
    beforeConnect: () => {
      const latest = readAccessToken();

      // 로그아웃 등으로 토큰이 사라졌다면 다시 붙어봐야 거절당한다 — 재시도를 멈춘다
      if (!latest) {
        void stomp.deactivate();
        return;
      }

      stomp.connectHeaders = { Authorization: `Bearer ${latest}` };
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    // 재연결될 때마다 다시 호출된다 — 구독은 그때마다 새로 걸어야 한다
    onConnect: () => {
      console.log('STOMP connected');
      notifyConnected();
    },
    onDisconnect: () => {
      console.log('STOMP disconnected');
    },
    onWebSocketError: (event) => {
      console.error('WebSocket error:', event);
    },
    onStompError: (frame) => {
      console.error('STOMP error:', frame.headers.message, frame.body);
    },
  });

  client = stomp;
  stomp.activate();
  return stomp;
};

export const getWebSocket = (): Client | null => client;

export const isConnected = (): boolean =>
  USE_MOCK ? mockConnected : Boolean(client?.connected);

/**
 * 연결 완료 시점에 구독을 걸 수 있도록 콜백을 등록한다.
 * 이미 연결돼 있으면 즉시 한 번 부르고, 이후 재연결될 때마다 다시 부른다.
 *
 * 반환값은 등록 해제 함수다 — 화면이 사라질 때 풀어주지 않으면
 * 재연결될 때 죽은 화면의 구독까지 되살아난다.
 */
export const onWebSocketConnect = (callback: () => void): (() => void) => {
  if (USE_MOCK) {
    callback();
    return () => {};
  }

  connectListeners.add(callback);

  if (client?.connected) {
    callback();
  }

  return () => {
    connectListeners.delete(callback);
  };
};

/** /sub/rooms/{roomId} 구독 — ChatController 가 MessageResponse 를 그대로 발행한다 */
export const subscribeRoom = (
  roomId: number,
  onMessage: RoomHandler
): StompSubscription | null => {
  if (USE_MOCK) {
    const handlers = mockRoomHandlers.get(roomId) ?? new Set<RoomHandler>();
    handlers.add(onMessage);
    mockRoomHandlers.set(roomId, handlers);
    return mockSubscription(() => handlers.delete(onMessage));
  }

  if (!client?.connected) {
    console.warn('STOMP not connected, cannot subscribe');
    return null;
  }

  return client.subscribe(
    `${TOPIC_PREFIX}/rooms/${roomId}`,
    (frame: IMessage) => {
      onMessage(JSON.parse(frame.body) as MessageResponse);
    }
  );
};

/**
 * /user/queue/rooms — 방 목록의 변화를 서버가 밀어준다 (RoomNotificationListener).
 *
 * 보고 있지 않은 방의 새 메시지는 여기로만 온다.
 * 서버가 /sub/rooms/{roomId} 구독자에게는 ROOM_UPDATED 를 보내지 않기 때문에
 * 지금 열어둔 방의 미리보기는 여전히 방 토픽 쪽에서 갱신해야 한다.
 */
export const subscribeRoomEvents = (
  onEvent: RoomEventHandler
): StompSubscription | null => {
  if (USE_MOCK) {
    mockRoomEventHandlers.add(onEvent);
    return mockSubscription(() => mockRoomEventHandlers.delete(onEvent));
  }

  if (!client?.connected) {
    return null;
  }

  return client.subscribe(USER_ROOM_QUEUE, (frame: IMessage) => {
    onEvent(JSON.parse(frame.body) as RoomEvent);
  });
};

/** /user/queue/friends — 친구 요청 도착·수락을 서버가 밀어준다 (FriendNotificationListener) */
export const subscribeFriendEvents = (
  onEvent: FriendEventHandler
): StompSubscription | null => {
  if (USE_MOCK) {
    mockFriendEventHandlers.add(onEvent);
    return mockSubscription(() => mockFriendEventHandlers.delete(onEvent));
  }

  if (!client?.connected) {
    return null;
  }

  return client.subscribe(USER_FRIEND_QUEUE, (frame: IMessage) => {
    onEvent(JSON.parse(frame.body) as FriendEvent);
  });
};

/**
 * mock 모드에는 이벤트를 만들어줄 서버가 없다.
 * 테스트와 mock 화면에서 푸시가 온 상황을 직접 재현할 때 쓴다.
 */
export const emitMockRoomEvent = (event: RoomEvent): void => {
  mockRoomEventHandlers.forEach((handler) => handler(event));
};

export const emitMockFriendEvent = (event: FriendEvent): void => {
  mockFriendEventHandlers.forEach((handler) => handler(event));
};

/** @MessageExceptionHandler 가 ErrorResponse JSON 을 보내는 개인 에러 큐 */
export const subscribeErrors = (
  onError: ErrorHandler
): StompSubscription | null => {
  if (USE_MOCK) {
    mockErrorHandlers.add(onError);
    return mockSubscription(() => mockErrorHandlers.delete(onError));
  }

  if (!client?.connected) {
    return null;
  }

  return client.subscribe(USER_ERROR_QUEUE, (frame: IMessage) => {
    try {
      onError((JSON.parse(frame.body) as ErrorResponse).error);
    } catch {
      onError({ code: 'UNKNOWN', message: frame.body });
    }
  });
};

/**
 * @MessageMapping("/rooms/{roomId}/send") — prefix 포함 시 /pub/rooms/{roomId}/send
 *
 * clientMessageId 는 호출부가 만들어서 넘긴다. 실패해 재시도할 때 같은 값을 다시 넘기면
 * 서버가 동일 전송 시도로 인식해 중복 저장하지 않는다.
 */
export const sendChatMessage = (
  roomId: number,
  content: string,
  clientMessageId: string
): boolean => {
  if (USE_MOCK) {
    if (!mockConnected) {
      console.warn('mock 소켓이 연결되지 않아 메시지를 보낼 수 없습니다');
      return false;
    }

    // 백엔드 검증(@NotBlank, @Size(max=500))과 동일한 조건을 흉내낸다
    if (!content.trim() || content.length > MAX_CONTENT_LENGTH) {
      mockErrorHandlers.forEach((handler) =>
        handler({ code: 'C001', message: '입력값이 올바르지 않습니다.' })
      );
      return false;
    }

    // 같은 clientMessageId 는 이미 저장된 메시지로 취급하고 재발행하지 않는다
    if (mockSentMessages.has(clientMessageId)) {
      return true;
    }

    const echoed: MessageResponse = {
      id: mockMessageId++,
      content,
      senderNickname: localStorage.getItem('userNickname') || '민수',
      clientMessageId,
      publishStatus: PublishStatus.PUBLISHED,
      // 내가 보낸 메시지에는 내 언어 번역이 붙지 않으므로 mock 도 비워 둔다
      translations: {},
      createdAt: new Date().toISOString(),
    };
    mockSentMessages.set(clientMessageId, echoed);
    mockRoomHandlers.get(roomId)?.forEach((handler) => handler(echoed));
    return true;
  }

  if (!client?.connected) {
    console.warn('STOMP not connected, cannot send message');
    return false;
  }

  client.publish({
    destination: `${APP_PREFIX}/rooms/${roomId}/send`,
    body: JSON.stringify({ content, clientMessageId }),
  });
  return true;
};

export const disconnectWebSocket = (): void => {
  if (USE_MOCK) {
    mockConnected = false;
    mockRoomHandlers.clear();
    mockErrorHandlers.clear();
    mockRoomEventHandlers.clear();
    mockFriendEventHandlers.clear();
    mockSentMessages.clear();
    return;
  }

  connectListeners.clear();

  if (client) {
    client.deactivate();
    client = null;
  }
};
