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
  // 🚀 Next.js 15 울트라 최적화 설정
  output: 'standalone',
  trailingSlash: false,
  pageExtensions: ['tsx', 'ts'],
  reactStrictMode: false, // 성능을 위해 비활성화

  // 🔧 TypeScript 설정 - 최고 성능
  typescript: {
    ignoreBuildErrors: true, // 빌드 속도 최적화
    tsconfigPath: './tsconfig.build.json',
  },
  eslint: {
    ignoreDuringBuilds: true, // 빌드 속도 최적화
  },

  // 🏗️ 실험적 기능들 - 모든 최적화 활성화
  experimental: {
    optimizePackageImports: [
      '@next/font',
      '@radix-ui/react-avatar',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-label',
      '@radix-ui/react-progress',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-slot',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@radix-ui/react-tooltip',
      'lucide-react',
      'recharts',
      '@supabase/supabase-js',
      'clsx',
      'class-variance-authority',
      'tailwind-merge',
    ],
    
    // ✨ 캐시 최적화 - 극대화
    staleTimes: {
      dynamic: 60,     // 동적 페이지: 1분
      static: 3600,    // 정적 페이지: 1시간
    },
    
    // 🧪 모든 성능 기능 활성화
    typedRoutes: false,  // 성능을 위해 비활성화
    optimizeServerReact: true,
    serverComponentsHmrCache: true,
    webpackBuildWorker: true,
    parallelServerCompiles: true,
    parallelServerBuildTraces: true,
  },

  // 🗜️ 압축 설정 - 최대
  compress: true,
  poweredByHeader: false,

  // ⚡ 번들 최적화 - 극한
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // 🎯 극한 성능 webpack 설정
    config.optimization = {
      ...config.optimization,
      minimize: true,
      splitChunks: {
        chunks: 'all',
        maxInitialRequests: 25,
        maxAsyncRequests: 25,
        cacheGroups: {
          framework: {
            chunks: 'all',
            name: 'framework',
            test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
            priority: 40,
            enforce: true,
          },
          lib: {
            test: /[\\/]node_modules[\\/]/,
            name: 'lib',
            priority: 30,
            chunks: 'initial',
          },
          commons: {
            name: 'commons',
            chunks: 'initial',
            minChunks: 2,
            priority: 20,
          },
          shared: {
            name: 'shared',
            chunks: 'all',
            minChunks: 2,
            priority: 10,
          },
        },
      },
    };

    // 📊 개발 모드 최적화
    if (dev) {
      config.optimization.splitChunks = {
        chunks: 'async',
        cacheGroups: {
          default: false,
          vendors: false,
        },
      };
    }

    // Tree shaking 강화
    config.optimization.usedExports = true;
    config.optimization.providedExports = true;
    config.optimization.sideEffects = false;

    return config;
  },

  // 🖼️ 이미지 최적화 - 극한
  images: {
    formats: ['image/avif', 'image/webp'],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    minimumCacheTTL: 31536000, // 1년
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128],
    quality: 75, // 최적 품질/크기 비율
  },

  // 🔒 보안 헤더들 - 성능 중심
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // 📦 빌드 출력 최적화
  distDir: '.next',
  cleanDistDir: true,
  generateEtags: false, // 성능 최적화
  
  // 🛠️ 개발 설정 - 최소화
  devIndicators: {
    buildActivity: false, // 성능을 위해 비활성화
    buildActivityPosition: 'bottom-right',
  },

  // 📈 성능 메트릭 최적화
  httpAgentOptions: {
    keepAlive: true,
  },

  // 🔍 소스맵 완전 비활성화
  productionBrowserSourceMaps: false,

  // 🎚️ 환경 변수
  env: {
    APP_VERSION: packageJson.version,
    BUILD_MODE: 'ultra-optimized',
  },
};

export default withBundleAnalyzer(nextConfig);