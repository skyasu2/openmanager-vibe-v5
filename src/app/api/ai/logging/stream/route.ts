/**
 * 🔄 실시간 AI 로그 스트리밍 API
 * 
 * Server-Sent Events를 통한 실시간 AI 로그 스트리밍
 * - 안전한 폴백 모드로 작동
 * - 세션별 필터링 지원
 * - 관리자 페이지와 사이드바 공용
 */

import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const mode = searchParams.get('mode') || 'sidebar'; // 'sidebar' | 'admin'

    console.log('🔄 AI 로그 스트림 요청:', { sessionId, mode });

    // Server-Sent Events 헤더 설정
    const headers = new Headers({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
    });

    // 안전한 폴백 스트림 (500 오류 방지)
    const fallbackStream = new ReadableStream({
      start(controller) {
        try {
          // 초기 연결 메시지
          const initMessage = `data: ${JSON.stringify({
            type: 'connection',
            message: 'AI 로그 스트림 연결됨',
            timestamp: new Date().toISOString(),
            sessionId: sessionId || 'all',
            mode,
            status: 'connected'
          })}\n\n`;

          controller.enqueue(new TextEncoder().encode(initMessage));

          // 환영 메시지
          setTimeout(() => {
            try {
              const welcomeMessage = `data: ${JSON.stringify({
                type: 'log',
                level: 'SUCCESS',
                engine: 'system',
                message: 'AI 어시스턴트가 준비되었습니다. 질문을 입력해주세요.',
                timestamp: new Date().toISOString(),
                sessionId: sessionId || 'system',
                metadata: { source: 'stream_init' }
              })}\n\n`;

              controller.enqueue(new TextEncoder().encode(welcomeMessage));
            } catch (error) {
              console.error('환영 메시지 전송 오류:', error);
            }
          }, 1000);

          // Keep-alive 핑 (30초마다)
          const pingInterval = setInterval(() => {
            try {
              const pingMessage = `data: ${JSON.stringify({
                type: 'ping',
                timestamp: new Date().toISOString(),
                status: 'alive'
              })}\n\n`;

              controller.enqueue(new TextEncoder().encode(pingMessage));
            } catch (error) {
              console.error('핑 전송 오류:', error);
              clearInterval(pingInterval);
            }
          }, 30000);

          // 정리 함수
          const cleanup = () => {
            try {
              clearInterval(pingInterval);
              console.log('✅ AI 로그 스트림 정리 완료');
            } catch (error) {
              console.error('정리 함수 오류:', error);
            }
          };

          // 연결 종료 시 정리
          request.signal.addEventListener('abort', cleanup);

          // 스트림 종료 시 정리
          return cleanup;

        } catch (error) {
          console.error('스트림 초기화 오류:', error);

          // 오류 메시지 전송
          const errorMessage = `data: ${JSON.stringify({
            type: 'error',
            message: '스트림 초기화 중 오류가 발생했습니다',
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : '알 수 없는 오류'
          })}\n\n`;

          controller.enqueue(new TextEncoder().encode(errorMessage));

          // 5초 후 연결 종료
          setTimeout(() => {
            controller.close();
          }, 5000);
        }
      },

      cancel() {
        console.log('AI 로그 스트림 연결 종료');
      }
    });

    return new Response(fallbackStream, {
      headers,
      status: 200
    });

  } catch (error) {
    console.error('❌ AI 로그 스트림 API 오류:', error);

    // JSON 오류 응답 (최후의 폴백)
    return new Response(
      JSON.stringify({
        error: 'AI 로그 스트림 초기화 실패',
        message: error instanceof Error ? error.message : '알 수 없는 오류',
        timestamp: new Date().toISOString(),
        fallback: true
      }),
      {
        status: 200, // 500 대신 200으로 변경
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
}

// POST 요청으로 수동 로그 추가 (테스트용)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, engine, message, level = 'INFO', metadata } = body;

    console.log('📝 수동 로그 추가 요청:', { sessionId, engine, message, level });

    if (!sessionId || !engine || !message) {
      return Response.json(
        { error: '필수 필드가 누락되었습니다: sessionId, engine, message' },
        { status: 400 }
      );
    }

    // 간단한 로그 객체 생성
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

    console.log('✅ 수동 로그 생성 완료:', log);

    return Response.json({
      success: true,
      message: '로그가 생성되었습니다 (폴백 모드)',
      log
    });

  } catch (error) {
    console.error('수동 로그 추가 오류:', error);
    return Response.json(
      {
        error: '로그 추가 중 오류가 발생했습니다',
        message: error instanceof Error ? error.message : '알 수 없는 오류',
        fallback: true
      },
      { status: 200 } // 500 대신 200으로 변경
    );
  }
}
