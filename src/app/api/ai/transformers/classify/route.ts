/**
 * 🤖 AI Transformers 텍스트 분류 API
 *
 * 로컬 Transformers.js 기반 텍스트 분류 서비스
 */

import { NextRequest, NextResponse } from 'next/server';

interface ClassificationRequest {
  text: string;
  task?: 'sentiment' | 'intent' | 'category';
}

interface ClassificationResult {
  label: string;
  score: number;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * POST: 텍스트 분류 수행
 */
export async function POST(request: NextRequest) {
  try {
    const body: ClassificationRequest = await request.json();
    const { text, task = 'sentiment' } = body;

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '분류할 텍스트가 필요합니다.',
        },
        { status: 400 }
      );
    }

    console.log('🤖 AI Transformers 분류 시작:', {
      text: text.substring(0, 100),
      task,
    });

    // 로컬 분류 수행 (실제 Transformers.js 없이 모킹)
    const result = await performClassification(text, task);

    return NextResponse.json({
      success: true,
      task,
      text,
      result,
      processedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('❌ AI Transformers 분류 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET: 지원하는 분류 작업 목록 조회
 */
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      supportedTasks: [
        {
          id: 'sentiment',
          name: '감정 분석',
          description: '텍스트의 긍정/부정/중립 감정을 분석합니다.',
          labels: ['positive', 'negative', 'neutral'],
        },
        {
          id: 'intent',
          name: '의도 분석',
          description: '텍스트의 의도를 분류합니다.',
          labels: ['question', 'request', 'complaint', 'compliment'],
        },
        {
          id: 'category',
          name: '카테고리 분류',
          description: '텍스트를 카테고리별로 분류합니다.',
          labels: ['technical', 'business', 'support', 'general'],
        },
      ],
      modelInfo: {
        type: 'local',
        engine: 'transformers.js',
        version: '2.17.1',
      },
    });
  } catch (error: any) {
    console.error('❌ 분류 작업 목록 조회 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * 텍스트 분류 수행 (모킹)
 */
async function performClassification(
  text: string,
  task: string
): Promise<ClassificationResult> {
  // 실제 환경에서는 Transformers.js 사용
  // 현재는 모킹으로 처리

  const mockResults = {
    sentiment: [
      { label: 'positive', score: 0.85, confidence: 'high' as const },
      { label: 'negative', score: 0.12, confidence: 'low' as const },
      { label: 'neutral', score: 0.03, confidence: 'low' as const },
    ],
    intent: [
      { label: 'question', score: 0.75, confidence: 'high' as const },
      { label: 'request', score: 0.2, confidence: 'medium' as const },
      { label: 'complaint', score: 0.03, confidence: 'low' as const },
      { label: 'compliment', score: 0.02, confidence: 'low' as const },
    ],
    category: [
      { label: 'technical', score: 0.65, confidence: 'medium' as const },
      { label: 'business', score: 0.25, confidence: 'medium' as const },
      { label: 'support', score: 0.08, confidence: 'low' as const },
      { label: 'general', score: 0.02, confidence: 'low' as const },
    ],
  };

  // 약간의 지연 시뮬레이션
  await new Promise(resolve => setTimeout(resolve, 200));

  const results =
    mockResults[task as keyof typeof mockResults] || mockResults.sentiment;
  return results[0]; // 가장 높은 점수의 결과 반환
}
