import type { NextConfig } from 'next';

const API_ORIGIN = process.env.NEXT_PUBLIC_API_ORIGIN || 'http://localhost:8080';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  /**
   * 프론트 서버가 대신 호출하도록 프록시해 same-origin 요청으로 만든다.
   * 배포 서버 CORS 는 이제 프론트 오리진도 허용하지만, RefreshToken 쿠키가
   * SameSite=Strict 라 브라우저에서 직접 부르면 재발급 요청에 쿠키가 실리지 않는다.
   */
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_ORIGIN}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
