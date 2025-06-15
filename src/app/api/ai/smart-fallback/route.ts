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
    const { query, context, options } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: '질의가 필요합니다.' },
        { status: 400 }
      );
    }

    console.log('🧠 Smart-Fallback API 호출:', {
      query: query.substring(0, 50),
      hasContext: !!context,
      hasOptions: !!options,
    });

    // RefactoredAIEngineHub를 사용한 통합 처리
    const result = await aiEngineHub.processQuery({
      query,
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

    return NextResponse.json({
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
      },
      systemStatus: result.systemStatus,
    });
  } catch (error) {
    console.error('❌ Smart-Fallback API 오류:', error);

    return NextResponse.json(
      {
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
        },
      },
      { status: 500 }
    );
  }
}

/**
 * 📊 Smart Fallback 상태 조회 + 관리자 대시보드
 */
export async function GET() {
  try {
    const status = await aiEngineHub.getSystemStatus();

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error('❌ Smart-Fallback 상태 조회 실패:', error);

    return NextResponse.json(
      {
        service: 'Smart-Fallback AI Engine',
        status: 'error',
        error: error instanceof Error ? error.message : '상태 조회 실패',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
