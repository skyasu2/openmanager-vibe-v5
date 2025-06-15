/**
 * 🔄 실시간 AI 로그 스트리밍 API
 * 
 * Server-Sent Events를 통한 실시간 AI 로그 스트리밍
 * - RealTimeAILogCollector와 연동
 * - 세션별 필터링 지원
 * - 관리자 페이지와 사이드바 공용
 */

import { NextRequest } from 'next/server';
import { RealTimeAILogCollector } from '@/services/ai/logging/RealTimeAILogCollector';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');
  const mode = searchParams.get('mode') || 'sidebar'; // 'sidebar' | 'admin'

  // Server-Sent Events 헤더 설정
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET',
    'Access-Control-Allow-Headers': 'Content-Type',
  });

  const logCollector = RealTimeAILogCollector.getInstance();

  // ReadableStream 생성
  const stream = new ReadableStream({
    start(controller) {
      // 초기 연결 메시지
      const initMessage = `data: ${JSON.stringify({
        type: 'connection',
        message: 'AI 로그 스트림 연결됨',
        timestamp: new Date().toISOString(),
        sessionId: sessionId || 'all',
        mode
      })}\n\n`;

      controller.enqueue(new TextEncoder().encode(initMessage));

      // 로그 이벤트 리스너
      const logHandler = (log: any) => {
        // 세션 필터링
        if (sessionId && log.sessionId !== sessionId) {
          return;
        }

        // 관리자 모드에서는 모든 로그, 사이드바 모드에서는 중요한 로그만
        if (mode === 'sidebar') {
          // 사이드바에서는 ERROR, WARNING, SUCCESS, PROCESSING만 표시
          if (!['ERROR', 'WARNING', 'SUCCESS', 'PROCESSING'].includes(log.level)) {
            return;
          }
        }

        const message = `data: ${JSON.stringify(log)}\n\n`;

        try {
          controller.enqueue(new TextEncoder().encode(message));
        } catch (error) {
          console.error('스트림 전송 오류:', error);
        }
      };

      // 이벤트 리스너 등록
      logCollector.on('log_added', logHandler);

      // 기존 로그 전송 (최근 10개)
      if (sessionId) {
        const existingLogs = logCollector.getSessionLogs(sessionId).slice(-10);
        existingLogs.forEach(log => {
          const message = `data: ${JSON.stringify(log)}\n\n`;
          controller.enqueue(new TextEncoder().encode(message));
        });
      }

      // Keep-alive 핑 (30초마다)
      const pingInterval = setInterval(() => {
        try {
          const pingMessage = `data: ${JSON.stringify({
            type: 'ping',
            timestamp: new Date().toISOString()
          })}\n\n`;

          controller.enqueue(new TextEncoder().encode(pingMessage));
        } catch (error) {
          console.error('핑 전송 오류:', error);
          clearInterval(pingInterval);
        }
      }, 30000);

      // 정리 함수
      const cleanup = () => {
        logCollector.off('log_added', logHandler);
        clearInterval(pingInterval);
      };

      // 연결 종료 시 정리
      request.signal.addEventListener('abort', cleanup);

      // 스트림 종료 시 정리
      return cleanup;
    },

    cancel() {
      console.log('AI 로그 스트림 연결 종료');
    }
  });

  return new Response(stream, { headers });
}

// POST 요청으로 수동 로그 추가 (테스트용)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, engine, message, level = 'INFO', metadata } = body;

    if (!sessionId || !engine || !message) {
      return Response.json(
        { error: '필수 필드가 누락되었습니다: sessionId, engine, message' },
        { status: 400 }
      );
    }

    const logCollector = RealTimeAILogCollector.getInstance();

    // 수동 로그 추가
    const log = {
      id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      level: level as any,
      engine,
      module: 'manual',
      message,
      sessionId,
      metadata: {
        manual: true,
        ...metadata
      }
    };

    // 로그 추가 (내부 메서드 호출)
    (logCollector as any).addLog(log);

    return Response.json({
      success: true,
      message: '로그가 추가되었습니다',
      log
    });

  } catch (error) {
    console.error('수동 로그 추가 오류:', error);
    return Response.json(
      { error: '로그 추가 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
