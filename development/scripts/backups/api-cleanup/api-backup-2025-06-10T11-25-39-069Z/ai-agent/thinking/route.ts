/**
 * AI Agent Thinking Process Streaming API
 *
 * 🧠 실시간 사고 과정 스트리밍 API
 * - Server-Sent Events (SSE) 기반 실시간 스트리밍
 * - 단계별 사고 과정 전송
 * - 복사 방지 및 보안 기능
 * - 세션 기반 접근 제어
 */

import { NextRequest, NextResponse } from 'next/server';
import { ThinkingProcessor } from '../../../../modules/ai-agent/core/ThinkingProcessor';
import { authManager } from '../../../../lib/auth';

// 전역 ThinkingProcessor 인스턴스
const thinkingProcessor = new ThinkingProcessor();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const thinkingSessionId = searchParams.get('thinkingSessionId');
    const action = searchParams.get('action') || 'stream';

    // 인증 확인
    if (!sessionId || !authManager.hasPermission(sessionId, 'ai_agent:read')) {
      return NextResponse.json(
        {
          success: false,
          error: '인증이 필요합니다.',
        },
        { status: 401 }
      );
    }

    switch (action) {
      case 'stream':
        return handleThinkingStream(request, thinkingSessionId);

      case 'session':
        return handleGetSession(thinkingSessionId);

      case 'stats':
        return handleGetStats();

      case 'active':
        return handleGetActiveSessions();

      default:
        return NextResponse.json(
          {
            success: false,
            error: '지원하지 않는 액션입니다.',
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Thinking API Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: '사고 과정 API 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, data, sessionId: bodySessionId } = await request.json();
    const sessionId = bodySessionId || request.headers.get('x-session-id');

    // 인증 확인
    if (!sessionId || !authManager.hasPermission(sessionId, 'ai_agent:read')) {
      return NextResponse.json(
        {
          success: false,
          error: '인증이 필요합니다.',
        },
        { status: 401 }
      );
    }

    switch (action) {
      case 'start':
        return handleStartThinking(data);

      case 'update':
        return handleUpdateStep(data);

      case 'complete':
        return handleCompleteThinking(data);

      case 'simulate':
        return handleSimulateThinking(data);

      default:
        return NextResponse.json(
          {
            success: false,
            error: '지원하지 않는 액션입니다.',
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Thinking POST API Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: '사고 과정 처리 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}

// Server-Sent Events 스트리밍
async function handleThinkingStream(
  request: NextRequest,
  thinkingSessionId: string | null
) {
  if (!thinkingSessionId) {
    return NextResponse.json(
      {
        success: false,
        error: '사고 세션 ID가 필요합니다.',
      },
      { status: 400 }
    );
  }

  // SSE 헤더 설정
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
    'X-Accel-Buffering': 'no', // Nginx 버퍼링 비활성화
  });

  // ReadableStream 생성
  const stream = new ReadableStream({
    start(controller) {
      // 초기 연결 메시지
      const initialData = {
        type: 'connected',
        timestamp: Date.now(),
        message: '사고 과정 스트리밍이 시작되었습니다.',
      };

      controller.enqueue(`data: ${JSON.stringify(initialData)}\n\n`);

      // 사고 과정 콜백 등록
      const unsubscribe = thinkingProcessor.onThinking((session, step) => {
        if (session.sessionId === thinkingSessionId) {
          try {
            const eventData = {
              type: step ? 'step_update' : 'session_update',
              session: {
                sessionId: session.sessionId,
                status: session.status,
                totalDuration: session.totalDuration,
                steps: session.steps.map(s => ({
                  id: s.id,
                  step: s.step,
                  type: s.type,
                  title: s.title,
                  description: s.description,
                  status: s.status,
                  progress: s.progress,
                  duration: s.duration,
                })),
              },
              step: step
                ? {
                    id: step.id,
                    step: step.step,
                    type: step.type,
                    title: step.title,
                    description: step.description,
                    status: step.status,
                    progress: step.progress,
                    duration: step.duration,
                  }
                : null,
              timestamp: Date.now(),
            };

            controller.enqueue(`data: ${JSON.stringify(eventData)}\n\n`);

            // 세션 완료 시 스트림 종료
            if (session.status === 'completed' || session.status === 'error') {
              setTimeout(() => {
                controller.enqueue(
                  `data: ${JSON.stringify({ type: 'stream_end' })}\n\n`
                );
                controller.close();
              }, 1000);
            }
          } catch (error) {
            console.error('SSE 전송 오류:', error);
          }
        }
      });

      // 연결 종료 시 정리
      request.signal.addEventListener('abort', () => {
        unsubscribe();
        controller.close();
      });

      // 30초 후 자동 종료 (타임아웃)
      setTimeout(() => {
        unsubscribe();
        controller.enqueue(`data: ${JSON.stringify({ type: 'timeout' })}\n\n`);
        controller.close();
      }, 30000);
    },
  });

  return new NextResponse(stream, { headers });
}

// 사고 세션 조회
async function handleGetSession(thinkingSessionId: string | null) {
  if (!thinkingSessionId) {
    return NextResponse.json(
      {
        success: false,
        error: '사고 세션 ID가 필요합니다.',
      },
      { status: 400 }
    );
  }

  const session = thinkingProcessor.getThinkingSession(thinkingSessionId);

  if (!session) {
    return NextResponse.json(
      {
        success: false,
        error: '사고 세션을 찾을 수 없습니다.',
      },
      { status: 404 }
    );
  }

  // 보안을 위해 민감한 정보 제거
  const protectedSession =
    thinkingProcessor.getProtectedThinkingData(thinkingSessionId);

  return NextResponse.json({
    success: true,
    session: protectedSession,
  });
}

// 사고 과정 통계
async function handleGetStats() {
  const stats = thinkingProcessor.getThinkingStats();

  return NextResponse.json({
    success: true,
    stats,
  });
}

// 활성 사고 세션 목록
async function handleGetActiveSessions() {
  const activeSessions = thinkingProcessor.getActiveThinkingSessions();

  // 보안을 위해 민감한 정보 제거
  const protectedSessions = activeSessions
    .map(session =>
      thinkingProcessor.getProtectedThinkingData(session.sessionId)
    )
    .filter(Boolean);

  return NextResponse.json({
    success: true,
    activeSessions: protectedSessions,
  });
}

// 사고 과정 시작
async function handleStartThinking(data: any) {
  const { queryId, query, mode } = data;

  if (!queryId || !query || !mode) {
    return NextResponse.json(
      {
        success: false,
        error: '필수 파라미터가 누락되었습니다.',
      },
      { status: 400 }
    );
  }

  const thinkingSessionId = thinkingProcessor.startThinking(
    queryId,
    query,
    mode
  );

  return NextResponse.json({
    success: true,
    thinkingSessionId,
    message: '사고 과정이 시작되었습니다.',
  });
}

// 사고 단계 업데이트
async function handleUpdateStep(data: any) {
  const { sessionId, stepId, updates } = data;

  if (!sessionId || !stepId || !updates) {
    return NextResponse.json(
      {
        success: false,
        error: '필수 파라미터가 누락되었습니다.',
      },
      { status: 400 }
    );
  }

  try {
    thinkingProcessor.updateThinkingStep(sessionId, stepId, updates);

    return NextResponse.json({
      success: true,
      message: '사고 단계가 업데이트되었습니다.',
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '업데이트 실패',
      },
      { status: 400 }
    );
  }
}

// 사고 과정 완료
async function handleCompleteThinking(data: any) {
  const { sessionId, result, error } = data;

  if (!sessionId) {
    return NextResponse.json(
      {
        success: false,
        error: '세션 ID가 필요합니다.',
      },
      { status: 400 }
    );
  }

  thinkingProcessor.completeThinking(sessionId, result, error);

  return NextResponse.json({
    success: true,
    message: '사고 과정이 완료되었습니다.',
  });
}

// 사고 과정 시뮬레이션 (데모용)
async function handleSimulateThinking(data: any) {
  const { sessionId, mode = 'advanced', intentType = 'general' } = data;

  if (!sessionId) {
    return NextResponse.json(
      {
        success: false,
        error: '세션 ID가 필요합니다.',
      },
      { status: 400 }
    );
  }

  try {
    // 템플릿 기반 단계 생성
    const steps = thinkingProcessor.getThinkingTemplate(mode, intentType);

    // 각 단계를 세션에 추가
    for (const step of steps) {
      thinkingProcessor.addThinkingStep(
        sessionId,
        step.type,
        step.title,
        step.description
      );
    }

    // 시뮬레이션 실행
    thinkingProcessor.simulateThinking(sessionId, steps);

    return NextResponse.json({
      success: true,
      message: '사고 과정 시뮬레이션이 시작되었습니다.',
      stepsCount: steps.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '시뮬레이션 실패',
      },
      { status: 400 }
    );
  }
}
