import type { NextRequest } from 'next/server';
import { alertsEmitter } from '@/lib/events/alertsEmitter';
import type { AlertEvent } from '@/schemas/api.schema';

export const dynamic = 'force-dynamic'; // Vercel edge 캐싱 방지

/**
 * Server-Sent Events (SSE) endpoint for real-time alerts
 * GET /api/alerts/stream
 *
 * Streams real-time alert events to connected clients
 */
export async function GET(req: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      // 처음 연결 시 ping
      controller.enqueue(`event: ping\ndata: connected\n\n`);

      // Type-safe listener for alert events
      const listener = (alert: AlertEvent) => {
        controller.enqueue(`data: ${JSON.stringify(alert)}\n\n`);
      };

      alertsEmitter.on('alert', listener);

      // 연결 종료 시 리스너 제거
      req.signal.addEventListener('abort', () => {
        alertsEmitter.off('alert', listener);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
