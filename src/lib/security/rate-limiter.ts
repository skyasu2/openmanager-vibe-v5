/**
 * 🛡️ Serverless-Compatible Rate Limiter v2.0
 *
 * ✅ Supabase 기반 분산 rate limiting (Vercel serverless 호환)
 * ✅ Edge Runtime 지원 (setInterval 제거, on-demand cleanup)
 * ✅ Graceful fallback (Supabase 실패 시 경고 로깅)
 * ✅ 자동 만료 레코드 정리
 *
 * 🔧 Architecture:
 * - Supabase 테이블: rate_limits (ip, path, count, reset_time, expires_at)
 * - 각 요청마다 DB 조회/업데이트 (Lambda 간 상태 공유)
 * - 만료 레코드 자동 정리 (Supabase TTL 활용)
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getSupabaseClient } from '../supabase-singleton';
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

interface RateLimitRecord {
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
  private readonly TABLE_NAME = 'rate_limits';
  private supabase: ReturnType<typeof getSupabaseClient> | null;

  constructor(private config: RateLimitConfig) {
    this.logger = EdgeLogger.getInstance();

    // Supabase 싱글톤 클라이언트 사용
    try {
      this.supabase = getSupabaseClient();
    } catch (error) {
      this.logger.warn(
        'Supabase 비활성화 - Rate limiting graceful fallback',
        error
      );
      this.supabase = null;
    }
  }

  /**
   * 🔍 IP 기반 레이트 리미팅 (Supabase 분산 저장)
   */
  async checkLimit(request: NextRequest): Promise<RateLimitResult> {
    const ip = this.getClientIP(request);
    const path = request.nextUrl.pathname;
    const now = Date.now();

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
      // 1. 현재 rate limit 기록 조회
      const { data: existingRecord, error: fetchError } = await this.supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('ip', ip)
        .eq('path', path)
        .gt('reset_time', now)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 = No rows found (정상 케이스)
        this.logger.error('[Rate Limit] DB 조회 실패', fetchError);
        return this.fallbackAllow(now);
      }

      // 2-A. 윈도우가 리셋되었거나 첫 요청 → 새 레코드 생성
      if (!existingRecord) {
        const newRecord: RateLimitRecord = {
          ip,
          path,
          count: 1,
          reset_time: now + this.config.windowMs,
          expires_at: new Date(now + this.config.windowMs).toISOString(),
        };

        const { error: insertError } = await this.supabase
          .from(this.TABLE_NAME)
          .upsert(newRecord, { onConflict: 'ip,path' });

        if (insertError) {
          this.logger.error('[Rate Limit] DB 삽입 실패', insertError);
          return this.fallbackAllow(now);
        }

        return {
          allowed: true,
          remaining: this.config.maxRequests - 1,
          resetTime: now + this.config.windowMs,
        };
      }

      // 2-B. 제한 초과 확인
      if (existingRecord.count >= this.config.maxRequests) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: existingRecord.reset_time,
        };
      }

      // 2-C. 카운트 증가
      const newCount = existingRecord.count + 1;
      const { error: updateError } = await this.supabase
        .from(this.TABLE_NAME)
        .update({ count: newCount })
        .eq('ip', ip)
        .eq('path', path);

      if (updateError) {
        this.logger.error('[Rate Limit] DB 업데이트 실패', updateError);
        return this.fallbackAllow(now);
      }

      return {
        allowed: true,
        remaining: this.config.maxRequests - newCount,
        resetTime: existingRecord.reset_time,
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
   * 🧹 만료된 레코드 정리 (on-demand, setInterval 제거)
   */
  async cleanup(): Promise<number> {
    if (!this.supabase) {
      return 0;
    }

    try {
      const now = new Date().toISOString();

      const { error, count } = await this.supabase
        .from(this.TABLE_NAME)
        .delete()
        .lt('expires_at', now);

      if (error) {
        this.logger.error('[Rate Limit] 만료 레코드 정리 실패', error);
        return 0;
      }

      if (count && count > 0) {
        this.logger.info(`[Rate Limit] 만료 레코드 ${count}개 정리 완료`);
      }

      return count || 0;
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
            'X-RateLimit-Limit': rateLimiter['config'].maxRequests.toString(),
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
      rateLimiter['config'].maxRequests.toString()
    );
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    response.headers.set('X-RateLimit-Reset', result.resetTime.toString());

    return response;
  };
}
