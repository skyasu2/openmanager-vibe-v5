/**
 * 🚀 시스템 시작 API
 *
 * 시스템 초기화 엔드포인트를 호출하여 시스템을 시작합니다
 */

import { type NextRequest, NextResponse } from 'next/server';
import { systemLogger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    systemLogger.info('🚀 시스템 시작 API 호출됨');

    // 내부적으로 initialize 엔드포인트 호출
    const baseUrl =
      request.headers.get('origin') || `https://${request.headers.get('host')}`;
    const initResponse = await fetch(`${baseUrl}/api/system/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!initResponse.ok) {
      const errorText = await initResponse.text();
      systemLogger.error('❌ 시스템 초기화 실패:', errorText);

      return NextResponse.json(
        {
          success: false,
          message: '시스템 초기화 실패',
          error: errorText,
        },
        { status: initResponse.status }
      );
    }

    const initResult = await initResponse.json();

    return NextResponse.json({
      success: true,
      message: '시스템 시작 성공',
      data: initResult,
    });
  } catch (error) {
    systemLogger.error('❌ 시스템 시작 API 오류:', error);

    return NextResponse.json(
      {
        success: false,
        message: '시스템 시작 실패',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// OPTIONS 메소드 지원 (CORS)
export function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, { status: 200 });
}
