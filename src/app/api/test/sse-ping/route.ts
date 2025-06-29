/**
 * 🧪 SSE Ping 수동 테스트 API
 *
 * 개발/테스트 환경에서 SSE 연결 상태를 수동으로 확인
 * - ping 강제 전송
 * - 연결 상태 체크
 * - 메트릭 확인
 */

import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'status';
  const target = searchParams.get('target') || 'both'; // servers, predictions, both

  console.log(`🧪 SSE Ping 테스트 - Action: ${action}, Target: ${target}`);

  try {
    switch (action) {
      case 'ping':
        return await testSSEPing(target);
      case 'status':
        return await getSSEStatus(target);
      case 'metrics':
        return await getSSEMetrics(target);
      default:
        return Response.json(
          {
            error: 'Invalid action',
            availableActions: ['ping', 'status', 'metrics'],
            usage: '/api/test/sse-ping?action=ping&target=servers',
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ SSE Ping 테스트 오류:', error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * SSE Ping 강제 테스트
 */
async function testSSEPing(target: string) {
  const results: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    target,
    tests: {},
  };

  if (target === 'servers' || target === 'both') {
    try {
      // 서버 SSE 엔드포인트 ping 테스트
      const response = await fetch(
        `${process.env.VERCEL_URL || 'http://localhost:3000'}/api/sse/servers`,
        {
          method: 'GET',
          headers: { Accept: 'text/event-stream' },
        }
      );

      results.tests.servers = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        accessible: response.ok,
        timestamp: new Date().toISOString(),
      };

      // 1초 후 연결 종료
      setTimeout(() => {
        if (response.body) {
          response.body.cancel();
        }
      }, 1000);
    } catch (error) {
      results.tests.servers = {
        error: error instanceof Error ? error.message : 'Unknown error',
        accessible: false,
      };
    }
  }

  if (target === 'predictions' || target === 'both') {
    try {
      // AI 예측 SSE 엔드포인트 ping 테스트
      const response = await fetch(
        `${process.env.VERCEL_URL || 'http://localhost:3000'}/api/sse/predictions`,
        {
          method: 'GET',
          headers: { Accept: 'text/event-stream' },
        }
      );

      results.tests.predictions = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        accessible: response.ok,
        timestamp: new Date().toISOString(),
      };

      // 1초 후 연결 종료
      setTimeout(() => {
        if (response.body) {
          response.body.cancel();
        }
      }, 1000);
    } catch (error) {
      results.tests.predictions = {
        error: error instanceof Error ? error.message : 'Unknown error',
        accessible: false,
      };
    }
  }

  const success = Object.values(results.tests).every(
    (test: any) => test.accessible !== false
  );

  return Response.json({
    success,
    message: success ? 'SSE 엔드포인트 접근 가능' : 'SSE 연결 테스트 실패',
    ...results,
  });
}

/**
 * SSE 상태 확인
 */
async function getSSEStatus(target: string) {
  return Response.json({
    success: true,
    status: {
      environment: process.env.NODE_ENV,
      sseEndpoints: {
        servers: '/api/sse/servers',
        predictions: '/api/sse/predictions',
      },
      pingEnabled:
        process.env.NODE_ENV === 'production' ||
        process.env.FORCE_SSE_PING === 'true',
      target,
      currentTime: new Date().toISOString(),
      instructions: {
        enablePing: 'FORCE_SSE_PING=true 환경변수 설정',
        testPing: '/api/test/sse-ping?action=ping&target=both',
        getMetrics: '/api/test/sse-ping?action=metrics',
      },
    },
  });
}

/**
 * SSE 메트릭 확인
 */
async function getSSEMetrics(target: string) {
  return Response.json({
    success: true,
    metrics: {
      environment: process.env.NODE_ENV,
      serverConfig: {
        updateInterval: '20초',
        keepAliveInterval: '5분 (운영환경만)',
        timeout: '30분',
        maxServers: 5,
      },
      predictionConfig: {
        updateInterval: '30초',
        keepAliveInterval: '5분 (운영환경만)',
        timeout: '30분',
        analysisEngine: 'UnifiedAI',
      },
      currentStatus: {
        pingEnabled:
          process.env.NODE_ENV === 'production' ||
          process.env.FORCE_SSE_PING === 'true',
        timestamp: new Date().toISOString(),
      },
    },
  });
}

export async function POST() {
  return Response.json(
    {
      error: 'Method not allowed',
      supportedMethods: ['GET'],
    },
    { status: 405 }
  );
}
