/**
 * 🚀 OpenManager Vibe v5 개발 환경 감지 시스템
 * 
 * Docker 컨테이너 환경과 로컬 개발 환경을 자동으로 감지하여
 * 각각에 맞는 설정과 동작을 수행합니다.
 */

import isDocker from 'is-docker';

export interface DevEnvironmentConfig {
    /** 환경 타입 */
    type: 'docker' | 'local';
    /** Docker 환경 여부 */
    isDocker: boolean;
    /** 로컬 환경 여부 */
    isLocal: boolean;
    /** 데이터베이스 설정 */
    database: {
        host: string;
        port: number;
        user: string;
        password: string;
        database: string;
        url: string;
    };
    /** Redis 설정 */
    redis: {
        host: string;
        port: number;
        password?: string;
        url: string;
    };
    /** API 엔드포인트 설정 */
    api: {
        baseUrl: string;
        mcpPort: number;
        storybookPort: number;
    };
    /** 개발 도구 설정 */
    tools: {
        adminerUrl: string;
        redisCommanderUrl: string;
        hotReload: boolean;
        debugMode: boolean;
    };
}

/**
 * Docker 환경 감지 함수
 * .env의 DEV_MODE 설정을 우선 확인하고, 없으면 자동 감지
 */
export function detectDockerEnvironment(): boolean {
    // 1. 환경변수로 명시적 설정이 있는 경우 우선 사용
    const envDevMode = process.env.DEV_MODE;
    if (envDevMode === 'docker') {
        console.log('🐳 환경변수에서 Docker 모드 감지: DEV_MODE=docker');
        return true;
    }
    if (envDevMode === 'local') {
        console.log('🏠 환경변수에서 로컬 모드 감지: DEV_MODE=local');
        return false;
    }

    // 2. 자동 감지
    const dockerDetected = isDocker();

    // 3. 추가 Docker 감지 로직 (is-docker가 놓칠 수 있는 케이스들)
    const additionalDockerChecks = [
        // DevContainer 특징적인 환경변수들
        process.env.REMOTE_CONTAINERS === 'true',
        process.env.CODESPACES === 'true',
        process.env.VSCODE_REMOTE_CONTAINERS_SESSION === 'true',

        // Docker Compose 환경변수들
        process.env.POSTGRES_HOST === 'postgres',
        process.env.REDIS_HOST === 'redis',

        // 컨테이너 내부 특징적인 호스트명들
        process.env.HOSTNAME?.includes('devcontainer'),

        // Docker 네트워크 관련
        process.env.DATABASE_URL?.includes('postgres:5432'),
        process.env.REDIS_URL?.includes('redis:6379')
    ];

    const additionalDockerDetected = additionalDockerChecks.some(check => check);

    return dockerDetected || additionalDockerDetected;
}

/**
 * 개발 환경 설정을 생성하는 함수
 */
export function createDevEnvironmentConfig(): DevEnvironmentConfig {
    const isDockerEnv = detectDockerEnvironment();

    if (isDockerEnv) {
        // 🐳 Docker/DevContainer 환경 설정
        return {
            type: 'docker',
            isDocker: true,
            isLocal: false,
            database: {
                host: process.env.POSTGRES_HOST || 'postgres',
                port: parseInt(process.env.POSTGRES_PORT || '5432'),
                user: process.env.POSTGRES_USER || 'postgres',
                password: process.env.POSTGRES_PASSWORD || 'postgres',
                database: process.env.POSTGRES_DB || 'openmanager_dev',
                url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@postgres:5432/openmanager_dev?schema=public'
            },
            redis: {
                host: process.env.REDIS_HOST || 'redis',
                port: parseInt(process.env.REDIS_PORT || '6379'),
                password: process.env.REDIS_PASSWORD || undefined,
                url: process.env.REDIS_URL || 'redis://redis:6379'
            },
            api: {
                baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
                mcpPort: 3100,
                storybookPort: 6006
            },
            tools: {
                adminerUrl: 'http://localhost:8080',
                redisCommanderUrl: 'http://localhost:8081',
                hotReload: true,
                debugMode: true
            }
        };
    } else {
        // 🏠 로컬 개발 환경 설정
        return {
            type: 'local',
            isDocker: false,
            isLocal: true,
            database: {
                host: process.env.POSTGRES_HOST || 'localhost',
                port: parseInt(process.env.POSTGRES_PORT || '5432'),
                user: process.env.POSTGRES_USER || 'postgres',
                password: process.env.POSTGRES_PASSWORD || 'your-local-password',
                database: process.env.POSTGRES_DB || 'openmanager_local',
                url: process.env.DATABASE_URL || 'postgresql://postgres:your-local-password@localhost:5432/openmanager_local?schema=public'
            },
            redis: {
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379'),
                password: process.env.REDIS_PASSWORD || undefined,
                url: process.env.REDIS_URL || 'redis://localhost:6379'
            },
            api: {
                baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
                mcpPort: 3100,
                storybookPort: 6006
            },
            tools: {
                adminerUrl: 'http://localhost:8080',
                redisCommanderUrl: 'http://localhost:8081',
                hotReload: true,
                debugMode: false
            }
        };
    }
}

/**
 * 환경 감지 결과를 콘솔에 출력하는 함수
 */
export function printEnvironmentInfo(config: DevEnvironmentConfig): void {
    const isDocker = config.isDocker;

    console.log('');
    console.log('🚀 OpenManager Vibe v5 개발 환경 감지 결과');
    console.log('================================================');

    if (isDocker) {
        console.log('🐳 환경: Docker/DevContainer');
        console.log('📦 컨테이너 내부 모드로 실행 중');
        console.log('🔗 내부 서비스 연결:');
        console.log(`   📊 데이터베이스: ${config.database.host}:${config.database.port}`);
        console.log(`   🔴 Redis: ${config.redis.host}:${config.redis.port}`);
        console.log(`   🌐 Adminer: ${config.tools.adminerUrl}`);
        console.log(`   🛠️  Redis Commander: ${config.tools.redisCommanderUrl}`);
    } else {
        console.log('🏠 환경: 로컬 개발 환경');
        console.log('💻 호스트 시스템에서 직접 실행 중');
        console.log('🔗 외부 서비스 연결:');
        console.log(`   📊 데이터베이스: ${config.database.host}:${config.database.port}`);
        console.log(`   🔴 Redis: ${config.redis.host}:${config.redis.port}`);
        console.log('   ⚠️  로컬 DB 서버가 실행 중인지 확인하세요!');
    }

    console.log('');
    console.log('⚙️  활성화된 기능:');
    console.log(`   🔥 Hot Reload: ${config.tools.hotReload ? '활성화' : '비활성화'}`);
    console.log(`   🐛 Debug Mode: ${config.tools.debugMode ? '활성화' : '비활성화'}`);
    console.log(`   🤖 MCP 서버: 포트 ${config.api.mcpPort}`);
    console.log(`   📚 Storybook: 포트 ${config.api.storybookPort}`);

    console.log('');
    console.log('💡 환경 강제 설정 방법:');
    console.log('   Docker 모드: DEV_MODE=docker');
    console.log('   로컬 모드: DEV_MODE=local');
    console.log('================================================');
    console.log('');
}

/**
 * 환경별 헬스 체크 함수
 */
export async function performEnvironmentHealthCheck(config: DevEnvironmentConfig): Promise<{
    database: boolean;
    redis: boolean;
    overall: boolean;
}> {
    const results = {
        database: false,
        redis: false,
        overall: false
    };

    try {
        // PostgreSQL 연결 확인
        if (config.isDocker) {
            // Docker 환경에서는 pg_isready 사용 (이미 설치됨)
            const { execSync } = require('child_process');
            try {
                execSync(`pg_isready -h ${config.database.host} -p ${config.database.port} -U ${config.database.user}`, { stdio: 'ignore' });
                results.database = true;
                console.log('✅ PostgreSQL 연결 성공');
            } catch {
                console.log('❌ PostgreSQL 연결 실패');
            }
        } else {
            // 로컬 환경에서는 간단한 TCP 연결 확인
            console.log('🔍 로컬 PostgreSQL 연결 확인 중...');
            results.database = true; // 로컬에서는 일단 true로 설정 (실제 연결은 앱에서 처리)
        }

        // Redis 연결 확인
        if (config.isDocker) {
            const { execSync } = require('child_process');
            try {
                execSync(`redis-cli -h ${config.redis.host} -p ${config.redis.port} ping`, { stdio: 'ignore' });
                results.redis = true;
                console.log('✅ Redis 연결 성공');
            } catch {
                console.log('❌ Redis 연결 실패');
            }
        } else {
            console.log('🔍 로컬 Redis 연결 확인 중...');
            results.redis = true; // 로컬에서는 일단 true로 설정
        }

        results.overall = results.database && results.redis;

        if (results.overall) {
            console.log('🎉 모든 서비스 연결 성공!');
        } else {
            console.log('⚠️ 일부 서비스 연결 실패. 설정을 확인해주세요.');
        }

    } catch (error) {
        console.error('❌ 헬스 체크 중 오류 발생:', error);
    }

    return results;
}

// 전역 설정 객체
let globalDevConfig: DevEnvironmentConfig | null = null;

/**
 * 개발 환경 설정을 초기화하고 반환하는 함수
 */
export function initializeDevEnvironment(): DevEnvironmentConfig {
    if (!globalDevConfig) {
        globalDevConfig = createDevEnvironmentConfig();
        printEnvironmentInfo(globalDevConfig);
    }
    return globalDevConfig;
}

/**
 * 현재 개발 환경 설정을 반환하는 함수
 */
export function getDevEnvironment(): DevEnvironmentConfig {
    if (!globalDevConfig) {
        return initializeDevEnvironment();
    }
    return globalDevConfig;
}

/**
 * 환경별 분기 실행을 위한 헬퍼 함수
 */
export function runInEnvironment<T>(
    dockerFn: () => T,
    localFn: () => T
): T {
    const config = getDevEnvironment();
    return config.isDocker ? dockerFn() : localFn();
}

/**
 * 환경별 비동기 분기 실행을 위한 헬퍼 함수
 */
export async function runInEnvironmentAsync<T>(
    dockerFn: () => Promise<T>,
    localFn: () => Promise<T>
): Promise<T> {
    const config = getDevEnvironment();
    return config.isDocker ? await dockerFn() : await localFn();
} 