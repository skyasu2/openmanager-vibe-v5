/**
 * 🗄️ ML 데이터 매니저
 * 
 * 무료 티어 최적화를 위한 공통 데이터 레이어
 * - Redis 캐싱 전략
 * - 배치 처리 최적화
 * - 지연 로딩
 * - 데이터 정규화
 */

import redis from '@/lib/redis';
import { systemLogger as logger } from '@/lib/logger';
import type { ServerInstance } from '@/types/data-generator';
import type { ServerMetrics } from '@/services/ai/AnomalyDetection';

// 캐싱 설정
const CACHE_DURATION = {
  PATTERN_ANALYSIS: 5 * 60, // 5분
  ANOMALY_DETECTION: 2 * 60, // 2분
  PREDICTION: 30 * 60, // 30분
  INCIDENT_REPORT: 10 * 60, // 10분
  SERVER_METRICS: 60, // 1분
} as const;

// 배치 크기
const BATCH_SIZE = {
  SERVER_METRICS: 10,
  HISTORY_DATA: 100,
  PATTERN_ANALYSIS: 20,
} as const;

export interface MLDataCache<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface BatchProcessingOptions {
  batchSize?: number;
  parallel?: boolean;
  timeout?: number;
}

export interface MLAnalysisResult {
  patterns: any[];
  anomalies: any[];
  predictions: any[];
  confidence: number;
  timestamp: Date;
}

export class MLDataManager {
  private static instance: MLDataManager;
  private memoryCache: Map<string, MLDataCache<any>> = new Map();
  private pendingBatches: Map<string, any[]> = new Map();
  private batchTimers: Map<string, NodeJS.Timeout> = new Map();

  static getInstance(): MLDataManager {
    if (!this.instance) {
      this.instance = new MLDataManager();
    }
    return this.instance;
  }

  /**
   * 🎯 캐싱된 데이터 가져오기
   */
  async getCachedData<T>(
    key: string,
    ttl: number = CACHE_DURATION.SERVER_METRICS
  ): Promise<T | null> {
    try {
      // 메모리 캐시 확인
      const memCached = this.memoryCache.get(key);
      if (memCached && Date.now() - memCached.timestamp < memCached.ttl * 1000) {
        logger.info(`✅ Memory cache hit: ${key}`);
        return memCached.data;
      }

      // Redis 캐시 확인
      if (redis) {
        const cached = await redis.get(key);
        if (cached) {
          const data = JSON.parse(cached);
          // 메모리 캐시에도 저장
          this.memoryCache.set(key, {
            data,
            timestamp: Date.now(),
            ttl,
          });
          logger.info(`✅ Redis cache hit: ${key}`);
          return data;
        }
      }

      return null;
    } catch (error) {
      logger.error(`캐시 조회 오류 (${key}):`, error);
      return null;
    }
  }

  /**
   * 🎯 데이터 캐싱
   */
  async setCachedData<T>(
    key: string,
    data: T,
    ttl: number = CACHE_DURATION.SERVER_METRICS
  ): Promise<void> {
    try {
      // 메모리 캐시 저장
      this.memoryCache.set(key, {
        data,
        timestamp: Date.now(),
        ttl,
      });

      // Redis 캐시 저장
      if (redis) {
        await redis.set(key, JSON.stringify(data), { ex: ttl });
      }

      logger.info(`✅ Data cached: ${key} (TTL: ${ttl}s)`);
    } catch (error) {
      logger.error(`캐시 저장 오류 (${key}):`, error);
    }
  }

  /**
   * 🎯 서버 메트릭 배치 처리
   */
  async processServerMetricsBatch(
    servers: ServerInstance[],
    options: BatchProcessingOptions = {}
  ): Promise<ServerMetrics[]> {
    const {
      batchSize = BATCH_SIZE.SERVER_METRICS,
      parallel = true,
    } = options;

    const results: ServerMetrics[] = [];
    const batches = this.createBatches(servers, batchSize);

    if (parallel) {
      // 병렬 처리
      const batchPromises = batches.map(batch => this.transformServerBatch(batch));
      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(result => results.push(...result));
    } else {
      // 순차 처리
      for (const batch of batches) {
        const batchResult = await this.transformServerBatch(batch);
        results.push(...batchResult);
      }
    }

    // 결과 캐싱
    await this.setCachedData(
      'ml:server-metrics:latest',
      results,
      CACHE_DURATION.SERVER_METRICS
    );

    return results;
  }

  /**
   * 🎯 패턴 분석 결과 캐싱
   */
  async cachePatternAnalysis(
    analysisId: string,
    result: MLAnalysisResult
  ): Promise<void> {
    const key = `ml:pattern:${analysisId}`;
    await this.setCachedData(key, result, CACHE_DURATION.PATTERN_ANALYSIS);
  }

  /**
   * 🎯 이상감지 결과 캐싱
   */
  async cacheAnomalyDetection(
    serverId: string,
    anomalies: any[]
  ): Promise<void> {
    const key = `ml:anomaly:${serverId}`;
    await this.setCachedData(
      key,
      {
        anomalies,
        timestamp: new Date(),
        count: anomalies.length,
      },
      CACHE_DURATION.ANOMALY_DETECTION
    );
  }

  /**
   * 🎯 예측 결과 캐싱
   */
  async cachePrediction(
    predictionId: string,
    result: any
  ): Promise<void> {
    const key = `ml:prediction:${predictionId}`;
    await this.setCachedData(key, result, CACHE_DURATION.PREDICTION);
  }

  /**
   * 🎯 장애 보고서 캐싱
   */
  async cacheIncidentReport(
    reportId: string,
    report: any
  ): Promise<void> {
    const key = `ml:incident-report:${reportId}`;
    await this.setCachedData(key, report, CACHE_DURATION.INCIDENT_REPORT);
  }

  /**
   * 🎯 히스토리 데이터 일괄 조회
   */
  async getHistoricalData(
    serverId: string,
    hours: number = 24
  ): Promise<ServerMetrics[]> {
    const cacheKey = `ml:history:${serverId}:${hours}h`;
    
    // 캐시 확인
    const cached = await this.getCachedData<ServerMetrics[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // 실제 데이터 조회 (시뮬레이션)
    const historicalData = this.generateMockHistoricalData(serverId, hours);
    
    // 캐싱
    await this.setCachedData(
      cacheKey,
      historicalData,
      Math.min(hours * 60, CACHE_DURATION.PREDICTION)
    );

    return historicalData;
  }

  /**
   * 🎯 지연 배치 추가
   */
  async addToBatch(
    batchId: string,
    item: any,
    processFn: (batch: any[]) => Promise<void>,
    delayMs: number = 1000
  ): Promise<void> {
    // 배치에 추가
    if (!this.pendingBatches.has(batchId)) {
      this.pendingBatches.set(batchId, []);
    }
    this.pendingBatches.get(batchId)!.push(item);

    // 기존 타이머 취소
    const existingTimer = this.batchTimers.get(batchId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // 새 타이머 설정
    const timer = setTimeout(async () => {
      const batch = this.pendingBatches.get(batchId) || [];
      if (batch.length > 0) {
        this.pendingBatches.delete(batchId);
        this.batchTimers.delete(batchId);
        await processFn(batch);
      }
    }, delayMs);

    this.batchTimers.set(batchId, timer);
  }

  /**
   * 🎯 데이터 정규화
   */
  normalizeServerData(server: ServerInstance): ServerMetrics {
    return {
      id: server.id,
      hostname: server.name,
      cpu_usage: server.cpu || 0,
      memory_usage: server.memory || 0,
      disk_usage: server.disk || 0,
      response_time: server.requests?.averageTime || 0,
      status: server.status || 'unknown',
      uptime: server.uptime || 0,
      timestamp: server.lastUpdated || new Date().toISOString(),
    };
  }

  /**
   * 🎯 캐시 통계
   */
  async getCacheStats(): Promise<{
    memorySize: number;
    hitRate: number;
    keys: string[];
  }> {
    const keys = Array.from(this.memoryCache.keys());
    return {
      memorySize: this.memoryCache.size,
      hitRate: 0.7, // 추후 실제 계산
      keys,
    };
  }

  /**
   * 🎯 캐시 정리
   */
  async clearExpiredCache(): Promise<void> {
    const now = Date.now();
    for (const [key, cache] of this.memoryCache.entries()) {
      if (now - cache.timestamp > cache.ttl * 1000) {
        this.memoryCache.delete(key);
      }
    }
    logger.info(`✅ Expired cache cleared. Remaining: ${this.memoryCache.size}`);
  }

  // === Private 헬퍼 메소드 ===

  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  private async transformServerBatch(servers: ServerInstance[]): Promise<ServerMetrics[]> {
    return servers.map(server => this.normalizeServerData(server));
  }

  private generateMockHistoricalData(serverId: string, hours: number): ServerMetrics[] {
    const data: ServerMetrics[] = [];
    const now = Date.now();
    const interval = 5 * 60 * 1000; // 5분 간격

    for (let i = 0; i < (hours * 60) / 5; i++) {
      data.push({
        id: serverId,
        hostname: `server-${serverId}`,
        cpu_usage: 50 + Math.random() * 40,
        memory_usage: 60 + Math.random() * 30,
        disk_usage: 70 + Math.random() * 20,
        response_time: 50 + Math.random() * 100,
        status: Math.random() > 0.9 ? 'warning' : 'healthy',
        uptime: 99 + Math.random(),
        timestamp: new Date(now - i * interval).toISOString(),
      });
    }

    return data.reverse();
  }

  /**
   * 🎯 ML 엔진 지연 로딩
   */
  private mlEngineCache: Map<string, any> = new Map();

  async getMLEngine(engineType: 'anomaly' | 'prediction' | 'incident'): Promise<any> {
    if (this.mlEngineCache.has(engineType)) {
      return this.mlEngineCache.get(engineType);
    }

    let engine: any;
    switch (engineType) {
      case 'anomaly':
        const { AnomalyDetection } = await import('@/services/ai/AnomalyDetection');
        engine = AnomalyDetection.getInstance();
        break;
      case 'prediction':
        const { LightweightMLEngine } = await import('@/lib/ml/LightweightMLEngine');
        engine = new LightweightMLEngine();
        break;
      case 'incident':
        const { incidentReportService } = await import('@/services/ai/IncidentReportService');
        engine = incidentReportService;
        break;
    }

    this.mlEngineCache.set(engineType, engine);
    logger.info(`✅ ML Engine loaded: ${engineType}`);
    return engine;
  }
}

// 싱글톤 인스턴스 export
export const mlDataManager = MLDataManager.getInstance();