/**
 * 🌐 서버 실시간 데이터 WebSocket API
 * 
 * Phase 7.3: 실시간 데이터 통합
 * - 서버 상태 실시간 업데이트
 * - 메트릭 변화 감지 및 전송
 * - 클라이언트 연결 관리
 */

import { NextRequest } from 'next/server';

// 🔗 연결된 클라이언트 관리
const connectedClients = new Set<any>();

// 📊 모의 서버 데이터
const generateMockServerUpdate = () => {
  const servers = ['server-1', 'server-2', 'server-3', 'server-4'];
  const randomServer = servers[Math.floor(Math.random() * servers.length)];
  
  return {
    id: randomServer,
    status: Math.random() > 0.1 ? 'running' : 'error',
    cpu: Math.floor(Math.random() * 100),
    memory: Math.floor(Math.random() * 100),
    disk: Math.floor(Math.random() * 100),
    uptime: Math.floor(Math.random() * 86400),
    lastUpdate: new Date().toISOString(),
    metrics: {
      requests_per_second: Math.floor(Math.random() * 1000),
      response_time: Math.floor(Math.random() * 500),
      error_rate: Math.random() * 5,
    }
  };
};

// 🚨 모의 알림 생성
const generateMockAlert = () => {
  const levels = ['info', 'warning', 'error', 'critical'];
  const messages = [
    'CPU 사용률이 높습니다',
    '메모리 부족 상태입니다',
    '디스크 공간이 부족합니다',
    '응답 시간이 지연되고 있습니다',
    '서버가 정상적으로 복구되었습니다'
  ];
  
  const level = levels[Math.floor(Math.random() * levels.length)];
  const message = messages[Math.floor(Math.random() * messages.length)];
  
  return {
    level,
    title: level === 'critical' ? '긴급 알림' : level === 'error' ? '오류 알림' : '시스템 알림',
    message,
    timestamp: new Date().toISOString(),
    serverId: `server-${Math.floor(Math.random() * 4) + 1}`
  };
};

// 📡 WebSocket 업그레이드 처리 (모의)
export async function GET(request: NextRequest) {
  // Next.js는 기본적으로 WebSocket을 지원하지 않으므로 
  // 실제 구현에서는 별도의 WebSocket 서버가 필요합니다.
  // 여기서는 Server-Sent Events (SSE)로 구현합니다.
  
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
  });

  // 🔄 실시간 데이터 스트림 생성
  const stream = new ReadableStream({
    start(controller) {
      // 📡 연결 확인 메시지
      const sendMessage = (type: string, data: any) => {
        const message = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
        controller.enqueue(`data: ${message}\n\n`);
      };

      // 연결 성공 메시지
      sendMessage('connected', { message: '서버 모니터링 시작' });

      // 🔄 정기적인 서버 상태 업데이트 (15초마다)
      const serverUpdateInterval = setInterval(() => {
        try {
          const serverUpdate = generateMockServerUpdate();
          sendMessage('server_update', serverUpdate);
        } catch (error) {
          console.error('서버 업데이트 전송 실패:', error);
        }
      }, 15000);

      // 🚨 무작위 알림 (30-120초마다)
      const alertInterval = setInterval(() => {
        try {
          if (Math.random() > 0.7) { // 30% 확률로 알림 생성
            const alert = generateMockAlert();
            sendMessage('alert', alert);
          }
        } catch (error) {
          console.error('알림 전송 실패:', error);
        }
      }, 45000);

      // 🏥 시스템 헬스 업데이트 (60초마다)
      const healthInterval = setInterval(() => {
        try {
          const systemHealth = {
            overall_status: Math.random() > 0.1 ? 'healthy' : 'warning',
            active_servers: Math.floor(Math.random() * 5) + 3,
            total_requests: Math.floor(Math.random() * 10000) + 50000,
            average_response_time: Math.floor(Math.random() * 200) + 100,
            error_rate: Math.random() * 2,
            last_updated: new Date().toISOString()
          };
          sendMessage('system_update', systemHealth);
        } catch (error) {
          console.error('시스템 헬스 전송 실패:', error);
        }
      }, 60000);

      // 💓 하트비트 (30초마다)
      const heartbeatInterval = setInterval(() => {
        try {
          sendMessage('heartbeat', { timestamp: new Date().toISOString() });
        } catch (error) {
          console.error('하트비트 전송 실패:', error);
        }
      }, 30000);

      // 🧹 정리 함수
      const cleanup = () => {
        clearInterval(serverUpdateInterval);
        clearInterval(alertInterval);
        clearInterval(healthInterval);
        clearInterval(heartbeatInterval);
      };

      // 연결 종료 감지
      request.signal.addEventListener('abort', () => {
        cleanup();
        controller.close();
      });

      // 타임아웃 설정 (10분)
      setTimeout(() => {
        cleanup();
        sendMessage('timeout', { message: '연결 시간 초과' });
        controller.close();
      }, 10 * 60 * 1000);
    },
  });

  return new Response(stream, { headers });
}

// POST 요청 처리 (클라이언트에서 명령 전송)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    switch (type) {
      case 'ping':
        return Response.json({ 
          type: 'pong', 
          timestamp: new Date().toISOString(),
          message: '연결 상태 양호'
        });

      case 'request_server_update':
        const serverId = data?.serverId;
        if (serverId) {
          const serverUpdate = {
            ...generateMockServerUpdate(),
            id: serverId
          };
          return Response.json({
            type: 'server_update',
            data: serverUpdate,
            timestamp: new Date().toISOString()
          });
        }
        break;

      case 'request_health_check':
        return Response.json({
          type: 'system_update',
          data: {
            overall_status: 'healthy',
            active_servers: 4,
            total_requests: 75243,
            average_response_time: 156,
            error_rate: 0.8,
            last_updated: new Date().toISOString()
          },
          timestamp: new Date().toISOString()
        });

      default:
        return Response.json({ 
          error: 'Unknown message type',
          received: type 
        }, { status: 400 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('WebSocket POST 처리 오류:', error);
    return Response.json({ 
      error: 'Failed to process message' 
    }, { status: 500 });
  }
} 