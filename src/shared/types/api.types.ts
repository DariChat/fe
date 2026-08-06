// Auth
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

export interface TokenResponse {
  accessToken: string;
  refreshToken: string | null;
}

// User
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

// Room
export enum RoomType {
  DIRECT = 'DIRECT',
  GROUP = 'GROUP',
}

export interface RoomCreateRequest {
  roomName?: string;
  roomType: RoomType;
  memberIds: number[];
}

export interface RoomResponse {
  roomId: number;
  roomName: string | null;
  roomType: RoomType;
  memberCount: number;
}

// Message
export interface ChatMessageRequest {
  content: string;
}

export interface MessageResponse {
  id: number;
  content: string;
  senderNickname: string;
  createdAt: string;
}

// Chat (WebSocket)
export interface ChatMessage {
  roomId: number;
  message: MessageResponse;
}
