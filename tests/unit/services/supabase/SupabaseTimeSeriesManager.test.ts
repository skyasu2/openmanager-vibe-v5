/**
 * SupabaseTimeSeriesManager 테스트
 *
 * 테스트 대상: SupabaseTimeSeriesManager 클래스
 * 목표: 시계열 데이터 관리, 배치 처리, 집계 통계 검증
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ServerMetric } from '@/types/server-metrics';

// Type definitions for test
interface SupabaseClient {
  from(table: string): any;
  rpc<T = unknown>(
    fn: string,
    args?: Record<string, unknown>
  ): Promise<{ data: T | null; error: any | null }>;
  storage: {
    from(bucket: string): any;
  };
}

interface TimeSeriesRecord {
  session_id: string;
  server_id: string;
  timestamp: string;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network_usage: number;
  request_count: number;
  error_rate: number;
  response_time: number;
  created_at: string;
}

interface TimeSeriesQuery {
  sessionId?: string;
  serverId?: string;
  startTime?: Date;
  endTime?: Date;
  limit?: number;
  orderBy?: string;
  ascending?: boolean;
}

interface AggregatedStats {
  sessionId: string;
  serverId?: string;
  timeRange: { start: Date; end: Date };
  metrics: {
    avgCpuUsage: number;
    maxCpuUsage: number;
    avgMemoryUsage: number;
    maxMemoryUsage: number;
    avgDiskUsage: number;
    avgNetworkUsage: number;
    totalRequests: number;
    avgResponseTime: number;
    maxResponseTime: number;
    avgErrorRate: number;
    maxErrorRate: number;
  };
  dataPoints: number;
}

interface AlertThreshold {
  metric:
    | 'cpu_usage'
    | 'memory_usage'
    | 'disk_usage'
    | 'error_rate'
    | 'response_time';
  operator: '>' | '<' | '>=' | '<=' | '=';
  value: number;
  duration: number;
}

describe('SupabaseTimeSeriesManager', () => {
  let manager: any;
  let mockSupabaseClient: any;
  let mockQueryBuilder: any;
  let mockStorageBucket: any;
  let SupabaseTimeSeriesManager: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Import SupabaseTimeSeriesManager dynamically
    const timeSeriesModule = await import(
      '@/services/supabase/SupabaseTimeSeriesManager'
    );
    SupabaseTimeSeriesManager = timeSeriesModule.SupabaseTimeSeriesManager;

    // Mock query builder chain
    mockQueryBuilder = {
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
      then: vi.fn().mockImplementation((callback) => {
        return Promise.resolve(callback({ data: [], error: null }));
      }),
      catch: vi.fn(),
    };

    // Mock storage bucket
    mockStorageBucket = {
      upload: vi
        .fn()
        .mockResolvedValue({ data: { path: 'archive.json' }, error: null }),
      download: vi.fn().mockResolvedValue({ data: new Blob(), error: null }),
      remove: vi.fn().mockResolvedValue({ data: [], error: null }),
      list: vi.fn().mockResolvedValue({ data: [], error: null }),
    };

    // Mock Supabase client
    mockSupabaseClient = {
      from: vi.fn().mockReturnValue(mockQueryBuilder),
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
      storage: {
        from: vi.fn().mockReturnValue(mockStorageBucket),
      },
    } as any;

    manager = new SupabaseTimeSeriesManager(mockSupabaseClient);
  });

  describe('🔴 batchInsertMetrics() - 배치 메트릭 삽입', () => {
    it('should successfully insert batch of metrics', async () => {
      const sessionId = 'session-123';
      const metrics: ServerMetric[] = [
        {
          timestamp: new Date('2025-08-02T10:00:00Z'),
          serverId: 'server-1',
          cpu: 75.5,
          memory: 60.2,
          disk: 45.0,
          network: { in: 100, out: 200 },
          status: 'healthy',
          responseTime: 250,
          activeConnections: 50,
        },
        {
          timestamp: new Date('2025-08-02T10:01:00Z'),
          serverId: 'server-2',
          cpu: 80.1,
          memory: 65.8,
          disk: 55.5,
          network: { in: 150, out: 180 },
          status: 'healthy',
          responseTime: 300,
          activeConnections: 75,
        },
      ];

      await manager.batchInsertMetrics(sessionId, metrics);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith(
        'server_metrics_timeseries'
      );
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            session_id: sessionId,
            server_id: 'server-1',
            cpu_usage: 75.5,
            memory_usage: 60.2,
            disk_usage: 45.0,
            network_usage: 150, // (100 + 200) / 2
            request_count: 50,
            response_time: 250,
          }),
          expect.objectContaining({
            session_id: sessionId,
            server_id: 'server-2',
            cpu_usage: 80.1,
            memory_usage: 65.8,
            disk_usage: 55.5,
            network_usage: 165, // (150 + 180) / 2
            request_count: 75,
            response_time: 300,
          }),
        ])
      );
    });

    it('should handle large batch sizes by splitting into chunks', async () => {
      const sessionId = 'session-large';
      const largeMetrics: ServerMetric[] = Array.from(
        { length: 2500 },
        (_, i) => ({
          timestamp: new Date(
            `2025-08-02T10:${Math.floor(i / 60)
              .toString()
              .padStart(2, '0')}:${(i % 60).toString().padStart(2, '0')}Z`
          ),
          serverId: `server-${i}`,
          cpu: 50 + (i % 50),
          memory: 40 + (i % 60),
          disk: 30 + (i % 70),
          network: { in: 100 + i, out: 200 + i },
          status: 'healthy' as const,
          responseTime: 200 + i,
          activeConnections: 10 + i,
        })
      );

      await manager.batchInsertMetrics(sessionId, largeMetrics);

      // Should be called 3 times (1000 + 1000 + 500)
      expect(mockQueryBuilder.insert).toHaveBeenCalledTimes(3);
      expect(mockQueryBuilder.insert).toHaveBeenNthCalledWith(
        1,
        expect.any(Array)
      );
    });

    it('should handle metrics with legacy format', async () => {
      const sessionId = 'session-legacy';
      const legacyMetrics: ServerMetric[] = [
        {
          timestamp: new Date('2025-08-02T10:00:00Z'),
          serverId: 'legacy-server',
          cpu: undefined,
          memory: undefined,
          disk: undefined,
          network: undefined,
          status: 'healthy',
          responseTime: undefined,
          activeConnections: undefined,
          systemMetrics: {
            cpuUsage: 85.0,
            memoryUsage: 70.5,
            diskUsage: 40.2,
            networkUsage: 120.0,
          },
          applicationMetrics: {
            requestCount: 100,
            errorRate: 2.5,
            responseTime: 350,
          },
        },
      ];

      await manager.batchInsertMetrics(sessionId, legacyMetrics);

      expect(mockQueryBuilder.insert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            cpu_usage: 85.0,
            memory_usage: 70.5,
            disk_usage: 40.2,
            network_usage: 120.0,
            request_count: 100,
            error_rate: 2.5,
            response_time: 350,
          }),
        ])
      );
    });

    it('should handle insert failures gracefully', async () => {
      mockQueryBuilder.insert.mockRejectedValue(new Error('Insert failed'));

      const sessionId = 'session-fail';
      const metrics: ServerMetric[] = [
        {
          timestamp: new Date(),
          serverId: 'server-1',
          cpu: 50,
          memory: 60,
          disk: 70,
          network: { in: 100, out: 200 },
          status: 'healthy',
          responseTime: 250,
          activeConnections: 10,
        },
      ];

      await expect(
        manager.batchInsertMetrics(sessionId, metrics)
      ).rejects.toThrow('Insert failed'); // Should propagate the error
    });
  });

  describe('🔴 queryTimeSeriesData() - 시계열 데이터 조회', () => {
    it('should query data with all filters applied', async () => {
      const mockData: TimeSeriesRecord[] = [
        {
          session_id: 'session-123',
          server_id: 'server-1',
          timestamp: '2025-08-02T10:00:00Z',
          cpu_usage: 75.5,
          memory_usage: 60.2,
          disk_usage: 45.0,
          network_usage: 150,
          request_count: 50,
          error_rate: 1.2,
          response_time: 250,
          created_at: '2025-08-02T10:00:00Z',
        },
      ];

      // Mock the then method to return the proper result structure
      mockQueryBuilder.then.mockImplementation((callback) => {
        return Promise.resolve(callback({ data: mockData, error: null }));
      });

      const query: TimeSeriesQuery = {
        sessionId: 'session-123',
        serverId: 'server-1',
        startTime: new Date('2025-08-02T09:00:00Z'),
        endTime: new Date('2025-08-02T11:00:00Z'),
        limit: 100,
        orderBy: 'timestamp',
        ascending: true,
      };

      const result = await manager.queryTimeSeriesData(query);

      expect(mockQueryBuilder.select).toHaveBeenCalledWith('*');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith(
        'session_id',
        'session-123'
      );
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('server_id', 'server-1');
      expect(mockQueryBuilder.gte).toHaveBeenCalledWith(
        'timestamp',
        '2025-08-02T09:00:00.000Z'
      );
      expect(mockQueryBuilder.lte).toHaveBeenCalledWith(
        'timestamp',
        '2025-08-02T11:00:00.000Z'
      );
      expect(mockQueryBuilder.order).toHaveBeenCalledWith('timestamp', {
        ascending: true,
      });
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(100);
      expect(result).toEqual(mockData);
    });

    it('should query data with minimal filters', async () => {
      const mockData: TimeSeriesRecord[] = [];
      mockQueryBuilder.then.mockImplementation((callback) => {
        return Promise.resolve(callback({ data: mockData, error: null }));
      });

      const query: TimeSeriesQuery = {};
      const result = await manager.queryTimeSeriesData(query);

      expect(mockQueryBuilder.select).toHaveBeenCalledWith('*');
      expect(mockQueryBuilder.eq).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should handle query errors', async () => {
      mockQueryBuilder.then.mockImplementation((callback) => {
        return Promise.resolve(
          callback({
            data: null,
            error: { code: 'QUERY_ERROR', message: 'Query failed' },
          })
        );
      });

      const query: TimeSeriesQuery = { sessionId: 'session-error' };

      await expect(manager.queryTimeSeriesData(query)).rejects.toThrow(
        '시계열 데이터 조회 실패: Query failed'
      );
    });

    it('should return empty array when no data found', async () => {
      mockQueryBuilder.then.mockImplementation((callback) => {
        return Promise.resolve(callback({ data: null, error: null }));
      });

      const query: TimeSeriesQuery = { sessionId: 'non-existent' };
      const result = await manager.queryTimeSeriesData(query);

      expect(result).toEqual([]);
    });
  });

  describe('🔴 getSessionMetricsHistory() - 세션 메트릭 히스토리', () => {
    it('should retrieve session metrics history and transform to ServerMetric format', async () => {
      const mockTimeSeriesData: TimeSeriesRecord[] = [
        {
          session_id: 'session-123',
          server_id: 'server-1',
          timestamp: '2025-08-02T10:00:00Z',
          cpu_usage: 75.5,
          memory_usage: 60.2,
          disk_usage: 45.0,
          network_usage: 150,
          request_count: 50,
          error_rate: 1.2,
          response_time: 250,
          created_at: '2025-08-02T10:00:00Z',
        },
      ];

      mockQueryBuilder.then.mockImplementation((callback) => {
        return Promise.resolve(
          callback({ data: mockTimeSeriesData, error: null })
        );
      });

      const result = await manager.getSessionMetricsHistory('session-123');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        timestamp: new Date('2025-08-02T10:00:00Z'),
        serverId: 'server-1',
        cpu: 75.5,
        memory: 60.2,
        disk: 45.0,
        network: { in: 75, out: 75 }, // network_usage / 2
        status: 'online',
        responseTime: 250,
        activeConnections: 50,
      });
    });

    it('should apply time range filters correctly', async () => {
      mockQueryBuilder.then.mockImplementation((callback) => {
        return Promise.resolve(callback({ data: [], error: null }));
      });

      const startTime = new Date('2025-08-02T09:00:00Z');
      const endTime = new Date('2025-08-02T11:00:00Z');

      await manager.getSessionMetricsHistory('session-123', startTime, endTime);

      expect(mockQueryBuilder.gte).toHaveBeenCalledWith(
        'timestamp',
        startTime.toISOString()
      );
      expect(mockQueryBuilder.lte).toHaveBeenCalledWith(
        'timestamp',
        endTime.toISOString()
      );
      expect(mockQueryBuilder.order).toHaveBeenCalledWith('timestamp', {
        ascending: true,
      });
    });
  });

  describe('🔴 getServerTimeSeriesAnalysis() - 서버 시계열 분석', () => {
    it('should calculate aggregated stats for server data', async () => {
      const mockData: TimeSeriesRecord[] = [
        {
          session_id: 'session-123',
          server_id: 'server-1',
          timestamp: '2025-08-02T10:00:00Z',
          cpu_usage: 70.0,
          memory_usage: 60.0,
          disk_usage: 50.0,
          network_usage: 100.0,
          request_count: 50,
          error_rate: 1.0,
          response_time: 200,
          created_at: '2025-08-02T10:00:00Z',
        },
        {
          session_id: 'session-123',
          server_id: 'server-1',
          timestamp: '2025-08-02T10:01:00Z',
          cpu_usage: 80.0,
          memory_usage: 70.0,
          disk_usage: 60.0,
          network_usage: 120.0,
          request_count: 60,
          error_rate: 2.0,
          response_time: 300,
          created_at: '2025-08-02T10:01:00Z',
        },
      ];

      mockQueryBuilder.then.mockImplementation((callback) => {
        return Promise.resolve(callback({ data: mockData, error: null }));
      });

      const timeRange = {
        start: new Date('2025-08-02T10:00:00Z'),
        end: new Date('2025-08-02T10:02:00Z'),
      };

      const result = await manager.getServerTimeSeriesAnalysis(
        'server-1',
        timeRange
      );

      expect(result).toMatchObject({
        sessionId: 'session-123',
        serverId: 'server-1',
        timeRange,
        metrics: {
          avgCpuUsage: 75.0, // (70 + 80) / 2
          maxCpuUsage: 80.0,
          avgMemoryUsage: 65.0, // (60 + 70) / 2
          maxMemoryUsage: 70.0,
          avgDiskUsage: 55.0, // (50 + 60) / 2
          avgNetworkUsage: 110.0, // (100 + 120) / 2
          totalRequests: 110, // 50 + 60
          avgResponseTime: 250.0, // (200 + 300) / 2
          maxResponseTime: 300,
          avgErrorRate: 1.5, // (1 + 2) / 2
          maxErrorRate: 2.0,
        },
        dataPoints: 2,
      });
    });

    it('should handle empty data sets', async () => {
      mockQueryBuilder.then.mockImplementation((callback) => {
        return Promise.resolve(callback({ data: [], error: null }));
      });

      const timeRange = {
        start: new Date('2025-08-02T10:00:00Z'),
        end: new Date('2025-08-02T11:00:00Z'),
      };

      await expect(
        manager.getServerTimeSeriesAnalysis('server-empty', timeRange)
      ).rejects.toThrow('집계할 데이터가 없습니다.');
    });
  });

  describe('🔴 cleanupExpiredData() - TTL 기반 자동 정리', () => {
    it('should delete data older than TTL period', async () => {
      const mockDeletedData = [
        { id: '1', created_at: '2025-07-25T10:00:00Z' },
        { id: '2', created_at: '2025-07-24T10:00:00Z' },
      ];

      mockQueryBuilder.then.mockImplementation((callback) => {
        return Promise.resolve(
          callback({ data: mockDeletedData, error: null })
        );
      });

      const deletedCount = await manager.cleanupExpiredData();

      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.lte).toHaveBeenCalledWith(
        'created_at',
        expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/)
      );
      expect(deletedCount).toBe(2);
    });

    it('should handle cleanup errors', async () => {
      mockQueryBuilder.then.mockImplementation((callback) => {
        return Promise.resolve(
          callback({
            data: null,
            error: { code: 'DELETE_ERROR', message: 'Cleanup failed' },
          })
        );
      });

      await expect(manager.cleanupExpiredData()).rejects.toThrow(
        '만료 데이터 정리 실패: Cleanup failed'
      );
    });

    it('should return 0 when no data to delete', async () => {
      mockQueryBuilder.then.mockImplementation((callback) => {
        return Promise.resolve(callback({ data: null, error: null }));
      });

      const result = await manager.cleanupExpiredData();

      expect(result).toBe(0);
    });
  });

  describe('🔴 calculateSessionAggregates() - 세션 집계 통계', () => {
    it('should calculate aggregated statistics for a session', async () => {
      const mockData: TimeSeriesRecord[] = [
        {
          session_id: 'session-123',
          server_id: 'server-1',
          timestamp: '2025-08-02T10:00:00Z',
          cpu_usage: 60.0,
          memory_usage: 50.0,
          disk_usage: 40.0,
          network_usage: 90.0,
          request_count: 40,
          error_rate: 0.5,
          response_time: 180,
          created_at: '2025-08-02T10:00:00Z',
        },
        {
          session_id: 'session-123',
          server_id: 'server-2',
          timestamp: '2025-08-02T10:02:00Z',
          cpu_usage: 90.0,
          memory_usage: 80.0,
          disk_usage: 70.0,
          network_usage: 130.0,
          request_count: 80,
          error_rate: 1.5,
          response_time: 400,
          created_at: '2025-08-02T10:02:00Z',
        },
      ];

      mockQueryBuilder.then.mockImplementation((callback) => {
        return Promise.resolve(callback({ data: mockData, error: null }));
      });

      const result = await manager.calculateSessionAggregates('session-123');

      expect(result.sessionId).toBe('session-123');
      expect(result.metrics.avgCpuUsage).toBe(75.0); // (60 + 90) / 2
      expect(result.metrics.maxCpuUsage).toBe(90.0);
      expect(result.metrics.totalRequests).toBe(120); // 40 + 80
      expect(result.dataPoints).toBe(2);
      expect(result.timeRange.start).toEqual(new Date('2025-08-02T10:00:00Z'));
      expect(result.timeRange.end).toEqual(new Date('2025-08-02T10:02:00Z'));
    });

    it('should throw error when no data exists for session', async () => {
      mockQueryBuilder.then.mockImplementation((callback) => {
        return Promise.resolve(callback({ data: [], error: null }));
      });

      await expect(
        manager.calculateSessionAggregates('empty-session')
      ).rejects.toThrow('세션 empty-session에 대한 데이터가 없습니다.');
    });
  });

  describe('🔴 archiveOldData() - 오래된 데이터 아카이브', () => {
    it('should skip upload in Vercel environment and only delete data', async () => {
      const originalEnv = process.env.VERCEL;
      process.env.VERCEL = '1';

      const mockOldData = [
        { id: '1', created_at: '2025-07-01T10:00:00Z' },
        { id: '2', created_at: '2025-06-30T10:00:00Z' },
      ];

      // Mock select for old data
      mockQueryBuilder.then
        .mockImplementationOnce((callback) => {
          return Promise.resolve(callback({ data: mockOldData, error: null }));
        }) // For select
        .mockImplementationOnce((callback) => {
          return Promise.resolve(callback({ data: mockOldData, error: null }));
        }); // For delete

      const result = await manager.archiveOldData(30);

      expect(result).toContain(
        '2개 레코드가 삭제되었습니다 (베르셀 환경에서 아카이브 업로드 건너뛰기)'
      );
      expect(mockStorageBucket.upload).not.toHaveBeenCalled();
      expect(mockQueryBuilder.delete).toHaveBeenCalled();

      process.env.VERCEL = originalEnv;
    });

    it('should perform full archive in development environment', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      delete process.env.VERCEL;

      const mockOldData = [{ id: '1', created_at: '2025-07-01T10:00:00Z' }];

      mockQueryBuilder.then
        .mockImplementationOnce((callback) => {
          return Promise.resolve(callback({ data: mockOldData, error: null }));
        }) // For select
        .mockImplementationOnce((callback) => {
          return Promise.resolve(callback({ data: mockOldData, error: null }));
        }); // For delete

      const result = await manager.archiveOldData(30);

      expect(mockStorageBucket.upload).toHaveBeenCalledWith(
        expect.stringMatching(/archive_\d{4}_\d{1,2}_\d{1,2}\.json/),
        expect.any(Blob)
      );
      expect(result).toContain('1개 레코드가');
      expect(result).toContain('로 아카이브되었습니다.');

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle no data to archive', async () => {
      mockQueryBuilder.then.mockImplementation((callback) => {
        return Promise.resolve(callback({ data: [], error: null }));
      });

      const result = await manager.archiveOldData(30);

      expect(result).toBe('아카이브할 데이터가 없습니다.');
      expect(mockStorageBucket.upload).not.toHaveBeenCalled();
    });

    it('should handle archive query errors', async () => {
      mockQueryBuilder.then.mockImplementation((callback) => {
        return Promise.resolve(
          callback({
            data: null,
            error: { code: 'QUERY_ERROR', message: 'Archive query failed' },
          })
        );
      });

      await expect(manager.archiveOldData(30)).rejects.toThrow(
        '아카이브 대상 데이터 조회 실패: Archive query failed'
      );
    });
  });

  describe('🔴 checkAlertThresholds() - 실시간 알림 트리거', () => {
    it('should detect threshold violations and return alerts', async () => {
      const mockRecentData: TimeSeriesRecord[] = [
        {
          session_id: 'session-123',
          server_id: 'server-1',
          timestamp: '2025-08-02T10:00:00Z',
          cpu_usage: 95.0, // Above threshold
          memory_usage: 85.0, // Above threshold
          disk_usage: 30.0,
          network_usage: 100.0,
          request_count: 50,
          error_rate: 0.5,
          response_time: 150,
          created_at: '2025-08-02T10:00:00Z',
        },
      ];

      mockQueryBuilder.then.mockImplementation((callback) => {
        return Promise.resolve(callback({ data: mockRecentData, error: null }));
      });

      const thresholds: AlertThreshold[] = [
        { metric: 'cpu_usage', operator: '>', value: 90, duration: 300 },
        { metric: 'memory_usage', operator: '>=', value: 80, duration: 300 },
        { metric: 'response_time', operator: '>', value: 1000, duration: 300 },
      ];

      const alerts = await manager.checkAlertThresholds(
        'session-123',
        thresholds
      );

      expect(alerts).toHaveLength(2);
      expect(alerts).toContainEqual({
        metric: 'cpu_usage',
        value: 95.0,
        threshold: 90,
        serverId: 'server-1',
      });
      expect(alerts).toContainEqual({
        metric: 'memory_usage',
        value: 85.0,
        threshold: 80,
        serverId: 'server-1',
      });
    });

    it('should return empty array when no thresholds are violated', async () => {
      const mockRecentData: TimeSeriesRecord[] = [
        {
          session_id: 'session-123',
          server_id: 'server-1',
          timestamp: '2025-08-02T10:00:00Z',
          cpu_usage: 50.0,
          memory_usage: 60.0,
          disk_usage: 40.0,
          network_usage: 80.0,
          request_count: 30,
          error_rate: 0.1,
          response_time: 200,
          created_at: '2025-08-02T10:00:00Z',
        },
      ];

      mockQueryBuilder.then.mockImplementation((callback) => {
        return Promise.resolve(callback({ data: mockRecentData, error: null }));
      });

      const thresholds: AlertThreshold[] = [
        { metric: 'cpu_usage', operator: '>', value: 90, duration: 300 },
        { metric: 'memory_usage', operator: '>', value: 80, duration: 300 },
      ];

      const alerts = await manager.checkAlertThresholds(
        'session-123',
        thresholds
      );

      expect(alerts).toHaveLength(0);
    });

    it('should query only recent data (last 5 minutes)', async () => {
      mockQueryBuilder.then.mockImplementation((callback) => {
        return Promise.resolve(callback({ data: [], error: null }));
      });

      await manager.checkAlertThresholds('session-123', []);

      expect(mockQueryBuilder.gte).toHaveBeenCalledWith(
        'timestamp',
        expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/)
      );
      expect(mockQueryBuilder.order).toHaveBeenCalledWith('timestamp', {
        ascending: false,
      });
    });
  });

  describe('🔴 validateDataIntegrity() - 데이터 무결성 검증', () => {
    it('should validate data integrity and return validation results', async () => {
      const mockData: TimeSeriesRecord[] = [
        {
          session_id: 'session-123',
          server_id: 'server-1',
          timestamp: '2025-08-02T10:00:00Z',
          cpu_usage: 75.0, // Valid
          memory_usage: 65.0, // Valid
          disk_usage: 45.0,
          network_usage: 100.0,
          request_count: 50,
          error_rate: 2.0, // Valid
          response_time: 250,
          created_at: '2025-08-02T10:00:00Z',
        },
        {
          session_id: 'session-123',
          server_id: '', // Invalid - missing server_id
          timestamp: '2025-08-02T10:01:00Z',
          cpu_usage: 150.0, // Invalid - > 100
          memory_usage: -10.0, // Invalid - < 0
          disk_usage: 45.0,
          network_usage: 100.0,
          request_count: 50,
          error_rate: 110.0, // Invalid - > 100
          response_time: 250,
          created_at: '2025-08-02T10:01:00Z',
        },
      ];

      mockQueryBuilder.then.mockImplementation((callback) => {
        return Promise.resolve(callback({ data: mockData, error: null }));
      });

      const result = await manager.validateDataIntegrity('session-123');

      expect(result.isValid).toBe(false);
      expect(result.totalRecords).toBe(2);
      expect(result.validRecords).toBe(1);
      expect(result.issues).toHaveLength(4);
      expect(result.issues).toContain('레코드 unknown에 필수 필드가 누락됨');
      expect(result.issues).toContain(
        '서버 의 CPU 사용률이 유효 범위를 벗어남: 150'
      );
      expect(result.issues).toContain(
        '서버 의 메모리 사용률이 유효 범위를 벗어남: -10'
      );
      expect(result.issues).toContain(
        '서버 의 에러율이 유효 범위를 벗어남: 110'
      );
    });

    it('should return valid result when all data is correct', async () => {
      const mockData: TimeSeriesRecord[] = [
        {
          session_id: 'session-123',
          server_id: 'server-1',
          timestamp: '2025-08-02T10:00:00Z',
          cpu_usage: 75.0,
          memory_usage: 65.0,
          disk_usage: 45.0,
          network_usage: 100.0,
          request_count: 50,
          error_rate: 2.0,
          response_time: 250,
          created_at: '2025-08-02T10:00:00Z',
        },
      ];

      mockQueryBuilder.then.mockImplementation((callback) => {
        return Promise.resolve(callback({ data: mockData, error: null }));
      });

      const result = await manager.validateDataIntegrity('session-123');

      expect(result.isValid).toBe(true);
      expect(result.totalRecords).toBe(1);
      expect(result.validRecords).toBe(1);
      expect(result.issues).toHaveLength(0);
    });

    it('should handle empty data set', async () => {
      mockQueryBuilder.then.mockImplementation((callback) => {
        return Promise.resolve(callback({ data: [], error: null }));
      });

      const result = await manager.validateDataIntegrity('empty-session');

      expect(result.isValid).toBe(true);
      expect(result.totalRecords).toBe(0);
      expect(result.validRecords).toBe(0);
      expect(result.issues).toHaveLength(0);
    });
  });

  describe('🔴 Edge Cases and Error Handling', () => {
    it('should handle Supabase client errors gracefully', async () => {
      // Mock the from method to throw an error
      mockSupabaseClient.from.mockImplementation(() => {
        throw new Error('Supabase client error');
      });

      const testMetrics: any[] = [
        {
          timestamp: new Date(),
          serverId: 'server-1',
          cpu: 50,
          memory: 60,
          disk: 70,
          network: { in: 100, out: 200 },
          status: 'healthy',
          responseTime: 250,
          activeConnections: 10,
        },
      ];

      await expect(
        manager.batchInsertMetrics('session-error', testMetrics)
      ).rejects.toThrow('Supabase client error');
    });

    it('should handle malformed data transformations', async () => {
      const malformedMetrics: any[] = [
        {
          // Missing required fields
          serverId: null,
          timestamp: 'invalid-date',
        },
        {
          serverId: 'server-1',
          timestamp: new Date(),
          cpu: 'not-a-number',
          memory: null,
        },
      ];

      // Should not throw during transformation
      await expect(
        manager.batchInsertMetrics('session-malformed', malformedMetrics)
      ).resolves.not.toThrow();
    });

    it('should handle very large time ranges efficiently', async () => {
      const hugeTimeRange = {
        start: new Date('2020-01-01T00:00:00Z'),
        end: new Date('2025-12-31T23:59:59Z'),
      };

      // Mock the query chain for empty data response
      mockQueryBuilder.then.mockImplementation((callback) => {
        return Promise.resolve(callback({ data: [], error: null }));
      });

      // Should throw error when no data is available
      await expect(
        manager.getServerTimeSeriesAnalysis('server-1', hugeTimeRange)
      ).rejects.toThrow('집계할 데이터가 없습니다.');
    });

    it('should handle concurrent operations safely', async () => {
      const sessionId = 'concurrent-session';
      const metrics: ServerMetric[] = [
        {
          timestamp: new Date(),
          serverId: 'server-1',
          cpu: 50,
          memory: 60,
          disk: 70,
          network: { in: 100, out: 200 },
          status: 'healthy',
          responseTime: 250,
          activeConnections: 10,
        },
      ];

      // Mock for insert operations (batchInsertMetrics)
      mockQueryBuilder.insert.mockResolvedValue({ data: [], error: null });

      // Mock for query operations (queryTimeSeriesData)
      mockQueryBuilder.then.mockImplementation((callback) => {
        return Promise.resolve(callback({ data: [], error: null }));
      });

      // Mock for delete operations (cleanupExpiredData) - needs to chain with lte()
      mockQueryBuilder.delete.mockReturnValue({
        lte: vi.fn().mockResolvedValue({ data: [], error: null }),
      });

      // Run concurrent operations
      const operations = [
        manager.batchInsertMetrics(sessionId, metrics),
        manager.queryTimeSeriesData({ sessionId }),
        manager.cleanupExpiredData(),
      ];

      // All operations should complete without throwing
      const results = await Promise.all(operations);

      expect(results).toHaveLength(3);
      expect(results[0]).toBeUndefined(); // batchInsertMetrics returns void
      expect(results[1]).toEqual([]); // queryTimeSeriesData returns empty array
      expect(results[2]).toBe(0); // cleanupExpiredData returns 0 for no data
    });
  });
});
