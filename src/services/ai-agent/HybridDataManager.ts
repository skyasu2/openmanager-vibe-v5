/**
 * 🔄 하이브리드 데이터 매니저
 *
 * 목적: AI 어시스턴트가 서버 모니터링 데이터와 AI 전용 데이터를 모두 활용
 * 특징:
 * - 서버 모니터링 데이터 (실시간, 정확성 중심)
 * - AI 전용 데이터 (분석 최적화, 패턴 인식 중심)
 * - 두 데이터 소스의 지능적 융합
 * - 컨텍스트에 따른 데이터 소스 선택
 */

import { RealServerDataGenerator } from '@/services/data-generator/RealServerDataGenerator';
import {
  aiDataFilter,
  AIDataFilterOptions,
  AIFilterResult,
} from './AIDataFilter';

export interface MonitoringData {
  // 서버 모니터링 원본 데이터
  servers: any[];
  timestamp: Date;
  source: 'monitoring';
  metadata: {
    totalServers: number;
    onlineServers: number;
    warningServers: number;
    criticalServers: number;
    lastUpdate: Date;
  };
}

export interface HybridDataRequest {
  // 요청 타입
  requestType: 'monitoring_focus' | 'ai_analysis' | 'hybrid' | 'auto_select';

  // 질의 컨텍스트
  query?: string;
  intent?: string;
  urgency?: 'low' | 'medium' | 'high' | 'critical';

  // 데이터 필터링 옵션
  monitoringFilters?: {
    status?: 'online' | 'warning' | 'offline' | 'all';
    location?: string;
    searchTerm?: string;
    limit?: number;
  };

  aiFilters?: AIDataFilterOptions;

  // 융합 설정
  fusionOptions?: {
    prioritizeRealtime?: boolean;
    includeInsights?: boolean;
    crossValidate?: boolean;
    confidenceThreshold?: number;
  };
}

export interface HybridDataResponse {
  // 융합된 데이터
  monitoringData: MonitoringData;
  aiData: AIFilterResult;

  // 융합 결과
  fusedInsights: {
    summary: string;
    keyFindings: string[];
    recommendations: string[];
    confidence: number;
  };

  // 메타데이터
  metadata: {
    dataSourcesUsed: string[];
    processingTime: number;
    fusionStrategy: string;
    dataQuality: {
      monitoring: number; // 0-1
      ai: number; // 0-1
      fusion: number; // 0-1
    };
  };

  // 디버그 정보
  debug?: {
    monitoringServerCount: number;
    aiServerCount: number;
    overlapCount: number;
    discrepancies: string[];
  };
}

export class HybridDataManager {
  private static instance: HybridDataManager | null = null;
  private dataGenerator: RealServerDataGenerator;
  private cache: Map<string, { data: HybridDataResponse; timestamp: number }> =
    new Map();
  private readonly CACHE_TTL = 20000; // 20초 (모니터링 데이터는 더 자주 갱신)

  private constructor() {
    this.dataGenerator = RealServerDataGenerator.getInstance();
    console.log('🔄 하이브리드 데이터 매니저 초기화');
  }

  public static getInstance(): HybridDataManager {
    if (!HybridDataManager.instance) {
      HybridDataManager.instance = new HybridDataManager();
    }
    return HybridDataManager.instance;
  }

  /**
   * 🎯 하이브리드 데이터 요청 처리
   */
  async processHybridRequest(
    request: HybridDataRequest
  ): Promise<HybridDataResponse> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(request);

    // 캐시 확인 (긴급한 경우 캐시 무시)
    if (request.urgency !== 'critical') {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        console.log('📦 하이브리드 데이터 캐시 히트');
        return cached;
      }
    }

    console.log('🔄 하이브리드 데이터 처리 시작', request);

    try {
      // 1. 요청 타입에 따른 전략 결정
      const strategy = this.determineDataStrategy(request);

      // 2. 병렬로 데이터 수집
      const [monitoringData, aiData] = await Promise.all([
        this.collectMonitoringData(request.monitoringFilters),
        this.collectAIData(request.aiFilters, strategy),
      ]);

      // 3. 데이터 융합
      const fusedInsights = this.fuseDataSources(
        monitoringData,
        aiData,
        request
      );

      // 4. 품질 평가
      const dataQuality = this.assessHybridQuality(monitoringData, aiData);

      // 5. 디버그 정보 생성
      const debug = this.generateDebugInfo(monitoringData, aiData);

      const processingTime = Date.now() - startTime;

      const response: HybridDataResponse = {
        monitoringData,
        aiData,
        fusedInsights,
        metadata: {
          dataSourcesUsed: strategy.sources,
          processingTime,
          fusionStrategy: strategy.name,
          dataQuality,
        },
        debug,
      };

      // 캐시 저장
      this.saveToCache(cacheKey, response);

      console.log(`✅ 하이브리드 데이터 처리 완료 (${processingTime}ms)`);

      return response;
    } catch (error) {
      console.error('❌ 하이브리드 데이터 처리 실패:', error);
      throw error;
    }
  }

  /**
   * 📊 서버 모니터링 데이터 수집
   */
  private async collectMonitoringData(
    filters?: HybridDataRequest['monitoringFilters']
  ): Promise<MonitoringData> {
    const servers = await this.dataGenerator.getAllServers();
    let filteredServers = [...servers];

    // 모니터링 필터 적용
    if (filters) {
      if (filters.status && filters.status !== 'all') {
        filteredServers = filteredServers.filter(
          s => s.status === filters.status
        );
      }

      if (filters.location) {
        filteredServers = filteredServers.filter(s =>
          s.location?.toLowerCase().includes(filters.location!.toLowerCase())
        );
      }

      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        filteredServers = filteredServers.filter(
          s =>
            s.name.toLowerCase().includes(searchLower) ||
            s.id.toLowerCase().includes(searchLower)
        );
      }

      if (filters.limit) {
        filteredServers = filteredServers.slice(0, filters.limit);
      }
    }

    // 통계 계산
    const onlineServers = servers.filter(s => s.status === 'running').length;
    const warningServers = servers.filter(s => s.status === 'warning').length;
    const criticalServers = servers.filter(s => s.status === 'error').length;

    return {
      servers: filteredServers,
      timestamp: new Date(),
      source: 'monitoring',
      metadata: {
        totalServers: servers.length,
        onlineServers,
        warningServers,
        criticalServers,
        lastUpdate: new Date(),
      },
    };
  }

  /**
   * 🤖 AI 전용 데이터 수집
   */
  private async collectAIData(
    filters?: AIDataFilterOptions,
    strategy?: any
  ): Promise<AIFilterResult> {
    const aiOptions: AIDataFilterOptions = {
      ...filters,
      // 전략에 따른 AI 옵션 조정
      analysisType: strategy?.aiAnalysisType || filters?.analysisType,
    };

    return await aiDataFilter.filterForAI(aiOptions);
  }

  /**
   * 🧠 데이터 전략 결정
   */
  private determineDataStrategy(request: HybridDataRequest): {
    name: string;
    sources: string[];
    aiAnalysisType?: string;
    priority: 'monitoring' | 'ai' | 'balanced';
  } {
    switch (request.requestType) {
      case 'monitoring_focus':
        return {
          name: 'monitoring_priority',
          sources: ['monitoring', 'ai_support'],
          priority: 'monitoring',
        };

      case 'ai_analysis':
        return {
          name: 'ai_priority',
          sources: ['ai', 'monitoring_context'],
          aiAnalysisType: request.aiFilters?.analysisType || 'pattern_analysis',
          priority: 'ai',
        };

      case 'hybrid':
        return {
          name: 'balanced_fusion',
          sources: ['monitoring', 'ai'],
          priority: 'balanced',
        };

      case 'auto_select':
      default:
        // 질의 내용과 긴급도에 따라 자동 선택
        if (request.urgency === 'critical') {
          return {
            name: 'emergency_monitoring',
            sources: ['monitoring', 'ai_quick'],
            priority: 'monitoring',
          };
        } else if (
          request.query?.includes('분석') ||
          request.query?.includes('예측') ||
          request.query?.includes('패턴')
        ) {
          return {
            name: 'analysis_focused',
            sources: ['ai', 'monitoring'],
            aiAnalysisType: 'pattern_analysis',
            priority: 'ai',
          };
        } else {
          return {
            name: 'balanced_auto',
            sources: ['monitoring', 'ai'],
            priority: 'balanced',
          };
        }
    }
  }

  /**
   * 🔗 데이터 소스 융합
   */
  private fuseDataSources(
    monitoringData: MonitoringData,
    aiData: AIFilterResult,
    request: HybridDataRequest
  ): HybridDataResponse['fusedInsights'] {
    const insights: string[] = [];
    const recommendations: string[] = [];

    // 모니터링 데이터 기반 인사이트
    const { metadata } = monitoringData;
    if (metadata.criticalServers > 0) {
      insights.push(
        `실시간 모니터링: ${metadata.criticalServers}개 서버가 심각한 상태입니다`
      );
      recommendations.push('즉시 심각한 상태의 서버들을 점검하세요');
    }

    if (metadata.warningServers > metadata.totalServers * 0.3) {
      insights.push(
        `경고 상태 서버 비율이 ${Math.round((metadata.warningServers / metadata.totalServers) * 100)}%로 높습니다`
      );
    }

    // AI 데이터 기반 인사이트 추가
    insights.push(...aiData.insights.patterns);
    insights.push(...aiData.insights.anomalies);
    recommendations.push(...aiData.insights.recommendations);

    // 교차 검증
    const crossValidation = this.crossValidateData(monitoringData, aiData);
    if (crossValidation.discrepancies.length > 0) {
      insights.push(
        `데이터 불일치 감지: ${crossValidation.discrepancies.length}개 항목`
      );
    }

    // 종합 요약 생성
    const summary = this.generateFusedSummary(monitoringData, aiData, insights);

    // 신뢰도 계산
    const confidence = this.calculateFusionConfidence(
      monitoringData,
      aiData,
      crossValidation
    );

    return {
      summary,
      keyFindings: insights.slice(0, 5), // 상위 5개만
      recommendations: recommendations.slice(0, 3), // 상위 3개만
      confidence,
    };
  }

  /**
   * 📝 융합 요약 생성
   */
  private generateFusedSummary(
    monitoringData: MonitoringData,
    aiData: AIFilterResult,
    insights: string[]
  ): string {
    const { metadata } = monitoringData;
    const healthyRatio =
      ((metadata.totalServers -
        metadata.criticalServers -
        metadata.warningServers) /
        metadata.totalServers) *
      100;

    let summary = `전체 ${metadata.totalServers}개 서버 중 ${Math.round(healthyRatio)}%가 정상 상태입니다. `;

    if (metadata.criticalServers > 0) {
      summary += `${metadata.criticalServers}개 서버에 즉시 조치가 필요하며, `;
    }

    if (aiData.insights.anomalies.length > 0) {
      summary += `AI 분석 결과 ${aiData.data.filter(d => d.labels.isAnomalous).length}개 서버에서 이상 패턴이 감지되었습니다. `;
    }

    if (insights.length > 0) {
      summary += `주요 발견사항 ${insights.length}개를 확인했습니다.`;
    }

    return summary;
  }

  /**
   * 🔍 교차 검증
   */
  private crossValidateData(
    monitoringData: MonitoringData,
    aiData: AIFilterResult
  ): {
    matches: number;
    discrepancies: string[];
    confidence: number;
  } {
    const discrepancies: string[] = [];
    let matches = 0;

    // 서버 상태 교차 검증
    const monitoringServers = new Map(
      monitoringData.servers.map(s => [s.id, s])
    );
    const aiServers = new Map(aiData.data.map(s => [s.serverId, s]));

    for (const [serverId, monitoringServer] of monitoringServers) {
      const aiServer = aiServers.get(serverId);
      if (aiServer) {
        // 상태 일치 확인
        const monitoringCritical = monitoringServer.status === 'error';
        const aiCritical = aiServer.categories.riskLevel === 'critical';

        if (monitoringCritical === aiCritical) {
          matches++;
        } else {
          discrepancies.push(
            `${serverId}: 모니터링(${monitoringServer.status}) vs AI(${aiServer.categories.riskLevel})`
          );
        }
      }
    }

    const totalComparisons = Math.min(monitoringServers.size, aiServers.size);
    const confidence = totalComparisons > 0 ? matches / totalComparisons : 0;

    return { matches, discrepancies, confidence };
  }

  /**
   * 📊 하이브리드 품질 평가
   */
  private assessHybridQuality(
    monitoringData: MonitoringData,
    aiData: AIFilterResult
  ): {
    monitoring: number;
    ai: number;
    fusion: number;
  } {
    // 모니터링 데이터 품질 (실시간성, 완전성)
    const monitoringQuality = monitoringData.servers.length > 0 ? 0.9 : 0.1; // 간단한 평가

    // AI 데이터 품질
    const aiQuality =
      (aiData.metadata.dataQuality.completeness +
        aiData.metadata.dataQuality.consistency +
        aiData.metadata.dataQuality.accuracy) /
      3;

    // 융합 품질 (두 데이터 소스의 조화)
    const fusionQuality = (monitoringQuality + aiQuality) / 2;

    return {
      monitoring: monitoringQuality,
      ai: aiQuality,
      fusion: fusionQuality,
    };
  }

  /**
   * 🔢 융합 신뢰도 계산
   */
  private calculateFusionConfidence(
    monitoringData: MonitoringData,
    aiData: AIFilterResult,
    crossValidation: any
  ): number {
    // 기본 신뢰도
    let confidence = 0.7;

    // 데이터 양에 따른 조정
    if (monitoringData.servers.length > 10) confidence += 0.1;
    if (aiData.data.length > 10) confidence += 0.1;

    // 교차 검증 결과에 따른 조정
    if (crossValidation.confidence > 0.8) confidence += 0.1;
    else if (crossValidation.confidence < 0.5) confidence -= 0.2;

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  /**
   * 🐛 디버그 정보 생성
   */
  private generateDebugInfo(
    monitoringData: MonitoringData,
    aiData: AIFilterResult
  ): HybridDataResponse['debug'] {
    const monitoringServerIds = new Set(monitoringData.servers.map(s => s.id));
    const aiServerIds = new Set(aiData.data.map(s => s.serverId));

    const overlapCount = [...monitoringServerIds].filter(id =>
      aiServerIds.has(id)
    ).length;

    const discrepancies: string[] = [];
    // 간단한 불일치 검사
    if (monitoringData.servers.length !== aiData.data.length) {
      discrepancies.push(
        `서버 수 불일치: 모니터링(${monitoringData.servers.length}) vs AI(${aiData.data.length})`
      );
    }

    return {
      monitoringServerCount: monitoringData.servers.length,
      aiServerCount: aiData.data.length,
      overlapCount,
      discrepancies,
    };
  }

  // 캐시 관련 메서드들
  private generateCacheKey(request: HybridDataRequest): string {
    return JSON.stringify({
      type: request.requestType,
      urgency: request.urgency,
      monitoringFilters: request.monitoringFilters,
      aiFilters: request.aiFilters,
    });
  }

  private getFromCache(key: string): HybridDataResponse | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private saveToCache(key: string, data: HybridDataResponse): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * 📊 하이브리드 매니저 상태 조회
   */
  getStatus(): {
    cacheSize: number;
    supportedRequestTypes: string[];
    lastProcessingTime: number;
  } {
    return {
      cacheSize: this.cache.size,
      supportedRequestTypes: [
        'monitoring_focus',
        'ai_analysis',
        'hybrid',
        'auto_select',
      ],
      lastProcessingTime: 0, // 실제로는 마지막 처리 시간 저장
    };
  }
}

// 싱글톤 인스턴스 export
export const hybridDataManager = HybridDataManager.getInstance();
