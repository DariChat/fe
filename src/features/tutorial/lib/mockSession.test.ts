import { mockRooms } from '@/shared/api/mockData';
import { isRemoteDataFrozen } from '@/shared/lib/remoteData';
import { useRoomsStore } from '@/features/rooms/model/roomsStore';
import { useFriendsStore } from '@/features/friends/model/friendsStore';
import { enterMockSession, exitMockSession } from './mockSession';

// mock 모드로 동작시켜 실제 API 없이 주입·복원 흐름만 검증한다
jest.mock('@/shared/config/env', () => ({
  ...jest.requireActual('@/shared/config/env'),
  USE_MOCK: true,
}));

describe('튜토리얼 예시 데이터 주입', () => {
  beforeEach(() => {
    useRoomsStore.getState().reset();
    useFriendsStore.getState().reset();
  });

  afterEach(() => {
    // 실패한 테스트가 다음 테스트까지 얼려두지 않도록 정리한다
    exitMockSession();
  });

  it('시작하면 예시 목록이 올라가고 조회가 잠긴다', () => {
    enterMockSession();

    expect(useRoomsStore.getState().rooms).toEqual(mockRooms);
    expect(useFriendsStore.getState().friends.length).toBeGreaterThan(0);
    expect(isRemoteDataFrozen()).toBe(true);
  });

  it('잠겨 있는 동안에는 목록을 다시 받아오지 않는다', async () => {
    enterMockSession();
    useRoomsStore.setState({ rooms: [] });

    await useRoomsStore.getState().fetchRooms({ force: true });

    expect(useRoomsStore.getState().rooms).toHaveLength(0);
  });

  it('끝나면 원래 목록으로 되돌아온다', async () => {
    // 튜토리얼 전에 보고 있던 화면
    await useRoomsStore.getState().fetchRooms();
    const before = useRoomsStore.getState().rooms;

    enterMockSession();
    exitMockSession();

    expect(isRemoteDataFrozen()).toBe(false);
    expect(useRoomsStore.getState().rooms).toEqual(before);
  });

  it('시작한 적 없이 끝내도 잠금은 풀린 상태로 남는다', () => {
    exitMockSession();

    expect(isRemoteDataFrozen()).toBe(false);
  });
});
