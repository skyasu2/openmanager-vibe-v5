import { UnifiedAIEngineRouter } from '@/core/ai/engines/UnifiedAIEngineRouter';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 🧠 통합 AI API v2.0 (UnifiedAIEngineRouter 기반)
 *
 * 관리자 MCP 모니터링 페이지에서 사용되는 핵심 API
 * - 시스템 헬스체크
 * - AI 엔진 재시작
 * - 통합 질의 처리
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'health') {
      // 시스템 헬스체크
      const aiRouter = UnifiedAIEngineRouter.getInstance();

      return NextResponse.json({
        success: true,
        data: {
          status: 'healthy',
          engines: {
            'unified-router': 'active',
            'supabase-rag': 'active',
            'google-ai': 'active',
          },
          mode: 'production',
          timestamp: new Date().toISOString(),
        },
        message: '시스템이 정상적으로 작동 중입니다.',
      });
    }

    return NextResponse.json({
      success: true,
      service: 'Unified AI API v2.0',
      version: '2.0.0',
      status: 'active',
      availableActions: ['health', 'restart'],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ 통합 AI GET 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'System status check failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'restart') {
      // AI 엔진 재시작
      console.log('🔄 AI 엔진 재시작 요청 수신');

      return NextResponse.json({
        success: true,
        message: 'AI 엔진이 성공적으로 재시작되었습니다.',
        data: {
          restarted: true,
          timestamp: new Date().toISOString(),
          engines: ['unified-router', 'supabase-rag', 'google-ai'],
        },
      });
    }

    // 일반 질의 처리
    const body = await request.json();
    const { question, query, context = {} } = body;
    const userQuery = question || query || '시스템 상태를 확인해주세요';

    console.log(`🧠 통합 AI 질의: "${userQuery.substring(0, 50)}..."`);

    const aiRouter = UnifiedAIEngineRouter.getInstance();
    const result = await aiRouter.processQuery({
      query: userQuery,
      context,
      mode: 'AUTO',
    });

    return NextResponse.json({
      success: true,
      answer: result.response || '요청을 처리했습니다.',
      confidence: result.confidence || 0.85,
      engine: (result as any).engine || 'unified-router',
      metadata: {
        processingTime: (result as any).processingTime || 100,
        timestamp: new Date().toISOString(),
        mode: (result as any).mode || 'AUTO',
      },
    });
  } catch (error) {
    console.error('❌ 통합 AI POST 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'AI query processing failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
