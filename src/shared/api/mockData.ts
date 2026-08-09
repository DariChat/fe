import {
  UserResponse,
  RoomSummaryResponse,
  MessageResponse,
  PublishStatus,
  TokenResponse,
} from '@/shared/types/api.types';

export const mockUser: UserResponse = {
  name: '김민수',
  email: 'minsu@example.com',
  nickname: '민수',
  profileImageUrl: null,
  lastActiveAt: new Date().toISOString(),
};

const minutesAgo = (m: number) => new Date(Date.now() - m * 60000).toISOString();

/** 서버가 저장까지 마친 메시지를 흉내내는 헬퍼 */
const sent = (
  id: number,
  content: string,
  senderNickname: string,
  createdAt: string
): MessageResponse => ({
  id,
  content,
  senderNickname,
  clientMessageId: `mock-${id}`,
  publishStatus: PublishStatus.PUBLISHED,
  createdAt,
});

export const mockMessages: MessageResponse[] = [
  sent(1, '안녕! 잘 지냈어?', '서연', minutesAgo(60)),
  sent(2, '덕분에 잘 지내지, 물어봐 줘서 고마워!', '민수', minutesAgo(50)),
  sent(3, '새 디자인 시안 봤어?', '서연', minutesAgo(40)),
  sent(4, '응, 진짜 좋더라! 색 조합이 마음에 들어.', '민수', minutesAgo(30)),
  sent(5, '고마워! 의견 있으면 언제든 말해줘 😊', '서연', minutesAgo(10)),
];

/**
 * 방마다 다른 대화를 보여주기 위한 mock.
 * 키는 mockRooms 의 roomId 와 맞춰져 있다.
 */
export const mockMessagesByRoom: Record<number, MessageResponse[]> = {
  // 1: 이서연 (1:1)
  1: mockMessages,

  // 2: 프로젝트 팀 (그룹)
  2: [
    sent(201, '이번 스프린트 회고 언제 할까요?', '지원', minutesAgo(180)),
    sent(202, '금요일 오후 어떠세요?', '민수', minutesAgo(174)),
    sent(203, '저는 좋습니다 👍', '태양', minutesAgo(170)),
    sent(204, '그럼 금요일 4시로 잡을게요.', '지원', minutesAgo(120)),
  ],

  // 3: 박준호 (1:1)
  3: [
    sent(301, '수정한 거 푸시했어?', '준호', minutesAgo(90)),
    sent(302, '방금 머지했어. 지금이면 반영됐을 거야.', '민수', minutesAgo(85)),
    sent(303, '확인했어, 내 쪽에서도 잘 되네 🎉', '준호', minutesAgo(80)),
  ],

  // 4: 디자인 논의 (그룹)
  4: [
    sent(401, '채팅 버블 색상 시안 3개 올렸습니다.', '수진', minutesAgo(45)),
    sent(402, '2번이 제일 눈에 잘 들어오네요.', '민수', minutesAgo(30)),
  ],
};

/** 정의되지 않은 방은 빈 대화로 시작한다 (빈 대화 화면 확인용) */
export const getMockMessages = (roomId: number): MessageResponse[] =>
  mockMessagesByRoom[roomId] ?? [];

const lastOf = (roomId: number) => {
  const messages = getMockMessages(roomId);
  return messages[messages.length - 1] ?? null;
};

/** GET /api/rooms 응답 형태에 맞춘 요약 목록 */
export const mockRooms: RoomSummaryResponse[] = [
  { roomId: 1, roomName: '이서연', memberCount: 2, unreadCount: 2 },
  { roomId: 2, roomName: '프로젝트 팀', memberCount: 5, unreadCount: 0 },
  { roomId: 3, roomName: '박준호', memberCount: 2, unreadCount: 1 },
  { roomId: 4, roomName: '디자인 논의', memberCount: 3, unreadCount: 0 },
].map((room) => ({
  ...room,
  lastMessage: lastOf(room.roomId)?.content ?? null,
  lastMessageAt: lastOf(room.roomId)?.createdAt ?? null,
}));

export const mockTokenResponse: TokenResponse = {
  accessToken: 'mock_access_token_' + Math.random().toString(36),
  refreshToken: null,
};
