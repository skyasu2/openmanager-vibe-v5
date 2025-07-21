/**
 * 📡 실시간 AI 로그 스트리밍 API
 *
 * SSE(Server-Sent Events)를 사용한 AI 로그 실시간 스트리밍
 * GET /api/ai/logging/stream
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface AILogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  source: string;
  message: string;
  metadata?: Record<string, any>;
}

// 로그 레벨별 이모지
const LOG_EMOJIS = {
  info: '📘',
  warn: '⚠️',
  error: '❌',
  debug: '🔍',
};

// 모의 로그 생성기
function generateMockLog(): AILogEntry {
  const levels: ('info' | 'warn' | 'error' | 'debug')[] = [
    'info',
    'warn',
    'error',
    'debug',
  ];
  const sources = [
    'SimplifiedQueryEngine',
    'MCPContextLoader',
    'LocalRAG',
    'GoogleAI',
    'SupabaseRAG',
  ];
  const messages = [
    'AI 쿼리 처리 시작',
    'MCP 컨텍스트 로드 완료',
    'Gemini 엔진 응답 수신',
    '토큰 사용량 임계값 도달',
    '폴백 엔진으로 전환',
    'AI 응답 생성 완료',
    '캐시 히트 - 빠른 응답',
    '새로운 컨텍스트 저장',
    '엔진 상태 체크',
    '메모리 사용량 최적화',
  ];

  const level = levels[Math.floor(Math.random() * levels.length)];
  const source = sources[Math.floor(Math.random() * sources.length)];
  const message = messages[Math.floor(Math.random() * messages.length)];

  return {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    level,
    source,
    message,
    metadata: {
      engineId: Math.random() > 0.5 ? 'gemini' : 'mcp',
      processingTime: Math.floor(Math.random() * 1000),
      confidence: (0.7 + Math.random() * 0.3).toFixed(2),
      tokensUsed: Math.floor(Math.random() * 500),
    },
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const level = searchParams.get('level') || 'all';
  const source = searchParams.get('source') || 'all';
  const interval = parseInt(searchParams.get('interval') || '2000'); // 기본 2초

  console.log(
    `📡 AI 로그 스트리밍 시작 - 레벨: ${level}, 소스: ${source}, 간격: ${interval}ms`
  );

  // SSE 응답 헤더 설정
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  // 스트림 생성
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let isActive = true;
      let logBuffer: AILogEntry[] = [];

      // 클라이언트 연결 종료 감지
      request.signal.addEventListener('abort', () => {
        console.log('🔌 AI 로그 스트림 연결 종료');
        isActive = false;
        controller.close();
      });

      // Redis 연결 (선택적)
      let redis: any;
      let useRedis = false;

      try {
        redis = await getRedisClient();
        useRedis = true;
        console.log('✅ Redis 연결 성공 - 실시간 로그 저장 활성화');
      } catch (error) {
        console.warn('⚠️ Redis 연결 실패 - 메모리 로그만 사용');
      }

      // 로그 전송 함수
      const sendLogs = async () => {
        if (!isActive) return;

        try {
          const logs: AILogEntry[] = [];

          // Redis에서 실시간 로그 가져오기 (가능한 경우)
          if (useRedis) {
            try {
              const redisLogs = await redis.lrange('ai:logs', -10, -1);
              for (const logStr of redisLogs) {
                try {
                  const log = JSON.parse(logStr);
                  logs.push(log);
                } catch (e) {
                  // 파싱 오류 무시
                }
              }
            } catch (error) {
              console.error('Redis 로그 읽기 오류:', error);
            }
          }

          // 모의 로그 생성 (실제 로그가 부족한 경우)
          const mockLogsCount = Math.max(1, 3 - logs.length);
          for (let i = 0; i < mockLogsCount; i++) {
            const mockLog = generateMockLog();

            // 필터링
            if (level !== 'all' && mockLog.level !== level) continue;
            if (source !== 'all' && mockLog.source !== source) continue;

            logs.push(mockLog);

            // Redis에 저장 (가능한 경우)
            if (useRedis) {
              try {
                await redis.lpush('ai:logs', JSON.stringify(mockLog));
                await redis.ltrim('ai:logs', 0, 99); // 최대 100개 유지
              } catch (error) {
                // 저장 오류 무시
              }
            }
          }

          // SSE 메시지 전송
          const message = {
            type: 'logs',
            data: logs,
            timestamp: new Date().toISOString(),
            count: logs.length,
            filters: { level, source },
          };

          const sseMessage = `data: ${JSON.stringify(message)}\n\n`;
          controller.enqueue(encoder.encode(sseMessage));

          // 통계 메시지 (10번마다)
          if (Math.random() < 0.1) {
            const statsMessage = {
              type: 'stats',
              data: {
                totalLogs: logBuffer.length,
                errorRate:
                  logBuffer.filter(l => l.level === 'error').length /
                  Math.max(logBuffer.length, 1),
                avgProcessingTime: 350 + Math.random() * 200,
                activeEngines: ['mcp', 'gemini', 'local'].filter(
                  () => Math.random() > 0.3
                ),
              },
              timestamp: new Date().toISOString(),
            };

            const sseStatsMessage = `data: ${JSON.stringify(statsMessage)}\n\n`;
            controller.enqueue(encoder.encode(sseStatsMessage));
          }

          // 버퍼 관리
          logBuffer = [...logBuffer, ...logs].slice(-100);

          // 다음 전송 예약
          if (isActive) {
            setTimeout(sendLogs, interval);
          }
        } catch (error) {
          console.error('로그 전송 오류:', error);

          // 에러 메시지 전송
          const errorMessage = `data: ${JSON.stringify({
            type: 'error',
            message: '로그 스트리밍 중 오류 발생',
            timestamp: new Date().toISOString(),
          })}\n\n`;

          controller.enqueue(encoder.encode(errorMessage));

          // 재시도
          if (isActive) {
            setTimeout(sendLogs, interval * 2);
          }
        }
      };

      // 초기 로그 전송
      await sendLogs();
    },
  });

  return new Response(stream, { headers });
}

/**
 * 📊 AI 로그 관리 API
 *
 * POST /api/ai/logging/stream
 */
export async function POST(request: NextRequest) {
  try {
    const { action, logs } = await request.json();

    console.log(`📊 AI 로그 관리 액션: ${action}`);

    let redis: any;
    let useRedis = false;

    try {
      redis = await getRedisClient();
      useRedis = true;
    } catch (error) {
      console.warn('⚠️ Redis 연결 실패');
    }

    switch (action) {
      case 'write':
        // 로그 쓰기
        if (!logs || !Array.isArray(logs)) {
          return NextResponse.json(
            { success: false, error: 'Invalid logs data' },
            { status: 400 }
          );
        }

        if (useRedis) {
          for (const log of logs) {
            await redis.lpush(
              'ai:logs',
              JSON.stringify({
                ...log,
                id:
                  log.id ||
                  `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                timestamp: log.timestamp || new Date().toISOString(),
              })
            );
          }
          await redis.ltrim('ai:logs', 0, 999); // 최대 1000개 유지
        }

        return NextResponse.json({
          success: true,
          message: `${logs.length} logs written`,
          timestamp: new Date().toISOString(),
        });

      case 'clear':
        // 로그 삭제
        if (useRedis) {
          await redis.del('ai:logs');
        }

        return NextResponse.json({
          success: true,
          message: 'Logs cleared successfully',
          timestamp: new Date().toISOString(),
        });

      case 'export':
        // 로그 내보내기
        let exportLogs: AILogEntry[] = [];

        if (useRedis) {
          const redisLogs = await redis.lrange('ai:logs', 0, -1);
          exportLogs = redisLogs
            .map((logStr: string) => {
              try {
                return JSON.parse(logStr);
              } catch (e) {
                return null;
              }
            })
            .filter(Boolean);
        }

        return NextResponse.json({
          success: true,
          logs: exportLogs,
          count: exportLogs.length,
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ AI 로그 관리 API 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Log management failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
