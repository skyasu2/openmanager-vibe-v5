/**
 * 🤖 AI 어시스턴트 전용 데이터 필터
 *
 * 목적: 서버 모니터링 데이터와 독립적으로 AI 분석에 최적화된 데이터 처리
 * 특징:
 * - AI 분석에 특화된 데이터 변환
 * - 패턴 인식을 위한 데이터 정규화
 * - 컨텍스트 기반 데이터 그룹핑
 * - 실시간 이상 탐지용 데이터 준비
 */

import { RealServerDataGenerator } from '@/services/data-generator/RealServerDataGenerator';

export interface AIOptimizedServerData {
  // 기본 식별 정보
  serverId: string;
  serverName: string;
  timestamp: Date;

  // AI 분석용 정규화된 메트릭 (0-1 스케일)
  normalizedMetrics: {
    cpu: number; // 0-1 정규화
    memory: number; // 0-1 정규화
    disk: number; // 0-1 정규화
    network: number; // 0-1 정규화
    overall: number; // 종합 건강도 점수
  };

  // AI 패턴 인식용 카테고리
  categories: {
    performanceLevel: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    serverType: 'web' | 'api' | 'database' | 'cache' | 'queue' | 'unknown';
    environment: 'production' | 'staging' | 'development' | 'test';
  };

  // AI 컨텍스트 정보
  context: {
    location: string;
    cluster?: string;
    dependencies: string[];
    businessCriticality: 'low' | 'medium' | 'high' | 'critical';
  };

  // AI 예측용 트렌드 데이터
  trends: {
    cpuTrend: 'stable' | 'increasing' | 'decreasing' | 'volatile';
    memoryTrend: 'stable' | 'increasing' | 'decreasing' | 'volatile';
    alertFrequency: number; // 최근 24시간 알림 빈도
    uptimeScore: number; // 가동시간 점수 (0-1)
  };

  // AI 학습용 라벨
  labels: {
    isAnomalous: boolean;
    requiresAttention: boolean;
    predictedIssues: string[];
    confidenceScore: number;
  };
}

export interface AIDataFilterOptions {
  // 필터링 옵션
  includeHealthy?: boolean;
  includeWarning?: boolean;
  includeCritical?: boolean;
  maxResults?: number;

  // AI 분석 타입별 최적화
  analysisType?:
    | 'anomaly_detection'
    | 'performance_prediction'
    | 'pattern_analysis'
    | 'recommendation';

  // 시간 범위
  timeWindow?: {
    start: Date;
    end: Date;
  };

  // 컨텍스트 필터
  contextFilters?: {
    locations?: string[];
    serverTypes?: string[];
    environments?: string[];
    businessCriticality?: string[];
  };

  // AI 모델별 설정
  modelOptimization?: {
    normalizeForML?: boolean;
    includeHistoricalData?: boolean;
    featureSelection?: string[];
  };
}

export interface AIFilterResult {
  data: AIOptimizedServerData[];
  metadata: {
    totalServers: number;
    filteredCount: number;
    processingTime: number;
    optimizationType: string;
    dataQuality: {
      completeness: number; // 0-1
      consistency: number; // 0-1
      accuracy: number; // 0-1
    };
  };
  insights: {
    patterns: string[];
    anomalies: string[];
    recommendations: string[];
  };
}

export class AIDataFilter {
  private static instance: AIDataFilter | null = null;
  private dataGenerator: RealServerDataGenerator;
  private cache: Map<string, { data: AIFilterResult; timestamp: number }> =
    new Map();
  private readonly CACHE_TTL = 30000; // 30초

  private constructor() {
    this.dataGenerator = RealServerDataGenerator.getInstance();
    console.log('🤖 AI 전용 데이터 필터 초기화');
  }

  public static getInstance(): AIDataFilter {
    if (!AIDataFilter.instance) {
      AIDataFilter.instance = new AIDataFilter();
    }
    return AIDataFilter.instance;
  }

  /**
   * 🎯 AI 분석용 서버 데이터 필터링 및 최적화
   */
  async filterForAI(
    options: AIDataFilterOptions = {}
  ): Promise<AIFilterResult> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(options);

    // 캐시 확인
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log('📦 AI 필터 캐시 히트');
      return cached;
    }

    console.log('🔍 AI 전용 데이터 필터링 시작', options);

    try {
      // 1. 원본 서버 데이터 가져오기
      const rawServers = this.dataGenerator.getAllServers();

      // 2. AI 최적화 데이터로 변환
      const aiOptimizedData = rawServers.map(server =>
        this.transformToAIData(server)
      );

      // 3. 옵션에 따른 필터링
      const filteredData = this.applyAIFilters(aiOptimizedData, options);

      // 4. AI 분석 타입별 최적화
      const optimizedData = this.optimizeForAnalysisType(
        filteredData,
        options.analysisType
      );

      // 5. 인사이트 생성
      const insights = this.generateAIInsights(optimizedData);

      // 6. 데이터 품질 평가
      const dataQuality = this.assessDataQuality(optimizedData);

      const processingTime = Date.now() - startTime;

      const result: AIFilterResult = {
        data: optimizedData,
        metadata: {
          totalServers: rawServers.length,
          filteredCount: optimizedData.length,
          processingTime,
          optimizationType: options.analysisType || 'general',
          dataQuality,
        },
        insights,
      };

      // 캐시 저장
      this.saveToCache(cacheKey, result);

      console.log(
        `✅ AI 데이터 필터링 완료: ${optimizedData.length}/${rawServers.length} (${processingTime}ms)`
      );

      return result;
    } catch (error) {
      console.error('❌ AI 데이터 필터링 실패:', error);
      throw error;
    }
  }

  /**
   * 🔄 원본 서버 데이터를 AI 최적화 데이터로 변환
   */
  private transformToAIData(server: any): AIOptimizedServerData {
    // CPU, 메모리, 디스크 사용률을 0-1로 정규화
    const normalizedCpu = Math.min(server.cpu / 100, 1);
    const normalizedMemory = Math.min(server.memory / 100, 1);
    const normalizedDisk = Math.min(server.disk / 100, 1);
    const normalizedNetwork = Math.min(
      (server.network_in + server.network_out) / 200,
      1
    );

    // 종합 건강도 점수 계산 (가중 평균)
    const overallHealth =
      normalizedCpu * 0.3 +
      normalizedMemory * 0.3 +
      normalizedDisk * 0.2 +
      normalizedNetwork * 0.2;

    // 성능 레벨 분류
    const performanceLevel = this.classifyPerformanceLevel(overallHealth);

    // 위험 레벨 분류
    const riskLevel = this.classifyRiskLevel(server);

    // 서버 타입 추론
    const serverType = this.inferServerType(server);

    // 트렌드 분석 (간단한 버전)
    const trends = this.analyzeTrends(server);

    return {
      serverId: server.id,
      serverName: server.name,
      timestamp: new Date(),

      normalizedMetrics: {
        cpu: normalizedCpu,
        memory: normalizedMemory,
        disk: normalizedDisk,
        network: normalizedNetwork,
        overall: overallHealth,
      },

      categories: {
        performanceLevel,
        riskLevel,
        serverType,
        environment: server.environment || 'production',
      },

      context: {
        location: server.location || 'Unknown',
        cluster: server.cluster,
        dependencies: server.dependencies || [],
        businessCriticality: server.businessCriticality || 'medium',
      },

      trends,

      labels: {
        isAnomalous: this.detectAnomaly(server),
        requiresAttention: riskLevel === 'high' || riskLevel === 'critical',
        predictedIssues: this.predictIssues(server),
        confidenceScore: this.calculateConfidence(server),
      },
    };
  }

  /**
   * 🎯 AI 필터 적용
   */
  private applyAIFilters(
    data: AIOptimizedServerData[],
    options: AIDataFilterOptions
  ): AIOptimizedServerData[] {
    let filtered = [...data];

    // 상태별 필터링
    if (options.includeHealthy === false) {
      filtered = filtered.filter(
        d =>
          d.categories.performanceLevel !== 'excellent' &&
          d.categories.performanceLevel !== 'good'
      );
    }
    if (options.includeWarning === false) {
      filtered = filtered.filter(d => d.categories.performanceLevel !== 'fair');
    }
    if (options.includeCritical === false) {
      filtered = filtered.filter(
        d =>
          d.categories.performanceLevel !== 'poor' &&
          d.categories.performanceLevel !== 'critical'
      );
    }

    // 컨텍스트 필터
    if (options.contextFilters) {
      const { locations, serverTypes, environments, businessCriticality } =
        options.contextFilters;

      if (locations?.length) {
        filtered = filtered.filter(d => locations.includes(d.context.location));
      }
      if (serverTypes?.length) {
        filtered = filtered.filter(d =>
          serverTypes.includes(d.categories.serverType)
        );
      }
      if (environments?.length) {
        filtered = filtered.filter(d =>
          environments.includes(d.categories.environment)
        );
      }
      if (businessCriticality?.length) {
        filtered = filtered.filter(d =>
          businessCriticality.includes(d.context.businessCriticality)
        );
      }
    }

    // 시간 범위 필터
    if (options.timeWindow) {
      const { start, end } = options.timeWindow;
      filtered = filtered.filter(
        d => d.timestamp >= start && d.timestamp <= end
      );
    }

    return filtered;
  }

  /**
   * 🧠 AI 분석 타입별 데이터 최적화
   */
  private optimizeForAnalysisType(
    data: AIOptimizedServerData[],
    analysisType?: string
  ): AIOptimizedServerData[] {
    switch (analysisType) {
      case 'anomaly_detection':
        // 이상 탐지용: 정상 데이터와 이상 데이터 균형
        return this.balanceAnomalyData(data);

      case 'performance_prediction':
        // 성능 예측용: 트렌드 데이터가 있는 서버 우선
        return data.filter(
          d =>
            d.trends.cpuTrend !== 'stable' || d.trends.memoryTrend !== 'stable'
        );

      case 'pattern_analysis':
        // 패턴 분석용: 다양한 카테고리 포함
        return this.diversifyCategories(data);

      case 'recommendation':
        // 추천용: 개선 가능한 서버 우선
        return data.filter(
          d =>
            d.labels.requiresAttention ||
            d.categories.performanceLevel === 'fair'
        );

      default:
        return data;
    }
  }

  /**
   * 💡 AI 인사이트 생성
   */
  private generateAIInsights(data: AIOptimizedServerData[]): {
    patterns: string[];
    anomalies: string[];
    recommendations: string[];
  } {
    const patterns: string[] = [];
    const anomalies: string[] = [];
    const recommendations: string[] = [];

    // 패턴 분석
    const performanceDistribution = this.analyzePerformanceDistribution(data);
    if (performanceDistribution.critical > 0.2) {
      patterns.push(
        `전체 서버의 ${Math.round(performanceDistribution.critical * 100)}%가 심각한 성능 문제를 보이고 있습니다`
      );
    }

    // 이상 탐지
    const anomalousServers = data.filter(d => d.labels.isAnomalous);
    if (anomalousServers.length > 0) {
      anomalies.push(
        `${anomalousServers.length}개 서버에서 비정상적인 패턴이 감지되었습니다`
      );
    }

    // 추천 생성
    const highRiskServers = data.filter(
      d =>
        d.categories.riskLevel === 'high' ||
        d.categories.riskLevel === 'critical'
    );
    if (highRiskServers.length > 0) {
      recommendations.push(
        `${highRiskServers.length}개 서버에 즉시 조치가 필요합니다`
      );
    }

    return { patterns, anomalies, recommendations };
  }

  // 헬퍼 메서드들
  private classifyPerformanceLevel(
    overallHealth: number
  ): 'excellent' | 'good' | 'fair' | 'poor' | 'critical' {
    if (overallHealth <= 0.2) return 'excellent';
    if (overallHealth <= 0.4) return 'good';
    if (overallHealth <= 0.6) return 'fair';
    if (overallHealth <= 0.8) return 'poor';
    return 'critical';
  }

  private classifyRiskLevel(
    server: any
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (server.status === 'error') return 'critical';
    if (server.status === 'warning') return 'high';
    if (server.cpu > 80 || server.memory > 80) return 'medium';
    return 'low';
  }

  private inferServerType(
    server: any
  ): 'web' | 'api' | 'database' | 'cache' | 'queue' | 'unknown' {
    const name = server.name.toLowerCase();
    if (name.includes('web') || name.includes('nginx')) return 'web';
    if (name.includes('api') || name.includes('rest')) return 'api';
    if (
      name.includes('db') ||
      name.includes('database') ||
      name.includes('mysql') ||
      name.includes('postgres')
    )
      return 'database';
    if (name.includes('cache') || name.includes('redis')) return 'cache';
    if (name.includes('queue') || name.includes('mq')) return 'queue';
    return 'unknown';
  }

  private analyzeTrends(server: any): AIOptimizedServerData['trends'] {
    // 간단한 트렌드 분석 (실제로는 히스토리컬 데이터 필요)
    return {
      cpuTrend: server.cpu > 70 ? 'increasing' : 'stable',
      memoryTrend: server.memory > 70 ? 'increasing' : 'stable',
      alertFrequency: server.alerts || 0,
      uptimeScore: server.status === 'running' ? 0.95 : 0.5,
    };
  }

  private detectAnomaly(server: any): boolean {
    // 간단한 이상 탐지 로직
    return server.cpu > 90 || server.memory > 90 || server.status === 'error';
  }

  private predictIssues(server: any): string[] {
    const issues: string[] = [];
    if (server.cpu > 80) issues.push('CPU 과부하 위험');
    if (server.memory > 80) issues.push('메모리 부족 위험');
    if (server.disk > 90) issues.push('디스크 공간 부족');
    return issues;
  }

  private calculateConfidence(server: any): number {
    // 데이터 완전성 기반 신뢰도 계산
    let confidence = 1.0;
    if (!server.cpu) confidence -= 0.2;
    if (!server.memory) confidence -= 0.2;
    if (!server.status) confidence -= 0.3;
    return Math.max(confidence, 0.1);
  }

  private balanceAnomalyData(
    data: AIOptimizedServerData[]
  ): AIOptimizedServerData[] {
    const anomalous = data.filter(d => d.labels.isAnomalous);
    const normal = data.filter(d => !d.labels.isAnomalous);

    // 이상 데이터와 정상 데이터 비율 조정 (1:3 정도)
    const targetAnomalousCount = Math.min(
      anomalous.length,
      Math.floor(normal.length / 3)
    );
    const targetNormalCount = targetAnomalousCount * 3;

    return [
      ...anomalous.slice(0, targetAnomalousCount),
      ...normal.slice(0, targetNormalCount),
    ];
  }

  private diversifyCategories(
    data: AIOptimizedServerData[]
  ): AIOptimizedServerData[] {
    // 각 카테고리에서 균등하게 선택
    const byPerformance = new Map<string, AIOptimizedServerData[]>();
    data.forEach(d => {
      const key = d.categories.performanceLevel;
      if (!byPerformance.has(key)) byPerformance.set(key, []);
      byPerformance.get(key)!.push(d);
    });

    const result: AIOptimizedServerData[] = [];
    byPerformance.forEach(servers => {
      result.push(
        ...servers.slice(0, Math.ceil(servers.length / byPerformance.size))
      );
    });

    return result;
  }

  private analyzePerformanceDistribution(
    data: AIOptimizedServerData[]
  ): Record<string, number> {
    const total = data.length;
    if (total === 0) return {};

    const distribution: Record<string, number> = {};
    data.forEach(d => {
      const level = d.categories.performanceLevel;
      distribution[level] = (distribution[level] || 0) + 1;
    });

    // 비율로 변환
    Object.keys(distribution).forEach(key => {
      distribution[key] = distribution[key] / total;
    });

    return distribution;
  }

  private assessDataQuality(data: AIOptimizedServerData[]): {
    completeness: number;
    consistency: number;
    accuracy: number;
  } {
    if (data.length === 0)
      return { completeness: 0, consistency: 0, accuracy: 0 };

    // 완전성: 필수 필드가 모두 있는 비율
    const completeRecords = data.filter(
      d =>
        d.serverId &&
        d.normalizedMetrics.cpu !== undefined &&
        d.normalizedMetrics.memory !== undefined
    ).length;
    const completeness = completeRecords / data.length;

    // 일관성: 데이터 범위가 올바른 비율
    const consistentRecords = data.filter(
      d =>
        d.normalizedMetrics.cpu >= 0 &&
        d.normalizedMetrics.cpu <= 1 &&
        d.normalizedMetrics.memory >= 0 &&
        d.normalizedMetrics.memory <= 1
    ).length;
    const consistency = consistentRecords / data.length;

    // 정확성: 신뢰도 점수 평균
    const accuracy =
      data.reduce((sum, d) => sum + d.labels.confidenceScore, 0) / data.length;

    return { completeness, consistency, accuracy };
  }

  // 캐시 관련 메서드들
  private generateCacheKey(options: AIDataFilterOptions): string {
    return JSON.stringify(options);
  }

  private getFromCache(key: string): AIFilterResult | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private saveToCache(key: string, data: AIFilterResult): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * 📊 AI 필터 상태 조회
   */
  getStatus(): {
    cacheSize: number;
    lastProcessingTime: number;
    supportedAnalysisTypes: string[];
  } {
    return {
      cacheSize: this.cache.size,
      lastProcessingTime: 0, // 실제로는 마지막 처리 시간 저장
      supportedAnalysisTypes: [
        'anomaly_detection',
        'performance_prediction',
        'pattern_analysis',
        'recommendation',
      ],
    };
  }
}

// 싱글톤 인스턴스 export
export const aiDataFilter = AIDataFilter.getInstance();
