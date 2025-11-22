/**
 * 탄력적 AI 클라이언트 - Circuit Breaker + Retry + Cache
 *
 * GPT-5 제안사항을 반영한 장애 대응 시스템:
 * - Circuit Breaker 패턴으로 장애 전파 방지
 * - Exponential Backoff 재시도 로직
 * - 5분 캐시 TTL로 성능 최적화
 * - GCP Functions 장애 시 Vercel 라우트로 자동 fallback
 */

import { getErrorMessage } from '@/types/type-utils';
import debug from '@/utils/debug';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
}

interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

interface CacheEntry {
  data: unknown;
  timestamp: number;
  ttl: number;
}

export class ResilientAIClient {
  private cache = new Map<string, CacheEntry>();
  private circuitBreakers = new Map<string, CircuitBreakerState>();

  // Circuit Breaker 설정
  private readonly FAILURE_THRESHOLD = 5;
  private readonly RECOVERY_TIMEOUT = 30000; // 30초
  private readonly HALF_OPEN_MAX_CALLS = 3;

  // 재시도 설정
  private readonly MAX_RETRIES = 3;
  private readonly BASE_DELAY = 1000; // 1초

  // 캐시 설정
  private readonly DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5분

  /**
   * Circuit Breaker 패턴으로 API 호출
   */
  async callWithFallback(
    endpoint: string,
    options: RequestOptions = {},
    fallbackUrl?: string
  ): Promise<{
    success: boolean;
    data?: unknown;
    error?: string;
    source: string;
  }> {
    const cacheKey = this.generateCacheKey(endpoint, options);

    // 1. 캐시 확인
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      debug.log('🎯 캐시 히트:', endpoint);
      return { success: true, data: cached, source: 'cache' };
    }

    // 2. Circuit Breaker 상태 확인
    const breakerKey = new URL(endpoint).origin;
    if (this.isCircuitBreakerOpen(breakerKey)) {
      debug.warn('⚡ Circuit Breaker OPEN:', breakerKey);

      if (fallbackUrl) {
        return this.callFallback(fallbackUrl, options);
      }

      return {
        success: false,
        error: 'Circuit breaker is open',
        source: 'circuit-breaker',
      };
    }

    // 3. Retry with Exponential Backoff
    return this.withRetry(async () => {
      try {
        const result = await this.makeHttpCall(endpoint, options);

        // 성공 시 Circuit Breaker 상태 리셋
        this.recordSuccess(breakerKey);

        // 캐시 저장
        if (result.success && result.data) {
          this.setCache(cacheKey, result.data);
        }

        return { ...result, source: 'gcp-functions' };
      } catch (error) {
        // 실패 시 Circuit Breaker 상태 업데이트
        this.recordFailure(breakerKey);

        debug.error('🚨 GCP Functions 호출 실패:', error);

        // Fallback 시도
        if (fallbackUrl) {
          debug.log('🔄 Vercel Fallback 시도:', fallbackUrl);
          return this.callFallback(fallbackUrl, options);
        }

        throw error;
      }
    });
  }

  /**
   * HTTP 호출 (타임아웃 포함)
   */
  private async makeHttpCall(
    endpoint: string,
    options: RequestOptions
  ): Promise<{ success: boolean; data?: unknown; error?: string }> {
    const controller = new AbortController();
    const timeout = options.timeout || 30000; // 30초 기본 타임아웃

    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(endpoint, {
        method: options.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Exponential Backoff와 함께 재시도
   */
  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        return await fn();
      } catch (error) {
        const currentError = error as Error;
        lastError = currentError;

        if (attempt === this.MAX_RETRIES) {
          break;
        }

        const delay = this.BASE_DELAY * Math.pow(2, attempt);
        debug.log(
          `🔄 재시도 ${attempt + 1}/${this.MAX_RETRIES} (${delay}ms 대기)`
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    if (lastError) {
      throw lastError;
    }
    throw new Error('Retry attempts exhausted without capturing error');
  }

  /**
   * Vercel 라우트로 Fallback
   */
  private async callFallback(
    fallbackUrl: string,
    options: RequestOptions
  ): Promise<{
    success: boolean;
    data?: unknown;
    error?: string;
    source: string;
  }> {
    try {
      const result = await this.makeHttpCall(fallbackUrl, options);
      return { ...result, source: 'vercel-fallback' };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error),
        source: 'fallback-failed',
      };
    }
  }

  /**
   * Circuit Breaker 상태 관리
   */
  private isCircuitBreakerOpen(key: string): boolean {
    const breaker = this.circuitBreakers.get(key);
    if (!breaker) return false;

    const now = Date.now();

    if (breaker.state === 'OPEN') {
      if (now - breaker.lastFailureTime > this.RECOVERY_TIMEOUT) {
        breaker.state = 'HALF_OPEN';
        return false;
      }
      return true;
    }

    return false;
  }

  private recordSuccess(key: string): void {
    const breaker = this.circuitBreakers.get(key);
    if (breaker) {
      breaker.failures = 0;
      breaker.state = 'CLOSED';
    }
  }

  private recordFailure(key: string): void {
    const breaker = this.circuitBreakers.get(key) || {
      failures: 0,
      lastFailureTime: 0,
      state: 'CLOSED' as const,
    };

    breaker.failures++;
    breaker.lastFailureTime = Date.now();

    if (breaker.failures >= this.FAILURE_THRESHOLD) {
      breaker.state = 'OPEN';
      debug.warn(
        `⚡ Circuit Breaker OPENED for ${key} (${breaker.failures} failures)`
      );
    }

    this.circuitBreakers.set(key, breaker);
  }

  /**
   * 캐시 관리
   */
  private generateCacheKey(endpoint: string, options: RequestOptions): string {
    return `${endpoint}_${JSON.stringify(options.body || {})}`;
  }

  private getFromCache(key: string): unknown | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  private setCache(
    key: string,
    data: unknown,
    ttl = this.DEFAULT_CACHE_TTL
  ): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });

    // 캐시 크기 제한 (최대 1000개)
    if (this.cache.size > 1000) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
  }

  /**
   * 캐시 정리 (선택적)
   */
  clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Circuit Breaker 상태 조회 (모니터링용)
   */
  getCircuitBreakerStatus(): Record<string, CircuitBreakerState> {
    return Object.fromEntries(this.circuitBreakers.entries());
  }

  /**
   * 캐시 통계 (모니터링용)
   */
  getCacheStats(): { size: number; hitRate: string } {
    return {
      size: this.cache.size,
      hitRate: 'N/A', // 실제 구현에서는 히트율 계산 로직 추가
    };
  }
}

// 글로벌 인스턴스
let globalResilientClient: ResilientAIClient | null = null;

/**
 * ResilientAIClient 싱글톤 인스턴스 가져오기
 */
export function getResilientAIClient(): ResilientAIClient {
  if (!globalResilientClient) {
    globalResilientClient = new ResilientAIClient();

    // 5분마다 캐시 정리
    if (typeof window !== 'undefined') {
      setInterval(
        () => {
          globalResilientClient?.clearExpiredCache();
        },
        5 * 60 * 1000
      );
    }
  }

  return globalResilientClient;
}

/**
 * 헬퍼 함수들
 */

/**
 * ❌ Deprecated Functions (2025-11-22)
 *
 * 아래 함수들은 더 이상 사용되지 않습니다:
 * - analyzeKoreanNLPResilient: KoreanNLPProvider가 직접 호출
 * - analyzeMLMetricsResilient: MLProvider가 직접 호출
 * - processUnifiedAIResilient: GoogleAiUnifiedEngine으로 대체됨
 *
 * 참고: docs/analysis/gcp-functions-analysis-2025-11-22.md
 */
