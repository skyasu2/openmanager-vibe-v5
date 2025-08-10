/**
 * 🤖 MCP 쿼리 API
 *
 * AI 사이드바에서 사용하는 MCP 쿼리 처리 엔드포인트
 * POST /api/mcp/query
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getSimplifiedQueryEngine } from '@/services/ai/SimplifiedQueryEngine';
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

    // SimplifiedQueryEngine 사용
    const queryEngine = getSimplifiedQueryEngine();

    // 기본적으로 로컬 모드 사용 (Supabase RAG)
    const result = await queryEngine.query({
      query,
      mode: 'local',
      context: {
        metadata: {
          source: context,
        },
      },
      options: {
        includeThinking,
        includeMCPContext: true, // MCP 컨텍스트 포함
        temperature: 0.7,
        maxTokens: 1000,
      },
    });

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
