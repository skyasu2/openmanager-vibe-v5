/**
 * 🔄 하이브리드 RAG 엔진 테스트 API
 *
 * Supabase RAG 실패 시 LocalRAG 자동 폴백 테스트
 *
 * 사용법:
 * - GET /api/test-hybrid-rag?query=top&forceLocal=true
 * - GET /api/test-hybrid-rag?query=list files&threshold=0.01
 */

import { HybridRAGEngine } from '@/core/ai/engines/HybridRAGEngine';
import { NextRequest, NextResponse } from 'next/server';

const hybridRAG = new HybridRAGEngine();

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const { searchParams } = new URL(request.url);

  const query = searchParams.get('query') || 'list files';
  const category = searchParams.get('category') || undefined;
  const maxResults = parseInt(searchParams.get('maxResults') || '5');
  const threshold = parseFloat(searchParams.get('threshold') || '0.01');
  const forceLocalRAG = searchParams.get('forceLocal') === 'true';

  console.log(`🔍 하이브리드 RAG 테스트: "${query}"`);
  console.log(
    `🎯 설정: maxResults=${maxResults}, threshold=${threshold}, forceLocal=${forceLocalRAG}`
  );

  try {
    // 하이브리드 RAG 검색 실행
    const result = await hybridRAG.search({
      query,
      category,
      maxResults,
      threshold,
      forceLocalRAG,
    });

    // 통계 정보 추가
    const stats = hybridRAG.getStats();
    const healthCheck = await hybridRAG.healthCheck();

    const response = {
      success: result.success,
      timestamp: new Date().toISOString(),
      query: {
        text: query,
        category,
        maxResults,
        threshold,
        forceLocalRAG,
      },
      result: {
        engine: result.engine,
        processingTime: result.processingTime,
        confidence: result.confidence,
        fallbackUsed: result.fallbackUsed,
        totalResults: result.results.length,
        results: result.results,
      },
      metadata: result.metadata,
      statistics: {
        ...stats,
        currentSession: {
          totalTime: Date.now() - startTime,
          engineUsed: result.engine,
          fallbackTriggered: result.fallbackUsed,
        },
      },
      healthCheck,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        isVercel: !!(process.env.VERCEL || process.env.VERCEL_ENV),
        isRender: !!(process.env.RENDER || process.env.RENDER_SERVICE_ID),
        timestamp: new Date().toISOString(),
      },
    };

    console.log(
      `✅ 하이브리드 RAG 완료: ${result.engine} 엔진 사용 (${result.processingTime}ms)`
    );
    console.log(
      `📊 결과: ${result.results.length}개, 폴백 사용: ${result.fallbackUsed}`
    );

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('❌ 하이브리드 RAG 테스트 실패:', error);

    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        error: {
          message: error.message,
          type: error.constructor.name,
          stack:
            process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
        query: { text: query, category, maxResults, threshold, forceLocalRAG },
        processingTime: Date.now() - startTime,
        environment: {
          nodeEnv: process.env.NODE_ENV,
          isVercel: !!(process.env.VERCEL || process.env.VERCEL_ENV),
          isRender: !!(process.env.RENDER || process.env.RENDER_SERVICE_ID),
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      query,
      category,
      maxResults = 5,
      threshold = 0.01,
      forceLocalRAG = false,
    } = body;

    console.log(`🔍 하이브리드 RAG POST 테스트: "${query}"`);

    const result = await hybridRAG.search({
      query,
      category,
      maxResults,
      threshold,
      forceLocalRAG,
    });

    const stats = hybridRAG.getStats();
    const healthCheck = await hybridRAG.healthCheck();

    return NextResponse.json(
      {
        success: result.success,
        timestamp: new Date().toISOString(),
        result,
        statistics: stats,
        healthCheck,
        environment: {
          nodeEnv: process.env.NODE_ENV,
          isVercel: !!(process.env.VERCEL || process.env.VERCEL_ENV),
          isRender: !!(process.env.RENDER || process.env.RENDER_SERVICE_ID),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ 하이브리드 RAG POST 실패:', error);

    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        error: {
          message: error.message,
          type: error.constructor.name,
        },
      },
      { status: 500 }
    );
  }
}
