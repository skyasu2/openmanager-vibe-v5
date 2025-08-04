/**
 * 📡 실시간 AI 로그 스트리밍 API (Redis-Free)
 *
 * SSE(Server-Sent Events)를 사용한 AI 로그 실시간 스트리밍
 * GET /api/ai/logging/stream
 * - Zod 스키마로 타입 안전성 보장
 * - 메모리 기반 로그 스토리지 (Redis 완전 제거)
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createApiRoute } from '@/lib/api/zod-middleware';
import {
  AILogRequestSchema,
  AILogWriteResponseSchema,
  AILogExportResponseSchema,
  type AILogEntry,
  type AILogRequest,
  type AILogWriteResponse,
  type AILogExportResponse,
  type AILogLevel,
  type AILogStreamMessage,
} from '@/schemas/api.schema';
import { getErrorMessage } from '@/types/type-utils';

// 메모리 기반 로그 스토리지
class MemoryLogStorage {
  private logs: AILogEntry[] = [];
  private maxSize = 1000; // 최대 1000개 로그 유지
  private stats = {
    totalLogs: 0,
    errorCount: 0,
    warnCount: 0,
    infoCount: 0,
    debugCount: 0,
  };

  addLog(log: AILogEntry): void {
    // 로그 ID 생성 (없는 경우)
    const completeLog = {
      ...log,
      id: log.id || `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: log.timestamp || new Date().toISOString(),
    };

    // 로그 추가
    this.logs.unshift(completeLog); // 최신 로그를 앞에 추가
    
    // 크기 제한 관리
    if (this.logs.length > this.maxSize) {
      this.logs = this.logs.slice(0, this.maxSize);
    }

    // 통계 업데이트
    this.stats.totalLogs++;
    this.stats[`${log.level}Count` as keyof typeof this.stats]++;
  }

  addLogs(logs: AILogEntry[]): void {
    logs.forEach(log => this.addLog(log));
  }

  getLogs(count: number = 10, level?: AILogLevel | 'all', source?: string): AILogEntry[] {
    let filtered = this.logs;

    // 레벨 필터링
    if (level && level !== 'all') {
      filtered = filtered.filter(log => log.level === level);
    }

    // 소스 필터링
    if (source && source !== 'all') {
      filtered = filtered.filter(log => log.source === source);
    }

    return filtered.slice(0, count);
  }

  clear(): void {
    this.logs = [];
    this.stats = {
      totalLogs: 0,
      errorCount: 0,
      warnCount: 0,
      infoCount: 0,
      debugCount: 0,
    };
  }

  getStats() {
    return {
      ...this.stats,
      currentSize: this.logs.length,
      maxSize: this.maxSize,
      errorRate: this.stats.totalLogs > 0 ? this.stats.errorCount / this.stats.totalLogs : 0,
    };
  }

  exportAll(): AILogEntry[] {
    return [...this.logs]; // 복사본 반환
  }
}

// 글로벌 메모리 로그 스토리지
let globalLogStorage: MemoryLogStorage | null = null;

function getLogStorage(): MemoryLogStorage {
  if (!globalLogStorage) {
    globalLogStorage = new MemoryLogStorage();
  }
  return globalLogStorage;
}

// 로그 레벨별 이모지
const _LOG_EMOJIS = {
  info: '📘',
  warn: '⚠️',
  error: '❌',
  debug: '🔍',
};

// 모의 로그 생성기
function generateMockLog(): AILogEntry {
  const levels: AILogLevel[] = ['info', 'warn', 'error', 'debug'];
  const sources = [
    'SimplifiedQueryEngine',
    'MCPContextLoader',
    'LocalRAG',
    'GoogleAI',
    'SupabaseRAG',
    'MemoryCache',
  ];
  const messages = [
    'AI 쿼리 처리 시작',
    'MCP 컨텍스트 로드 완료',
    'Gemini 엔진 응답 수신',
    '토큰 사용량 임계값 도달',
    '폴백 엔진으로 전환',
    'AI 응답 생성 완료',
    '메모리 캐시 히트 - 빠른 응답',
    '새로운 컨텍스트 저장',
    '엔진 상태 체크',
    '메모리 사용량 최적화',
    'Redis 의존성 제거 완료',
    '메모리 기반 로그 저장',
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
    `📡 AI 로그 스트리밍 시작 (Memory-based) - 레벨: ${level}, 소스: ${source}, 간격: ${interval}ms`
  );

  // SSE 응답 헤더 설정
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
    'X-Storage': 'Memory-based',
  });

  // 스트림 생성
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let isActive = true;
      const logStorage = getLogStorage();

      // 클라이언트 연결 종료 감지
      request.signal.addEventListener('abort', () => {
        console.log('🔌 AI 로그 스트림 연결 종료 (Memory-based)');
        isActive = false;
        controller.close();
      });

      console.log('✅ 메모리 기반 로그 스토리지 활성화');

      // 로그 전송 함수
      const sendLogs = async () => {
        if (!isActive) return;

        try {
          const logs: AILogEntry[] = [];

          // 메모리 스토리지에서 기존 로그 가져오기
          const existingLogs = logStorage.getLogs(5, level as AILogLevel, source);
          logs.push(...existingLogs);

          // 모의 로그 생성 (실제 로그가 부족한 경우)
          const mockLogsCount = Math.max(1, 3 - existingLogs.length);
          for (let i = 0; i < mockLogsCount; i++) {
            const mockLog = generateMockLog();

            // 필터링
            if (level !== 'all' && mockLog.level !== level) continue;
            if (source !== 'all' && mockLog.source !== source) continue;

            logs.push(mockLog);

            // 메모리 스토리지에 저장
            logStorage.addLog(mockLog);
          }

          // 중복 제거 (ID 기준)
          const uniqueLogs = logs.filter((log, index, self) => 
            index === self.findIndex(l => l.id === log.id)
          );

          // SSE 메시지 전송
          const message = {
            type: 'logs',
            data: uniqueLogs,
            timestamp: new Date().toISOString(),
            count: uniqueLogs.length,
            filters: { level, source },
            storage: 'memory-based',
          };

          const sseMessage = `data: ${JSON.stringify(message)}\n\n`;
          controller.enqueue(encoder.encode(sseMessage));

          // 통계 메시지 (10번마다)
          if (Math.random() < 0.1) {
            const stats = logStorage.getStats();
            const statsMessage = {
              type: 'stats',
              data: {
                totalLogs: stats.totalLogs,
                currentSize: stats.currentSize,
                maxSize: stats.maxSize,
                errorRate: stats.errorRate,
                avgProcessingTime: 250 + Math.random() * 150, // 메모리 기반이므로 더 빠름
                activeEngines: ['mcp', 'gemini', 'memory-cache'].filter(
                  () => Math.random() > 0.2
                ),
                storage: 'memory-based',
                migration: 'Redis → Memory completed',
              },
              timestamp: new Date().toISOString(),
            };

            const sseStatsMessage = `data: ${JSON.stringify(statsMessage)}\n\n`;
            controller.enqueue(encoder.encode(sseStatsMessage));
          }

          // 다음 전송 예약
          if (isActive) {
            setTimeout(sendLogs, interval);
          }
        } catch (error) {
          console.error('메모리 로그 전송 오류:', error);

          // 에러 메시지 전송
          const errorMessage = `data: ${JSON.stringify({
            type: 'error',
            message: '메모리 기반 로그 스트리밍 중 오류 발생',
            timestamp: new Date().toISOString(),
            storage: 'memory-based',
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

// POST 핸들러
const postHandler = createApiRoute()
  .body(AILogRequestSchema)
  .response(z.union([AILogWriteResponseSchema, AILogExportResponseSchema]))
  .configure({
    showDetailedErrors: process.env.NODE_ENV === 'development',
    enableLogging: true,
  })
  .build(async (_request, context): Promise<AILogWriteResponse | AILogExportResponse> => {
    const body = context.body;

    console.log(`📊 AI 로그 관리 액션 (Memory-based): ${body.action}`);

    const logStorage = getLogStorage();

    switch (body.action) {
      case 'write': {
        const { logs } = body;

        // 메모리 스토리지에 로그 저장
        logStorage.addLogs(logs.map(log => ({
          ...log,
          id: log.id || `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: log.timestamp || new Date().toISOString(),
        })));

        return {
          success: true,
          message: `${logs.length} logs written to memory storage`,
          timestamp: new Date().toISOString(),
        };
      }

      case 'clear':
        // 메모리 로그 삭제
        logStorage.clear();

        return {
          success: true,
          message: 'Memory logs cleared successfully',
          timestamp: new Date().toISOString(),
        };

      case 'export': {
        // 메모리에서 로그 내보내기
        const exportLogs = logStorage.exportAll();

        return {
          success: true,
          logs: exportLogs,
          count: exportLogs.length,
          timestamp: new Date().toISOString(),
        };
      }

      default:
        throw new Error('Invalid action');
    }
  });

/**
 * 📊 AI 로그 관리 API (Memory-based)
 *
 * POST /api/ai/logging/stream
 */
export async function POST(request: NextRequest) {
  try {
    return await postHandler(request);
  } catch (error) {
    console.error('❌ AI 로그 관리 API 오류 (Memory-based):', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Memory-based log management failed',
        message: getErrorMessage(error),
        storage: 'memory-based',
      },
      { 
        status: 500,
        headers: {
          'X-Storage': 'Memory-based',
        },
      }
    );
  }
}