import { NextRequest, NextResponse } from 'next/server';
import { GeminiLearningEngine } from '@/modules/ai-agent/learning/GeminiLearningEngine';

/**
 * 🤖 Gemini 학습 엔진 상태 조회 API
 */

export async function GET(request: NextRequest) {
  try {
    const learningEngine = GeminiLearningEngine.getInstance();
    const status = learningEngine.getStatus();

    return NextResponse.json({
      success: true,
      status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ [Gemini Status API] 상태 조회 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: '상태 조회 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
