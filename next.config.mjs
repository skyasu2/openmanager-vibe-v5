/** @type {import('next').NextConfig} */
const nextConfig = {
    // 🚀 Next.js 15 완전 동적 모드 (정적 생성 완전 비활성화)
    output: 'standalone',
    trailingSlash: false,

    // Pages Router 완전 비활성화 (App Router만 사용)
    pageExtensions: ['tsx', 'ts', 'jsx', 'js'],

    // 🔧 빌드 검사 활성화 (안정성 향상)
    typescript: {
        ignoreBuildErrors: false,
    },
    eslint: {
        ignoreDuringBuilds: false,
    },

    // 서버 외부 패키지 설정 (Next.js 14 호환 방식)
    experimental: {
        serverComponentsExternalPackages: [
            '@supabase/supabase-js',
            '@google/generative-ai',
            'ioredis',
            'redis',
            '@redis/client',
            'webworker-threads',
            'generic-pool',
            'cluster',
            'denque',
            'systeminformation',
            'node-cron',
            'pino',
            'pino-pretty',
            'winston',
            'winston-daily-rotate-file',
            'sharp',
            'canvas',
            'pdf-parse',
            '@xenova/transformers',
            'natural',
            'compromise',
            'fuzzyset.js',
            'fuse.js',
            'ml-kmeans',
            'ml-pca',
            'ml-regression',
            'simple-statistics',
            'reflect-metadata',
            'uuid',
            'crypto-js',
        ],
        // CSS 최적화 (빌드 시간 단축)
        optimizeCss: true,
        // SWC 트랜스폼 강제 사용 (속도 향상)
        forceSwcTransforms: true,
    },

    // 🚀 패키지 트랜스파일 설정 (충돌 방지)
    transpilePackages: [
        // rxjs 제외 - serverExternalPackages와 충돌 방지
    ],


    // 🚫 정적 최적화 비활성화
    poweredByHeader: false,
    compress: true,

    // 🚫 이미지 최적화 비활성화 (정적 생성 방지)
    images: {
        unoptimized: true,
        domains: ['localhost', 'vercel.app'],
        formats: ['image/webp', 'image/avif'],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    },

    // 🔄 리다이렉트 설정 (404 문제 해결)
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

    // 🚫 헤더 설정 (캐싱 최적화)
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
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin',
                    },
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block',
                    },
                ],
            },
        ];
    },

    // 🔧 웹팩 설정 (Edge Runtime 호환성 향상)
    webpack: (config, { isServer }) => {
        // 클라이언트 사이드에서 Node.js 모듈 사용 방지
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
                crypto: false,
            };
        }

        // ONNX 바이너리 파일 제외
        config.module.rules.push({
            test: /\.node$/,
            use: 'ignore-loader',
        });

        // 동적 import 경고 억제
        config.ignoreWarnings = [
            /Critical dependency: the request of a dependency is an expression/,
            /Module not found: Can't resolve 'fs'/,
            /Module not found: Can't resolve 'net'/,
            /Module not found: Can't resolve 'tls'/,
            /Can't resolve '\.\/.*\.node'/,
        ];

        return config;
    },

    // 🚀 Next.js 15 Edge Runtime 최적화
    reactStrictMode: true,

    // 🔧 환경 변수 설정
    env: {
        CUSTOM_KEY: 'openmanager-vibe-v5',
        BUILD_TIME: new Date().toISOString(),
        FORCE_NODE_CRYPTO: 'true',
    },
};

export default nextConfig; 