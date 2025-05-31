import type { NextConfig } from "next";
import path from "path";

// CI 환경 감지
const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
const skipEnvValidation = process.env.SKIP_ENV_VALIDATION === 'true';

const nextConfig: NextConfig = {
  trailingSlash: false,
  reactStrictMode: true,
  
  // Vercel 빌드 시 ESLint 완전 비활성화
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // TypeScript 빌드 오류 무시 (CI 환경)
  typescript: {
    ignoreBuildErrors: isCI,
  },
  
  // CI 환경에서는 더 관대한 설정
  ...(isCI && {
    experimental: {
      optimizePackageImports: ['lucide-react', '@heroicons/react'],
    },
  }),
  
  ...(process.env.NODE_ENV === "development" && {
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
    'denque'
  ],

  images: {
    domains: ['localhost'],
    formats: ['image/webp'],
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
            value: 'nosniff'
          }
        ]
      }
    ];
  },

  webpack: (config: any, { dev, isServer }: { dev: boolean; isServer: boolean }) => {
    // Path aliases 설정 - Vercel 빌드 오류 해결
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/utils': path.resolve(__dirname, './src/utils'),
    };

    // Storybook 및 테스트 파일 제외 (프로덕션 환경)
    if (!dev) {
      config.module.rules.push({
        test: /\.(stories|spec|test)\.(ts|tsx|js|jsx)$/,
        use: 'null-loader'
      });
      
      // archive 디렉토리 제외
      config.module.rules.push({
        test: /archive\/.*\.(ts|tsx|js|jsx)$/,
        use: 'null-loader'
      });
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
      };
      
      const externals = config.externals || [];
      config.externals = [
        ...externals,
        'ioredis',
        'redis', 
        '@redis/client',
        'generic-pool',
        'cluster',
        'denque'
      ];
    }

    return config;
  }
};

export default nextConfig; 