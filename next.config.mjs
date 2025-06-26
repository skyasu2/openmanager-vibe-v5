/** @type {import('next').NextConfig} */
const nextConfig = {
    // SWC 강제 사용으로 Babel 충돌 해결
    swcMinify: true,
    experimental: {
        forceSwcTransforms: true,
        swcTraceProfiling: false
    },

    webpack: (config, { isServer }) => {
        // SWC 우선 사용 설정
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
            };
        }

        return config;
    },
};

export default nextConfig; 