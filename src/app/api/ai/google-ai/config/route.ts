/**
 * 🤖 Google AI Studio 설정 API
 *
 * GET: 현재 설정 조회
 * POST: 설정 업데이트
 */

import { NextRequest, NextResponse } from 'next/server';

// 임시 설정 저장소 (실제로는 데이터베이스 사용)
let googleAIConfig = {
  enabled: false,
  apiKey: '',
  model: 'gemini-1.5-flash' as 'gemini-1.5-flash' | 'gemini-1.5-pro',
};

export async function GET() {
  try {
    // 보안상 API 키는 마스킹해서 반환
    const safeConfig = {
      ...googleAIConfig,
      apiKey: googleAIConfig.apiKey
        ? '••••••••' + googleAIConfig.apiKey.slice(-4)
        : '',
    };

    return NextResponse.json(safeConfig);
  } catch (error) {
    console.error('Google AI 설정 조회 실패:', error);
    return NextResponse.json(
      { error: '설정 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { enabled, apiKey, model } = body;

    // 설정 검증
    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'enabled는 boolean 타입이어야 합니다.' },
        { status: 400 }
      );
    }

    if (enabled && (!apiKey || !apiKey.startsWith('AIza'))) {
      return NextResponse.json(
        { error: '유효한 Google AI Studio API 키를 입력해주세요.' },
        { status: 400 }
      );
    }

    if (model && !['gemini-1.5-flash', 'gemini-1.5-pro'].includes(model)) {
      return NextResponse.json(
        { error: '지원하지 않는 모델입니다.' },
        { status: 400 }
      );
    }

    // 설정 업데이트
    googleAIConfig = {
      enabled,
      apiKey: apiKey || googleAIConfig.apiKey,
      model: model || googleAIConfig.model,
    };

    // 환경변수 업데이트 (런타임)
    if (enabled && apiKey) {
      process.env.GOOGLE_AI_API_KEY = apiKey;
      process.env.GOOGLE_AI_MODEL = model;
      process.env.GOOGLE_AI_ENABLED = 'true';
      process.env.GOOGLE_AI_BETA_MODE = 'true';
    } else {
      process.env.GOOGLE_AI_ENABLED = 'false';
      process.env.GOOGLE_AI_BETA_MODE = 'false';
    }

    console.log('🤖 Google AI 설정 업데이트:', {
      enabled,
      model,
      apiKeyLength: apiKey?.length || 0,
    });

    return NextResponse.json({
      success: true,
      message: '설정이 성공적으로 저장되었습니다.',
      config: {
        enabled,
        model,
        apiKey: apiKey ? '••••••••' + apiKey.slice(-4) : '',
      },
    });
  } catch (error) {
    console.error('Google AI 설정 저장 실패:', error);
    return NextResponse.json(
      { error: '설정 저장에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 현재 설정 상태를 다른 모듈에서 접근할 수 있도록 export
export function getCurrentGoogleAIConfig() {
  return { ...googleAIConfig };
}
