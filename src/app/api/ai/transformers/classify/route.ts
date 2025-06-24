/**
 * 🤖 Transformers 엔진 텍스트 분류 API
 * OpenManager Vibe v5 - 안정화된 Transformers 분류 엔드포인트
 */

import { transformersEngine } from '@/services/ai/transformers-engine';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🤖 Transformers 분류 API 호출됨');

    const body = await request.json();
    const { text, options = {} } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        {
          error: 'text 파라미터가 필요합니다',
          success: false,
        },
        { status: 400 }
      );
    }

    // Transformers 엔진 초기화 확인
    await transformersEngine.initialize();

    // 텍스트 분류 수행
    const result = await transformersEngine.classifyText(text);

    // 엔진 상태 정보 포함
    const engineStatus = transformersEngine.getEngineStatus();

    return NextResponse.json({
      success: true,
      result,
      engineStatus: {
        isInitialized: engineStatus.isInitialized,
        transformersAvailable: engineStatus.transformersAvailable,
        usingFallback: result.usingFallback || false,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        textLength: text.length,
        options,
      },
    });
  } catch (error: any) {
    console.error('❌ Transformers 분류 API 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Transformers 분류 처리 실패',
        usingFallback: true,
        fallbackResult: {
          label: 'NEUTRAL',
          score: 0.5,
          interpreted: {
            severity: 'info',
            category: 'general',
            action: 'monitor',
          },
        },
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Transformers 엔진 상태 조회
    const engineStatus = transformersEngine.getEngineStatus();

    return NextResponse.json({
      success: true,
      status: 'Transformers 분류 API 정상 작동',
      engineStatus,
      availableEndpoints: {
        POST: '/api/ai/transformers/classify - 텍스트 분류 수행',
        GET: '/api/ai/transformers/classify - 엔진 상태 조회',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || '엔진 상태 조회 실패',
      },
      { status: 500 }
    );
  }
}
