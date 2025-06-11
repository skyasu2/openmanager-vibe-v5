/**
 * 🌊 AI 로그 실시간 스트리밍 API
 * GET /api/ai/logging/stream - Server-Sent Events로 실시간 로그 스트리밍
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  aiLogger,
  LogLevel,
  LogCategory,
} from '@/services/ai/logging/AILogger';

export const runtime = 'nodejs';

interface StreamFilter {
  engines?: string[];
  categories?: LogCategory[];
  levels?: LogLevel[];
  minConfidence?: number;
}

/**
 * 🌊 실시간 로그 스트리밍 (Server-Sent Events)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 스트리밍 필터 파싱
    const filters: StreamFilter = {
      engines: searchParams.get('engines')?.split(','),
      categories: searchParams.get('categories')?.split(',') as LogCategory[],
      levels: searchParams.get('levels')?.split(',') as LogLevel[],
      minConfidence: searchParams.get('minConfidence')
        ? parseFloat(searchParams.get('minConfidence')!)
        : undefined,
    };

    // SSE 헤더 설정
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();

        // 연결 확인 메시지
        const welcomeMessage = {
          type: 'connection',
          message: 'AI 로그 스트리밍이 시작되었습니다',
          timestamp: new Date().toISOString(),
          filters,
        };

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(welcomeMessage)}\n\n`)
        );

        // 기존 로그 전송 (최근 10개)
        const recentLogs = aiLogger.getRecentLogs(10);
        recentLogs.forEach(log => {
          if (shouldIncludeLog(log, filters)) {
            const message = {
              type: 'log',
              data: log,
              timestamp: new Date().toISOString(),
            };

            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(message)}\n\n`)
            );
          }
        });

        // 실시간 로그 감시 (폴링 방식)
        const pollInterval = setInterval(() => {
          try {
            const newLogs = aiLogger.getRecentLogs(5);

            newLogs.forEach(log => {
              if (shouldIncludeLog(log, filters)) {
                const message = {
                  type: 'log',
                  data: log,
                  timestamp: new Date().toISOString(),
                };

                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify(message)}\n\n`)
                );
              }
            });

            // 하트비트 메시지 (30초마다)
            if (Date.now() % 30000 < 1000) {
              const heartbeat = {
                type: 'heartbeat',
                timestamp: new Date().toISOString(),
                activeStreams: 1,
              };

              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(heartbeat)}\n\n`)
              );
            }
          } catch (error) {
            console.error('❌ 스트리밍 오류:', error);
            controller.error(error);
          }
        }, 1000); // 1초마다 폴링

        // 정리 함수
        const cleanup = () => {
          clearInterval(pollInterval);
          try {
            controller.close();
          } catch (e) {
            // Already closed
          }
        };

        // 연결 종료 감지
        request.signal.addEventListener('abort', cleanup);

        // 타임아웃 설정 (5분)
        setTimeout(cleanup, 5 * 60 * 1000);
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('❌ 로그 스트리밍 초기화 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '스트리밍 초기화 실패',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * 📝 로그 필터링 함수
 */
function shouldIncludeLog(log: any, filters: StreamFilter): boolean {
  // 엔진 필터
  if (filters.engines && filters.engines.length > 0) {
    if (!filters.engines.includes(log.engine)) {
      return false;
    }
  }

  // 카테고리 필터
  if (filters.categories && filters.categories.length > 0) {
    if (!filters.categories.includes(log.category)) {
      return false;
    }
  }

  // 레벨 필터
  if (filters.levels && filters.levels.length > 0) {
    if (!filters.levels.includes(log.level)) {
      return false;
    }
  }

  // 신뢰도 필터
  if (filters.minConfidence && log.metadata?.confidence) {
    if (log.metadata.confidence < filters.minConfidence) {
      return false;
    }
  }

  return true;
}
