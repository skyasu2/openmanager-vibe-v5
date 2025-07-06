/**
 * 🌍 환경 감지 로직 테스트
 * 
 * 개발, 배포, 테스트 환경 구분 로직 검증
 */

import { detectEnvironment, logEnvironmentStatus, validateEnvironmentConfig } from '@/config/environment';

describe('환경 감지 로직', () => {
    let originalEnv: NodeJS.ProcessEnv;

    beforeEach(() => {
        originalEnv = { ...process.env };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe('로컬 개발 환경 감지', () => {
        test('NODE_ENV=development일 때 로컬 환경으로 감지', () => {
            process.env.NODE_ENV = 'development';
            delete process.env.VERCEL;
            delete process.env.RENDER;

            const env = detectEnvironment();

            expect(env.IS_LOCAL).toBe(true);
            expect(env.IS_VERCEL).toBe(false);
            expect(env.IS_RENDER).toBe(false);
            expect(env.IS_PRODUCTION).toBe(false);
        });

        test('로컬 환경에서 올바른 설정 반환', () => {
            process.env.NODE_ENV = 'development';

            const env = detectEnvironment();

            expect(env.ENABLE_MOCK_DATA).toBe(true);
            expect(env.ENABLE_DEBUG_LOGGING).toBe(true);
            expect(env.MEMORY_LIMIT_MB).toBe(undefined);
            expect(env.TIMEOUT_MS).toBe(undefined);
        });
    });

    describe('Vercel 배포 환경 감지', () => {
        test('VERCEL=1일 때 Vercel 환경으로 감지', () => {
            process.env.VERCEL = '1';
            process.env.NODE_ENV = 'production';

            const env = detectEnvironment();

            expect(env.IS_VERCEL).toBe(true);
            expect(env.IS_LOCAL).toBe(false);
            expect(env.IS_RENDER).toBe(false);
            expect(env.IS_PRODUCTION).toBe(true);
        });

        test('Vercel 환경에서 제한된 설정 반환', () => {
            process.env.VERCEL = '1';
            process.env.VERCEL_ENV = 'production';

            const env = detectEnvironment();

            expect(env.ENABLE_MOCK_DATA).toBe(false);
            expect(env.MEMORY_LIMIT_MB).toBe(1024);
            expect(env.TIMEOUT_MS).toBe(30000);
            expect(env.DISABLE_WEBSOCKET).toBe(true);
        });
    });

    describe('Render 배포 환경 감지', () => {
        test('RENDER=true일 때 Render 환경으로 감지', () => {
            process.env.RENDER = 'true';
            process.env.NODE_ENV = 'production';

            const env = detectEnvironment();

            expect(env.IS_RENDER).toBe(true);
            expect(env.IS_VERCEL).toBe(false);
            expect(env.IS_LOCAL).toBe(false);
        });
    });

    describe('테스트 환경 감지', () => {
        test('NODE_ENV=test일 때 테스트 환경으로 감지', () => {
            process.env.NODE_ENV = 'test';

            const env = detectEnvironment();

            expect(env.IS_TEST).toBe(true);
            expect(env.ENABLE_MOCK_DATA).toBe(true);
            expect(env.DISABLE_EXTERNAL_CALLS).toBe(true);
        });
    });

    describe('환경 설정 검증', () => {
        test('필수 환경변수 누락 시 검증 실패', () => {
            delete process.env.NODE_ENV;

            const validation = validateEnvironmentConfig();

            expect(validation.isValid).toBe(false);
            expect(validation.errors).toContain('NODE_ENV가 설정되지 않았습니다');
        });

        test('Vercel 환경에서 필수 환경변수 검증', () => {
            process.env.VERCEL = '1';
            process.env.NODE_ENV = 'production';
            delete process.env.SUPABASE_URL;

            const validation = validateEnvironmentConfig();

            expect(validation.isValid).toBe(false);
            expect(validation.errors.some(error =>
                error.includes('SUPABASE_URL')
            )).toBe(true);
        });

        test('모든 환경변수가 올바르게 설정된 경우 검증 성공', () => {
            process.env.NODE_ENV = 'development';
            process.env.SUPABASE_URL = 'https://test.supabase.co';
            process.env.SUPABASE_ANON_KEY = 'test-key';

            const validation = validateEnvironmentConfig();

            expect(validation.isValid).toBe(true);
            expect(validation.errors).toHaveLength(0);
        });
    });

    describe('환경 로깅', () => {
        test('환경 상태 로깅 함수 동작 확인', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            process.env.NODE_ENV = 'development';
            logEnvironmentStatus();

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('🏠 로컬 개발환경')
            );

            consoleSpy.mockRestore();
        });
    });

    describe('환경별 기능 토글', () => {
        test('로컬 환경에서 모든 기능 활성화', () => {
            process.env.NODE_ENV = 'development';

            const env = detectEnvironment();

            expect(env.ENABLE_MOCK_DATA).toBe(true);
            expect(env.ENABLE_DEBUG_LOGGING).toBe(true);
            expect(env.DISABLE_EXTERNAL_CALLS).toBe(false);
        });

        test('프로덕션 환경에서 보안 기능 활성화', () => {
            process.env.NODE_ENV = 'production';
            process.env.VERCEL = '1';

            const env = detectEnvironment();

            expect(env.ENABLE_MOCK_DATA).toBe(false);
            expect(env.ENABLE_DEBUG_LOGGING).toBe(false);
            expect(env.IS_PRODUCTION).toBe(true);
        });

        test('테스트 환경에서 외부 호출 차단', () => {
            process.env.NODE_ENV = 'test';

            const env = detectEnvironment();

            expect(env.DISABLE_EXTERNAL_CALLS).toBe(true);
            expect(env.ENABLE_MOCK_DATA).toBe(true);
        });
    });

    describe('환경별 데이터 소스 선택', () => {
        test('로컬 환경에서 목업 데이터 사용', () => {
            process.env.NODE_ENV = 'development';

            const env = detectEnvironment();

            expect(env.DATA_SOURCE).toBe('mock');
            expect(env.ENABLE_MOCK_DATA).toBe(true);
        });

        test('Vercel 환경에서 GCP 실제 데이터 사용', () => {
            process.env.VERCEL = '1';
            process.env.NODE_ENV = 'production';

            const env = detectEnvironment();

            expect(env.DATA_SOURCE).toBe('gcp');
            expect(env.ENABLE_MOCK_DATA).toBe(false);
        });
    });

    describe('에러 처리', () => {
        test('잘못된 환경 설정에 대한 에러 처리', () => {
            process.env.NODE_ENV = 'invalid_env';

            expect(() => {
                const validation = validateEnvironmentConfig();
                if (!validation.isValid) {
                    throw new Error(validation.errors.join(', '));
                }
            }).toThrow();
        });

        test('환경 감지 함수의 안전한 실행', () => {
            delete process.env.NODE_ENV;

            expect(() => detectEnvironment()).not.toThrow();
        });
    });
}); 