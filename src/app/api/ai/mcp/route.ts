/**
 * 🎯 OpenManager Vibe v5 - 통합 MCP AI 엔진
 *
 * MasterAIEngine 기반 MCP 통합 인터페이스
 * - 커스텀 MCP 엔진 + 오픈소스 폴백
 * - 컨텍스트 인식 및 추론 단계 제공
 * - 하이브리드 분석 및 자동 폴백
 */

import { getMasterAIEngine } from '@/services/ai/MasterAIEngine';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🎯 통합 MCP 상태 조회');

    const masterAIEngine = getMasterAIEngine();
    const systemInfo = masterAIEngine.getSystemInfo();
    const engineStatuses = masterAIEngine.getEngineStatuses();
    const mcpEngine = engineStatuses.find(e => e.name === 'mcp');

    return NextResponse.json({
      success: true,
      data: {
        mcp_status: {
          engine_info: {
            name: 'mcp',
            type: 'custom_engine',
            status: mcpEngine?.status || 'ready',
            memory_usage: mcpEngine?.memory_usage || '~5MB',
            success_rate: mcpEngine?.success_rate || 0,
            avg_response_time: mcpEngine?.avg_response_time || 0,
          },
          capabilities: [
            'context_awareness',
            'reasoning_steps',
            'server_analysis',
            'korean_optimization',
            'fallback_support',
          ],
          integration: {
            master_engine: true,
            opensource_fallback: true,
            hybrid_analysis: true,
          },
        },
        system_overview: {
          total_engines: systemInfo.master_engine.total_engines,
          custom_engines: systemInfo.master_engine.custom_engines,
          opensource_engines: systemInfo.master_engine.opensource_engines,
          initialized: systemInfo.master_engine.initialized,
        },
      },
      message: '통합 MCP 상태 조회 완료',
    });
  } catch (error) {
    console.error('❌ MCP 상태 조회 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🎯 MasterAIEngine MCP 쿼리 실행');

    const body = await request.json().catch(() => ({}));
    const { query, context, use_hybrid = false } = body;

    if (!query) {
      return NextResponse.json(
        {
          success: false,
          error: '쿼리가 필요합니다',
        },
        { status: 400 }
      );
    }

    // 하이브리드 분석 사용 여부에 따라 엔진 선택
    const engineType = use_hybrid ? 'hybrid' : 'mcp';

    // MasterAIEngine을 통한 쿼리 처리
    const masterAIEngine = getMasterAIEngine();
    const result = await masterAIEngine.query({
      engine: engineType,
      query,
      data: context?.servers || [],
      context: context,
      options: {
        use_cache: true,
        fallback_enabled: true,
      },
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'MCP 쿼리 실패',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        query_info: {
          original_query: query,
          engine_used: result.engine_used,
          response_time: result.response_time,
          confidence: result.confidence,
          fallback_used: result.fallback_used,
          cache_hit: result.cache_hit,
          hybrid_mode: use_hybrid,
          timestamp: new Date().toISOString(),
        },
        mcp_result: result.result,
        performance: {
          processing_method: result.fallback_used
            ? 'opensource_fallback'
            : 'custom_mcp',
          optimization: {
            cached: result.cache_hit,
            memory_efficient: true,
            context_aware: !!context,
          },
        },
      },
      message: `MCP 쿼리 완료 - ${result.engine_used} 엔진 사용`,
    });
  } catch (error) {
    console.error('❌ MCP 쿼리 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
