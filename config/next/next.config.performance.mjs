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

  // 🏗️ 실험적 기능들 - 성능 위주
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
    
    // ✨ 캐시 최적화
    staleTimes: {
      dynamic: 30,     // 동적 페이지: 30초
      static: 300,     // 정적 페이지: 5분
    },
    
    // 🧪 기타 성능 실험 기능
    typedRoutes: false,  // 성능을 위해 비활성화
    optimizeServerReact: true,
    serverComponentsHmrCache: true,
  },

  // 🗜️ 압축 설정
  compress: true,
  poweredByHeader: false,

  // ⚡ 번들 최적화
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // 🎯 성능 중심 webpack 설정
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          framework: {
            chunks: 'all',
            name: 'framework',
            test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
            priority: 40,
            enforce: true,
          },
          commons: {
            name: 'commons',
            chunks: 'all',
            minChunks: 2,
            priority: 20,
          },
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /[\\/]node_modules[\\/]/,
            priority: 10,
          },
        },
      },
    };

    // 📊 개발 모드에서는 빠른 빌드
    if (dev) {
      config.optimization.splitChunks = false;
    }

    return config;
  },

  // 🖼️ 이미지 최적화
  images: {
    formats: ['image/webp', 'image/avif'],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    minimumCacheTTL: 31536000,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },

  // 🔒 보안 헤더들
  async headers() {
    const securityHeaders = [
      {
        key: 'X-DNS-Prefetch-Control',
        value: 'on'
      },
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains'
      },
      {
        key: 'X-Frame-Options',
        value: 'SAMEORIGIN'
      },
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff'
      },
      {
        key: 'Referrer-Policy',
        value: 'origin-when-cross-origin'
      },
      {
        key: 'Cache-Control',
        value: 'public, max-age=31536000, immutable'
      }
    ];

    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
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

  // 🎯 리다이렉트 최적화
  async redirects() {
    return [];
  },

  // 🔄 리라이트 최적화
  async rewrites() {
    return [];
  },

  // 📦 빌드 출력 최적화
  distDir: '.next',
  cleanDistDir: true,
  
  // 🛠️ 개발 설정
  devIndicators: {
    buildActivity: true,
    buildActivityPosition: 'bottom-right',
  },

  // 📈 성능 메트릭
  httpAgentOptions: {
    keepAlive: true,
  },

  // 🔍 소스맵 (프로덕션에서는 비활성화)
  productionBrowserSourceMaps: false,

  // 🎚️ 환경 변수
  env: {
    APP_VERSION: packageJson.version,
    BUILD_ID: '${buildId}',
  },
};

export default withBundleAnalyzer(nextConfig);