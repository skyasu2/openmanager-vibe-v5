// import { EngineOrchestrator } from '@/services/ai/orchestrator/EngineOrchestrator';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;

    // Simple response since EngineOrchestrator was deleted
    return NextResponse.json({
      success: true,
      response: `질문을 받았습니다: "${query}". 현재 간단한 응답 모드로 동작 중입니다.`,
      confidence: 0.5
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '쿼리 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 