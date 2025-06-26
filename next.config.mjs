/** @type {import('next').NextConfig} */
const nextConfig = {
    // 빌드 최적화 설정 (Vercel 배포용)
    // output: 'standalone', // 정적 내보내기 오류 방지를 위해 주석 처리

    // 정적 생성 비활성화 (빌드 오류 방지)
    trailingSlash: false,

    // 정적 생성 및 빌드 오류 방지
    typescript: {
        ignoreBuildErrors: false,
    },

    eslint: {
        ignoreDuringBuilds: false,
    },

    // 서버 외부 패키지 설정 (새로운 방식)
    serverExternalPackages: ['@supabase/supabase-js'],

    // SWC 강제 사용으로 Babel 충돌 해결
    experimental: {
        forceSwcTransforms: true,
        swcTraceProfiling: false
    },

    webpack: (config, { isServer }) => {
        // 서버 사이드가 아닌 경우 Node.js 모듈 폴백 설정
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
                dns: false,  // Redis 관련 DNS 모듈 제외
                crypto: false,
                stream: false,
                util: false,
                url: false,
                querystring: false,
            };
        }

        return config;
    },
};

export default nextConfig; 