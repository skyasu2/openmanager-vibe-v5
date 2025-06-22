/**
 * 최적화된 통합 AI 엔진 v2.0 테스트 API
 *
 * 4개 핵심 엔진 테스트:
 * - SupabaseRAG (70%)
 * - MCP Client (20%)
 * - OpenSource (8%)
 * - Google AI (2%)
 */

import { NextRequest, NextResponse } from 'next/server';
import { optimizedUnifiedAIEngine } from '../../../core/ai/OptimizedUnifiedAIEngine';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '서버 상태 확인';
    const mode =
      (searchParams.get('mode') as 'AUTO' | 'GOOGLE_AI' | 'INTERNAL') || 'AUTO';

    console.log(`🧪 최적화된 AI 엔진 테스트: "${query}" (모드: ${mode})`);

    // 헬스체크 먼저 수행
    const healthStatus = optimizedUnifiedAIEngine.getHealthStatus();

    const startTime = Date.now();
    const result = await optimizedUnifiedAIEngine.processQuery({
      query,
      mode,
      priority: 'medium',
    });

    const totalTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      testQuery: query,
      mode,
      result,
      healthStatus,
      performance: {
        totalProcessingTime: totalTime,
        engineResponseTime: result.processingTime,
        overhead: totalTime - result.processingTime,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ 최적화된 AI 엔진 테스트 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
        healthStatus: optimizedUnifiedAIEngine.getHealthStatus(),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, mode = 'AUTO', category, priority = 'medium' } = body;

    if (!query) {
      return NextResponse.json(
        {
          success: false,
          error: 'query 매개변수가 필요합니다',
        },
        { status: 400 }
      );
    }

    console.log(`🧪 최적화된 AI 엔진 POST 테스트: "${query}" (모드: ${mode})`);

    const startTime = Date.now();
    const result = await optimizedUnifiedAIEngine.processQuery({
      query,
      mode,
      category,
      priority,
    });

    const totalTime = Date.now() - startTime;

    // 통계 정보 포함
    const stats = optimizedUnifiedAIEngine.getStats();

    return NextResponse.json({
      success: true,
      testQuery: query,
      mode,
      category,
      priority,
      result,
      stats,
      performance: {
        totalProcessingTime: totalTime,
        engineResponseTime: result.processingTime,
        overhead: totalTime - result.processingTime,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ 최적화된 AI 엔진 POST 테스트 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
        stats: optimizedUnifiedAIEngine.getStats(),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
