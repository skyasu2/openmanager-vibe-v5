/**
 * 🔄 Server-Sent Events for Server Metrics
 *
 * Vercel 호환 실시간 서버 메트릭 스트리밍
 * - 단방향 서버 → 클라이언트 통신
 * - 자동 재연결 지원
 * - 메모리 효율적 스트리밍
 */

import { RealServerDataGenerator } from '@/services/data-generator/RealServerDataGenerator';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('🔄 SSE 서버 메트릭 스트림 시작');

  // SSE 헤더 설정 (Vercel 호환)
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET',
    'Access-Control-Allow-Headers': 'Cache-Control',
    'X-Accel-Buffering': 'no', // Nginx 버퍼링 비활성화
  });

  // ReadableStream으로 SSE 구현
  const stream = new ReadableStream({
    start(controller) {
      console.log('📡 SSE 스트림 컨트롤러 시작');

      // 연결 확인 메시지
      const welcomeData = {
        type: 'connection',
        message: 'SSE 서버 메트릭 스트림 연결됨',
        timestamp: new Date().toISOString(),
        connectionId: Math.random().toString(36).substr(2, 9),
      };

      controller.enqueue(`data: ${JSON.stringify(welcomeData)}\n\n`);

      // 실시간 데이터 생성기 인스턴스
      const generator = RealServerDataGenerator.getInstance();

      // 🎯 20초 간격으로 서버 메트릭 전송 (시스템 통일)
      const intervalId = setInterval(() => {
        try {
          const servers = generator.getAllServers();
          const selectedServers = servers.slice(0, 5); // 처음 5개 서버만 스트리밍

          selectedServers.forEach(server => {
            const streamData = {
              type: 'server-metrics',
              serverId: server.id,
              data: {
                serverName: server.name,
                cpu: server.metrics.cpu,
                memory: server.metrics.memory,
                disk: server.metrics.disk,
                network: {
                  bytesIn: server.metrics.network.in,
                  bytesOut: server.metrics.network.out,
                  latency: Math.random() * 100 + 10,
                },
                application: {
                  responseTime: Math.random() * 1000 + 100,
                  throughput: Math.random() * 1000 + 500,
                  errorRate: Math.random() * 5,
                },
                status: server.status,
                lastUpdate: new Date().toISOString(),
              },
              timestamp: new Date().toISOString(),
              priority:
                server.metrics.cpu > 80
                  ? 'critical'
                  : server.metrics.cpu > 60
                    ? 'high'
                    : 'normal',
            };

            // SSE 형식으로 데이터 전송
            controller.enqueue(`data: ${JSON.stringify(streamData)}\n\n`);
          });

          // 시스템 상태 요약 전송
          const summary = {
            type: 'system-summary',
            data: {
              totalServers: servers.length,
              onlineServers: servers.filter(s => s.status === 'running').length,
              avgCpu:
                servers.reduce((sum, s) => sum + s.metrics.cpu, 0) /
                servers.length,
              avgMemory:
                servers.reduce((sum, s) => sum + s.metrics.memory, 0) /
                servers.length,
              timestamp: new Date().toISOString(),
            },
            timestamp: new Date().toISOString(),
          };

          controller.enqueue(`data: ${JSON.stringify(summary)}\n\n`);

          console.log(
            `📊 SSE 메트릭 전송 완료: ${selectedServers.length}개 서버`
          );
        } catch (error) {
          console.error('❌ SSE 메트릭 생성 오류:', error);

          // 에러 메시지 전송
          const errorData = {
            type: 'error',
            message: '메트릭 생성 중 오류 발생',
            timestamp: new Date().toISOString(),
          };

          controller.enqueue(`data: ${JSON.stringify(errorData)}\n\n`);
        }
      }, 20000); // 🎯 20초 간격 (시스템 통일)

      // Keep-alive 핑 (5분마다) - 개발환경에서는 선택적
      let pingIntervalId: NodeJS.Timeout | null = null;

      // 운영 환경에서만 ping 활성화
      if (
        process.env.NODE_ENV === 'production' ||
        process.env.FORCE_SSE_PING === 'true'
      ) {
        pingIntervalId = setInterval(() => {
          const pingData = {
            type: 'ping',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV,
          };

          controller.enqueue(`data: ${JSON.stringify(pingData)}\n\n`);
          console.log('📡 SSE Keep-alive ping 전송');
        }, 300000); // 5분마다 핑
      } else {
        console.log('⏭️ 개발 환경 - SSE ping 비활성화');
      }

      // 연결 종료 처리
      const cleanup = () => {
        console.log('🔌 SSE 서버 메트릭 스트림 정리');
        clearInterval(intervalId);
        if (pingIntervalId) {
          clearInterval(pingIntervalId);
        }
      };

      // 클라이언트 연결 해제 감지
      request.signal.addEventListener('abort', () => {
        console.log('📡 클라이언트 연결 해제 감지');
        cleanup();
        controller.close();
      });

      // 타임아웃 설정 (30분)
      setTimeout(
        () => {
          console.log('⏰ SSE 스트림 타임아웃 (30분)');
          cleanup();
          controller.close();
        },
        30 * 60 * 1000
      );
    },

    cancel() {
      console.log('🛑 SSE 스트림 취소됨');
    },
  });

  return new Response(stream, { headers });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}
