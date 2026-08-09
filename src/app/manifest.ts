import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Talkieee',
    short_name: 'Talkieee',
    description: '실시간으로 대화하는 가장 쉬운 방법',
    // 설치 후 실행하면 바로 채팅 목록으로 (미로그인이면 로그인으로 리다이렉트된다)
    start_url: '/rooms',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    lang: 'ko',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      // 안드로이드가 아이콘을 원형 등으로 잘라내도 로고가 살아남도록 여백을 둔 버전
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
