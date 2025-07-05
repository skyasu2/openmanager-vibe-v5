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
        serverComponentsExternalPackages: ['@supabase/supabase-js', '@google/generative-ai'],
        optimizePackageImports: ['lucide-react', 'recharts'],
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

    // 리다이렉트 설정 (App Router 전용)
    async redirects() {
        return [
            {
                source: '/dashboard',
                destination: '/',
                permanent: false,
            },
        ];
    },

    // 🎯 캐싱 최적화
    headers: async () => {
        return [
            {
                source: '/api/system/state',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, s-maxage=60, stale-while-revalidate=120', // 1분 캐시, 2분 stale
                    },
                ],
            },
            {
                source: '/api/dashboard',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, s-maxage=120, stale-while-revalidate=300', // 2분 캐시, 5분 stale
                    },
                ],
            },
            {
                source: '/api/unified-metrics',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, s-maxage=180, stale-while-revalidate=600', // 3분 캐시, 10분 stale
                    },
                ],
            },
        ];
    },

    // 🎯 이미지 최적화
    images: {
        domains: ['images.unsplash.com', 'via.placeholder.com'],
        formats: ['image/webp', 'image/avif'],
        minimumCacheTTL: 3600, // 1시간 캐시
    },

    // 🚫 불필요한 기능 비활성화
    eslint: {
        ignoreDuringBuilds: false,
    },

    // 🌐 국제화 비활성화 (한국어 전용)
    i18n: undefined,
};

export default nextConfig; 