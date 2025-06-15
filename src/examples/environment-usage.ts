/**
 * 🚀 환경 감지 시스템 사용 예시
 * 
 * 이 파일은 개발 환경 감지 시스템을 사용하는 방법을 보여줍니다.
 */

import {
    getDevEnvironmentInfo,
    executeInDevEnvironment,
    getCurrentEnvironmentType,
    getEnvironmentSpecificConfig
} from '@/utils/init-dev-env';

/**
 * 예시 1: 환경에 따른 데이터베이스 연결 설정
 */
export function getDatabaseConnection() {
    const envInfo = getDevEnvironmentInfo();

    console.log(`🗄️ 데이터베이스 연결 설정 (${envInfo.type} 환경):`);
    console.log(`   Host: ${envInfo.database.host}`);
    console.log(`   Port: ${envInfo.database.port}`);
    console.log(`   Database: ${envInfo.database.database}`);

    return {
        host: envInfo.database.host,
        port: envInfo.database.port,
        database: envInfo.database.database,
        user: envInfo.database.user,
        password: envInfo.database.password,
        url: envInfo.database.url
    };
}

/**
 * 예시 2: 환경에 따른 Redis 연결 설정
 */
export function getRedisConnection() {
    const envInfo = getDevEnvironmentInfo();

    console.log(`🔴 Redis 연결 설정 (${envInfo.type} 환경):`);
    console.log(`   Host: ${envInfo.redis.host}`);
    console.log(`   Port: ${envInfo.redis.port}`);

    return {
        host: envInfo.redis.host,
        port: envInfo.redis.port,
        password: envInfo.redis.password,
        url: envInfo.redis.url
    };
}

/**
 * 예시 3: 환경별 분기 실행 - 로깅 설정
 */
export function setupLogging() {
    const envType = getCurrentEnvironmentType();

    if (envType === 'docker') {
        console.log('🐳 Docker 환경 로깅 설정:');
        return {
            level: 'debug',
            format: 'json',
            destination: 'console',
            environment: 'docker',
            containerOptimized: true,
            structured: true
        };
    } else {
        console.log('🏠 로컬 환경 로깅 설정:');
        return {
            level: 'info',
            format: 'pretty',
            destination: 'file',
            environment: 'local',
            file: './logs/development.log',
            colorized: true
        };
    }
}

/**
 * 예시 4: 환경별 분기 실행 - API 요청 설정
 */
export function getApiRequestConfig() {
    return executeInDevEnvironment(
        // Docker 환경에서의 API 설정
        () => {
            console.log('🐳 Docker 환경 API 설정:');
            return {
                timeout: 10000,
                retries: 3,
                baseURL: 'http://localhost:3000',
                headers: {
                    'User-Agent': 'OpenManager-Docker/5.44.0'
                }
            };
        },
        // 로컬 환경에서의 API 설정
        () => {
            console.log('🏠 로컬 환경 API 설정:');
            return {
                timeout: 5000,
                retries: 1,
                baseURL: 'http://localhost:3000',
                headers: {
                    'User-Agent': 'OpenManager-Local/5.44.0'
                }
            };
        }
    );
}

/**
 * 예시 5: 환경 타입 확인
 */
export function displayEnvironmentInfo() {
    const envType = getCurrentEnvironmentType();
    const envConfig = getEnvironmentSpecificConfig();

    console.log('🌍 현재 실행 환경 정보:');
    console.log(`   타입: ${envType}`);

    if (envType === 'docker') {
        console.log('   🐳 Docker 전용 기능들:');
        console.log(`   - 내부 서비스 최적화: ${envConfig?.docker?.internalServiceOptimization}`);
        console.log(`   - 컨테이너 로깅: ${envConfig?.docker?.containerLogging}`);
        console.log(`   - 헬스 체크 간격: ${envConfig?.docker?.healthCheckInterval}ms`);
    } else if (envType === 'local') {
        console.log('   🏠 로컬 전용 기능들:');
        console.log(`   - 외부 서비스 재시도: ${envConfig?.local?.externalServiceRetry}`);
        console.log(`   - 상세 에러 로깅: ${envConfig?.local?.verboseErrorLogging}`);
        console.log(`   - 헬스 체크 간격: ${envConfig?.local?.healthCheckInterval}ms`);
    }
}

/**
 * 예시 6: 환경별 에러 처리
 */
export function handleDatabaseError(error: Error) {
    const envType = getCurrentEnvironmentType();

    if (envType === 'docker') {
        // Docker 환경에서는 구조화된 로깅
        console.error('🐳 Docker DB Error:', {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            container: true
        });
    } else if (envType === 'local') {
        // 로컬 환경에서는 개발자 친화적 에러 표시
        console.error('🏠 로컬 DB 에러:');
        console.error(`   메시지: ${error.message}`);
        console.error('   해결 방법:');
        console.error('   1. PostgreSQL이 실행 중인지 확인');
        console.error('   2. 연결 정보(.env.local)가 올바른지 확인');
        console.error('   3. 또는 DevContainer 사용 고려');
    } else {
        // 프로덕션 환경
        console.error('Production DB Error:', error.message);
    }
}

/**
 * 예시 7: 환경별 개발 도구 URL 제공
 */
export function getDevelopmentUrls() {
    const envInfo = getDevEnvironmentInfo();

    if (envInfo.type === 'docker') {
        return {
            app: 'http://localhost:3000',
            storybook: 'http://localhost:6006',
            adminer: envInfo.tools.adminerUrl,
            redisCommander: envInfo.tools.redisCommanderUrl,
            environment: 'Docker/DevContainer'
        };
    } else {
        return {
            app: 'http://localhost:3000',
            storybook: 'http://localhost:6006',
            adminer: '설치 필요 (https://www.adminer.org/)',
            redisCommander: '설치 필요 (npm install -g redis-commander)',
            environment: '로컬 개발'
        };
    }
}

/**
 * 예시 8: 통합 초기화 함수
 */
export async function initializeApplication() {
    console.log('🚀 애플리케이션을 초기화합니다...');

    // 환경 정보 표시
    displayEnvironmentInfo();

    // 데이터베이스 연결 설정
    const dbConfig = getDatabaseConnection();

    // Redis 연결 설정
    const redisConfig = getRedisConnection();

    // 로깅 설정
    const loggingConfig = setupLogging();

    // API 요청 설정
    const apiConfig = getApiRequestConfig();

    // 개발 도구 URL
    const devUrls = getDevelopmentUrls();

    console.log('✅ 애플리케이션 초기화 완료!');
    console.log('🛠️ 개발 도구 URL:', devUrls);

    return {
        database: dbConfig,
        redis: redisConfig,
        logging: loggingConfig,
        api: apiConfig,
        development: devUrls
    };
}

// 개발 환경에서만 초기화 함수를 자동 실행 (선택사항)
if (process.env.NODE_ENV === 'development' && typeof window === 'undefined') {
    initializeApplication().catch(console.error);
} 