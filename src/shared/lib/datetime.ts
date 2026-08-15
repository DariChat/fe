/**
 * 서버 시각 문자열 다루기.
 *
 * 서버는 createdAt 을 LocalDateTime 으로 내려준다 — 타임존 표기가 없는 "2026-08-15T05:23:45.123" 형태다.
 * JS 는 이런 문자열을 브라우저 로컬 시간으로 해석하는데, 배포 컨테이너에 TZ 설정이 없어
 * (be/Dockerfile · docker-compose.yml 모두 TZ 없음 → JVM 기본값 UTC) 서버가 찍는 값은 UTC 벽시계다.
 * 그대로 두면 KST 사용자에게 9시간 이른 시각이 보인다.
 *
 * 그래서 타임존 표기가 없는 값만 UTC 로 못박아 해석한다.
 * 낙관적 메시지처럼 프론트가 만든 값(toISOString → 끝에 Z)은 이미 표기가 있어 그대로 통과한다.
 *
 * 백엔드가 나중에 TZ=Asia/Seoul 을 넣거나 Instant/OffsetDateTime 으로 바꾸면
 * 이 파일의 가정도 함께 바꿔야 한다 (표기가 붙어 오면 자동으로 올바르게 동작한다).
 */

/** 끝의 Z, 또는 +09:00 / -0500 같은 오프셋 */
const HAS_TIMEZONE = /(?:Z|[+-]\d{2}:?\d{2})$/;

export const parseServerDate = (timestamp: string): Date =>
  new Date(HAS_TIMEZONE.test(timestamp) ? timestamp : `${timestamp}Z`);

/** 오후 3:24 */
export const formatTime = (timestamp: string): string =>
  parseServerDate(timestamp).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

/** 오늘이면 시각, 아니면 날짜 (목록에서 마지막 활동 시각을 줄여 보여줄 때) */
export const formatTimeOrDate = (timestamp: string): string => {
  const date = parseServerDate(timestamp);
  const isToday = date.toDateString() === new Date().toDateString();

  return isToday
    ? formatTime(timestamp)
    : date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
};
