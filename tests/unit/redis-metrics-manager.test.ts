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
import { beforeEach, describe, expect, test, vi } from 'vitest';

// Mock Redis 클라이언트
const mockRedis = {
    setex: vi.fn(),
    get: vi.fn(),
    del: vi.fn(),
    pipeline: vi.fn(() => ({
        setex: vi.fn(),
        exec: vi.fn()
    })),
    keys: vi.fn(),
    mget: vi.fn(),
    exists: vi.fn(),
    ttl: vi.fn(),
    incr: vi.fn(),
    expire: vi.fn()
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

describe('🟢 TDD Green Phase: RedisMetricsManager 기본 구현', () => {
    let manager: RedisMetricsManager;

    beforeEach(() => {
        vi.clearAllMocks();
        manager = new RedisMetricsManager(mockRedis as any);
    });

    test('🟢 PASS: RedisMetricsManager 인스턴스가 생성되어야 함', () => {
        expect(manager).toBeDefined();
        expect(manager).toBeInstanceOf(RedisMetricsManager);
    });

    test('🟢 PASS: 실시간 메트릭을 TTL과 함께 Redis에 저장해야 함', async () => {
        const sessionId = 'test-session-001';
        const metrics = generateMockServerMetrics(3);

        const mockPipeline = {
            setex: vi.fn(),
            exec: vi.fn()
        };
        mockRedis.pipeline.mockReturnValue(mockPipeline);

        await manager.saveRealtimeMetrics(sessionId, metrics);

        expect(mockRedis.pipeline).toHaveBeenCalled();
        expect(mockPipeline.exec).toHaveBeenCalled();
    });

    test('🟢 PASS: 세션 메트릭을 조회할 수 있어야 함', async () => {
        const sessionId = 'test-session-002';
        const mockMetrics = generateMockServerMetrics(5);
        const mockMetricsData = JSON.stringify(mockMetrics);

        mockRedis.get.mockResolvedValue(mockMetricsData);

        const result = await manager.getRealtimeMetrics(sessionId);

        expect(mockRedis.get).toHaveBeenCalledWith(`session:${sessionId}:current`);
        expect(result).toHaveLength(5);
        expect(result[0]).toHaveProperty('serverId');
        expect(result[0]).toHaveProperty('systemMetrics');
    });

    test('🟢 PASS: 특정 서버의 최신 메트릭을 조회할 수 있어야 함', async () => {
        const serverId = 'srv-web-01';
        const mockMetric = generateMockServerMetrics(1)[0];
        mockMetric.serverId = serverId;
        const mockMetricData = JSON.stringify(mockMetric);

        mockRedis.get.mockResolvedValue(mockMetricData);

        const result = await manager.getServerLatestMetric(serverId);

        expect(mockRedis.get).toHaveBeenCalledWith(`server:${serverId}:latest`);
        expect(result).toHaveProperty('serverId', serverId);
    });

    test('🟢 PASS: 활성 세션 목록을 조회할 수 있어야 함', async () => {
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

    test('🟢 PASS: 세션 메트릭을 삭제할 수 있어야 함', async () => {
        const sessionId = 'test-session-005';

        await manager.deleteSessionMetrics(sessionId);

        expect(mockRedis.del).toHaveBeenCalledWith(`session:${sessionId}:current`);
    });

    test('🟢 PASS: 메트릭 통계를 실시간으로 계산할 수 있어야 함', async () => {
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
        expect(stats.totalServers).toBe(10);
    });

    test('🟢 PASS: Redis 메모리 사용량을 모니터링할 수 있어야 함', async () => {
        const usage = await manager.getMemoryUsage();

        expect(usage).toHaveProperty('usedMemory');
        expect(usage).toHaveProperty('totalMemory');
        expect(usage).toHaveProperty('usagePercentage');
        expect(usage.usagePercentage).toBeLessThan(100);
        expect(usage.totalMemory).toBe(256 * 1024 * 1024); // 256MB
    });

    test('🟢 PASS: TTL 만료 전 자동 갱신 기능이 있어야 함', async () => {
        const sessionId = 'test-session-008';

        // TTL이 5분 미만 남은 경우 시뮬레이션
        mockRedis.ttl.mockResolvedValue(250); // 4분 10초 남음

        await manager.refreshSessionTTL(sessionId);

        expect(mockRedis.expire).toHaveBeenCalledWith(
            `session:${sessionId}:current`,
            1800 // 30분으로 재설정
        );
    });

    test('🟢 PASS: 빈 세션에 대해 기본 통계를 반환해야 함', async () => {
        const sessionId = 'empty-session';

        mockRedis.get.mockResolvedValue(null);

        const stats = await manager.calculateRealtimeStats(sessionId);

        expect(stats.totalServers).toBe(0);
        expect(stats.averageCpuUsage).toBe(0);
        expect(stats.highCpuServers).toBe(0);
    });

    test('🟢 PASS: 존재하지 않는 서버 메트릭 조회 시 null 반환', async () => {
        const serverId = 'non-existent-server';

        mockRedis.get.mockResolvedValue(null);

        const result = await manager.getServerLatestMetric(serverId);

        expect(result).toBeNull();
    });
});

describe('🔄 TDD Refactor Phase: 성능 최적화 기능', () => {
    let manager: RedisMetricsManager;

    beforeEach(() => {
        vi.clearAllMocks();
        manager = new RedisMetricsManager(mockRedis as any);
    });

    test('🔄 REFACTOR: 압축된 메트릭 저장으로 메모리 최적화', async () => {
        const sessionId = 'test-session-compression';
        const metrics = generateMockServerMetrics(3);

        await manager.saveCompressedMetrics(sessionId, metrics);

        expect(mockRedis.setex).toHaveBeenCalledWith(
            `session:${sessionId}:compressed`,
            1800,
            expect.any(String)
        );
    });

    test('🔄 REFACTOR: 다중 서버 메트릭 배치 조회', async () => {
        const serverIds = ['srv-01', 'srv-02', 'srv-03'];
        const mockResults = [
            JSON.stringify(generateMockServerMetrics(1)[0]),
            null,
            JSON.stringify(generateMockServerMetrics(1)[0])
        ];

        mockRedis.mget.mockResolvedValue(mockResults);

        const results = await manager.getMultipleServerLatestMetrics(serverIds);

        expect(mockRedis.mget).toHaveBeenCalledWith(
            'server:srv-01:latest',
            'server:srv-02:latest',
            'server:srv-03:latest'
        );
        expect(results).toHaveLength(3);
        expect(results[0]).not.toBeNull();
        expect(results[1]).toBeNull();
        expect(results[2]).not.toBeNull();
    });

    test('🔄 REFACTOR: 비활성 세션 정리 기능', async () => {
        const mockSessionKeys = [
            'session:active-session:current',
            'session:expired-session:current'
        ];

        mockRedis.keys.mockResolvedValue(mockSessionKeys);
        mockRedis.ttl.mockResolvedValueOnce(500); // 활성 세션
        mockRedis.ttl.mockResolvedValueOnce(-1);  // 만료된 세션

        const cleanedSessions = await manager.cleanupInactiveSessions();

        expect(mockRedis.del).toHaveBeenCalledWith('session:expired-session:current');
        expect(cleanedSessions).toContain('expired-session');
        expect(cleanedSessions).not.toContain('active-session');
    });
}); 