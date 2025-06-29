/**
 * 🤖 MCP 기반 서버 모니터링 에이전트 API
 *
 * 기능:
 * - 질의응답 with 생각과정 애니메이션
 * - 자동 장애보고서 생성
 * - 실시간 인사이트 제공
 * - 타이핑 애니메이션용 스트리밍 응답
 */

import { NextRequest, NextResponse } from 'next/server';
import { serverMonitoringAgent } from '@/services/mcp/ServerMonitoringAgent';
import type {
  QueryRequest,
  IncidentReport,
} from '@/services/mcp/ServerMonitoringAgent';
import { getMCPClient } from '@/services/mcp/official-mcp-client';

// 에이전트 초기화 (한 번만)
let isInitialized = false;
const initializeAgent = async () => {
  if (!isInitialized) {
    await serverMonitoringAgent.initialize();
    isInitialized = true;
  }
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'status';
    const server = searchParams.get('server') || 'all';

    // MCP 모니터링 데이터 생성
    const monitoringData = {
      type,
      server,
      status: 'healthy',
      servers: [
        {
          id: 'filesystem',
          name: 'Filesystem Server',
          status: 'connected',
          uptime: '2h 15m',
          lastHeartbeat: new Date().toISOString(),
          metrics: {
            requestCount: 247,
            errorRate: 0.8,
            averageResponseTime: 45,
            memoryUsage: 32.5,
          },
        },
        {
          id: 'github',
          name: 'GitHub Server',
          status: 'connected',
          uptime: '1h 42m',
          lastHeartbeat: new Date().toISOString(),
          metrics: {
            requestCount: 156,
            errorRate: 1.2,
            averageResponseTime: 78,
            memoryUsage: 28.3,
          },
        },
        {
          id: 'openmanager-docs',
          name: 'OpenManager Docs Server',
          status: 'connected',
          uptime: '3h 8m',
          lastHeartbeat: new Date().toISOString(),
          metrics: {
            requestCount: 89,
            errorRate: 0.5,
            averageResponseTime: 32,
            memoryUsage: 19.7,
          },
        },
      ],
      summary: {
        totalServers: 3,
        connectedServers: 3,
        healthyServers: 3,
        totalRequests: 492,
        averageErrorRate: 0.83,
        systemLoad: 'low',
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: monitoringData,
    });
  } catch (error) {
    console.error('MCP 모니터링 조회 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'MCP 모니터링 조회 실패',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, server, config } = body;

    // MCP 모니터링 액션 처리 (시뮬레이션)
    let result;

    switch (action) {
      case 'restart':
        result = {
          action: 'restart',
          server: server || 'all',
          status: 'success',
          message: `${server || 'All'} 서버가 재시작되었습니다`,
          timestamp: new Date().toISOString(),
        };
        break;

      case 'healthcheck':
        result = {
          action: 'healthcheck',
          server: server || 'all',
          status: 'healthy',
          checks: {
            connectivity: true,
            memory: true,
            performance: true,
            errors: false,
          },
          timestamp: new Date().toISOString(),
        };
        break;

      case 'configure':
        result = {
          action: 'configure',
          server: server || 'all',
          status: 'success',
          config: config || {},
          message: '구성이 업데이트되었습니다',
          timestamp: new Date().toISOString(),
        };
        break;

      default:
        result = {
          action: action || 'unknown',
          status: 'error',
          message: '지원하지 않는 액션입니다',
          supportedActions: ['restart', 'healthcheck', 'configure'],
          timestamp: new Date().toISOString(),
        };
    }

    return NextResponse.json({
      success: result.status !== 'error',
      data: result,
    });
  } catch (error) {
    console.error('MCP 모니터링 액션 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'MCP 모니터링 액션 실패',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * 🎭 스트리밍 응답 처리 (타이핑 애니메이션)
 */
async function handleStreamingResponse(queryRequest: QueryRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // 1. 질의응답 처리 시작
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'thinking-start',
              data: { message: '질문을 분석하고 있습니다...' },
            })}\n\n`
          )
        );

        // 실제 처리
        const response = await serverMonitoringAgent.processQuery(queryRequest);

        // 2. 생각과정 단계별 전송
        for (const step of response.thinkingSteps) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'thinking-step',
                data: step,
              })}\n\n`
            )
          );

          // 자연스러운 딜레이
          await new Promise(resolve => setTimeout(resolve, 300));
        }

        // 3. 답변 타이핑 애니메이션
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'answer-start',
              data: { message: '답변을 생성하고 있습니다...' },
            })}\n\n`
          )
        );

        // 답변을 단어별로 전송
        const words = response.answer.split(' ');
        let currentAnswer = '';

        for (const word of words) {
          currentAnswer += (currentAnswer ? ' ' : '') + word;

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'answer-chunk',
                data: {
                  chunk: word,
                  currentAnswer,
                  progress: (words.indexOf(word) + 1) / words.length,
                },
              })}\n\n`
            )
          );

          // 타이핑 속도 시뮬레이션
          await new Promise(resolve => setTimeout(resolve, 80));
        }

        // 4. 최종 결과 전송
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'complete',
              data: {
                ...response,
                streamingComplete: true,
              },
            })}\n\n`
          )
        );

        controller.close();
      } catch (error) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'error',
              data: {
                error: error instanceof Error ? error.message : 'Unknown error',
              },
            })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
