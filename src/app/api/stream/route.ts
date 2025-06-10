/**
 * 🔄 Server-Sent Events (SSE) 스트림 API
 *
 * Vercel 환경에서 WebSocket 대신 SSE를 사용한 실시간 데이터 스트리밍
 * - 서버 메트릭 실시간 업데이트
 * - 자동 재연결 지원
 * - 5분 제한 (Vercel 서버리스 함수 제한)
 */

import { NextResponse } from 'next/server';

interface ServerMetric {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'warning';
  cpu: number;
  memory: number;
  disk: number;
  uptime: number;
  lastUpdate: string;
  location?: string;
  type?: 'web' | 'database' | 'api' | 'cache';
}

// 실시간 서버 데이터 생성 함수
async function getRealtimeServerData(): Promise<ServerMetric[]> {
  // 실제 구현에서는 데이터베이스나 모니터링 API에서 가져옴
  const baseServers = [
    {
      id: 'web-01',
      name: 'Web Server 01',
      type: 'web' as const,
      location: 'Seoul',
    },
    {
      id: 'web-02',
      name: 'Web Server 02',
      type: 'web' as const,
      location: 'Tokyo',
    },
    {
      id: 'db-01',
      name: 'Database Primary',
      type: 'database' as const,
      location: 'Seoul',
    },
    {
      id: 'api-01',
      name: 'API Gateway',
      type: 'api' as const,
      location: 'Singapore',
    },
    {
      id: 'cache-01',
      name: 'Redis Cache',
      type: 'cache' as const,
      location: 'Seoul',
    },
  ];

  return baseServers.map(server => {
    // 실시간 변화를 시뮬레이션 (실제로는 실제 메트릭 수집)
    const cpu = Math.max(10, Math.min(95, 45 + Math.random() * 30 - 15));
    const memory = Math.max(20, Math.min(90, 60 + Math.random() * 20 - 10));
    const disk = Math.max(15, Math.min(85, 40 + Math.random() * 10 - 5));

    // 상태 계산
    let status: 'online' | 'offline' | 'warning' = 'online';
    if (cpu > 85 || memory > 85) status = 'warning';
    if (Math.random() < 0.02) status = 'offline'; // 2% 확률로 오프라인

    return {
      ...server,
      cpu: Math.round(cpu),
      memory: Math.round(memory),
      disk: Math.round(disk),
      status,
      uptime: Math.floor(Math.random() * 30 * 24 * 60 * 60), // 0-30일
      lastUpdate: new Date().toISOString(),
    };
  });
}

export async function GET() {
  console.log('🔄 SSE 스트림 시작');

  const encoder = new TextEncoder();

  const customReadable = new ReadableStream({
    start(controller) {
      // SSE 이벤트 전송 헬퍼
      const sendEvent = (data: any) => {
        const formatted = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(formatted));
      };

      // 연결 확인 이벤트
      sendEvent({
        type: 'connected',
        timestamp: Date.now(),
        message: '🔗 실시간 서버 모니터링 연결됨',
      });

      let updateCount = 0;

      // 주기적 서버 데이터 업데이트 (3초마다)
      const dataInterval = setInterval(async () => {
        try {
          const serverData = await getRealtimeServerData();
          updateCount++;

          sendEvent({
            type: 'server_update',
            data: serverData,
            timestamp: Date.now(),
            updateCount,
          });

          console.log(`📊 SSE 업데이트 #${updateCount} 전송됨`);
        } catch (error) {
          console.error('❌ SSE 데이터 생성 오류:', error);
          sendEvent({
            type: 'error',
            message:
              error instanceof Error ? error.message : '데이터 생성 실패',
            timestamp: Date.now(),
          });
        }
      }, 3000);

      // 연결 상태 확인 (30초마다)
      const heartbeatInterval = setInterval(() => {
        sendEvent({
          type: 'heartbeat',
          timestamp: Date.now(),
          uptime: updateCount * 3, // 초 단위
        });
      }, 30000);

      // Vercel 제한: 5분 후 연결 자동 종료
      const timeout = setTimeout(() => {
        console.log('⏰ SSE 스트림 5분 제한으로 종료');
        sendEvent({
          type: 'timeout',
          message: '5분 제한으로 연결을 종료합니다. 자동으로 재연결됩니다.',
          timestamp: Date.now(),
        });

        clearInterval(dataInterval);
        clearInterval(heartbeatInterval);
        controller.close();
      }, 300000); // 5분

      // 클린업을 위한 컨트롤러 저장
      (controller as any).cleanup = () => {
        clearInterval(dataInterval);
        clearInterval(heartbeatInterval);
        clearTimeout(timeout);
      };
    },

    cancel() {
      console.log('🔌 SSE 스트림 클라이언트에서 취소됨');
      // cleanup 함수가 있으면 실행
      if ((this as any).cleanup) {
        (this as any).cleanup();
      }
    },
  });

  return new Response(customReadable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'X-Accel-Buffering': 'no', // Nginx 버퍼링 비활성화
    },
  });
}

// 옵션 요청 처리 (CORS)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
