import { authService } from './authService';
import { PreferredLanguage } from '@/shared/types/api.types';
import { mockTokenResponse, mockUser } from '@/shared/api/mockData';

jest.mock('@/shared/api/client', () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), put: jest.fn() },
}));

describe('authService (mock 모드)', () => {
  it('login 하면 accessToken 과 닉네임이 저장된다', async () => {
    const result = await authService.login({
      email: 'minsu@example.com',
      password: 'password1234',
    });

    expect(result.accessToken).toBe(mockTokenResponse.accessToken);
    expect(localStorage.getItem('accessToken')).toBe(
      mockTokenResponse.accessToken
    );
    expect(localStorage.getItem('userNickname')).toBe(mockUser.nickname);
  });

  it('logout 하면 저장된 인증 정보가 모두 지워진다', async () => {
    await authService.login({ email: 'a@b.com', password: 'password1234' });
    await authService.logout();

    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(localStorage.getItem('userNickname')).toBeNull();
  });

  it('signup 은 입력한 값이 반영된 사용자를 돌려준다', async () => {
    const user = await authService.signup({
      name: '김보성',
      email: 'bosung@example.com',
      password: 'password1234',
      nickname: 'bosung',
      preferredLanguage: PreferredLanguage.KO,
    });

    expect(user.name).toBe('김보성');
    expect(user.email).toBe('bosung@example.com');
    expect(user.nickname).toBe('bosung');
  });

  it('verifyEmail · resendVerification 은 서버 없이도 통과한다', async () => {
    await expect(
      authService.verifyEmail({ email: 'bosung@example.com', code: '123456' })
    ).resolves.toBeUndefined();
    await expect(
      authService.resendVerification('bosung@example.com')
    ).resolves.toBeUndefined();
  });
});
