import { NextResponse } from 'next/server';
import { GoogleAIQuotaManager } from '@/services/ai/engines/GoogleAIQuotaManager';

/**
 * 🧪 Google AI 연결 테스트 API (할당량 보호 적용)
 *
 * POST /api/ai/google-ai/test
 * - Google AI Studio 연결 확인
 * - API 키 유효성 검증
 * - 간단한 쿼리 테스트
 * - 일일 테스트 제한 적용 (기본 5회)
 */

export async function POST() {
  const quotaManager = new GoogleAIQuotaManager();

  try {
    console.log('🧪 Google AI 연결 테스트 시작...');

    // 1. 할당량 보호 확인
    const quotaCheck = await quotaManager.canPerformTest();
    if (!quotaCheck.allowed) {
      console.warn('🚫 Google AI 테스트 제한:', quotaCheck.reason);

      return NextResponse.json(
        {
          success: false,
          error: quotaCheck.reason,
          status: 'quota_exceeded',
          remaining: quotaCheck.remaining || 0,
          quotaProtection: true,
        },
        { status: 429 }
      );
    }

    // 2. Mock 모드 확인
    if (quotaManager.shouldUseMockMode()) {
      console.log('🎭 Mock 모드로 테스트 응답 제공');

      await quotaManager.recordTestUsage();

      return NextResponse.json({
        success: true,
        message: 'Google AI 연결 테스트 성공 (Mock 모드)',
        status: 'connected_mock',
        testResponse: '연결 성공',
        model: 'gemini-1.5-flash-mock',
        timestamp: new Date().toISOString(),
        mockMode: true,
        remaining: quotaCheck.remaining! - 1,
      });
    }

    // 3. 환경변수 확인
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

    // 4. Google AI Studio API 테스트 호출
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

        // 5. 성공 시 사용량 기록
        await quotaManager.recordTestUsage();

        return NextResponse.json({
          success: true,
          message: 'Google AI 연결이 성공적으로 확인되었습니다',
          status: 'connected',
          testResponse: responseText,
          model: testModel,
          timestamp: new Date().toISOString(),
          remaining: quotaCheck.remaining! - 1,
          quotaProtection: true,
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error(
          '❌ Google AI API 응답 오류:',
          response.status,
          errorData
        );

        // 6. 실패 시 실패 기록
        await quotaManager.recordAPIFailure();

        return NextResponse.json(
          {
            success: false,
            error: `Google AI API 오류: ${response.status}`,
            status: 'api_error',
            details: errorData.error?.message || 'Unknown API error',
            quotaProtection: true,
          },
          { status: 400 }
        );
      }
    } catch (apiError) {
      console.error('❌ Google AI API 호출 중 오류:', apiError);

      // 7. 네트워크 오류 시 실패 기록
      await quotaManager.recordAPIFailure();

      return NextResponse.json(
        {
          success: false,
          error: 'Google AI API 호출 실패',
          status: 'connection_failed',
          details:
            apiError instanceof Error ? apiError.message : 'Network error',
          quotaProtection: true,
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
 * 🔍 Google AI 테스트 상태 및 할당량 조회
 */
export async function GET() {
  try {
    const quotaManager = new GoogleAIQuotaManager();
    const quotaStatus = await quotaManager.getQuotaStatus();
    const testCheck = await quotaManager.canPerformTest();

    const status = {
      apiKeyConfigured: !!process.env.GOOGLE_AI_API_KEY,
      enabled: process.env.GOOGLE_AI_ENABLED === 'true',
      model: process.env.GOOGLE_AI_MODEL || 'gemini-1.5-flash',
      quotaProtection: process.env.GOOGLE_AI_QUOTA_PROTECTION !== 'false',
      mockMode: quotaManager.shouldUseMockMode(),

      // 할당량 정보
      quota: {
        testLimit: parseInt(process.env.GOOGLE_AI_TEST_LIMIT_PER_DAY || '5'),
        testUsed: quotaStatus.testUsed,
        testRemaining: testCheck.remaining || 0,
        canTest: testCheck.allowed,
        testRestriction: testCheck.reason,

        dailyLimit: parseInt(process.env.GOOGLE_AI_DAILY_LIMIT || '100'),
        dailyUsed: quotaStatus.dailyUsed,

        circuitBreakerActive: quotaStatus.isBlocked,
        lastHealthCheck: quotaStatus.lastHealthCheck,
      },
    };

    return NextResponse.json({
      success: true,
      status,
      available: status.apiKeyConfigured && status.enabled,
      quotaStatus,
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
