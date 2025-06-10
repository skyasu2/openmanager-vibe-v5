import { NextRequest, NextResponse } from 'next/server';
import { GeminiLearningEngine } from '@/modules/ai-agent/learning/GeminiLearningEngine';

/**
 * 🤖 Gemini 학습 엔진 주기적 실행 크론 엔드포인트
 *
 * ✅ Vercel Cron Jobs 지원
 * ✅ 수동 트리거 지원 (관리자용)
 * ✅ 실패 로그 분석 → 컨텍스트 제안 생성
 * ✅ 무료 할당량 관리
 */

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 [Gemini Learning Cron] 주기적 실패 분석 시작...');

    // 1. 권한 확인 (Vercel Cron 또는 관리자)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    const isManualTrigger =
      request.nextUrl.searchParams.get('manual') === 'true';

    if (!isManualTrigger) {
      // Vercel Cron Jobs 인증
      if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
          {
            success: false,
            error: '인증 실패: 올바른 크론 시크릿이 필요합니다.',
          },
          { status: 401 }
        );
      }
    }

    // 2. Gemini 학습 엔진 인스턴스 획득
    const learningEngine = GeminiLearningEngine.getInstance();
    const status = learningEngine.getStatus();

    // 3. 상태 체크
    if (!status.enabled) {
      return NextResponse.json({
        success: false,
        message: 'Gemini 학습 엔진이 비활성화되어 있습니다.',
        status,
      });
    }

    if (status.remainingRequests <= 0) {
      return NextResponse.json({
        success: false,
        message: '일일 할당량을 모두 사용했습니다.',
        status,
      });
    }

    // 4. 주기적 분석 실행
    const startTime = Date.now();
    const suggestions = await learningEngine.runPeriodicAnalysis();
    const executionTime = Date.now() - startTime;

    // 5. 결과 응답
    return NextResponse.json({
      success: true,
      message: `Gemini 학습 분석 완료: ${suggestions.length}개의 개선 제안 생성`,
      data: {
        suggestionsCount: suggestions.length,
        executionTime,
        suggestions: suggestions.map(s => ({
          id: s.id,
          title: s.title,
          type: s.type,
          confidence: s.confidence,
          priority: s.priority,
          estimatedImprovement: s.estimatedImprovement,
          sourceLogCount: s.sourceLogIds.length,
        })),
      },
      status: learningEngine.getStatus(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ [Gemini Learning Cron] 실행 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Gemini 학습 분석 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * 🔧 수동 트리거 (관리자용)
 */
export async function POST(request: NextRequest) {
  try {
    // 관리자 권한 확인 (실제 구현에서는 세션 확인)
    const sessionId = request.headers.get('x-session-id');

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: '관리자 권한이 필요합니다.',
        },
        { status: 403 }
      );
    }

    // 수동 트리거로 GET 요청 재실행
    const url = new URL(request.url);
    url.searchParams.set('manual', 'true');

    return GET(
      new NextRequest(url.toString(), {
        headers: request.headers,
      })
    );
  } catch (error) {
    console.error('❌ [Gemini Learning Manual] 수동 실행 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: '수동 실행 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
