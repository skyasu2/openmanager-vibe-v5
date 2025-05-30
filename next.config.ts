import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 기본 설정
  trailingSlash: false,
  reactStrictMode: true,
  
  // 🚀 개발 환경 컴파일 최적화 (안전한 설정만)
  ...(process.env.NODE_ENV === 'development' && {
    onDemandEntries: {
      maxInactiveAge: 300 * 1000, // 5분으로 대폭 증가
      pagesBufferLength: 20, // 더 많은 페이지 캐시
    },
  }),

  // 서버 외부 패키지
  serverExternalPackages: ['ioredis', 'sharp'],

  // 이미지 최적화
  images: {
    domains: ['localhost'],
    formats: ['image/webp'],
  },

  // 기본 압축
  compress: true,
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  poweredByHeader: false,

  // 기본 헤더
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          }
        ]
      }
    ];
  },

  // Webpack 설정 (최소한의 안전한 설정)
  webpack: (config: any, { dev }: { dev: boolean }) => {
    if (dev) {
      config.watchOptions = {
        ignored: /node_modules/,
        poll: false,
        aggregateTimeout: 15000, // 15초!
      };
      config.parallelism = 1;
    }
    return config;
  },
};

export default nextConfig; 