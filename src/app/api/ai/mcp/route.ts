/**
 * 🧠 하이브리드 MCP API 엔드포인트
 * 통합 Node AI 엔진
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAIEngine } from '@/core/ai/integrated-ai-engine';


/**
 * 🎯 하이브리드 AI 분석 처리
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    
    console.log('🧠 하이브리드 MCP 요청 수신:', {
      query: body.query?.substring(0, 50) + '...',
      hasMetrics: !!body.parameters?.metrics,
      sessionId: body.context?.session_id
    });

    const integratedEngine = getAIEngine();

    const analysisRequest = {
      type: 'prediction' as const,
      serverId: body.context?.server_id,
      data: body.parameters || {}
    };

    const result = await integratedEngine.analyze(analysisRequest);

    if (result.status === 'error') {
      throw new Error(result.error || 'AI 분석 실패');
    }

    const aiResult = result.result as any;
    const totalTime = Date.now() - startTime;

    console.log('✅ 분석 성공:', {
      confidence: aiResult?.confidence,
      totalTime,
      engine: 'integrated'
    });

    return NextResponse.json({
      success: true,
      data: {
        summary: `AI 분석이 완료되었습니다. 신뢰도: ${((aiResult?.confidence || 0.8) * 100).toFixed(1)}%`,
        confidence: aiResult?.confidence || 0.8,
        recommendations: aiResult?.recommendations || ['시스템이 정상적으로 작동 중입니다.'],
        analysis_data: aiResult?.predictions || {}
      },
      metadata: {
        engine: 'IntegratedAI',
        engine_version: 'integrated-1.0.0',
        processing_time: totalTime,
        timestamp: new Date().toISOString(),
        fallback_used: false
      }
    });

  } catch (error: any) {
    console.error('❌ 하이브리드 MCP 처리 오류:', error);

    return NextResponse.json({
      success: false,
      error: 'AI 분석 중 오류가 발생했습니다',
      message: error.message,
      processing_time: Date.now() - startTime,
      engine_status: 'failed'
    }, { status: 500 });
  }
}

/**
 * 🏥 하이브리드 시스템 상태 확인
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'health') {
      const integratedEngine = getAIEngine();
      return NextResponse.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        engine: integratedEngine.getEngineStatus(),
        strategy: 'integrated_only'
      });
    }

    if (action === 'integrated-status') {
      const integratedEngine = getAIEngine();
      return NextResponse.json(integratedEngine.getEngineStatus());
    }

    return NextResponse.json({
      service: 'MCP AI System',
      version: '1.0.0',
      description: 'Node 기반 AI 분석 시스템',
      endpoints: {
        'POST /': 'AI 분석 요청',
        'GET /?action=health': '시스템 상태',
        'GET /?action=integrated-status': '통합 엔진 상태'
      },
      architecture: {
        primary: 'Integrated Node Engine',
        strategy: 'Standalone'
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      error: '하이브리드 시스템 상태 확인 실패',
      message: error.message
    }, { status: 500 });
  }
} 