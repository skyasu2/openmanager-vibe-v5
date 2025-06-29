import { NextRequest, NextResponse } from 'next/server';

/**
 * 🚧 개발 어시스턴트 API (임시 비활성화)
 *
 * 이 엔드포인트는 구버전 AI 엔진 제거로 인해 임시 비활성화되었습니다.
 * 향후 새로운 UnifiedAIEngineRouter 기반으로 재구현 예정입니다.
 */
export async function POST(request: NextRequest) {
  try {
    return NextResponse.json(
      {
        success: false,
        message:
          '개발 어시스턴트 기능은 현재 업데이트 중입니다. 곧 새로운 버전으로 제공될 예정입니다.',
        status: 'maintenance',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Service temporarily unavailable',
      },
      { status: 503 }
    );
  }
}
