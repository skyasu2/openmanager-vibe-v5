/**
 * 🛡️ Serverless-Compatible Rate Limiter v2.2
 *
 * ✅ Supabase 기반 분산 rate limiting (Vercel serverless 호환)
 * ✅ Edge Runtime 지원 (setInterval 제거, on-demand cleanup)
 * ✅ Graceful fallback (Supabase 실패 시 경고 로깅)
 * ✅ 자동 만료 레코드 정리
 * ✅ Atomic operation via RPC (Race condition 완전 해결)
 * ✅ Row Level Security (보안 강화)
 * ✅ 일일 제한 기능 (Cloud Run 무료 티어 최적화)
 *
 * 🔧 Architecture:
 * - Supabase 테이블: rate_limits (ip, path, count, reset_time, expires_at)
 * - RPC 함수: check_rate_limit() - Atomic increment with row lock
 * - RPC 함수: cleanup_rate_limits() - Returns actual delete count
 * - RLS 정책: Service role only access (anon key 보호)
 *
 * 🔒 Security:
 * - Row-level locking (FOR UPDATE) prevents race conditions
 * - Service role only access (prevents anon key abuse)
 *
 * 💰 Cloud Run 무료 티어 최적화:
 * - 월 180,000 vCPU-seconds (일 ~6,000초)
 * - LangGraph 평균 실행: 3-5초 (콜드스타트 10초)
 * - 일일 최대 1,500회 용량 → 100회/일 제한으로 안전 마진 확보
 *
 * Changelog:
 * - v2.2 (2025-12-21): Added daily limit for Cloud Run optimization
 * - v2.1 (2025-11-24): Added RPC functions, RLS policies, atomic operations
 * - v2.0 (2025-11-24): Initial Supabase-based implementation
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { EdgeLogger } from '../runtime/edge-runtime-utils';

// ==============================================
// 🎯 Rate Limit 관련 타입 정의
// ==============================================

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  /** 일일 최대 요청 수 (Cloud Run 무료 티어 최적화) */
  dailyLimit?: number;
}

interface _RateLimitRecord {
  ip: string;
  path: string;
  count: number;
  reset_time: number;
  expires_at: string;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  /** 일일 제한 정보 (설정된 경우) */
  daily?: {
    remaining: number;
    resetTime: number;
  };
}

// ==============================================
// 🏗️ Serverless Rate Limiter 클래스
// ==============================================

class RateLimiter {
  private logger: EdgeLogger;
  private supabase: SupabaseClient | null = null;
  private supabaseInitialized = false;

  constructor(public config: RateLimitConfig) {
    this.logger = EdgeLogger.getInstance();
    // Supabase client will be initialized lazily on first use
  }

  /**
   * 🔄 Lazy initialization of Supabase client (SSR-compatible)
   */
  private async initializeSupabase(): Promise<void> {
    if (this.supabaseInitialized) return;

    try {
      const { createClient } = await import('@/lib/supabase/server');
      this.supabase = await createClient();
      this.supabaseInitialized = true;
    } catch (error) {
      this.logger.warn(
        'Supabase 비활성화 - Rate limiting graceful fallback',
        error
      );
      this.supabase = null;
      this.supabaseInitialized = true;
    }
  }

  /**
   * 🔍 IP 기반 레이트 리미팅 (Atomic RPC 함수 사용)
   *
   * ⚡ Race Condition 완전 해결:
   * - Supabase RPC 함수 check_rate_limit() 호출
   * - DB-level row locking (FOR UPDATE) 사용
   * - Atomic increment (SELECT + UPDATE in single transaction)
   *
   * 💰 일일 제한 (Cloud Run 무료 티어):
   * - dailyLimit 설정 시 24시간 윈도우로 추가 체크
   * - 분당 + 일일 제한 모두 통과해야 요청 허용
   */
  async checkLimit(request: NextRequest): Promise<RateLimitResult> {
    const ip = this.getClientIP(request);
    const path = request.nextUrl.pathname;
    const now = Date.now();

    // Lazy initialization (SSR-compatible)
    await this.initializeSupabase();

    // Supabase 비활성화 시 graceful fallback (요청 허용하되 경고)
    if (!this.supabase) {
      this.logger.warn(
        `[Rate Limit] Supabase 비활성화 - 요청 허용 (IP: ${ip}, Path: ${path})`
      );
      return {
        allowed: true,
        remaining: this.config.maxRequests,
        resetTime: now + this.config.windowMs,
      };
    }

    try {
      // ⚡ 분당 제한 체크 (Atomic RPC 함수)
      const { data, error } = await this.supabase.rpc('check_rate_limit', {
        p_ip: ip,
        p_path: path,
        p_max_requests: this.config.maxRequests,
        p_window_ms: this.config.windowMs,
      });

      if (error) {
        this.logger.error('[Rate Limit] RPC 실행 실패', error);
        return this.fallbackAllow(now);
      }

      const result = Array.isArray(data) ? data[0] : data;

      if (!result) {
        this.logger.error('[Rate Limit] RPC 결과 없음');
        return this.fallbackAllow(now);
      }

      // 분당 제한 초과 시 즉시 거부
      if (!result.allowed) {
        return {
          allowed: false,
          remaining: result.remaining,
          resetTime: Number(result.reset_time),
        };
      }

      // 💰 일일 제한 체크 (설정된 경우만)
      if (this.config.dailyLimit) {
        const dailyResult = await this.checkDailyLimit(ip, path);

        if (!dailyResult.allowed) {
          this.logger.warn(
            `[Rate Limit] 일일 제한 초과 (IP: ${ip}, Path: ${path})`
          );
          return {
            allowed: false,
            remaining: 0,
            resetTime: dailyResult.resetTime,
            daily: {
              remaining: dailyResult.remaining,
              resetTime: dailyResult.resetTime,
            },
          };
        }

        // 분당 + 일일 모두 통과
        return {
          allowed: true,
          remaining: result.remaining,
          resetTime: Number(result.reset_time),
          daily: {
            remaining: dailyResult.remaining,
            resetTime: dailyResult.resetTime,
          },
        };
      }

      // 일일 제한 미설정 시 분당 결과만 반환
      return {
        allowed: result.allowed,
        remaining: result.remaining,
        resetTime: Number(result.reset_time),
      };
    } catch (error) {
      this.logger.error('[Rate Limit] 예상치 못한 오류', error);
      return this.fallbackAllow(now);
    }
  }

  /**
   * 📅 일일 제한 체크 (24시간 윈도우)
   *
   * 💰 Cloud Run 무료 티어 최적화:
   * - 월 180,000 vCPU-seconds ÷ 30일 = 일 6,000초
   * - LangGraph 평균 4초 × 100회 = 일 400초 사용
   * - 안전 마진 93% 확보
   */
  private async checkDailyLimit(
    ip: string,
    path: string
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const now = Date.now();
    const dailyWindowMs = 24 * 60 * 60 * 1000; // 24시간

    if (!this.supabase || !this.config.dailyLimit) {
      return {
        allowed: true,
        remaining: this.config.dailyLimit ?? 100,
        resetTime: now + dailyWindowMs,
      };
    }

    try {
      // 일일 제한용 path suffix 추가 (분당과 구분)
      const dailyPath = `${path}:daily`;

      const { data, error } = await this.supabase.rpc('check_rate_limit', {
        p_ip: ip,
        p_path: dailyPath,
        p_max_requests: this.config.dailyLimit,
        p_window_ms: dailyWindowMs,
      });

      if (error) {
        this.logger.error('[Rate Limit] 일일 제한 RPC 실패', error);
        return {
          allowed: true,
          remaining: this.config.dailyLimit,
          resetTime: now + dailyWindowMs,
        };
      }

      const result = Array.isArray(data) ? data[0] : data;

      if (!result) {
        return {
          allowed: true,
          remaining: this.config.dailyLimit,
          resetTime: now + dailyWindowMs,
        };
      }

      return {
        allowed: result.allowed,
        remaining: result.remaining,
        resetTime: Number(result.reset_time),
      };
    } catch (error) {
      this.logger.error('[Rate Limit] 일일 제한 체크 오류', error);
      return {
        allowed: true,
        remaining: this.config.dailyLimit,
        resetTime: now + dailyWindowMs,
      };
    }
  }

  /**
   * 🌐 클라이언트 IP 주소 추출
   */
  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = forwarded?.split(',')[0] ?? realIp ?? 'unknown';
    return ip;
  }

  /**
   * 🔄 Graceful Fallback (Supabase 실패 시 요청 허용)
   */
  private fallbackAllow(now: number): RateLimitResult {
    return {
      allowed: true,
      remaining: this.config.maxRequests,
      resetTime: now + this.config.windowMs,
    };
  }

  /**
   * 🧹 만료된 레코드 정리 (RPC 함수 사용)
   *
   * ✅ 개선사항:
   * - RPC 함수 cleanup_rate_limits() 호출
   * - 실제 삭제 카운트 반환 (기존 버그 수정)
   * - on-demand execution (setInterval 제거)
   */
  async cleanup(): Promise<number> {
    // Lazy initialization (SSR-compatible)
    await this.initializeSupabase();

    if (!this.supabase) {
      return 0;
    }

    try {
      // ✅ RPC 함수 호출 (정확한 삭제 카운트 반환)
      const { data, error } = await this.supabase.rpc('cleanup_rate_limits');

      if (error) {
        this.logger.error('[Rate Limit] 만료 레코드 정리 실패', error);
        return 0;
      }

      const deletedCount = Number(data) || 0;

      if (deletedCount > 0) {
        this.logger.info(
          `[Rate Limit] 만료 레코드 ${deletedCount}개 정리 완료`
        );
      }

      return deletedCount;
    } catch (error) {
      this.logger.error('[Rate Limit] Cleanup 오류', error);
      return 0;
    }
  }
}

// ==============================================
// 🎯 경로별 레이트 리미터 설정
// ==============================================

export const rateLimiters = {
  default: new RateLimiter({ maxRequests: 100, windowMs: 60 * 1000 }), // 1분에 100회
  dataGenerator: new RateLimiter({ maxRequests: 10, windowMs: 60 * 1000 }), // 1분에 10회
  serversNext: new RateLimiter({ maxRequests: 20, windowMs: 60 * 1000 }), // 1분에 20회
  monitoring: new RateLimiter({ maxRequests: 30, windowMs: 60 * 1000 }), // 1분에 30회
  /**
   * 💰 AI Analysis Rate Limiter (Cloud Run 무료 티어 최적화)
   *
   * 분당: 10회 (버스트 방지)
   * 일일: 100회 (Cloud Run 무료 티어 보호)
   *
   * 계산 근거:
   * - Cloud Run 무료: 월 180,000 vCPU-seconds
   * - 일일 용량: 6,000초 / LangGraph 4초 = 1,500회
   * - 안전 마진: 100회/일 × 4초 = 400초/일 (용량의 6.7%)
   */
  aiAnalysis: new RateLimiter({
    maxRequests: 10,
    windowMs: 60 * 1000,
    dailyLimit: 100,
  }),
};

// ⚠️ setInterval 제거 (Edge Runtime 비호환)
// 대신 on-demand cleanup (API route에서 호출 가능)

// ==============================================
// 🎯 Rate Limit Middleware
// ==============================================

export function withRateLimit(
  rateLimiter: RateLimiter,
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const result = await rateLimiter.checkLimit(request);

    if (!result.allowed) {
      // 일일 제한 초과 여부에 따라 메시지 분기
      const isDailyLimitExceeded = result.daily && result.daily.remaining <= 0;
      const message = isDailyLimitExceeded
        ? '일일 요청 제한(100회)을 초과했습니다. 내일 다시 시도해주세요.'
        : '요청 제한을 초과했습니다. 잠시 후 다시 시도해주세요.';

      const headers: Record<string, string> = {
        'X-RateLimit-Limit': rateLimiter.config.maxRequests.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.resetTime.toString(),
        'Retry-After': Math.ceil(
          (result.resetTime - Date.now()) / 1000
        ).toString(),
      };

      // 일일 제한 헤더 추가
      if (result.daily) {
        headers['X-RateLimit-Daily-Limit'] = (
          rateLimiter.config.dailyLimit ?? 100
        ).toString();
        headers['X-RateLimit-Daily-Remaining'] =
          result.daily.remaining.toString();
        headers['X-RateLimit-Daily-Reset'] = result.daily.resetTime.toString();
      }

      return NextResponse.json(
        {
          error: 'Too Many Requests',
          message,
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
          dailyLimitExceeded: isDailyLimitExceeded,
        },
        { status: 429, headers }
      );
    }

    const response = await handler(request);

    // 성공한 응답에 레이트 리미트 헤더 추가
    response.headers.set(
      'X-RateLimit-Limit',
      rateLimiter.config.maxRequests.toString()
    );
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    response.headers.set('X-RateLimit-Reset', result.resetTime.toString());

    // 일일 제한 헤더 추가 (설정된 경우)
    if (result.daily) {
      response.headers.set(
        'X-RateLimit-Daily-Limit',
        (rateLimiter.config.dailyLimit ?? 100).toString()
      );
      response.headers.set(
        'X-RateLimit-Daily-Remaining',
        result.daily.remaining.toString()
      );
      response.headers.set(
        'X-RateLimit-Daily-Reset',
        result.daily.resetTime.toString()
      );
    }

    return response;
  };
}
