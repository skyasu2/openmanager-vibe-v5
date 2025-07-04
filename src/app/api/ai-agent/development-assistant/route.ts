import { NextRequest, NextResponse } from 'next/server';

/**
 * 🚧 개발 어시스턴트 API (임시 비활성화)
 *
 * 이 엔드포인트는 구버전 AI 엔진 제거로 인해 임시 비활성화되었습니다.
 * 향후 새로운 UnifiedAIEngineRouter 기반으로 재구현 예정입니다.
 */
export async function POST(request: NextRequest) {
  try {
    const { query, type } = await request.json();

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Query required' },
        { status: 400 }
      );
    }

    // 개발 지원 응답 생성
    const response = {
      assistance: `Development assistance for: ${query}`,
      type: type || 'code-help',
      suggestions: [
        'Check the documentation',
        'Review the code structure',
        'Test the implementation',
      ],
    };

    return NextResponse.json({
      success: true,
      data: response,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Development Assistant Error:', error);
    return NextResponse.json(
      { success: false, error: 'Processing error' },
      { status: 500 }
    );
  }
}
