import type { NextRequest } from 'next/server';
import { alertsEmitter } from '@/lib/events/alertsEmitter';

export const dynamic = 'force-dynamic'; // Vercel edge 캐싱 방지

export async function GET(req: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      // 처음 연결 시 ping
      controller.enqueue(`event: ping\ndata: connected\n\n`);

      const listener = (alert: any) => {
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
