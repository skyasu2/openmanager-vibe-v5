/**
 * 🛡️ In-Memory Rate Limiter v1.0
 *
 * Redis + Supabase 모두 장애 시 최후 방어선
 * DDoS 공격 방지 및 Cloud Run 과금 보호
 *
 * ✅ LRU 캐시 기반 메모리 관리 (최대 1000 IP)
 * ✅ 글로벌 임계값 체크 (Fail-Closed)
 * ✅ 일일 제한 지원 (Cloud Run 무료 티어 보호)
 * ✅ Edge Runtime 호환
 *
 * @created 2026-01-11
 */

import { logger } from '@/lib/logging';

// ==============================================
// 🎯 타입 정의
// ==============================================

interface InMemoryRateLimitEntry {
  /** 현재 윈도우 내 요청 수 */
  count: number;
  /** 윈도우 리셋 시간 (timestamp) */
  resetTime: number;
  /** 일일 요청 수 */
  dailyCount: number;
  /** 일일 리셋 시간 (timestamp) */
  dailyResetTime: number;
  /** 마지막 접근 시간 (LRU용) */
  lastAccess: number;
}

export interface InMemoryRateLimiterConfig {
  /** 윈도우 당 최대 요청 수 */
  maxRequests: number;
  /** 윈도우 시간 (ms) */
  windowMs: number;
  /** 일일 최대 요청 수 (optional) */
  dailyLimit?: number;
  /** 최대 IP 엔트리 수 (메모리 보호) */
  maxEntries: number;
  /** 정리 주기 (ms) - on-demand */
  cleanupIntervalMs: number;
  /** 글로벌 임계값 (이 횟수 초과 시 모든 요청 거부) */
  failClosedThreshold: number;
}

export interface InMemoryRateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  /** 일일 제한 정보 (설정된 경우) */
  daily?: {
    remaining: number;
    resetTime: number;
  };
  /** 거부 사유 (디버깅용) */
  reason?: string;
}

// ==============================================
// 🏗️ In-Memory Rate Limiter 클래스
// ==============================================

export class InMemoryRateLimiter {
  private entries: Map<string, InMemoryRateLimitEntry>;
  private config: InMemoryRateLimiterConfig;

  /** 글로벌 요청 카운터 (DDoS 탐지용) */
  private globalRequestsInWindow: number = 0;
  private globalWindowStartTime: number = Date.now();

  /** 마지막 정리 시간 */
  private lastCleanupTime: number = Date.now();

  constructor(config: InMemoryRateLimiterConfig) {
    this.entries = new Map();
    this.config = config;

    logger.debug(
      `[In-Memory Rate Limiter] 초기화 완료 (maxEntries: ${config.maxEntries}, failClosedThreshold: ${config.failClosedThreshold})`
    );
  }

  /**
   * 🔍 Rate Limit 체크
   *
   * @param identifier - IP:Path 형식의 고유 식별자
   * @returns 허용 여부 및 남은 요청 수
   */
  checkLimit(identifier: string): InMemoryRateLimitResult {
    const now = Date.now();

    // 주기적 정리 (on-demand)
    this.maybeCleanup(now);

    // 🚨 글로벌 임계값 체크 (DDoS 방어)
    if (this.isGlobalThresholdExceeded(now)) {
      logger.warn(
        `[In-Memory Rate Limiter] 글로벌 임계값 초과 - 모든 요청 거부 (threshold: ${this.config.failClosedThreshold})`
      );
      return {
        allowed: false,
        remaining: 0,
        resetTime: this.globalWindowStartTime + this.config.windowMs,
        reason: 'global_threshold_exceeded',
      };
    }

    // 메모리 보호: 최대 엔트리 수 초과 시 LRU 정리
    if (this.entries.size >= this.config.maxEntries) {
      this.evictOldestEntries();
    }

    // 엔트리 조회 또는 생성
    const entry = this.getOrCreateEntry(identifier, now);

    // 윈도우 리셋 체크
    if (now >= entry.resetTime) {
      entry.count = 0;
      entry.resetTime = now + this.config.windowMs;
    }

    // 일일 리셋 체크
    if (now >= entry.dailyResetTime) {
      entry.dailyCount = 0;
      entry.dailyResetTime = this.getNextMidnight();
    }

    // 분당 제한 체크
    if (entry.count >= this.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        daily: this.config.dailyLimit
          ? {
              remaining: Math.max(0, this.config.dailyLimit - entry.dailyCount),
              resetTime: entry.dailyResetTime,
            }
          : undefined,
        reason: 'rate_limit_exceeded',
      };
    }

    // 일일 제한 체크 (설정된 경우)
    if (this.config.dailyLimit && entry.dailyCount >= this.config.dailyLimit) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.dailyResetTime,
        daily: {
          remaining: 0,
          resetTime: entry.dailyResetTime,
        },
        reason: 'daily_limit_exceeded',
      };
    }

    // ✅ 카운트 증가
    entry.count++;
    entry.dailyCount++;
    entry.lastAccess = now;
    this.globalRequestsInWindow++;

    return {
      allowed: true,
      remaining: this.config.maxRequests - entry.count,
      resetTime: entry.resetTime,
      daily: this.config.dailyLimit
        ? {
            remaining: this.config.dailyLimit - entry.dailyCount,
            resetTime: entry.dailyResetTime,
          }
        : undefined,
    };
  }

  /**
   * 🚨 글로벌 임계값 초과 여부 (DDoS 방어)
   *
   * 전체 요청이 임계값을 초과하면 모든 요청 거부 (Fail-Closed)
   */
  private isGlobalThresholdExceeded(now: number): boolean {
    // 윈도우 리셋
    if (now - this.globalWindowStartTime >= this.config.windowMs) {
      this.globalWindowStartTime = now;
      this.globalRequestsInWindow = 0;
    }

    return this.globalRequestsInWindow >= this.config.failClosedThreshold;
  }

  /**
   * 🔑 엔트리 조회 또는 생성
   */
  private getOrCreateEntry(
    identifier: string,
    now: number
  ): InMemoryRateLimitEntry {
    let entry = this.entries.get(identifier);

    if (!entry) {
      entry = {
        count: 0,
        resetTime: now + this.config.windowMs,
        dailyCount: 0,
        dailyResetTime: this.getNextMidnight(),
        lastAccess: now,
      };
      this.entries.set(identifier, entry);
    }

    return entry;
  }

  /**
   * 🗑️ LRU 기반 오래된 엔트리 제거
   *
   * 메모리 보호를 위해 가장 오래된 20% 제거
   */
  private evictOldestEntries(): void {
    const entriesToRemove = Math.ceil(this.config.maxEntries * 0.2);
    const sortedEntries = [...this.entries.entries()].sort(
      (a, b) => a[1].lastAccess - b[1].lastAccess
    );

    for (let i = 0; i < entriesToRemove && i < sortedEntries.length; i++) {
      const entry = sortedEntries[i];
      if (entry) {
        this.entries.delete(entry[0]);
      }
    }

    logger.info(
      `[In-Memory Rate Limiter] LRU 정리: ${entriesToRemove}개 엔트리 제거`
    );
  }

  /**
   * 🧹 주기적 정리 (on-demand)
   */
  private maybeCleanup(now: number): void {
    if (now - this.lastCleanupTime < this.config.cleanupIntervalMs) {
      return;
    }

    this.lastCleanupTime = now;
    let cleanedCount = 0;

    // 만료된 엔트리 제거
    for (const [key, entry] of this.entries) {
      if (now >= entry.resetTime && entry.count === 0) {
        this.entries.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info(
        `[In-Memory Rate Limiter] 만료 엔트리 정리: ${cleanedCount}개 제거`
      );
    }
  }

  /**
   * 🕐 다음 자정 시간 계산 (일일 리셋용)
   */
  private getNextMidnight(): number {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.getTime();
  }

  /**
   * 📊 현재 상태 조회 (모니터링용)
   */
  getStats(): {
    entriesCount: number;
    globalRequestsInWindow: number;
    maxEntries: number;
    failClosedThreshold: number;
  } {
    return {
      entriesCount: this.entries.size,
      globalRequestsInWindow: this.globalRequestsInWindow,
      maxEntries: this.config.maxEntries,
      failClosedThreshold: this.config.failClosedThreshold,
    };
  }

  /**
   * 🔄 상태 리셋 (테스트용)
   */
  reset(): void {
    this.entries.clear();
    this.globalRequestsInWindow = 0;
    this.globalWindowStartTime = Date.now();
    this.lastCleanupTime = Date.now();
  }
}

// ==============================================
// 🎯 사전 설정된 In-Memory Rate Limiter 인스턴스
// ==============================================

/**
 * AI Analysis 전용 설정
 * - 분당 5회 (Redis/Supabase와 동일)
 * - 일일 50회 (Cloud Run 무료 티어 보호)
 * - 글로벌 임계값 100회 (DDoS 방어)
 */
export const aiAnalysisInMemoryLimiter = new InMemoryRateLimiter({
  maxRequests: 5,
  windowMs: 60 * 1000, // 1분
  dailyLimit: 50,
  maxEntries: 1000,
  cleanupIntervalMs: 60 * 1000, // 1분
  failClosedThreshold: 100, // 분당 100회 초과 시 Fail-Closed
});

/**
 * 기본 API 설정
 * - 분당 100회
 * - 글로벌 임계값 1000회
 */
export const defaultInMemoryLimiter = new InMemoryRateLimiter({
  maxRequests: 100,
  windowMs: 60 * 1000, // 1분
  maxEntries: 5000,
  cleanupIntervalMs: 60 * 1000, // 1분
  failClosedThreshold: 1000, // 분당 1000회 초과 시 Fail-Closed
});
