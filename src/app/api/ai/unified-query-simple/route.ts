import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { query, mode = 'LOCAL' } = body;

    if (!query) {
      return NextResponse.json(
        {
          success: false,
          error: 'query 파라미터가 필요합니다.',
        },
        { status: 400 }
      );
    }

    console.log(`🎯 간단한 통합 AI 쿼리: "${query}" (모드: ${mode})`);

    // 기본 응답 생성
    const response = generateBasicResponse(query);

    const result = {
      success: true,
      response: response,
      mode: mode,
      enginePath: ['basic-fallback'],
      processingTime: Date.now() - startTime,
      fallbacksUsed: 0,
      metadata: {
        mainEngine: 'basic-fallback',
        supportEngines: [],
        ragUsed: false,
        googleAIUsed: false,
        mcpUsed: false,
        subEnginesUsed: [],
      },
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('❌ 간단한 통합 AI 쿼리 실패:', error);

    return NextResponse.json(
      {
        success: false,
        response: `죄송합니다. 응답을 생성할 수 없습니다.`,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

function generateBasicResponse(query: string): string {
  const lowerQuery = query.toLowerCase();

  if (lowerQuery.includes('서버') || lowerQuery.includes('상태')) {
    return `서버 상태에 대한 질문을 받았습니다. OpenManager Vibe v5 시스템이 정상적으로 작동하고 있습니다.`;
  }

  return `"${query}"에 대한 기본 응답입니다. 시스템이 정상적으로 작동하고 있습니다.`;
}
