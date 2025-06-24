/**
 * 🤖 통합 AI 쿼리 API v4.0 (통합 AI 엔진 라우터 중심)
 *
 * 새로운 기능:
 * - 3가지 AI 모드 지원 (AUTO, LOCAL, GOOGLE_ONLY)
 * - 고급 엔진 통합 (SmartFallbackEngine, IntelligentMonitoringService)
 * - 복구된 NLP 기능들 활용
 */

import { UnifiedAIEngineRouter } from '@/core/ai/engines/UnifiedAIEngineRouter';
import { NextRequest, NextResponse } from 'next/server';

// 🎯 통합 AI 엔진 라우터 (모든 엔진 통합)
const aiRouter = UnifiedAIEngineRouter.getInstance();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const query = searchParams.get('query');
  const mode = searchParams.get('mode') || 'AUTO';

  try {
    if (action === 'status') {
      // 🎯 새로운 통합 AI 엔진 라우터 상태
      const engineStatus = aiRouter.getEngineStatus();

      return NextResponse.json({
        success: true,
        status: 'healthy',
        engines: engineStatus.engines,
        version: '4.0',
        availableModes: engineStatus.availableModes,
        currentMode: engineStatus.currentMode,
        stats: engineStatus.stats,
        features: {
          smartFallback: '지능형 폴백 시스템',
          intelligentMonitoring: '지능형 모니터링 분석',
          enhancedNLP: '향상된 한국어 NLP',
          multiModalSupport: '3가지 AI 모드 지원',
        },
      });
    }

    if (action === 'query' && query) {
      console.log(`🎯 통합 AI 쿼리 (${mode} 모드): "${query}"`);

      // 🚀 통합 AI 엔진 라우터로 처리
      const result = await aiRouter.processQuery({
        query,
        mode: mode as 'AUTO' | 'LOCAL' | 'GOOGLE_ONLY',
        category: searchParams.get('category') || undefined,
        context: {
          timestamp: new Date().toISOString(),
          source: 'unified-api-get',
          userAgent: request.headers.get('user-agent'),
          // 🔍 모니터링 모드 특화 컨텍스트
          ...(mode === 'MONITORING' && {
            monitoringContext: {
              enableAnomalyDetection: true,
              enableRootCauseAnalysis: true,
              enablePredictiveMonitoring: true,
            },
          }),
        },
      });

      return NextResponse.json({
        success: result.success,
        response: result.response,
        confidence: result.confidence,
        mode: result.mode,
        engine: result.metadata.mainEngine,
        processingTime: result.processingTime,
        enginePath: result.enginePath,
        fallbacksUsed: result.fallbacksUsed,
        metadata: {
          ...result.metadata,
          version: '4.0',
          apiMethod: 'GET',
        },
      });
    }

    return NextResponse.json(
      {
        success: false,
        error:
          '잘못된 요청입니다. action=status 또는 action=query&query=검색어&mode=모드를 사용하세요.',
        availableModes: ['AUTO', 'LOCAL', 'GOOGLE_ONLY'],
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('❌ 통합 AI 쿼리 API 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : '서버 오류가 발생했습니다.',
        mode: mode,
        version: '4.0',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, mode = 'AUTO', category, context } = body;

    if (!query) {
      return NextResponse.json(
        {
          success: false,
          error: 'query 필드가 필요합니다.',
          availableModes: ['AUTO', 'LOCAL', 'GOOGLE_ONLY'],
        },
        { status: 400 }
      );
    }

    console.log(`🎯 POST 쿼리 (${mode} 모드): "${query}"`);

    // 🚀 통합 AI 엔진 라우터로 처리
    const result = await aiRouter.processQuery({
      query,
      mode: mode as 'AUTO' | 'LOCAL' | 'GOOGLE_ONLY',
      category: category || undefined,
      context: {
        timestamp: new Date().toISOString(),
        source: 'unified-api-post',
        userAgent: request.headers.get('user-agent'),
        ...context,
        // 🔍 모니터링 모드 특화 컨텍스트
        ...(mode === 'MONITORING' && {
          monitoringContext: {
            enableAnomalyDetection: true,
            enableRootCauseAnalysis: true,
            enablePredictiveMonitoring: true,
          },
        }),
      },
    });

    return NextResponse.json({
      success: result.success,
      response: result.response,
      confidence: result.confidence,
      mode: result.mode,
      engine: result.metadata.mainEngine,
      processingTime: result.processingTime,
      enginePath: result.enginePath,
      fallbacksUsed: result.fallbacksUsed,
      metadata: {
        ...result.metadata,
        version: '4.0',
        apiMethod: 'POST',
        requestBody: {
          queryLength: query.length,
          hasCategory: !!category,
          hasContext: !!context,
        },
      },
    });
  } catch (error) {
    console.error('❌ 통합 AI 쿼리 POST 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : '서버 오류가 발생했습니다.',
        version: '4.0',
        apiMethod: 'POST',
      },
      { status: 500 }
    );
  }
}
