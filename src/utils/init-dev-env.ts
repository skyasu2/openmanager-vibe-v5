/**
 * 🚀 OpenManager Vibe v5 개발 환경 초기화 스크립트
 * 
 * 애플리케이션 시작 시 환경을 감지하고 설정을 적용합니다.
 * layout.tsx에서 import되어 자동으로 실행됩니다.
 */

import {
    initializeDevEnvironment,
    performEnvironmentHealthCheck,
    getDevEnvironment,
    runInEnvironment
} from './dev-env';

/**
 * 개발 환경 초기화 함수
 * Next.js 앱 시작 시 자동으로 실행됩니다.
 */
async function initializeDevelopmentEnvironment(): Promise<void> {
    try {
        // 개발 환경에서만 실행 (프로덕션에서는 스킵)
        if (process.env.NODE_ENV === 'production') {
            return;
        }

        console.log('🔧 개발 환경 초기화를 시작합니다...');

        // 1. 환경 감지 및 설정 로드
        const devConfig = initializeDevEnvironment();

        // 2. 환경별 특화 설정 적용
        runInEnvironment(
            // Docker 환경 설정
            () => {
                console.log('🐳 Docker 개발 환경 특화 설정을 적용합니다...');

                // Docker 환경에서만 활성화할 기능들
                if (typeof window === 'undefined') { // 서버 사이드에서만 실행
                    setupDockerSpecificFeatures();
                }
            },
            // 로컬 환경 설정
            () => {
                console.log('🏠 로컬 개발 환경 특화 설정을 적용합니다...');

                // 로컬 환경에서만 활성화할 기능들
                if (typeof window === 'undefined') { // 서버 사이드에서만 실행
                    setupLocalSpecificFeatures();
                }
            }
        );

        // 3. 개발 도구 및 헬스 체크 (서버 사이드에서만)
        if (typeof window === 'undefined') {
            await performDevelopmentHealthCheck(devConfig);
        }

        console.log('✅ 개발 환경 초기화가 완료되었습니다!');

    } catch (error) {
        console.error('❌ 개발 환경 초기화 중 오류가 발생했습니다:', error);

        // 오류가 발생해도 앱 실행을 중단하지 않음
        console.log('⚠️ 개발 환경 오류를 무시하고 앱을 계속 실행합니다...');
    }
}

/**
 * Docker 환경 특화 기능 설정
 */
function setupDockerSpecificFeatures(): void {
    console.log('🔧 Docker 전용 기능들을 활성화합니다...');

    // Docker 환경에서만 필요한 설정들
    const dockerFeatures = {
        // 내부 서비스 연결 최적화
        internalServiceOptimization: true,

        // 컨테이너 전용 로깅
        containerLogging: true,

        // DevContainer 전용 디버깅
        devContainerDebugging: true,

        // 자동 헬스 체크 간격 (더 자주)
        healthCheckInterval: 30000, // 30초
    };

    // 전역 객체에 Docker 설정 저장
    if (typeof global !== 'undefined') {
        (global as any).__OPENMANAGER_DOCKER_CONFIG__ = dockerFeatures;
    }

    console.log('✅ Docker 전용 기능 활성화 완료');
}

/**
 * 로컬 환경 특화 기능 설정
 */
function setupLocalSpecificFeatures(): void {
    console.log('🔧 로컬 전용 기능들을 활성화합니다...');

    // 로컬 환경에서만 필요한 설정들
    const localFeatures = {
        // 외부 서비스 연결 재시도 로직
        externalServiceRetry: true,

        // 로컬 DB 연결 최적화
        localDatabaseOptimization: true,

        // 개발자 친화적 에러 표시
        verboseErrorLogging: true,

        // 자동 헬스 체크 간격 (덜 자주)
        healthCheckInterval: 60000, // 60초
    };

    // 전역 객체에 로컬 설정 저장
    if (typeof global !== 'undefined') {
        (global as any).__OPENMANAGER_LOCAL_CONFIG__ = localFeatures;
    }

    console.log('✅ 로컬 전용 기능 활성화 완료');
}

/**
 * 개발 환경 헬스 체크 수행
 */
async function performDevelopmentHealthCheck(devConfig: any): Promise<void> {
    console.log('🔍 개발 환경 헬스 체크를 수행합니다...');

    try {
        // 비동기 헬스 체크 수행
        const healthResults = await performEnvironmentHealthCheck(devConfig);

        if (healthResults.overall) {
            console.log('🎉 모든 개발 서비스가 정상적으로 연결되었습니다!');
        } else {
            console.log('⚠️ 일부 서비스 연결에 문제가 있습니다:');

            if (!healthResults.database) {
                console.log('  ❌ 데이터베이스 연결 실패');
            }

            if (!healthResults.redis) {
                console.log('  ❌ Redis 연결 실패');
            }

            console.log('💡 서비스 연결 문제는 개발 진행에 영향을 주지 않을 수 있습니다.');
        }

    } catch (error) {
        console.log('⚠️ 헬스 체크 수행 중 오류가 발생했지만 무시합니다:', error);
    }
}

/**
 * 개발 환경 정보를 가져오는 헬퍼 함수 (전역 사용)
 */
export function getDevEnvironmentInfo() {
    return getDevEnvironment();
}

/**
 * 환경별 분기 실행 헬퍼 함수 (전역 사용)
 */
export function executeInDevEnvironment<T>(
    dockerFn: () => T,
    localFn: () => T
): T {
    return runInEnvironment(dockerFn, localFn);
}

/**
 * 현재 실행 환경 타입을 반환하는 함수
 */
export function getCurrentEnvironmentType(): 'docker' | 'local' | 'production' {
    if (process.env.NODE_ENV === 'production') {
        return 'production';
    }

    const devConfig = getDevEnvironment();
    return devConfig.type;
}

/**
 * 개발 환경별 설정을 가져오는 함수
 */
export function getEnvironmentSpecificConfig() {
    if (typeof global !== 'undefined') {
        const dockerConfig = (global as any).__OPENMANAGER_DOCKER_CONFIG__;
        const localConfig = (global as any).__OPENMANAGER_LOCAL_CONFIG__;

        return {
            docker: dockerConfig || null,
            local: localConfig || null,
            current: getCurrentEnvironmentType()
        };
    }

    return null;
}

// Next.js 서버 사이드에서 자동 실행
if (typeof window === 'undefined' && process.env.NODE_ENV === 'development') {
    // 비동기 초기화를 즉시 실행 (await 없이)
    initializeDevelopmentEnvironment().catch((error) => {
        console.error('개발 환경 초기화 실패:', error);
    });
}

// 클라이언트 사이드에서는 환경 정보만 출력
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('🌐 클라이언트 사이드 개발 환경 정보:');
    console.log('환경 타입:', getCurrentEnvironmentType());
}

export default initializeDevelopmentEnvironment; 