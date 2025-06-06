import { NextRequest, NextResponse } from 'next/server';
import { getAIEngine } from '@/core/ai/integrated-ai-engine';

export async function POST(request: NextRequest) {
  const start = Date.now();
  try {
    const body = await request.json();
    const engine = getAIEngine();
    const analysisRequest = {
      type: 'prediction' as const,
      serverId: body.context?.server_id,
      data: body.parameters || {}
    };
    const result = await engine.analyze(analysisRequest);
    if (result.status === 'error') {
      throw new Error(result.error || 'AI 분석 실패');
    }
    const aiResult = result.result as any;
    return NextResponse.json({
      success: true,
      data: {
        summary: 'AI 분석이 완료되었습니다.',
        confidence: aiResult?.confidence ?? 0.8,
        recommendations: aiResult?.recommendations || [],
        analysis_data: aiResult?.predictions || {}
      },
      metadata: {
        engine: 'IntegratedAI',
        processing_time: Date.now() - start,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('❌ MCP 처리 오류:', error);
    return NextResponse.json({
      success: false,
      error: 'AI 분석 중 오류가 발생했습니다',
      message: error.message
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const engine = getAIEngine();
  return NextResponse.json(engine.getEngineStatus());
}
