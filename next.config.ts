import type { NextConfig } from 'next';
import path from 'path';

// 번들 분석기 import - ESLint 규칙 준수
let withBundleAnalyzer: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
  });
} catch (e) {
  // @next/bundle-analyzer가 없으면 기본 설정 함수 사용
  withBundleAnalyzer = (config: NextConfig) => config;
}

// CI 환경 감지
const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
const skipEnvValidation = process.env.SKIP_ENV_VALIDATION === 'true';

const nextConfig: NextConfig = {
  trailingSlash: false,
  reactStrictMode: true,

  // 🚫 Vercel 빌드 시 ESLint 완전 비활성화 (더 강력한 설정)
  eslint: {
    ignoreDuringBuilds: true,
    dirs: [], // ESLint 검사 디렉토리 없음
  },

  // TypeScript 빌드 오류 무시 (CI 환경)
  typescript: {
    ignoreBuildErrors: isCI,
  },

  // ⚡ Next.js 15 최적화 설정
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@heroicons/react',
      'recharts',
      'framer-motion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-toast',
      'zustand',
      '@tanstack/react-query',
    ],
    optimizeCss: true,
    // Server Actions 활성화
    serverActions: {
      allowedOrigins: [
        'localhost:3001',
        'localhost:3010',
        'localhost:3011',
        '*.vercel.app',
      ],
      bodySizeLimit: '2mb',
    },
  },

  // 🚀 Turbopack 설정 (experimental.turbo → turbopack)
  turbopack: {
    resolveExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  },

  // CI 환경에서는 더 관대한 설정
  ...(isCI && {
    experimental: {
      optimizePackageImports: ['lucide-react', '@heroicons/react'],
    },
  }),

  ...(process.env.NODE_ENV === 'development' && {
    onDemandEntries: {
      maxInactiveAge: 300 * 1000, // 5분으로 대폭 증가
      pagesBufferLength: 20, // 더 많은 페이지 캐시
    },
  }),

  // 환경변수 기본값 설정 (NODE_ENV 제거)
  env: {
    SKIP_ENV_VALIDATION: skipEnvValidation ? 'true' : 'false',
  },

  serverExternalPackages: [
    'ioredis',
    'sharp',
    'redis',
    '@redis/client',
    'generic-pool',
    'cluster',
    'denque',
  ],

  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
    // 이미지 최적화 강화
    minimumCacheTTL: 31536000, // 1년
    dangerouslyAllowSVG: false,
  },

  compress: true,
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },

  webpack: (
    config: any,
    { dev, isServer }: { dev: boolean; isServer: boolean }
  ) => {
    // Path aliases 설정 - Vercel 빌드 오류 해결
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/stores': path.resolve(__dirname, './src/stores'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/actions': path.resolve(__dirname, './src/actions'),
    };

    // Storybook 및 테스트 파일 제외 (프로덕션 환경)
    if (!dev) {
      config.module.rules.push({
        test: /\.(stories|spec|test)\.(ts|tsx|js|jsx)$/,
        use: 'null-loader',
      });

      // backup 디렉토리 제외
      config.module.rules.push({
        test: /backup\/.*\.(ts|tsx|js|jsx)$/,
        use: 'null-loader',
      });

      // Tree-shaking 최적화
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
    }

    // CI 환경에서 메모리 최적화
    if (isCI) {
      config.optimization = {
        ...config.optimization,
        minimize: false, // CI에서는 압축 비활성화로 메모리 절약
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            default: false,
            vendors: false,
          },
        },
      };
    }

    if (dev) {
      config.watchOptions = {
        ignored: /node_modules/,
        poll: false,
        aggregateTimeout: 15000, // 15초로 대폭 증가!
      };
      config.parallelism = 1;
    }

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        dns: false,
        tls: false,
        child_process: false,
        cluster: false,
        module: false,
        'node:crypto': false,
        'node:stream': false,
        'node:buffer': false,
        'node:util': false,
        'node:net': false,
        'node:dns': false,
        // 🔧 natural 라이브러리 경고 해결
        'webworker-threads': false,
      };

      // natural 라이브러리의 webworker-threads 모듈 제외 (externals로 처리)

      const externals = config.externals || [];
      config.externals = [
        ...externals,
        'ioredis',
        'redis',
        '@redis/client',
        'webworker-threads', // Natural 패키지 경고 해결
        'generic-pool',
        'cluster',
        'denque',
      ];
    }

    return config;
  },

  // 청크 분할 최적화
  async rewrites() {
    return [
      {
        source: '/data/:path*',
        destination: '/public/data/:path*',
      },
    ];
  },
};

// 번들 분석기 적용
export default withBundleAnalyzer(nextConfig);
