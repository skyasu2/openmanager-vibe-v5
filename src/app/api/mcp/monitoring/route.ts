/**
 * 🤖 MCP 기반 서버 모니터링 에이전트 API
 *
 * 기능:
 * - 질의응답 with 생각과정 애니메이션
 * - 자동 장애보고서 생성
 * - 실시간 인사이트 제공
 * - 타이핑 애니메이션용 스트리밍 응답
 */

import { getMCPStatus } from '@/config/mcp-config';
import type { QueryRequest } from '@/services/mcp/ServerMonitoringAgent';
import { serverMonitoringAgent } from '@/services/mcp/ServerMonitoringAgent';
import { RealMCPClient } from '@/services/mcp/real-mcp-client';
import { NextRequest, NextResponse } from 'next/server';

// Next.js App Router 런타임 설정
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
    // 🛠️ 개발 도구 전용 MCP 클라이언트 사용 (Vercel 내장)
    const devMcpClient = RealMCPClient.getDevToolsInstance();
    await devMcpClient.initialize();

    const mcpStatus = getMCPStatus();
    const serverStatus = await devMcpClient.getServerStatus();
    const connectionInfo = devMcpClient.getConnectionInfo();

    return NextResponse.json({
      success: true,
      data: {
        status: mcpStatus,
        servers: serverStatus,
        connection: connectionInfo,
        purpose: '개발/테스트/모니터링 전용 (Vercel 내장 MCP)',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('❌ MCP 모니터링 조회 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        purpose: '개발/테스트/모니터링 전용 (Vercel 내장 MCP)',
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
        const responseText = response.answer;
        const words = responseText.split(' ');

        for (let i = 0; i < words.length; i++) {
          const partialText = words.slice(0, i + 1).join(' ');
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'typing',
                data: { text: partialText, progress: (i + 1) / words.length },
              })}\n\n`
            )
          );

          await new Promise(resolve => setTimeout(resolve, 50));
        }

        // 4. 완료 신호
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'complete',
              data: response,
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
