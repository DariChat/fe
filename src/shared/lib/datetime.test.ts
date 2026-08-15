import { formatTime, parseServerDate } from './datetime';

describe('parseServerDate', () => {
  it('타임존 표기가 없는 서버 시각은 UTC 로 읽는다', () => {
    // 서버(UTC)가 05:23 을 찍었다면 실제 순간은 14:23 KST 다
    expect(parseServerDate('2026-08-15T05:23:45.123').toISOString()).toBe(
      '2026-08-15T05:23:45.123Z'
    );
  });

  it('Z 나 오프셋이 붙은 값은 그대로 해석한다', () => {
    expect(parseServerDate('2026-08-15T05:23:45.000Z').toISOString()).toBe(
      '2026-08-15T05:23:45.000Z'
    );
    expect(parseServerDate('2026-08-15T14:23:45+09:00').toISOString()).toBe(
      '2026-08-15T05:23:45.000Z'
    );
  });

  it('낙관적 메시지(toISOString)와 서버 응답이 같은 시각으로 보인다', () => {
    const now = new Date('2026-08-15T05:23:45.000Z');
    const optimistic = now.toISOString(); // 프론트가 만든 값 (Z 붙음)
    const fromServer = '2026-08-15T05:23:45'; // 서버가 준 값 (표기 없음)

    expect(formatTime(optimistic)).toBe(formatTime(fromServer));
  });
});
