import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import {
  ErrorDetail,
  ErrorResponse,
  MessageResponse,
  PublishStatus,
} from '@/shared/types/api.types';
import { USE_MOCK, WS_URL } from '@/shared/config/env';

/*
 * 배포 서버(WebSocketConfig) 기준 값.
 * - registry.addEndpoint("/ws-talkie")  ← withSockJS() 없음. 네이티브 WebSocket 으로 접속한다.
 * - enableSimpleBroker("/sub", "/queue")
 * - setApplicationDestinationPrefixes("/pub")
 */
const APP_PREFIX = '/pub';
const TOPIC_PREFIX = '/sub';
const USER_ERROR_QUEUE = '/user/queue/errors'; // @SendToUser("/queue/errors")

const MAX_CONTENT_LENGTH = 500; // ChatMessageRequest 의 @Size(max = 500)

let client: Client | null = null;

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

const mockRoomHandlers = new Map<number, Set<RoomHandler>>();
const mockErrorHandlers = new Set<ErrorHandler>();
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

  client = new Client({
    brokerURL: WS_URL,
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
    onWebSocketError: (event) => {
      console.error('WebSocket error:', event);
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
  // 재연결될 때마다 구독을 다시 걸어야 하므로 onConnect 를 계속 유지한다
  client.onConnect = () => {
    console.log('STOMP connected');
    callback();
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
    mockSentMessages.clear();
    return;
  }

  if (client) {
    client.deactivate();
    client = null;
  }
};
