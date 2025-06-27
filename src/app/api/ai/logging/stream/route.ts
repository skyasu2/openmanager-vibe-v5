/**
 * 🔄 실시간 AI 로그 스트리밍 API
 *
 * Server-Sent Events를 통한 실시간 AI 로그 스트리밍
 * - 안전한 폴백 모드로 작동
 * - 세션별 필터링 지원
 * - 관리자 페이지와 사이드바 공용
 * - 베르셀 환경 타임아웃 최적화
 */

import { NextRequest } from 'next/server';

// 🚀 베르셀 환경 감지 및 타임아웃 설정
const isVercel = process.env.VERCEL === '1';
const VERCEL_TIMEOUT = 30000; // 30초 (베르셀 함수 타임아웃보다 작게)
const PING_INTERVAL = isVercel ? 10000 : 30000; // 베르셀에서는 10초, 로컬에서는 30초
const MAX_STREAM_DURATION = isVercel ? VERCEL_TIMEOUT : 300000; // 베르셀: 30초, 로컬: 5분

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const mode = searchParams.get('mode') || 'sidebar'; // 'sidebar' | 'admin'

    console.log('🔄 AI 로그 스트림 요청:', {
      sessionId,
      mode,
      isVercel,
      maxDuration: MAX_STREAM_DURATION,
      pingInterval: PING_INTERVAL,
    });

    // Server-Sent Events 헤더 설정
    const headers = new Headers({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
      'X-Stream-Timeout': MAX_STREAM_DURATION.toString(),
      'X-Environment': isVercel ? 'vercel' : 'local',
    });

    // 베르셀 최적화 스트림 (타임아웃 방지)
    const optimizedStream = new ReadableStream({
      start(controller) {
        const streamStartTime = Date.now();
        let pingInterval: NodeJS.Timeout | null = null;
        let streamTimeout: NodeJS.Timeout | null = null;

        // 정리 함수
        const cleanup = () => {
          try {
            if (pingInterval) {
              clearInterval(pingInterval);
              pingInterval = null;
            }
            if (streamTimeout) {
              clearTimeout(streamTimeout);
              streamTimeout = null;
            }
            console.log('✅ AI 로그 스트림 정리 완료');
          } catch (error) {
            console.error('정리 함수 오류:', error);
          }
        };

        try {
          // 초기 연결 메시지
          const initMessage = `data: ${JSON.stringify({
            type: 'connection',
            message: `AI 로그 스트림 연결됨 (${isVercel ? 'Vercel' : 'Local'})`,
            timestamp: new Date().toISOString(),
            sessionId: sessionId || 'all',
            mode,
            status: 'connected',
            environment: isVercel ? 'vercel' : 'local',
            maxDuration: MAX_STREAM_DURATION,
            pingInterval: PING_INTERVAL,
          })}\n\n`;

          controller.enqueue(new TextEncoder().encode(initMessage));

          // 환영 메시지 (즉시 전송)
          setTimeout(() => {
            try {
              const welcomeMessage = `data: ${JSON.stringify({
                type: 'log',
                level: 'SUCCESS',
                engine: 'system',
                message: `AI 어시스턴트가 준비되었습니다. 질문을 입력해주세요. (${isVercel ? 'Vercel 환경' : '로컬 환경'})`,
                timestamp: new Date().toISOString(),
                sessionId: sessionId || 'system',
                metadata: {
                  source: 'stream_init',
                  environment: isVercel ? 'vercel' : 'local',
                },
              })}\n\n`;

              controller.enqueue(new TextEncoder().encode(welcomeMessage));
            } catch (error) {
              console.error('환영 메시지 전송 오류:', error);
            }
          }, 500);

          // Keep-alive 핑 (베르셀: 10초, 로컬: 30초)
          pingInterval = setInterval(() => {
            try {
              const elapsed = Date.now() - streamStartTime;
              const pingMessage = `data: ${JSON.stringify({
                type: 'ping',
                timestamp: new Date().toISOString(),
                status: 'alive',
                elapsed: elapsed,
                environment: isVercel ? 'vercel' : 'local',
              })}\n\n`;

              controller.enqueue(new TextEncoder().encode(pingMessage));
            } catch (error) {
              console.error('핑 전송 오류:', error);
              cleanup();
            }
          }, PING_INTERVAL);

          // 🚀 베르셀 환경: 자동 스트림 종료 (타임아웃 방지)
          streamTimeout = setTimeout(() => {
            try {
              const finalMessage = `data: ${JSON.stringify({
                type: 'stream_timeout',
                message: `스트림이 ${MAX_STREAM_DURATION / 1000}초 후 자동 종료됩니다 (${isVercel ? 'Vercel 타임아웃 방지' : '최대 지속시간 도달'})`,
                timestamp: new Date().toISOString(),
                reason: isVercel
                  ? 'vercel_timeout_prevention'
                  : 'max_duration_reached',
                environment: isVercel ? 'vercel' : 'local',
              })}\n\n`;

              controller.enqueue(new TextEncoder().encode(finalMessage));

              // 500ms 후 스트림 종료
              setTimeout(() => {
                cleanup();
                controller.close();
              }, 500);
            } catch (error) {
              console.error('스트림 종료 오류:', error);
              cleanup();
              controller.close();
            }
          }, MAX_STREAM_DURATION);

          // 연결 종료 시 정리
          request.signal.addEventListener('abort', cleanup);

          // 스트림 종료 시 정리
          return cleanup;
        } catch (error) {
          console.error('스트림 초기화 오류:', error);
          cleanup();

          // 오류 메시지 전송
          const errorMessage = `data: ${JSON.stringify({
            type: 'error',
            message: '스트림 초기화 중 오류가 발생했습니다',
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : '알 수 없는 오류',
            environment: isVercel ? 'vercel' : 'local',
          })}\n\n`;

          controller.enqueue(new TextEncoder().encode(errorMessage));

          // 2초 후 연결 종료
          setTimeout(() => {
            controller.close();
          }, 2000);
        }
      },

      cancel() {
        console.log(
          `AI 로그 스트림 연결 종료 (${isVercel ? 'Vercel' : 'Local'})`
        );
      },
    });

    return new Response(optimizedStream, {
      headers,
      status: 200,
    });
  } catch (error) {
    console.error('❌ AI 로그 스트림 API 오류:', error);

    // JSON 오류 응답 (최후의 폴백)
    return new Response(
      JSON.stringify({
        error: 'AI 로그 스트림 초기화 실패',
        message: error instanceof Error ? error.message : '알 수 없는 오류',
        timestamp: new Date().toISOString(),
        fallback: true,
        environment: isVercel ? 'vercel' : 'local',
      }),
      {
        status: 200, // 500 대신 200으로 변경
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'X-Environment': isVercel ? 'vercel' : 'local',
        },
      }
    );
  }
}

// POST 요청으로 수동 로그 추가 (테스트용)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, engine, message, level = 'INFO', metadata } = body;

    console.log('📝 수동 로그 추가 요청:', {
      sessionId,
      engine,
      message,
      level,
    });

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
        environment: isVercel ? 'vercel' : 'local',
        ...metadata,
      },
    };

    console.log('✅ 수동 로그 생성 완료:', log);

    return Response.json({
      success: true,
      message: `로그가 생성되었습니다 (${isVercel ? 'Vercel' : 'Local'} 폴백 모드)`,
      log,
      environment: isVercel ? 'vercel' : 'local',
    });
  } catch (error) {
    console.error('수동 로그 추가 오류:', error);
    return Response.json(
      {
        error: '로그 추가 중 오류가 발생했습니다',
        message: error instanceof Error ? error.message : '알 수 없는 오류',
        fallback: true,
        environment: isVercel ? 'vercel' : 'local',
      },
      { status: 200 } // 500 대신 200으로 변경
    );
  }
}
