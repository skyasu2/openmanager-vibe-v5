/**
 * 🧠 Smart Fallback Engine API
 * POST /api/ai/smart-fallback
 * GET /api/ai/smart-fallback (상태 조회)
 */

import { NextRequest, NextResponse } from 'next/server';
import SmartFallbackEngine from '@/services/ai/SmartFallbackEngine';

/**
 * 🎯 스마트 AI 쿼리 처리
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { query, context, options } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { success: false, error: '쿼리가 필요합니다.' },
        { status: 400 }
      );
    }

    console.log('🧠 Smart Fallback 쿼리 처리:', query.slice(0, 50));

    const smartEngine = SmartFallbackEngine.getInstance();
    const result = await smartEngine.processQuery(query, context, options);

    return NextResponse.json({
      success: result.success,
      response: result.response,
      metadata: {
        stage: result.stage,
        confidence: result.confidence,
        responseTime: result.responseTime,
        fallbackPath: result.fallbackPath,
        quota: result.quota,
        processedAt: new Date().toISOString(),
        totalTime: Date.now() - startTime,
      },
    });
  } catch (error) {
    console.error('❌ Smart Fallback API 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
        metadata: {
          stage: 'error',
          confidence: 0,
          responseTime: Date.now() - startTime,
          fallbackPath: ['API 오류'],
          quota: {
            googleAIUsed: 0,
            googleAIRemaining: 300,
            isNearLimit: false,
          },
        },
      },
      { status: 500 }
    );
  }
}

/**
 * 📊 Smart Fallback 상태 조회
 */
export async function GET(request: NextRequest) {
  try {
    const smartEngine = SmartFallbackEngine.getInstance();
    const status = smartEngine.getSystemStatus();

    const url = new URL(request.url);
    const include = url.searchParams.get('include');

    let response: any = {
      success: true,
      status: status.initialized ? 'initialized' : 'not_initialized',
      engines: status.engines,
      quota: status.quota,
      dailyStats: status.dailyStats,
      timestamp: new Date().toISOString(),
    };

    // 실패 로그 포함 요청
    if (include === 'failures') {
      const limit = parseInt(url.searchParams.get('limit') || '10');
      response.recentFailures = smartEngine.getFailureLogs(limit);
    }

    // 상세 정보 포함 요청
    if (include === 'detailed') {
      response.recentFailures = status.recentFailures;
      response.performance = {
        engineSuccessRates: {
          mcp: Math.round(status.engines.mcp.successRate * 100) + '%',
          rag: Math.round(status.engines.rag.successRate * 100) + '%',
          googleAI: Math.round(status.engines.googleAI.successRate * 100) + '%',
        },
        quotaUsage: {
          used: status.quota.googleAIUsed,
          remaining: status.quota.googleAIRemaining,
          percentage: Math.round((status.quota.googleAIUsed / 300) * 100) + '%',
          isNearLimit: status.quota.isNearLimit,
        },
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ Smart Fallback 상태 조회 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '상태 조회 실패',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
