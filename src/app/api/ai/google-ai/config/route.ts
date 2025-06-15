/**
 * 🤖 Google AI Studio 설정 API
 *
 * GET: 현재 설정 조회
 * POST: 설정 업데이트
 */

import { NextRequest, NextResponse } from 'next/server';
import { authManager } from '@/lib/auth';
import { EncryptedEnvManager, validateGoogleAIKey } from '@/utils/encryption';

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

    const envManager = EncryptedEnvManager.getInstance();

    // 현재 설정된 키 정보 (키 자체는 노출하지 않음)
    const hasKey = !!envManager.getGoogleAIKey();
    const keyList = envManager.listKeys();

    return NextResponse.json({
      success: true,
      hasGoogleAIKey: hasKey,
      encryptedKeysCount: keyList.length,
      availableKeys: keyList,
      status: hasKey ? 'configured' : 'not_configured',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Google AI 키 상태 확인 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'API 키 상태 확인 중 오류 발생',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { apiKey, action } = await request.json();
    const envManager = EncryptedEnvManager.getInstance();

    switch (action) {
      case 'set':
        if (!apiKey) {
          return NextResponse.json(
            {
              success: false,
              error: 'API 키가 필요합니다',
            },
            { status: 400 }
          );
        }

        // API 키 유효성 검증
        if (!validateGoogleAIKey(apiKey)) {
          return NextResponse.json(
            {
              success: false,
              error: 'Google AI API 키 형식이 올바르지 않습니다',
              details: 'AIza로 시작하는 39자리 키여야 합니다',
            },
            { status: 400 }
          );
        }

        // 실제 Google AI API 연결 테스트
        const testResult = await testGoogleAIConnection(apiKey);
        if (!testResult.success) {
          return NextResponse.json(
            {
              success: false,
              error: 'Google AI API 연결 테스트 실패',
              details: testResult.error,
              statusCode: testResult.statusCode,
            },
            { status: 400 }
          );
        }

        // 암호화하여 저장
        envManager.setGoogleAIKey(apiKey);

        return NextResponse.json({
          success: true,
          message: 'Google AI API 키가 성공적으로 설정되었습니다',
          connectionTest: testResult,
          timestamp: new Date().toISOString(),
        });

      case 'test':
        const currentKey = envManager.getGoogleAIKey();
        if (!currentKey) {
          return NextResponse.json(
            {
              success: false,
              error: '설정된 API 키가 없습니다',
            },
            { status: 400 }
          );
        }

        const connectionTest = await testGoogleAIConnection(currentKey);

        return NextResponse.json({
          success: connectionTest.success,
          connectionTest,
          timestamp: new Date().toISOString(),
        });

      case 'delete':
        const deleted = envManager.deleteKey('GOOGLE_AI_API_KEY');

        return NextResponse.json({
          success: deleted,
          message: deleted
            ? 'API 키가 삭제되었습니다'
            : 'API 키를 찾을 수 없습니다',
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: '지원하지 않는 액션입니다',
            supportedActions: ['set', 'test', 'delete'],
          },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Google AI 키 관리 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'API 키 관리 중 오류 발생',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * Google AI API 연결 테스트
 */
async function testGoogleAIConnection(apiKey: string): Promise<{
  success: boolean;
  responseTime: number;
  model?: string;
  error?: string;
  statusCode?: number;
}> {
  const startTime = Date.now();

  try {
    // 1. 모델 목록 가져오기 (가장 간단한 테스트)
    const modelsResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'OpenManager-Vibe/5.43.5',
        },
      }
    );

    const responseTime = Date.now() - startTime;

    if (!modelsResponse.ok) {
      const errorText = await modelsResponse.text();
      console.error(
        `Google AI API 테스트 실패 ${modelsResponse.status}:`,
        errorText
      );

      return {
        success: false,
        responseTime,
        error: `HTTP ${modelsResponse.status}: ${errorText}`,
        statusCode: modelsResponse.status,
      };
    }

    const modelsData = await modelsResponse.json();
    const availableModels = modelsData.models?.length || 0;

    // 2. 간단한 텍스트 생성 테스트
    const testResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'OpenManager-Vibe/5.43.5',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: '안녕하세요' }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 50,
          },
        }),
      }
    );

    if (testResponse.ok) {
      const testData = await testResponse.json();
      const generatedText = testData.candidates?.[0]?.content?.parts?.[0]?.text;

      return {
        success: true,
        responseTime: Date.now() - startTime,
        model: 'gemini-1.5-flash',
        error: undefined,
      };
    } else {
      return {
        success: true, // 모델 목록은 성공했으므로 키는 유효
        responseTime,
        model: `${availableModels}개 모델 사용 가능`,
        error: '텍스트 생성 테스트는 실패했지만 키는 유효함',
      };
    }
  } catch (error: any) {
    const responseTime = Date.now() - startTime;

    return {
      success: false,
      responseTime,
      error: error.message,
      statusCode: 0,
    };
  }
}

// 현재 설정 상태를 다른 모듈에서 접근할 수 있도록 export
export function getCurrentGoogleAIConfig() {
  return { ...googleAIConfig };
}
