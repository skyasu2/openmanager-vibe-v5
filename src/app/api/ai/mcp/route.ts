/**
 * 🎯 OpenManager Vibe v5 - MCP API 엔드포인트
 *
 * SimplifiedQueryEngine 기반 MCP 통합 인터페이스
 * - Local 모드에서 MCP 컨텍스트 수집
 * - 컨텍스트 인식 쿼리 처리
 * - 로컬 환경 전용 (Vercel에서는 비활성화)
 */

import { detectEnvironment } from '@/config/environment';
import { simplifiedQueryEngine } from '@/services/ai/SimplifiedQueryEngine';
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
      return NextResponse.json(
        {
          success: false,
          error: 'MCP는 Vercel 환경에서 비활성화됨',
          message: 'GCP 실제 데이터를 사용하세요',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // 🏠 로컬 환경에서만 MCP 활성화
    return NextResponse.json({
      success: true,
      message: 'MCP 서비스 활성화됨 (로컬 환경)',
      environment: 'local',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ MCP API 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🎯 SimplifiedQueryEngine MCP 쿼리 실행');

    const body = await request.json().catch(() => ({}));
    const { query, context } = body;

    if (!query) {
      return NextResponse.json(
        {
          success: false,
          error: '쿼리가 필요합니다',
        },
        { status: 400 }
      );
    }

    // SimplifiedQueryEngine을 통한 쿼리 처리 (local 모드 + MCP)
    const result = await simplifiedQueryEngine.query({
      query,
      mode: 'local',
      context: context,
      options: {
        includeMCPContext: true,
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
          mode: result.engine || 'local',
          response_time: result.metadata?.processingTime || 0,
          confidence: result.confidence,
          mcp_used: result.metadata?.mcpUsed || false,
          timestamp: new Date().toISOString(),
        },
        mcp_result: result.answer,
        performance: {
          processing_method: result.metadata?.mcpUsed ? 'mcp_context' : 'local_only',
          optimization: {
            cached: false,
            memory_efficient: true,
            context_aware: !!context,
          },
        },
      },
      message: `MCP 쿼리 완료 - ${result.engine || 'local'} 모드 사용`,
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
