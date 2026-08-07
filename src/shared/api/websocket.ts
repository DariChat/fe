import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { MessageResponse } from '@/shared/types/api.types';
import { USE_MOCK, WS_URL } from '@/shared/config/env';

// 백엔드 WebSocketConfig 와 동일하게 맞춘 값
const STOMP_ENDPOINT = '/ws-talkie'; // registry.addEndpoint("/ws-talkie").withSockJS()
const APP_PREFIX = '/app'; // setApplicationDestinationPrefixes("/app")
const TOPIC_PREFIX = '/topic'; // enableSimpleBroker("/topic", "/queue")
const USER_ERROR_QUEUE = '/user/queue/errors'; // @SendToUser("/queue/errors")

const MAX_CONTENT_LENGTH = 500; // ChatMessageRequest 의 @Size(max = 500)

let client: Client | null = null;

/* ------------------------------------------------------------------ */
/* mock 모드용 인메모리 브로커                                          */
/* ------------------------------------------------------------------ */

type RoomHandler = (message: MessageResponse) => void;

const mockRoomHandlers = new Map<number, Set<RoomHandler>>();
const mockErrorHandlers = new Set<(message: string) => void>();
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

  client = new Client({
    webSocketFactory: () => new SockJS(`${WS_URL}${STOMP_ENDPOINT}`),
    // StompChannelInterceptor 가 CONNECT 프레임의 Authorization 헤더를 읽는다
    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    onDisconnect: () => {
      console.log('STOMP disconnected');
    },
    onStompError: (frame) => {
      console.error('STOMP error:', frame.headers.message, frame.body);
    },
  });

  client.activate();
  return client;
};

export const getWebSocket = (): Client | null => client;

export const isConnected = (): boolean =>
  USE_MOCK ? mockConnected : Boolean(client?.connected);

/** 연결 완료 시점에 구독을 걸 수 있도록 onConnect 콜백을 등록한다 */
export const onWebSocketConnect = (callback: () => void): void => {
  if (USE_MOCK) {
    callback();
    return;
  }

  if (!client) return;

  if (client.connected) {
    callback();
    return;
  }
  client.onConnect = () => {
    console.log('STOMP connected');
    callback();
  };
};

/** /topic/rooms/{roomId} 구독 — RedisSubscriber 가 MessageResponse 를 그대로 발행한다 */
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

  return client.subscribe(`${TOPIC_PREFIX}/rooms/${roomId}`, (frame: IMessage) => {
    onMessage(JSON.parse(frame.body) as MessageResponse);
  });
};

/** @MessageExceptionHandler 가 보내는 개인 에러 큐 구독 */
export const subscribeErrors = (
  onError: (message: string) => void
): StompSubscription | null => {
  if (USE_MOCK) {
    mockErrorHandlers.add(onError);
    return mockSubscription(() => mockErrorHandlers.delete(onError));
  }

  if (!client?.connected) {
    return null;
  }

  return client.subscribe(USER_ERROR_QUEUE, (frame: IMessage) => {
    onError(frame.body);
  });
};

/** @MessageMapping("/rooms/{roomId}/send") — prefix 포함 시 /app/rooms/{roomId}/send */
export const sendChatMessage = (roomId: number, content: string): boolean => {
  if (USE_MOCK) {
    if (!mockConnected) {
      console.warn('mock 소켓이 연결되지 않아 메시지를 보낼 수 없습니다');
      return false;
    }

    // 백엔드 검증(@NotBlank, @Size(max=500))과 동일한 조건을 흉내낸다
    if (!content.trim() || content.length > MAX_CONTENT_LENGTH) {
      mockErrorHandlers.forEach((handler) =>
        handler('입력값이 올바르지 않습니다.')
      );
      return false;
    }

    const echoed: MessageResponse = {
      id: mockMessageId++,
      content,
      senderNickname: localStorage.getItem('userNickname') || '민수',
      createdAt: new Date().toISOString(),
    };
    mockRoomHandlers.get(roomId)?.forEach((handler) => handler(echoed));
    return true;
  }

  if (!client?.connected) {
    console.warn('STOMP not connected, cannot send message');
    return false;
  }

  client.publish({
    destination: `${APP_PREFIX}/rooms/${roomId}/send`,
    body: JSON.stringify({ content }),
  });
  return true;
};

export const disconnectWebSocket = (): void => {
  if (USE_MOCK) {
    mockConnected = false;
    mockRoomHandlers.clear();
    mockErrorHandlers.clear();
    return;
  }

  if (client) {
    client.deactivate();
    client = null;
  }
};
