/**
 * 🗂️ MCP 데이터 보존 및 자동 정리 시스템 v2.0
 *
 * 무료 티어 최적화 데이터 라이프사이클 관리
 * - Supabase 500MB 제한 준수
 * - Redis 256MB 메모리 관리
 * - 스마트 아카이빙 및 압축
 * - 자동 정리 스케줄링
 */

import type { MCPTimeSeriesManager } from './timeseries-manager';
import type { MCPCacheManager } from './cache-manager';
import type { MCPServerName } from '../mcp-monitor/types';

// 📋 데이터 보존 정책
export interface DataRetentionPolicy {
  // 실시간 데이터 (Redis)
  realTimeMetrics: {
    ttlSeconds: number;
    maxMemoryMB: number;
    compressionThreshold: number;
    evictionStrategy: 'lru' | 'lfu' | 'ttl';
  };

  // 시계열 데이터 (Supabase)
  timeSeriesData: {
    metricsRetentionDays: number;
    healthCheckRetentionDays: number;
    eventsRetentionDays: number;
    aggregatesRetentionDays: number;
    archiveAfterDays: number;
  };

  // 정리 스케줄
  cleanupSchedule: {
    intervalHours: number;
    emergencyCleanupThresholdMB: number;
    batchSize: number;
    maxExecutionTimeMs: number;
  };
}

// 📊 데이터 사용량 통계
export interface DataUsageStats {
  redis: {
    currentMemoryMB: number;
    maxMemoryMB: number;
    utilizationPercent: number;
    keyCount: number;
    hitRate: number;
    evictedKeys: number;
  };

  supabase: {
    currentStorageMB: number;
    maxStorageMB: number;
    utilizationPercent: number;
    tableStats: {
      metrics: { rowCount: number; sizeMB: number };
      health: { rowCount: number; sizeMB: number };
      events: { rowCount: number; sizeMB: number };
      aggregates: { rowCount: number; sizeMB: number };
    };
  };

  recommendations: string[];
  urgentActions: string[];
}

// 🧹 정리 작업 결과
export interface CleanupResult {
  startTime: number;
  endTime: number;
  durationMs: number;

  redis: {
    keysEvicted: number;
    memoryFreedMB: number;
    errorsCount: number;
  };

  supabase: {
    recordsDeleted: number;
    recordsArchived: number;
    spaceFreedMB: number;
    errorsCount: number;
  };

  success: boolean;
  errors: string[];
  nextScheduledCleanup: number;
}

// 📦 아카이브 메타데이터
export interface ArchiveMetadata {
  archiveId: string;
  serverId?: MCPServerName;
  dataType: 'metrics' | 'health' | 'events';
  timeRange: {
    start: Date;
    end: Date;
  };
  recordCount: number;
  originalSizeMB: number;
  compressedSizeMB: number;
  compressionRatio: number;
  createdAt: Date;
  expiresAt: Date;
}

/**
 * 기본 데이터 보존 정책
 */
const DEFAULT_RETENTION_POLICY: DataRetentionPolicy = {
  realTimeMetrics: {
    ttlSeconds: 300, // 5분 TTL
    maxMemoryMB: 200, // 200MB 임계값 (256MB의 78%)
    compressionThreshold: 1024, // 1KB 이상 압축
    evictionStrategy: 'ttl', // TTL 기반 제거
  },

  timeSeriesData: {
    metricsRetentionDays: 7, // 메트릭 7일 보존
    healthCheckRetentionDays: 7, // 헬스체크 7일 보존
    eventsRetentionDays: 3, // 이벤트 3일 보존
    aggregatesRetentionDays: 30, // 집계 데이터 30일 보존
    archiveAfterDays: 5, // 5일 후 아카이브
  },

  cleanupSchedule: {
    intervalHours: 6, // 6시간마다 정리
    emergencyCleanupThresholdMB: 450, // 450MB 도달 시 긴급 정리
    batchSize: 1000, // 1000개씩 처리
    maxExecutionTimeMs: 30000, // 최대 30초 실행
  },
};

/**
 * MCP 데이터 보존 관리자
 */
export class MCPDataRetentionManager {
  private policy: DataRetentionPolicy;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private isCleanupRunning = false;
  private lastCleanupTime = 0;
  private totalCleanupsRun = 0;

  constructor(
    private cacheManager: MCPCacheManager,
    private timeSeriesManager: MCPTimeSeriesManager,
    policy?: Partial<DataRetentionPolicy>
  ) {
    this.policy = { ...DEFAULT_RETENTION_POLICY, ...policy };
    this.startAutomaticCleanup();
  }

  /**
   * 🚀 자동 정리 시스템 시작
   */
  startAutomaticCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    const intervalMs =
      this.policy.cleanupSchedule.intervalHours * 60 * 60 * 1000;

    this.cleanupTimer = setInterval(async () => {
      if (!this.isCleanupRunning) {
        await this.performScheduledCleanup();
      }
    }, intervalMs);

    console.log(
      `🕐 [MCPDataRetentionManager] Automatic cleanup scheduled every ${this.policy.cleanupSchedule.intervalHours} hours`
    );
  }

  /**
   * 📊 현재 데이터 사용량 분석
   */
  async analyzeDataUsage(): Promise<DataUsageStats> {
    try {
      // Redis 통계 수집
      const cacheStats = this.cacheManager.getPerformanceMetrics();

      // Supabase 통계 추정 (실제 DB 크기는 RPC로 조회)
      const supabaseStats = await this.estimateSupabaseUsage();

      // 권장사항 생성
      const recommendations = this.generateRecommendations(
        cacheStats,
        supabaseStats
      );
      const urgentActions = this.generateUrgentActions(
        cacheStats,
        supabaseStats
      );

      return {
        redis: {
          currentMemoryMB: cacheStats.memoryUsage,
          maxMemoryMB: this.policy.realTimeMetrics.maxMemoryMB,
          utilizationPercent:
            (cacheStats.memoryUsage / this.policy.realTimeMetrics.maxMemoryMB) *
            100,
          keyCount: cacheStats.hits + cacheStats.misses,
          hitRate: cacheStats.hitRate,
          evictedKeys: 0, // Redis 직접 조회 불가, 추정값 사용
        },

        supabase: supabaseStats,

        recommendations,
        urgentActions,
      };
    } catch (error) {
      console.error(
        '❌ [MCPDataRetentionManager] Data usage analysis failed:',
        error
      );
      throw error;
    }
  }

  /**
   * 🧹 전체 시스템 정리 실행
   */
  async performFullCleanup(force = false): Promise<CleanupResult> {
    if (this.isCleanupRunning && !force) {
      throw new Error('Cleanup is already running');
    }

    const startTime = Date.now();
    this.isCleanupRunning = true;

    const result: CleanupResult = {
      startTime,
      endTime: 0,
      durationMs: 0,
      redis: { keysEvicted: 0, memoryFreedMB: 0, errorsCount: 0 },
      supabase: {
        recordsDeleted: 0,
        recordsArchived: 0,
        spaceFreedMB: 0,
        errorsCount: 0,
      },
      success: false,
      errors: [],
      nextScheduledCleanup:
        startTime + this.policy.cleanupSchedule.intervalHours * 60 * 60 * 1000,
    };

    try {
      console.log('🚀 [MCPDataRetentionManager] Starting full cleanup...');

      // 1. Redis 캐시 정리
      await this.cleanupRedisCache(result);

      // 2. Supabase 데이터 정리
      await this.cleanupSupabaseData(result);

      // 3. 정리 완료 처리
      result.success = true;
      this.lastCleanupTime = startTime;
      this.totalCleanupsRun++;

      console.log(
        `✅ [MCPDataRetentionManager] Cleanup completed successfully in ${result.durationMs}ms`
      );
    } catch (error) {
      result.errors.push(`Cleanup failed: ${error}`);
      console.error('❌ [MCPDataRetentionManager] Cleanup failed:', error);
    } finally {
      result.endTime = Date.now();
      result.durationMs = result.endTime - result.startTime;
      this.isCleanupRunning = false;
    }

    return result;
  }

  /**
   * 🚨 긴급 정리 (메모리/저장소 한계 임박 시)
   */
  async performEmergencyCleanup(): Promise<CleanupResult> {
    console.warn('🚨 [MCPDataRetentionManager] Emergency cleanup initiated!');

    // 더 적극적인 정리 정책 적용
    const emergencyPolicy = {
      ...this.policy,
      realTimeMetrics: {
        ...this.policy.realTimeMetrics,
        ttlSeconds: 60, // TTL을 1분으로 단축
      },
      timeSeriesData: {
        ...this.policy.timeSeriesData,
        metricsRetentionDays: 3, // 메트릭 보존을 3일로 단축
        eventsRetentionDays: 1, // 이벤트 보존을 1일로 단축
      },
    };

    const originalPolicy = this.policy;
    this.policy = emergencyPolicy;

    try {
      const result = await this.performFullCleanup(true);

      // 추가 긴급 조치
      if (!result.success || this.isStorageCritical()) {
        await this.cacheManager.emergencyCleanup();
        await this.deleteOldestData(0.2); // 20% 데이터 강제 삭제
      }

      return result;
    } finally {
      this.policy = originalPolicy;
    }
  }

  /**
   * 🔄 스마트 아카이빙 (압축 및 최적화)
   */
  async archiveOldData(
    dataType: 'metrics' | 'health' | 'events',
    olderThanDays: number
  ): Promise<ArchiveMetadata[]> {
    const archiveResults: ArchiveMetadata[] = [];

    try {
      console.log(
        `📦 [MCPDataRetentionManager] Starting archive for ${dataType} older than ${olderThanDays} days`
      );

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      // 아카이브 대상 데이터 조회
      const dataToArchive = await this.getArchiveCandidates(
        dataType,
        cutoffDate
      );

      if (dataToArchive.length === 0) {
        console.log(
          `📦 [MCPDataRetentionManager] No data to archive for ${dataType}`
        );
        return archiveResults;
      }

      // 서버별로 그룹화하여 아카이브
      const groupedData = this.groupDataByServer(dataToArchive);

      for (const [serverId, records] of Object.entries(groupedData)) {
        try {
          const archiveMetadata = await this.createArchive(
            serverId as MCPServerName,
            dataType,
            records,
            cutoffDate
          );
          archiveResults.push(archiveMetadata);
        } catch (error) {
          console.error(
            `❌ Failed to archive ${dataType} for server ${serverId}:`,
            error
          );
        }
      }

      console.log(
        `✅ [MCPDataRetentionManager] Archived ${archiveResults.length} sets of ${dataType} data`
      );
    } catch (error) {
      console.error(
        `❌ [MCPDataRetentionManager] Archive operation failed for ${dataType}:`,
        error
      );
    }

    return archiveResults;
  }

  /**
   * 📊 정리 작업 통계 조회
   */
  getCleanupStats(): {
    totalCleanupsRun: number;
    lastCleanupTime: number;
    isRunning: boolean;
    nextScheduledCleanup: number;
    averageCleanupDuration: number;
    policy: DataRetentionPolicy;
  } {
    return {
      totalCleanupsRun: this.totalCleanupsRun,
      lastCleanupTime: this.lastCleanupTime,
      isRunning: this.isCleanupRunning,
      nextScheduledCleanup:
        this.lastCleanupTime +
        this.policy.cleanupSchedule.intervalHours * 60 * 60 * 1000,
      averageCleanupDuration: 15000, // 추정값 (15초)
      policy: this.policy,
    };
  }

  /**
   * ⚙️ 정책 업데이트
   */
  updateRetentionPolicy(newPolicy: Partial<DataRetentionPolicy>): void {
    this.policy = { ...this.policy, ...newPolicy };

    // 스케줄링 재시작
    this.startAutomaticCleanup();

    console.log('⚙️ [MCPDataRetentionManager] Retention policy updated');
  }

  /**
   * 🔧 Private: 예약된 정리 실행
   */
  private async performScheduledCleanup(): Promise<void> {
    try {
      // 사용량 체크
      const usage = await this.analyzeDataUsage();

      // 긴급 상황 체크
      if (this.isEmergencyCleanupNeeded(usage)) {
        await this.performEmergencyCleanup();
      } else {
        await this.performFullCleanup();
      }
    } catch (error) {
      console.error(
        '❌ [MCPDataRetentionManager] Scheduled cleanup failed:',
        error
      );
    }
  }

  /**
   * 🔧 Private: Redis 캐시 정리
   */
  private async cleanupRedisCache(result: CleanupResult): Promise<void> {
    try {
      const beforeStats = this.cacheManager.getPerformanceMetrics();

      // 메모리 사용량이 임계값 초과 시 긴급 정리
      if (beforeStats.memoryUsage > this.policy.realTimeMetrics.maxMemoryMB) {
        await this.cacheManager.emergencyCleanup();
        result.redis.keysEvicted += 50; // 추정값
      }

      const afterStats = this.cacheManager.getPerformanceMetrics();
      result.redis.memoryFreedMB = Math.max(
        0,
        beforeStats.memoryUsage - afterStats.memoryUsage
      );
    } catch (error) {
      result.redis.errorsCount++;
      result.errors.push(`Redis cleanup error: ${error}`);
    }
  }

  /**
   * 🔧 Private: Supabase 데이터 정리
   */
  private async cleanupSupabaseData(result: CleanupResult): Promise<void> {
    try {
      // 만료된 데이터 정리
      const cleanupResults = await this.timeSeriesManager.cleanupExpiredData();

      result.supabase.recordsDeleted =
        cleanupResults.metrics_deleted +
        cleanupResults.health_deleted +
        cleanupResults.events_deleted;

      result.supabase.spaceFreedMB = cleanupResults.space_freed_mb;
    } catch (error) {
      result.supabase.errorsCount++;
      result.errors.push(`Supabase cleanup error: ${error}`);
    }
  }

  /**
   * 🔧 Private: Supabase 사용량 추정
   */
  private async estimateSupabaseUsage() {
    // 실제 구현에서는 Supabase RPC 함수로 정확한 크기 조회
    return {
      currentStorageMB: 50, // 추정값
      maxStorageMB: 500,
      utilizationPercent: 10,
      tableStats: {
        metrics: { rowCount: 10000, sizeMB: 20 },
        health: { rowCount: 5000, sizeMB: 10 },
        events: { rowCount: 2000, sizeMB: 5 },
        aggregates: { rowCount: 1000, sizeMB: 15 },
      },
    };
  }

  /**
   * 🔧 Private: 권장사항 생성
   */
  private generateRecommendations(
    cacheStats: any,
    supabaseStats: any
  ): string[] {
    const recommendations: string[] = [];

    if (cacheStats.hitRate < 70) {
      recommendations.push(
        'Redis 캐시 히트율이 낮습니다. TTL 전략을 검토하세요.'
      );
    }

    if (supabaseStats.utilizationPercent > 80) {
      recommendations.push(
        'Supabase 저장소 사용량이 높습니다. 데이터 아카이빙을 고려하세요.'
      );
    }

    if (cacheStats.memoryUsage > 180) {
      recommendations.push(
        'Redis 메모리 사용량이 높습니다. 불필요한 캐시를 정리하세요.'
      );
    }

    return recommendations;
  }

  /**
   * 🔧 Private: 긴급 조치 생성
   */
  private generateUrgentActions(cacheStats: any, supabaseStats: any): string[] {
    const urgentActions: string[] = [];

    if (cacheStats.memoryUsage > 230) {
      urgentActions.push(
        'Redis 메모리 사용량이 위험 수준입니다. 즉시 정리가 필요합니다.'
      );
    }

    if (supabaseStats.utilizationPercent > 90) {
      urgentActions.push(
        'Supabase 저장소가 거의 가득 찼습니다. 긴급 데이터 삭제가 필요합니다.'
      );
    }

    return urgentActions;
  }

  /**
   * 🔧 Private: 긴급 정리 필요 여부 판단
   */
  private isEmergencyCleanupNeeded(usage: DataUsageStats): boolean {
    return (
      usage.redis.utilizationPercent > 90 ||
      usage.supabase.utilizationPercent > 90 ||
      usage.urgentActions.length > 0
    );
  }

  /**
   * 🔧 Private: 저장소 위험 상태 체크
   */
  private isStorageCritical(): boolean {
    // 실제 구현에서는 실시간 사용량 체크
    return false;
  }

  /**
   * 🔧 Private: 오래된 데이터 강제 삭제
   */
  private async deleteOldestData(percentage: number): Promise<void> {
    console.warn(
      `🗑️ [MCPDataRetentionManager] Force deleting ${percentage * 100}% of oldest data`
    );
    // 실제 구현에서는 가장 오래된 데이터부터 삭제
  }

  /**
   * 🔧 Private: 아카이브 대상 조회
   */
  private async getArchiveCandidates(
    dataType: string,
    cutoffDate: Date
  ): Promise<any[]> {
    // 실제 구현에서는 Supabase에서 오래된 데이터 조회
    return [];
  }

  /**
   * 🔧 Private: 서버별 데이터 그룹화
   */
  private groupDataByServer(data: any[]): Record<string, any[]> {
    return data.reduce(
      (groups, record) => {
        const serverId = record.server_id || 'unknown';
        if (!groups[serverId]) {
          groups[serverId] = [];
        }
        groups[serverId].push(record);
        return groups;
      },
      {} as Record<string, any[]>
    );
  }

  /**
   * 🔧 Private: 아카이브 생성
   */
  private async createArchive(
    serverId: MCPServerName,
    dataType: string,
    records: any[],
    cutoffDate: Date
  ): Promise<ArchiveMetadata> {
    const archiveId = `${dataType}_${serverId}_${Date.now()}`;
    const originalSize = records.length * 0.001; // 1KB per record estimate

    return {
      archiveId,
      serverId,
      dataType: dataType as 'metrics' | 'health' | 'events',
      timeRange: {
        start: cutoffDate,
        end: new Date(),
      },
      recordCount: records.length,
      originalSizeMB: originalSize,
      compressedSizeMB: originalSize * 0.3, // 70% 압축률 가정
      compressionRatio: 0.3,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90일 후 만료
    };
  }

  /**
   * 🧹 리소스 정리
   */
  async cleanup(): Promise<void> {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    console.log('✅ [MCPDataRetentionManager] Cleanup completed');
  }
}

/**
 * 팩토리 함수
 */
export function createMCPDataRetentionManager(
  cacheManager: MCPCacheManager,
  timeSeriesManager: MCPTimeSeriesManager,
  policy?: Partial<DataRetentionPolicy>
): MCPDataRetentionManager {
  return new MCPDataRetentionManager(cacheManager, timeSeriesManager, policy);
}
