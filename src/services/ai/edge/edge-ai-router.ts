/**
 * 🚀 Edge AI Router
 *
 * Vercel Edge Runtime에서 실행되는 고성능 AI 라우터
 * - 분산 서비스 직접 통신
 * - 병렬 처리 최적화
 * - Circuit Breaker 패턴
 * - 지능형 폴백 체인
 */

import type {
  EdgeRouterConfig,
  EdgeRouterRequest,
  EdgeRouterResponse,
  DistributedResponse,
  AIServiceType,
  ServiceHealth,
  ThinkingStep,
} from '../interfaces/distributed-ai.interface';

import {
  supabaseRAGAdapter,
  gcpFunctionsAdapter,
} from '../adapters/service-adapters';

import { edgeCache } from './edge-cache';

import { distributedErrorHandler } from '../errors/distributed-error-handler';
import { unifiedResponseFormatter } from '../formatters/unified-response-formatter';

// Node.js Runtime 사용 (안정성 우선)
// Edge Runtime 제거: Vercel 경고 해결 및 안정성 확보
export const preferredRegion = 'icn1'; // 서울 리전

/**
 * Circuit Breaker 상태
 */
interface CircuitBreakerState {
  failureCount: number;
  lastFailureTime: number;
  state: 'closed' | 'open' | 'half-open';
  successCount: number;
}

/**
 * Edge AI Router 클래스
 */
export class EdgeAIRouter {
  private config: EdgeRouterConfig;
  private circuitBreakers: Map<AIServiceType, CircuitBreakerState>;
  private serviceHealth: Map<AIServiceType, ServiceHealth>;

  constructor(config?: Partial<EdgeRouterConfig>) {
    this.config = {
      enableParallel: true,
      maxConcurrency: 3,
      globalTimeout: 10000, // 10초
      serviceTimeouts: {
        'supabase-rag': 3000,
        'gcp-korean-nlp': 5000,
        'gcp-ml-analytics': 5000,
      },
      circuitBreaker: {
        enabled: true,
        failureThreshold: 3,
        resetTimeout: 60000, // 1분
      },
      caching: {
        enabled: true,
        ttl: 300, // 5분
        maxSize: 100,
      },
      ...config,
    };

    this.circuitBreakers = new Map();
    this.serviceHealth = new Map();

    // 서비스 초기화
    this.initializeServices();
  }

  /**
   * 메인 라우팅 메서드
   */
  async route(request: EdgeRouterRequest): Promise<EdgeRouterResponse> {
    const startTime = Date.now();
    const results = new Map<AIServiceType, DistributedResponse>();
    const routingPath: string[] = []; // Changed from AIServiceType[] to string[]

    try {
      // 1. Edge 캐시 확인 (빠른 응답)
      if (this.config.caching.enabled) {
        const cachedResponse = await this.checkCache(request);
        if (cachedResponse) {
          routingPath.push('cache_hit');

          // 캐시된 응답이 있으면 캐시된 서비스 정보 사용
          if (cachedResponse.success && cachedResponse.data) {
            results.set(cachedResponse.metadata.service, cachedResponse);
            return {
              results,
              routingPath,
              totalProcessingTime: Date.now() - startTime,
            };
          }
        }
      }

      // 2. 병렬 또는 순차 처리
      if (request.parallel && this.config.enableParallel) {
        await this.processParallel(request, results, routingPath);
      } else {
        await this.processSequential(request, results, routingPath);
      }

      // 3. 폴백 체인 처리
      if (!this.hasSuccessfulResult(results) && request.fallbackChain) {
        await this.processFallbackChain(request, results, routingPath);
      }

      // 4. 캐시 업데이트
      if (this.config.caching.enabled && this.hasSuccessfulResult(results)) {
        await this.updateCache(request, results);
      }

      return {
        results,
        routingPath,
        totalProcessingTime: Date.now() - startTime,
      };
    } catch (error) {
      // 글로벌 에러 처리
      const globalError = distributedErrorHandler.createDistributedError(
        error,
        'edge-router'
      );

      results.set('edge-router', {
        id: request.id,
        success: false,
        error: globalError,
        metadata: {
          service: 'edge-router',
          processingTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        },
      });

      return {
        results,
        routingPath,
        totalProcessingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * 병렬 처리
   */
  private async processParallel(
    request: EdgeRouterRequest,
    results: Map<AIServiceType, DistributedResponse>,
    routingPath: string[]
  ): Promise<void> {
    const promises: Promise<void>[] = [];
    const processedServices = new Set<AIServiceType>();

    // 서비스별 병렬 호출
    for (const service of request.services) {
      if (processedServices.has(service)) continue;
      if (!this.isServiceAvailable(service)) continue;

      processedServices.add(service);
      routingPath.push(service);

      const promise = this.callService(service, request)
        .then((response) => {
          results.set(service, response);
        })
        .catch((error) => {
          results.set(service, {
            id: request.id,
            success: false,
            error: distributedErrorHandler.createDistributedError(
              error,
              service
            ),
            metadata: {
              service,
              processingTime: 0,
              timestamp: new Date().toISOString(),
            },
          });
        });

      promises.push(promise);

      // 동시 실행 제한
      if (promises.length >= this.config.maxConcurrency) {
        await Promise.race(promises);
        promises.splice(0, 1);
      }
    }

    // 남은 프로미스 대기
    await Promise.allSettled(promises);
  }

  /**
   * 순차 처리
   */
  private async processSequential(
    request: EdgeRouterRequest,
    results: Map<AIServiceType, DistributedResponse>,
    routingPath: string[]
  ): Promise<void> {
    for (const service of request.services) {
      if (!this.isServiceAvailable(service)) continue;

      routingPath.push(service);

      try {
        const response = await this.callService(service, request);
        results.set(service, response);

        // 성공 시 조기 종료 옵션
        if (response.success && response.data) {
          break;
        }
      } catch (error) {
        results.set(service, {
          id: request.id,
          success: false,
          error: distributedErrorHandler.createDistributedError(error, service),
          metadata: {
            service,
            processingTime: 0,
            timestamp: new Date().toISOString(),
          },
        });
      }
    }
  }

  /**
   * 폴백 체인 처리
   */
  private async processFallbackChain(
    request: EdgeRouterRequest,
    results: Map<AIServiceType, DistributedResponse>,
    routingPath: string[]
  ): Promise<void> {
    for (const service of request.fallbackChain || []) {
      if (results.has(service)) continue;
      if (!this.isServiceAvailable(service)) continue;

      routingPath.push(service);

      try {
        const response = await this.callService(service, request);
        results.set(service, response);

        if (response.success && response.data) {
          break;
        }
      } catch (error) {
        // 폴백 실패는 로그만
        console.warn(`Fallback service ${service} failed:`, error);
      }
    }
  }

  /**
   * 서비스 호출
   */
  private async callService(
    service: AIServiceType,
    request: EdgeRouterRequest
  ): Promise<DistributedResponse> {
    const timeout =
      this.config.serviceTimeouts[service] || this.config.globalTimeout;

    // Circuit Breaker 체크
    if (!this.canCallService(service)) {
      throw new Error(`Circuit breaker open for ${service}`);
    }

    const serviceRequest = {
      id: request.id,
      query: request.query,
      context: request.context,
      userId: request.userId,
      sessionId: request.sessionId,
      metadata: request.metadata,
      timeout,
    };

    try {
      let response: DistributedResponse;

      // 타임아웃 적용
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Service timeout')), timeout)
      );

      // 서비스별 호출
      switch (service) {
        case 'supabase-rag':
          response = await Promise.race([
            supabaseRAGAdapter.search({
              ...serviceRequest,
              maxResults: 5,
              threshold: 0.7,
              includeContext: true,
            }),
            timeoutPromise,
          ]);
          break;

        case 'gcp-korean-nlp':
          response = await Promise.race([
            gcpFunctionsAdapter.callFunction({
              ...serviceRequest,
              functionType: 'korean-nlp',
            }),
            timeoutPromise,
          ]);
          break;

        case 'gcp-ml-analytics':
          response = await Promise.race([
            gcpFunctionsAdapter.callFunction({
              ...serviceRequest,
              functionType: 'ml-analytics',
            }),
            timeoutPromise,
          ]);
          break;

        default:
          throw new Error(`Unknown service: ${service}`);
      }

      // 성공 시 Circuit Breaker 업데이트
      this.recordSuccess(service);
      return response;
    } catch (error) {
      // 실패 시 Circuit Breaker 업데이트
      this.recordFailure(service);
      throw error;
    }
  }

  /**
   * 캐시 확인
   */
  private async checkCache(
    request: EdgeRouterRequest
  ): Promise<DistributedResponse | null> {
    try {
      const cacheKey = `ai:response:${this.generateCacheKey(request)}`;
      const cachedData = await edgeCache.get(cacheKey);

      if (cachedData) {
        // EdgeCache에서 가져온 데이터를 DistributedResponse 형식으로 변환
        return cachedData as DistributedResponse;
      }
    } catch (error) {
      console.warn('Cache check failed:', error);
    }

    return null;
  }

  /**
   * 캐시 업데이트
   */
  private async updateCache(
    request: EdgeRouterRequest,
    results: Map<AIServiceType, DistributedResponse>
  ): Promise<void> {
    try {
      const cacheKey = `ai:response:${this.generateCacheKey(request)}`;
      const successfulResponse = this.getBestResponse(results);

      if (successfulResponse) {
        await edgeCache.set(
          cacheKey,
          successfulResponse,
          this.config.caching.ttl
        );
      }
    } catch (error) {
      console.warn('Cache update failed:', error);
    }
  }

  /**
   * 캐시 키 생성
   */
  private generateCacheKey(request: EdgeRouterRequest): string {
    const normalized = {
      query: request.query.toLowerCase().trim(),
      services: request.services.sort().join(','),
    };

    // 간단한 해시 함수
    let hash = 0;
    const str = JSON.stringify(normalized);
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }

    return hash.toString(36);
  }

  // === Circuit Breaker 메서드들 ===

  private initializeServices(): void {
    const services: AIServiceType[] = [
      'supabase-rag',
      'gcp-korean-nlp',
      'gcp-ml-analytics',
    ];

    for (const service of services) {
      this.circuitBreakers.set(service, {
        failureCount: 0,
        lastFailureTime: 0,
        state: 'closed',
        successCount: 0,
      });

      this.serviceHealth.set(service, {
        service,
        status: 'healthy',
        latency: 0,
        successRate: 1.0,
        lastCheck: new Date().toISOString(),
      });
    }
  }

  private isServiceAvailable(service: AIServiceType): boolean {
    const breaker = this.circuitBreakers.get(service);
    if (!breaker) return false;

    if (breaker.state === 'open') {
      // 재시도 시간 확인
      const now = Date.now();
      if (
        now - breaker.lastFailureTime >
        this.config.circuitBreaker.resetTimeout
      ) {
        breaker.state = 'half-open';
        breaker.failureCount = 0;
      } else {
        return false;
      }
    }

    return true;
  }

  private canCallService(service: AIServiceType): boolean {
    return this.isServiceAvailable(service);
  }

  private recordSuccess(service: AIServiceType): void {
    const breaker = this.circuitBreakers.get(service);
    if (!breaker) return;

    breaker.successCount++;

    if (breaker.state === 'half-open') {
      breaker.state = 'closed';
      breaker.failureCount = 0;
    }

    // 헬스 업데이트
    const health = this.serviceHealth.get(service);
    if (health) {
      health.status = 'healthy';
      health.successRate =
        breaker.successCount / (breaker.successCount + breaker.failureCount);
    }
  }

  private recordFailure(service: AIServiceType): void {
    const breaker = this.circuitBreakers.get(service);
    if (!breaker) return;

    breaker.failureCount++;
    breaker.lastFailureTime = Date.now();

    if (breaker.failureCount >= this.config.circuitBreaker.failureThreshold) {
      breaker.state = 'open';
    }

    // 헬스 업데이트
    const health = this.serviceHealth.get(service);
    if (health) {
      health.status = breaker.state === 'open' ? 'unhealthy' : 'degraded';
      health.successRate =
        breaker.successCount / (breaker.successCount + breaker.failureCount);
    }
  }

  // === 헬퍼 메서드들 ===

  private hasSuccessfulResult(
    results: Map<AIServiceType, DistributedResponse>
  ): boolean {
    for (const response of results.values()) {
      if (response.success && response.data) return true;
    }
    return false;
  }

  private getBestResponse(
    results: Map<AIServiceType, DistributedResponse>
  ): DistributedResponse | null {
    // 우선순위에 따른 최적 응답 선택
    const priorities: AIServiceType[] = [
      'supabase-rag',
      'gcp-korean-nlp',
      'gcp-ml-analytics',
    ];

    for (const service of priorities) {
      const response = results.get(service);
      if (response?.success && response.data) {
        return response;
      }
    }

    return null;
  }

  /**
   * 서비스 헬스 조회
   */
  getServiceHealth(): Map<AIServiceType, ServiceHealth> {
    return new Map(this.serviceHealth);
  }

  /**
   * Circuit Breaker 상태 조회
   */
  getCircuitBreakerStatus(): Map<AIServiceType, CircuitBreakerState> {
    return new Map(this.circuitBreakers);
  }
}

// Edge Runtime에서 사용할 싱글톤 인스턴스
export const edgeAIRouter = new EdgeAIRouter();
