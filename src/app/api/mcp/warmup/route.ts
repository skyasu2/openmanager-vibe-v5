import { NextRequest, NextResponse } from 'next/server';

/**
 * 🔥 MCP 서버 웜업 API
 *
 * Render에서 호스팅되는 MCP 서버를 웜업합니다.
 * 콜드 스타트 문제를 해결하여 응답 시간을 개선합니다.
 */

interface MCPWarmupResult {
  success: boolean;
  serverUrl: string;
  healthStatus: 'healthy' | 'unhealthy' | 'unknown';
  toolsCount: number;
  responseTime: number;
  lastWarmup: string;
  error?: string;
}

// 웜업 상태 캐시 (메모리 기반)
let warmupCache: MCPWarmupResult | null = null;
let lastWarmupTime = 0;
const WARMUP_CACHE_TTL = 5 * 60 * 1000; // 5분

export async function GET(request: NextRequest) {
  try {
    const now = Date.now();

    // 캐시된 웜업 결과가 유효한지 확인
    if (warmupCache && now - lastWarmupTime < WARMUP_CACHE_TTL) {
      return NextResponse.json({
        ...warmupCache,
        cached: true,
        cacheAge: Math.floor((now - lastWarmupTime) / 1000),
      });
    }

    // 새로운 웜업 실행
    const warmupResult = await performMCPWarmup();

    // 캐시 업데이트
    warmupCache = warmupResult;
    lastWarmupTime = now;

    return NextResponse.json({
      ...warmupResult,
      cached: false,
    });
  } catch (error: any) {
    console.error('MCP 서버 웜업 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'MCP 서버 웜업 중 오류 발생',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { forceRefresh } = await request.json();

    if (forceRefresh) {
      // 강제 새로고침 - 캐시 무시
      warmupCache = null;
      lastWarmupTime = 0;
    }

    const warmupResult = await performMCPWarmup();

    // 캐시 업데이트
    warmupCache = warmupResult;
    lastWarmupTime = Date.now();

    return NextResponse.json({
      ...warmupResult,
      forced: forceRefresh || false,
    });
  } catch (error: any) {
    console.error('MCP 서버 웜업 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'MCP 서버 웜업 중 오류 발생',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

async function performMCPWarmup(): Promise<MCPWarmupResult> {
  // 환경에 따라 서버 URL 결정
  const serverUrl = process.env.MCP_SERVER_URL || 'http://104.154.205.25:10000';
  const startTime = Date.now();

  console.log('🔥 MCP 서버 웜업 시작:', serverUrl);

  try {
    // 1. 헬스 체크로 서버 깨우기
    const healthController = new AbortController();
    const healthTimeout = setTimeout(() => healthController.abort(), 15000);

    const healthResponse = await fetch(`${serverUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'OpenManager-Vibe-Warmup/5.44.0',
      },
      signal: healthController.signal,
    });

    clearTimeout(healthTimeout);
    const healthStatus = healthResponse.ok ? 'healthy' : 'unhealthy';

    // 2. 도구 목록 가져오기로 완전 웜업
    let toolsCount = 0;
    try {
      const toolsController = new AbortController();
      const toolsTimeout = setTimeout(() => toolsController.abort(), 12000);

      const toolsResponse = await fetch(`${serverUrl}/mcp/tools`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: toolsController.signal,
      });

      clearTimeout(toolsTimeout);

      if (toolsResponse.ok) {
        const toolsData = await toolsResponse.json();
        toolsCount = Array.isArray(toolsData.tools)
          ? toolsData.tools.length
          : 0;
      }
    } catch (toolsError) {
      console.warn('도구 목록 가져오기 실패:', toolsError);
    }

    const responseTime = Date.now() - startTime;

    const result: MCPWarmupResult = {
      success: healthStatus === 'healthy',
      serverUrl,
      healthStatus,
      toolsCount,
      responseTime,
      lastWarmup: new Date().toISOString(),
    };

    console.log(
      `✅ MCP 서버 웜업 완료: ${responseTime}ms, 도구 ${toolsCount}개`
    );

    return result;
  } catch (error: any) {
    const responseTime = Date.now() - startTime;

    console.error('MCP 서버 웜업 실패:', error);

    return {
      success: false,
      serverUrl,
      healthStatus: 'unknown',
      toolsCount: 0,
      responseTime,
      lastWarmup: new Date().toISOString(),
      error: error.message,
    };
  }
}
