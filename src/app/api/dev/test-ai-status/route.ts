import { NextRequest, NextResponse } from 'next/server';

/**
 * 🧪 AI 엔진 상태 테스트 엔드포인트
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const results: any = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      tests: {},
    };

    // 1. 환경변수 확인
    results.tests.environment = {
      googleAIKey: !!process.env.GOOGLE_AI_API_KEY,
      googleAIEnabled: process.env.GOOGLE_AI_ENABLED === 'true',
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      redisUrl: !!process.env.REDIS_URL,
    };

    // 2. Google AI 서비스 테스트
    try {
      const { GoogleAIService } = await import('@/services/ai/GoogleAIService');
      const googleAI = GoogleAIService.getInstance();
      const googleStatus = googleAI.getStatus();

      results.tests.googleAI = {
        available: googleAI.isAvailable(),
        ready: googleAI.isReady(),
        status: googleStatus,
      };
    } catch (error) {
      results.tests.googleAI = {
        error: error.message,
        available: false,
      };
    }

    // 3. Supabase RAG 테스트
    try {
      const { getSupabaseRAGEngine } = await import(
        '@/lib/ml/supabase-rag-engine'
      );
      const ragEngine = getSupabaseRAGEngine();

      results.tests.supabaseRAG = {
        available: true,
        initialized: true,
      };
    } catch (error) {
      results.tests.supabaseRAG = {
        error: error.message,
        available: false,
      };
    }

    // 4. 통합 AI 엔진 라우터 테스트
    try {
      const { unifiedAIRouter } = await import(
        '@/core/ai/engines/UnifiedAIEngineRouter'
      );
      const routerStatus = unifiedAIRouter.getEngineStatus();

      results.tests.unifiedRouter = {
        available: true,
        status: routerStatus,
      };
    } catch (error) {
      results.tests.unifiedRouter = {
        error: error.message,
        available: false,
      };
    }

    results.processingTime = Date.now() - startTime;
    results.success = true;

    return NextResponse.json(results, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error('❌ AI 상태 테스트 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
