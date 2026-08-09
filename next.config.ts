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
   * 배포 서버의 CORS 허용 오리진은 http://52.78.23.95 하나뿐이라
   * 브라우저에서 직접 호출하면 403(Invalid CORS request)이 난다.
   * 프론트 서버가 대신 호출하도록 프록시해 same-origin 요청으로 만든다.
   * RefreshToken 쿠키(SameSite=Strict)도 이 경로로 정상적으로 오간다.
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
