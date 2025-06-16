/**
 * 🧠 Smart Fallback Engine API (Natural Language Unifier 통합)
 * POST /api/ai/smart-fallback
 * GET /api/ai/smart-fallback (상태 조회)
 */

import { NextRequest, NextResponse } from 'next/server';
import { aiEngineHub } from '@/core/ai/RefactoredAIEngineHub';

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
 * 🎯 스마트 AI 쿼리 처리 + 관리자 작업
 */
export async function POST(request: NextRequest) {
  try {
    // Content-Type 검증
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Content-Type must be application/json',
          received: contentType,
        },
        { status: 400 }
      );
    }

    // 요청 본문 파싱
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON in request body',
          details:
            parseError instanceof Error
              ? parseError.message
              : 'JSON parse failed',
        },
        { status: 400 }
      );
    }

    const { query, context, options } = body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '질의가 필요합니다.',
          received: { query, type: typeof query },
        },
        { status: 400 }
      );
    }

    console.log('🧠 Smart-Fallback API 호출:', {
      query: query.substring(0, 50),
      hasContext: !!context,
      hasOptions: !!options,
      timestamp: new Date().toISOString(),
    });

    // RefactoredAIEngineHub를 사용한 통합 처리
    const result = await aiEngineHub.processQuery({
      query: query.trim(),
      mode: 'AUTO', // 기본값: AUTO 모드 (MCP+RAG 우선, Google AI 백업)
      strategy: 'smart_fallback',
      context: {
        language: context?.language || 'ko',
        urgency: context?.urgency || 'medium',
        sessionId: context?.sessionId || `fallback_${Date.now()}`,
        serverMetrics: context?.serverMetrics,
        timeRange: context?.timeRange,
      },
      options: {
        enableThinking: options?.enableThinking || false,
        maxResponseTime: options?.maxResponseTime || 15000,
        confidenceThreshold: options?.confidenceThreshold || 0.7,
        useMCP: options?.useMCP !== false,
        useRAG: options?.useRAG !== false,
        useGoogleAI: options?.useGoogleAI !== false,
      },
    });

    // 성공 응답
    return NextResponse.json(
      {
        success: result.success,
        response: result.response,
        confidence: result.confidence,
        engine: result.strategy,
        mode: result.mode,
        metadata: {
          strategy: result.strategy,
          enginePath: result.enginePath,
          processingTime: result.processingTime,
          fallbackUsed: result.metadata.engines.fallbacks.length > 0,
          fallbackPath: result.metadata.engines.fallbacks,
          suggestions: result.metadata.suggestions,
          processedAt: new Date().toISOString(),
          requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        },
        systemStatus: result.systemStatus,
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Version': '2.0.0',
          'X-Processing-Time': `${result.processingTime}ms`,
        },
      }
    );
  } catch (error) {
    console.error('❌ Smart-Fallback API 오류:', error);

    // 상세한 에러 정보 제공
    const errorDetails = {
      success: false,
      response: '시스템 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      confidence: 0,
      engine: 'error-fallback',
      mode: 'ERROR',
      metadata: {
        strategy: 'error-fallback',
        enginePath: ['error'],
        processingTime: 0,
        fallbackUsed: true,
        processedAt: new Date().toISOString(),
        errorType:
          error instanceof Error ? error.constructor.name : 'UnknownError',
        stack:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.stack
              : undefined
            : undefined,
      },
    };

    return NextResponse.json(errorDetails, {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Error': 'internal-server-error',
      },
    });
  }
}

/**
 * 📊 Smart Fallback 상태 조회 + 관리자 대시보드
 */
export async function GET(request: NextRequest) {
  try {
    const status = await aiEngineHub.getSystemStatus();

    return NextResponse.json(
      {
        service: 'Smart-Fallback AI Engine',
        status: 'active',
        version: '2.0.0-refactored',
        description: 'RefactoredAIEngineHub 기반 통합 AI 폴백 시스템',
        engines: status.engines,
        overall: status.overall,
        timestamp: status.timestamp,
        features: [
          'Multi-AI 엔진 통합 관리',
          'GoogleAI 3모드 지원 (AUTO/LOCAL/GOOGLE_ONLY)',
          'DualCore MCP+RAG 병렬 처리',
          'SmartFallback 지능형 폴백',
          '한국어 특화 자연어 처리',
          '상호보완적 결과 융합',
        ],
        supportedMethods: ['GET', 'POST'],
        endpoints: {
          status: 'GET /api/ai/smart-fallback',
          query: 'POST /api/ai/smart-fallback',
        },
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Version': '2.0.0',
        },
      }
    );
  } catch (error) {
    console.error('❌ Smart-Fallback 상태 조회 실패:', error);

    return NextResponse.json(
      {
        service: 'Smart-Fallback AI Engine',
        status: 'error',
        error: error instanceof Error ? error.message : '상태 조회 실패',
        timestamp: new Date().toISOString(),
        supportedMethods: ['GET', 'POST'],
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Error': 'status-check-failed',
        },
      }
    );
  }
}

/**
 * 🚫 지원하지 않는 HTTP 메서드 처리
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      Allow: 'GET, POST, OPTIONS',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers':
        'Content-Type, Authorization, X-Admin-Key',
    },
  });
}

// 다른 HTTP 메서드들에 대한 명시적 처리
export async function PUT() {
  return NextResponse.json(
    {
      error: 'Method Not Allowed',
      message: 'PUT method is not supported. Use POST for queries.',
    },
    { status: 405, headers: { Allow: 'GET, POST, OPTIONS' } }
  );
}

export async function DELETE() {
  return NextResponse.json(
    {
      error: 'Method Not Allowed',
      message: 'DELETE method is not supported. Use POST for queries.',
    },
    { status: 405, headers: { Allow: 'GET, POST, OPTIONS' } }
  );
}

export async function PATCH() {
  return NextResponse.json(
    {
      error: 'Method Not Allowed',
      message: 'PATCH method is not supported. Use POST for queries.',
    },
    { status: 405, headers: { Allow: 'GET, POST, OPTIONS' } }
  );
}
