/**
 * HITL Approval SSE Subscription Endpoint
 *
 * @endpoint GET /api/ai/approval/subscribe?sessionId=xxx
 *
 * @description
 * Server-Sent Events를 통해 승인 대기 상태를 실시간으로 클라이언트에 전송
 * 기존 1회성 폴링의 레이스 컨디션 문제 해결
 *
 * @created 2025-12-30
 */

import type { NextRequest } from 'next/server';
import { isCloudRunEnabled, proxyToCloudRun } from '@/lib/ai-proxy/proxy';

// SSE 연결 유지 시간 (30초)
const SSE_TIMEOUT_MS = 30000;
// 폴링 간격 (3초)
const POLL_INTERVAL_MS = 3000;

/**
 * Cloud Run에서 승인 상태 조회
 */
async function getApprovalStatus(sessionId: string): Promise<{
  hasPending: boolean;
  action: {
    type: string;
    description: string;
    details?: Record<string, unknown>;
    requestedAt?: string;
    expiresAt?: string;
  } | null;
  _backend: string;
}> {
  if (isCloudRunEnabled()) {
    try {
      const result = await proxyToCloudRun({
        path: `/api/ai/approval/status?sessionId=${encodeURIComponent(sessionId)}`,
        method: 'GET',
        timeout: 5000, // 5초 타임아웃
      });

      if (result.success && result.data) {
        const data = result.data as {
          hasPending?: boolean;
          action?: {
            type: string;
            description: string;
            details?: Record<string, unknown>;
            requestedAt?: string;
            expiresAt?: string;
          };
        };
        return {
          hasPending: data.hasPending ?? false,
          action: data.action ?? null,
          _backend: 'cloud-run',
        };
      }
    } catch (error) {
      console.error('[SSE] Cloud Run approval check failed:', error);
    }
  }

  // 로컬 모드 또는 Cloud Run 실패 시
  return {
    hasPending: false,
    action: null,
    _backend: 'local',
  };
}

/**
 * SSE 엔드포인트
 */
export async function GET(req: NextRequest): Promise<Response> {
  const sessionId = req.nextUrl.searchParams.get('sessionId');

  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'sessionId is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const encoder = new TextEncoder();
  let isAborted = false;
  let pollTimer: ReturnType<typeof setTimeout> | null = null;
  let timeoutTimer: ReturnType<typeof setTimeout> | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      // 연결 시작 이벤트
      const sendEvent = (type: string, data: Record<string, unknown>) => {
        if (isAborted) return;
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type, ...data })}\n\n`)
          );
        } catch {
          isAborted = true;
        }
      };

      // 초기 상태 전송
      try {
        const initialStatus = await getApprovalStatus(sessionId);
        sendEvent('connected', {
          sessionId,
          hasPending: initialStatus.hasPending,
          action: initialStatus.action,
          _backend: initialStatus._backend,
        });
      } catch (error) {
        sendEvent('error', {
          message: 'Failed to get initial status',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      // 주기적 폴링
      const poll = async () => {
        if (isAborted) return;

        try {
          const status = await getApprovalStatus(sessionId);

          if (status.hasPending) {
            sendEvent('approval_pending', {
              sessionId,
              action: status.action,
              _backend: status._backend,
            });
          } else {
            // 승인 대기 없음 - heartbeat 전송
            sendEvent('heartbeat', {
              sessionId,
              timestamp: Date.now(),
            });
          }
        } catch (error) {
          console.error('[SSE] Poll error:', error);
        }

        // 다음 폴링 예약
        if (!isAborted) {
          pollTimer = setTimeout(poll, POLL_INTERVAL_MS);
        }
      };

      // 첫 폴링은 즉시 시작하지 않고 인터벌 후 시작
      pollTimer = setTimeout(poll, POLL_INTERVAL_MS);

      // 타임아웃 설정 (30초 후 연결 종료)
      timeoutTimer = setTimeout(() => {
        sendEvent('timeout', {
          message: 'Connection timeout, please reconnect',
          sessionId,
        });
        isAborted = true;
        controller.close();
      }, SSE_TIMEOUT_MS);
    },

    cancel() {
      isAborted = true;
      if (pollTimer) clearTimeout(pollTimer);
      if (timeoutTimer) clearTimeout(timeoutTimer);
    },
  });

  // 클라이언트 연결 해제 감지
  req.signal.addEventListener('abort', () => {
    isAborted = true;
    if (pollTimer) clearTimeout(pollTimer);
    if (timeoutTimer) clearTimeout(timeoutTimer);
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Nginx 버퍼링 비활성화
    },
  });
}
