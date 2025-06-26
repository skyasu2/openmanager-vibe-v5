/** @type {import('next').NextConfig} */
const nextConfig = {
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