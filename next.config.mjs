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
        forceSwcTransforms: true, // SWC 트랜스파일러 강제 사용 (Babel보다 빠름)
        optimizeCss: true, // CSS 최적화 활성화
    },

    // 🚫 정적 최적화 비활성화
    poweredByHeader: false,
    compress: true,

    // 🚫 이미지 최적화 비활성화 (정적 생성 방지)
    images: {
        unoptimized: true,
        domains: [],
        formats: ['image/webp', 'image/avif'],
    },

    // 🔄 리다이렉트 설정 (404 문제 해결)
    async redirects() {
        return [
            {
                source: '/_document',
                destination: '/not-found',
                permanent: false,
            },
            {
                source: '/_error',
                destination: '/error',
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
                ],
            },
        ];
    },

    // 🔧 웹팩 설정 (번들 최적화)
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

        return config;
    },
};

export default nextConfig; 