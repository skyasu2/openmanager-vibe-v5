/** @type {import('next').NextConfig} */
const nextConfig = {
    // 🚫 빌드 시점 강제 환경변수 설정
    env: {
        FORCE_MOCK_REDIS: process.env.FORCE_MOCK_REDIS || 'true',
        FORCE_MOCK_GOOGLE_AI: process.env.FORCE_MOCK_GOOGLE_AI || 'false',
        NEXT_PHASE: 'phase-production-build',
    },

    // 🔧 Webpack 설정 최적화
    webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
        // Node.js 폴리필 설정 (Next.js 15 호환)
        config.resolve.fallback = {
            ...config.resolve.fallback,
            dns: false,
            net: false,
            tls: false,
            fs: false,
            path: false,
            os: false,
        };

        return config;
    },

    // 🔨 실험적 기능 최적화
    experimental: {
        // Redis 패키지 최적화 제거 (충돌 방지)
    },
};

export default nextConfig; 