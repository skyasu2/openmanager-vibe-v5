import type { NextConfig } from 'next';
import path from 'path';

// 번들 분석기 import - ESLint 규칙 준수
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let withBundleAnalyzer: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
  });
} catch {
  // @next/bundle-analyzer가 없으면 기본 설정 함수 사용
  withBundleAnalyzer = (config: NextConfig) => config;
}

// CI 환경 감지
const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
const skipEnvValidation = process.env.SKIP_ENV_VALIDATION === 'true';

const nextConfig: NextConfig = {
  // 🚀 Next.js 15 App Router 전용 설정
  trailingSlash: false,
  reactStrictMode: true,

  // 🚫 Vercel 빌드 시 ESLint 완전 비활성화
  eslint: {
    ignoreDuringBuilds: true,
    dirs: [], // ESLint 검사 디렉토리 없음
  },

  // TypeScript 빌드 오류 무시
  typescript: {
    ignoreBuildErrors: true,
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

  // 환경변수 기본값 설정
  env: {
    SKIP_ENV_VALIDATION: skipEnvValidation ? 'true' : 'false',
    BUILD_TIME: 'true', // 🔨 빌드 시 타이머 차단용
    VERCEL_BUILD_PHASE: process.env.VERCEL ? 'true' : 'false',
    // 🔧 Redis 환경변수 안전 설정
    FORCE_MOCK_REDIS: process.env.VERCEL ? 'false' : 'true',
    REDIS_CONNECTION_DISABLED: 'false',
  },

  serverExternalPackages: [
    'ioredis',
    'redis',
    '@redis/client',
    'generic-pool',
    'cluster',
    'denque',
  ],

  images: {
    domains: ['localhost', 'openmanager-vibe-v5.vercel.app'],
    formats: ['image/webp', 'image/avif'],
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    };

    // Storybook 및 테스트 파일 제외 (프로덕션 환경)
    if (!dev) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const webpack = require('webpack');

      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /\.(stories|spec|test)\.(ts|tsx|js|jsx)$/,
        })
      );

      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /backup\/.*\.(ts|tsx|js|jsx)$/,
        })
      );

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
        'webworker-threads': false,
      };

      const externals = config.externals || [];
      config.externals = [
        ...externals,
        'ioredis',
        'redis',
        '@redis/client',
        'webworker-threads',
        'generic-pool',
        'cluster',
        'denque',
      ];
    }

    return config;
  },

  // 정적 에러 페이지는 App Router의 global-error.tsx에서 처리
  generateBuildId: async () => {
    return 'openmanager-vibe-v5-app-router';
  },
};

// 번들 분석기 적용
export default withBundleAnalyzer(nextConfig);
