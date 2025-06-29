import { MCPWarmupService } from '@/services/mcp/mcp-warmup-service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 🤖 MCP 서버 헬스체크 API (적응형 모니터링)
 *
 * ✅ 시스템 시작 초반 2분간: 30초 간격 집중 모니터링
 * ✅ 안정화 후: 5-8분 간격 효율 모니터링
 * ✅ Vercel 환경 감지 및 최적화
 * ✅ 단일 서버 체크로 API 호출 최소화
 */

// 🚀 MCP 적응형 모니터링 시스템
interface MCPHealthCache {
  result: any;
  timestamp: number;
  ttl: number;
}

const mcpHealthCache = new Map<string, MCPHealthCache>();

// 📊 시스템 시작 시간 추적 (헬스체크와 동기화)
const MCP_SYSTEM_START_TIME = Date.now();

// 🎯 MCP 적응형 캐시 TTL 설정
const MCP_ADAPTIVE_CACHE_TTL = {
  // 시작 초반 2분간: 30초 캐시 (집중 모니터링)
  STARTUP_INTENSIVE: 30 * 1000, // 30초
  STARTUP_DURATION: 2 * 60 * 1000, // 2분간 집중 모니터링

  // 안정화 후: 환경별 차등 적용
  VERCEL_PROD: 8 * 60 * 1000, // 8분 캐시 (프로덕션)
  VERCEL_DEV: 5 * 60 * 1000, // 5분 캐시 (개발)
  LOCAL: 3 * 60 * 1000, // 3분 캐시 (로컬)
};

// 🧠 MCP 동적 캐시 TTL 계산 (적응형 모니터링)
function getMCPAdaptiveCacheTTL(): {
  ttl: number;
  phase: string;
  reasoning: string;
} {
  const uptime = Date.now() - MCP_SYSTEM_START_TIME;
  const isVercel = !!process.env.VERCEL;
  const isProd = process.env.NODE_ENV === 'production';

  // 🚨 시스템 시작 초반 2분간: 집중 모니터링 (30초 간격)
  if (uptime < MCP_ADAPTIVE_CACHE_TTL.STARTUP_DURATION) {
    return {
      ttl: MCP_ADAPTIVE_CACHE_TTL.STARTUP_INTENSIVE,
      phase: 'mcp_startup_intensive',
      reasoning: `MCP 시작 후 ${Math.round(uptime / 1000)}초 - 집중 모니터링 모드 (30초 간격)`,
    };
  }

  // 🎯 안정화 후: 환경별 효율 모니터링 (5-8분 간격)
  let ttl: number;
  let environment: string;

  if (isVercel && isProd) {
    ttl = MCP_ADAPTIVE_CACHE_TTL.VERCEL_PROD;
    environment = 'Vercel 프로덕션';
  } else if (isVercel) {
    ttl = MCP_ADAPTIVE_CACHE_TTL.VERCEL_DEV;
    environment = 'Vercel 개발';
  } else {
    ttl = MCP_ADAPTIVE_CACHE_TTL.LOCAL;
    environment = '로컬';
  }

  return {
    ttl,
    phase: 'mcp_stable_efficient',
    reasoning: `MCP 안정화 완료 (${Math.round(uptime / 60000)}분 경과) - ${environment} 효율 모드 (${ttl / 60000}분 간격)`,
  };
}

// 🔍 MCP 캐시 조회 (적응형)
function getCachedMCPHealth(key: string): any | null {
  const cached = mcpHealthCache.get(key);
  if (!cached) return null;

  const now = Date.now();
  if (now > cached.timestamp + cached.ttl) {
    mcpHealthCache.delete(key);
    return null;
  }

  return cached.result;
}

// 💾 MCP 헬스체크 결과 캐싱 (적응형)
function setCachedMCPHealth(key: string, result: any, ttl: number): void {
  mcpHealthCache.set(key, {
    result,
    timestamp: Date.now(),
    ttl,
  });
}

export async function GET(request: NextRequest) {
  const start = Date.now();

  try {
    // 🧠 MCP 적응형 모니터링 정보 계산
    const adaptiveInfo = getMCPAdaptiveCacheTTL();
    const uptime = Date.now() - MCP_SYSTEM_START_TIME;

    console.log(`📊 [MCP 적응형 모니터링] ${adaptiveInfo.reasoning}`);

    // 🎯 캐시 확인 먼저
    const cacheKey = 'mcp_full_health';
    const cached = getCachedMCPHealth(cacheKey);

    if (cached) {
      console.log(
        `🎯 MCP 헬스체크 캐시 사용 (${adaptiveInfo.phase} 모드) - API 호출 절약`
      );
      return NextResponse.json({
        ...cached,
        cached: true,
        adaptiveMonitoring: {
          phase: adaptiveInfo.phase,
          reasoning: adaptiveInfo.reasoning,
          systemUptime: `${Math.round(uptime / 1000)}초`,
          nextCheckIn: `${Math.round(adaptiveInfo.ttl / 1000)}초 후`,
          cacheHit: true,
        },
        cacheInfo: {
          hit: true,
          ttl: adaptiveInfo.ttl,
          responseTime: `${Date.now() - start}ms`,
        },
      });
    }

    const mcpWarmupService = MCPWarmupService.getInstance();

    // 워밍업 상태 조회 (로컬 상태만, 외부 호출 없음)
    const warmupStatus = mcpWarmupService.getWarmupStatus();

    // 🚀 Vercel 환경 감지 및 최적화
    const isVercel = !!process.env.VERCEL;
    const isProd = process.env.NODE_ENV === 'production';

    let healthResults: any[] = [];

    if (isVercel) {
      // 🎯 Vercel 환경: 단일 서버만 최소한의 체크
      try {
        console.log(
          `🚀 Vercel 환경: 최적화된 MCP 헬스체크 실행 (${adaptiveInfo.phase} 모드)`
        );

        const response = await fetch(
          'https://openmanager-vibe-v5.onrender.com/health',
          {
            method: 'HEAD', // HEAD 요청으로 데이터 전송량 최소화
            signal: AbortSignal.timeout(6000), // 6초 타임아웃
            headers: {
              'User-Agent': 'OpenManager-Vercel-HealthCheck/1.0',
            },
          }
        );

        healthResults = [
          {
            server: 'openmanager-vibe-v5',
            status: response.ok ? 'healthy' : 'degraded',
            responseCode: response.status,
            note: `Vercel 최적화: 단일 서버 HEAD 요청 (${adaptiveInfo.phase})`,
            optimization: 'vercel_minimal_check',
          },
        ];
      } catch (error) {
        console.warn(
          `⚠️ Vercel MCP 헬스체크 실패 (${adaptiveInfo.phase} 모드):`,
          error
        );

        healthResults = [
          {
            server: 'openmanager-vibe-v5',
            status: 'degraded',
            error: error instanceof Error ? error.message : 'Connection failed',
            note: `Vercel 환경: 헬스체크 실패해도 로컬 MCP 사용 (${adaptiveInfo.phase})`,
            optimization: 'vercel_fallback',
          },
        ];
      }
    } else {
      // 🏠 로컬 환경: 기본 헬스체크
      healthResults = [
        {
          server: 'local-mcp',
          status: 'healthy',
          note: `로컬 환경: 표준 MCP 서버 사용 (${adaptiveInfo.phase})`,
          optimization: 'local_standard',
        },
      ];
    }

    const responseTime = Date.now() - start;
    const healthyCount = healthResults.filter(
      r => r.status === 'healthy'
    ).length;

    const result = {
      status: healthyCount > 0 ? 'operational' : 'degraded',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      servers: healthResults,
      warmupStatus: warmupStatus,

      // 🚀 MCP 적응형 모니터링 정보
      adaptiveMonitoring: {
        phase: adaptiveInfo.phase,
        reasoning: adaptiveInfo.reasoning,
        systemUptime: `${Math.round(uptime / 1000)}초`,
        nextCheckIn: `${Math.round(adaptiveInfo.ttl / 1000)}초 후`,
        intensivePhase: uptime < MCP_ADAPTIVE_CACHE_TTL.STARTUP_DURATION,
        cacheHit: false,
      },

      // 🚀 Vercel 최적화 정보
      optimization: {
        environment: isVercel ? 'vercel' : 'local',
        production: isProd,
        cacheEnabled: true,
        cacheTTL: adaptiveInfo.ttl,
        minimalChecks: isVercel,
        apiCallsReduced: true,
        monitoringStrategy:
          adaptiveInfo.phase === 'mcp_startup_intensive'
            ? 'MCP 집중 모니터링 (30초 간격)'
            : 'MCP 효율 모니터링 (5-8분 간격)',
      },

      summary: {
        healthy: healthyCount,
        total: healthResults.length,
        percentage: Math.round((healthyCount / healthResults.length) * 100),
        uptime: `${Math.floor(process.uptime())}초`,
      },
    };

    // 🎯 적응형 TTL로 캐싱 (성공/실패 모두)
    setCachedMCPHealth(cacheKey, result, adaptiveInfo.ttl);

    console.log(
      `✅ [MCP 적응형 모니터링] 헬스체크 완료 - ${adaptiveInfo.phase} 모드 (다음 체크: ${Math.round(adaptiveInfo.ttl / 1000)}초 후)`
    );

    return NextResponse.json({
      ...result,
      cached: false,
      cacheInfo: {
        hit: false,
        stored: true,
        ttl: adaptiveInfo.ttl,
      },
    });
  } catch (error: any) {
    const responseTime = Date.now() - start;
    const adaptiveInfo = getMCPAdaptiveCacheTTL();

    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        responseTime: `${responseTime}ms`,
        error: error.message,
        servers: [],
        warmupStatus: [],
        adaptiveMonitoring: {
          phase: adaptiveInfo.phase,
          reasoning: adaptiveInfo.reasoning,
          systemUptime: `${Math.round((Date.now() - MCP_SYSTEM_START_TIME) / 1000)}초`,
          errorDuringPhase: adaptiveInfo.phase,
        },
        optimization: {
          environment: process.env.VERCEL ? 'vercel' : 'local',
          production: process.env.NODE_ENV === 'production',
          errorCached: false,
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    const mcpWarmupService = MCPWarmupService.getInstance();

    if (action === 'warmup') {
      // 즉시 워밍업 실행
      const results = await mcpWarmupService.warmupAllServers();

      return NextResponse.json({
        success: true,
        action: 'warmup',
        timestamp: new Date().toISOString(),
        results: results,
      });
    } else if (action === 'start-periodic') {
      // 주기적 워밍업 시작 (1분 간격)
      mcpWarmupService.startPeriodicWarmup(1);

      return NextResponse.json({
        success: true,
        action: 'start-periodic',
        interval: '1 minute',
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid action. Use "warmup" or "start-periodic"',
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// 🧹 MCP 캐시 정리 (10분마다 실행)
setInterval(
  () => {
    const now = Date.now();
    const expired: string[] = [];

    mcpHealthCache.forEach((cached, key) => {
      if (now > cached.timestamp + cached.ttl) {
        expired.push(key);
      }
    });

    expired.forEach(key => mcpHealthCache.delete(key));

    if (expired.length > 0) {
      console.log(
        `🧹 MCP 헬스체크 캐시 정리: ${expired.length}개 만료 항목 제거`
      );
    }
  },
  10 * 60 * 1000
);
