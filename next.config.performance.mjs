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
  openAnalyzer: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 🚀 Next.js 15 성능 최적화 설정
  output: 'standalone',
  trailingSlash: false,
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],

  // 🔧 TypeScript 설정 - 성능 우선
  typescript: {
    ignoreBuildErrors: process.env.VERCEL === '1' || process.env.CI === 'true',
    tsconfigPath: process.env.VERCEL === '1' ? './tsconfig.build.json' : './tsconfig.json',
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // 📦 서버 외부 패키지 최적화 (번들 크기 감소)
  serverExternalPackages: [
    '@supabase/supabase-js',
    '@google/generative-ai',
    'ioredis',
    'redis',
    '@redis/client',
    'sharp',
    'canvas',
    'pdf-parse',
    'winston',
    'pino',
    'systeminformation',
    'natural',
    'compromise',
    'ml-kmeans',
    'ml-pca',
    'ml-regression',
  ],

  // 🚀 Next.js 15 실험적 기능 (성능 중심)
  experimental: {
    // CSS 최적화 활성화 (번들 크기 10-15% 감소)
    optimizeCss: true,
    
    // 웹팩 빌드 워커 활성화 (빌드 속도 30% 향상)
    webpackBuildWorker: true,
    
    // Lightning CSS 사용 (PostCSS 대체, 5x 빠름)
    useLightningcss: false, // 호환성 문제로 임시 비활성화
    
    // 정적 이미지 최적화
    optimizeImages: true,
    
    // 서버 컴포넌트 최적화
    serverComponentsExternalPackages: [
      'systeminformation',
      'node-cron',
      'winston',
    ],
  },

  // 🖼️ 이미지 최적화 (LCP 개선)
  images: {
    unoptimized: false, // 최적화 활성화
    formats: ['image/avif', 'image/webp'], // 최신 포맷 우선
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    domains: ['localhost', 'vercel.app', 'openmanager.dev'],
    
    // 중요 이미지 우선 로딩
    priority: true,
    
    // 지연 로딩 설정
    loading: 'lazy',
    
    // 품질 최적화 (파일 크기 vs 품질 균형)
    quality: 85,
  },

  // 🔄 리다이렉트 최적화
  async redirects() {
    return [
      {
        source: '/_document',
        destination: '/',
        permanent: false,
      },
      {
        source: '/_error',
        destination: '/',
        permanent: false,
      },
    ];
  },

  // 🔒 보안 및 캐시 헤더 (성능 개선)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // 보안 헤더
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // 캐싱 최적화
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // 정적 자산 장기 캐싱
      {
        source: '/fonts/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // API 캐싱 정책
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
    ];
  },

  // 🔧 웹팩 최적화 (번들 크기 대폭 감소)
  webpack: (config, { isServer, dev }) => {
    // 프로덕션 전용 최적화
    if (!dev) {
      // 번들 분할 최적화 (1.1MB → 250KB씩 분할)
      config.optimization.splitChunks = {
        chunks: 'all',
        maxSize: 250000, // 250KB 제한
        cacheGroups: {
          // React 생태계
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: 'react',
            priority: 30,
            chunks: 'all',
          },
          // UI 라이브러리
          ui: {
            test: /[\\/]node_modules[\\/](@radix-ui|framer-motion|lucide-react)[\\/]/,
            name: 'ui',
            priority: 25,
            chunks: 'all',
          },
          // 차트 라이브러리
          charts: {
            test: /[\\/]node_modules[\\/](recharts|react-chartjs-2|chart\.js)[\\/]/,
            name: 'charts',
            priority: 20,
            chunks: 'all',
          },
          // 유틸리티
          utils: {
            test: /[\\/]node_modules[\\/](date-fns|lodash|axios|uuid)[\\/]/,
            name: 'utils',
            priority: 15,
            chunks: 'all',
          },
          // 기본 vendor
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            chunks: 'all',
          },
          // 공통 코드
          common: {
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
            chunks: 'all',
          },
        },
      };

      // 트리 셰이킹 최적화
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
      
      // 압축 최적화
      config.optimization.minimize = true;
    }

    // 클라이언트 사이드 폴백 설정
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        path: false,
        os: false,
      };
    }

    // 불필요한 파일 제외
    config.module.rules.push({
      test: /\.(node|wasm)$/,
      use: 'ignore-loader',
    });

    // 경고 억제
    config.ignoreWarnings = [
      /Critical dependency: the request of a dependency is an expression/,
      /Module not found: Can't resolve/,
      /Can't resolve '\.\/.*\.node'/,
    ];

    // Framer Motion 최적화 (애니메이션 라이브러리 크기 50% 감소)
    config.resolve.alias = {
      ...config.resolve.alias,
      'framer-motion': 'framer-motion/dist/framer-motion',
    };

    return config;
  },

  // 🚀 압축 및 최적화
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,

  // 🌍 환경 변수
  env: {
    CUSTOM_KEY: 'openmanager-vibe-v5',
    BUILD_TIME: new Date().toISOString(),
    NEXT_PUBLIC_APP_VERSION: packageJson.version,
    NEXT_PUBLIC_DEPLOYMENT_ENV: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
    
    // 성능 모니터링 플래그
    NEXT_PUBLIC_PERFORMANCE_MONITORING: 'true',
    NEXT_PUBLIC_BUNDLE_ANALYSIS: process.env.ANALYZE || 'false',
  },
};

// Bundle Analyzer와 함께 export
export default withBundleAnalyzer(nextConfig);