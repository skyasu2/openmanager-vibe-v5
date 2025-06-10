/**
 * 🌐 WebSocket 상태 확인 API
 * GET /api/websocket/status
 *
 * WebSocket 서버의 현재 상태를 확인합니다.
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // WebSocket 상태를 간단한 헬스체크로 확인
    let isConnected = false;

    try {
      // 웹소켓 서버의 POST 엔드포인트로 ping 테스트
      const baseUrl = request.nextUrl.origin;

      // 타임아웃을 위한 Promise.race 사용
      const testResponse = await Promise.race([
        fetch(`${baseUrl}/api/websocket/servers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'ping' }),
        }),
        new Promise<Response>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 3000)
        ),
      ]);

      isConnected = testResponse.ok;

      if (!isConnected) {
        console.warn('⚠️ WebSocket ping 테스트 실패:', testResponse.status);
      }
    } catch (error) {
      console.warn('⚠️ WebSocket 연결 테스트 실패:', error);
      isConnected = false;
    }

    return NextResponse.json({
      success: true,
      websocket: {
        connected: isConnected,
        status: isConnected ? 'healthy' : 'disconnected',
        type: 'Server-Sent Events (SSE)',
        endpoint: '/api/websocket/servers',
        lastCheck: new Date().toISOString(),
      },
      message: isConnected
        ? 'WebSocket (SSE) 서비스가 정상 동작 중입니다'
        : 'WebSocket (SSE) 서비스에 연결할 수 없습니다',
    });
  } catch (error) {
    console.error('❌ WebSocket 상태 확인 실패:', error);

    return NextResponse.json(
      {
        success: false,
        websocket: {
          connected: false,
          status: 'error',
          type: 'Server-Sent Events (SSE)',
          endpoint: '/api/websocket/servers',
          lastCheck: new Date().toISOString(),
        },
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'WebSocket 상태 확인 중 오류가 발생했습니다',
      },
      { status: 500 }
    );
  }
}

/**
 * POST - WebSocket 연결 테스트
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'ping') {
      return NextResponse.json({
        success: true,
        type: 'pong',
        timestamp: new Date().toISOString(),
        message: 'WebSocket ping 응답 성공',
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Unknown action',
      },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid request',
      },
      { status: 400 }
    );
  }
}
