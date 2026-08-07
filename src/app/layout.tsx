import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Talkieee',
  description: '실시간 채팅 서비스',
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
