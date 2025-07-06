/**
 * RedisMetricsManager TDD 테스트
 * Phase 1: Redis 실시간 처리 시스템
 * 
 * 🔴 Red 단계: 실패하는 테스트 먼저 작성
 * 🟢 Green 단계: 최소 구현으로 테스트 통과
 * 🔄 Refactor 단계: 성능 최적화 및 기능 확장
 */

import { RedisMetricsManager } from '@/services/redis/RedisMetricsManager';
import { ServerMetric } from '@/types/gcp-data-generator';

// Mock Redis 클라이언트
const mockRedis = {
    setex: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    pipeline: jest.fn(() => ({
        setex: jest.fn(),
        exec: jest.fn()
    })),
    keys: jest.fn(),
    mget: jest.fn(),
    exists: jest.fn(),
    ttl: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn()
};

// 테스트용 모킹 데이터 생성
function generateMockServerMetrics(count: number = 10): ServerMetric[] {
    return Array.from({ length: count }, (_, i) => ({
        timestamp: new Date(),
        serverId: `srv-test-${i + 1}`,
        systemMetrics: {
            cpuUsage: Math.random() * 100,
            memoryUsage: Math.random() * 100,
            diskUsage: Math.random() * 100,
            networkUsage: Math.random() * 100
        },
        applicationMetrics: {
            requestCount: Math.floor(Math.random() * 1000),
            errorRate: Math.random() * 10,
            responseTime: Math.random() * 500
        }
    }));
}

describe('🔴 TDD Red Phase: RedisMetricsManager 실패 테스트', () => {
    let manager: RedisMetricsManager;

    beforeEach(() => {
        jest.clearAllMocks();
        // 아직 구현되지 않은 클래스이므로 의도적으로 실패
        try {
            manager = new RedisMetricsManager(mockRedis as any);
        } catch (error) {
            // 클래스가 존재하지 않으므로 예상된 실패
        }
    });

    test('🔴 FAIL: 실시간 메트릭을 TTL과 함께 Redis에 저장해야 함', async () => {
        const sessionId = 'test-session-001';
        const metrics = generateMockServerMetrics(10);

        // 30분(1800초) TTL로 세션 메트릭 저장
        await manager.saveRealtimeMetrics(sessionId, metrics);

        expect(mockRedis.setex).toHaveBeenCalledWith(
            `session:${sessionId}:current`,
            1800, // 30분 TTL
            JSON.stringify(metrics)
        );
    });

    test('🔴 FAIL: 서버별 최신 메트릭을 개별 키로 저장해야 함', async () => {
        const sessionId = 'test-session-002';
        const metrics = generateMockServerMetrics(3);

        await manager.saveRealtimeMetrics(sessionId, metrics);

        // 각 서버별로 개별 키에 5분(300초) TTL로 저장
        metrics.forEach(metric => {
            expect(mockRedis.setex).toHaveBeenCalledWith(
                `server:${metric.serverId}:latest`,
                300, // 5분 TTL
                JSON.stringify(metric)
            );
        });
    });

    test('🔴 FAIL: Pipeline을 사용한 배치 저장으로 성능 최적화해야 함', async () => {
        const sessionId = 'test-session-003';
        const metrics = generateMockServerMetrics(10);

        const mockPipeline = {
            setex: jest.fn(),
            exec: jest.fn()
        };
        mockRedis.pipeline.mockReturnValue(mockPipeline);

        await manager.saveRealtimeMetrics(sessionId, metrics);

        expect(mockRedis.pipeline).toHaveBeenCalled();
        expect(mockPipeline.exec).toHaveBeenCalled();
    });

    test('🔴 FAIL: 세션 메트릭을 조회할 수 있어야 함', async () => {
        const sessionId = 'test-session-004';
        const mockMetricsData = JSON.stringify(generateMockServerMetrics(5));

        mockRedis.get.mockResolvedValue(mockMetricsData);

        const result = await manager.getRealtimeMetrics(sessionId);

        expect(mockRedis.get).toHaveBeenCalledWith(`session:${sessionId}:current`);
        expect(result).toHaveLength(5);
        expect(result[0]).toHaveProperty('serverId');
        expect(result[0]).toHaveProperty('systemMetrics');
    });

    test('🔴 FAIL: 특정 서버의 최신 메트릭을 조회할 수 있어야 함', async () => {
        const serverId = 'srv-web-01';
        const mockMetricData = JSON.stringify(generateMockServerMetrics(1)[0]);

        mockRedis.get.mockResolvedValue(mockMetricData);

        const result = await manager.getServerLatestMetric(serverId);

        expect(mockRedis.get).toHaveBeenCalledWith(`server:${serverId}:latest`);
        expect(result).toHaveProperty('serverId', serverId);
    });

    test('🔴 FAIL: 활성 세션 목록을 조회할 수 있어야 함', async () => {
        const mockSessionKeys = [
            'session:session-001:current',
            'session:session-002:current',
            'session:session-003:current'
        ];

        mockRedis.keys.mockResolvedValue(mockSessionKeys);

        const result = await manager.getActiveSessions();

        expect(mockRedis.keys).toHaveBeenCalledWith('session:*:current');
        expect(result).toEqual(['session-001', 'session-002', 'session-003']);
    });

    test('🔴 FAIL: 세션 메트릭을 삭제할 수 있어야 함', async () => {
        const sessionId = 'test-session-005';

        await manager.deleteSessionMetrics(sessionId);

        expect(mockRedis.del).toHaveBeenCalledWith(`session:${sessionId}:current`);
    });

    test('🔴 FAIL: 메트릭 통계를 실시간으로 계산할 수 있어야 함', async () => {
        const sessionId = 'test-session-006';
        const metrics = generateMockServerMetrics(10);

        // 높은 CPU 사용률 시뮬레이션
        metrics.forEach(metric => {
            metric.systemMetrics.cpuUsage = 85 + Math.random() * 10; // 85-95%
        });

        const mockMetricsData = JSON.stringify(metrics);
        mockRedis.get.mockResolvedValue(mockMetricsData);

        const stats = await manager.calculateRealtimeStats(sessionId);

        expect(stats).toHaveProperty('averageCpuUsage');
        expect(stats).toHaveProperty('averageMemoryUsage');
        expect(stats).toHaveProperty('totalServers');
        expect(stats).toHaveProperty('highCpuServers');
        expect(stats.averageCpuUsage).toBeGreaterThan(85);
        expect(stats.highCpuServers).toBeGreaterThan(0);
    });

    test('🔴 FAIL: Redis 메모리 사용량을 모니터링할 수 있어야 함', async () => {
        const sessionId = 'test-session-007';
        const metrics = generateMockServerMetrics(100); // 큰 데이터셋

        const usage = await manager.getMemoryUsage();

        expect(usage).toHaveProperty('usedMemory');
        expect(usage).toHaveProperty('totalMemory');
        expect(usage).toHaveProperty('usagePercentage');
        expect(usage.usagePercentage).toBeLessThan(80); // 256MB 한도의 80% 미만
    });

    test('🔴 FAIL: TTL 만료 전 자동 갱신 기능이 있어야 함', async () => {
        const sessionId = 'test-session-008';

        // TTL이 5분 미만 남은 경우 자동 갱신
        mockRedis.ttl.mockResolvedValue(250); // 4분 10초 남음

        await manager.refreshSessionTTL(sessionId);

        expect(mockRedis.expire).toHaveBeenCalledWith(
            `session:${sessionId}:current`,
            1800 // 30분으로 재설정
        );
    });
});

describe('🔵 TDD Refactor Phase: 성능 최적화 테스트', () => {
    test('🔴 FAIL: 대량 메트릭 배치 처리 성능 테스트', async () => {
        const sessionId = 'test-session-performance';
        const largeMetrics = generateMockServerMetrics(1000); // 1000개 서버

        const startTime = Date.now();
        await manager.saveRealtimeMetrics(sessionId, largeMetrics);
        const endTime = Date.now();

        const processingTime = endTime - startTime;
        expect(processingTime).toBeLessThan(1000); // 1초 이내 처리
    });

    test('🔴 FAIL: 메트릭 압축 저장으로 메모리 최적화', async () => {
        const sessionId = 'test-session-compression';
        const metrics = generateMockServerMetrics(10);

        await manager.saveCompressedMetrics(sessionId, metrics);

        // 압축된 데이터가 원본보다 작은지 확인
        const originalSize = JSON.stringify(metrics).length;
        const compressedData = mockRedis.setex.mock.calls[0][2];
        expect(compressedData.length).toBeLessThan(originalSize);
    });
});

describe('🔄 REFACTOR: 성능 최적화 테스트', () => {
    let manager: RedisMetricsManager;

    beforeEach(() => {
        manager = new RedisMetricsManager(mockRedis as any);
    });

    it('대용량 메트릭 처리 성능 테스트', async () => {
        const sessionId = 'large-session-001';
        const largeMetrics = Array.from({ length: 10000 }, (_, i) => generateMockServerMetrics(1)[0]);

        await manager.saveRealtimeMetrics(sessionId, largeMetrics);

        expect(mockRedis.pipeline).toHaveBeenCalled();
        expect(mockRedis.setex).toHaveBeenCalledTimes(10001); // 세션 + 10000 서버
    });

    it('압축된 메트릭 저장 테스트', async () => {
        const sessionId = 'compression-test';
        const metrics = generateMockServerMetrics(10);

        await manager.saveCompressedMetrics(sessionId, metrics);

        expect(mockRedis.setex).toHaveBeenCalledWith(
            `session:${sessionId}:compressed`,
            1800,
            expect.any(String)
        );
    });

    // 대용량 메트릭 저장 테스트
    test('대용량 메트릭 저장 처리', async () => {
        const sessionId = 'large-session-001';
        const largeMetrics = Array.from({ length: 1000 }, (_, i) => ({
            timestamp: new Date(Date.now() + i * 1000),
            serverId: `server-${i % 10}`,
            systemMetrics: {
                cpuUsage: Math.random() * 100,
                memoryUsage: Math.random() * 100,
                diskUsage: Math.random() * 100,
                networkUsage: Math.random() * 100
            },
            applicationMetrics: {
                requestCount: Math.floor(Math.random() * 1000),
                errorRate: Math.random() * 5,
                responseTime: Math.random() * 500
            }
        }));

        const mockManager = new RedisMetricsManager(mockRedis as any);
        await mockManager.saveRealtimeMetrics(sessionId, largeMetrics);

        expect(mockRedis.setex).toHaveBeenCalled();
    });

    test('압축된 메트릭 저장', async () => {
        const sessionId = 'compressed-session-001';
        const metrics = generateMockServerMetrics(10);

        const mockManager = new RedisMetricsManager(mockRedis as any);
        await mockManager.saveCompressedMetrics(sessionId, metrics);

        expect(mockRedis.setex).toHaveBeenCalled();
    });

    // 정리
    afterEach(() => {
        manager.disconnect();
    });
}); 