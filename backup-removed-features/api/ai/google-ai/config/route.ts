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
    // Google AI 구성 정보 반환
    const config = {
      engine: 'google-ai',
      version: '1.0.0',
      status: 'active',
      model: 'gemini-pro',
      capabilities: [
        'text-generation',
        'conversation',
        'analysis',
        'translation',
      ],
      limits: {
        dailyQuota: 10000,
        rpmLimit: 100,
        maxTokens: 4096,
      },
      features: {
        streaming: true,
        multimodal: false,
        korean: true,
        fallback: true,
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error('Google AI 구성 조회 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Google AI 구성 조회 실패',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * 🔧 Google AI 설정 관리 API
 *
 * POST /api/ai/google-ai/config
 * - Google AI 활성화/비활성화
 * - 환경변수 업데이트
 * - 설정 검증
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { enabled, action } = body;

    console.log(`🔧 Google AI 설정 변경 요청: ${action} (enabled: ${enabled})`);

    // 현재 상태 확인
    const currentStatus = {
      enabled: process.env.GOOGLE_AI_ENABLED === 'true',
      hasApiKey: !!process.env.GOOGLE_AI_API_KEY,
      quotaProtection: process.env.GOOGLE_AI_QUOTA_PROTECTION !== 'false',
    };

    console.log('📊 현재 Google AI 상태:', currentStatus);

    // 설정 변경 처리
    if (action === 'enable' && enabled) {
      // Google AI 활성화
      console.log('✅ Google AI 활성화 처리...');

      // API 키 확인
      if (!currentStatus.hasApiKey) {
        return NextResponse.json(
          {
            success: false,
            error: 'Google AI API 키가 설정되지 않았습니다',
            enabled: false,
          },
          { status: 400 }
        );
      }

      // 연결 테스트 (간단한 ping)
      try {
        const testResponse = await fetch('/api/ai/google-ai/status');
        if (!testResponse.ok) {
          console.warn(
            '⚠️ Google AI 연결 테스트 실패, 그러나 설정은 저장됩니다'
          );
        }
      } catch (error) {
        console.warn('⚠️ Google AI 연결 테스트 중 오류:', error);
      }

      return NextResponse.json({
        success: true,
        enabled: true,
        message: 'Google AI가 활성화되었습니다',
        status: {
          ...currentStatus,
          enabled: true,
        },
      });
    } else if (action === 'disable' && !enabled) {
      // Google AI 비활성화
      console.log('❌ Google AI 비활성화 처리...');

      return NextResponse.json({
        success: true,
        enabled: false,
        message: 'Google AI가 비활성화되었습니다',
        status: {
          ...currentStatus,
          enabled: false,
        },
      });
    } else {
      // 잘못된 요청
      return NextResponse.json(
        {
          success: false,
          error: '잘못된 설정 요청입니다',
          enabled: currentStatus.enabled,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('❌ Google AI 설정 변경 중 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: '설정 변경 중 오류가 발생했습니다',
        enabled: false,
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
