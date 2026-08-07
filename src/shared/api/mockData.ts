import {
  UserResponse,
  RoomResponse,
  MessageResponse,
  RoomType,
  TokenResponse,
} from '@/shared/types/api.types';

export const mockUser: UserResponse = {
  name: '김민수',
  email: 'minsu@example.com',
  nickname: '민수',
  profileImageUrl: null,
  lastActiveAt: new Date().toISOString(),
};

export const mockRooms: RoomResponse[] = [
  {
    roomId: 1,
    roomName: '이서연',
    roomType: RoomType.DIRECT,
    memberCount: 2,
  },
  {
    roomId: 2,
    roomName: '프로젝트 팀',
    roomType: RoomType.GROUP,
    memberCount: 5,
  },
  {
    roomId: 3,
    roomName: '박준호',
    roomType: RoomType.DIRECT,
    memberCount: 2,
  },
  {
    roomId: 4,
    roomName: '디자인 논의',
    roomType: RoomType.GROUP,
    memberCount: 3,
  },
];

export const mockMessages: MessageResponse[] = [
  {
    id: 1,
    content: '안녕! 잘 지냈어?',
    senderNickname: '서연',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 2,
    content: '덕분에 잘 지내지, 물어봐 줘서 고마워!',
    senderNickname: '민수',
    createdAt: new Date(Date.now() - 3000000).toISOString(),
  },
  {
    id: 3,
    content: '새 디자인 시안 봤어?',
    senderNickname: '서연',
    createdAt: new Date(Date.now() - 2400000).toISOString(),
  },
  {
    id: 4,
    content: '응, 진짜 좋더라! 색 조합이 마음에 들어.',
    senderNickname: '민수',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 5,
    content: '고마워! 의견 있으면 언제든 말해줘 😊',
    senderNickname: '서연',
    createdAt: new Date(Date.now() - 600000).toISOString(),
  },
];

const minutesAgo = (m: number) => new Date(Date.now() - m * 60000).toISOString();

/**
 * 방마다 다른 대화를 보여주기 위한 mock.
 * 키는 mockRooms 의 roomId 와 맞춰져 있다.
 */
export const mockMessagesByRoom: Record<number, MessageResponse[]> = {
  // 1: 이서연 (1:1)
  1: mockMessages,

  // 2: 프로젝트 팀 (그룹)
  2: [
    {
      id: 201,
      content: '이번 스프린트 회고 언제 할까요?',
      senderNickname: '지원',
      createdAt: minutesAgo(180),
    },
    {
      id: 202,
      content: '금요일 오후 어떠세요?',
      senderNickname: '민수',
      createdAt: minutesAgo(174),
    },
    {
      id: 203,
      content: '저는 좋습니다 👍',
      senderNickname: '태양',
      createdAt: minutesAgo(170),
    },
    {
      id: 204,
      content: '그럼 금요일 4시로 잡을게요.',
      senderNickname: '지원',
      createdAt: minutesAgo(120),
    },
  ],

  // 3: 박준호 (1:1)
  3: [
    {
      id: 301,
      content: '수정한 거 푸시했어?',
      senderNickname: '준호',
      createdAt: minutesAgo(90),
    },
    {
      id: 302,
      content: '방금 머지했어. 지금이면 반영됐을 거야.',
      senderNickname: '민수',
      createdAt: minutesAgo(85),
    },
    {
      id: 303,
      content: '확인했어, 내 쪽에서도 잘 되네 🎉',
      senderNickname: '준호',
      createdAt: minutesAgo(80),
    },
  ],

  // 4: 디자인 논의 (그룹)
  4: [
    {
      id: 401,
      content: '채팅 버블 색상 시안 3개 올렸습니다.',
      senderNickname: '수진',
      createdAt: minutesAgo(45),
    },
    {
      id: 402,
      content: '2번이 제일 눈에 잘 들어오네요.',
      senderNickname: '민수',
      createdAt: minutesAgo(30),
    },
  ],
};

/** 정의되지 않은 방은 빈 대화로 시작한다 (빈 대화 화면 확인용) */
export const getMockMessages = (roomId: number): MessageResponse[] =>
  mockMessagesByRoom[roomId] ?? [];

export const mockTokenResponse: TokenResponse = {
  accessToken: 'mock_access_token_' + Math.random().toString(36),
  refreshToken: null,
};
