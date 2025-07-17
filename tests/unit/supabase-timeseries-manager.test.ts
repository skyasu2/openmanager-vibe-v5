/**
 * SupabaseTimeSeriesManager TDD 테스트
 * Phase 2: Supabase 시계열 DB 시스템
 *
 * 🟢 Green 단계: 기본 구현으로 테스트 통과
 */

import { SupabaseTimeSeriesManager } from '@/services/supabase/SupabaseTimeSeriesManager';
import { ServerMetric } from '@/types/gcp-data-generator';
import { beforeEach, describe, expect, test, vi } from 'vitest';

// 간단한 Mock Supabase 클라이언트
const createMockQueryBuilder = () => ({
  insert: vi.fn().mockResolvedValue({ data: [], error: null }),
  select: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  upsert: vi.fn().mockResolvedValue({ data: [], error: null }),
  eq: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  lte: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
});

const mockSupabase = {
  from: vi.fn(() => createMockQueryBuilder()),
  rpc: vi.fn(),
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn().mockResolvedValue({ data: {}, error: null }),
      download: vi.fn().mockResolvedValue({ data: {}, error: null }),
      remove: vi.fn().mockResolvedValue({ data: [], error: null }),
      list: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
};

// 테스트용 모킹 데이터 생성
function generateMockServerMetrics(count: number = 10): ServerMetric[] {
  return Array.from({ length: count }, (_, i) => ({
    timestamp: new Date(Date.now() - i * 30000),
    serverId: `srv-test-${i + 1}`,
    systemMetrics: {
      cpuUsage: 50 + Math.random() * 30, // 50-80%
      memoryUsage: 40 + Math.random() * 40, // 40-80%
      diskUsage: 30 + Math.random() * 50, // 30-80%
      networkUsage: 20 + Math.random() * 60, // 20-80%
    },
    applicationMetrics: {
      requestCount: Math.floor(Math.random() * 1000),
      errorRate: Math.random() * 5, // 0-5%
      responseTime: 100 + Math.random() * 300, // 100-400ms
    },
  }));
}

describe('🟢 TDD Green Phase: SupabaseTimeSeriesManager 기본 구현', () => {
  let manager: SupabaseTimeSeriesManager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new SupabaseTimeSeriesManager(mockSupabase as any);
  });

  test('🟢 PASS: SupabaseTimeSeriesManager 인스턴스가 생성되어야 함', () => {
    expect(manager).toBeDefined();
    expect(manager).toBeInstanceOf(SupabaseTimeSeriesManager);
  });

  test('🟢 PASS: 배치 메트릭을 효율적으로 삽입해야 함', async () => {
    const sessionId = 'test-session-001';
    const metrics = generateMockServerMetrics(5);

    await manager.batchInsertMetrics(sessionId, metrics);

    expect(mockSupabase.from).toHaveBeenCalledWith('server_metrics_timeseries');
  });

  test('🟢 PASS: 시계열 데이터를 조회할 수 있어야 함', async () => {
    const sessionId = 'test-session-002';
    const mockRecords = [
      {
        session_id: sessionId,
        server_id: 'srv-test-1',
        timestamp: new Date().toISOString(),
        cpu_usage: 50,
        memory_usage: 60,
        disk_usage: 70,
        network_usage: 40,
        request_count: 1000,
        error_rate: 2,
        response_time: 200,
        created_at: new Date().toISOString(),
      },
    ];

    // Mock 체인 설정
    const mockBuilder = createMockQueryBuilder();
    mockBuilder.eq = vi
      .fn()
      .mockResolvedValue({ data: mockRecords, error: null });
    mockSupabase.from = vi.fn().mockReturnValue(mockBuilder);

    const result = await manager.queryTimeSeriesData({ sessionId });

    expect(mockSupabase.from).toHaveBeenCalledWith('server_metrics_timeseries');
    expect(result).toHaveLength(1);
  });

  test('🟢 PASS: 세션별 메트릭 히스토리를 조회할 수 있어야 함', async () => {
    const sessionId = 'test-session-003';
    const mockRecords = Array.from({ length: 3 }, (_, i) => ({
      session_id: sessionId,
      server_id: `srv-test-${i + 1}`,
      timestamp: new Date(Date.now() - i * 30000).toISOString(),
      cpu_usage: 50 + i * 10,
      memory_usage: 60 + i * 5,
      disk_usage: 70,
      network_usage: 40,
      request_count: 1000,
      error_rate: 2,
      response_time: 200,
      created_at: new Date().toISOString(),
    }));

    // Mock 체인 설정
    const mockBuilder = createMockQueryBuilder();
    mockBuilder.order = vi
      .fn()
      .mockResolvedValue({ data: mockRecords, error: null });
    mockSupabase.from = vi.fn().mockReturnValue(mockBuilder);

    const result = await manager.getSessionMetricsHistory(sessionId);

    expect(result).toHaveLength(3);
    expect(result[0]).toHaveProperty('serverId');
    expect(result[0]).toHaveProperty('systemMetrics');
  });

  test('🟢 PASS: TTL 기반 만료 데이터를 정리할 수 있어야 함', async () => {
    const mockBuilder = createMockQueryBuilder();
    mockBuilder.lte = vi
      .fn()
      .mockResolvedValue({ data: [1, 2, 3], error: null });
    mockSupabase.from = vi.fn().mockReturnValue(mockBuilder);

    const deletedCount = await manager.cleanupExpiredData();

    expect(mockSupabase.from).toHaveBeenCalledWith('server_metrics_timeseries');
    expect(deletedCount).toBe(3);
  });

  test('🟢 PASS: 세션 집계 통계를 계산할 수 있어야 함', async () => {
    const sessionId = 'test-session-005';
    const mockRecords = Array.from({ length: 5 }, (_, i) => ({
      session_id: sessionId,
      server_id: `srv-test-${i + 1}`,
      timestamp: new Date(Date.now() - i * 30000).toISOString(),
      cpu_usage: 50 + i * 5,
      memory_usage: 60 + i * 3,
      disk_usage: 70,
      network_usage: 40,
      request_count: 1000 + i * 100,
      error_rate: 2,
      response_time: 200 + i * 20,
      created_at: new Date().toISOString(),
    }));

    // Mock 체인 설정
    const mockBuilder = createMockQueryBuilder();
    mockBuilder.eq = vi
      .fn()
      .mockResolvedValue({ data: mockRecords, error: null });
    mockSupabase.from = vi.fn().mockReturnValue(mockBuilder);

    const result = await manager.calculateSessionAggregates(sessionId);

    expect(result).toHaveProperty('sessionId', sessionId);
    expect(result).toHaveProperty('metrics');
    expect(result).toHaveProperty('dataPoints', 5);
    expect(result.metrics.avgCpuUsage).toBeGreaterThan(0);
  });

  test('🟢 PASS: 빈 세션에 대해 에러를 발생시켜야 함', async () => {
    const sessionId = 'empty-session';

    const mockBuilder = createMockQueryBuilder();
    mockBuilder.eq = vi.fn().mockResolvedValue({ data: [], error: null });
    mockSupabase.from = vi.fn().mockReturnValue(mockBuilder);

    await expect(manager.calculateSessionAggregates(sessionId)).rejects.toThrow(
      '세션 empty-session에 대한 데이터가 없습니다.'
    );
  });

  test('🟢 PASS: 시계열 데이터 조회 시 에러 처리', async () => {
    const sessionId = 'error-session';

    const mockBuilder = createMockQueryBuilder();
    mockBuilder.eq = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'Database connection failed' },
    });
    mockSupabase.from = vi.fn().mockReturnValue(mockBuilder);

    await expect(manager.queryTimeSeriesData({ sessionId })).rejects.toThrow(
      '시계열 데이터 조회 실패: Database connection failed'
    );
  });
});

describe('🔄 TDD Refactor Phase: 고급 기능 및 최적화', () => {
  let manager: SupabaseTimeSeriesManager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new SupabaseTimeSeriesManager(mockSupabase as any);
  });

  test('🔄 REFACTOR: 대용량 데이터 아카이빙', async () => {
    const mockArchiveData = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      session_id: 'old-session',
      server_id: 'srv-old',
      timestamp: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    }));

    // Select Mock
    const mockSelectBuilder = createMockQueryBuilder();
    mockSelectBuilder.lte = vi
      .fn()
      .mockResolvedValue({ data: mockArchiveData, error: null });

    // Delete Mock
    const mockDeleteBuilder = createMockQueryBuilder();
    mockDeleteBuilder.lte = vi
      .fn()
      .mockResolvedValue({ data: mockArchiveData, error: null });

    mockSupabase.from = vi
      .fn()
      .mockReturnValueOnce(mockSelectBuilder)
      .mockReturnValueOnce(mockDeleteBuilder);

    const result = await manager.archiveOldData(30);

    expect(result).toContain('100개 레코드가');
    expect(result).toContain('아카이브되었습니다');
    expect(mockSupabase.storage.from).toHaveBeenCalledWith('metrics-archive');
  });

  test('🔄 REFACTOR: 데이터 무결성 검증', async () => {
    const sessionId = 'integrity-session';
    const mockRecords = [
      {
        session_id: sessionId,
        server_id: 'srv-valid',
        timestamp: new Date().toISOString(),
        cpu_usage: 50,
        memory_usage: 60,
        disk_usage: 70,
        network_usage: 40,
        request_count: 1000,
        error_rate: 2,
        response_time: 200,
        created_at: new Date().toISOString(),
      },
      {
        session_id: sessionId,
        server_id: 'srv-invalid',
        timestamp: new Date().toISOString(),
        cpu_usage: 150, // 유효 범위 초과
        memory_usage: -10, // 유효 범위 초과
        disk_usage: 70,
        network_usage: 40,
        request_count: 1000,
        error_rate: 120, // 유효 범위 초과
        response_time: 200,
        created_at: new Date().toISOString(),
      },
    ];

    const mockBuilder = createMockQueryBuilder();
    mockBuilder.eq = vi
      .fn()
      .mockResolvedValue({ data: mockRecords, error: null });
    mockSupabase.from = vi.fn().mockReturnValue(mockBuilder);

    const result = await manager.validateDataIntegrity(sessionId);

    expect(result.isValid).toBe(false);
    expect(result.totalRecords).toBe(2);
    expect(result.validRecords).toBe(1);
    expect(result.issues.length).toBeGreaterThan(0);
  });

  test('🔄 REFACTOR: 대용량 배치 처리 성능 테스트', async () => {
    const sessionId = 'performance-session';
    const largeMetrics = generateMockServerMetrics(2500); // 2500개 메트릭

    // 배치 처리를 위한 Mock 설정
    const mockBatchBuilder = createMockQueryBuilder();
    mockSupabase.from = vi.fn().mockReturnValue(mockBatchBuilder);

    const startTime = Date.now();
    await manager.batchInsertMetrics(sessionId, largeMetrics);
    const endTime = Date.now();

    const processingTime = endTime - startTime;

    // 배치 처리로 3번 호출되어야 함 (1000개씩)
    expect(mockSupabase.from).toHaveBeenCalledTimes(3);
    expect(processingTime).toBeLessThan(5000); // 5초 이내 처리
  });
});
