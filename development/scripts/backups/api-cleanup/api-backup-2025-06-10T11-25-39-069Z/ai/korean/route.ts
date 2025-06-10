import { NextRequest, NextResponse } from 'next/server';
import { koreanAIEngine } from '@/services/ai/korean-ai-engine';

export async function POST(request: NextRequest) {
  try {
    const { query, serverData } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { success: false, error: '쿼리가 필요합니다.' },
        { status: 400 }
      );
    }

    console.log('🇰🇷 한국어 AI 엔진 API 요청:', query);

    // 한국어 AI 엔진 처리
    const result = await koreanAIEngine.processQuery(query, serverData);

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('❌ 한국어 AI 엔진 API 에러:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || '알 수 없는 오류가 발생했습니다.',
        fallbackResponse:
          '죄송합니다. 처리 중 문제가 발생했습니다. 다시 시도해 주세요.',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // 한국어 AI 엔진 상태 확인
    const status = koreanAIEngine.getEngineStatus();

    return NextResponse.json({
      success: true,
      status,
      examples: [
        '웹서버 CPU 사용률 확인해줘',
        '메모리 사용량 분석해줘',
        '디스크 공간 상태 알려줘',
        '네트워크 상태 체크해줘',
        '전체 서버 상태 보여줘',
      ],
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('❌ 한국어 AI 엔진 상태 확인 에러:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || '상태 확인 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
