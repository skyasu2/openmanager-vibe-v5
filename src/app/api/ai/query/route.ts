/**
 * 🤖 AI 쿼리 API (최적화됨)
 *
 * 목표: 응답 시간 500ms 이하
 * - 쿼리 복잡도 자동 분석
 * - 적절한 엔진 자동 선택
 * - 병렬 처리 및 캐싱
 * POST /api/ai/query
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getSimplifiedQueryEngine } from '@/services/ai/SimplifiedQueryEngine';
import type { QueryRequest } from '@/services/ai/SimplifiedQueryEngine';
import { withAuth } from '@/lib/api-auth';

export const runtime = 'nodejs';

// 엔진 초기화 (서버 시작 시 한 번만)
const queryEngine = getSimplifiedQueryEngine();
queryEngine._initialize().catch(console.error);

interface AIQueryRequest {
  query: string;
  temperature?: number;
  maxTokens?: number;
  context?: string;
  includeThinking?: boolean;
  mode?: 'local' | 'google-ai' | 'auto';
  timeoutMs?: number;
}

async function postHandler(request: NextRequest) {
  try {
    const _startTime = Date.now();

    const body: AIQueryRequest = await request.json();
    const {
      query,
      temperature = 0.7,
      maxTokens = 1000,
      context = 'general',
      includeThinking = true,
      mode = 'auto',
      timeoutMs = 450,
    } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Query parameter is required',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // 쿼리 길이 제한
    if (query.length > 1000) {
      return NextResponse.json(
        {
          success: false,
          error: 'Query too long (max 1000 characters)',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // 헤더에서 우선 모드 확인
    const preferredMode = request.headers.get('X-AI-Mode') as
      | 'local'
      | 'google-ai'
      | 'auto'
      | null;

    // SimplifiedQueryEngine 사용 (최적화된 응답 시간)
    const queryRequest: QueryRequest = {
      query,
      mode: mode || preferredMode || 'auto',
      context: {
        metadata: {
          category: context,
        },
      },
      options: {
        temperature,
        maxTokens,
        includeThinking,
        includeMCPContext: mode === 'google-ai' && query.length > 100,
        category: context,
        timeoutMs,
      },
    };

    const result = await queryEngine.query(queryRequest);

    const responseTime = result.processingTime;

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
        mode: mode || preferredMode || 'auto',
        temperature,
        maxTokens,
        context,
        includeThinking,
        thinkingSteps: includeThinking ? result.thinkingSteps : undefined,
        complexity: result.metadata?.complexity,
        cacheHit: result.metadata?.cacheHit,
        ragResults: result.metadata?.ragResults,
      },
    };

    // 성능 모니터링
    if (responseTime > 500) {
      console.warn(
        `⚠️ AI 쿼리 응답 시간 초과: ${responseTime}ms, 엔진: ${result.engine}`
      );
    } else {
      console.log(
        `✅ AI 쿼리 처리 완료: ${responseTime}ms, 엔진: ${result.engine}, 캐시: ${result.metadata?.cacheHit ? 'HIT' : 'MISS'}`
      );
    }

    // 성능 모니터링 헤더 추가
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Cache-Control': result.metadata?.cacheHit
        ? 'public, max-age=60'
        : 'no-store',
      'X-Response-Time': responseTime.toString(),
      'X-AI-Engine': result.engine,
      'X-Cache-Status': result.metadata?.cacheHit ? 'HIT' : 'MISS',
    });

    // 복잡도 정보 추가 (디버깅용)
    if (result.metadata?.complexity) {
      headers.set(
        'X-Complexity-Score',
        result.metadata.complexity.score.toString()
      );
      headers.set(
        'X-Complexity-Recommendation',
        result.metadata.complexity.recommendation
      );
    }

    return NextResponse.json(response, {
      status: result.success ? 200 : 500,
      headers,
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
async function getHandler(_request: NextRequest) {
  try {
    const healthStatus = await queryEngine.healthCheck();

    return NextResponse.json(
      {
        success: true,
        timestamp: new Date().toISOString(),
        service: 'ai-query-optimized',
        status: healthStatus.status,
        engines: {
          'local-rag': {
            name: 'Supabase RAG Engine',
            available: healthStatus.engines.localRAG,
            status: healthStatus.engines.localRAG ? 'healthy' : 'unavailable',
            description: '벡터 DB 기반 빠른 검색',
          },
          'google-ai': {
            name: 'Google AI (Gemini)',
            available: healthStatus.engines.googleAI,
            status: healthStatus.engines.googleAI ? 'healthy' : 'unavailable',
            description: '복잡한 분석 및 추론',
          },
          'mcp-context': {
            name: 'MCP Context Assistant',
            available: healthStatus.engines.mcp,
            status: healthStatus.engines.mcp ? 'healthy' : 'degraded',
            description: '프로젝트 컨텍스트 지원',
          },
        },
        capabilities: {
          autoMode: true,
          complexityAnalysis: true,
          multiEngine: true,
          ragSearch: true,
          contextAware: true,
          thinkingMode: true,
          mcpIntegration: true,
          performanceOptimized: true,
          responseCaching: true,
          parallelProcessing: true,
        },
        optimization: {
          targetResponseTime: '< 500ms',
          cacheEnabled: true,
          autoEngineSelection: true,
          timeoutFallback: true,
        },
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=60',
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

/**
 * OPTIONS 요청 처리 (CORS)
 */
export async function OPTIONS(_req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-AI-Mode',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// Export with authentication
export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);
