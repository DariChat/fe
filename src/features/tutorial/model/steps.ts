/**
 * 튜토리얼 단계 정의.
 *
 * target 은 화면 요소에 심어둔 data-tour 속성을 가리킨다.
 * 같은 이름을 데스크톱 사이드바와 모바일 탭바가 함께 달고 있어도 된다 —
 * 오버레이가 그중 실제로 보이는 요소를 골라 잡는다.
 *
 * route 가 있으면 그 화면으로 옮긴 뒤 대상을 찾는다. 대상이 끝내 나타나지 않으면
 * (예: 모바일에만 있는 요소) 그 단계는 조용히 건너뛴다.
 */

export type TutorialPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface TutorialStep {
  id: string;
  target: string;
  route?: string;
  title: string;
  body: string;
  /** 자리가 좁으면 오버레이가 알아서 다른 쪽으로 돌린다 */
  placement?: TutorialPlacement;
  /** 스포트라이트가 대상 주위로 벌어지는 여백(px) */
  padding?: number;
  radius?: number;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    target: '[data-tour="brand"]',
    route: '/rooms',
    title: 'DariChat에 오신 걸 환영해요',
    body: '언어가 달라도 각자 편한 말로 대화할 수 있는 채팅앱이에요. 1분이면 끝나는 안내를 시작할게요.',
    placement: 'right',
  },
  {
    id: 'room-list',
    target: '[data-tour="room-list"]',
    route: '/rooms',
    title: '여기가 대화 목록이에요',
    body: '참여 중인 대화가 최근 순으로 쌓여요. 읽지 않은 메시지가 있으면 오른쪽에 숫자로 표시됩니다.',
    placement: 'right',
    padding: 4,
  },
  {
    id: 'translation',
    target: '[data-tour="room-item"]',
    route: '/rooms',
    title: '번역은 자동으로 됩니다',
    body: '상대가 다른 언어로 보내도 내가 고른 언어로 바꿔서 보여줘요. 원문이 궁금하면 말풍선 아래 "원문 보기"를 누르면 됩니다.',
    placement: 'right',
  },
  {
    id: 'new-chat',
    target: '[data-tour="new-chat"]',
    route: '/rooms',
    title: '새 대화는 여기서',
    body: '친구와 1:1로 이야기하거나, 여러 명을 초대해 그룹 대화를 만들 수 있어요.',
    placement: 'bottom',
  },
  {
    id: 'friends',
    target: '[data-tour="nav-friends"]',
    route: '/rooms',
    title: '친구 관리는 이 탭에서',
    body: '닉네임으로 검색해 친구를 추가하고, 받은 요청을 수락하거나 거절할 수 있어요.',
    placement: 'right',
  },
  {
    id: 'friend-tabs',
    target: '[data-tour="friends-tabs"]',
    route: '/friends',
    title: '친구 · 받은 요청 · 친구 찾기',
    body: '세 갈래로 나뉘어 있어요. 친구를 추가하면 바로 대화를 시작할 수 있습니다.',
    placement: 'bottom',
  },
  {
    id: 'language',
    target: '[data-tour="language"]',
    route: '/friends',
    title: '내 언어를 정해 두세요',
    body: '지금 설정된 언어로 상대의 메시지가 번역돼요. 프로필에서 언제든 바꿀 수 있습니다.',
    placement: 'right',
  },
  {
    id: 'theme',
    target: '[data-tour="theme-toggle"]',
    route: '/friends',
    title: '눈이 편한 쪽으로',
    body: '밝은 화면과 어두운 화면을 오갈 수 있어요. 따로 고르지 않으면 기기 설정을 따라갑니다.',
    placement: 'right',
  },
  {
    id: 'done',
    target: '[data-tour="help"]',
    route: '/rooms',
    title: '준비 끝났어요',
    body: '이 버튼을 누르면 언제든 이 안내를 다시 볼 수 있어요. 이제 첫 대화를 시작해 보세요!',
    placement: 'right',
  },
];
