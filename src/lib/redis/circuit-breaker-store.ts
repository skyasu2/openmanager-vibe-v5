/**
 * Redis Distributed Circuit Breaker Store
 *
 * 서버리스 환경에서 인스턴스 간 Circuit Breaker 상태 공유
 * - Upstash Redis 기반
 * - 자동 TTL 관리 (5분)
 * - Graceful Degradation (Redis 장애 시 In-Memory 폴백)
 *
 * @version 1.0.0
 * @created 2026-01-04
 */

import type {
  CircuitState,
  IDistributedStateStore,
} from '@/lib/ai/circuit-breaker';
import { getRedisClient, isRedisEnabled } from './client';

// ============================================================================
// Constants
// ============================================================================

const CIRCUIT_BREAKER_PREFIX = 'circuit:';
const DEFAULT_TTL_SECONDS = 300; // 5분

// ============================================================================
// Redis Circuit Breaker Store
// ============================================================================

/**
 * Redis 기반 분산 Circuit Breaker 상태 저장소
 *
 * @example
 * ```typescript
 * import { RedisCircuitBreakerStore } from '@/lib/redis/circuit-breaker-store';
 * import { setDistributedStateStore } from '@/lib/ai/circuit-breaker';
 *
 * // 앱 초기화 시 설정
 * const store = new RedisCircuitBreakerStore();
 * setDistributedStateStore(store);
 * ```
 */
export class RedisCircuitBreakerStore implements IDistributedStateStore {
  private ttlSeconds: number;
  private inMemoryFallback: Map<string, CircuitState>;

  constructor(ttlSeconds: number = DEFAULT_TTL_SECONDS) {
    this.ttlSeconds = ttlSeconds;
    this.inMemoryFallback = new Map();
  }

  /**
   * Redis 키 생성
   */
  private getKey(serviceName: string): string {
    return `${CIRCUIT_BREAKER_PREFIX}${serviceName}`;
  }

  /**
   * Circuit Breaker 상태 조회
   */
  async getState(serviceName: string): Promise<CircuitState | null> {
    const redis = getRedisClient();

    // Redis 사용 가능 시
    if (redis && isRedisEnabled()) {
      try {
        const key = this.getKey(serviceName);
        const state = await redis.hgetall(key);

        if (state && Object.keys(state).length > 0) {
          return {
            state: state.state as CircuitState['state'],
            failures: Number(state.failures) || 0,
            lastFailTime: Number(state.lastFailTime) || 0,
            threshold: Number(state.threshold) || 3,
            resetTimeout: Number(state.resetTimeout) || 60000,
          };
        }

        return null;
      } catch (error) {
        console.warn(
          `[RedisCircuitBreaker] getState error for ${serviceName}:`,
          error
        );
      }
    }

    // In-Memory Fallback
    return this.inMemoryFallback.get(serviceName) || null;
  }

  /**
   * Circuit Breaker 상태 저장
   */
  async setState(serviceName: string, state: CircuitState): Promise<void> {
    const redis = getRedisClient();

    // In-Memory 항상 업데이트
    this.inMemoryFallback.set(serviceName, state);

    // Redis 저장
    if (redis && isRedisEnabled()) {
      try {
        const key = this.getKey(serviceName);

        // 개별 명령어로 저장
        await redis.hset(key, {
          state: state.state,
          failures: state.failures.toString(),
          lastFailTime: state.lastFailTime.toString(),
          threshold: state.threshold.toString(),
          resetTimeout: state.resetTimeout.toString(),
        });
        await redis.expire(key, this.ttlSeconds);

        // 상태 변경 로깅
        if (process.env.NODE_ENV === 'development') {
          console.log(
            `[RedisCircuitBreaker] ${serviceName}: ${state.state} (failures: ${state.failures})`
          );
        }
      } catch (error) {
        console.warn(
          `[RedisCircuitBreaker] setState error for ${serviceName}:`,
          error
        );
      }
    }
  }

  /**
   * 실패 횟수 증가 (Atomic Operation)
   */
  async incrementFailures(serviceName: string): Promise<number> {
    const redis = getRedisClient();

    // In-Memory 업데이트
    const existing = this.inMemoryFallback.get(serviceName);
    const newFailures = (existing?.failures || 0) + 1;

    if (existing) {
      existing.failures = newFailures;
      existing.lastFailTime = Date.now();
    } else {
      this.inMemoryFallback.set(serviceName, {
        state: 'CLOSED',
        failures: newFailures,
        lastFailTime: Date.now(),
        threshold: 3,
        resetTimeout: 60000,
      });
    }

    // Redis Atomic Increment
    if (redis && isRedisEnabled()) {
      try {
        const key = this.getKey(serviceName);
        const result = await redis.hincrby(key, 'failures', 1);
        await redis.hset(key, { lastFailTime: Date.now().toString() });
        await redis.expire(key, this.ttlSeconds);

        return result || newFailures;
      } catch (error) {
        console.warn(
          `[RedisCircuitBreaker] incrementFailures error for ${serviceName}:`,
          error
        );
      }
    }

    return newFailures;
  }

  /**
   * Circuit Breaker 상태 리셋
   */
  async resetState(serviceName: string): Promise<void> {
    const redis = getRedisClient();

    // In-Memory 삭제
    this.inMemoryFallback.delete(serviceName);

    // Redis 삭제
    if (redis && isRedisEnabled()) {
      try {
        const key = this.getKey(serviceName);
        await redis.del(key);
      } catch (error) {
        console.warn(
          `[RedisCircuitBreaker] resetState error for ${serviceName}:`,
          error
        );
      }
    }
  }

  /**
   * 모든 Circuit Breaker 상태 조회 (모니터링용)
   */
  async getAllStates(): Promise<Map<string, CircuitState>> {
    const redis = getRedisClient();
    const result = new Map<string, CircuitState>();

    // Redis에서 조회
    if (redis && isRedisEnabled()) {
      try {
        // SCAN으로 모든 키 조회
        const keys: string[] = [];
        let cursor = 0;

        do {
          const [newCursor, foundKeys] = await redis.scan(cursor, {
            match: `${CIRCUIT_BREAKER_PREFIX}*`,
            count: 100,
          });
          cursor = Number(newCursor);
          keys.push(...foundKeys);
        } while (cursor !== 0);

        // 각 키의 상태 조회
        for (const key of keys) {
          const serviceName = key.replace(CIRCUIT_BREAKER_PREFIX, '');
          const state = await this.getState(serviceName);
          if (state) {
            result.set(serviceName, state);
          }
        }

        return result;
      } catch (error) {
        console.warn('[RedisCircuitBreaker] getAllStates error:', error);
      }
    }

    // Fallback: In-Memory
    return new Map(this.inMemoryFallback);
  }

  /**
   * 상태 요약 (대시보드용)
   */
  async getSummary(): Promise<{
    total: number;
    closed: number;
    open: number;
    halfOpen: number;
    services: Array<{ name: string; state: string; failures: number }>;
  }> {
    const states = await this.getAllStates();

    let closed = 0;
    let open = 0;
    let halfOpen = 0;
    const services: Array<{ name: string; state: string; failures: number }> =
      [];

    for (const [name, state] of states) {
      services.push({
        name,
        state: state.state,
        failures: state.failures,
      });

      switch (state.state) {
        case 'CLOSED':
          closed++;
          break;
        case 'OPEN':
          open++;
          break;
        case 'HALF_OPEN':
          halfOpen++;
          break;
      }
    }

    return {
      total: states.size,
      closed,
      open,
      halfOpen,
      services,
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let storeInstance: RedisCircuitBreakerStore | null = null;

/**
 * Redis Circuit Breaker Store 싱글톤 인스턴스 가져오기
 */
export function getRedisCircuitBreakerStore(): RedisCircuitBreakerStore {
  if (!storeInstance) {
    storeInstance = new RedisCircuitBreakerStore();
  }
  return storeInstance;
}

/**
 * Redis Circuit Breaker Store 초기화 (앱 시작 시 호출)
 */
export function initializeRedisCircuitBreakerStore(): RedisCircuitBreakerStore {
  const store = getRedisCircuitBreakerStore();
  console.log('[RedisCircuitBreaker] Store initialized');
  return store;
}
