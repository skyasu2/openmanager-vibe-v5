/**
 * 🤖 Google AI Studio 설정 API
 *
 * GET: 현재 설정 조회
 * POST: 설정 업데이트
 */

import { NextRequest, NextResponse } from 'next/server';
import { authManager } from '@/lib/auth';

// 임시 설정 저장소 (실제로는 데이터베이스 사용)
let googleAIConfig = {
  enabled: false,
  apiKey: '',
  model: 'gemini-1.5-flash' as 'gemini-1.5-flash' | 'gemini-1.5-pro',
};

export async function GET(request: NextRequest) {
  try {
    // 🔐 관리자 권한 확인
    const sessionId =
      request.headers.get('x-session-id') ||
      request.cookies.get('admin-session')?.value;

    if (!sessionId || !authManager.hasPermission(sessionId, 'system:admin')) {
      return NextResponse.json(
        {
          success: false,
          error: '관리자 권한이 필요합니다.',
        },
        { status: 403 }
      );
    }

    const googleAIConfig = {
      enabled: process.env.GOOGLE_AI_BETA_MODE === 'true',
      model: process.env.GOOGLE_AI_MODEL || 'gemini-1.5-flash',
      apiKey: process.env.GOOGLE_AI_API_KEY || '',
    };

    // 🔐 보안: API 키는 마스킹 처리하여 반환 (존재 여부만 표시)
    const safeConfig = {
      ...googleAIConfig,
      apiKey: googleAIConfig.apiKey
        ? '••••••••' + googleAIConfig.apiKey.slice(-4)
        : '',
      hasApiKey: !!googleAIConfig.apiKey, // API 키 존재 여부만 표시
    };

    return NextResponse.json({
      success: true,
      ...safeConfig,
    });
  } catch (error) {
    console.error('Google AI 설정 조회 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: '설정 조회 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 🔐 관리자 권한 확인
    const sessionId =
      request.headers.get('x-session-id') ||
      request.cookies.get('admin-session')?.value;

    if (!sessionId || !authManager.hasPermission(sessionId, 'system:admin')) {
      return NextResponse.json(
        {
          success: false,
          error: '관리자 권한이 필요합니다.',
        },
        { status: 403 }
      );
    }

    const { enabled, model, apiKey } = await request.json();

    // 환경 변수 업데이트 (런타임)
    if (typeof enabled === 'boolean') {
      process.env.GOOGLE_AI_BETA_MODE = enabled.toString();
    }

    if (model) {
      process.env.GOOGLE_AI_MODEL = model;
    }

    // 🔐 보안: API 키가 제공된 경우에만 업데이트
    if (apiKey && apiKey.trim() && !apiKey.includes('••••••••')) {
      process.env.GOOGLE_AI_API_KEY = apiKey.trim();
      console.log(
        '🔐 Google AI API 키가 업데이트되었습니다 (마지막 4자리: ****' +
          apiKey.slice(-4) +
          ')'
      );
    }

    console.log('📝 Google AI 설정 업데이트:', {
      enabled,
      model,
      apiKeyLength: apiKey?.length || 0,
      apiKeyUpdated: !!(
        apiKey &&
        apiKey.trim() &&
        !apiKey.includes('••••••••')
      ),
    });

    return NextResponse.json({
      success: true,
      message: 'Google AI 설정이 저장되었습니다.',
      config: {
        enabled,
        model,
        apiKey:
          apiKey && apiKey.trim() && !apiKey.includes('••••••••')
            ? '••••••••' + apiKey.slice(-4)
            : process.env.GOOGLE_AI_API_KEY
              ? '••••••••' + process.env.GOOGLE_AI_API_KEY.slice(-4)
              : '',
        hasApiKey: !!process.env.GOOGLE_AI_API_KEY,
      },
    });
  } catch (error) {
    console.error('Google AI 설정 저장 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: '설정 저장 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

// 현재 설정 상태를 다른 모듈에서 접근할 수 있도록 export
export function getCurrentGoogleAIConfig() {
  return { ...googleAIConfig };
}
