/**
 * 🎯 OpenManager Vibe v5 - 통합 MCP AI 엔진
 *
 * MasterAIEngine 기반 MCP 통합 인터페이스
 * - 커스텀 MCP 엔진 + 오픈소스 폴백
 * - 컨텍스트 인식 및 추론 단계 제공
 * - 하이브리드 분석 및 자동 폴백
 */

import { detectEnvironment } from '@/config/environment';
import { masterAIEngine } from '@/services/ai/MasterAIEngine';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 🤖 MCP (Model Context Protocol) API
 * Vercel 환경에서는 비활성화, 로컬에서만 활성화
 */
export async function GET(request: NextRequest) {
  try {
    const env = detectEnvironment();

    // 🚫 Vercel 환경에서는 MCP 비활성화
    if (env.IS_VERCEL) {
      return NextResponse.json({
        success: false,
        error: 'MCP는 Vercel 환경에서 비활성화됨',
        message: 'GCP 실제 데이터를 사용하세요',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // 🏠 로컬 환경에서만 MCP 활성화
    return NextResponse.json({
      success: true,
      message: 'MCP 서비스 활성화됨 (로컬 환경)',
      environment: 'local',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ MCP API 오류:', error);

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
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
