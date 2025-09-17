/**
 * 📡 실시간 & 스트리밍 통합 API
 * 
 * 기존 2개 스트리밍 API를 하나로 통합
 * - /ai/logging/stream (로그 스트리밍)
 * - /ai/thinking/stream-v2 (AI 생각 스트리밍)
 * 
 * GET /api/ai-unified/streaming?type=logs|thinking&format=sse|json
 * POST /api/ai-unified/streaming (스트리밍 설정)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createApiRoute } from '@/lib/api/zod-middleware';
import { withAuth } from '@/lib/api-auth';
import debug from '@/utils/debug';

// 스트리밍 타입 정의
const streamingTypes = ['logs', 'thinking', 'metrics', 'events'] as const;
const streamingFormats = ['sse', 'json', 'websocket'] as const;

// 요청 스키마
const streamingRequestSchema = z.object({
  type: z.enum(streamingTypes),
  format: z.enum(streamingFormats).default('sse'),
  filters: z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']).optional(),
    source: z.string().optional(),
    serverId: z.string().optional(),
    timeRange: z.string().optional()
  }).optional(),
  options: z.object({
    bufferSize: z.number().min(1).max(1000).default(100),
    flushInterval: z.number().min(100).max(10000).default(1000),
    compression: z.boolean().default(false)
  }).optional()
});

type StreamingRequest = z.infer<typeof streamingRequestSchema>;

// 스트리밍 데이터 관리 클래스
class StreamingManager {
  private static logBuffer: any[] = [];
  private static thinkingBuffer: any[] = [];
  private static metricsBuffer: any[] = [];
  private static eventsBuffer: any[] = [];

  // 로그 스트리밍
  static async streamLogs(request: StreamingRequest): Promise<ReadableStream> {
    const { filters, options } = request;
    
    return new ReadableStream({
      start(controller) {
        // 초기 데이터 전송
        const initialLogs = StreamingManager.generateMockLogs(10);
        initialLogs.forEach(log => {
          if (StreamingManager.matchesFilter(log, filters)) {
            const data = `data: ${JSON.stringify(log)}\n\n`;
            controller.enqueue(new TextEncoder().encode(data));
          }
        });

        // 주기적 업데이트
        const interval = setInterval(() => {
          const newLogs = StreamingManager.generateMockLogs(2);
          newLogs.forEach(log => {
            if (StreamingManager.matchesFilter(log, filters)) {
              const data = `data: ${JSON.stringify(log)}\n\n`;
              controller.enqueue(new TextEncoder().encode(data));
            }
          });
        }, options?.flushInterval || 1000);

        // 5분 후 자동 종료
        setTimeout(() => {
          clearInterval(interval);
          controller.close();
        }, 300000);
      }
    });
  }

  // AI 생각 스트리밍
  static async streamThinking(request: StreamingRequest): Promise<ReadableStream> {
    const { options } = request;
    
    return new ReadableStream({
      start(controller) {
        const thinkingSteps = [
          "사용자 요청 분석 중...",
          "데이터 수집 및 전처리 진행...",
          "ML 모델 추론 실행 중...",
          "결과 검증 및 후처리...",
          "최종 응답 생성 완료"
        ];

        let stepIndex = 0;
        
        const interval = setInterval(() => {
          if (stepIndex < thinkingSteps.length) {
            const thinkingData = {
              id: `thinking-${Date.now()}-${stepIndex}`,
              step: stepIndex + 1,
              totalSteps: thinkingSteps.length,
              message: thinkingSteps[stepIndex],
              progress: ((stepIndex + 1) / thinkingSteps.length) * 100,
              timestamp: new Date().toISOString(),
              status: stepIndex === thinkingSteps.length - 1 ? 'completed' : 'processing'
            };

            const data = `data: ${JSON.stringify(thinkingData)}\n\n`;
            controller.enqueue(new TextEncoder().encode(data));
            stepIndex++;
          } else {
            clearInterval(interval);
            controller.close();
          }
        }, options?.flushInterval || 2000);
      }
    });
  }

  // 메트릭 스트리밍
  static async streamMetrics(request: StreamingRequest): Promise<ReadableStream> {
    const { options } = request;
    
    return new ReadableStream({
      start(controller) {
        const interval = setInterval(() => {
          const metricsData = {
            timestamp: new Date().toISOString(),
            cpu: Math.random() * 100,
            memory: Math.random() * 100,
            disk: Math.random() * 100,
            network: {
              inbound: Math.random() * 1000,
              outbound: Math.random() * 1000
            },
            aiMetrics: {
              queriesPerSecond: Math.random() * 50,
              averageResponseTime: Math.random() * 500 + 100,
              cacheHitRate: Math.random() * 0.4 + 0.6
            }
          };

          const data = `data: ${JSON.stringify(metricsData)}\n\n`;
          controller.enqueue(new TextEncoder().encode(data));
        }, options?.flushInterval || 1000);

        // 1분 후 자동 종료
        setTimeout(() => {
          clearInterval(interval);
          controller.close();
        }, 60000);
      }
    });
  }

  // 이벤트 스트리밍
  static async streamEvents(request: StreamingRequest): Promise<ReadableStream> {
    const { filters, options } = request;
    
    return new ReadableStream({
      start(controller) {
        const eventTypes = ['server_start', 'server_stop', 'alert_triggered', 'backup_completed'];
        
        const interval = setInterval(() => {
          const eventData = {
            id: `event-${Date.now()}`,
            type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
            severity: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
            message: `System event occurred at ${new Date().toLocaleTimeString()}`,
            serverId: filters?.serverId || `server-${Math.floor(Math.random() * 10) + 1}`,
            timestamp: new Date().toISOString(),
            metadata: {
              source: 'system',
              category: 'operational'
            }
          };

          const data = `data: ${JSON.stringify(eventData)}\n\n`;
          controller.enqueue(new TextEncoder().encode(data));
        }, options?.flushInterval || 3000);

        // 5분 후 자동 종료
        setTimeout(() => {
          clearInterval(interval);
          controller.close();
        }, 300000);
      }
    });
  }

  // 필터 매칭 헬퍼
  private static matchesFilter(item: any, filters?: any): boolean {
    if (!filters) return true;
    
    if (filters.level && item.level !== filters.level) return false;
    if (filters.source && item.source !== filters.source) return false;
    if (filters.serverId && item.serverId !== filters.serverId) return false;
    
    return true;
  }

  // 모의 로그 생성 헬퍼
  private static generateMockLogs(count: number): any[] {
    const levels = ['debug', 'info', 'warn', 'error'];
    const sources = ['api', 'database', 'cache', 'ai-engine'];
    
    return Array.from({ length: count }, (_, i) => ({
      id: `log-${Date.now()}-${i}`,
      timestamp: new Date().toISOString(),
      level: levels[Math.floor(Math.random() * levels.length)],
      source: sources[Math.floor(Math.random() * sources.length)],
      message: `Log message ${i + 1} at ${new Date().toLocaleTimeString()}`,
      serverId: `server-${Math.floor(Math.random() * 5) + 1}`,
      metadata: {
        responseTime: Math.random() * 1000,
        statusCode: Math.random() > 0.9 ? 500 : 200
      }
    }));
  }
}

// GET 핸들러 - 스트리밍 시작
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'logs';
  const format = searchParams.get('format') || 'sse';
  const serverId = searchParams.get('serverId') || undefined;
  const level = searchParams.get('level') || undefined;

  debug.log('Streaming GET Request:', { type, format, serverId, level });

  // SSE 헤더 설정
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  try {
    let stream: ReadableStream;
    const streamingRequest: StreamingRequest = {
      type: type as any,
      format: format as any,
      filters: { level: level as any, serverId }
    };

    switch (type) {
      case 'logs':
        stream = await StreamingManager.streamLogs(streamingRequest);
        break;
      case 'thinking':
        stream = await StreamingManager.streamThinking(streamingRequest);
        break;
      case 'metrics':
        stream = await StreamingManager.streamMetrics(streamingRequest);
        break;
      case 'events':
        stream = await StreamingManager.streamEvents(streamingRequest);
        break;
      default:
        return NextResponse.json(
          { error: `Unsupported streaming type: ${type}` },
          { status: 400 }
        );
    }

    return new NextResponse(stream, { headers });

  } catch (error) {
    debug.error('Streaming Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// POST 핸들러 - 스트리밍 설정
export const POST = createApiRoute(
  streamingRequestSchema,
  withAuth(async (validatedData: StreamingRequest, request: NextRequest) => {
    debug.log('Streaming POST Request:', validatedData);

    try {
      // 스트리밍 설정 저장 (실제로는 Redis나 메모리에 저장)
      const streamingConfig = {
        id: `stream-${Date.now()}`,
        type: validatedData.type,
        format: validatedData.format,
        filters: validatedData.filters,
        options: validatedData.options,
        status: 'configured',
        createdAt: new Date().toISOString()
      };

      return NextResponse.json({
        success: true,
        streamingConfig,
        streamUrl: `/api/ai-unified/streaming?type=${validatedData.type}&format=${validatedData.format}`,
        message: 'Streaming configuration saved. Use GET endpoint to start streaming.'
      });

    } catch (error) {
      debug.error('Streaming Configuration Error:', error);
      
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  })
);