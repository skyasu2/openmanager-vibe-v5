/**
 * 🤖 AI 쿼리 API
 *
 * 향상된 AI 엔진을 사용한 쿼리 처리
 * POST /api/ai/query
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getPerformanceOptimizedQueryEngine } from '@/services/ai/performance-optimized-query-engine';

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

    // PerformanceOptimizedQueryEngine 사용 (고급 성능 최적화 적용)
    const queryEngine = getPerformanceOptimizedQueryEngine({
      enableParallelProcessing: true,
      enablePredictiveLoading: true,
      enableCircuitBreaker: true,
      cacheStrategy: 'adaptive',
      timeoutMs: 12000, // 12초 타임아웃
    });
    const result = await queryEngine.query({
      query,
      mode,
      context: {
        metadata: {
          category: context,
        },
      },
      options: {
        temperature,
        maxTokens,
        includeThinking,
        includeMCPContext: false, // AI 쿼리에서는 MCP 컨텍스트 비활성화
        category: context,
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
      `✅ AI 쿼리 처리 완료: ${responseTime}ms, 엔진: ${result.engine}, 캐시: ${result.metadata?.cacheHit ? 'HIT' : 'MISS'}`
    );

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
        'X-Response-Time': responseTime.toString(),
        'X-AI-Engine': result.engine,
        'X-Cache-Hit': result.metadata?.cacheHit ? 'true' : 'false',
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
export async function GET(_request: NextRequest) {
  try {
    console.log('📊 AI 쿼리 시스템 상태 조회...');

    const queryEngine = getPerformanceOptimizedQueryEngine();
    const [healthStatus, performanceStats] = await Promise.all([
      queryEngine.healthCheck(),
      queryEngine.getPerformanceStats(),
    ]);

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
          performanceOptimized: true,
          patternCaching: true,
          vectorIndexing: true,
        },
        performance: {
          totalQueries: performanceStats.metrics.totalQueries,
          cacheHitRate: performanceStats.optimization.cacheHitRate,
          avgResponseTime: Math.round(performanceStats.metrics.avgResponseTime),
          totalTimeSaved: performanceStats.metrics.optimizationsSaved,
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
