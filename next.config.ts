import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel 배포 최적화
  output: 'standalone',
  
  // 실험적 기능
  experimental: {
    optimizeServerReact: true
  },

  // 서버 외부 패키지 (Next.js 15 새 설정)
  serverExternalPackages: [],

  // 이미지 최적화
  images: {
    domains: ['localhost', 'openmanager-vibe-v5.vercel.app'],
    formats: ['image/webp', 'image/avif'],
  },

  // 압축 설정
  compress: true,

  // API 라우트를 위한 페이지 확장자 설정
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],

  // 리라이트 규칙 제거 - API 라우트 충돌 방지
  // async rewrites() {
  //   return [
  //     // index.html을 루트 경로에서 우선 처리
  //     {
  //       source: '/',
  //       destination: '/index.html',
  //     },
  //   ];
  // },

  // 보안 헤더
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          }
        ]
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-Requested-With, Content-Type, Authorization'
          },
          {
            key: 'X-Powered-By',
            value: 'OpenManager Vibe V5'
          }
        ]
      }
    ];
  },

  // 리다이렉트 규칙
  async redirects() {
    return [
      // 문서 접근 시 첫 번째 가이드로 리다이렉션
      {
        source: '/docs',
        destination: '/docs/01-project-guide',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
