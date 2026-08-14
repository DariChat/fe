import {
  UserResponse,
  RoomSummaryResponse,
  MessageResponse,
  PublishStatus,
  TokenResponse,
  PreferredLanguage,
  UserSearchResponse,
  UserRecommendationResponse,
  FriendResponse,
  FriendRequestResponse,
  FriendshipStatus,
} from '@/shared/types/api.types';

export const mockUser: UserResponse = {
  name: '김민수',
  email: 'minsu@example.com',
  nickname: '민수',
  profileImageUrl: null,
  bio: '프론트엔드 개발자예요. 영어와 일본어로 대화 연습하고 싶습니다.',
  preferredLanguage: PreferredLanguage.KO,
  lastActiveAt: new Date().toISOString(),
};

const minutesAgo = (m: number) => new Date(Date.now() - m * 60000).toISOString();

/** 서버가 저장까지 마친 메시지를 흉내내는 헬퍼 */
const sent = (
  id: number,
  content: string,
  senderNickname: string,
  createdAt: string,
  translations: MessageResponse['translations'] = {}
): MessageResponse => ({
  id,
  content,
  senderNickname,
  clientMessageId: `mock-${id}`,
  publishStatus: PublishStatus.PUBLISHED,
  translations,
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

  // 5: Emily (1:1) — 상대가 EN, 내가 KO 라 번역이 함께 내려오는 방
  5: [
    sent(501, 'Hey! Did you get a chance to review the draft?', 'Emily', minutesAgo(25), {
      [PreferredLanguage.KO]: '안녕! 초안 검토해 볼 시간 있었어?',
    }),
    sent(502, '네, 오늘 저녁까지 코멘트 남길게요.', '민수', minutesAgo(20), {
      [PreferredLanguage.EN]: "Yes, I'll leave comments by this evening.",
    }),
    sent(503, 'Perfect, thanks a lot!', 'Emily', minutesAgo(15), {
      [PreferredLanguage.KO]: '완벽해요, 정말 고마워요!',
    }),
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
  { roomId: 5, roomName: 'Emily', memberCount: 2, unreadCount: 0 },
].map((room) => ({
  ...room,
  lastMessage: lastOf(room.roomId)?.content ?? null,
  lastMessageAt: lastOf(room.roomId)?.createdAt ?? null,
}));

/** GET /api/friends */
export const mockFriends: FriendResponse[] = [
  { friendshipId: 11001, userId: 11, nickname: '서연', profileImageUrl: null },
  { friendshipId: 11002, userId: 12, nickname: '준호', profileImageUrl: null },
  { friendshipId: 11003, userId: 13, nickname: 'Emily', profileImageUrl: null },
];

/** GET /api/friends/requests/received */
export const mockFriendRequests: FriendRequestResponse[] = [
  {
    friendshipId: 101,
    requesterId: 21,
    requesterNickname: '지원',
    requesterProfileImageUrl: null,
    status: FriendshipStatus.PENDING,
    createdAt: minutesAgo(120),
  },
  {
    friendshipId: 102,
    requesterId: 22,
    requesterNickname: '태양',
    requesterProfileImageUrl: null,
    status: FriendshipStatus.PENDING,
    createdAt: minutesAgo(600),
  },
];

/** GET /api/users/search — 닉네임 부분일치, 본인 제외를 흉내낸다 */
const mockSearchPool: UserSearchResponse[] = [
  { id: 11, nickname: '서연', profileImageUrl: null },
  { id: 12, nickname: '준호', profileImageUrl: null },
  { id: 13, nickname: 'Emily', profileImageUrl: null },
  { id: 21, nickname: '지원', profileImageUrl: null },
  { id: 22, nickname: '태양', profileImageUrl: null },
  { id: 23, nickname: '수진', profileImageUrl: null },
  { id: 24, nickname: 'Kenji', profileImageUrl: null },
];

export const searchMockUsers = (keyword: string): UserSearchResponse[] =>
  mockSearchPool.filter(
    (user) =>
      user.nickname !== mockUser.nickname &&
      user.nickname.toLowerCase().includes(keyword.trim().toLowerCase())
  );

/**
 * GET /api/users/recommendations
 * 서버는 "나와 다른 언어를 쓰고 아직 친구가 아닌" 사람만 골라준다 —
 * mock 도 내 언어(KO)가 아닌 사람들로만 채운다.
 */
const mockRecommendationPool: UserRecommendationResponse[] = [
  {
    userId: 31,
    nickname: 'Emma',
    profileImageUrl: null,
    bio: 'Learning Korean for two years. Happy to help with English!',
    preferredLanguage: PreferredLanguage.EN,
  },
  {
    userId: 32,
    nickname: 'Kenji',
    profileImageUrl: null,
    bio: '韓国のドラマが好きです。韓国語を勉強しています。',
    preferredLanguage: PreferredLanguage.JA,
  },
  {
    userId: 33,
    nickname: 'Wei',
    profileImageUrl: null,
    bio: '你好！我在学韩语，希望能交到韩国朋友。',
    preferredLanguage: PreferredLanguage.ZH,
  },
  {
    userId: 34,
    nickname: 'Lucas',
    profileImageUrl: null,
    bio: 'Backend engineer in Berlin. Coffee, climbing, and code.',
    preferredLanguage: PreferredLanguage.EN,
  },
  {
    userId: 35,
    nickname: 'Yuki',
    profileImageUrl: null,
    bio: null,
    preferredLanguage: PreferredLanguage.JA,
  },
  {
    userId: 36,
    nickname: 'Sophia',
    profileImageUrl: null,
    bio: 'Designer. I love learning about other cultures through chat.',
    preferredLanguage: PreferredLanguage.EN,
  },
];

/** 서버처럼 이미 받은 id 를 빼고 돌려준다 (무작위 정렬까지 흉내낼 필요는 없다) */
export const recommendMockUsers = (
  excludeIds: number[],
  size: number
): UserRecommendationResponse[] =>
  mockRecommendationPool
    .filter((user) => !excludeIds.includes(user.userId))
    .slice(0, size);

export const mockTokenResponse: TokenResponse = {
  accessToken: 'mock_access_token_' + Math.random().toString(36),
  refreshToken: null,
};
