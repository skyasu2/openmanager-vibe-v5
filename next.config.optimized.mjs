import { readFileSync } from 'fs';
import { join } from 'path';
import bundleAnalyzer from '@next/bundle-analyzer';

// package.json에서 버전 읽기
const packageJson = JSON.parse(
  readFileSync(join(process.cwd(), 'package.json'), 'utf8')
);

// Bundle Analyzer 설정
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: false, // 자동 열지 않음
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 🚀 Next.js 15 완전 동적 모드
  output: 'standalone',
  trailingSlash: false,
  
  // 페이지 확장자 최소화
  pageExtensions: ['tsx', 'ts'],

  // 🔧 TypeScript 설정 - 빌드 최적화
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'production',
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // 서버 외부 패키지 설정 (번들 크기 감소)
  serverExternalPackages: [
    '@supabase/supabase-js',
    '@google/generative-ai',
    'sharp',
    'crypto-js',
    'axios',
  ],

  // 실험적 기능 최적화
  experimental: {
    // CSS 최적화 비활성화 (critters 의존성 제거)
    optimizeCss: false,
    // 트랜스폼 최적화
    forceSwcTransforms: true,
    // 빌드 워커 활성화 (성능 향상)
    webpackBuildWorker: true,
    // Lightning CSS 활성화 (PostCSS 대체)
    useLightningcss: false, // TailwindCSS와 충돌 방지
    // 번들 최적화
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      '@heroicons/react',
      'react-hot-toast',
    ],
  },

  // 컴파일러 최적화
  compiler: {
    // 미사용 코드 제거
    removeConsole: process.env.NODE_ENV === 'production',
    // React DevTools 제거 (프로덕션)
    reactRemoveProperties: process.env.NODE_ENV === 'production',
  },

  // 이미지 최적화 비활성화 (번들 크기 감소)
  images: {
    unoptimized: true,
    formats: ['image/webp'],
    deviceSizes: [640, 828, 1200],
    imageSizes: [16, 32, 64, 128],
  },

  // 헤더 최소화
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // 🔧 웹팩 설정 (번들 최적화)
  webpack: (config, { isServer, dev }) => {
    // 클라이언트 사이드 최적화
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
      
      // 번들 분할 최적화
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          // 프레임워크 번들 (React, Next.js)
          framework: {
            test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
            name: 'framework',
            priority: 40,
            enforce: true,
          },
          // UI 라이브러리 번들
          ui: {
            test: /[\\/]node_modules[\\/](@radix-ui|lucide-react|@heroicons)[\\/]/,
            name: 'ui',
            priority: 30,
          },
          // 유틸리티 번들
          utils: {
            test: /[\\/]node_modules[\\/](clsx|tailwind-merge|class-variance-authority)[\\/]/,
            name: 'utils',
            priority: 25,
          },
          // 대용량 라이브러리 번들 (별도 분리)
          heavy: {
            test: /[\\/]node_modules[\\/](framer-motion|recharts|monaco-editor)[\\/]/,
            name: 'heavy',
            priority: 20,
            enforce: true,
          },
          // 기본 vendor 번들
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            minChunks: 2,
          },
          // 공통 코드 번들
          common: {
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      };

      // 번들 크기 제한
      config.optimization.splitChunks.maxSize = 200000; // 200KB
      config.optimization.splitChunks.maxAsyncSize = 300000; // 300KB
      config.optimization.splitChunks.maxInitialSize = 250000; // 250KB
    }

    // 프로덕션 최적화
    if (!dev) {
      // Tree shaking 강화
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
      
      // 압축 최적화
      config.optimization.minimize = true;
    }

    // 큰 파일 제외
    config.module.rules.push(
      {
        test: /\.node$/,
        use: 'ignore-loader',
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        type: 'asset/resource',
        generator: {
          filename: 'static/fonts/[hash][ext]',
        },
      }
    );

    // 경고 억제
    config.ignoreWarnings = [
      /Critical dependency: the request of a dependency is an expression/,
      /Module not found: Can't resolve/,
      /Can't resolve '\.\/.*\.node'/,
    ];

    return config;
  },

  // 환경 변수 최소화
  env: {
    CUSTOM_KEY: 'openmanager-vibe-v5',
    NEXT_PUBLIC_APP_VERSION: packageJson.version,
  },
};

export default withBundleAnalyzer(nextConfig);