/**
 * 📊 Google AI Studio 상태 조회 API - 할당량 보호 적용
 */

import { GoogleAIQuotaManager } from '@/services/ai/engines/GoogleAIQuotaManager';
import { NextResponse } from 'next/server';

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
  const startTime = Date.now();

  try {
    console.log('🤖 Google AI 상태 확인 시작...');

    // 🎯 세션 기반 헬스체크 캐싱 (시스템 시작 시 한 번만)
    const sessionCacheKey = 'google-ai-health-check-session';

    // 헤더에서 세션 캐시 확인
    if (typeof window !== 'undefined') {
      try {
        const cachedHealth = sessionStorage.getItem(sessionCacheKey);
        if (cachedHealth) {
          const cached = JSON.parse(cachedHealth);
          const cacheAge = Date.now() - cached.timestamp;

          // 세션 캐시가 30분 이내면 재사용
          if (cacheAge < 30 * 60 * 1000) {
            console.log('📦 Google AI 헬스체크 세션 캐시 사용');
            return NextResponse.json({
              ...cached.data,
              cached: true,
              cacheAge: Math.round(cacheAge / 1000),
            });
          }
        }
      } catch (error) {
        console.warn('⚠️ Google AI 세션 캐시 확인 실패:', error);
      }
    }

    // 1. 환경변수 확인
    const apiKey = getGoogleAIKey();
    const isEnabled = process.env.GOOGLE_AI_ENABLED === 'true';
    const quotaProtection = process.env.GOOGLE_AI_QUOTA_PROTECTION === 'true';

    console.log('🔑 Google AI 설정:', {
      enabled: isEnabled,
      hasApiKey: !!apiKey,
      quotaProtection,
    });

    // 2. 할당량 매니저 초기화
    const quotaManager = new GoogleAIQuotaManager();
    const quotaStatus = await quotaManager.getQuotaStatus();

    // 3. 헬스체크 권한 확인 (24시간 캐싱 적용)
    const healthCheckPermission = await quotaManager.canPerformHealthCheck();

    // 4. Google AI 서비스 초기화
    let googleAI = null;
    let initResult = null;
    let serviceStatus = null;

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
          enabled: !!apiKey,
        };
      }
    } else {
      serviceStatus = {
        error: 'GoogleAIService 모듈 또는 API 키 없음',
        fallback: true,
        model: 'gemini-1.5-flash',
        enabled: !!apiKey,
      };
    }

    // 5. 연결 테스트 (헬스체크 캐싱 적용)
    let connectionTest = null;

    if (healthCheckPermission.cached) {
      // 캐시된 헬스체크 결과 사용
      console.log('📦 헬스체크 캐시 사용:', healthCheckPermission.reason);
      connectionTest = {
        success: true,
        message: '연결 상태 양호 (캐시됨)',
        cached: true,
        cacheReason: healthCheckPermission.reason,
        lastCheck: new Date(quotaStatus.lastHealthCheck).toISOString(),
      };
    } else if (!healthCheckPermission.allowed) {
      // 할당량 제한으로 헬스체크 불가
      console.warn('🚫 헬스체크 제한:', healthCheckPermission.reason);
      connectionTest = {
        success: false,
        message: healthCheckPermission.reason,
        quotaLimited: true,
        circuitBreakerActive: quotaStatus.isBlocked,
      };
    } else if (quotaManager.shouldUseMockMode()) {
      // Mock 모드 응답
      console.log('🎭 Mock 모드 헬스체크');
      connectionTest = {
        success: true,
        message: '연결 상태 양호 (Mock 모드)',
        mockMode: true,
      };
      await quotaManager.recordHealthCheckSuccess();
    } else if (initResult && apiKey && googleAI) {
      // 실제 연결 테스트 수행 (시스템 시작 시에만)
      try {
        console.log('🔍 실제 헬스체크 수행 (시스템 시작 시)');
        connectionTest = await googleAI.testConnection();

        if (connectionTest?.success) {
          await quotaManager.recordHealthCheckSuccess();
        } else {
          await quotaManager.recordAPIFailure();
        }
      } catch (error) {
        console.error('❌ 연결 테스트 중 오류:', error);
        await quotaManager.recordAPIFailure();
        connectionTest = {
          success: false,
          message: `연결 테스트 실패: ${error.message}`,
        };
      }
    } else {
      connectionTest = {
        success: false,
        message: '연결 테스트 조건 미충족 (초기화 실패 또는 API 키 없음)',
        fallback: true,
      };
    }

    const responseData = {
      success: true,
      enabled: isEnabled && !!apiKey,
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,

      // API 키 정보
      apiKey: {
        configured: !!apiKey,
        source: apiKey ? getGoogleAIKey() : 'none',
        length: apiKey ? apiKey.length : 0,
      },

      // 서비스 상태
      service: serviceStatus,

      // 연결 테스트 결과
      connectionTest,

      // 할당량 상태
      quota: {
        enabled: quotaProtection,
        status: quotaStatus,
        healthCheckCached: healthCheckPermission.cached,
      },

      // 환경변수 상태
      environment: {
        GOOGLE_AI_ENABLED: process.env.GOOGLE_AI_ENABLED,
        GOOGLE_AI_QUOTA_PROTECTION: process.env.GOOGLE_AI_QUOTA_PROTECTION,
        NODE_ENV: process.env.NODE_ENV,
      },

      // 시연용 정보
      demo: {
        ready: !!(isEnabled && apiKey && connectionTest?.success),
        message:
          isEnabled && apiKey && connectionTest?.success
            ? '✅ Google AI 시연 준비 완료!'
            : '⚠️ Google AI 설정 필요',
      },
    };

    // 세션 캐시에 저장 (시스템 시작 시 한 번만 체크)
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(
          sessionCacheKey,
          JSON.stringify({
            data: responseData,
            timestamp: Date.now(),
          })
        );
        console.log('💾 Google AI 헬스체크 세션 캐시에 저장');
      } catch (error) {
        console.warn('⚠️ Google AI 세션 캐시 저장 실패:', error);
      }
    }

    console.log('✅ Google AI 상태 확인 완료:', {
      enabled: responseData.enabled,
      connectionSuccess: connectionTest?.success,
      cached: healthCheckPermission.cached,
    });

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('❌ Google AI 상태 확인 중 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        enabled: false,
      },
      { status: 500 }
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
      return NextResponse.json(
        {
          success: false,
          error: 'GoogleAIService 모듈을 로드할 수 없습니다',
          fallback: {
            message: '시연용 모의 응답 모드',
            content:
              'OpenManager Vibe v5 시연을 위한 서버 모니터링 AI 분석 시스템입니다. 실시간 서버 상태 모니터링, 이상 탐지, 예측 분석 등의 기능을 제공합니다.',
            confidence: 0.95,
            model: 'gemini-1.5-flash',
            cached: false,
          },
        },
        { status: 200 }
      );
    }

    const googleAI = new GoogleAIService();
    const initResult = await googleAI.initialize();

    if (!initResult) {
      return NextResponse.json(
        {
          success: false,
          error: 'Google AI 서비스 초기화 실패',
          fallback: {
            message: '시연용 모의 응답 모드',
            content:
              'OpenManager Vibe v5 시연을 위한 서버 모니터링 AI 분석 시스템입니다. 실시간 서버 상태 모니터링, 이상 탐지, 예측 분석 등의 기능을 제공합니다.',
            confidence: 0.95,
            model: 'gemini-1.5-flash',
            cached: false,
          },
        },
        { status: 200 }
      );
    }

    // 실제 AI 질의 테스트
    const startTime = Date.now();
    const response = await googleAI.generateContent(testQuery, {
      skipCache: true,
    });
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
          content:
            'OpenManager Vibe v5 시연을 위한 서버 모니터링 AI 분석 시스템입니다. 실시간 서버 상태 모니터링, 이상 탐지, 예측 분석 등의 기능을 제공합니다.',
          confidence: 0.95,
          model: 'gemini-1.5-flash',
          cached: false,
        },
      },
      { status: 200 } // 시연용으로 200 반환
    );
  }
}
