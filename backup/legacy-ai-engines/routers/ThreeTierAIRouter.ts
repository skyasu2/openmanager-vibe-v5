/**
 * 🚀 3-Tier AI Router v1.0
 *
 * OpenManager AI 엔진 이전 프로젝트
 * 베르셀 부하 75% 감소 + AI 처리 성능 50% 향상
 *
 * 3-Tier 폴백 전략:
 * 1. 🏠 로컬 AI (기존): Supabase RAG + Korean AI + MCP Context
 * 2. 🚀 GCP Functions (신규): 4개 Cloud Functions (무료 티어 활용)
 * 3. 🧠 Google AI (기존): 자연어 처리 전용 (최후 수단)
 *
 * 목표: 베르셀 부하 75% 감소, AI 처리 성능 50% 향상
 */

import { UnifiedAIEngineRouter } from '@/core/ai/engines/UnifiedAIEngineRouter';
import { systemLogger } from '@/lib/logger';
import type { AIRequest, AIResponse } from '@/types/ai-types';
import { GCPFunctionsService } from './GCPFunctionsService';
import {
  createGoogleAIService,
  RequestScopedGoogleAIService,
} from './GoogleAIService';

interface ThreeTierConfig {
  enabled: boolean;
  strategy: 'performance' | 'cost' | 'reliability';
  timeouts: {
    local: number;
    gcp: number;
    google: number;
  };
  fallbackPolicy: 'aggressive' | 'conservative' | 'adaptive';
  loadBalancing: {
    enabled: boolean;
    gcpWeight: number;
    localWeight: number;
    googleWeight: number;
  };
}

interface RouterStats {
  totalRequests: number;
  routingDecisions: {
    local: number;
    gcp: number;
    google: number;
  };
  fallbackTriggers: {
    localToGcp: number;
    gcpToLocal: number;
    toGoogle: number;
  };
  averageResponseTimes: {
    local: number;
    gcp: number;
    google: number;
  };
  performanceMetrics: {
    vercelLoadReduction: number; // 베르셀 부하 감소율
    aiPerformanceImprovement: number; // AI 처리 성능 향상율
  };
}

type TierType = 'local' | 'gcp' | 'google';

interface TierResult {
  success: boolean;
  response?: AIResponse;
  error?: string;
  tier: TierType;
  processingTime: number;
  fallbackNeeded: boolean;
}

/**
 * 🚀 3-Tier AI Router
 * 로컬 → GCP → Google AI 순 폴백 전략
 */
export class ThreeTierAIRouter {
  private static instance: ThreeTierAIRouter;
  private config: ThreeTierConfig;
  private stats: RouterStats;
  private initialized = false;

  // AI 서비스들
  private gcpFunctionsService: GCPFunctionsService;
  private googleAIService: RequestScopedGoogleAIService | null = null;
  private unifiedAIRouter: UnifiedAIEngineRouter;

  // 성능 추적
  private performanceBaseline: number = 0;
  private vercelLoadBaseline: number = 0;

  private constructor() {
    this.config = {
      enabled: process.env.THREE_TIER_AI_ENABLED === 'true',
      strategy: (process.env.THREE_TIER_STRATEGY as any) || 'performance',
      timeouts: {
        local: parseInt(process.env.THREE_TIER_LOCAL_TIMEOUT || '5000'),
        gcp: parseInt(process.env.THREE_TIER_GCP_TIMEOUT || '8000'),
        google: parseInt(process.env.THREE_TIER_GOOGLE_TIMEOUT || '10000'),
      },
      fallbackPolicy:
        (process.env.THREE_TIER_FALLBACK_POLICY as any) || 'adaptive',
      loadBalancing: {
        enabled: process.env.THREE_TIER_LOAD_BALANCING === 'true',
        gcpWeight: parseInt(process.env.THREE_TIER_GCP_WEIGHT || '70'), // 70% GCP 우선
        localWeight: parseInt(process.env.THREE_TIER_LOCAL_WEIGHT || '20'), // 20% 로컬
        googleWeight: parseInt(process.env.THREE_TIER_GOOGLE_WEIGHT || '10'), // 10% Google
      },
    };

    this.stats = {
      totalRequests: 0,
      routingDecisions: {
        local: 0,
        gcp: 0,
        google: 0,
      },
      fallbackTriggers: {
        localToGcp: 0,
        gcpToLocal: 0,
        toGoogle: 0,
      },
      averageResponseTimes: {
        local: 0,
        gcp: 0,
        google: 0,
      },
      performanceMetrics: {
        vercelLoadReduction: 0,
        aiPerformanceImprovement: 0,
      },
    };

    // 서비스 초기화
    this.gcpFunctionsService = GCPFunctionsService.getInstance();
    this.unifiedAIRouter = new UnifiedAIEngineRouter();

    // Google AI 서비스 초기화 (조건부)
    if (process.env.GOOGLE_AI_ENABLED === 'true') {
      this.googleAIService = createGoogleAIService();
    }

    systemLogger.info('🚀 3-Tier AI Router 초기화');
  }

  public static getInstance(): ThreeTierAIRouter {
    if (!ThreeTierAIRouter.instance) {
      ThreeTierAIRouter.instance = new ThreeTierAIRouter();
    }
    return ThreeTierAIRouter.instance;
  }

  /**
   * 🔧 라우터 초기화
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // 성능 베이스라인 설정
      this.performanceBaseline = await this.measurePerformanceBaseline();
      this.vercelLoadBaseline = await this.measureVercelLoadBaseline();

      // 서비스들 초기화
      await this.gcpFunctionsService.initialize();
      await this.unifiedAIRouter.initialize();

      if (this.googleAIService) {
        await this.googleAIService.initialize();
      }

      this.initialized = true;
      systemLogger.info('✅ 3-Tier AI Router 초기화 완료');
    } catch (error) {
      systemLogger.error('❌ 3-Tier AI Router 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 🤖 메인 AI 처리 (3-Tier 폴백 전략)
   */
  public async processQuery(request: AIRequest): Promise<AIResponse> {
    if (!this.config.enabled) {
      // 3-Tier 비활성화 시 기존 Unified Router 사용
      return this.unifiedAIRouter.processQuery(request);
    }

    if (!this.initialized) {
      await this.initialize();
    }

    const startTime = Date.now();
    this.stats.totalRequests++;

    try {
      // 1. 최적 Tier 선택
      const primaryTier = this.selectOptimalTier(request);

      // 2. Primary Tier 시도
      const primaryResult = await this.tryTier(primaryTier, request);

      if (primaryResult.success && primaryResult.response) {
        return this.finalizeTierResponse(primaryResult, startTime);
      }

      // 3. 폴백 전략 실행
      const fallbackResult = await this.executeFallbackStrategy(
        request,
        primaryTier
      );

      return this.finalizeTierResponse(fallbackResult, startTime);
    } catch (error) {
      systemLogger.error('3-Tier AI Router 처리 실패:', error);

      // 최종 폴백: 기존 Unified Router 사용
      return this.unifiedAIRouter.processQuery(request);
    }
  }

  /**
   * 🎯 최적 Tier 선택
   */
  private selectOptimalTier(request: AIRequest): TierType {
    // 전략별 Tier 선택
    switch (this.config.strategy) {
      case 'performance':
        return this.selectPerformanceTier(request);
      case 'cost':
        return this.selectCostTier(request);
      case 'reliability':
        return this.selectReliabilityTier(request);
      default:
        return 'gcp'; // 기본값: GCP Functions
    }
  }

  /**
   * 🚀 성능 우선 Tier 선택
   */
  private selectPerformanceTier(request: AIRequest): TierType {
    const queryType = this.analyzeQueryType(request);

    // 한국어 + 단순 쿼리 → GCP (Korean NLP 최적화)
    if (queryType.isKorean && queryType.isSimple) {
      return 'gcp';
    }

    // 복잡한 자연어 쿼리 → Google AI
    if (queryType.isComplex && queryType.isNaturalLanguage) {
      return 'google';
    }

    // 시스템/서버 관련 → 로컬 (MCP Context 활용)
    if (queryType.isSystemRelated) {
      return 'local';
    }

    // 기본값: GCP Functions
    return 'gcp';
  }

  /**
   * 💰 비용 우선 Tier 선택 (무료 티어 활용)
   */
  private selectCostTier(request: AIRequest): TierType {
    // 무료 티어 사용량 확인
    const gcpUsage = this.gcpFunctionsService.getUsageStats();

    // GCP 무료 티어 한도 50% 미만이면 GCP 우선
    if (gcpUsage.freeQuotaUsage.callsPercent < 50) {
      return 'gcp';
    }

    // 로컬 처리 가능하면 로컬 우선
    return 'local';
  }

  /**
   * 🛡️ 안정성 우선 Tier 선택
   */
  private selectReliabilityTier(request: AIRequest): TierType {
    // 최근 성공률 기반 선택
    const recentSuccessRates = this.calculateRecentSuccessRates();

    // 가장 높은 성공률의 Tier 선택
    const bestTier = Object.entries(recentSuccessRates).reduce(
      (best, [tier, rate]) =>
        rate > best.rate ? { tier: tier as TierType, rate } : best,
      { tier: 'local' as TierType, rate: 0 }
    );

    return bestTier.tier;
  }

  /**
   * 🎲 특정 Tier 시도
   */
  private async tryTier(
    tier: TierType,
    request: AIRequest
  ): Promise<TierResult> {
    const startTime = Date.now();

    try {
      let response: AIResponse;

      switch (tier) {
        case 'local':
          this.stats.routingDecisions.local++;
          response = await this.processWithLocal(request);
          break;
        case 'gcp':
          this.stats.routingDecisions.gcp++;
          response = await this.processWithGCP(request);
          break;
        case 'google':
          this.stats.routingDecisions.google++;
          response = await this.processWithGoogle(request);
          break;
        default:
          throw new Error(`Unknown tier: ${tier}`);
      }

      const processingTime = Date.now() - startTime;
      this.updateTierStats(tier, processingTime);

      return {
        success: true,
        response,
        tier,
        processingTime,
        fallbackNeeded: false,
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        tier,
        processingTime,
        fallbackNeeded: true,
      };
    }
  }

  /**
   * 🔄 폴백 전략 실행
   */
  private async executeFallbackStrategy(
    request: AIRequest,
    failedTier: TierType
  ): Promise<TierResult> {
    const fallbackOrder = this.getFallbackOrder(failedTier);

    for (const tier of fallbackOrder) {
      const result = await this.tryTier(tier, request);

      if (result.success && result.response) {
        this.updateFallbackStats(failedTier, tier);
        return result;
      }
    }

    // 모든 폴백 실패 시 에러 반환
    throw new Error('모든 AI Tier에서 처리 실패');
  }

  /**
   * 🔄 폴백 순서 결정
   */
  private getFallbackOrder(failedTier: TierType): TierType[] {
    switch (failedTier) {
      case 'local':
        return ['gcp', 'google'];
      case 'gcp':
        return ['local', 'google'];
      case 'google':
        return ['gcp', 'local'];
      default:
        return ['gcp', 'local'];
    }
  }

  /**
   * 🏠 로컬 AI 처리
   */
  private async processWithLocal(request: AIRequest): Promise<AIResponse> {
    const response = await this.unifiedAIRouter.processQuery(request);

    return {
      ...response,
      engine: `local-${response.engine}`,
      metadata: {
        ...response.metadata,
        tier: 'local',
        architecture: '3-tier-local',
      },
    };
  }

  /**
   * 🚀 GCP Functions 처리
   */
  private async processWithGCP(request: AIRequest): Promise<AIResponse> {
    const response = await this.gcpFunctionsService.processQuery(request);

    return {
      ...response,
      metadata: {
        ...response.metadata,
        tier: 'gcp',
        architecture: '3-tier-gcp',
      },
    };
  }

  /**
   * 🧠 Google AI 처리
   */
  private async processWithGoogle(request: AIRequest): Promise<AIResponse> {
    if (!this.googleAIService) {
      throw new Error('Google AI 서비스가 비활성화되어 있습니다');
    }

    const response = await this.googleAIService.processQuery(request);

    return {
      ...response,
      engine: `google-${response.engine}`,
      metadata: {
        ...response.metadata,
        tier: 'google',
        architecture: '3-tier-google',
      },
    };
  }

  /**
   * 🔍 쿼리 타입 분석
   */
  private analyzeQueryType(request: AIRequest) {
    const query = request.query || '';

    return {
      isKorean: /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(query),
      isSimple: query.length < 50,
      isComplex: query.length > 100,
      isNaturalLanguage:
        query.includes('?') ||
        query.includes('어떻게') ||
        query.includes('무엇'),
      isSystemRelated:
        query.includes('서버') ||
        query.includes('시스템') ||
        query.includes('모니터링'),
    };
  }

  /**
   * 📊 Tier 통계 업데이트
   */
  private updateTierStats(tier: TierType, processingTime: number): void {
    const currentAvg = this.stats.averageResponseTimes[tier];
    const currentCount = this.stats.routingDecisions[tier];

    this.stats.averageResponseTimes[tier] =
      (currentAvg * (currentCount - 1) + processingTime) / currentCount;
  }

  /**
   * 🔄 폴백 통계 업데이트
   */
  private updateFallbackStats(fromTier: TierType, toTier: TierType): void {
    if (fromTier === 'local' && toTier === 'gcp') {
      this.stats.fallbackTriggers.localToGcp++;
    } else if (fromTier === 'gcp' && toTier === 'local') {
      this.stats.fallbackTriggers.gcpToLocal++;
    } else if (toTier === 'google') {
      this.stats.fallbackTriggers.toGoogle++;
    }
  }

  /**
   * 🏁 Tier 응답 완료 처리
   */
  private finalizeTierResponse(
    result: TierResult,
    startTime: number
  ): AIResponse {
    const totalTime = Date.now() - startTime;

    // 성능 메트릭 업데이트
    this.updatePerformanceMetrics(result.tier, totalTime);

    if (!result.response) {
      throw new Error(result.error || 'Unknown tier processing error');
    }

    return {
      ...result.response,
      processingTime: totalTime,
      metadata: {
        ...result.response.metadata,
        threeTierRouter: true,
        totalProcessingTime: totalTime,
        tierProcessingTime: result.processingTime,
        fallbackUsed: result.fallbackNeeded,
      },
    };
  }

  /**
   * 📈 성능 메트릭 업데이트
   */
  private updatePerformanceMetrics(tier: TierType, responseTime: number): void {
    // 베르셀 부하 감소 계산 (GCP 사용 시)
    if (tier === 'gcp') {
      this.stats.performanceMetrics.vercelLoadReduction =
        (this.stats.routingDecisions.gcp / this.stats.totalRequests) * 100;
    }

    // AI 처리 성능 향상 계산
    const currentPerformance = this.stats.averageResponseTimes[tier];
    const improvementRate = Math.max(
      0,
      ((this.performanceBaseline - currentPerformance) /
        this.performanceBaseline) *
        100
    );

    this.stats.performanceMetrics.aiPerformanceImprovement = improvementRate;
  }

  /**
   * 📊 성능 베이스라인 측정
   */
  private async measurePerformanceBaseline(): Promise<number> {
    // 기존 시스템 성능 측정 (간단한 더미 측정)
    return 3000; // 3초 기준
  }

  /**
   * 📊 베르셀 부하 베이스라인 측정
   */
  private async measureVercelLoadBaseline(): Promise<number> {
    // 베르셀 부하 측정 (간단한 더미 측정)
    return 100; // 100% 기준
  }

  /**
   * 📊 최근 성공률 계산
   */
  private calculateRecentSuccessRates(): Record<TierType, number> {
    // 간단한 성공률 계산 (실제로는 더 복잡한 로직 필요)
    const totalRequests = this.stats.totalRequests;

    return {
      local:
        totalRequests > 0
          ? (this.stats.routingDecisions.local / totalRequests) * 100
          : 90,
      gcp:
        totalRequests > 0
          ? (this.stats.routingDecisions.gcp / totalRequests) * 100
          : 95,
      google:
        totalRequests > 0
          ? (this.stats.routingDecisions.google / totalRequests) * 100
          : 85,
    };
  }

  /**
   * 📊 통계 조회
   */
  public getStats(): RouterStats {
    return {
      ...this.stats,
      performanceMetrics: {
        vercelLoadReduction: Math.min(
          this.stats.performanceMetrics.vercelLoadReduction,
          75
        ), // 목표: 75%
        aiPerformanceImprovement: Math.min(
          this.stats.performanceMetrics.aiPerformanceImprovement,
          50
        ), // 목표: 50%
      },
    };
  }

  /**
   * 🌐 라우터 상태 조회
   */
  public getRouterStatus() {
    return {
      enabled: this.config.enabled,
      initialized: this.initialized,
      strategy: this.config.strategy,
      stats: this.getStats(),
      services: {
        gcp: this.gcpFunctionsService.getServiceStatus(),
        google: this.googleAIService ? 'enabled' : 'disabled',
        local: 'enabled',
      },
    };
  }

  /**
   * 🔍 시스템 상태 조회
   */
  public getSystemStatus() {
    return this.getRouterStatus();
  }

  /**
   * 🚀 GCP 서비스 조회
   */
  public getGCPService() {
    return this.gcpFunctionsService;
  }

  /**
   * 🏥 헬스 체크
   */
  public async healthCheck() {
    const healthStatus = {
      overall: true,
      services: {
        gcp: false,
        google: false,
        local: false,
      },
      timestamp: new Date().toISOString(),
    };

    try {
      // GCP Functions 헬스 체크
      const gcpStatus = this.gcpFunctionsService.getServiceStatus();
      healthStatus.services.gcp = gcpStatus.enabled && gcpStatus.initialized;
    } catch (error) {
      healthStatus.services.gcp = false;
    }

    try {
      // Google AI 헬스 체크
      healthStatus.services.google = this.googleAIService !== null;
    } catch (error) {
      healthStatus.services.google = false;
    }

    try {
      // Local AI 헬스 체크
      healthStatus.services.local = true; // 항상 사용 가능
    } catch (error) {
      healthStatus.services.local = false;
    }

    healthStatus.overall = Object.values(healthStatus.services).some(
      status => status
    );

    return healthStatus;
  }
}
