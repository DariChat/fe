/**
 * 배포 서버 스펙 기준 (http://52.78.23.95/v3/api-docs, Talkie API v1)
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

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  nickname: string;
}

/** 로그인/재발급 시 refreshToken 은 HttpOnly 쿠키로만 내려오고 바디에는 null 이 담긴다 */
export interface TokenResponse {
  accessToken: string;
  refreshToken: string | null;
}

// 사용자
export interface UserResponse {
  name: string;
  email: string;
  nickname: string;
  profileImageUrl: string | null;
  lastActiveAt: string;
}

export interface UserUpdateRequest {
  nickname: string;
  profileImageUrl?: string | null;
}

export interface PasswordUpdateRequest {
  password: string;
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

/** 방 생성 응답 */
export interface RoomResponse {
  roomId: number;
  roomName: string | null;
  roomType: RoomType;
  memberCount: number;
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

export interface MessageResponse {
  id: number;
  content: string;
  senderNickname: string;
  clientMessageId: string;
  publishStatus: PublishStatus;
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
