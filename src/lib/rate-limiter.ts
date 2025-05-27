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
  checkLimit(request: NextRequest): { allowed: boolean; remaining: number; resetTime: number } {
    const ip = this.getClientIP(request);
    const key = `${ip}:${request.nextUrl.pathname}`;
    const now = Date.now();
    
    // 기존 기록 확인
    const record = this.store[key];
    
    // 윈도우가 리셋되었거나 첫 요청
    if (!record || now > record.resetTime) {
      this.store[key] = {
        count: 1,
        resetTime: now + this.config.windowMs
      };
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: now + this.config.windowMs
      };
    }
    
    // 제한 초과 확인
    if (record.count >= this.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.resetTime
      };
    }
    
    // 카운트 증가
    record.count++;
    
    return {
      allowed: true,
      remaining: this.config.maxRequests - record.count,
      resetTime: record.resetTime
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

// 경로별 레이트 리미터 설정
export const rateLimiters = {
  default: new RateLimiter({ maxRequests: 100, windowMs: 60 * 1000 }), // 1분에 100회
  dataGenerator: new RateLimiter({ maxRequests: 10, windowMs: 60 * 1000 }), // 1분에 10회
  serversNext: new RateLimiter({ maxRequests: 20, windowMs: 60 * 1000 }), // 1분에 20회
  monitoring: new RateLimiter({ maxRequests: 30, windowMs: 60 * 1000 }), // 1분에 30회
  aiAnalysis: new RateLimiter({ maxRequests: 5, windowMs: 60 * 1000 }) // 1분에 5회
};

// 10분마다 정리
setInterval(() => {
  Object.values(rateLimiters).forEach(limiter => limiter.cleanup());
}, 10 * 60 * 1000);

export function withRateLimit(
  rateLimiter: RateLimiter, 
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const result = rateLimiter.checkLimit(request);
    
    if (!result.allowed) {
      return NextResponse.json({
        error: 'Too Many Requests',
        message: '요청 제한을 초과했습니다. 잠시 후 다시 시도해주세요.',
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
      }, { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimiter['config'].maxRequests.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.resetTime.toString(),
          'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString()
        }
      });
    }

    const response = await handler(request);
    
    // 성공한 응답에 레이트 리미트 헤더 추가
    response.headers.set('X-RateLimit-Limit', rateLimiter['config'].maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    response.headers.set('X-RateLimit-Reset', result.resetTime.toString());
    
    return response;
  };
} 