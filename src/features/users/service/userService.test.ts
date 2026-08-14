import { userService } from './userService';

// mock 모드로 동작시켜 실제 API 없이 서비스 흐름만 검증한다
jest.mock('@/shared/config/env', () => ({
  ...jest.requireActual('@/shared/config/env'),
  USE_MOCK: true,
}));

describe('userService (mock 모드)', () => {
  describe('추천 유저', () => {
    it('내 언어가 아닌 사람만 추천한다', async () => {
      const me = await userService.getProfile();
      const recommended = await userService.getRecommendations();

      expect(recommended.length).toBeGreaterThan(0);
      expect(
        recommended.every((user) => user.preferredLanguage !== me.preferredLanguage)
      ).toBe(true);
    });

    it('요청한 개수만큼만 돌려준다', async () => {
      const recommended = await userService.getRecommendations([], 2);

      expect(recommended).toHaveLength(2);
    });

    it('이미 받은 사람은 다음 장에 다시 나오지 않는다', async () => {
      const first = await userService.getRecommendations([], 2);
      const seen = first.map((user) => user.userId);

      const second = await userService.getRecommendations(seen, 2);

      expect(second.some((user) => seen.includes(user.userId))).toBe(false);
    });
  });

  describe('프로필 수정', () => {
    it('자기소개를 함께 저장한다', async () => {
      const updated = await userService.updateProfile({
        nickname: '민수',
        preferredLanguage: (await userService.getProfile()).preferredLanguage,
        bio: '새로 쓴 자기소개',
      });

      expect(updated.bio).toBe('새로 쓴 자기소개');
    });
  });
});
