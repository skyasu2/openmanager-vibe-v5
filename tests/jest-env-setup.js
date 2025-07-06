/**
 * 🔧 Jest 환경변수 모킹 시스템
 * 
 * TypeScript TS2540 (read-only) 오류 해결을 위한 안전한 환경변수 설정
 */

// 원본 환경변수 백업
const originalEnv = { ...process.env };

/**
 * 테스트 환경에서 안전하게 환경변수를 설정하는 함수
 * @param {Object} envVars - 설정할 환경변수 객체
 */
function setTestEnvironment(envVars) {
    Object.keys(envVars).forEach(key => {
        Object.defineProperty(process.env, key, {
            value: String(envVars[key]),
            writable: true,
            configurable: true,
            enumerable: true
        });
    });
}

/**
 * 환경변수를 원본 상태로 복원하는 함수
 */
function restoreEnvironment() {
    // 모든 환경변수 제거
    Object.keys(process.env).forEach(key => {
        delete process.env[key];
    });

    // 원본 환경변수 복원
    Object.keys(originalEnv).forEach(key => {
        Object.defineProperty(process.env, key, {
            value: originalEnv[key],
            writable: true,
            configurable: true,
            enumerable: true
        });
    });
}

/**
 * 기본 테스트 환경변수 설정
 */
function setupDefaultTestEnvironment() {
    setTestEnvironment({
        NODE_ENV: 'test',
        ENABLE_MOCK_DATA: 'true',
        DISABLE_EXTERNAL_CALLS: 'true',
        REDIS_CONNECTION_DISABLED: 'true',
        UPSTASH_REDIS_DISABLED: 'true',
        DISABLE_HEALTH_CHECK: 'true',
        HEALTH_CHECK_CONTEXT: 'false',
        GOOGLE_AI_QUOTA_PROTECTION: 'true',
        FORCE_MOCK_GOOGLE_AI: 'true',
        MCP_SERVER_ENABLED: 'false'
    });
}

// Jest 전역 설정
global.setTestEnvironment = setTestEnvironment;
global.restoreEnvironment = restoreEnvironment;
global.setupDefaultTestEnvironment = setupDefaultTestEnvironment;

// Jest stubGlobal 호환성
global.stubGlobal = function (name, value) {
    if (name.startsWith('process.env.')) {
        const envKey = name.replace('process.env.', '');
        setTestEnvironment({ [envKey]: value });
    } else {
        global[name] = value;
    }
};

// 테스트 시작 시 기본 환경 설정
setupDefaultTestEnvironment();

// 각 테스트 후 정리
afterEach(() => {
    // 테스트별 환경변수 변경사항 유지하되, 기본값은 보장
    if (!process.env.NODE_ENV) {
        setTestEnvironment({ NODE_ENV: 'test' });
    }
});

// 모든 테스트 완료 후 원본 환경 복원
afterAll(() => {
    restoreEnvironment();
});

module.exports = {
    setTestEnvironment,
    restoreEnvironment,
    setupDefaultTestEnvironment
}; 