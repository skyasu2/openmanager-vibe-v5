/**
 * 🧠 Smart Fallback Engine API (Ultra Simple 통합)
 * POST /api/ai/smart-fallback
 * GET /api/ai/smart-fallback (상태 조회)
 *
 * 🎯 핵심 기능:
 * 1. 자연어 질의 응답 1순위
 * 2. 스마트 모드 선택 (Auto/Google-Only/Local/Offline)
 * 3. 자동 장애 보고서 생성 (기존 AutoReportService 활용)
 * 4. 3초 이내 응답 보장
 */

import { NextRequest, NextResponse } from 'next/server';
import { aiEngineHub } from '@/core/ai/RefactoredAIEngineHub';
import { SimplifiedNaturalLanguageEngine } from '@/services/ai/SimplifiedNaturalLanguageEngine';

/**
 * 🔑 관리자 인증 체크
 */
function checkAdminAuth(request: NextRequest): boolean {
  const adminKey =
    request.headers.get('X-Admin-Key') ||
    request.headers.get('Authorization')?.replace('Bearer ', '');

  return adminKey === process.env.ADMIN_SECRET_KEY;
}

/**
 * 🚀 POST: 자연어 질의 처리 (Ultra Simple 통합)
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const {
      query,
      context,
      fastMode = true, // 기본값을 true로 변경 (Ultra Simple 우선)
      mode, // 스마트 모드 강제 설정 (auto/google-only/local/offline)
      options,
    } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: '질의(query)가 필요합니다.',
          mode: 'error',
        },
        { status: 400 }
      );
    }

    console.log(
      `🧠 Smart Fallback API 요청: "${query.substring(0, 50)}..." (모드: ${mode || 'auto'})`
    );

    // 🚀 Ultra Simple 모드 (기본값) - SimplifiedNaturalLanguageEngine 사용
    if (fastMode) {
      console.log('🚀 Ultra Simple 모드 활성화 - 자연어 질의 응답 우선');

      const simplifiedEngine = SimplifiedNaturalLanguageEngine.getInstance();
      const result = await simplifiedEngine.processQuery(
        query.trim(),
        context,
        {
          timeout: options?.timeout || 3000, // 3초 타임아웃
          enableParallel: options?.enableParallel !== false,
          preferEngine: options?.preferEngine || 'auto',
          enableMCPWarmup: options?.enableMCPWarmup !== false,
          mode: mode || undefined, // 스마트 모드 강제 설정
        }
      );

      // 🚨 자동 장애 보고서 포함 응답
      return NextResponse.json(
        {
          success: result.success,
          response: result.response,
          confidence: result.confidence,
          engine: result.engine,
          mode: result.mode,
          metadata: {
            strategy: 'ultra-simple',
            enginePath: [result.engine],
            processingTime: result.responseTime,
            fallbackUsed: result.fallbackUsed,
            warmupTime: result.warmupTime,
            suggestions: [],
            processedAt: new Date().toISOString(),
            requestId: `ultra_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            // 🚨 자동 장애 보고서 (감지된 경우만)
            failureReport: result.failureReport,
          },
          systemStatus: simplifiedEngine.getSystemStatus(),
        },
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'X-Response-Mode': 'ultra-simple',
            'X-Processing-Time': result.responseTime.toString(),
            'X-AI-Mode': result.mode,
          },
        }
      );
    }

    // 🔄 기존 복합 모드 (RefactoredAIEngineHub 사용) - 레거시 호환
    console.log('🔄 표준 모드 - RefactoredAIEngineHub 사용');

    const hubRequest = {
      query: query.trim(),
      mode: 'AUTO' as const, // GoogleAIMode 타입으로 명시
      strategy: 'smart_fallback' as const,
      context: {
        ...context,
        sessionId: `smart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        requestSource: 'smart_fallback_api',
        timestamp: new Date().toISOString(),
      },
      options: {
        timeout: options?.timeout || 10000,
        useMCP: options?.enableMCP !== false,
        useRAG: options?.enableRAG !== false,
        useGoogleAI: options?.enableGoogleAI !== false,
        enableParallel: options?.enableParallel !== false,
        ...options,
      },
    };

    const result = await aiEngineHub.processQuery(hubRequest);

    return NextResponse.json(
      {
        success: result.success,
        response: result.response,
        confidence: result.confidence,
        engine: result.enginePath?.[0] || 'smart_fallback',
        mode: 'standard',
        metadata: {
          strategy: result.strategy || 'smart_fallback',
          enginePath: result.enginePath || ['smart_fallback'],
          enginesUsed: result.metadata?.engines?.used || [],
          processingTime: Date.now() - startTime,
          fallbackUsed:
            result.metadata?.engines?.fallbacks?.length > 0 || false,
          suggestions: result.metadata?.suggestions || [],
          processedAt: new Date().toISOString(),
          requestId: hubRequest.context.sessionId,
        },
        systemStatus: {
          hubStatus: 'active',
          strategy: result.strategy,
          enginesAvailable: result.metadata?.engines?.used?.length || 0,
        },
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Response-Mode': 'standard',
          'X-Processing-Time': (Date.now() - startTime).toString(),
        },
      }
    );
  } catch (error) {
    console.error('❌ Smart Fallback API 오류:', error);

    return NextResponse.json(
      {
        success: false,
        response:
          '죄송합니다. 현재 AI 시스템에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
        error: error instanceof Error ? error.message : '알 수 없는 오류',
        mode: 'error',
        metadata: {
          strategy: 'error_fallback',
          processingTime: Date.now() - startTime,
          processedAt: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

/**
 * 📊 GET: 시스템 상태 조회 (Ultra Simple 통합)
 */
export async function GET(request: NextRequest) {
  try {
    const isAdmin = checkAdminAuth(request);
    const simplifiedEngine = SimplifiedNaturalLanguageEngine.getInstance();

    // 기본 상태 정보
    const basicStatus = {
      service: 'Smart Fallback Engine (Ultra Simple 통합)',
      version: '2.0.0',
      status: 'active',
      timestamp: new Date().toISOString(),
      architecture: 'ultra-simple-integrated',
      primaryFunction: '자연어 질의 응답',
      responseTimeTarget: '< 3초',
      features: {
        smartModeSelection: true,
        autoFailureReporting: true,
        parallelProcessing: true,
        mcpWarmup: true,
      },
    };

    // 관리자용 상세 정보
    if (isAdmin) {
      const systemStatus = simplifiedEngine.getSystemStatus();

      return NextResponse.json({
        ...basicStatus,
        admin: true,
        detailedStatus: systemStatus,
        engines: {
          simplified: systemStatus,
          hub: {
            status: 'available',
            note: 'Legacy compatibility mode',
          },
        },
        modes: {
          auto: '3-엔진 병렬 (Google + MCP + RAG)',
          'google-only': 'Google AI 전용',
          local: 'MCP + RAG (로컬)',
          offline: '정적 응답',
        },
      });
    }

    // 일반 사용자용 기본 정보
    return NextResponse.json(basicStatus);
  } catch (error) {
    console.error('❌ Smart Fallback 상태 조회 오류:', error);

    return NextResponse.json(
      {
        service: 'Smart Fallback Engine',
        status: 'error',
        error: error instanceof Error ? error.message : '알 수 없는 오류',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// 다른 HTTP 메서드들에 대한 명시적 처리
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      Allow: 'GET, POST, OPTIONS',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers':
        'Content-Type, Authorization, X-Admin-Key',
    },
  });
}

export async function PUT(request: NextRequest) {
  return NextResponse.json(
    { error: 'PUT method not allowed. Use POST for queries.' },
    { status: 405, headers: { Allow: 'GET, POST, OPTIONS' } }
  );
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json(
    { error: 'DELETE method not allowed. Use POST for queries.' },
    { status: 405, headers: { Allow: 'GET, POST, OPTIONS' } }
  );
}

export async function PATCH(request: NextRequest) {
  return NextResponse.json(
    { error: 'PATCH method not allowed. Use POST for queries.' },
    { status: 405, headers: { Allow: 'GET, POST, OPTIONS' } }
  );
}
