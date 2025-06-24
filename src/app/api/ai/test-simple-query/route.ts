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

/**
 * 간단한 AI 쿼리 테스트 API
 * GET /api/ai/test-simple-query
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testType = searchParams.get('type') || 'basic';

    // 테스트 쿼리 결과 (목업)
    const testResults = {
      testId: `test_${Date.now()}`,
      type: testType,
      status: 'success',
      results: {
        basic: {
          query: '안녕하세요',
          response: '안녕하세요! 무엇을 도와드릴까요?',
          responseTime: 150,
          confidence: 0.98,
        },
        complex: {
          query: '시스템 성능을 분석해주세요',
          response:
            '현재 시스템 성능은 양호합니다. CPU 사용률 65%, 메모리 사용률 78%로 정상 범위 내에 있습니다.',
          responseTime: 850,
          confidence: 0.92,
        },
        technical: {
          query: '서버 로그를 확인해주세요',
          response:
            '최근 로그를 확인한 결과 에러 0건, 경고 2건이 발견되었습니다. 전반적으로 안정적인 상태입니다.',
          responseTime: 650,
          confidence: 0.89,
        },
      },
      engine: 'unified-ai-router',
      timestamp: new Date().toISOString(),
    };

    const selectedResult =
      testResults.results[testType as keyof typeof testResults.results] ||
      testResults.results.basic;

    return NextResponse.json({
      success: true,
      data: {
        ...testResults,
        currentTest: selectedResult,
      },
      message: '간단한 AI 쿼리 테스트 완료',
    });
  } catch (error) {
    console.error('❌ 간단한 AI 쿼리 테스트 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: '간단한 AI 쿼리 테스트 실패',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
