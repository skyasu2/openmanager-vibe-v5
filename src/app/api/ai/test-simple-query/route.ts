import { NextRequest, NextResponse } from 'next/server';

/**
 * 🧪 간단한 AI 쿼리 테스트 (통합 라우터 우회)
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { query, engine = 'google' } = body;

    if (!query) {
      return NextResponse.json(
        {
          success: false,
          error: 'query 파라미터가 필요합니다.',
        },
        { status: 400 }
      );
    }

    let result: any = {
      success: false,
      response: '',
      engine: engine,
      processingTime: 0,
    };

    // Google AI 직접 테스트
    if (engine === 'google') {
      try {
        const { GoogleAIService } = await import(
          '@/services/ai/GoogleAIService'
        );
        const googleAI = GoogleAIService.getInstance();

        if (!googleAI.isAvailable()) {
          result = {
            success: false,
            response: 'Google AI 서비스를 사용할 수 없습니다.',
            engine: 'google',
            error: 'Google AI 사용 불가',
            processingTime: Date.now() - startTime,
          };
        } else {
          const response = await googleAI.generateResponse(query);
          result = {
            success: response.success,
            response: response.content,
            engine: 'google',
            confidence: response.confidence,
            processingTime: Date.now() - startTime,
            error: response.error?.message,
          };
        }
      } catch (error: any) {
        result = {
          success: false,
          response: '',
          engine: 'google',
          error: error.message,
          processingTime: Date.now() - startTime,
        };
      }
    }

    // Supabase RAG 직접 테스트
    else if (engine === 'rag') {
      try {
        const { getSupabaseRAGEngine } = await import(
          '@/lib/ml/supabase-rag-engine'
        );
        const ragEngine = getSupabaseRAGEngine();

        const ragResult = await ragEngine.searchSimilar(query, {
          maxResults: 3,
          threshold: 0.6,
        });

        if (ragResult.success && ragResult.results.length > 0) {
          result = {
            success: true,
            response: ragResult.results[0].content,
            engine: 'rag',
            confidence: ragResult.results[0].similarity,
            resultsCount: ragResult.results.length,
            processingTime: Date.now() - startTime,
          };
        } else {
          result = {
            success: false,
            response: 'RAG 검색 결과가 없습니다.',
            engine: 'rag',
            processingTime: Date.now() - startTime,
          };
        }
      } catch (error: any) {
        result = {
          success: false,
          response: '',
          engine: 'rag',
          error: error.message,
          processingTime: Date.now() - startTime,
        };
      }
    }

    // 기본 응답 (엔진 없음)
    else {
      result = {
        success: true,
        response: `"${query}"에 대한 기본 응답입니다. 서버는 정상적으로 작동하고 있습니다.`,
        engine: 'basic',
        processingTime: Date.now() - startTime,
      };
    }

    return NextResponse.json(result, {
      status: result.success ? 200 : 500,
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error('❌ 간단한 AI 쿼리 테스트 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: '간단한 AI 쿼리 테스트 엔드포인트',
    usage: 'POST /api/ai/test-simple-query',
    body: {
      query: 'string (required)',
      engine: 'google | rag | basic (optional, default: google)',
    },
  });
}
