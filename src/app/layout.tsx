import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  // 상대 경로로 적은 og:image 를 절대 URL 로 만들기 위한 기준값
  metadataBase: new URL('https://dari-chat.vercel.app'),
  title: 'DariChat',
  description: '실시간 채팅 서비스',
  applicationName: 'DariChat',
  openGraph: {
    type: 'website',
    siteName: 'DariChat',
    title: 'DariChat',
    description: '실시간으로 대화하는 가장 쉬운 방법',
    url: '/',
    locale: 'ko_KR',
    images: [{ url: '/icons/icon-512.png', width: 512, height: 512 }],
  },
  twitter: {
    card: 'summary',
    title: 'DariChat',
    description: '실시간으로 대화하는 가장 쉬운 방법',
    images: ['/icons/icon-512.png'],
  },
  // iOS 는 manifest 의 display 를 보지 않으므로 별도로 standalone 을 지정해야
  // 홈 화면에서 실행할 때 주소창 없이 뜬다
  appleWebApp: {
    capable: true,
    title: 'DariChat',
    statusBarStyle: 'default',
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    // Next 는 표준 이름인 mobile-web-app-capable 만 내보내는데,
    // iOS 16.4 미만은 이 레거시 이름만 인식해서 직접 추가한다
    'apple-mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  // 입력창 포커스 시 확대되는 것을 막아 네이티브 앱처럼 동작시킨다
  maximumScale: 1,
  userScalable: false,
  // 노치 영역까지 화면을 채우고, 여백은 safe-area-inset 으로 직접 준다
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-white">{children}</body>
    </html>
  );
}
