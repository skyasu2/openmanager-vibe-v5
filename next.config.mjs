// Next.js 환경변수 로딩 개선
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

// .env.local 파일 수동 로딩 (Next.js가 로드하지 못하는 경우 대비)
const envPath = resolve(process.cwd(), '.env.local');
if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n');

    envLines.forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            const value = valueParts.join('=').trim();
            if (value && !process.env[key.trim()]) {
                process.env[key.trim()] = value;
            }
        }
    });

    console.log('🔧 .env.local 파일 수동 로딩 완료');
}

// 자동 환경변수 복호화 시스템 동기 로딩
try {
    console.log('🔐 Next.js 시작 시 환경변수 자동 복호화...');
    require('./src/lib/environment/auto-decrypt-env.ts');
    console.log('✅ 환경변수 자동 복호화 시스템 로드됨');
} catch (error) {
    console.warn('⚠️ 환경변수 자동 복호화 실패:', error.message);
}

/** @type {import('next').NextConfig} */
const nextConfig = {
    // 🚫 빌드 시점 강제 환경변수 설정
    env: {
        FORCE_MOCK_REDIS: process.env.FORCE_MOCK_REDIS || 'true',
        FORCE_MOCK_GOOGLE_AI: process.env.FORCE_MOCK_GOOGLE_AI || 'false',
        NEXT_PHASE: 'phase-production-build',
        GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY,
        GOOGLE_AI_ENABLED: process.env.GOOGLE_AI_ENABLED,
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        REDIS_URL: process.env.REDIS_URL,
        UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
        UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    },

    // 🎯 빌드 최적화 및 오류 방지
    output: 'standalone',

    // 🚫 404 페이지 프리렌더링 건너뛰기
    trailingSlash: false,
    skipTrailingSlashRedirect: true,

    // 🖼️ 이미지 최적화 비활성화
    images: {
        unoptimized: true,
        loader: 'custom',
        loaderFile: './src/utils/image-loader.js'
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
            child_process: false,
            'node:events': false,
            'node:fs': false,
            'node:fs/promises': false,
            'node:path': false,
            'node:url': false,
            'node:util': false,
        };

        // 서버 사이드 전용 모듈들을 클라이언트에서 제외
        if (!isServer) {
            config.externals = config.externals || [];
            config.externals.push({
                'child_process': 'commonjs child_process',
                'fs': 'commonjs fs',
                'fs/promises': 'commonjs fs/promises',
                'path': 'commonjs path',
                'glob': 'commonjs glob',
            });

            // MCP 클라이언트를 클라이언트 사이드에서 제외
            config.resolve.alias = {
                ...config.resolve.alias,
                '@/services/mcp/real-mcp-client': false,
            };
        }

        // 스토리북 파일 빌드에서 제외
        config.module.rules.push({
            test: /\.stories\.(js|jsx|ts|tsx)$/,
            use: 'ignore-loader'
        });

        // TypeScript 설정에서 스토리북 파일 제외
        config.resolve.alias = {
            ...config.resolve.alias,
            '@storybook/react': false,
        };

        return config;
    },

    // 🔨 서버 외부 패키지 설정 (Next.js 15)
    serverExternalPackages: ['@xenova/transformers'],

    // 🚫 404 페이지 오류 방지
    generateBuildId: async () => {
        return 'openmanager-vibe-v5-build'
    },

    // 개발 서버 설정 (buildActivity는 Next.js 15에서 제거됨)

    // 로깅 설정
    logging: {
        fetches: {
            fullUrl: false,
        },
    },

    experimental: {
        serverActions: {
            bodySizeLimit: '50mb',
        },
    },

};

export default nextConfig; 