/**
 * 📊 Google AI Studio 상태 조회 API - 안전한 버전
 */

import { NextRequest, NextResponse } from 'next/server';

// 안전한 import 처리
let GoogleAIService: any = null;
let getGoogleAIKey: any = null;
let isGoogleAIAvailable: any = null;
let getGoogleAIStatus: any = null;

try {
  const googleAIModule = require('@/services/ai/GoogleAIService');
  GoogleAIService = googleAIModule.GoogleAIService;
} catch (error) {
  console.warn('GoogleAIService import 실패:', error.message);
}

try {
  const googleAIManagerModule = require('@/lib/google-ai-manager');
  getGoogleAIKey = googleAIManagerModule.getGoogleAIKey;
  isGoogleAIAvailable = googleAIManagerModule.isGoogleAIAvailable;
  getGoogleAIStatus = googleAIManagerModule.getGoogleAIStatus;
} catch (error) {
  console.warn('google-ai-manager import 실패:', error.message);
}

export async function GET() {
  try {
    const startTime = Date.now();

    // 🚨 Vercel 500 에러 방지: 환경변수 먼저 검증
    console.log('🔍 환경변수 상태 확인:', {
      GOOGLE_AI_API_KEY: !!process.env.GOOGLE_AI_API_KEY,
      GOOGLE_AI_ENABLED: process.env.GOOGLE_AI_ENABLED,
      NODE_ENV: process.env.NODE_ENV,
    });

    // 1. API 키 상태 확인 (안전한 방식)
    let apiKey: string | null = null;
    let isAvailable = false;
    let keyStatus: any = { source: 'none', isAvailable: false, needsUnlock: false };

    if (getGoogleAIKey && isGoogleAIAvailable && getGoogleAIStatus) {
      try {
        apiKey = getGoogleAIKey();
        isAvailable = isGoogleAIAvailable();
        keyStatus = getGoogleAIStatus();
      } catch (keyError) {
        console.error('❌ API 키 확인 중 오류:', keyError);
        // 환경변수에서 직접 확인
        apiKey = process.env.GOOGLE_AI_API_KEY || null;
        isAvailable = !!apiKey;
        keyStatus = {
          source: apiKey ? 'environment' : 'none',
          isAvailable: !!apiKey,
          needsUnlock: false
        };
      }
    } else {
      // 모듈 로드 실패 시 환경변수에서 직접 확인
      apiKey = process.env.GOOGLE_AI_API_KEY || null;
      isAvailable = !!apiKey;
      keyStatus = {
        source: apiKey ? 'environment' : 'none',
        isAvailable: !!apiKey,
        needsUnlock: false
      };
    }

    // 2. Google AI 서비스 초기화 및 상태 확인 (안전한 방식)
    let googleAI: any = null;
    let initResult = false;
    let serviceStatus: any = { error: 'Service not initialized' };

    if (GoogleAIService && apiKey) {
      try {
        googleAI = new GoogleAIService();
        initResult = await googleAI.initialize();
        serviceStatus = googleAI.getStatus();
      } catch (serviceError) {
        console.error('❌ Google AI 서비스 초기화 중 오류:', serviceError);
        serviceStatus = {
          error: serviceError.message,
          fallback: true,
          model: 'gemini-1.5-flash',
          enabled: !!apiKey
        };
      }
    } else {
      serviceStatus = {
        error: 'GoogleAIService 모듈 또는 API 키 없음',
        fallback: true,
        model: 'gemini-1.5-flash',
        enabled: !!apiKey
      };
    }

    // 3. 연결 테스트 (안전한 방식)
    let connectionTest = null;
    if (initResult && apiKey && googleAI) {
      try {
        connectionTest = await googleAI.testConnection();
      } catch (error) {
        console.error('❌ 연결 테스트 중 오류:', error);
        connectionTest = {
          success: false,
          message: `연결 테스트 실패: ${error.message}`,
        };
      }
    } else {
      connectionTest = {
        success: false,
        message: '연결 테스트 조건 미충족 (초기화 실패 또는 API 키 없음)',
        fallback: true
      };
    }

    // 4. 환경변수 상태 확인
    const envStatus = {
      GOOGLE_AI_API_KEY: !!process.env.GOOGLE_AI_API_KEY,
      GOOGLE_AI_ENABLED: process.env.GOOGLE_AI_ENABLED,
      GOOGLE_AI_BETA_MODE: process.env.GOOGLE_AI_BETA_MODE,
      GOOGLE_AI_DAILY_LIMIT: process.env.GOOGLE_AI_DAILY_LIMIT,
      GOOGLE_AI_RPM_LIMIT: process.env.GOOGLE_AI_RPM_LIMIT,
      GOOGLE_AI_QUOTA_PROTECTION: process.env.GOOGLE_AI_QUOTA_PROTECTION,
    };

    const processingTime = Date.now() - startTime;

    // 5. 전체 상태 평가
    const overallStatus = {
      isReady: initResult && isAvailable && apiKey,
      hasAPIKey: !!apiKey,
      serviceInitialized: initResult,
      connectionWorking: connectionTest?.success || false,
      quotaProtectionDisabled: process.env.GOOGLE_AI_QUOTA_PROTECTION === 'false',
      fallbackMode: !GoogleAIService || !getGoogleAIKey
    };

    return NextResponse.json({
      success: true,
      data: {
        // 🚀 시연용 상태 정보
        demo: {
          ready: overallStatus.isReady,
          message: overallStatus.isReady
            ? '✅ Google AI 시연 준비 완료!'
            : overallStatus.fallbackMode
              ? '⚠️ Google AI 폴백 모드 (모듈 로드 실패)'
              : '⚠️ Google AI 설정 필요',
          timestamp: new Date().toISOString(),
        },

        // API 키 정보
        apiKey: {
          available: isAvailable,
          source: keyStatus.source,
          needsUnlock: keyStatus.needsUnlock,
          masked: apiKey ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}` : null,
        },

        // 서비스 상태
        service: {
          initialized: initResult,
          status: serviceStatus,
          connectionTest,
        },

        // 환경변수 상태
        environment: envStatus,

        // 전체 평가
        overall: overallStatus,

        // 시스템 정보
        system: {
          processingTime: `${processingTime}ms`,
          version: 'v5.43.5',
          mode: 'DEMO_PRESENTATION',
          timestamp: new Date().toISOString(),
        },
      },
    });

  } catch (error) {
    console.error('❌ [Google AI Status] 상태 확인 실패:', error);

    // 500 오류 대신 200으로 응답하되 오류 정보 포함
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Google AI 상태 확인에 실패했습니다',
          details: error.message,
          code: 'GOOGLE_AI_STATUS_ERROR',
          timestamp: new Date().toISOString(),
        },
        // 🚀 시연용 폴백 정보
        fallback: {
          message: '시연용 폴백 모드로 동작 중',
          hasEnvironmentKey: !!process.env.GOOGLE_AI_API_KEY,
          recommendedAction: '환경변수 설정 또는 팀 키 잠금 해제 필요',
          demo: {
            ready: false,
            message: '⚠️ Google AI 오류 상태 - 폴백 모드',
            timestamp: new Date().toISOString(),
          }
        },
      },
      { status: 200 } // 500 대신 200으로 변경
    );
  }
}

/**
 * 🧪 Google AI 연결 테스트 (POST) - 안전한 버전
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { testQuery = 'Hello from OpenManager Vibe v5 시연!' } = body;

    if (!GoogleAIService) {
      return NextResponse.json({
        success: false,
        error: 'GoogleAIService 모듈을 로드할 수 없습니다',
        fallback: {
          message: '시연용 모의 응답 모드',
          content: 'OpenManager Vibe v5 시연을 위한 서버 모니터링 AI 분석 시스템입니다. 실시간 서버 상태 모니터링, 이상 탐지, 예측 분석 등의 기능을 제공합니다.',
          confidence: 0.95,
          model: 'gemini-1.5-flash',
          cached: false,
        },
      }, { status: 200 });
    }

    const googleAI = new GoogleAIService();
    const initResult = await googleAI.initialize();

    if (!initResult) {
      return NextResponse.json({
        success: false,
        error: 'Google AI 서비스 초기화 실패',
        fallback: {
          message: '시연용 모의 응답 모드',
          content: 'OpenManager Vibe v5 시연을 위한 서버 모니터링 AI 분석 시스템입니다. 실시간 서버 상태 모니터링, 이상 탐지, 예측 분석 등의 기능을 제공합니다.',
          confidence: 0.95,
          model: 'gemini-1.5-flash',
          cached: false,
        },
      }, { status: 200 });
    }

    // 실제 AI 질의 테스트
    const startTime = Date.now();
    const response = await googleAI.generateContent(testQuery, { skipCache: true });
    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        query: testQuery,
        response,
        processingTime: `${processingTime}ms`,
        timestamp: new Date().toISOString(),
        demo: {
          message: '🚀 Google AI 실제 응답 테스트 성공!',
          ready: true,
        },
      },
    });

  } catch (error) {
    console.error('❌ [Google AI Test] 연결 테스트 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Google AI 연결 테스트 실패',
          details: error.message,
          code: 'GOOGLE_AI_TEST_ERROR',
        },
        // 🚀 시연용 모의 응답
        fallback: {
          message: '시연용 모의 응답 모드',
          content: 'OpenManager Vibe v5 시연을 위한 서버 모니터링 AI 분석 시스템입니다. 실시간 서버 상태 모니터링, 이상 탐지, 예측 분석 등의 기능을 제공합니다.',
          confidence: 0.95,
          model: 'gemini-1.5-flash',
          cached: false,
        },
      },
      { status: 200 } // 시연용으로 200 반환
    );
  }
}
