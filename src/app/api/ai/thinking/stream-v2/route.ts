/**
 * 🤔 AI 생각중 상태 스트리밍 API v2
 *
 * Supabase Realtime 기반 실시간 상태 전송
 * - Server-Sent Events (SSE) 사용
 * - WebSocket 폴백 지원
 * - 무료 티어 최적화
 */

import { NextRequest } from 'next/server';
import { supabaseRealtimeAdapter } from '@/services/ai/adapters/supabase-realtime-adapter';
import type { ThinkingStep } from '@/services/ai/interfaces/distributed-ai.interface';
import debug from '@/utils/debug';

// Node.js Runtime 필요 (SSE 지원)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 스트림 설정
const STREAM_CONFIG = {
  heartbeatInterval: 30000, // 30초
  maxDuration: 300000, // 5분 (무료 티어 보호)
};

export function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('sessionId');

  if (!sessionId) {
    return new Response('Session ID is required', { status: 400 });
  }

  // SSE 헤더 설정
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // Nginx 버퍼링 비활성화
  });

  // ReadableStream 생성
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let isActive = true;

      // 초기 연결 메시지
      controller.enqueue(
        encoder.encode(
          `event: connected\ndata: ${JSON.stringify({ sessionId })}\n\n`
        )
      );

      // 초기 단계들 로드
      try {
        const existingSteps =
          await supabaseRealtimeAdapter.getThinkingSteps(sessionId);
        for (const step of existingSteps) {
          controller.enqueue(
            encoder.encode(
              `id: ${step.id}\nevent: thinking\ndata: ${JSON.stringify(step)}\n\n`
            )
          );
        }
      } catch (error) {
        debug.error('Failed to load existing steps:', error);
      }

      // Heartbeat 타이머
      const heartbeatTimer = setInterval(() => {
        if (!isActive) return;

        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch (error) {
          debug.error('Heartbeat error:', error);
          cleanup();
        }
      }, STREAM_CONFIG.heartbeatInterval);

      // Supabase Realtime 구독 (먼저 선언)
      let unsubscribe: (() => void) | null = null;

      // 정리 함수
      const cleanup = () => {
        isActive = false;
        clearInterval(heartbeatTimer);
        if (unsubscribe) {
          unsubscribe();
        }
      };

      // 구독 초기화
      unsubscribe = await supabaseRealtimeAdapter.subscribeToSession(
        sessionId,
        (step: ThinkingStep) => {
          if (!isActive) return;

          try {
            // 새로운 생각 단계 전송
            const data = JSON.stringify(step);
            controller.enqueue(
              encoder.encode(
                `id: ${step.id}\nevent: thinking\ndata: ${data}\n\n`
              )
            );

            // 완료 상태 감지
            if (step.status === 'completed' && step.step === 'AI 처리 완료') {
              controller.enqueue(
                encoder.encode(
                  `event: complete\ndata: ${JSON.stringify({
                    sessionId,
                    timestamp: Date.now(),
                  })}\n\n`
                )
              );
              cleanup();
              controller.close();
            }
          } catch (error) {
            debug.error('Failed to send thinking step:', error);
          }
        },
        (error: Error) => {
          debug.error('Supabase subscription error:', error);
          controller.enqueue(
            encoder.encode(
              `event: error\ndata: ${JSON.stringify({
                error: 'Subscription failed',
              })}\n\n`
            )
          );
        }
      );

      // 무료 티어 시간 제한 체크
      const timeoutTimer = setTimeout(() => {
        if (!isActive) return;

        controller.enqueue(
          encoder.encode(
            `event: timeout\ndata: ${JSON.stringify({
              message: 'Stream timeout reached',
            })}\n\n`
          )
        );
        cleanup();
        controller.close();
      }, STREAM_CONFIG.maxDuration);

      // 클라이언트 연결 종료 감지
      req.signal.addEventListener('abort', () => {
        clearTimeout(timeoutTimer);
        cleanup();
        controller.close();
      });
    },
  });

  return new Response(stream, { headers });
}

// POST: 수동으로 생각중 단계 추가 (테스트용)
export async function POST(req: NextRequest) {
  try {
    const {
      sessionId,
      step,
      description,
      status = 'processing',
      userId,
    } = await req.json();

    if (!sessionId || !step) {
      return new Response(
        JSON.stringify({ error: 'SessionId and step are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const stepId = await supabaseRealtimeAdapter.addThinkingStep(
      sessionId,
      {
        step,
        description,
        status,
        timestamp: Date.now(),
      },
      userId
    );

    return new Response(JSON.stringify({ success: true, stepId }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: 'Failed to add thinking step' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
