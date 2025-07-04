/** @type {import('next').NextConfig} */
const nextConfig = {
    // 기본 설정
    poweredByHeader: false,
    compress: true,

    // Pages Router 완전 비활성화
    pageExtensions: ['tsx', 'ts', 'jsx', 'js'],

    // App Router 전용 모드
    experimental: {
        forceSwcTransforms: true,
        swcTraceProfiling: false,
        optimizeCss: true,
        optimizeServerReact: true,
        workerThreads: false,
        craCompat: false,
        // Pages Router 관련 기능 완전 비활성화
        disableOptimizedLoading: false,
        // 프리렌더링 완전 비활성화  
        ppr: false
    },

    // 빌드 최적화
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production'
    },

    // 이미지 최적화 (Vercel 호환)
    images: {
        formats: ['image/webp', 'image/avif'],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
        dangerouslyAllowSVG: true,
        contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**'
            }
        ]
    },

    // App Router 전용 Webpack 설정
    webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
        // Pages Router 관련 파일 완전 무시
        config.resolve.alias = {
            ...config.resolve.alias,
            // Pages Router 관련 모듈 무시
            'next/document': false,
            'next/app': false
        };

        // 빌드 시 Pages Router 모듈 제외
        config.externals = config.externals || [];
        if (isServer) {
            config.externals.push({
                '_document': 'commonjs _document',
                '_app': 'commonjs _app',
                '_error': 'commonjs _error'
            });
        }

        // Pages Router 관련 파일 무시 규칙 추가
        config.module = config.module || {};
        config.module.rules = config.module.rules || [];
        config.module.rules.push({
            test: /\/_document\.js$/,
            use: 'ignore-loader',
        });

        // 서버 사이드가 아닌 경우 Node.js 모듈 폴백 설정
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                path: false,
                crypto: false,
                stream: false,
                os: false,
                net: false,
                tls: false
            };
        }

        // 프로덕션 최적화
        if (!dev && !isServer) {
            config.optimization = {
                ...config.optimization,
                splitChunks: {
                    ...config.optimization.splitChunks,
                    cacheGroups: {
                        ...config.optimization.splitChunks.cacheGroups,
                        commons: {
                            name: 'commons',
                            chunks: 'all',
                            minChunks: 2
                        }
                    }
                }
            };
        }

        return config;
    },

    // 기존 rewrites 기능 유지
    async rewrites() {
        return [
            {
                source: '/health',
                destination: '/api/health'
            }
        ];
    },

    // 리다이렉트 설정
    async redirects() {
        return [
            {
                source: '/_error',
                destination: '/500',
                permanent: false,
            },
            {
                source: '/_document',
                destination: '/404',
                permanent: false,
            },
        ];
    },

    // 정적 생성 방지 설정
    trailingSlash: false,
    skipTrailingSlashRedirect: true,

    // 환경변수 설정
    env: {
        CUSTOM_KEY: 'app-router-only',
        DISABLE_PAGES_ROUTER: 'true',
        VERCEL_ENV: process.env.VERCEL_ENV || 'development',
        NEXT_PUBLIC_VERCEL_URL: process.env.VERCEL_URL || 'localhost:3000'
    },

    // 타입체크 최적화
    typescript: {
        ignoreBuildErrors: false,
    },
    eslint: {
        ignoreDuringBuilds: false,
    },

    // 로깅 최적화
    logging: {
        fetches: {
            fullUrl: true,
        },
    },

    // 실험적 기능 최적화 (Vercel 호환)
    serverExternalPackages: ['sharp'],

    // Vercel 배포 최적화
    output: 'standalone',

    // 정적 페이지 생성 시 제외할 경로
    generateBuildId: async () => {
        return 'app-router-only-' + Date.now()
    }
};

export default nextConfig; 