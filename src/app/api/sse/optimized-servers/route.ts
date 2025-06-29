/**
 * 🚀 최적화된 서버 SSE API
 *
 * 사용자 제안 구현:
 * - 미리 저장된 데이터만 조회 (Function Duration 대폭 절약)
 * - 변경 감지 기반 델타 업데이트
 * - Redis/Supabase 저장소 활용
 * - 불필요한 ping 최소화
 */

import { serverDataScheduler } from '@/services/background/ServerDataScheduler';
import { NextRequest } from 'next/server';

interface OptimizedSSEConfig {
  onlyChanges?: boolean;
  includeMetrics?: boolean;
  priority?: 'high' | 'normal' | 'low';
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const config: OptimizedSSEConfig = {
    onlyChanges: searchParams.get('onlyChanges') === 'true',
    includeMetrics: searchParams.get('includeMetrics') !== 'false',
    priority: (searchParams.get('priority') as any) || 'normal',
  };

  console.log(`🔗 최적화된 SSE 연결: ${JSON.stringify(config)}`);

  const stream = new ReadableStream({
    start(controller) {
      console.log('🚀 최적화된 SSE 스트림 시작');

      // 🎯 핵심: 저장된 데이터만 조회 (생성 로직 없음)
      const sendStoredData = async () => {
        try {
          const startTime = Date.now();

          if (config.onlyChanges) {
            // 변경사항만 전송 (Delta Update)
            const changes = await serverDataScheduler.getChanges();
            if (
              changes &&
              (changes.added.length ||
                changes.updated.length ||
                changes.removed.length)
            ) {
              const payload = {
                type: 'server_changes',
                changes,
                timestamp: new Date().toISOString(),
                optimized: true,
              };

              controller.enqueue(`data: ${JSON.stringify(payload)}\\n\\n`);

              const duration = Date.now() - startTime;
              console.log(`⚡ 변경사항 전송: ${duration}ms`);
            }
          } else {
            // 전체 데이터 전송 (저장된 데이터 사용)
            const storedData = await serverDataScheduler.getStoredData();
            if (storedData) {
              const payload = {
                type: 'server_update',
                data: config.includeMetrics
                  ? storedData
                  : {
                      summary: storedData.summary,
                      timestamp: storedData.timestamp,
                      version: storedData.version,
                      serverCount: storedData.servers.length,
                    },
                optimized: true,
                duration: Date.now() - startTime,
              };

              controller.enqueue(`data: ${JSON.stringify(payload)}\\n\\n`);

              const duration = Date.now() - startTime;
              console.log(
                `📊 저장 데이터 전송: ${duration}ms (v${storedData.version})`
              );
            }
          }
        } catch (error) {
          console.error('❌ 저장 데이터 조회 실패:', error);

          // 폴백: 에러 정보 전송
          const errorPayload = {
            type: 'error',
            message: 'Failed to fetch stored data',
            fallbackAvailable: true,
            timestamp: new Date().toISOString(),
          };

          controller.enqueue(`data: ${JSON.stringify(errorPayload)}\\n\\n`);
        }
      };

      // 즉시 첫 데이터 전송
      sendStoredData();

      // 🎯 전송 간격 최적화 (우선순위별)
      const getInterval = () => {
        switch (config.priority) {
          case 'high':
            return 15000; // 15초
          case 'normal':
            return 30000; // 30초
          case 'low':
            return 60000; // 60초
          default:
            return 30000;
        }
      };

      // 정기 업데이트
      const updateInterval = setInterval(sendStoredData, getInterval());

      // 🎯 선택적 Keep-alive (운영 환경에서만)
      let keepAliveInterval: NodeJS.Timeout | null = null;

      if (
        process.env.NODE_ENV === 'production' ||
        process.env.FORCE_SSE_PING === 'true'
      ) {
        keepAliveInterval = setInterval(() => {
          const pingData = {
            type: 'ping',
            mode: 'optimized',
            timestamp: new Date().toISOString(),
            scheduler: serverDataScheduler.getStatus(),
          };

          controller.enqueue(`data: ${JSON.stringify(pingData)}\\n\\n`);
          console.log('📡 최적화된 Keep-alive ping');
        }, 300000); // 5분마다
      } else {
        console.log('⏭️ 개발 환경 - Keep-alive ping 비활성화');
      }

      // 연결 종료 처리
      request.signal?.addEventListener('abort', () => {
        console.log('🔌 최적화된 SSE 연결 종료');
        clearInterval(updateInterval);
        if (keepAliveInterval) {
          clearInterval(keepAliveInterval);
        }
        try {
          controller.close();
        } catch (error) {
          console.error('❌ SSE 스트림 종료 오류:', error);
        }
      });

      // 30분 자동 타임아웃
      setTimeout(() => {
        console.log('⏰ 최적화된 SSE 자동 타임아웃');
        clearInterval(updateInterval);
        if (keepAliveInterval) {
          clearInterval(keepAliveInterval);
        }
        try {
          controller.close();
        } catch (error) {
          console.error('❌ SSE 타임아웃 종료 오류:', error);
        }
      }, 1800000); // 30분
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Optimization': 'stored-data-only',
      'X-Function-Duration': 'minimized',
      'X-Implementation': 'user-suggested',
    },
  });
}
