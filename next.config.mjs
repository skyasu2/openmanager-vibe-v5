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
    // Next.js devtools 비활성화 (SSR 에러 방지)
    devtools: false,
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

  // 🚧 리라이트 설정 (개발 환경 전용 파일 보호)
  async rewrites() {
    return [
      // 개발 환경에서만 테스트 도구 접근 허용
      ...(process.env.NODE_ENV === 'development' ? [
        {
          source: '/test-tools/:path*',
          destination: '/tests/browser/:path*',
        },
        {
          source: '/dev/:path*', 
          destination: '/api/dev/:path*',
        }
      ] : []),
    ];
  },

  // 🚫 리다이렉트 설정 (프로덕션 환경 보호)
  async redirects() {
    return [
      // 프로덕션에서 테스트 파일 접근 시 404로 리다이렉트
      ...(process.env.NODE_ENV === 'production' ? [
        {
          source: '/test-:path*',
          destination: '/404',
          permanent: false,
        },
        {
          source: '/tests/:path*',
          destination: '/404', 
          permanent: false,
        },
        {
          source: '/dev/:path*',
          destination: '/404',
          permanent: false,
        }
      ] : []),
    ];
  },

  // 🛡️ 보안 헤더 및 CSP 설정 (Vercel 최적화)
  async headers() {
    // Vercel 환경에서 nonce 생성 (Edge Runtime 호환)
    const generateNonce = () => {
      // Edge Runtime에서 안전한 nonce 생성
      const array = new Uint8Array(16);
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(array);
      } else {
        // Fallback for build time
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
      }
      return Buffer.from(array).toString('base64');
    };

    const isDev = process.env.NODE_ENV === 'development';
    const isVercel = process.env.VERCEL === '1';

    // 🎯 개발/프로덕션 환경별 CSP 정책
    const cspDirectives = {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        isDev ? "'unsafe-eval'" : '', // 개발 환경에서만 eval 허용
        "'unsafe-inline'", // dangerouslySetInnerHTML 호환
        'https://va.vercel-scripts.com', // Vercel Analytics
        'https://vitals.vercel-insights.com', // Speed Insights
        'blob:', // 동적 스크립트 허용
      ].filter(Boolean),
      'style-src': [
        "'self'",
        "'unsafe-inline'", // Tailwind CSS 인라인 스타일
      ],
      'img-src': [
        "'self'",
        'data:', // Base64 이미지
        'blob:', // 동적 이미지
        'https:', // 외부 이미지 허용
        'https://vnswjnltnhpsueosfhmw.supabase.co', // Supabase Storage
      ],
      'connect-src': [
        "'self'",
        'https://api.openmanager.dev', // 자체 API
        'https://vnswjnltnhpsueosfhmw.supabase.co', // Supabase
        'https://generativelanguage.googleapis.com', // Google AI
        'https://va.vercel-scripts.com', // Vercel Analytics
        'https://vitals.vercel-insights.com', // Speed Insights
        isDev ? 'ws://localhost:3000' : '', // 개발 환경 WebSocket
        isDev ? 'http://localhost:3000' : '', // 개발 환경 API
      ].filter(Boolean),
      'font-src': [
        "'self'",
        'https://fonts.gstatic.com', // Google Fonts
        'data:', // Base64 폰트
      ],
      'frame-src': [
        "'none'", // 프레임 완전 차단
      ],
      'object-src': [
        "'none'", // Object/Embed 차단
      ],
      'base-uri': [
        "'self'", // Base URI 제한
      ],
      'form-action': [
        "'self'", // Form action 제한
      ],
      'upgrade-insecure-requests': isDev ? [] : [''], // 프로덕션에서만 HTTPS 강제
    };

    // CSP 문자열 생성
    const csp = Object.entries(cspDirectives)
      .filter(([_, values]) => values.length > 0)
      .map(([key, values]) => {
        if (key === 'upgrade-insecure-requests' && values.length === 1 && values[0] === '') {
          return key;
        }
        return `${key} ${values.join(' ')}`;
      })
      .join('; ');

    return [
      {
        source: '/(.*)',
        headers: [
          // 🛡️ 보안 헤더
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // 🔐 CSP 헤더 (Vercel 환경 최적화)
          {
            key: 'Content-Security-Policy',
            value: csp,
          },
          // ⚡ 성능 최적화
          {
            key: 'Cache-Control',
            value: isVercel 
              ? 'public, max-age=31536000, immutable'
              : 'public, max-age=3600',
          },
          // 🚀 Vercel 전용 최적화 헤더
          ...(isVercel ? [
            {
              key: 'X-Vercel-Cache',
              value: 'HIT',
            },
            {
              key: 'X-Edge-Runtime',
              value: 'vercel',
            },
          ] : []),
        ],
      },
      // 📊 API 경로별 특별 CSP 정책
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'none'; object-src 'none';",
          },
        ],
      },
      // 🔧 관리자 영역 강화 보안
      {
        source: '/admin/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: csp + '; require-trusted-types-for \'script\';',
          },
          {
            key: 'X-Admin-Security',
            value: 'enhanced',
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

    // 큰 파일 및 테스트 파일 제외
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
      },
      // 프로덕션 빌드에서 테스트 파일 제외
      ...(process.env.NODE_ENV === 'production' ? [
        {
          test: /\/tests\/.*\.(html|js|ts|tsx)$/,
          use: 'ignore-loader',
        },
        {
          test: /\/public\/test-.*\.html$/,
          use: 'ignore-loader',
        },
        {
          test: /\.(spec|test)\.(js|jsx|ts|tsx)$/,
          use: 'ignore-loader',
        }
      ] : [])
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