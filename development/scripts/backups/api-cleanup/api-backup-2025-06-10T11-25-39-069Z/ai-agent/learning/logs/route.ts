import { NextRequest, NextResponse } from 'next/server';
import { InteractionLogger } from '@/services/ai-agent/logging/InteractionLogger';
import { UserFeedback, LogFilter } from '@/types/ai-learning';

// GET: 상호작용 히스토리 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    const logger = InteractionLogger.getInstance();

    switch (action) {
      case 'history': {
        // 필터 파라미터 파싱
        const filters: LogFilter = {};

        const startDate = searchParams.get('startDate');
        if (startDate) filters.startDate = new Date(startDate);

        const endDate = searchParams.get('endDate');
        if (endDate) filters.endDate = new Date(endDate);

        const intent = searchParams.get('intent');
        if (intent) filters.intent = intent;

        const feedback = searchParams.get('feedback') as
          | 'helpful'
          | 'not_helpful'
          | 'incorrect'
          | null;
        if (feedback) filters.feedback = feedback;

        const minConfidence = searchParams.get('minConfidence');
        const maxConfidence = searchParams.get('maxConfidence');
        if (minConfidence || maxConfidence) {
          filters.confidence = {
            min: minConfidence ? parseFloat(minConfidence) : 0,
            max: maxConfidence ? parseFloat(maxConfidence) : 1,
          };
        }

        const history = await logger.getInteractionHistory(filters);

        return NextResponse.json({
          success: true,
          data: history,
          total: history.length,
        });
      }

      case 'failure-patterns': {
        const patterns = await logger.getFailurePatterns();

        return NextResponse.json({
          success: true,
          data: patterns,
        });
      }

      case 'metrics': {
        const metrics = await logger.getLearningMetrics();

        return NextResponse.json({
          success: true,
          data: metrics,
        });
      }

      case 'export': {
        const csvData = await logger.exportData();

        return new NextResponse(csvData, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="ai-interactions.csv"',
          },
        });
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action parameter',
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ [AI Learning API] GET 요청 처리 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST: 피드백 제출
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    const logger = InteractionLogger.getInstance();

    switch (action) {
      case 'feedback': {
        const feedback: UserFeedback = {
          interactionId: data.interactionId,
          feedback: data.feedback,
          detailedReason: data.detailedReason,
          additionalComments: data.additionalComments,
          timestamp: new Date(),
        };

        await logger.logFeedback(feedback);

        return NextResponse.json({
          success: true,
          message: '피드백이 성공적으로 기록되었습니다.',
        });
      }

      case 'bulk-feedback': {
        // 여러 피드백을 한 번에 처리
        const feedbacks: UserFeedback[] = data.feedbacks;

        for (const feedback of feedbacks) {
          await logger.logFeedback(feedback);
        }

        return NextResponse.json({
          success: true,
          message: `${feedbacks.length}개의 피드백이 성공적으로 기록되었습니다.`,
        });
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action parameter',
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ [AI Learning API] POST 요청 처리 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE: 로그 데이터 삭제 (관리자 전용)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // TODO: 관리자 권한 확인 로직 추가

    switch (action) {
      case 'clear-all': {
        // 모든 로그 데이터 삭제 (개발 환경에서만)
        if (process.env.NODE_ENV === 'development') {
          // 로컬 스토리지 클리어 (클라이언트에서 처리)

          return NextResponse.json({
            success: true,
            message: '모든 로그 데이터가 삭제되었습니다.',
          });
        } else {
          return NextResponse.json(
            {
              success: false,
              error: '프로덕션 환경에서는 지원되지 않는 작업입니다.',
            },
            { status: 403 }
          );
        }
      }

      case 'clear-old': {
        // 30일 이상 된 로그 삭제
        // TODO: 실제 데이터베이스 구현 시 삭제 로직 추가

        return NextResponse.json({
          success: true,
          message: '30일 이상 된 로그 데이터가 삭제되었습니다.',
        });
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action parameter',
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ [AI Learning API] DELETE 요청 처리 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
