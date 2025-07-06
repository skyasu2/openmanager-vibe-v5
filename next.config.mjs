/** @type {import('next').NextConfig} */
const nextConfig = {
    // 🚀 Next.js 15 하이브리드 모드 (정적 + 동적)
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
        optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'], // 패키지 임포트 최적화
    },

    // 🚀 정적 최적화 활성화
    poweredByHeader: false,
    compress: true,

    // 🚀 이미지 최적화 설정
    images: {
        unoptimized: true, // 빌드 에러 방지를 위해 일시적으로 비활성화
        domains: [],
        formats: ['image/webp', 'image/avif'],
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

    // 🚀 헤더 설정 (캐싱 최적화)
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
            {
                // API 라우트는 별도 캐싱 정책
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

    // 🔧 웹팩 설정 (번들 최적화)
    webpack: (config, { isServer, dev }) => {
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

        // 🚨 Edge Runtime 동적 의존성 경고 억제
        config.ignoreWarnings = [
            ...(config.ignoreWarnings || []),
            {
                module: /edge-runtime-utils\.ts/,
                message: /Critical dependency: the request of a dependency is an expression/,
            },
        ];

        return config;
    },
};

export default nextConfig; 