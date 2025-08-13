/**
 * 🤖 MCP 쿼리 API
 *
 * AI 사이드바에서 사용하는 MCP 쿼리 처리 엔드포인트
 * POST /api/mcp/query
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { QueryRequest, QueryResponse } from '@/services/ai/SimplifiedQueryEngine';

// 동적 import로 빌드 시점 초기화 방지
async function getQueryEngine() {
  const { getSimplifiedQueryEngine } = await import('@/services/ai/SimplifiedQueryEngine');
  return getSimplifiedQueryEngine();
}
import { CloudContextLoader } from '@/services/mcp/CloudContextLoader';
import debug from '@/utils/debug';

export const runtime = 'nodejs';


interface MCPQueryRequest {
  query: string;
  context?: string;
  includeThinking?: boolean;
  sessionId?: string;
}

export async function POST(request: NextRequest) {
  try {
    debug.log('🤖 MCP 쿼리 요청 처리 시작...');

    const body: MCPQueryRequest = await request.json();
    const { query, context = 'ai-sidebar', includeThinking = true } = body;

    if (!query) {
      return NextResponse.json(
        {
          success: false,
          error: 'Query parameter is required',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // SimplifiedQueryEngine을 사용한 실제 쿼리 처리
    const engine = await getQueryEngine();
    
    const queryRequest: QueryRequest = {
      query,
      mode: 'local',
      options: {
        temperature: 0.7,
        maxTokens: 1000,
        includeThinking,
        category: context,
      },
    };

    const result: QueryResponse = await engine.query(queryRequest);

    const responseTime = Date.now() - startTime;

    // 3. 응답 포맷팅
    const response = {
      success: result.success,
      query,
      response: result.response,
      confidence: result.confidence,
      engine: result.engine,
      responseTime,
      timestamp: new Date().toISOString(),
      metadata: {
        context,
        includeThinking,
        thinkingSteps: result.thinkingSteps,
        ...result.metadata,
      },
    };

    debug.log(
      `✅ MCP 쿼리 처리 완료: ${responseTime}ms, 엔진: ${result.engine}`
    );

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
        'X-Response-Time': responseTime.toString(),
      },
    });
  } catch (error) {
    debug.error('❌ MCP 쿼리 처리 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Query processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * 📊 MCP 쿼리 상태 확인
 *
 * GET /api/mcp/query
 */
export async function GET(_request: NextRequest) {
  try {
    debug.log('📊 MCP 쿼리 시스템 상태 조회...');

    const cloudContextLoader = CloudContextLoader.getInstance();
    const status = await cloudContextLoader.getIntegratedStatus();

    return NextResponse.json(
      {
        success: true,
        timestamp: new Date().toISOString(),
        service: 'mcp-query',
        status: 'active',
        capabilities: {
          contextIntegration: true,
          aiProcessing: true,
          thinkingMode: true,
          supportedEngines: ['gemini', 'openai', 'local'],
        },
        serverStatus: status,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=30',
        },
      }
    );
  } catch (error) {
    debug.error('❌ MCP 쿼리 상태 조회 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Status check failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
