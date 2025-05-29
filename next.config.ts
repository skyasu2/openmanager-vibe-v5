import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 정적 HTML 생성 완전 차단
  trailingSlash: false,
  
  // App Router 강제 우선순위 및 성능 최적화
  experimental: {
    optimizeServerReact: true,
    optimizePackageImports: [
      'lucide-react', 
      'framer-motion', 
      'recharts',
      '@tanstack/react-query',
      'react-hot-toast'
    ],
    // 🚀 추가 성능 최적화
    serverMinification: true,
    serverSourceMaps: false,
    // optimizeCss: true, // critters 모듈 에러로 인해 임시 비활성화
    webVitalsAttribution: ['CLS', 'LCP'],
  },

  // React 설정 (hydration 에러 처리)
  reactStrictMode: true,
  
  // 개발 환경 설정
  ...(process.env.NODE_ENV === 'development' && {
    // 개발 환경에서 hydration 에러 더 자세히 표시
    onDemandEntries: {
      maxInactiveAge: 25 * 1000,
      pagesBufferLength: 2,
    },
  }),

  // 정적 파일 우선순위 조정
  assetPrefix: '',
  basePath: '',
  
  // 빌드 ID 커스터마이제이션으로 캐시 무효화
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },

  // 서버 외부 패키지 (Next.js 15 새 설정)
  serverExternalPackages: ['ioredis', '@tensorflow/tfjs'],

  // 이미지 최적화 강화
  images: {
    domains: ['localhost', 'openmanager-vibe-v5.vercel.app'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: false,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // 압축 설정
  compress: true,

  // API 라우트를 위한 페이지 확장자 설정
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],

  // 성능 모니터링 강화
  poweredByHeader: false,
  generateEtags: true,

  // 🚀 성능 최적화 추가 (Next.js 15에서 swcMinify는 기본값)
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },

  // 보안 헤더
  async headers() {
    // 개발 환경에서는 보안 정책 완화, 프로덕션에서는 엄격한 CSP 적용
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: isDevelopment ? 'ALLOWALL' : 'DENY'
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
          },
          // 🚀 Vercel 최적화된 CSP: 외부 CDN 제거, 로컬 리소스만 허용
          ...(!isDevelopment ? [{
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "style-src 'self' 'unsafe-inline'", // Tailwind CSS 호환성
              "font-src 'self' data:",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js 호환성
              "img-src 'self' data: blob: https:",
              "connect-src 'self' https: ws: wss:",
              "frame-src 'self'",
              "frame-ancestors 'self'",
              "base-uri 'self'",
              "object-src 'none'"
            ].join('; ')
          }] : [])
        ]
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
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

  // Webpack 설정
  webpack: (config: any, { isServer, dev }: { isServer: boolean; dev: boolean }) => {
    // 클라이언트 사이드에서 Node.js 모듈 제외
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        'ioredis': false,
      };
    }

    // 개발 환경에서 더 나은 에러 처리
    if (dev) {
      config.optimization = {
        ...config.optimization,
        // 개발 환경에서 minification 비활성화 (에러 메시지 개선)
        minimize: false,
      };
    }

    // 번들 분석기 설정
    if (process.env.ANALYZE === 'true') {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
          reportFilename: './analyze/client.html'
        })
      );
    }

    return config;
  },

  // 로깅 설정
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development',
    },
  },
};

export default nextConfig;
