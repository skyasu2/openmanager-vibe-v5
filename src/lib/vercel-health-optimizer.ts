/**
 * 🚀 Vercel 헬스체크 최적화 시스템 v1.0
 *
 * ✅ 과도한 헬스체크 방지
 * ✅ API 호출 제한 및 캐싱
 * ✅ 서버리스 환경 최적화
 * ✅ 배치 처리 및 지연 로딩
 */

export interface HealthCheckConfig {
  enabled: boolean;
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

/**
 * 🎯 Vercel 헬스체크 최적화 매니저
 */
export class VercelHealthOptimizer {
  private static instance: VercelHealthOptimizer | null = null;

  // 캐시 저장소 (메모리 기반)
  private healthCache = new Map<
    string,
    {
      result: OptimizedHealthResult;
      timestamp: number;
      ttl: number;
    }
  >();

  // API 호출 제한 추적
  private apiCallTracker = new Map<
    string,
    {
      calls: number;
      windowStart: number;
    }
  >();

  // 기본 설정
  private config: HealthCheckConfig = {
    enabled: process.env.VERCEL_HEALTH_OPTIMIZATION !== 'false',
    cacheTimeout: 5 * 60 * 1000, // 5분 캐시
    maxRetries: 2,
    batchSize: 3,
    rateLimitWindow: 60 * 1000, // 1분 창
    maxCallsPerWindow: 10, // 1분에 최대 10회 호출
  };

  private constructor() {
    this.startCleanupTimer();
    console.log('🚀 VercelHealthOptimizer 초기화 완료');
  }

  public static getInstance(): VercelHealthOptimizer {
    if (!VercelHealthOptimizer.instance) {
      VercelHealthOptimizer.instance = new VercelHealthOptimizer();
    }
    return VercelHealthOptimizer.instance;
  }

  /**
   * 📊 통합 헬스체크 (캐싱 및 제한 적용)
   */
  public async checkHealth(
    serviceId: string,
    healthCheckFn: () => Promise<any>,
    customConfig?: Partial<HealthCheckConfig>
  ): Promise<OptimizedHealthResult> {
    const config = { ...this.config, ...customConfig };

    if (!config.enabled) {
      return {
        status: 'offline',
        timestamp: new Date().toISOString(),
        cached: false,
        source: 'disabled',
      };
    }

    // 1. 캐시 확인
    const cached = this.getCachedHealth(serviceId);
    if (cached) {
      return cached;
    }

    // 2. API 호출 제한 확인
    if (!this.canMakeAPICall(serviceId, config)) {
      return {
        status: 'degraded',
        timestamp: new Date().toISOString(),
        cached: false,
        source: 'rate-limited',
        error: 'API 호출 제한 초과',
      };
    }

    // 3. 실제 헬스체크 수행
    const startTime = Date.now();
    try {
      const result = await Promise.race([
        healthCheckFn(),
        this.createTimeoutPromise(8000), // 8초 타임아웃
      ]);

      const healthResult: OptimizedHealthResult = {
        status: result ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        cached: false,
        source: serviceId,
        responseTime: Date.now() - startTime,
      };

      // 4. 결과 캐싱
      this.setCachedHealth(serviceId, healthResult, config.cacheTimeout);
      this.trackAPICall(serviceId, config);

      return healthResult;
    } catch (error) {
      const errorResult: OptimizedHealthResult = {
        status: 'offline',
        timestamp: new Date().toISOString(),
        cached: false,
        source: serviceId,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      // 에러도 짧은 시간 캐싱 (재시도 방지)
      this.setCachedHealth(serviceId, errorResult, 30000); // 30초
      this.trackAPICall(serviceId, config);

      return errorResult;
    }
  }

  /**
   * 🔄 배치 헬스체크 (여러 서비스 동시 확인)
   */
  public async batchHealthCheck(
    services: Array<{
      id: string;
      name: string;
      healthCheckFn: () => Promise<any>;
      priority: 'high' | 'medium' | 'low';
    }>
  ): Promise<Record<string, OptimizedHealthResult>> {
    const results: Record<string, OptimizedHealthResult> = {};

    // 우선순위별 그룹화
    const highPriority = services.filter(s => s.priority === 'high');
    const mediumPriority = services.filter(s => s.priority === 'medium');
    const lowPriority = services.filter(s => s.priority === 'low');

    // 고우선순위 먼저 처리
    for (const service of highPriority) {
      results[service.id] = await this.checkHealth(
        service.id,
        service.healthCheckFn,
        { cacheTimeout: 2 * 60 * 1000 } // 2분 캐시
      );
    }

    // 중간/낮은 우선순위는 배치로 처리
    const batchServices = [...mediumPriority, ...lowPriority];
    const batchPromises = batchServices.map(service =>
      this.checkHealth(
        service.id,
        service.healthCheckFn,
        { cacheTimeout: 10 * 60 * 1000 } // 10분 캐시
      ).then(result => ({ id: service.id, result }))
    );

    const batchResults = await Promise.allSettled(batchPromises);
    batchResults.forEach(promiseResult => {
      if (promiseResult.status === 'fulfilled') {
        const { id, result } = promiseResult.value;
        results[id] = result;
      }
    });

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

  /**
   * 🔒 강제 헬스체크 비활성화 (긴급 상황용)
   */
  public disableHealthChecks(): void {
    this.config.enabled = false;
    console.log('🚨 헬스체크 강제 비활성화됨');
  }

  public enableHealthChecks(): void {
    this.config.enabled = true;
    console.log('✅ 헬스체크 재활성화됨');
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
