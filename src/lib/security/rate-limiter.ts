/**
 * 🛡️ Serverless-Compatible Rate Limiter v2.1
 *
 * ✅ Supabase 기반 분산 rate limiting (Vercel serverless 호환)
 * ✅ Edge Runtime 지원 (setInterval 제거, on-demand cleanup)
 * ✅ Graceful fallback (Supabase 실패 시 경고 로깅)
 * ✅ 자동 만료 레코드 정리
 * ✅ Atomic operation via RPC (Race condition 완전 해결)
 * ✅ Row Level Security (보안 강화)
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
 * Changelog:
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
      // ⚡ Atomic RPC 함수 호출 (Race Condition 방지)
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

      // RPC 함수가 배열로 반환하므로 첫 번째 row 사용
      const result = Array.isArray(data) ? data[0] : data;

      if (!result) {
        this.logger.error('[Rate Limit] RPC 결과 없음');
        return this.fallbackAllow(now);
      }

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
  aiAnalysis: new RateLimiter({ maxRequests: 5, windowMs: 60 * 1000 }), // 1분에 5회
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
      return NextResponse.json(
        {
          error: 'Too Many Requests',
          message: '요청 제한을 초과했습니다. 잠시 후 다시 시도해주세요.',
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimiter.config.maxRequests.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.resetTime.toString(),
            'Retry-After': Math.ceil(
              (result.resetTime - Date.now()) / 1000
            ).toString(),
          },
        }
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

    return response;
  };
}
