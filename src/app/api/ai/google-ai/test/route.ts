import { NextResponse } from 'next/server';

/**
 * 🧪 Google AI 연결 테스트 API
 *
 * POST /api/ai/google-ai/test
 * - Google AI Studio 연결 확인
 * - API 키 유효성 검증
 * - 간단한 쿼리 테스트
 */

export async function POST() {
  try {
    console.log('🧪 Google AI 연결 테스트 시작...');

    // 환경변수 확인
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    const enabled = process.env.GOOGLE_AI_ENABLED === 'true';

    if (!enabled) {
      return NextResponse.json(
        {
          success: false,
          error: 'Google AI가 비활성화되어 있습니다',
          status: 'disabled',
        },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'Google AI API 키가 설정되지 않았습니다',
          status: 'no_api_key',
        },
        { status: 400 }
      );
    }

    // Google AI Studio API 테스트 호출
    try {
      const testModel = 'gemini-1.5-flash';
      const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/${testModel}:generateContent?key=${apiKey}`;

      const testPayload = {
        contents: [
          {
            parts: [
              {
                text: "테스트 연결입니다. '연결 성공'이라고 한 단어로만 답해주세요.",
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 10,
          temperature: 0,
        },
      };

      console.log('📡 Google AI API 테스트 요청 전송...');

      const response = await fetch(testUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload),
        signal: AbortSignal.timeout(10000), // 10초 타임아웃
      });

      if (response.ok) {
        const data = await response.json();
        const responseText =
          data.candidates?.[0]?.content?.parts?.[0]?.text || '응답 없음';

        console.log('✅ Google AI 연결 테스트 성공:', responseText);

        return NextResponse.json({
          success: true,
          message: 'Google AI 연결이 성공적으로 확인되었습니다',
          status: 'connected',
          testResponse: responseText,
          model: testModel,
          timestamp: new Date().toISOString(),
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error(
          '❌ Google AI API 응답 오류:',
          response.status,
          errorData
        );

        return NextResponse.json(
          {
            success: false,
            error: `Google AI API 오류: ${response.status}`,
            status: 'api_error',
            details: errorData.error?.message || 'Unknown API error',
          },
          { status: 400 }
        );
      }
    } catch (apiError) {
      console.error('❌ Google AI API 호출 중 오류:', apiError);

      return NextResponse.json(
        {
          success: false,
          error: 'Google AI API 호출 실패',
          status: 'connection_failed',
          details:
            apiError instanceof Error ? apiError.message : 'Network error',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Google AI 연결 테스트 중 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: '연결 테스트 중 오류가 발생했습니다',
        status: 'test_failed',
      },
      { status: 500 }
    );
  }
}

/**
 * 🔍 Google AI 테스트 상태 조회
 */
export async function GET() {
  try {
    const status = {
      apiKeyConfigured: !!process.env.GOOGLE_AI_API_KEY,
      enabled: process.env.GOOGLE_AI_ENABLED === 'true',
      model: process.env.GOOGLE_AI_MODEL || 'gemini-1.5-flash',
      quotaProtection: process.env.GOOGLE_AI_QUOTA_PROTECTION !== 'false',
      lastTest: null, // 실제 구현에서는 Redis나 DB에서 조회
    };

    return NextResponse.json({
      success: true,
      status,
      available: status.apiKeyConfigured && status.enabled,
    });
  } catch (error) {
    console.error('❌ Google AI 테스트 상태 조회 중 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: '테스트 상태 조회 중 오류가 발생했습니다',
      },
      { status: 500 }
    );
  }
}
