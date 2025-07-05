/**
 * 🎯 Vercel 최적화 헬스체크 시스템
 *
 * @description
 * Vercel 환경에서 최적화된 헬스체크 시스템
 * 비활성화 기능 제거 - 항상 정상 동작
 *
 * @features
 * - 캐싱 기반 성능 최적화
 * - 배치 처리 지원
 * - 레이트 리미팅 (보안용)
 * - 비활성화 로직 완전 제거
 */

export interface HealthCheckConfig {
  cacheTimeout: number; // 캐시 유지 시간 (ms)
  maxRetries: number;
  batchSize: number;
  rateLimitWindow: number; // 제한 시간 창 (ms)
  maxCallsPerWindow: number;
}

export interface OptimizedHealthResult {
  status: 'healthy' | 'degraded' | 'offline' | 'cached';
  timestamp: string;
  cached: boolean;
  source: string;
  responseTime?: number;
  error?: string;
}

interface CachedHealthResult {
  result: OptimizedHealthResult;
  timestamp: number;
  ttl: number;
}

export class VercelHealthOptimizer {
  private static instance: VercelHealthOptimizer | null = null;

  // 헬스체크 결과 캐시
  private healthCache = new Map<string, CachedHealthResult>();

  // API 호출 추적 (레이트 리미팅용)
  private apiCallTracker = new Map<
    string,
    {
      calls: number;
      windowStart: number;
    }
  >();

  private config: HealthCheckConfig = {
    cacheTimeout: 3 * 60 * 1000, // 3분 캐시
    maxRetries: 2,
    batchSize: 5,
    rateLimitWindow: 60 * 1000, // 1분 창
    maxCallsPerWindow: 10,
  };

  private constructor() {
    this.startCleanupTimer();
  }

  public static getInstance(): VercelHealthOptimizer {
    if (!VercelHealthOptimizer.instance) {
      VercelHealthOptimizer.instance = new VercelHealthOptimizer();
    }
    return VercelHealthOptimizer.instance;
  }

  /**
   * 🎯 최적화된 헬스체크 실행
   */
  public async checkHealth(
    serviceId: string,
    healthCheckFn: () => Promise<any>,
    customConfig?: Partial<HealthCheckConfig>
  ): Promise<OptimizedHealthResult> {
    const config = { ...this.config, ...customConfig };

    // 1. 캐시 확인
    const cachedResult = this.getCachedHealth(serviceId);
    if (cachedResult) {
      return cachedResult;
    }

    // 2. 레이트 리미팅 확인
    if (!this.canMakeAPICall(serviceId, config)) {
      return {
        status: 'cached',
        timestamp: new Date().toISOString(),
        cached: true,
        source: 'rate-limited',
        error: 'Rate limit exceeded, using cached result or default',
      };
    }

    // 3. 실제 헬스체크 실행
    try {
      this.trackAPICall(serviceId, config);

      const startTime = Date.now();
      const timeoutPromise = this.createTimeoutPromise(10000); // 10초 타임아웃

      const result = await Promise.race([healthCheckFn(), timeoutPromise]);

      const responseTime = Date.now() - startTime;

      const healthResult: OptimizedHealthResult = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        cached: false,
        source: serviceId,
        responseTime,
      };

      // 캐시 저장
      this.setCachedHealth(serviceId, healthResult, config.cacheTimeout);

      return healthResult;
    } catch (error) {
      const errorResult: OptimizedHealthResult = {
        status: 'offline',
        timestamp: new Date().toISOString(),
        cached: false,
        source: serviceId,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      // 에러 결과도 짧게 캐시 (1분)
      this.setCachedHealth(serviceId, errorResult, 60 * 1000);

      return errorResult;
    }
  }

  /**
   * 🎯 배치 헬스체크 실행
   */
  public async batchHealthCheck(
    services: Array<{
      id: string;
      name: string;
      healthCheckFn: () => Promise<any>;
      priority: 'high' | 'medium' | 'low';
    }>
  ): Promise<Record<string, OptimizedHealthResult>> {
    const config = this.getVercelOptimizedConfig();
    const results: Record<string, OptimizedHealthResult> = {};

    // 우선순위별 정렬
    const sortedServices = services.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    // 배치 단위로 처리
    for (let i = 0; i < sortedServices.length; i += config.batchSize) {
      const batch = sortedServices.slice(i, i + config.batchSize);

      const batchPromises = batch.map(async service => {
        const result = await this.checkHealth(
          service.id,
          service.healthCheckFn,
          config
        );
        return { id: service.id, result };
      });

      const batchResults = await Promise.allSettled(batchPromises);
      batchResults.forEach(promiseResult => {
        if (promiseResult.status === 'fulfilled') {
          const { id, result } = promiseResult.value;
          results[id] = result;
        }
      });
    }

    return results;
  }

  /**
   * 🎯 Vercel 환경 감지 및 최적화
   */
  public getVercelOptimizedConfig(): HealthCheckConfig {
    const isVercel = !!process.env.VERCEL;
    const isProd = process.env.NODE_ENV === 'production';

    if (isVercel && isProd) {
      return {
        ...this.config,
        cacheTimeout: 10 * 60 * 1000, // 10분 캐시
        maxCallsPerWindow: 5, // 더 엄격한 제한
        rateLimitWindow: 2 * 60 * 1000, // 2분 창
        batchSize: 2, // 작은 배치
      };
    }

    if (isVercel) {
      return {
        ...this.config,
        cacheTimeout: 5 * 60 * 1000, // 5분 캐시
        maxCallsPerWindow: 8,
        batchSize: 3,
      };
    }

    return this.config; // 로컬 환경은 기본 설정
  }

  /**
   * 📈 통계 및 모니터링
   */
  public getHealthStats(): {
    totalChecks: number;
    cacheHitRate: number;
    rateLimitedCalls: number;
    averageResponseTime: number;
    servicesStatus: Record<string, string>;
  } {
    const totalChecks = Array.from(this.apiCallTracker.values()).reduce(
      (sum, tracker) => sum + tracker.calls,
      0
    );

    const cachedChecks = this.healthCache.size;
    const cacheHitRate =
      totalChecks > 0 ? (cachedChecks / totalChecks) * 100 : 0;

    const servicesStatus: Record<string, string> = {};
    this.healthCache.forEach((cached, serviceId) => {
      servicesStatus[serviceId] = cached.result.status;
    });

    return {
      totalChecks,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      rateLimitedCalls: 0, // TODO: 추적 구현
      averageResponseTime: 0, // TODO: 평균 계산
      servicesStatus,
    };
  }

  /**
   * 🧹 캐시 정리 및 최적화
   */
  public clearExpiredCache(): void {
    const now = Date.now();
    const expired: string[] = [];

    this.healthCache.forEach((cached, key) => {
      if (now > cached.timestamp + cached.ttl) {
        expired.push(key);
      }
    });

    expired.forEach(key => this.healthCache.delete(key));

    if (expired.length > 0) {
      console.log(`🧹 만료된 헬스체크 캐시 ${expired.length}개 정리`);
    }
  }

  // Private 헬퍼 메서드들
  private getCachedHealth(serviceId: string): OptimizedHealthResult | null {
    const cached = this.healthCache.get(serviceId);
    if (!cached) return null;

    const now = Date.now();
    if (now > cached.timestamp + cached.ttl) {
      this.healthCache.delete(serviceId);
      return null;
    }

    return {
      ...cached.result,
      cached: true,
    };
  }

  private setCachedHealth(
    serviceId: string,
    result: OptimizedHealthResult,
    ttl: number
  ): void {
    this.healthCache.set(serviceId, {
      result,
      timestamp: Date.now(),
      ttl,
    });
  }

  private canMakeAPICall(
    serviceId: string,
    config: HealthCheckConfig
  ): boolean {
    const tracker = this.apiCallTracker.get(serviceId);
    const now = Date.now();

    if (!tracker) {
      return true;
    }

    // 시간 창이 지났으면 리셋
    if (now > tracker.windowStart + config.rateLimitWindow) {
      this.apiCallTracker.set(serviceId, {
        calls: 0,
        windowStart: now,
      });
      return true;
    }

    return tracker.calls < config.maxCallsPerWindow;
  }

  private trackAPICall(serviceId: string, config: HealthCheckConfig): void {
    const now = Date.now();
    const tracker = this.apiCallTracker.get(serviceId);

    if (!tracker || now > tracker.windowStart + config.rateLimitWindow) {
      this.apiCallTracker.set(serviceId, {
        calls: 1,
        windowStart: now,
      });
    } else {
      tracker.calls++;
    }
  }

  private createTimeoutPromise(timeout: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Health check timeout')), timeout);
    });
  }

  private startCleanupTimer(): void {
    // 5분마다 만료된 캐시 정리
    setInterval(
      () => {
        this.clearExpiredCache();
      },
      5 * 60 * 1000
    );
  }
}

// 싱글톤 인스턴스 export
export const vercelHealthOptimizer = VercelHealthOptimizer.getInstance();

// 편의 함수들
export const optimizedHealthCheck = (
  serviceId: string,
  healthCheckFn: () => Promise<any>,
  config?: Partial<HealthCheckConfig>
) => vercelHealthOptimizer.checkHealth(serviceId, healthCheckFn, config);

export const batchHealthCheck = (
  services: Array<{
    id: string;
    name: string;
    healthCheckFn: () => Promise<any>;
    priority: 'high' | 'medium' | 'low';
  }>
) => vercelHealthOptimizer.batchHealthCheck(services);
