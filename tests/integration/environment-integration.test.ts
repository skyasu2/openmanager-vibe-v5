/**
 * 🔗 환경별 통합 테스트
 * 
 * 실제 환경에서의 시스템 동작 검증
 */

import { detectEnvironment } from '@/config/environment';
import { RealServerDataGenerator } from '@/services/data-generator/RealServerDataGenerator';
import { GCPRealDataService } from '@/services/gcp/GCPRealDataService';

// 🔧 환경변수 안전 모킹 함수
function setTestEnv(envVars: Record<string, string | undefined>) {
    Object.keys(envVars).forEach(key => {
        if (envVars[key] === undefined) {
            delete process.env[key];
        } else {
            Object.defineProperty(process.env, key, {
                value: envVars[key],
                writable: true,
                configurable: true,
                enumerable: true
            });
        }
    });
}

describe('환경별 통합 테스트', () => {
    beforeEach(() => {
        // 테스트 전 기본 환경 설정
        setTestEnv({
            NODE_ENV: 'test',
            ENABLE_MOCK_DATA: 'true',
            DISABLE_EXTERNAL_CALLS: 'true'
        });
    });

    describe('로컬 개발 환경 통합 테스트', () => {
        beforeEach(() => {
            setTestEnv({
                NODE_ENV: 'development',
                VERCEL: undefined,
                RENDER: undefined
            });
        });

        test('로컬 환경에서 목업 데이터 생성기 정상 동작', async () => {
            const generator = RealServerDataGenerator.getInstance();
            await generator.initialize();

            const servers = await generator.getAllServers();

            expect(servers).toBeDefined();
            expect(Array.isArray(servers)).toBe(true);
            expect(servers.length).toBeGreaterThan(0);

            // 목업 데이터 특성 검증
            const firstServer = servers[0];
            expect(firstServer).toHaveProperty('id');
            expect(firstServer).toHaveProperty('name');
            expect(firstServer).toHaveProperty('status');
            expect(firstServer).toHaveProperty('cpu');
            expect(firstServer).toHaveProperty('memory');
        });

        test('로컬 환경에서 대시보드 요약 데이터 생성', async () => {
            const generator = RealServerDataGenerator.getInstance();
            await generator.initialize();

            const summary = await generator.getDashboardSummary();

            expect(summary).toBeDefined();
            expect(summary).toHaveProperty('totalServers');
            expect(summary).toHaveProperty('healthyServers');
            expect(summary).toHaveProperty('warningServers');
            expect(summary).toHaveProperty('criticalServers');
            expect(typeof summary.totalServers).toBe('number');
        });

        test('로컬 환경에서 서버 메트릭 조회', async () => {
            const generator = RealServerDataGenerator.getInstance();
            await generator.initialize();

            const metrics = await generator.getMetrics();

            expect(metrics).toBeDefined();
            expect(Array.isArray(metrics)).toBe(true);

            if (metrics.length > 0) {
                const firstMetric = metrics[0];
                expect(firstMetric).toHaveProperty('cpu_usage');
                expect(firstMetric).toHaveProperty('memory_usage');
                expect(firstMetric).toHaveProperty('disk_usage');
            }
        });
    });

    describe('Vercel 환경 통합 테스트', () => {
        beforeEach(() => {
            setTestEnv({
                VERCEL: '1',
                NODE_ENV: 'production',
                VERCEL_ENV: 'production'
            });
        });

        test('Vercel 환경에서 GCP 데이터 서비스 초기화', async () => {
            const gcpService = GCPRealDataService.getInstance();

            // Vercel 환경에서는 실제 GCP 연결을 시도하지만,
            // 테스트에서는 목업으로 처리
            expect(gcpService).toBeDefined();
            expect(typeof gcpService.initialize).toBe('function');
        });

        test('Vercel 환경에서 메모리 제한 확인', () => {
            const env = detectEnvironment();

            expect(env.IS_VERCEL).toBe(true);
            expect(env.IS_PRODUCTION).toBe(true);
            expect(env.performance.maxMemory).toBe(1024);
            expect(env.performance.timeout).toBe(25000);
            expect(env.features.enableWebSocket).toBe(false);
        });

        test('Vercel 환경에서 목업 데이터 비활성화 확인', () => {
            const env = detectEnvironment();

            expect(env.features.enableMockData).toBe(false);
            expect(env.platform).toBe('vercel');
        });
    });

    describe('테스트 환경 통합 테스트', () => {
        beforeEach(() => {
            setTestEnv({
                NODE_ENV: 'test',
                REDIS_CONNECTION_DISABLED: 'true',
                UPSTASH_REDIS_DISABLED: 'true',
                DISABLE_HEALTH_CHECK: 'true',
                FORCE_MOCK_GOOGLE_AI: 'true'
            });
        });

        test('테스트 환경에서 외부 연결 차단 확인', () => {
            const env = detectEnvironment();

            expect(env.IS_TEST).toBe(true);
            expect(env.features.enableMockData).toBe(true);
            expect(env.platform).toBe('local');
        });

        test('테스트 환경에서 Redis 연결 비활성화', () => {
            expect(process.env.REDIS_CONNECTION_DISABLED).toBe('true');
            expect(process.env.UPSTASH_REDIS_DISABLED).toBe('true');
        });

        test('테스트 환경에서 Google AI 목업 활성화', () => {
            expect(process.env.FORCE_MOCK_GOOGLE_AI).toBe('true');
        });
    });

    describe('환경 전환 테스트', () => {
        test('개발 환경에서 프로덕션 환경으로 전환', () => {
            // 개발 환경 설정
            setTestEnv({
                NODE_ENV: 'development',
                VERCEL: undefined
            });

            const devEnv = detectEnvironment();
            expect(devEnv.IS_LOCAL).toBe(true);
            expect(devEnv.features.enableMockData).toBe(true);

            // 프로덕션 환경으로 전환
            setTestEnv({
                NODE_ENV: 'production',
                VERCEL: '1'
            });

            const prodEnv = detectEnvironment();
            expect(prodEnv.IS_VERCEL).toBe(true);
            expect(prodEnv.features.enableMockData).toBe(false);
        });

        test('환경 전환 시 설정 일관성 확인', () => {
            const environments = [
                { NODE_ENV: 'development', VERCEL: undefined },
                { NODE_ENV: 'production', VERCEL: '1' },
                { NODE_ENV: 'test', VERCEL: undefined }
            ];

            environments.forEach(envVars => {
                setTestEnv(envVars);

                const env = detectEnvironment();

                // 각 환경에서 필수 속성 존재 확인
                expect(env).toHaveProperty('IS_LOCAL');
                expect(env).toHaveProperty('IS_VERCEL');
                expect(env).toHaveProperty('IS_PRODUCTION');
                expect(env).toHaveProperty('ENABLE_MOCK_DATA');
                expect(env).toHaveProperty('DATA_SOURCE');
            });
        });
    });

    describe('환경별 API 응답 테스트', () => {
        test('로컬 환경에서 서버 API 응답 구조', async () => {
            setTestEnv({ NODE_ENV: 'development' });

            const generator = RealServerDataGenerator.getInstance();
            await generator.initialize();

            const servers = await generator.getAllServers();

            // API 응답 구조 검증
            expect(servers).toBeDefined();
            expect(Array.isArray(servers)).toBe(true);

            if (servers.length > 0) {
                const server = servers[0];
                expect(server).toHaveProperty('id');
                expect(server).toHaveProperty('name');
                expect(server).toHaveProperty('status');
                expect(typeof server.id).toBe('string');
                expect(typeof server.name).toBe('string');
            }
        });

        test('환경별 에러 응답 일관성', async () => {
            const testCases = [
                { NODE_ENV: 'development', expectMockData: true },
                { NODE_ENV: 'production', VERCEL: '1', expectMockData: false },
                { NODE_ENV: 'test', expectMockData: true }
            ];

            for (const testCase of testCases) {
                // 환경 설정
                const { expectMockData, ...envVars } = testCase;
                setTestEnv(envVars);

                const env = detectEnvironment();
                expect(env.ENABLE_MOCK_DATA).toBe(expectMockData);
            }
        });
    });

    describe('성능 테스트', () => {
        test('로컬 환경에서 서버 데이터 생성 성능', async () => {
            setTestEnv({ NODE_ENV: 'development' });

            const generator = RealServerDataGenerator.getInstance();
            await generator.initialize();

            const startTime = Date.now();
            const servers = await generator.getAllServers();
            const endTime = Date.now();

            const duration = endTime - startTime;

            expect(servers.length).toBeGreaterThan(0);
            expect(duration).toBeLessThan(5000); // 5초 이내
        });

        test('환경 감지 함수 성능', () => {
            const iterations = 1000;
            const startTime = Date.now();

            for (let i = 0; i < iterations; i++) {
                detectEnvironment();
            }

            const endTime = Date.now();
            const duration = endTime - startTime;
            const avgDuration = duration / iterations;

            expect(avgDuration).toBeLessThan(1); // 평균 1ms 이내
        });
    });

    describe('메모리 사용량 테스트', () => {
        test('환경별 메모리 사용량 모니터링', async () => {
            const initialMemory = process.memoryUsage();

            setTestEnv({ NODE_ENV: 'development' });
            const generator = RealServerDataGenerator.getInstance();
            await generator.initialize();
            await generator.getAllServers();

            const finalMemory = process.memoryUsage();
            const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

            // 메모리 증가량이 합리적인 범위 내인지 확인 (100MB 이하)
            expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
        });
    });
}); 