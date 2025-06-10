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
import { serverMonitoringAgent } from '@/core/mcp/ServerMonitoringAgent';
import type {
  QueryRequest,
  IncidentReport,
} from '@/core/mcp/ServerMonitoringAgent';

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
    await initializeAgent();

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'health';
    const serverId = searchParams.get('serverId');

    switch (action) {
      case 'health':
        // 에이전트 상태 확인
        const healthStatus = await serverMonitoringAgent.healthCheck();
        return NextResponse.json({
          success: true,
          data: healthStatus,
          timestamp: new Date().toISOString(),
        });

      case 'capabilities':
        // 에이전트 능력 조회
        return NextResponse.json({
          success: true,
          data: {
            features: [
              'intelligent-query-answering',
              'thinking-process-animation',
              'incident-analysis',
              'auto-report-generation',
              'performance-insights',
              'cost-optimization',
              'predictive-analysis',
            ],
            supportedQueries: [
              '서버 상태는?',
              '장애가 있나요?',
              '성능 분석해주세요',
              '비용 최적화 방안은?',
              '미래 예측은?',
              '개선 방안 추천해주세요',
            ],
            languages: ['Korean', 'English'],
          },
          timestamp: new Date().toISOString(),
        });

      case 'incident-report':
        // 자동 장애보고서 생성
        if (!serverId) {
          return NextResponse.json(
            { success: false, error: 'serverId 파라미터가 필요합니다' },
            { status: 400 }
          );
        }

        const report =
          await serverMonitoringAgent.generateIncidentReport(serverId);
        return NextResponse.json({
          success: true,
          data: report,
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json(
          { success: false, error: '지원하지 않는 액션입니다' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ MCP 모니터링 GET API 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'API 요청 처리에 실패했습니다',
        details: error instanceof Error ? error.message : 'Unknown error',
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
