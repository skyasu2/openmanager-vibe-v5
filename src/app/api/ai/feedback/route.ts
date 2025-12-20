import { NextResponse } from 'next/server';

/**
 * AI 피드백 API 엔드포인트
 *
 * POST /api/ai/feedback
 *
 * 사용자 피드백 (👍/👎)을 수집하여 AI 품질 개선에 활용
 */

interface FeedbackRequest {
  messageId: string;
  type: 'positive' | 'negative';
  timestamp?: string;
  sessionId?: string;
}

interface FeedbackLog {
  messageId: string;
  type: 'positive' | 'negative';
  timestamp: string;
  userAgent?: string;
}

// 메모리 내 피드백 저장소 (MVP - 추후 DB 연동)
const feedbackStore: FeedbackLog[] = [];

export async function POST(request: Request) {
  try {
    const body: FeedbackRequest = await request.json();

    // 필수 필드 검증
    if (!body.messageId || !body.type) {
      return NextResponse.json(
        { error: 'Missing required fields: messageId, type' },
        { status: 400 }
      );
    }

    // 타입 검증
    if (body.type !== 'positive' && body.type !== 'negative') {
      return NextResponse.json(
        { error: 'Invalid feedback type. Must be "positive" or "negative"' },
        { status: 400 }
      );
    }

    const feedbackLog: FeedbackLog = {
      messageId: body.messageId,
      type: body.type,
      timestamp: body.timestamp || new Date().toISOString(),
      userAgent: request.headers.get('user-agent') || undefined,
    };

    // 피드백 저장 (메모리)
    feedbackStore.push(feedbackLog);

    // 로그 출력 (개발/디버깅용)
    console.log('[AI Feedback]', JSON.stringify(feedbackLog));

    // 최근 100개만 유지 (메모리 관리)
    if (feedbackStore.length > 100) {
      feedbackStore.shift();
    }

    return NextResponse.json({
      success: true,
      message: 'Feedback recorded',
      feedbackId: `fb_${Date.now()}`,
    });
  } catch (error) {
    console.error('[AI Feedback Error]', error);
    return NextResponse.json(
      { error: 'Failed to process feedback' },
      { status: 500 }
    );
  }
}

// GET: 피드백 통계 조회 (관리자용)
export async function GET() {
  const stats = {
    total: feedbackStore.length,
    positive: feedbackStore.filter((f) => f.type === 'positive').length,
    negative: feedbackStore.filter((f) => f.type === 'negative').length,
    recentFeedback: feedbackStore.slice(-10),
  };

  return NextResponse.json(stats);
}
