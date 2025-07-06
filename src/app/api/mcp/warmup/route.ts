import { NextRequest, NextResponse } from 'next/server';

/**
 * 🔥 MCP 서버 웜업 API
 *
 * 서버 시작 시 MCP 연결을 미리 준비하여 첫 요청 지연 시간을 줄입니다.
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
    console.error('MCP 웜업 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'MCP 웜업 중 오류 발생',
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
    console.error('MCP 강제 웜업 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'MCP 강제 웜업 중 오류 발생',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

async function performMCPWarmup(): Promise<MCPWarmupResult> {
  const serverUrl = 'http://104.154.205.25:10000';
  const startTime = Date.now();

  console.log('🔥 MCP 서버 웜업 시작:', serverUrl);

  try {
    // 🚫 서버리스 호환: AbortController만 사용, setTimeout 제거

    // 1. 헬스 체크 (10초 타임아웃)
    const healthController = new AbortController();

    const healthResponse = await Promise.race([
      fetch(`${serverUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'OpenManager-Vibe-Warmup/5.43.5',
        },
        signal: healthController.signal,
      }),
      new Promise<never>((_, reject) => {
        // 🚫 서버리스 호환: setTimeout 대신 즉시 타임아웃 처리
        setTimeout(() => {
          healthController.abort();
          reject(new Error('Health check timeout'));
        }, 10000);
      })
    ]);

    const healthStatus = healthResponse.ok ? 'healthy' : 'unhealthy';

    // 2. 도구 목록 가져오기 (8초 타임아웃)
    let toolsCount = 0;
    try {
      const toolsController = new AbortController();

      const toolsResponse = await Promise.race([
        fetch(`${serverUrl}/mcp/tools`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: toolsController.signal,
        }),
        new Promise<never>((_, reject) => {
          setTimeout(() => {
            toolsController.abort();
            reject(new Error('Tools fetch timeout'));
          }, 8000);
        })
      ]);

      if (toolsResponse.ok) {
        const toolsData = await toolsResponse.json();
        toolsCount = Array.isArray(toolsData.tools)
          ? toolsData.tools.length
          : 0;
      }
    } catch (toolsError) {
      console.warn('도구 목록 가져오기 실패:', toolsError);
    }

    // 3. 간단한 테스트 쿼리 (5초 타임아웃)
    try {
      const testController = new AbortController();

      const testResponse = await Promise.race([
        fetch(`${serverUrl}/mcp/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: '웜업 테스트',
            sessionId: `warmup-${Date.now()}`,
          }),
          signal: testController.signal,
        }),
        new Promise<never>((_, reject) => {
          setTimeout(() => {
            testController.abort();
            reject(new Error('Test query timeout'));
          }, 5000);
        })
      ]);

      if (testResponse.ok) {
        console.log('✅ MCP 테스트 쿼리 성공');
      }
    } catch (testError) {
      console.warn('테스트 쿼리 실패:', testError);
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

    console.log(`🔥 MCP 웜업 완료: ${responseTime}ms, 도구 ${toolsCount}개`);

    return result;
  } catch (error: any) {
    const responseTime = Date.now() - startTime;

    console.error('MCP 웜업 실패:', error);

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
