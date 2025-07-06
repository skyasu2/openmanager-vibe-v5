/**
 * 🚀 통합 데이터 전처리 엔진 v1.0
 *
 * 목적: 서버데이터 생성기의 전처리를 통합하여 모니터링과 AI 에이전트가
 *      효율적으로 사용할 수 있는 최적화된 데이터 제공
 *
 * 특징:
 * - 공통 전처리 로직 통합
 * - 목적별 특화 처리 (monitoring/ai/both)
 * - 스마트 캐싱 시스템
 * - AI 메트릭 정규화
 * - 성능 최적화
 */

import { transformServerInstanceToServer } from '@/adapters/server-data-adapter';
import {
  IntegrationConfig,
  StandardServerMetrics,
  SystemIntegrationAdapter,
} from '@/modules/ai-agent/adapters/SystemIntegrationAdapter';
import { ServerInstance } from '@/types/data-generator';
import { Server } from '@/types/server';
import { RealServerDataGenerator, type RealServerDataGeneratorType } from './RealServerDataGenerator';

// 🎯 통합 처리 옵션
export interface ProcessingOptions {
  includeHistorical?: boolean;
  enableAnomalyDetection?: boolean;
  forceRefresh?: boolean;
  timeRange?: { start: Date; end: Date };
  normalizationMode?: 'standard' | 'minmax' | 'robust';
  cacheTTL?: number;
}

// 🎯 AI 최적화 메트릭 (정규화 + 컨텍스트)
export interface AIOptimizedMetrics extends StandardServerMetrics {
  // 정규화된 메트릭 (0-1 스케일)
  normalizedMetrics: {
    cpu: number; // 0-1
    memory: number; // 0-1
    disk: number; // 0-1
    network: number; // 0-1
    overall: number; // 종합 건강도
  };

  // AI 컨텍스트 정보
  context: {
    serverRole: 'web' | 'api' | 'database' | 'cache' | 'queue';
    environment: 'production' | 'staging' | 'development';
    businessCriticality: 'low' | 'medium' | 'high' | 'critical';
    dependencies: string[];
  };

  // 사전 계산된 AI 특성
  aiFeatures: {
    anomalyScore: number; // 0-1 이상 점수
    trendVector: number[]; // 트렌드 벡터 [cpu, memory, disk, network]
    patternSignature: string; // 패턴 시그니처 해시
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    confidenceScore: number; // 0-1 신뢰도 점수
  };
}

// 🎯 통합 처리 결과
export interface UnifiedProcessedData {
  // 공통 데이터
  rawServers: ServerInstance[];
  timestamp: string;
  source: 'unified-processor';

  // 모니터링용 데이터
  monitoring?: {
    servers: Server[];
    stats: {
      total: number;
      healthy: number;
      warning: number;
      critical: number;
      offline: number;
      averageCpu: number;
      averageMemory: number;
      averageDisk: number;
      averageNetwork: number;
    };
  };

  // AI용 데이터
  ai?: {
    metrics: AIOptimizedMetrics[];
    aggregatedStats: {
      totalServers: number;
      avgNormalizedCpu: number;
      avgNormalizedMemory: number;
      avgNormalizedDisk: number;
      avgNormalizedNetwork: number;
      overallHealthScore: number;
      anomalyCount: number;
      riskDistribution: Record<string, number>;
    };
    trends: {
      cpuTrend: 'increasing' | 'decreasing' | 'stable';
      memoryTrend: 'increasing' | 'decreasing' | 'stable';
      diskTrend: 'increasing' | 'decreasing' | 'stable';
      networkTrend: 'increasing' | 'decreasing' | 'stable';
      overallTrend: 'improving' | 'degrading' | 'stable';
    };
    insights: {
      criticalServers: string[];
      anomalousServers: string[];
      recommendations: string[];
      predictedIssues: Array<{
        serverId: string;
        issueType: string;
        probability: number;
        timeToIssue: number; // minutes
      }>;
    };
  };

  // 메타데이터
  metadata: {
    processingTime: number;
    cacheHit: boolean;
    dataQuality: number; // 0-1
    completeness: number; // 0-1
  };
}

// 🧠 스마트 캐시 매니저 (베르셀 최적화)
class SmartCacheManager {
  private cache = new Map<
    string,
    { data: any; timestamp: number; ttl: number }
  >();
  private readonly DEFAULT_TTL = 30000; // 30초
  private readonly MAX_CACHE_SIZE = 50; // 베르셀 메모리 제한 고려

  set(key: string, data: any, ttl?: number): void {
    // 캐시 크기 제한 (베르셀 메모리 관리)
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.evictOldest();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL,
    });
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > cached.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  clear(): void {
    this.cache.clear();
  }

  // 베르셀 환경을 위한 메모리 관리
  private evictOldest(): void {
    if (this.cache.size === 0) return;

    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, value] of this.cache.entries()) {
      if (value.timestamp < oldestTime) {
        oldestTime = value.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      keys: Array.from(this.cache.keys()).slice(0, 10), // 베르셀 응답 크기 제한
    };
  }
}

// 베르셀 서버리스 환경을 위한 글로벌 인스턴스 관리
let globalProcessorInstance: UnifiedDataProcessor | null = null;

export class UnifiedDataProcessor {
  private dataGenerator: RealServerDataGeneratorType;
  private systemAdapter: SystemIntegrationAdapter;
  private cacheManager: SmartCacheManager;
  private processingStats = {
    totalProcessed: 0,
    totalCacheHits: 0,
    totalProcessingTime: 0,
    averageProcessingTime: 0,
  };

  constructor() {
    console.log('🔄 통합 데이터 처리기 초기화');
    this.dataGenerator = RealServerDataGenerator.getInstance();

    // 베르셀 환경에 최적화된 기본 설정
    const defaultConfig: IntegrationConfig = {
      database: {
        type: 'supabase',
        url: process.env.SUPABASE_URL || 'http://localhost:54321',
        apiKey: process.env.SUPABASE_ANON_KEY,
        maxConnections: 5,
        timeout: 15000,
      },
      redis: {
        enabled: false, // 베르셀에서는 기본 비활성화
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        ttl: 300,
        maxRetries: 2,
      },
      monitoring: {
        enableRealtime: true,
        collectionInterval: 30000,
        retentionPeriod: 86400000, // 24시간
        enableAggregation: true,
      },
      aiAgent: {
        enablePythonAnalysis: false,
        enableMCP: false,
        enableCaching: false,
        maxConcurrentRequests: 5,
      },
    };

    this.systemAdapter = SystemIntegrationAdapter.getInstance(defaultConfig);
    this.cacheManager = new SmartCacheManager();
  }

  // 베르셀 환경에 최적화된 인스턴스 관리
  public static getInstance(): UnifiedDataProcessor {
    if (!globalProcessorInstance) {
      globalProcessorInstance = new UnifiedDataProcessor();
    }
    return globalProcessorInstance;
  }

  // 베르셀 환경에서 인스턴스 재설정이 필요한 경우
  public static resetInstance(): void {
    globalProcessorInstance = null;
  }

  /**
   * 🚀 메인 통합 처리 함수
   */
  public async processData(
    purpose: 'monitoring' | 'ai' | 'both',
    options: ProcessingOptions = {}
  ): Promise<UnifiedProcessedData> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(purpose, options);

    // 캐시 확인
    if (!options.forceRefresh && this.cacheManager.has(cacheKey)) {
      console.log(`📦 통합 처리 캐시 사용: ${purpose}`);
      this.processingStats.totalCacheHits++;

      const cachedData = this.cacheManager.get(cacheKey);
      cachedData.metadata.cacheHit = true;
      return cachedData;
    }

    try {
      console.log(`🔄 통합 데이터 처리 시작: ${purpose}`);

      // 1. 공통 전처리
      const baseData = await this.applyCommonProcessing(options);

      // 2. 목적별 특화 처리
      let result: UnifiedProcessedData;
      switch (purpose) {
        case 'monitoring':
          result = await this.applyMonitoringProcessing(baseData, options);
          break;
        case 'ai':
          result = await this.applyAIProcessing(baseData, options);
          break;
        case 'both':
          result = await this.applyBothProcessing(baseData, options);
          break;
        default:
          throw new Error(`지원하지 않는 처리 목적: ${purpose}`);
      }

      // 3. 메타데이터 추가
      const processingTime = Date.now() - startTime;
      result.metadata = {
        processingTime,
        cacheHit: false,
        dataQuality: this.calculateDataQuality(result),
        completeness: this.calculateCompleteness(result),
      };

      // 4. 캐시 저장
      const cacheTTL = options.cacheTTL || (purpose === 'ai' ? 45000 : 35000);
      this.cacheManager.set(cacheKey, result, cacheTTL);

      // 5. 통계 업데이트
      this.updateProcessingStats(processingTime);

      console.log(`✅ 통합 데이터 처리 완료: ${purpose} (${processingTime}ms)`);
      return result;
    } catch (error) {
      console.error(`❌ 통합 데이터 처리 실패: ${purpose}`, error);

      // 폴백: 캐시된 데이터 또는 기본 데이터 반환
      const fallbackData =
        this.cacheManager.get(cacheKey) ||
        (await this.getEmptyProcessedData(purpose));
      fallbackData.metadata = {
        processingTime: Date.now() - startTime,
        cacheHit: true,
        dataQuality: 0.5,
        completeness: 0.5,
      };

      return fallbackData;
    }
  }

  /**
   * 🔄 공통 전처리 로직
   */
  private async applyCommonProcessing(options: ProcessingOptions): Promise<{
    rawServers: ServerInstance[];
    timestamp: string;
  }> {
    // 데이터 생성기 초기화 확인
    if (this.dataGenerator.getAllServers().length === 0) {
      await this.dataGenerator.initialize();
      this.dataGenerator.startAutoGeneration();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const rawServers = this.dataGenerator.getAllServers();
    console.log(`📊 공통 전처리: ${rawServers.length}개 서버 데이터 수집`);

    return {
      rawServers,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 📊 모니터링 전용 처리
   */
  private async applyMonitoringProcessing(
    baseData: { rawServers: ServerInstance[]; timestamp: string },
    options: ProcessingOptions
  ): Promise<UnifiedProcessedData> {
    const servers: Server[] = [];

    // ServerInstance → Server 변환
    for (const serverInstance of baseData.rawServers) {
      try {
        const server = transformServerInstanceToServer(serverInstance);
        servers.push(server);
      } catch (error) {
        console.error(`❌ 서버 변환 실패: ${serverInstance.id}`, error);
      }
    }

    // 통계 계산
    const stats = this.calculateMonitoringStats(servers);

    return {
      rawServers: baseData.rawServers,
      timestamp: baseData.timestamp,
      source: 'unified-processor',
      monitoring: {
        servers,
        stats,
      },
      metadata: {
        processingTime: 0,
        cacheHit: false,
        dataQuality: 0,
        completeness: 0,
      },
    };
  }

  /**
   * 🧠 AI 전용 처리
   */
  private async applyAIProcessing(
    baseData: { rawServers: ServerInstance[]; timestamp: string },
    options: ProcessingOptions
  ): Promise<UnifiedProcessedData> {
    const aiMetrics: AIOptimizedMetrics[] = [];

    // ServerInstance → AIOptimizedMetrics 변환
    for (const serverInstance of baseData.rawServers) {
      try {
        const optimizedMetric = await this.createAIOptimizedMetric(
          serverInstance,
          options
        );
        aiMetrics.push(optimizedMetric);
      } catch (error) {
        console.error(`❌ AI 메트릭 생성 실패: ${serverInstance.id}`, error);
      }
    }

    // AI 집계 통계 계산
    const aggregatedStats = this.calculateAIAggregatedStats(aiMetrics);

    // 트렌드 분석
    const trends = this.analyzeAITrends(aiMetrics);

    // AI 인사이트 생성
    const insights = await this.generateAIInsights(aiMetrics);

    return {
      rawServers: baseData.rawServers,
      timestamp: baseData.timestamp,
      source: 'unified-processor',
      ai: {
        metrics: aiMetrics,
        aggregatedStats,
        trends,
        insights,
      },
      metadata: {
        processingTime: 0,
        cacheHit: false,
        dataQuality: 0,
        completeness: 0,
      },
    };
  }

  /**
   * 🔄 모니터링 + AI 통합 처리
   */
  private async applyBothProcessing(
    baseData: { rawServers: ServerInstance[]; timestamp: string },
    options: ProcessingOptions
  ): Promise<UnifiedProcessedData> {
    // 병렬 처리로 성능 최적화
    const [monitoringResult, aiResult] = await Promise.all([
      this.applyMonitoringProcessing(baseData, options),
      this.applyAIProcessing(baseData, options),
    ]);

    return {
      rawServers: baseData.rawServers,
      timestamp: baseData.timestamp,
      source: 'unified-processor',
      monitoring: monitoringResult.monitoring,
      ai: aiResult.ai,
      metadata: {
        processingTime: 0,
        cacheHit: false,
        dataQuality: 0,
        completeness: 0,
      },
    };
  }

  /**
   * 🎯 AI 최적화 메트릭 생성
   */
  private async createAIOptimizedMetric(
    serverInstance: ServerInstance,
    options: ProcessingOptions
  ): Promise<AIOptimizedMetrics> {
    // 기본 StandardServerMetrics 생성
    const baseMetrics =
      await this.createStandardMetricsFromServerInstance(serverInstance);

    // 정규화된 메트릭 계산
    const normalizedMetrics = this.normalizeMetrics(
      baseMetrics,
      options.normalizationMode || 'minmax'
    );

    // 컨텍스트 정보 추론
    const context = this.inferServerContext(serverInstance);

    // AI 특성 계산
    const aiFeatures = await this.calculateAIFeatures(
      baseMetrics,
      normalizedMetrics
    );

    return {
      ...baseMetrics,
      normalizedMetrics,
      context,
      aiFeatures,
    };
  }

  /**
   * 📏 메트릭 정규화 (0-1 스케일)
   */
  private normalizeMetrics(
    metrics: StandardServerMetrics,
    mode: 'standard' | 'minmax' | 'robust'
  ) {
    const cpu = Math.min(metrics.metrics.cpu.usage / 100, 1);
    const memory = Math.min(metrics.metrics.memory.usage / 100, 1);
    const disk = Math.min(metrics.metrics.disk.usage / 100, 1);

    // 네트워크는 상대적 정규화 (현재 서버들 중 최대값 기준)
    const networkBytes =
      metrics.metrics.network.bytesReceived + metrics.metrics.network.bytesSent;
    const network = Math.min(networkBytes / (1024 * 1024 * 100), 1); // 100MB 기준

    // 종합 건강도 계산 (가중 평균)
    const overall = cpu * 0.3 + memory * 0.3 + disk * 0.25 + network * 0.15;

    return {
      cpu,
      memory,
      disk,
      network,
      overall,
    };
  }

  /**
   * 🏷️ 서버 컨텍스트 추론
   */
  private inferServerContext(serverInstance: ServerInstance) {
    // 서버 이름과 타입을 기반으로 역할 추론
    const serverName = serverInstance.name.toLowerCase();
    const serverType = serverInstance.type.toLowerCase();

    let serverRole: 'web' | 'api' | 'database' | 'cache' | 'queue' = 'web';
    if (
      serverName.includes('db') ||
      serverName.includes('database') ||
      ['mysql', 'postgresql', 'mongodb', 'oracle', 'mssql'].includes(serverType)
    ) {
      serverRole = 'database';
    } else if (
      serverName.includes('api') ||
      serverName.includes('service') ||
      ['nodejs', 'springboot', 'django', 'dotnet', 'php'].includes(serverType)
    ) {
      serverRole = 'api';
    } else if (
      serverName.includes('cache') ||
      serverName.includes('redis') ||
      serverType === 'redis'
    ) {
      serverRole = 'cache';
    } else if (
      serverName.includes('queue') ||
      serverName.includes('worker') ||
      ['rabbitmq', 'kafka'].includes(serverType)
    ) {
      serverRole = 'queue';
    }

    // 환경 추론
    let environment: 'production' | 'staging' | 'development' =
      serverInstance.environment || 'production';
    if (serverName.includes('dev') || serverName.includes('test')) {
      environment = 'development';
    } else if (serverName.includes('staging') || serverName.includes('stage')) {
      environment = 'staging';
    }

    // 비즈니스 중요도 추론 (서버 역할과 환경 기반)
    let businessCriticality: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    if (environment === 'production') {
      if (serverRole === 'database') {
        businessCriticality = 'critical';
      } else if (serverRole === 'api' || serverRole === 'web') {
        businessCriticality = 'high';
      }
    } else if (environment === 'development') {
      businessCriticality = 'low';
    }

    return {
      serverRole,
      environment,
      businessCriticality,
      dependencies: [], // 향후 확장
    };
  }

  /**
   * 🧠 AI 특성 계산
   */
  private async calculateAIFeatures(
    baseMetrics: StandardServerMetrics,
    normalizedMetrics: {
      cpu: number;
      memory: number;
      disk: number;
      network: number;
      overall: number;
    }
  ) {
    // 이상 점수 계산 (간단한 임계값 기반)
    let anomalyScore = 0;
    if (normalizedMetrics.cpu > 0.8) anomalyScore += 0.3;
    if (normalizedMetrics.memory > 0.9) anomalyScore += 0.4;
    if (normalizedMetrics.disk > 0.85) anomalyScore += 0.3;
    anomalyScore = Math.min(anomalyScore, 1);

    // 트렌드 벡터 (현재는 현재값으로 설정, 향후 히스토리 데이터 활용)
    const trendVector = [
      normalizedMetrics.cpu,
      normalizedMetrics.memory,
      normalizedMetrics.disk,
      normalizedMetrics.network,
    ];

    // 패턴 시그니처 생성
    const patternSignature = this.generatePatternSignature(normalizedMetrics);

    // 위험 수준 계산
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (anomalyScore > 0.7) riskLevel = 'critical';
    else if (anomalyScore > 0.5) riskLevel = 'high';
    else if (anomalyScore > 0.3) riskLevel = 'medium';

    // 신뢰도 점수 (데이터 품질 기반)
    const confidenceScore = 0.95; // 현재는 고정값, 향후 데이터 품질 메트릭 기반

    return {
      anomalyScore,
      trendVector,
      patternSignature,
      riskLevel,
      confidenceScore,
    };
  }

  /**
   * 🔖 패턴 시그니처 생성
   */
  private generatePatternSignature(normalizedMetrics: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  }): string {
    // 간단한 해시 기반 패턴 시그니처
    const values = [
      Math.round(normalizedMetrics.cpu * 10),
      Math.round(normalizedMetrics.memory * 10),
      Math.round(normalizedMetrics.disk * 10),
      Math.round(normalizedMetrics.network * 10),
    ];

    return `pattern_${values.join('_')}`;
  }

  /**
   * 📊 모니터링 통계 계산
   */
  private calculateMonitoringStats(servers: Server[]) {
    const total = servers.length;
    let healthy = 0,
      warning = 0,
      critical = 0,
      offline = 0;
    let totalCpu = 0,
      totalMemory = 0,
      totalDisk = 0,
      totalNetwork = 0;

    servers.forEach(server => {
      switch (server.status) {
        case 'online':
          healthy++;
          break;
        case 'warning':
          warning++;
          break;
        case 'critical':
          critical++;
          break;
        case 'offline':
          offline++;
          break;
      }

      totalCpu += server.cpu;
      totalMemory += server.memory;
      totalDisk += server.disk;
      totalNetwork += server.network || 0;
    });

    return {
      total,
      healthy,
      warning,
      critical,
      offline,
      averageCpu: total > 0 ? totalCpu / total : 0,
      averageMemory: total > 0 ? totalMemory / total : 0,
      averageDisk: total > 0 ? totalDisk / total : 0,
      averageNetwork: total > 0 ? totalNetwork / total : 0,
    };
  }

  /**
   * 🧠 AI 집계 통계 계산
   */
  private calculateAIAggregatedStats(metrics: AIOptimizedMetrics[]) {
    const totalServers = metrics.length;
    if (totalServers === 0) {
      return {
        totalServers: 0,
        avgNormalizedCpu: 0,
        avgNormalizedMemory: 0,
        avgNormalizedDisk: 0,
        avgNormalizedNetwork: 0,
        overallHealthScore: 0,
        anomalyCount: 0,
        riskDistribution: { low: 0, medium: 0, high: 0, critical: 0 },
      };
    }

    let totalNormalizedCpu = 0,
      totalNormalizedMemory = 0;
    let totalNormalizedDisk = 0,
      totalNormalizedNetwork = 0;
    let totalHealthScore = 0,
      anomalyCount = 0;
    const riskDistribution = { low: 0, medium: 0, high: 0, critical: 0 };

    metrics.forEach(metric => {
      totalNormalizedCpu += metric.normalizedMetrics.cpu;
      totalNormalizedMemory += metric.normalizedMetrics.memory;
      totalNormalizedDisk += metric.normalizedMetrics.disk;
      totalNormalizedNetwork += metric.normalizedMetrics.network;
      totalHealthScore += metric.normalizedMetrics.overall;

      if (metric.aiFeatures.anomalyScore > 0.5) anomalyCount++;
      riskDistribution[metric.aiFeatures.riskLevel]++;
    });

    return {
      totalServers,
      avgNormalizedCpu: totalNormalizedCpu / totalServers,
      avgNormalizedMemory: totalNormalizedMemory / totalServers,
      avgNormalizedDisk: totalNormalizedDisk / totalServers,
      avgNormalizedNetwork: totalNormalizedNetwork / totalServers,
      overallHealthScore: totalHealthScore / totalServers,
      anomalyCount,
      riskDistribution,
    };
  }

  /**
   * 📈 AI 트렌드 분석
   */
  private analyzeAITrends(metrics: AIOptimizedMetrics[]) {
    // 현재는 단순 평균 기반, 향후 히스토리 데이터로 실제 트렌드 분석
    const avgCpu =
      metrics.reduce((sum, m) => sum + m.normalizedMetrics.cpu, 0) /
      metrics.length;
    const avgMemory =
      metrics.reduce((sum, m) => sum + m.normalizedMetrics.memory, 0) /
      metrics.length;
    const avgDisk =
      metrics.reduce((sum, m) => sum + m.normalizedMetrics.disk, 0) /
      metrics.length;
    const avgNetwork =
      metrics.reduce((sum, m) => sum + m.normalizedMetrics.network, 0) /
      metrics.length;
    const avgOverall =
      metrics.reduce((sum, m) => sum + m.normalizedMetrics.overall, 0) /
      metrics.length;

    return {
      cpuTrend: (avgCpu > 0.7
        ? 'increasing'
        : avgCpu < 0.3
          ? 'decreasing'
          : 'stable') as 'increasing' | 'decreasing' | 'stable',
      memoryTrend: (avgMemory > 0.7
        ? 'increasing'
        : avgMemory < 0.3
          ? 'decreasing'
          : 'stable') as 'increasing' | 'decreasing' | 'stable',
      diskTrend: (avgDisk > 0.7
        ? 'increasing'
        : avgDisk < 0.3
          ? 'decreasing'
          : 'stable') as 'increasing' | 'decreasing' | 'stable',
      networkTrend: (avgNetwork > 0.7
        ? 'increasing'
        : avgNetwork < 0.3
          ? 'decreasing'
          : 'stable') as 'increasing' | 'decreasing' | 'stable',
      overallTrend: (avgOverall > 0.7
        ? 'degrading'
        : avgOverall < 0.3
          ? 'improving'
          : 'stable') as 'improving' | 'degrading' | 'stable',
    };
  }

  /**
   * 💡 AI 인사이트 생성
   */
  private async generateAIInsights(metrics: AIOptimizedMetrics[]) {
    const criticalServers = metrics
      .filter(m => m.aiFeatures.riskLevel === 'critical')
      .map(m => m.serverId);

    const anomalousServers = metrics
      .filter(m => m.aiFeatures.anomalyScore > 0.6)
      .map(m => m.serverId);

    const recommendations: string[] = [];
    if (criticalServers.length > 0) {
      recommendations.push(
        `${criticalServers.length}개 서버가 위험 상태입니다. 즉시 점검이 필요합니다.`
      );
    }
    if (anomalousServers.length > 0) {
      recommendations.push(
        `${anomalousServers.length}개 서버에서 이상 패턴이 감지되었습니다.`
      );
    }

    const predictedIssues = metrics
      .filter(m => m.aiFeatures.anomalyScore > 0.4)
      .map(m => ({
        serverId: m.serverId,
        issueType:
          m.aiFeatures.riskLevel === 'high'
            ? 'resource_exhaustion'
            : 'performance_degradation',
        probability: m.aiFeatures.anomalyScore,
        timeToIssue: Math.round((1 - m.aiFeatures.anomalyScore) * 120), // 최대 2시간
      }));

    return {
      criticalServers,
      anomalousServers,
      recommendations,
      predictedIssues,
    };
  }

  // ... 기타 유틸리티 메서드들
  private createStandardMetricsFromServerInstance(
    serverInstance: ServerInstance
  ): StandardServerMetrics {
    return {
      serverId: serverInstance.id,
      hostname: serverInstance.name, // ServerInstance는 name 속성 사용
      timestamp: new Date(),
      status: this.mapServerStatus(serverInstance.status),
      metrics: {
        cpu: {
          usage: serverInstance.metrics.cpu,
          loadAverage: [
            serverInstance.metrics.cpu / 100,
            serverInstance.metrics.cpu / 100,
            serverInstance.metrics.cpu / 100,
          ],
          cores: serverInstance.specs.cpu.cores || 4,
        },
        memory: {
          total: serverInstance.specs.memory.total,
          used:
            (serverInstance.metrics.memory / 100) *
            serverInstance.specs.memory.total,
          available:
            ((100 - serverInstance.metrics.memory) / 100) *
            serverInstance.specs.memory.total,
          usage: serverInstance.metrics.memory,
        },
        disk: {
          total: serverInstance.specs.disk.total,
          used:
            (serverInstance.metrics.disk / 100) *
            serverInstance.specs.disk.total,
          available:
            ((100 - serverInstance.metrics.disk) / 100) *
            serverInstance.specs.disk.total,
          usage: serverInstance.metrics.disk,
          iops: { read: serverInstance.specs.disk.iops || 100, write: 50 },
        },
        network: {
          bytesReceived: serverInstance.metrics.network.in * 1024 * 1024,
          bytesSent: serverInstance.metrics.network.out * 1024 * 1024,
          packetsReceived: 1000,
          packetsSent: 800,
          interface: 'eth0', // 기본 네트워크 인터페이스
          errorsReceived: 0,
          errorsSent: 0,
        },
      },
      services: [
        {
          name: 'nginx',
          status: 'running',
          port: 80,
          pid: 1234,
          uptime: 86400,
          memoryUsage: 128 * 1024 * 1024, // 128MB
          cpuUsage: 5.5,
        },
      ],
      metadata: {
        location: serverInstance.location || 'unknown',
        environment: serverInstance.environment || 'production',
        provider: 'onpremise',
        cluster: undefined,
        zone: undefined,
        instanceType: serverInstance.type || undefined,
      },
    };
  }

  private mapServerStatus(
    status: string
  ): 'online' | 'warning' | 'critical' | 'offline' {
    switch (status.toLowerCase()) {
      case 'online':
        return 'online';
      case 'warning':
        return 'warning';
      case 'critical':
        return 'critical';
      case 'offline':
        return 'offline';
      default:
        return 'online';
    }
  }

  private generateCacheKey(
    purpose: string,
    options: ProcessingOptions
  ): string {
    const optionsHash = JSON.stringify(options);
    return `unified_${purpose}_${Buffer.from(optionsHash).toString('base64').slice(0, 10)}`;
  }

  private calculateDataQuality(data: UnifiedProcessedData): number {
    // 간단한 데이터 품질 계산
    const hasRawData = data.rawServers.length > 0;
    const hasProcessedData =
      data.monitoring?.servers.length || data.ai?.metrics.length || 0;
    return hasRawData && hasProcessedData ? 0.95 : 0.5;
  }

  private calculateCompleteness(data: UnifiedProcessedData): number {
    // 데이터 완전성 계산
    const expectedFields = (data.monitoring ? 4 : 0) + (data.ai ? 4 : 0);
    const actualFields = (data.monitoring ? 4 : 0) + (data.ai ? 4 : 0);
    return expectedFields > 0 ? actualFields / expectedFields : 1;
  }

  private updateProcessingStats(processingTime: number): void {
    this.processingStats.totalProcessed++;
    this.processingStats.totalProcessingTime += processingTime;
    this.processingStats.averageProcessingTime =
      this.processingStats.totalProcessingTime /
      this.processingStats.totalProcessed;
  }

  private async getEmptyProcessedData(
    purpose: string
  ): Promise<UnifiedProcessedData> {
    return {
      rawServers: [],
      timestamp: new Date().toISOString(),
      source: 'unified-processor',
      monitoring:
        purpose === 'monitoring' || purpose === 'both'
          ? {
            servers: [],
            stats: {
              total: 0,
              healthy: 0,
              warning: 0,
              critical: 0,
              offline: 0,
              averageCpu: 0,
              averageMemory: 0,
              averageDisk: 0,
              averageNetwork: 0,
            },
          }
          : undefined,
      ai:
        purpose === 'ai' || purpose === 'both'
          ? {
            metrics: [],
            aggregatedStats: {
              totalServers: 0,
              avgNormalizedCpu: 0,
              avgNormalizedMemory: 0,
              avgNormalizedDisk: 0,
              avgNormalizedNetwork: 0,
              overallHealthScore: 0,
              anomalyCount: 0,
              riskDistribution: { low: 0, medium: 0, high: 0, critical: 0 },
            },
            trends: {
              cpuTrend: 'stable',
              memoryTrend: 'stable',
              diskTrend: 'stable',
              networkTrend: 'stable',
              overallTrend: 'stable',
            },
            insights: {
              criticalServers: [],
              anomalousServers: [],
              recommendations: [],
              predictedIssues: [],
            },
          }
          : undefined,
      metadata: {
        processingTime: 0,
        cacheHit: false,
        dataQuality: 0,
        completeness: 0,
      },
    };
  }

  // 🔧 관리 메서드들
  public clearCache(): void {
    this.cacheManager.clear();
    console.log('🧹 통합 처리 캐시 클리어 완료');
  }

  public getStatus() {
    return {
      cacheStats: this.cacheManager.getStats(),
      processingStats: this.processingStats,
      isReady: this.dataGenerator.getAllServers().length > 0,
    };
  }

  public getProcessingStats() {
    return { ...this.processingStats };
  }
}
