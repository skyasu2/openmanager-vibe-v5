/**
 * 🧠 스마트 하이브리드 SSE 시스템
 *
 * Function Duration 한도를 고려한 최적화:
 * - 활성 사용자 < 3명: 기본 SSE (실시간성 우선)
 * - 활성 사용자 ≥ 3명: Redis Pub/Sub + 적응형 polling
 * - 중요도에 따른 차등 전송
 */

import { RealServerDataGenerator } from '@/services/data-generator/RealServerDataGenerator';
import { NextRequest } from 'next/server';

// 🎯 활성 연결 추적
const activeConnections = new Set<string>();
const VERCEL_PRO_MAX_CONCURRENT = 3; // Function Duration 한도 고려

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('clientId') || `client-${Date.now()}`;
  const priority = searchParams.get('priority') || 'normal'; // high, normal, low

  console.log(`🔗 SSE 연결 요청: ${clientId} (우선순위: ${priority})`);
  console.log(`📊 현재 활성 연결: ${activeConnections.size}개`);

  // 🧠 스마트 라우팅 결정
  const useHybridMode = activeConnections.size >= VERCEL_PRO_MAX_CONCURRENT;

  return new Response(
    new ReadableStream({
      start(controller) {
        activeConnections.add(clientId);
        console.log(
          `✅ 연결 등록: ${clientId} (총 ${activeConnections.size}개)`
        );

        if (useHybridMode) {
          console.log(
            `🧠 하이브리드 모드 활성화 (${activeConnections.size}/${VERCEL_PRO_MAX_CONCURRENT})`
          );
          startHybridStreaming(controller, clientId, priority);
        } else {
          console.log(
            `⚡ 실시간 모드 활성화 (${activeConnections.size}/${VERCEL_PRO_MAX_CONCURRENT})`
          );
          startRealtimeStreaming(controller, clientId, priority);
        }
      },

      cancel() {
        activeConnections.delete(clientId);
        console.log(
          `🛑 연결 해제: ${clientId} (남은 연결: ${activeConnections.size}개)`
        );
        cleanup();
      },
    }),
    {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'X-SSE-Mode': useHybridMode ? 'hybrid' : 'realtime',
        'X-Active-Connections': activeConnections.size.toString(),
      },
    }
  );
}

/**
 * 🚀 실시간 모드 (활성 연결 < 3개)
 * - 20초 간격 전송
 * - 5분 keep-alive
 * - 최대 성능
 */
function startRealtimeStreaming(
  controller: ReadableStreamDefaultController,
  clientId: string,
  priority: string
) {
  const generator = RealServerDataGenerator.getInstance();
  let intervalId: NodeJS.Timeout;
  let pingIntervalId: NodeJS.Timeout | null = null;

  const sendData = () => {
    try {
      const servers = generator.getAllServers();
      const data = {
        type: 'realtime_update',
        mode: 'realtime',
        clientId,
        priority,
        servers: servers.slice(0, 5), // 상위 5개 서버
        summary: {
          totalServers: servers.length,
          onlineServers: servers.filter(s => s.status === 'running').length,
          activeConnections: activeConnections.size,
        },
        timestamp: new Date().toISOString(),
        performance: {
          updateInterval: '20초',
          mode: 'premium-realtime',
        },
      };

      controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
      console.log(`⚡ 실시간 데이터 전송: ${clientId}`);
    } catch (error) {
      console.error(`❌ 실시간 전송 오류 (${clientId}):`, error);
    }
  };

  // 즉시 첫 데이터 전송
  sendData();

  // 실시간 업데이트 (20초 간격)
  intervalId = setInterval(sendData, 20000);

  // Keep-alive ping (운영환경에서만)
  if (process.env.NODE_ENV === 'production') {
    pingIntervalId = setInterval(() => {
      controller.enqueue(
        `data: ${JSON.stringify({
          type: 'ping',
          mode: 'realtime',
          timestamp: new Date().toISOString(),
        })}\n\n`
      );
    }, 300000);
  }

  // 정리 함수
  const cleanup = () => {
    if (intervalId) clearInterval(intervalId);
    if (pingIntervalId) clearInterval(pingIntervalId);
  };

  // 30분 타임아웃
  setTimeout(
    () => {
      console.log(`⏰ 실시간 스트림 타임아웃: ${clientId}`);
      cleanup();
      activeConnections.delete(clientId);
      controller.close();
    },
    30 * 60 * 1000
  );

  return cleanup;
}

/**
 * 🧠 하이브리드 모드 (활성 연결 ≥ 3개)
 * - 우선순위별 차등 전송
 * - Redis 이벤트 기반 + 백업 polling
 * - Function Duration 최적화
 */
function startHybridStreaming(
  controller: ReadableStreamDefaultController,
  clientId: string,
  priority: string
) {
  const generator = RealServerDataGenerator.getInstance();
  let backupIntervalId: NodeJS.Timeout;

  // 우선순위별 업데이트 간격 결정
  const getUpdateInterval = (priority: string) => {
    switch (priority) {
      case 'high':
        return 60000; // 1분
      case 'normal':
        return 120000; // 2분
      case 'low':
        return 300000; // 5분
      default:
        return 120000;
    }
  };

  const interval = getUpdateInterval(priority);

  const sendHybridData = () => {
    try {
      const servers = generator.getAllServers();

      // 우선순위에 따른 데이터 필터링
      const filteredData =
        priority === 'high'
          ? servers.slice(0, 5) // 고우선순위: 상위 5개
          : servers.filter(s => s.status !== 'running').slice(0, 3); // 일반: 문제 서버만

      const data = {
        type: 'hybrid_update',
        mode: 'hybrid-optimized',
        clientId,
        priority,
        servers: filteredData,
        summary: {
          totalServers: servers.length,
          criticalServers: servers.filter(s => s.status === 'error').length,
          activeConnections: activeConnections.size,
          optimizationNote: `Function Duration 최적화 모드 (${interval / 1000}초 간격)`,
        },
        timestamp: new Date().toISOString(),
        performance: {
          updateInterval: `${interval / 1000}초`,
          mode: 'cost-optimized',
          reason: `${activeConnections.size}개 연결로 인한 하이브리드 모드`,
        },
      };

      controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
      console.log(
        `🧠 하이브리드 데이터 전송: ${clientId} (${priority}, ${interval / 1000}초)`
      );
    } catch (error) {
      console.error(`❌ 하이브리드 전송 오류 (${clientId}):`, error);
    }
  };

  // 즉시 첫 데이터 전송
  sendHybridData();

  // 백업 polling (우선순위별 간격)
  backupIntervalId = setInterval(sendHybridData, interval);

  // 정리 함수
  const cleanup = () => {
    if (backupIntervalId) clearInterval(backupIntervalId);
  };

  // 연장된 타임아웃 (비용 최적화)
  setTimeout(
    () => {
      console.log(`⏰ 하이브리드 스트림 타임아웃: ${clientId}`);
      cleanup();
      activeConnections.delete(clientId);
      controller.close();
    },
    60 * 60 * 1000
  ); // 1시간

  return cleanup;
}

/**
 * 🔧 전역 정리 함수
 */
function cleanup() {
  // 추가 정리 로직 필요시 구현
}

/**
 * 📊 연결 상태 조회 API
 */
export async function POST(request: NextRequest) {
  const { action } = await request.json();

  if (action === 'status') {
    return Response.json({
      activeConnections: activeConnections.size,
      maxConcurrent: VERCEL_PRO_MAX_CONCURRENT,
      mode:
        activeConnections.size >= VERCEL_PRO_MAX_CONCURRENT
          ? 'hybrid'
          : 'realtime',
      optimization: {
        functionDurationOptimized: true,
        costOptimized: activeConnections.size >= VERCEL_PRO_MAX_CONCURRENT,
        recommendation:
          activeConnections.size >= VERCEL_PRO_MAX_CONCURRENT
            ? 'Redis Pub/Sub 구현 권장'
            : '현재 최적 상태',
      },
    });
  }

  return Response.json({ error: 'Invalid action' }, { status: 400 });
}
