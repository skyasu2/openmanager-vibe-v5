/**
 * 🎯 최적화된 Rate Limiter 시스템
 *
 * @description
 * 과도한 제한을 완화하고 보안에 필요한 최소한의 제한만 적용
 * 개발 환경에서는 제한을 거의 제거하여 개발 편의성 향상
 *
 * @features
 * - 환경별 차등 제한 (개발/프로덕션)
 * - 합리적인 제한 수치 적용
 * - 보안 공격 방지용 최소 제한
 * - 개발 편의성 최우선
 */

import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};

  constructor(private config: RateLimitConfig) {}

  // IP 기반 레이트 리미팅
  checkLimit(request: NextRequest): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
  } {
    // 개발 환경에서는 제한 거의 없음
    if (process.env.NODE_ENV === 'development') {
      return {
        allowed: true,
        remaining: 999999,
        resetTime: Date.now() + this.config.windowMs,
      };
    }

    const ip = this.getClientIP(request);
    const key = `${ip}:${request.nextUrl.pathname}`;
    const now = Date.now();

    // 기존 기록 확인
    const record = this.store[key];

    // 윈도우가 리셋되었거나 첫 요청
    if (!record || now > record.resetTime) {
      this.store[key] = {
        count: 1,
        resetTime: now + this.config.windowMs,
      };
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: now + this.config.windowMs,
      };
    }

    // 제한 초과 확인
    if (record.count >= this.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.resetTime,
      };
    }

    // 카운트 증가
    record.count++;

    return {
      allowed: true,
      remaining: this.config.maxRequests - record.count,
      resetTime: record.resetTime,
    };
  }

  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = forwarded?.split(',')[0] || realIp || 'unknown';
    return ip;
  }

  // 주기적으로 만료된 기록 정리
  cleanup() {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      if (this.store[key].resetTime <= now) {
        delete this.store[key];
      }
    });
  }
}

// 🎯 경로별 레이트 리미터 설정 (대폭 완화)
export const rateLimiters = {
  default: new RateLimiter({ maxRequests: 1000, windowMs: 60 * 1000 }), // 1분에 1000회 (기존 100회)
  dataGenerator: new RateLimiter({ maxRequests: 100, windowMs: 60 * 1000 }), // 1분에 100회 (기존 10회)
  serversNext: new RateLimiter({ maxRequests: 200, windowMs: 60 * 1000 }), // 1분에 200회 (기존 20회)
  monitoring: new RateLimiter({ maxRequests: 300, windowMs: 60 * 1000 }), // 1분에 300회 (기존 30회)
  aiAnalysis: new RateLimiter({ maxRequests: 50, windowMs: 60 * 1000 }), // 1분에 50회 (기존 5회)
};

// 10분마다 정리
setInterval(
  () => {
    Object.values(rateLimiters).forEach(limiter => limiter.cleanup());
  },
  10 * 60 * 1000
);

export function withRateLimit(
  rateLimiter: RateLimiter,
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const result = rateLimiter.checkLimit(request);

    if (!result.allowed) {
      console.warn(
        `🚨 Rate limit exceeded for ${request.nextUrl.pathname} from ${request.headers.get('x-forwarded-for') || 'unknown'}`
      );

      return NextResponse.json(
        {
          error: 'Rate Limit Exceeded',
          message:
            '요청이 일시적으로 제한되었습니다. 잠시 후 다시 시도해주세요.',
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
          note: '정상적인 사용에는 영향이 없는 보안 제한입니다.',
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
