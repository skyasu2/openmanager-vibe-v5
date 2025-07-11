import { GCPRealDataService } from '@/services/gcp/GCPRealDataService';
/**
 * 🎯 데이터 처리 중앙 오케스트레이터
 *
 * 모든 데이터 처리 요청을 중앙에서 관리하고 적절한 전략으로 라우팅
 * - 단일 책임: 데이터 처리 흐름 제어
 * - 전략 패턴: 요청 타입별 처리 전략 선택
 * - 성능 최적화: 캐싱 및 병렬 처리
 */

import { AIDataFilterOptions } from './AIDataFilter';
import { ErrorHandlingMiddleware } from './ErrorHandlingMiddleware';
import { StrategyFactory } from './StrategyFactory';
import { UnifiedCacheManager } from './UnifiedCacheManager';

export interface OrchestratorRequest {
  requestId: string;
  requestType: 'monitoring_focus' | 'ai_analysis' | 'hybrid' | 'auto_select';
  query: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  filters?: {
    monitoring?: any;
    ai?: AIDataFilterOptions;
  };
  options?: {
    useCache?: boolean;
    timeout?: number;
    confidenceThreshold?: number;
  };
  context?: {
    sessionId?: string;
    userId?: string;
    source?: string;
  };
}

export interface OrchestratorResponse {
  requestId: string;
  success: boolean;
  data?: any;
  metadata: {
    strategy: string;
    processingTime: number;
    cacheHit: boolean;
    dataQuality: number;
    confidence: number;
  };
  performance: {
    totalTime: number;
    strategyTime: number;
    cacheTime: number;
    validationTime: number;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export class DataProcessingOrchestrator {
  private static instance: DataProcessingOrchestrator | null = null;
  private strategyFactory: StrategyFactory;
  private cacheManager: UnifiedCacheManager;
  private errorHandler: ErrorHandlingMiddleware;
  private dataGenerator: RealServerDataGenerator;

  private constructor() {
    this.strategyFactory = StrategyFactory.getInstance();
    this.cacheManager = UnifiedCacheManager.getInstance();
    this.errorHandler = ErrorHandlingMiddleware.getInstance();
    this.dataGenerator = GCPRealDataService.getInstance();
  }

  static getInstance(): DataProcessingOrchestrator {
    if (!DataProcessingOrchestrator.instance) {
      DataProcessingOrchestrator.instance = new DataProcessingOrchestrator();
    }
    return DataProcessingOrchestrator.instance;
  }

  /**
   * 🎯 메인 처리 메서드 - 모든 데이터 요청의 진입점
   */
  async processRequest(
    request: OrchestratorRequest
  ): Promise<OrchestratorResponse> {
    const startTime = Date.now();
    const { requestId } = request;

    try {
      console.log(`🚀 [${requestId}] 데이터 처리 시작: ${request.requestType}`);

      // 1. 입력 검증
      const validationStart = Date.now();
      await this.validateRequest(request);
      const validationTime = Date.now() - validationStart;

      // 2. 캐시 확인
      const cacheStart = Date.now();
      const cachedResult = await this.checkCache(request);
      const cacheTime = Date.now() - cacheStart;

      if (cachedResult) {
        console.log(`⚡ [${requestId}] 캐시 히트: ${cacheTime}ms`);
        return this.formatResponse(request, cachedResult, {
          totalTime: Date.now() - startTime,
          strategyTime: 0,
          cacheTime,
          validationTime,
          cacheHit: true,
        });
      }

      // 3. 전략 선택 및 실행
      const strategyStart = Date.now();
      const strategy = await this.strategyFactory.selectStrategy(request);
      const result = await strategy.execute(request);
      const strategyTime = Date.now() - strategyStart;

      // 4. 결과 캐싱
      await this.cacheResult(request, result);

      // 5. 응답 포맷팅
      const response = this.formatResponse(request, result, {
        totalTime: Date.now() - startTime,
        strategyTime,
        cacheTime,
        validationTime,
        cacheHit: false,
      });

      console.log(
        `✅ [${requestId}] 처리 완료: ${response.metadata.processingTime}ms`
      );
      return response;
    } catch (error) {
      console.error(`❌ [${requestId}] 처리 실패:`, error);
      const errorResponse = this.errorHandler.handleError(
        request,
        error,
        Date.now() - startTime
      );

      // ErrorResponse를 OrchestratorResponse 형태로 변환
      return {
        requestId: errorResponse.requestId,
        success: false,
        data: null,
        metadata: {
          strategy: errorResponse.metadata.strategy,
          processingTime: errorResponse.metadata.processingTime,
          cacheHit: errorResponse.metadata.cacheHit,
          dataQuality: errorResponse.metadata.dataQuality,
          confidence: errorResponse.metadata.confidence,
        },
        performance: errorResponse.performance,
        error: errorResponse.error,
      };
    }
  }

  /**
   * 📝 입력 검증
   */
  private async validateRequest(request: OrchestratorRequest): Promise<void> {
    if (!request.requestId || !request.query?.trim()) {
      throw new Error('필수 필드가 누락되었습니다');
    }

    if (
      !['monitoring_focus', 'ai_analysis', 'hybrid', 'auto_select'].includes(
        request.requestType
      )
    ) {
      throw new Error('지원하지 않는 요청 타입입니다');
    }

    if (request.query.length > 1000) {
      throw new Error('질의가 너무 깁니다 (최대 1000자)');
    }
  }

  /**
   * 💾 캐시 확인
   */
  private async checkCache(request: OrchestratorRequest): Promise<any | null> {
    if (request.options?.useCache === false) {
      return null;
    }

    const cacheKey = this.generateCacheKey(request);
    return await this.cacheManager.get(cacheKey);
  }

  /**
   * 💾 결과 캐싱
   */
  private async cacheResult(
    request: OrchestratorRequest,
    result: any
  ): Promise<void> {
    if (request.options?.useCache !== false) {
      const cacheKey = this.generateCacheKey(request);
      const ttl = this.calculateCacheTTL(request);
      await this.cacheManager.set(cacheKey, result, ttl);
    }
  }

  /**
   * 📊 응답 포맷팅
   */
  private formatResponse(
    request: OrchestratorRequest,
    result: any,
    performance: OrchestratorResponse['performance'] & { cacheHit: boolean }
  ): OrchestratorResponse {
    return {
      requestId: request.requestId,
      success: true,
      data: result,
      metadata: {
        strategy: result.strategy || 'unknown',
        processingTime: performance.totalTime,
        cacheHit: performance.cacheHit,
        dataQuality: result.dataQuality || 0.8,
        confidence: result.confidence || 0.7,
      },
      performance: {
        totalTime: performance.totalTime,
        strategyTime: performance.strategyTime,
        cacheTime: performance.cacheTime,
        validationTime: performance.validationTime,
      },
    };
  }

  /**
   * 🔑 캐시 키 생성
   */
  private generateCacheKey(request: OrchestratorRequest): string {
    const keyParts = [
      request.requestType,
      request.query.slice(0, 50),
      JSON.stringify(request.filters || {}),
      request.urgency,
    ];
    return `orchestrator:${Buffer.from(keyParts.join('|')).toString('base64')}`;
  }

  /**
   * ⏰ 캐시 TTL 계산
   */
  private calculateCacheTTL(request: OrchestratorRequest): number {
    switch (request.urgency) {
      case 'critical':
        return 5000; // 5초
      case 'high':
        return 15000; // 15초
      case 'medium':
        return 30000; // 30초
      case 'low':
        return 60000; // 1분
      default:
        return 30000;
    }
  }

  /**
   * 📊 시스템 상태 조회
   */
  async getSystemStatus(): Promise<any> {
    return {
      orchestrator: {
        status: 'active',
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
      },
      cache: await this.cacheManager.getRealServerMetrics().then(r => ({ status: r.success ? 'active' : 'error' })),
      strategies: await this.strategyFactory.getRealServerMetrics().then(r => ({ status: r.success ? 'active' : 'error' })),
      dataGenerator: {
        status: 'active',
        serverCount: (await this.dataGenerator.getRealServerMetrics().then(response => response.data)).length,
      },
    };
  }
}

export const dataProcessingOrchestrator =
  DataProcessingOrchestrator.getInstance();
