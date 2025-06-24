import { NextRequest, NextResponse } from 'next/server';

/**
 * 🚧 AI 체인 테스트 API (임시 비활성화)
 *
 * 이 엔드포인트는 구버전 AI 엔진 제거로 인해 임시 비활성화되었습니다.
 * 향후 새로운 UnifiedAIEngineRouter 기반으로 재구현 예정입니다.
 */
export async function GET(request: NextRequest) {
  try {
    // AI 체인 테스트 결과 (목업 데이터)
    const chainTestResult = {
      chainId: `chain_${Date.now()}`,
      status: 'success',
      steps: [
        {
          step: 1,
          name: 'Input Processing',
          status: 'completed',
          duration: 150,
          output: 'Input successfully parsed and validated',
        },
        {
          step: 2,
          name: 'AI Engine Selection',
          status: 'completed',
          duration: 50,
          output: 'Selected Google AI engine based on query type',
        },
        {
          step: 3,
          name: 'Query Processing',
          status: 'completed',
          duration: 800,
          output: 'Query processed successfully with confidence 0.95',
        },
        {
          step: 4,
          name: 'Response Generation',
          status: 'completed',
          duration: 200,
          output: 'Response generated and formatted',
        },
      ],
      totalDuration: 1200,
      confidence: 0.95,
      engineUsed: 'google-ai',
      fallbacksUsed: 0,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: chainTestResult,
      message: 'AI 체인 테스트 완료',
    });
  } catch (error) {
    console.error('❌ AI 체인 테스트 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'AI 체인 테스트 실패',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}

/**
 * AI 체인 실행 API
 * POST /api/ai/test-chain
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, mode = 'AUTO' } = body;

    if (!query) {
      return NextResponse.json(
        {
          success: false,
          error: '쿼리가 필요합니다.',
        },
        { status: 400 }
      );
    }

    // AI 체인 실행 시뮬레이션
    const executionResult = {
      chainId: `exec_${Date.now()}`,
      query,
      mode,
      status: 'completed',
      result: `테스트 쿼리 "${query}"에 대한 AI 체인 실행이 완료되었습니다.`,
      confidence: 0.87,
      processingTime: 1500,
      enginePath: ['google-ai', 'local-fallback'],
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: executionResult,
      message: 'AI 체인 실행 완료',
    });
  } catch (error) {
    console.error('❌ AI 체인 실행 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'AI 체인 실행 실패',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
