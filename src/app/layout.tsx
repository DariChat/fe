import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DariChat',
  description: '실시간 채팅 서비스',
  applicationName: 'DariChat',
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
