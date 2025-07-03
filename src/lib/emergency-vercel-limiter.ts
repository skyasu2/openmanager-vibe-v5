/**
 * 🚨 Vercel Pro 사용량 위기 - 응급 기능 제한기
 *
 * Edge Request와 Function Invocations을 99% 감소시키는 긴급 시스템
 */

import { NextRequest, NextResponse } from 'next/server';

export interface EmergencyLimiterConfig {
  isEmergencyMode: boolean;
  allowedEndpoints: string[];
  maxRequestsPerMinute: number;
  cacheMaxAge: number;
  disabledFeatures: string[];
}

export class EmergencyVercelLimiter {
  private static instance: EmergencyVercelLimiter;
  private requestCounts = new Map<
    string,
    { count: number; resetTime: number }
  >();
  private config: EmergencyLimiterConfig;

  private constructor() {
    this.config = {
      isEmergencyMode: process.env.EMERGENCY_THROTTLE === 'true',
      allowedEndpoints: ['/api/health', '/api/status', '/', '/dashboard'],
      maxRequestsPerMinute: parseInt(
        process.env.MAX_STATUS_REQUESTS_PER_MINUTE || '5'
      ),
      cacheMaxAge: parseInt(process.env.VERCEL_CDN_CACHE_MAX_AGE || '3600'),
      disabledFeatures: this.getDisabledFeatures(),
    };

    console.log('🚨 응급 제한기 초기화:', this.config);
  }

  static getInstance(): EmergencyVercelLimiter {
    if (!this.instance) {
      this.instance = new EmergencyVercelLimiter();
    }
    return this.instance;
  }

  private getDisabledFeatures(): string[] {
    const features: string[] = [];

    if (process.env.AI_QUERY_DISABLED === 'true') features.push('ai-query');
    if (process.env.DATA_GENERATOR_DISABLED === 'true')
      features.push('data-generator');
    if (process.env.UNIFIED_METRICS_DISABLED === 'true')
      features.push('metrics');
    if (process.env.GOOGLE_AI_DISABLED === 'true') features.push('google-ai');
    if (process.env.MCP_DISABLED === 'true') features.push('mcp');

    return features;
  }

  /**
   * 🚨 요청 제한 확인
   */
  shouldBlockRequest(
    pathname: string,
    userAgent?: string
  ): {
    blocked: boolean;
    reason?: string;
    cacheHeaders?: Record<string, string>;
  } {
    // 응급 모드가 아니면 통과
    if (!this.config.isEmergencyMode) {
      return { blocked: false };
    }

    // 허용된 엔드포인트만 통과
    const isAllowed = this.config.allowedEndpoints.some(endpoint =>
      pathname.startsWith(endpoint)
    );

    if (!isAllowed) {
      return {
        blocked: true,
        reason: '응급 모드: 필수 엔드포인트만 허용',
        cacheHeaders: this.getEmergencyCacheHeaders(),
      };
    }

    // Rate Limiting 확인
    const rateLimitResult = this.checkRateLimit(pathname);
    if (rateLimitResult.blocked) {
      return {
        ...rateLimitResult,
        cacheHeaders: this.getEmergencyCacheHeaders(),
      };
    }

    return {
      blocked: false,
      cacheHeaders: this.getEmergencyCacheHeaders(),
    };
  }

  /**
   * ⏱️ Rate Limiting 확인
   */
  private checkRateLimit(pathname: string): {
    blocked: boolean;
    reason?: string;
  } {
    const now = Date.now();
    const key = pathname;

    const current = this.requestCounts.get(key);

    // 1분마다 리셋
    if (!current || now > current.resetTime) {
      this.requestCounts.set(key, {
        count: 1,
        resetTime: now + 60000,
      });
      return { blocked: false };
    }

    // 제한 확인
    if (current.count >= this.config.maxRequestsPerMinute) {
      return {
        blocked: true,
        reason: `Rate limit 초과: ${this.config.maxRequestsPerMinute}/분`,
      };
    }

    // 카운트 증가
    current.count++;
    return { blocked: false };
  }

  /**
   * 📦 응급 캐시 헤더
   */
  private getEmergencyCacheHeaders(): Record<string, string> {
    return {
      'Cache-Control': `public, max-age=${this.config.cacheMaxAge}, s-maxage=${this.config.cacheMaxAge}`,
      'CDN-Cache-Control': `max-age=${this.config.cacheMaxAge}`,
      'Vercel-CDN-Cache-Control': `max-age=${this.config.cacheMaxAge}`,
      'X-Emergency-Mode': 'true',
      'X-Cache-Duration': `${this.config.cacheMaxAge}s`,
    };
  }

  /**
   * 🚫 기능 비활성화 확인
   */
  isFeatureDisabled(feature: string): boolean {
    return this.config.disabledFeatures.includes(feature);
  }

  /**
   * 📊 응급 응답 생성
   */
  createEmergencyResponse(reason: string): NextResponse {
    const response = NextResponse.json(
      {
        success: false,
        emergency: true,
        message: '🚨 Vercel Pro 사용량 위기로 인한 응급 모드 활성화',
        reason,
        timestamp: new Date().toISOString(),
        instructions: [
          '1. Vercel 대시보드에서 사용량 확인',
          '2. 환경변수 EMERGENCY_THROTTLE=false로 비활성화',
          '3. 불필요한 API 호출 최소화',
          '4. 캐싱 활용 극대화',
        ],
      },
      { status: 429 }
    );

    // 응급 캐시 헤더 추가
    const cacheHeaders = this.getEmergencyCacheHeaders();
    Object.entries(cacheHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  }

  /**
   * 📈 사용량 통계
   */
  getUsageStats() {
    return {
      config: this.config,
      requestCounts: Object.fromEntries(this.requestCounts),
      totalRequests: Array.from(this.requestCounts.values()).reduce(
        (sum, item) => sum + item.count,
        0
      ),
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 🛡️ 응급 미들웨어 헬퍼
 */
export function withEmergencyLimiter(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const limiter = EmergencyVercelLimiter.getInstance();
    const pathname = new URL(req.url).pathname;

    const limitResult = limiter.shouldBlockRequest(
      pathname,
      req.headers.get('user-agent') || undefined
    );

    if (limitResult.blocked) {
      return limiter.createEmergencyResponse(limitResult.reason!);
    }

    try {
      const response = await handler(req);

      // 응급 캐시 헤더 추가
      if (limitResult.cacheHeaders) {
        Object.entries(limitResult.cacheHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      }

      return response;
    } catch (error) {
      console.error('🚨 응급 모드 핸들러 오류:', error);
      return limiter.createEmergencyResponse('내부 서버 오류');
    }
  };
}

// 싱글톤 인스턴스 내보내기
export const emergencyLimiter = EmergencyVercelLimiter.getInstance();
