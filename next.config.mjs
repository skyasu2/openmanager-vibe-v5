/** @type {import('next').NextConfig} */
const nextConfig = {
    // 🚀 Next.js 15 완전 동적 모드 (정적 생성 완전 비활성화)
    output: undefined,
    trailingSlash: false,
    skipTrailingSlashRedirect: true,

    // Pages Router 완전 비활성화 (App Router만 사용)
    pageExtensions: ['tsx', 'ts', 'jsx', 'js'],

    // 🚫 정적 생성 에러 방지 설정
    typescript: {
        ignoreBuildErrors: false,
    },
    eslint: {
        ignoreDuringBuilds: false,
    },

    // 서버 외부 패키지 설정 (Next.js 15 새로운 방식)
    serverExternalPackages: ['@supabase/supabase-js', '@google/generative-ai'],

    // 🚀 SWC 및 실험적 기능 최적화 (Next.js 15 호환)
    experimental: {
        forceSwcTransforms: true, // SWC 트랜스파일러 강제 사용 (Babel보다 빠름)
        swcTraceProfiling: false, // 프로파일링 비활성화 (프로덕션 성능 향상)
        optimizeCss: true, // CSS 최적화 활성화
        optimizeServerReact: true, // 서버 컴포넌트 최적화
        // 워커 스레드 및 호환성 설정
        workerThreads: false,
        craCompat: false,
    },

    // 🚀 빌드 설정 - 성능 최적화 활성화 (2025.7.3 개선)
    poweredByHeader: false, // 보안상 헤더 숨김
    generateEtags: true, // 캐싱 최적화를 위해 ETag 활성화
    compress: true, // Gzip 압축 활성화로 번들 크기 최적화

    // App Router 전용 설정
    onDemandEntries: {
        maxInactiveAge: 25 * 1000,
        pagesBufferLength: 2,
    },

    // 커스텀 빌드 ID
    generateBuildId: async () => {
        return 'openmanager-vibe-v5';
    },

    webpack: (config, { isServer }) => {
        // 서버 사이드가 아닌 경우 Node.js 모듈 폴백 설정
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
                crypto: 'crypto-browserify',
                stream: 'stream-browserify',
                assert: 'assert',
                http: 'stream-http',
                https: 'https-browserify',
                os: 'os-browserify',
                url: 'url',
                util: 'util',
            };
        }

        // CSS 최적화 비활성화 (빌드 오류 방지)
        config.optimization = {
            ...config.optimization,
            minimizer: config.optimization.minimizer?.filter(
                (plugin) => plugin.constructor.name !== 'CssMinimizerPlugin'
            ),
        };

        // 정적 생성 관련 플러그인 제거
        config.plugins = config.plugins?.filter(
            (plugin) => plugin?.constructor?.name !== 'NextJsRequireCacheHotReloader'
        );

        return config;
    },

    // 🚫 문제 페이지 리다이렉트 설정
    async redirects() {
        return [
            {
                source: '/_error',
                destination: '/500',
                permanent: false,
            },
            {
                source: '/_document',
                destination: '/500',
                permanent: false,
            },
        ];
    },

    // 🚫 정적 생성에서 제외할 경로들
    async headers() {
        return [
            {
                source: '/api/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'no-store, max-age=0',
                    },
                ],
            },
        ];
    },
};

export default nextConfig; 