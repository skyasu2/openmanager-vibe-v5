/**
 * 🤔 AI 생각중 상태 스트리밍 API
 * 
 * Redis Streams 기반 실시간 상태 전송
 * - Server-Sent Events (SSE) 사용
 * - 무료 티어 최적화 (명령 수 최소화)
 * - 자동 재연결 지원
 */

import { NextRequest } from 'next/server';
import { redisCacheAdapter } from '@/services/ai/adapters/service-adapters';
import type { ThinkingStep } from '@/services/ai/interfaces/distributed-ai.interface';

// Node.js Runtime 필요 (SSE 지원)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 스트림 설정
const STREAM_CONFIG = {
  heartbeatInterval: 30000, // 30초
  maxDuration: 300000, // 5분 (무료 티어 보호)
  batchSize: 10, // Redis 명령 최소화
};

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('sessionId');
  
  if (!sessionId) {
    return new Response('Session ID is required', { status: 400 });
  }

  // SSE 헤더 설정
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // Nginx 버퍼링 비활성화
  });

  // ReadableStream 생성
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let lastId = '0';
      let isActive = true;
      const startTime = Date.now();

      // 초기 연결 메시지
      controller.enqueue(
        encoder.encode(`event: connected\ndata: ${JSON.stringify({ sessionId })}\n\n`)
      );

      // Heartbeat 타이머
      const heartbeatTimer = setInterval(() => {
        if (!isActive) return;
        
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch (error) {
          console.error('Heartbeat error:', error);
          cleanup();
        }
      }, STREAM_CONFIG.heartbeatInterval);

      // 정리 함수
      const cleanup = () => {
        isActive = false;
        clearInterval(heartbeatTimer);
        clearInterval(pollTimer);
      };

      // Redis 폴링 (배치 처리로 명령 최소화)
      const pollTimer = setInterval(async () => {
        if (!isActive) return;

        // 무료 티어 시간 제한 체크
        if (Date.now() - startTime > STREAM_CONFIG.maxDuration) {
          controller.enqueue(
            encoder.encode(`event: timeout\ndata: ${JSON.stringify({ 
              message: 'Stream timeout reached' 
            })}\n\n`)
          );
          cleanup();
          controller.close();
          return;
        }

        try {
          // Redis Stream 읽기
          const steps = await redisCacheAdapter.getThinkingSteps(sessionId, lastId);
          
          if (steps.length > 0) {
            // 배치로 전송
            const batch = steps.slice(0, STREAM_CONFIG.batchSize);
            
            for (const step of batch) {
              const data = JSON.stringify({
                id: step.id,
                step: step.step,
                description: step.description,
                status: step.status,
                timestamp: step.timestamp,
                duration: step.duration,
                service: step.service,
              });

              controller.enqueue(
                encoder.encode(`id: ${step.id}\nevent: thinking\ndata: ${data}\n\n`)
              );

              lastId = step.id;

              // 완료 상태 감지
              if (step.status === 'completed' && step.step === 'AI 처리 완료') {
                controller.enqueue(
                  encoder.encode(`event: complete\ndata: ${JSON.stringify({ 
                    sessionId,
                    totalSteps: steps.length 
                  })}\n\n`)
                );
                cleanup();
                controller.close();
                return;
              }
            }
          }
        } catch (error) {
          console.error('Redis polling error:', error);
          
          // 에러 전송
          controller.enqueue(
            encoder.encode(`event: error\ndata: ${JSON.stringify({ 
              error: 'Failed to fetch thinking steps' 
            })}\n\n`)
          );
        }
      }, 1000); // 1초마다 폴링

      // 클라이언트 연결 종료 감지
      req.signal.addEventListener('abort', () => {
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
    const { sessionId, step, description, status = 'processing' } = await req.json();

    if (!sessionId || !step) {
      return new Response(
        JSON.stringify({ error: 'SessionId and step are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const stepId = await redisCacheAdapter.addThinkingStep(sessionId, {
      step,
      description,
      status,
      timestamp: Date.now(),
    });

    return new Response(
      JSON.stringify({ success: true, stepId }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to add thinking step' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}