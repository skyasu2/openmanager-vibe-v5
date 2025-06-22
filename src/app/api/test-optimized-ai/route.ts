/**
 * 최적화된 통합 AI 엔진 v2.2 테스트 API - 단순화 버전
 *
 * 3개 핵심 엔진 테스트:
 * - SupabaseRAG (80%) - 메인 RAG 엔진 (유일한 RAG)
 * - MCP Client (18%) - 공식 MCP 서버
 * - Google AI (2%) - 베타 기능 (질문만)
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
      engineInfo: {
        version: 'v2.2',
        totalEngines: 3,
        mainRAG: 'SupabaseRAG (80%)',
        removedEngines: ['CustomEngines', 'OpenSourceEngines'],
        reason: '안정성 개선을 위한 단순화',
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

    // mode 검증 (CUSTOM_ONLY 제거됨)
    const validModes = ['AUTO', 'GOOGLE_AI', 'INTERNAL'];
    if (!validModes.includes(mode)) {
      return NextResponse.json(
        {
          success: false,
          error: `유효하지 않은 모드: ${mode}. 사용 가능한 모드: ${validModes.join(', ')}`,
          availableModes: validModes,
          removedModes: ['CUSTOM_ONLY'],
          reason: 'CustomEngines 안정성 문제로 제거됨',
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
      engineInfo: {
        version: 'v2.2',
        totalEngines: 3,
        activeEngines: ['supabase-rag', 'mcp-client', 'google-ai'],
        weights: { 'supabase-rag': 80, 'mcp-client': 18, 'google-ai': 2 },
        improvements: [
          'CUSTOM_ONLY 모드 제거',
          'CustomEngines 안정성 문제 해결',
          'SupabaseRAG를 유일한 RAG 엔진으로 통합',
          '3개 엔진으로 단순화하여 안정성 향상',
        ],
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
