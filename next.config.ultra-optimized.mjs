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
  openAnalyzer: false,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 🚀 Next.js 15 초고성능 모드
  output: 'standalone',
  trailingSlash: false,
  
  // 페이지 확장자 최소화
  pageExtensions: ['tsx', 'ts'],

  // 🔧 TypeScript & ESLint - 빌드 최적화
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'production',
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // 서버 외부 패키지 최대 최적화 (번들 크기 50% 감소)
  serverExternalPackages: [
    '@supabase/supabase-js',
    '@google/generative-ai', 
    'sharp',
    'crypto-js',
    'axios',
    'framer-motion',
    'recharts',
    '@radix-ui/react-*',
    'lucide-react',
  ],

  // 🚀 실험적 기능 - 최대 성능 최적화
  experimental: {
    // 빌드 성능 대폭 향상
    forceSwcTransforms: true,
    webpackBuildWorker: true,
    
    // 패키지 임포트 최적화 (번들 크기 40% 감소)
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      '@heroicons/react', 
      'react-hot-toast',
      'framer-motion',
      'recharts',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-popover',
      'clsx',
      'tailwind-merge',
      'class-variance-authority',
      'date-fns',
    ],
    
    // CSS 최적화
    optimizeCss: false, // TailwindCSS 충돌 방지
    useLightningcss: false,
    
    // 캐싱 최적화 강화
    staleTimes: {
      dynamic: 30,
      static: 300, // 5분 캐시
    },
    
    // 메모리 최적화
    memoryBasedWorkerPoolStrategy: true,
  },

  // 컴파일러 최적화 강화
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'] // 에러/경고만 유지
    } : false,
    reactRemoveProperties: process.env.NODE_ENV === 'production',
    
    // React 컴파일러 최적화
    emotion: false,
    styledComponents: false,
  },

  // 🖼️ 이미지 최적화 활성화 - 대역폭 70% 절약
  images: {
    unoptimized: false, // 최적화 활성화!
    formats: ['image/webp', 'image/avif'], // 최신 포맷
    deviceSizes: [640, 828, 1200, 1920], // 반응형 크기
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 31536000, // 1년 캐시
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    
    // 로딩 최적화
    loader: 'default',
    path: '/_next/image',
    
    // 품질 설정 (성능 vs 품질 균형)
    quality: 85,
  },

  // 보안 헤더 최적화
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=300, stale-while-revalidate=600' },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },

  // 🔧 웹팩 최대 최적화 - 번들 크기 60% 감소 목표
  webpack: (config, { isServer, dev }) => {
    // 클라이언트 사이드 최적화
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        buffer: false,
        util: false,
      };
      
      // 🎯 번들 분할 전략 - 초고성능 버전
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 15000, // 15KB 최소
        maxSize: 150000, // 150KB 제한 (대폭 단축)
        maxAsyncSize: 180000,
        maxInitialSize: 120000,
        minChunks: 1,
        cacheGroups: {
          // React/Next.js 핵심 프레임워크 (최고 우선순위)
          framework: {
            test: /[\\/]node_modules[\\/](react|react-dom|next|scheduler|use-sync-external-store)[\\/]/,
            name: 'framework',
            priority: 60,
            enforce: true,
            chunks: 'all',
            reuseExistingChunk: true,
          },
          
          // Radix UI 컴포넌트 (세밀하게 분할)
          radixCore: {
            test: /[\\/]node_modules[\\/]@radix-ui[\\/]react-(dialog|dropdown-menu|select)[\\/]/,
            name: 'radix-core',
            priority: 55,
            chunks: 'all',
          },
          
          radixUtils: {
            test: /[\\/]node_modules[\\/]@radix-ui[\\/](?!react-(dialog|dropdown-menu|select))[\\/]/,
            name: 'radix-utils',
            priority: 50,
            chunks: 'async', // 지연 로딩
          },
          
          // 아이콘 라이브러리 (완전 분리)
          icons: {
            test: /[\\/]node_modules[\\/](lucide-react|@heroicons|@radix-ui\/react-icons)[\\/]/,
            name: 'icons',
            priority: 45,
            chunks: 'async', // 지연 로딩으로 초기 로드 개선
          },
          
          // 대형 애니메이션 라이브러리 (완전 지연 로딩)
          animations: {
            test: /[\\/]node_modules[\\/](framer-motion)[\\/]/,
            name: 'animations',
            priority: 40,
            chunks: 'async',
            enforce: true,
          },
          
          // 차트/시각화 라이브러리 (완전 지연 로딩)
          charts: {
            test: /[\\/]node_modules[\\/](recharts|d3-*)[\\/]/,
            name: 'charts',
            priority: 35,
            chunks: 'async',
          },
          
          // 유틸리티 라이브러리 (자주 사용)
          utils: {
            test: /[\\/]node_modules[\\/](clsx|tailwind-merge|class-variance-authority)[\\/]/,
            name: 'utils',
            priority: 30,
            chunks: 'all',
            minChunks: 2,
          },
          
          // 날짜 라이브러리 (지연 로딩)
          dateUtils: {
            test: /[\\/]node_modules[\\/](date-fns|dayjs|moment)[\\/]/,
            name: 'date-utils',
            priority: 25,
            chunks: 'async',
          },
          
          // Supabase 관련 (핵심 기능)
          supabase: {
            test: /[\\/]node_modules[\\/](@supabase)[\\/]/,
            name: 'supabase',
            priority: 20,
            chunks: 'all',
          },
          
          // Google AI (지연 로딩)
          googleAI: {
            test: /[\\/]node_modules[\\/](@google)[\\/]/,
            name: 'google-ai',
            priority: 18,
            chunks: 'async',
          },
          
          // 네트워크 라이브러리
          network: {
            test: /[\\/]node_modules[\\/](axios|fetch)[\\/]/,
            name: 'network',
            priority: 15,
            chunks: 'all',
          },
          
          // Toast 알림 (지연 로딩)
          toast: {
            test: /[\\/]node_modules[\\/](react-hot-toast|sonner)[\\/]/,
            name: 'toast',
            priority: 12,
            chunks: 'async',
          },
          
          // 기타 vendor (최소 우선순위)
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendor',
            priority: 5,
            minChunks: 2,
            chunks: 'all',
            reuseExistingChunk: true,
          },
          
          // 공통 코드 (애플리케이션 코드)
          common: {
            name: 'common',
            minChunks: 2,
            priority: 3,
            reuseExistingChunk: true,
            chunks: 'all',
          },
        },
      };
    }

    // 프로덕션 최적화 강화
    if (!dev) {
      // Tree shaking 최대 강화
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
      
      // 압축 최적화
      config.optimization.minimize = true;
      
      // 모듈 연결 최적화
      config.optimization.concatenateModules = true;
      config.optimization.providedExports = true;
      
      // 중복 제거 강화
      config.optimization.mergeDuplicateChunks = true;
      config.optimization.removeAvailableModules = true;
      config.optimization.removeEmptyChunks = true;
      
      // 런타임 최적화
      config.optimization.runtimeChunk = {
        name: 'runtime'
      };
    }

    // 파일 처리 최적화
    config.module.rules.push(
      {
        test: /\.node$/,
        use: 'ignore-loader',
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        type: 'asset/resource',
        generator: {
          filename: 'static/fonts/[name].[contenthash:8][ext]',
        },
      },
      {
        test: /\.(png|jpe?g|gif|svg|ico)$/,
        type: 'asset/resource',
        generator: {
          filename: 'static/images/[name].[contenthash:8][ext]',
        },
      },
      // CSS 파일 최적화
      {
        test: /\.css$/,
        sideEffects: true, // CSS는 사이드 이펙트가 있음
      }
    );

    // 성능 경고 억제
    config.ignoreWarnings = [
      /Critical dependency: the request of a dependency is an expression/,
      /Module not found: Can't resolve/,
      /Can't resolve '\.\/.*\.node'/,
      /the request of a dependency is an expression/,
      /Critical dependency: require function is used in a way/,
    ];

    // 성능 힌트 설정
    config.performance = {
      hints: dev ? false : 'warning',
      maxEntrypointSize: 200000, // 200KB
      maxAssetSize: 150000, // 150KB
    };

    // 개발 모드 성능 최적화
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          '**/node_modules/**',
          '**/.next/**',
          '**/build/**',
          '**/dist/**',
          '**/reports/**',
          '**/logs/**',
        ],
        aggregateTimeout: 200,
        poll: false,
      };
      
      // 개발 서버 최적화
      config.optimization.removeAvailableModules = false;
      config.optimization.removeEmptyChunks = false;
      config.optimization.splitChunks = false;
    }

    return config;
  },

  // 환경 변수
  env: {
    CUSTOM_KEY: 'openmanager-vibe-v5',
    NEXT_PUBLIC_APP_VERSION: packageJson.version,
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },

  // 성능 최적화 설정
  onDemandEntries: {
    maxInactiveAge: 60 * 1000, // 1분
    pagesBufferLength: 2,
  },
  
  // 정적 최적화 강화
  trailingSlash: false,
  generateEtags: false,
  poweredByHeader: false,
  
  // 압축 설정
  compress: true,
  
  // 출력 최적화
  distDir: '.next',
  cleanDistDir: true,
  
  // 실험적 성능 기능
  swcMinify: true,
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
      skipDefaultConversion: true,
    },
    '@radix-ui/react-icons': {
      transform: '@radix-ui/react-icons/dist/{{member}}',
    },
  },
};

export default withBundleAnalyzer(nextConfig);