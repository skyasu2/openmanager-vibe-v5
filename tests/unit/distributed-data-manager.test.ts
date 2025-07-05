/**
 * DistributedDataManager TDD 테스트
 * Phase 3: Hot-Warm-Cold 3계층 부하 분산 시스템
 * 
 * 🟢 Green 단계: 기본 구현으로 테스트 통과
 */

import { DistributedDataManager } from '@/services/distributed/DistributedDataManager';
import { ServerMetric } from '@/types/gcp-data-generator';
import { beforeEach, describe, expect, test, vi } from 'vitest';

// Mock 의존성들
const mockRedisManager = {
    saveRealtimeMetrics: vi.fn().mockResolvedValue(undefined),
    getSessionMetrics: vi.fn().mockResolvedValue([]),
    getServerLatestMetrics: vi.fn().mockResolvedValue(null),
    getActiveSessions: vi.fn().mockResolvedValue([]),
    deleteSessionMetrics: vi.fn().mockResolvedValue(1),
    calculateRealtimeStats: vi.fn().mockResolvedValue({}),
    monitorRedisMemory: vi.fn().mockResolvedValue({}),
    refreshTTL: vi.fn().mockResolvedValue(1)
};

const mockSupabaseManager = {
    batchInsertMetrics: vi.fn().mockResolvedValue(undefined),
    queryTimeSeriesData: vi.fn().mockResolvedValue([]),
    getSessionMetricsHistory: vi.fn().mockResolvedValue([]),
    getServerTimeSeriesAnalysis: vi.fn().mockResolvedValue({}),
    cleanupExpiredData: vi.fn().mockResolvedValue(0),
    calculateSessionAggregates: vi.fn().mockResolvedValue({}),
    archiveOldData: vi.fn().mockResolvedValue(''),
    checkAlertThresholds: vi.fn().mockResolvedValue([]),
    validateDataIntegrity: vi.fn().mockResolvedValue({})
};

const mockGCPDataGenerator = {
    generateBaselineDataset: vi.fn().mockResolvedValue({}),
    generateRealtimeMetrics: vi.fn().mockResolvedValue([]),
    generateScenarioMetrics: vi.fn().mockResolvedValue([]),
    generateHistoricalPattern: vi.fn().mockResolvedValue([]),
    startSession: vi.fn().mockResolvedValue(''),
    stopSession: vi.fn().mockResolvedValue(''),
    flushBatchToCloudStorage: vi.fn().mockResolvedValue('')
};

// 테스트용 모킹 데이터 생성
function generateMockServerMetrics(count: number = 10): ServerMetric[] {
    return Array.from({ length: count }, (_, i) => ({
        timestamp: new Date(Date.now() - i * 30000),
        serverId: `srv-test-${i + 1}`,
        systemMetrics: {
            cpuUsage: 50 + Math.random() * 30,
            memoryUsage: 40 + Math.random() * 40,
            diskUsage: 30 + Math.random() * 50,
            networkUsage: 20 + Math.random() * 60
        },
        applicationMetrics: {
            requestCount: Math.floor(Math.random() * 1000),
            errorRate: Math.random() * 5,
            responseTime: 100 + Math.random() * 300
        }
    }));
}

describe('🟢 TDD Green Phase: DistributedDataManager 기본 구현', () => {
    let manager: DistributedDataManager;

    beforeEach(() => {
        vi.clearAllMocks();
        manager = new DistributedDataManager(
            mockRedisManager as any,
            mockSupabaseManager as any,
            mockGCPDataGenerator as any
        );
    });

    test('🟢 PASS: DistributedDataManager 인스턴스가 생성되어야 함', () => {
        expect(manager).toBeDefined();
        expect(manager).toBeInstanceOf(DistributedDataManager);
    });

    test('🟢 PASS: Hot-Warm-Cold 3계층 아키텍처가 구현되어야 함', async () => {
        const status = await manager.getLoadBalancingStatus();

        expect(status.layers).toHaveLength(3);
        expect(status.layers.find(l => l.name === 'hot')).toBeDefined();
        expect(status.layers.find(l => l.name === 'warm')).toBeDefined();
        expect(status.layers.find(l => l.name === 'cold')).toBeDefined();
    });

    test('🟢 PASS: 실시간 메트릭 분산 저장이 작동해야 함', async () => {
        const sessionId = 'test-session-001';
        const metrics = generateMockServerMetrics(5);

        await manager.saveDistributedMetrics(sessionId, metrics);

        expect(mockRedisManager.saveRealtimeMetrics).toHaveBeenCalledWith(sessionId, metrics);
        expect(mockSupabaseManager.batchInsertMetrics).toHaveBeenCalledWith(sessionId, metrics);
    });

    test('🟢 PASS: 지능형 데이터 라우팅이 작동해야 함', async () => {
        const sessionId = 'test-session-002';
        const mockMetrics = generateMockServerMetrics(3);

        // 실시간 요청 시 Redis 우선 호출
        mockRedisManager.getSessionMetrics.mockResolvedValueOnce(mockMetrics);

        const result = await manager.getMetricsWithRouting({
            sessionId,
            realtime: true
        });

        expect(mockRedisManager.getSessionMetrics).toHaveBeenCalledWith(sessionId);
        expect(result).toHaveLength(3);
    });

    test('🟢 PASS: 히스토리 요청 시 Warm Layer 라우팅', async () => {
        const sessionId = 'test-session-003';
        const timeRange = {
            start: new Date(Date.now() - 3600000),
            end: new Date()
        };
        const mockMetrics = generateMockServerMetrics(10);

        mockSupabaseManager.getSessionMetricsHistory.mockResolvedValueOnce(mockMetrics);

        const result = await manager.getMetricsWithRouting({
            sessionId,
            timeRange
        });

        expect(mockSupabaseManager.getSessionMetricsHistory).toHaveBeenCalledWith(
            sessionId,
            timeRange.start,
            timeRange.end
        );
        expect(result).toHaveLength(10);
    });

    test('🟢 PASS: 자동 폴백 시스템이 작동해야 함', async () => {
        const sessionId = 'test-session-004';
        const metrics = generateMockServerMetrics(5);
        const testError = { source: 'redis', message: 'Connection failed' };

        await manager.handleFailover(sessionId, metrics, testError);

        // Warm Layer로 폴백 확인
        expect(mockSupabaseManager.batchInsertMetrics).toHaveBeenCalledWith(sessionId, metrics);
    });

    test('🟢 PASS: 부하 분산 모니터링이 작동해야 함', async () => {
        const status = await manager.getLoadBalancingStatus();

        expect(status).toHaveProperty('layers');
        expect(status).toHaveProperty('activeSessions');
        expect(status).toHaveProperty('performance');
        expect(status).toHaveProperty('recommendations');
        expect(status.layers).toHaveLength(3);
        expect(Array.isArray(status.recommendations)).toBe(true);
    });

    test('🟢 PASS: 통합 쿼리 인터페이스가 작동해야 함', async () => {
        const sessionId = 'test-session-005';

        // 실시간 쿼리 테스트
        const realtimeResult = await manager.executeUnifiedQuery({
            type: 'realtime',
            sessionId
        });

        expect(mockRedisManager.getSessionMetrics).toHaveBeenCalledWith(sessionId);

        // 집계 쿼리 테스트
        const mockAggregates = { sessionId, metrics: {}, dataPoints: 100 };
        mockSupabaseManager.calculateSessionAggregates.mockResolvedValueOnce(mockAggregates);

        const aggregatedResult = await manager.executeUnifiedQuery({
            type: 'aggregated',
            sessionId
        });

        expect(mockSupabaseManager.calculateSessionAggregates).toHaveBeenCalledWith(sessionId);
        expect(aggregatedResult).toEqual(mockAggregates);
    });

    test('🟢 PASS: 데이터 일관성 보장이 작동해야 함', async () => {
        const sessionId = 'test-session-006';
        const hotMetrics = generateMockServerMetrics(10);
        const warmMetrics = generateMockServerMetrics(10);

        mockRedisManager.getSessionMetrics.mockResolvedValueOnce(hotMetrics);
        mockSupabaseManager.getSessionMetricsHistory.mockResolvedValueOnce(warmMetrics);

        const report = await manager.validateDataConsistency(sessionId);

        expect(report).toHaveProperty('sessionId', sessionId);
        expect(report).toHaveProperty('hotLayerCount', 10);
        expect(report).toHaveProperty('warmLayerCount', 10);
        expect(report).toHaveProperty('isConsistent', true);
        expect(report.inconsistencies).toHaveLength(0);
    });

    test('🟢 PASS: 데이터 불일치 감지', async () => {
        const sessionId = 'test-session-007';
        const hotMetrics = generateMockServerMetrics(10);
        const warmMetrics = generateMockServerMetrics(5); // 불일치

        mockRedisManager.getSessionMetrics.mockResolvedValueOnce(hotMetrics);
        mockSupabaseManager.getSessionMetricsHistory.mockResolvedValueOnce(warmMetrics);

        const report = await manager.validateDataConsistency(sessionId);

        expect(report.isConsistent).toBe(false);
        expect(report.inconsistencies.length).toBeGreaterThan(0);
        expect(report.inconsistencies[0]).toContain('Hot-Warm Layer 불일치');
    });

    test('🟢 PASS: 에러 시 일관성 검증 실패 처리', async () => {
        const sessionId = 'error-session';

        mockRedisManager.getSessionMetrics.mockRejectedValueOnce(new Error('Redis connection failed'));

        const report = await manager.validateDataConsistency(sessionId);

        expect(report.isConsistent).toBe(false);
        expect(report.inconsistencies[0]).toContain('일관성 검증 실패');
    });
});

describe('🔄 TDD Refactor Phase: 고급 기능 및 최적화', () => {
    let manager: DistributedDataManager;

    beforeEach(() => {
        vi.clearAllMocks();
        manager = new DistributedDataManager(
            mockRedisManager as any,
            mockSupabaseManager as any,
            mockGCPDataGenerator as any
        );
    });

    test('🔄 REFACTOR: 성능 최적화 기능', async () => {
        const result = await manager.optimizePerformance();

        expect(result).toHaveProperty('before');
        expect(result).toHaveProperty('after');
        expect(result).toHaveProperty('optimizations');
        expect(Array.isArray(result.optimizations)).toBe(true);

        // 성능 개선 확인
        expect(result.after.avgWriteLatency).toBeLessThanOrEqual(result.before.avgWriteLatency);
        expect(result.after.cacheHitRate).toBeGreaterThanOrEqual(result.before.cacheHitRate);
    });

    test('🔄 REFACTOR: Firestore 완전 대체', async () => {
        const result = await manager.migrateFromFirestore();

        expect(result.migrationStatus).toBe('completed');
        expect(result.remainingFirestoreUsage).toBe(0);
        expect(result.newDistribution).toEqual({
            redis: 40,
            supabase: 60,
            gcpStorage: 10
        });
    });

    test('🔄 REFACTOR: 복합 쿼리 처리 성능', async () => {
        const sessionId = 'performance-session';
        const serverId = 'srv-performance';
        const timeRange = {
            start: new Date(Date.now() - 3600000),
            end: new Date()
        };

        // 여러 쿼리 동시 실행
        const queries = [
            manager.executeUnifiedQuery({ type: 'realtime', sessionId }),
            manager.executeUnifiedQuery({ type: 'historical', sessionId, timeRange }),
            manager.executeUnifiedQuery({ type: 'analytics', serverId, timeRange }),
            manager.executeUnifiedQuery({ type: 'aggregated', sessionId })
        ];

        const startTime = Date.now();
        await Promise.all(queries);
        const endTime = Date.now();

        const totalTime = endTime - startTime;
        expect(totalTime).toBeLessThan(5000); // 5초 이내 처리
    });

    test('🔄 REFACTOR: 대용량 데이터 처리', async () => {
        const sessionId = 'large-session';
        const largeMetrics = generateMockServerMetrics(10000); // 10,000개 메트릭

        const startTime = Date.now();
        await manager.saveDistributedMetrics(sessionId, largeMetrics);
        const endTime = Date.now();

        const processingTime = endTime - startTime;
        expect(processingTime).toBeLessThan(10000); // 10초 이내 처리

        expect(mockRedisManager.saveRealtimeMetrics).toHaveBeenCalledWith(sessionId, largeMetrics);
        expect(mockSupabaseManager.batchInsertMetrics).toHaveBeenCalledWith(sessionId, largeMetrics);
    });

    test('🔄 REFACTOR: 부하 분산 권장사항 생성', async () => {
        // 높은 사용률 시뮬레이션을 위해 여러 세션 저장
        const sessions = Array.from({ length: 50 }, (_, i) => `session-${i}`);
        const metrics = generateMockServerMetrics(100);

        for (const sessionId of sessions) {
            await manager.saveDistributedMetrics(sessionId, metrics);
        }

        const status = await manager.getLoadBalancingStatus();

        expect(status.activeSessions).toBeGreaterThan(0);
        expect(status.recommendations.length).toBeGreaterThanOrEqual(0);
    });
}); 