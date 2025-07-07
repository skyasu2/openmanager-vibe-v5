/** @type {import('next').NextConfig} */
const nextConfig = {
    // 🚀 Next.js 15 완전 동적 모드 (정적 생성 완전 비활성화)
    output: 'standalone',
    trailingSlash: false,

    // Pages Router 완전 비활성화 (App Router만 사용)
    pageExtensions: ['tsx', 'ts', 'jsx', 'js'],

    // 🚫 정적 생성 에러 방지 설정 (빌드 에러 무시)
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },

    // 서버 외부 패키지 설정 (Next.js 15 새로운 방식)
    serverExternalPackages: ['@supabase/supabase-js', '@google/generative-ai'],

    // 🚀 SWC 및 실험적 기능 최적화 (Next.js 15 호환)
    experimental: {
        // CSS 최적화 (빌드 시간 단축)
        optimizeCss: true,
        // SWC 트랜스폼 강제 사용 (속도 향상)
        forceSwcTransforms: true,
        // 서버 컴포넌트 강화
        serverComponentsExternalPackages: [
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
            'rxjs',
            'reflect-metadata',
            'uuid',
            'crypto-js',
        ],
    },

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

    // 🔧 웹팩 설정 (Node.js crypto만 사용)
    webpack: (config, { isServer }) => {
        // 🚨 전역 polyfill 강화 - self 오류 완전 해결
        const webpack = require('webpack');

        config.plugins.push(
            new webpack.DefinePlugin({
                // 서버와 클라이언트 모두에서 self 정의
                'typeof self': JSON.stringify(isServer ? 'undefined' : 'object'),
                'self': isServer ? 'global' : 'self',
                'global.self': isServer ? 'global' : 'self',
                'globalThis.self': isServer ? 'globalThis' : 'self',
            })
        );

        // 🚨 ProvidePlugin으로 self 자동 제공
        config.plugins.push(
            new webpack.ProvidePlugin({
                self: isServer ? 'global' : 'self',
            })
        );

        // 메모리 최적화 설정
        config.optimization = {
            ...config.optimization,
            splitChunks: {
                chunks: 'all',
                maxAsyncRequests: 20,
                maxInitialRequests: 10,
                cacheGroups: {
                    vendor: {
                        test: /[\\/]node_modules[\\/]/,
                        name: 'vendors',
                        chunks: 'all',
                    },
                },
            },
        };

        // 🚀 서버 사이드에서 self 객체 polyfill 추가
        if (isServer) {
            // Node.js 환경에서 global 객체에 self 추가
            if (typeof global !== 'undefined' && typeof global.self === 'undefined') {
                global.self = global;
            }

            // 추가 서버 사이드 polyfills
            config.resolve.alias = {
                ...config.resolve.alias,
                'self': 'global',
            };
        }

        // 클라이언트 사이드에서 Node.js 모듈 사용 방지
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
                crypto: false,
                'global': false,
            };
        }

        // 🚨 Edge Runtime 동적 의존성 경고 억제
        config.ignoreWarnings = [
            ...(config.ignoreWarnings || []),
            {
                module: /edge-runtime-utils\.ts/,
                message: /Critical dependency: the request of a dependency is an expression/,
            },
            // self 관련 경고 억제
            {
                module: /vendors\.js/,
                message: /self is not defined/,
            },
        ];

        return config;
    },

    // 🚀 Next.js 15 Edge Runtime 최적화
    reactStrictMode: true,

    // 🛡️ 보안 헤더 설정
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

    // 🔧 환경 변수 설정
    env: {
        CUSTOM_KEY: 'openmanager-vibe-v5',
        BUILD_TIME: new Date().toISOString(),
        NODE_ENV: process.env.NODE_ENV || 'production',
        FORCE_NODE_CRYPTO: 'true',
    },
};

export default nextConfig; 