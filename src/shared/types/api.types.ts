/**
 * 배포 서버 스펙 기준 (http://52.78.23.95/v3/api-docs, DariChat API v1)
 */

// 공통 응답 래퍼 — 모든 REST 응답이 { success, data } 로 감싸져 온다
export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface ErrorDetail {
  code: string;
  message: string;
}

export interface ErrorResponse {
  success: false;
  error: ErrorDetail;
}

// 인증
export interface LoginRequest {
  email: string;
  password: string;
}

/** preferredLanguage 는 서버에서 필수다 — 빠지면 400 이 온다 */
export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  nickname: string;
  preferredLanguage: PreferredLanguage;
}

/** 로그인/재발급 시 refreshToken 은 HttpOnly 쿠키로만 내려오고 바디에는 null 이 담긴다 */
export interface TokenResponse {
  accessToken: string;
  refreshToken: string | null;
}

// 사용자

/** 서버가 번역 대상 언어를 고르는 기준 (User.preferredLanguage) */
export enum PreferredLanguage {
  KO = 'KO',
  EN = 'EN',
  JA = 'JA',
  ZH = 'ZH',
}

export const LANGUAGE_LABELS: Record<PreferredLanguage, string> = {
  [PreferredLanguage.KO]: '한국어',
  [PreferredLanguage.EN]: 'English',
  [PreferredLanguage.JA]: '日本語',
  [PreferredLanguage.ZH]: '中文',
};

export interface UserResponse {
  name: string;
  email: string;
  nickname: string;
  profileImageUrl: string | null;
  /** 자기소개 (최대 200자) */
  bio: string | null;
  preferredLanguage: PreferredLanguage;
  lastActiveAt: string;
}

/**
 * nickname · preferredLanguage 는 서버에서 필수다 (나머지는 선택).
 *
 * 서버는 받은 값으로 프로필을 통째로 덮어쓴다 — bio 를 빼고 보내면 기존 자기소개가 지워진다.
 * 수정 화면은 항상 현재 값을 채워서 보낸다.
 */
export interface UserUpdateRequest {
  nickname: string;
  profileImageUrl?: string | null;
  preferredLanguage: PreferredLanguage;
  /** 최대 200자 (@Size(max = 200)) */
  bio?: string | null;
}

export interface PasswordUpdateRequest {
  password: string;
}

/** GET /api/users/search 결과. 커서는 마지막 항목의 nickname 문자열이다. */
/**
 * GET /api/users/search 결과.
 *
 * bio · preferredLanguage 는 아직 서버가 내려주지 않는다 (UserSearchResponse 에 없다).
 * 검색 결과도 추천처럼 자기소개를 함께 보여주려면 서버 DTO 에 두 필드를 더하면 되고,
 * 화면은 값이 있을 때만 그리도록 되어 있어 그때 프론트는 손댈 것이 없다.
 */
export interface UserSearchResponse {
  id: number;
  nickname: string;
  profileImageUrl: string | null;
  bio?: string | null;
  preferredLanguage?: PreferredLanguage;
}

/**
 * GET /api/users/recommendations — 홈 추천 유저.
 *
 * 서버가 "나와 다른 언어를 쓰고, 아직 친구도 요청 관계도 아닌" 사람을 무작위로 골라준다.
 * 무작위라 커서 페이징이 불가능해서, 이미 받은 id 를 excludeIds 로 계속 넘겨 중복을 막는다.
 * (검색 결과와 달리 userId 라는 이름을 쓰고 자기소개·언어가 함께 온다)
 */
export interface UserRecommendationResponse {
  userId: number;
  nickname: string;
  profileImageUrl: string | null;
  bio: string | null;
  preferredLanguage: PreferredLanguage;
}

// 친구
export enum FriendshipStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
}

/**
 * friendshipId 는 친구 관계를 끊을 때 쓰는 값이다 (DELETE /api/friends/requests/{friendshipId}).
 * 목록 조회에는 항상 담겨 오지만, 수락 푸시(FriendEvent.friend)로 받은 친구에는 null 이다
 * — 서버가 그 이벤트에서는 관계 id 를 채우지 않는다. 삭제 직전에 목록을 다시 받아 채운다.
 */
export interface FriendResponse {
  friendshipId: number | null;
  userId: number;
  nickname: string;
  profileImageUrl: string | null;
}

export interface FriendRequestResponse {
  friendshipId: number;
  requesterId: number;
  requesterNickname: string;
  requesterProfileImageUrl: string | null;
  status: FriendshipStatus;
  createdAt: string;
}

// 채팅방
export enum RoomType {
  DIRECT = 'DIRECT',
  GROUP = 'GROUP',
}

export interface RoomCreateRequest {
  roomName?: string;
  roomType: RoomType;
  memberIds: number[];
}

/**
 * 방 생성 응답.
 * alreadyExists 는 1:1 방을 다시 만들려 했을 때 서버가 기존 방을 그대로 돌려줬다는 표시다.
 * (이 경우 응답 코드도 201 이 아니라 200 으로 온다)
 */
export interface RoomResponse {
  roomId: number;
  roomName: string | null;
  roomType: RoomType;
  memberCount: number;
  alreadyExists: boolean;
}

/** 내 방 목록 응답 — roomType 이 없고 마지막 메시지/안읽은 수가 함께 온다 */
export interface RoomSummaryResponse {
  roomId: number;
  roomName: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  memberCount: number;
  unreadCount: number;
}

/*
 * 서버 푸시 이벤트 (RoomNotificationListener · FriendNotificationListener)
 *
 * 방 목록·친구 목록의 변화는 이제 개인 큐로 밀려온다.
 *   /user/queue/rooms   → RoomEvent
 *   /user/queue/friends → FriendEvent
 *
 * 두 큐 모두 convertAndSendToUser 로 보내므로 구독 주소에 사용자 id 를 붙이지 않는다.
 * STOMP 가 CONNECT 한 세션의 Principal 을 보고 알아서 갈라준다.
 */

export enum RoomEventType {
  /** 누군가 나를 새 방에 넣었다 */
  ROOM_CREATED = 'ROOM_CREATED',
  /** 안 보고 있는 방에 새 메시지가 왔거나, 멤버가 방을 나갔다 */
  ROOM_UPDATED = 'ROOM_UPDATED',
}

export interface RoomEvent {
  type: RoomEventType;
  room: RoomSummaryResponse;
}

export enum FriendEventType {
  /** 누군가 나에게 친구 요청을 보냈다 */
  REQUEST_RECEIVED = 'REQUEST_RECEIVED',
  /** 내가 보낸 요청을 상대가 수락했다 */
  REQUEST_ACCEPTED = 'REQUEST_ACCEPTED',
}

/** type 에 따라 둘 중 하나만 채워져 오고 나머지는 null 이다 */
export interface FriendEvent {
  type: FriendEventType;
  request: FriendRequestResponse | null;
  friend: FriendResponse | null;
}

// 메시지
export enum PublishStatus {
  PENDING = 'PENDING',
  PUBLISHED = 'PUBLISHED',
  FAILED = 'FAILED',
}

/** STOMP /pub/rooms/{roomId}/send 페이로드 */
export interface ChatMessageRequest {
  content: string;
  clientMessageId: string;
}

/**
 * translations 는 방 참여자들의 선호 언어 중 "보낸 사람의 언어를 뺀" 것만 채워진다.
 * 즉 내 언어 키가 없으면 원문이 이미 내 언어이거나 번역이 실패한 것이므로 content 를 그대로 쓴다.
 * (MessageService.translateForRoomMembers 참고)
 */
export interface MessageResponse {
  id: number;
  content: string;
  senderNickname: string;
  clientMessageId: string;
  publishStatus: PublishStatus;
  translations: Partial<Record<PreferredLanguage, string>>;
  createdAt: string;
}

/**
 * 메시지 커서. createdAt/id 둘 다 보내거나 둘 다 생략해야 한다 (하나만 보내면 400).
 * createdAt 은 서버가 준 문자열을 그대로 되돌려줘야 한다 — LocalDateTime 이라
 * Date 로 변환했다가 다시 직렬화하면 타임존이 어긋난다.
 */
export interface MessageCursor {
  createdAt: string;
  id: number;
}
