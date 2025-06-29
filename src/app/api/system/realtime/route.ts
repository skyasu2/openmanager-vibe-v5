import { systemLogger } from '@/lib/logger';
import { realTimeSystemStatus } from '@/services/system/RealTimeSystemStatus';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 🌐 실시간 시스템 상태 브로드캐스트 API (SSE)
 *
 * Server-Sent Events를 통한 실시간 상태 공유
 * - 모든 사용자에게 실시간 상태 브로드캐스트
 * - 자동 재연결 지원
 * - 베르셀 환경 최적화
 */

/**
 * GET - SSE 스트림 시작
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId') || 'anonymous';
  const userName = url.searchParams.get('userName') || '익명 사용자';

  // 클라이언트 IP 추출
  const clientIP =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown';

  systemLogger.info(`📡 SSE 연결 시작: ${userName} (${clientIP})`);

  // SSE 헤더 설정
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
  });

  // ReadableStream 생성
  const readable = new ReadableStream({
    start(controller) {
      // 사용자 등록
      realTimeSystemStatus.addUser(userId, userName, clientIP);

      // 초기 연결 메시지
      const welcomeMessage = {
        type: 'connected',
        message: '실시간 상태 스트림에 연결되었습니다.',
        userId,
        userName,
        timestamp: new Date().toISOString(),
      };

      controller.enqueue(`data: ${JSON.stringify(welcomeMessage)}\n\n`);

      // 상태 변경 리스너 등록
      const unsubscribe = realTimeSystemStatus.subscribe(state => {
        try {
          const stateMessage = {
            type: 'state_update',
            data: state,
            timestamp: new Date().toISOString(),
          };

          controller.enqueue(`data: ${JSON.stringify(stateMessage)}\n\n`);
        } catch (error) {
          systemLogger.error('SSE 메시지 전송 실패:', error);
        }
      });

      // Heartbeat (30초마다)
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(
            `data: ${JSON.stringify({
              type: 'heartbeat',
              timestamp: new Date().toISOString(),
            })}\n\n`
          );
        } catch (error) {
          systemLogger.error('SSE Heartbeat 실패:', error);
          clearInterval(heartbeatInterval);
        }
      }, 30000);

      // 연결 종료 처리
      const cleanup = () => {
        clearInterval(heartbeatInterval);
        unsubscribe();
        realTimeSystemStatus.removeUser(userId);
        systemLogger.info(`📡 SSE 연결 종료: ${userName} (${clientIP})`);
      };

      // 클라이언트 연결 종료 감지
      request.signal?.addEventListener('abort', cleanup);

      return cleanup;
    },

    cancel() {
      // 스트림이 취소되었을 때의 정리 작업
      realTimeSystemStatus.removeUser(userId);
      systemLogger.info(`📡 SSE 스트림 취소: ${userName} (${clientIP})`);
    },
  });

  return new NextResponse(readable, { headers });
}

/**
 * POST - 테스트 메시지 브로드캐스트 (개발용)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { message, type = 'test' } = body;

    // 테스트 메시지를 모든 연결된 사용자에게 브로드캐스트
    const testMessage = {
      type,
      message,
      timestamp: new Date().toISOString(),
    };

    // 현재 연결된 모든 사용자에게 상태 업데이트
    const currentState = realTimeSystemStatus.getCurrentState();
    systemLogger.info(`📡 테스트 메시지 브로드캐스트: ${message}`);

    return NextResponse.json({
      success: true,
      message: '테스트 메시지가 브로드캐스트되었습니다.',
      connectedUsers: currentState.connectedUsers.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    systemLogger.error('테스트 메시지 브로드캐스트 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: '테스트 메시지 브로드캐스트 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
