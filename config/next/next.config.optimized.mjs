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
  // 🚀 Next.js 15 최적화 설정
  output: 'standalone',
  trailingSlash: false,
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],

  // 🔧 TypeScript 설정
  typescript: {
    ignoreBuildErrors: process.env.VERCEL === '1',
    tsconfigPath: './tsconfig.json',
  },
  eslint: {
    ignoreDuringBuilds: false,
  },

  // 🏗️ 실험적 기능들
  experimental: {
    optimizePackageImports: [
      '@radix-ui/react-avatar',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      'lucide-react',
      'recharts',
    ],
    typedRoutes: true,
    optimizeServerReact: true,
  },

  // 🗜️ 압축 설정
  compress: true,
  poweredByHeader: false,

  // ⚡ 번들 최적화
  webpack: (config, { buildId, dev, isServer }) => {
    if (!dev) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      };
    }
    return config;
  },

  // 🖼️ 이미지 최적화
  images: {
    formats: ['image/webp'],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // 📈 환경 변수
  env: {
    APP_VERSION: packageJson.version,
  },
};

export default withBundleAnalyzer(nextConfig);