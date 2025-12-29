/**
 * Distributed Circuit Breaker
 *
 * Vercel 인스턴스 간 장애 상태 공유
 * - Redis 카운터 기반 분산 상태 관리
 * - 3회 실패 → Circuit OPEN
 * - 60초 후 HALF-OPEN → 테스트
 * - 성공 시 CLOSED
 *
 * @module redis/circuit-breaker
 */

import {
  getRedisClient,
  isRedisDisabled,
  isRedisEnabled,
  safeRedisOp,
} from './client';

// ==============================================
// 🎯 타입 정의
// ==============================================

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  /** 서비스 식별자 */
  service: string;
  /** Circuit OPEN 임계값 (기본 3) */
  failureThreshold?: number;
  /** HALF_OPEN 전환 대기 시간 (기본 60초) */
  resetTimeoutSeconds?: number;
  /** 실패 카운트 만료 시간 (기본 300초) */
  failureExpirySeconds?: number;
}

export interface CircuitStatus {
  state: CircuitState;
  failures: number;
  lastFailure: number | null;
  openedAt: number | null;
  /** Redis 사용 여부 */
  source: 'redis' | 'local';
}

// ==============================================
// 🔧 설정
// ==============================================

const DEFAULT_CONFIG = {
  failureThreshold: 3,
  resetTimeoutSeconds: 60,
  failureExpirySeconds: 300,
} as const;

const KEY_PREFIX = 'cb'; // circuit-breaker

// ==============================================
// 🔐 Redis 키 생성
// ==============================================

function getFailureCountKey(service: string): string {
  return `${KEY_PREFIX}:${service}:failures`;
}

function getStateKey(service: string): string {
  return `${KEY_PREFIX}:${service}:state`;
}

function getOpenedAtKey(service: string): string {
  return `${KEY_PREFIX}:${service}:opened_at`;
}

// ==============================================
// 🎯 Circuit Breaker 상태 조회
// ==============================================

/**
 * Circuit Breaker 상태 조회
 *
 * @param config Circuit Breaker 설정
 * @returns 현재 Circuit 상태
 */
export async function getCircuitState(
  config: CircuitBreakerConfig
): Promise<CircuitStatus> {
  const { service, resetTimeoutSeconds = DEFAULT_CONFIG.resetTimeoutSeconds } =
    config;

  // Redis 비활성화 시 항상 CLOSED (폴백)
  if (isRedisDisabled() || !isRedisEnabled()) {
    return {
      state: 'CLOSED',
      failures: 0,
      lastFailure: null,
      openedAt: null,
      source: 'local',
    };
  }

  const client = getRedisClient();
  if (!client) {
    return {
      state: 'CLOSED',
      failures: 0,
      lastFailure: null,
      openedAt: null,
      source: 'local',
    };
  }

  try {
    // 병렬 조회
    const [state, failures, openedAt] = await Promise.all([
      client.get<CircuitState>(getStateKey(service)),
      client.get<number>(getFailureCountKey(service)),
      client.get<number>(getOpenedAtKey(service)),
    ]);

    const currentState = state ?? 'CLOSED';
    const failureCount = failures ?? 0;
    const openTime = openedAt ?? null;

    // OPEN 상태에서 resetTimeout 경과 시 HALF_OPEN으로 전환
    if (currentState === 'OPEN' && openTime) {
      const elapsed = Date.now() - openTime;
      if (elapsed >= resetTimeoutSeconds * 1000) {
        // HALF_OPEN으로 전환
        await client.set(getStateKey(service), 'HALF_OPEN', {
          ex: DEFAULT_CONFIG.failureExpirySeconds,
        });

        console.info(`[Circuit Breaker] ${service}: OPEN → HALF_OPEN`);

        return {
          state: 'HALF_OPEN',
          failures: failureCount,
          lastFailure: null,
          openedAt: openTime,
          source: 'redis',
        };
      }
    }

    return {
      state: currentState,
      failures: failureCount,
      lastFailure: null,
      openedAt: openTime,
      source: 'redis',
    };
  } catch (error) {
    console.error('[Circuit Breaker] Get state error:', error);
    return {
      state: 'CLOSED',
      failures: 0,
      lastFailure: null,
      openedAt: null,
      source: 'local',
    };
  }
}

/**
 * 요청 허용 여부 확인
 *
 * @param config Circuit Breaker 설정
 * @returns 요청 허용 여부
 */
export async function isRequestAllowed(
  config: CircuitBreakerConfig
): Promise<boolean> {
  const status = await getCircuitState(config);

  // CLOSED: 항상 허용
  if (status.state === 'CLOSED') {
    return true;
  }

  // HALF_OPEN: 테스트 요청 허용 (단일 인스턴스 환경)
  if (status.state === 'HALF_OPEN') {
    return true;
  }

  // OPEN: 거부
  return false;
}

// ==============================================
// 🎯 실패/성공 기록
// ==============================================

/**
 * 실패 기록
 * 임계값 도달 시 Circuit OPEN
 *
 * @param config Circuit Breaker 설정
 * @returns 업데이트된 상태
 */
export async function recordFailure(
  config: CircuitBreakerConfig
): Promise<CircuitStatus> {
  const {
    service,
    failureThreshold = DEFAULT_CONFIG.failureThreshold,
    failureExpirySeconds = DEFAULT_CONFIG.failureExpirySeconds,
  } = config;

  return safeRedisOp<CircuitStatus>(
    async (client) => {
      const failureKey = getFailureCountKey(service);
      const stateKey = getStateKey(service);
      const openedAtKey = getOpenedAtKey(service);

      // 실패 카운트 증가 (원자적)
      const failures = await client.incr(failureKey);

      // TTL 설정 (첫 실패 시)
      if (failures === 1) {
        await client.expire(failureKey, failureExpirySeconds);
      }

      // 임계값 도달 시 Circuit OPEN
      if (failures >= failureThreshold) {
        const now = Date.now();

        await Promise.all([
          client.set(stateKey, 'OPEN', { ex: failureExpirySeconds }),
          client.set(openedAtKey, now, { ex: failureExpirySeconds }),
        ]);

        console.warn(
          `[Circuit Breaker] ${service}: OPEN (failures: ${failures}/${failureThreshold})`
        );

        return {
          state: 'OPEN' as CircuitState,
          failures,
          lastFailure: now,
          openedAt: now,
          source: 'redis' as const,
        };
      }

      console.info(
        `[Circuit Breaker] ${service}: Failure recorded (${failures}/${failureThreshold})`
      );

      return {
        state: 'CLOSED' as CircuitState,
        failures,
        lastFailure: Date.now(),
        openedAt: null,
        source: 'redis' as const,
      };
    },
    {
      state: 'CLOSED' as CircuitState,
      failures: 0,
      lastFailure: null,
      openedAt: null,
      source: 'local' as const,
    } satisfies CircuitStatus
  );
}

/**
 * 성공 기록
 * HALF_OPEN → CLOSED, 실패 카운트 리셋
 *
 * @param config Circuit Breaker 설정
 * @returns 업데이트된 상태
 */
export async function recordSuccess(
  config: CircuitBreakerConfig
): Promise<CircuitStatus> {
  const { service } = config;

  return safeRedisOp<CircuitStatus>(
    async (client) => {
      const currentState = await client.get<CircuitState>(getStateKey(service));

      // HALF_OPEN에서 성공 시 CLOSED로 전환
      if (currentState === 'HALF_OPEN') {
        await Promise.all([
          client.del(getStateKey(service)),
          client.del(getFailureCountKey(service)),
          client.del(getOpenedAtKey(service)),
        ]);

        console.info(
          `[Circuit Breaker] ${service}: HALF_OPEN → CLOSED (recovered)`
        );

        return {
          state: 'CLOSED' as CircuitState,
          failures: 0,
          lastFailure: null,
          openedAt: null,
          source: 'redis' as const,
        };
      }

      // CLOSED 상태에서 성공 시 실패 카운트만 감소
      if (currentState === 'CLOSED' || !currentState) {
        const failures = await client.get<number>(getFailureCountKey(service));
        if (failures && failures > 0) {
          await client.decr(getFailureCountKey(service));
        }
      }

      return {
        state: 'CLOSED' as CircuitState,
        failures: 0,
        lastFailure: null,
        openedAt: null,
        source: 'redis' as const,
      };
    },
    {
      state: 'CLOSED' as CircuitState,
      failures: 0,
      lastFailure: null,
      openedAt: null,
      source: 'local' as const,
    } satisfies CircuitStatus
  );
}

/**
 * Circuit Breaker 상태 강제 리셋
 * (관리자 용도)
 */
export async function resetCircuit(service: string): Promise<boolean> {
  return safeRedisOp(async (client) => {
    await Promise.all([
      client.del(getStateKey(service)),
      client.del(getFailureCountKey(service)),
      client.del(getOpenedAtKey(service)),
    ]);

    console.info(`[Circuit Breaker] ${service}: Force reset`);
    return true;
  }, false);
}

// ==============================================
// 🎯 사전 정의된 Circuit Breaker
// ==============================================

export const CIRCUIT_BREAKERS = {
  /** Cloud Run AI Engine */
  cloudRun: {
    service: 'cloud-run-ai',
    failureThreshold: 3,
    resetTimeoutSeconds: 60,
    failureExpirySeconds: 300,
  } satisfies CircuitBreakerConfig,

  /** Google AI */
  googleAI: {
    service: 'google-ai',
    failureThreshold: 5,
    resetTimeoutSeconds: 30,
    failureExpirySeconds: 180,
  } satisfies CircuitBreakerConfig,

  /** Groq (Fallback) */
  groq: {
    service: 'groq',
    failureThreshold: 5,
    resetTimeoutSeconds: 30,
    failureExpirySeconds: 180,
  } satisfies CircuitBreakerConfig,

  /** Supabase */
  supabase: {
    service: 'supabase',
    failureThreshold: 5,
    resetTimeoutSeconds: 30,
    failureExpirySeconds: 300,
  } satisfies CircuitBreakerConfig,
} as const;
