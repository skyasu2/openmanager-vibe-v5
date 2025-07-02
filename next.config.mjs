/** @type {import('next').NextConfig} */
const nextConfig = {
    // 빌드 최적화 설정 (Vercel 배포용)
    // output: 'standalone', // 정적 내보내기 오류 방지를 위해 주석 처리

    // 정적 생성 비활성화 (빌드 오류 방지)
    trailingSlash: false,

    // API 라우트 정적 생성 비활성화
    skipTrailingSlashRedirect: true,

    // 정적 내보내기 비활성화 (누락된 라우트 오류 방지)
    output: undefined,

    // Pages Router 완전 비활성화 (App Router만 사용)
    pageExtensions: ['tsx', 'ts', 'jsx', 'js'],

    // 정적 생성 및 빌드 오류 방지
    typescript: {
        ignoreBuildErrors: false,
    },

    eslint: {
        ignoreDuringBuilds: false,
    },

    // 서버 외부 패키지 설정 (새로운 방식)
    serverExternalPackages: ['@supabase/supabase-js'],

    // SWC 강제 사용으로 Babel 충돌 해결 + 기타 실험적 기능
    experimental: {
        forceSwcTransforms: true,
        swcTraceProfiling: false,
        // Pages Router 완전 비활성화
        disableStaticImages: true,
        // 모든 페이지에서 Pages Router 관련 기능 비활성화
        serverComponentsExternalPackages: ['@supabase/supabase-js'],
        // 정적 워커 비활성화
        workerThreads: false,
        // 빌드 관련 실험적 기능 비활성화
        craCompat: false,
    },

    // 빌드 설정 - 정적 최적화 비활성화
    poweredByHeader: false,
    generateEtags: false,
    compress: false,

    // App Router 전용 설정
    onDemandEntries: {
        maxInactiveAge: 25 * 1000,
        pagesBufferLength: 2,
    },

    // 커스텀 404/500 페이지 비활성화 (App Router 전용)
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

    // 리다이렉트 설정 (Pages Router 대신 App Router 사용)
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
};

export default nextConfig; 