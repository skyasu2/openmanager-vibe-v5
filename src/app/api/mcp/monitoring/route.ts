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
    console.log('🔍 MCP 모니터링 API 호출');

    const mcpClient = getMCPClient();

    // MCP 서버들 헬스체크 (Render 서버 포함)
    const healthStatus = await mcpClient.healthCheck();
    const connectionStatus = mcpClient.getConnectionStatus();
    const stats = mcpClient.getStats();

    // Render MCP 서버 상세 정보
    const renderMCPInfo = healthStatus['render-mcp'];

    const response = {
      timestamp: new Date().toISOString(),
      status: 'success',
      mcp: {
        health: healthStatus,
        connections: connectionStatus,
        stats,
        renderServer: {
          url: 'https://openmanager-vibe-v5.onrender.com',
          ips: ['13.228.225.19', '18.142.128.26', '54.254.162.138'],
          port: 10000,
          status: renderMCPInfo?.status || 'unknown',
          latency: renderMCPInfo?.latency,
          details: renderMCPInfo?.details,
        },
      },
      summary: {
        totalServers: Object.keys(healthStatus).length,
        healthyServers: Object.values(healthStatus).filter(
          h => h.status === 'healthy'
        ).length,
        averageLatency:
          Object.values(healthStatus)
            .filter(h => h.latency)
            .reduce((sum, h) => sum + (h.latency || 0), 0) /
            Object.values(healthStatus).filter(h => h.latency).length || 0,
        renderServerHealthy: renderMCPInfo?.status === 'healthy',
      },
    };

    console.log('✅ MCP 모니터링 완료:', {
      totalServers: response.summary.totalServers,
      healthyServers: response.summary.healthyServers,
      renderStatus: response.mcp.renderServer.status,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ MCP 모니터링 오류:', error);

    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        mcp: {
          health: {},
          connections: {},
          stats: {
            totalServers: 0,
            connectedServers: 0,
            totalTools: 0,
            isConnected: false,
          },
          renderServer: {
            url: 'https://openmanager-vibe-v5.onrender.com',
            ips: ['13.228.225.19', '18.142.128.26', '54.254.162.138'],
            port: 10000,
            status: 'error',
            error: 'Failed to check health',
          },
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await initializeAgent();

    const body = await request.json();
    const { action, query, context, stream = false } = body;

    switch (action) {
      case 'query':
        // 질의응답 처리
        if (!query) {
          return NextResponse.json(
            { success: false, error: 'query 필드가 필요합니다' },
            { status: 400 }
          );
        }

        const queryRequest: QueryRequest = {
          id: `query_${Date.now()}`,
          query,
          timestamp: new Date(),
          context,
        };

        if (stream) {
          // 스트리밍 응답 (타이핑 애니메이션용)
          return handleStreamingResponse(queryRequest);
        } else {
          // 일반 응답
          const response =
            await serverMonitoringAgent.processQuery(queryRequest);
          return NextResponse.json({
            success: true,
            data: response,
            timestamp: new Date().toISOString(),
          });
        }

      case 'analyze-server':
        // 특정 서버 분석
        const { serverId } = body;
        if (!serverId) {
          return NextResponse.json(
            { success: false, error: 'serverId 필드가 필요합니다' },
            { status: 400 }
          );
        }

        const serverQuery: QueryRequest = {
          id: `server_analysis_${Date.now()}`,
          query: `${serverId} 서버의 상태를 분석해주세요`,
          timestamp: new Date(),
          context: { serverId },
        };

        const serverResponse =
          await serverMonitoringAgent.processQuery(serverQuery);
        return NextResponse.json({
          success: true,
          data: serverResponse,
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json(
          { success: false, error: '지원하지 않는 액션입니다' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ MCP 모니터링 POST API 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'POST 요청 처리에 실패했습니다',
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
