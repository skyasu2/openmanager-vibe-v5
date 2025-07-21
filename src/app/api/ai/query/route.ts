/**
 * 🤖 AI 쿼리 API
 *
 * 통합 AI 엔진을 사용한 쿼리 처리
 * POST /api/ai/query
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSimplifiedQueryEngine } from '@/services/ai/SimplifiedQueryEngine';

export const runtime = 'nodejs';

interface AIQueryRequest {
  query: string;
  temperature?: number;
  maxTokens?: number;
  context?: string;
  includeThinking?: boolean;
  mode?: 'local' | 'google-ai';
}

export async function POST(request: NextRequest) {
  try {
    console.log('🤖 AI 쿼리 요청 처리 시작...');

    const body: AIQueryRequest = await request.json();
    const {
      query,
      temperature = 0.7,
      maxTokens = 1000,
      context = 'general',
      includeThinking = false,
      mode = 'local',
    } = body;

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
    const result = await queryEngine.query({
      query,
      mode,
      context: { type: context },
      options: {
        temperature,
        maxTokens,
        includeThinking,
        includeMCPContext: false, // AI 쿼리에서는 MCP 컨텍스트 비활성화
      },
    });

    const responseTime = Date.now() - startTime;

    // 응답 포맷팅
    const response = {
      success: result.success,
      query,
      response: result.response,
      confidence: result.confidence,
      engine: result.engine,
      responseTime,
      timestamp: new Date().toISOString(),
      metadata: {
        mode,
        temperature,
        maxTokens,
        context,
        includeThinking,
        thinkingSteps: result.thinkingSteps,
        ...result.metadata,
      },
    };

    console.log(
      `✅ AI 쿼리 처리 완료: ${responseTime}ms, 엔진: ${result.engine}`
    );

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
        'X-Response-Time': responseTime.toString(),
        'X-AI-Engine': result.engine,
      },
    });
  } catch (error) {
    console.error('❌ AI 쿼리 처리 실패:', error);

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
 * 📊 AI 쿼리 시스템 상태 확인
 *
 * GET /api/ai/query
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📊 AI 쿼리 시스템 상태 조회...');

    const queryEngine = getSimplifiedQueryEngine();
    const healthStatus = await queryEngine.healthCheck();

    return NextResponse.json(
      {
        success: true,
        timestamp: new Date().toISOString(),
        service: 'ai-query',
        status: healthStatus.status,
        engines: {
          'local-rag': {
            name: 'Supabase RAG Engine',
            available: healthStatus.engines.localRAG,
            status: healthStatus.engines.localRAG ? 'healthy' : 'unavailable',
          },
          'google-ai': {
            name: 'Google AI (Gemini)',
            available: healthStatus.engines.googleAI,
            status: healthStatus.engines.googleAI ? 'healthy' : 'unavailable',
          },
          'mcp-context': {
            name: 'MCP Context Assistant',
            available: healthStatus.engines.mcp,
            status: healthStatus.engines.mcp ? 'healthy' : 'degraded',
          },
        },
        capabilities: {
          multiMode: true,
          ragSearch: true,
          contextAware: true,
          thinkingMode: true,
          mcpIntegration: true,
        },
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=30',
        },
      }
    );
  } catch (error) {
    console.error('❌ AI 쿼리 상태 조회 실패:', error);

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
