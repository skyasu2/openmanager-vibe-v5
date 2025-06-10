import { NextRequest, NextResponse } from 'next/server';
import { PatternAnalysisService } from '@/services/ai-agent/PatternAnalysisService';

// GET: 패턴 분석 결과 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    const analysisService = PatternAnalysisService.getInstance();

    switch (action) {
      case 'run-analysis': {
        // 전체 패턴 분석 실행
        const report = await analysisService.runFullAnalysis();

        return NextResponse.json({
          success: true,
          data: report,
          message: '패턴 분석이 완료되었습니다.',
        });
      }

      case 'latest-report': {
        // 최신 분석 보고서 조회
        const latestReport = analysisService.getLatestReport();

        if (!latestReport) {
          return NextResponse.json(
            {
              success: false,
              error: '분석 보고서가 없습니다. 먼저 분석을 실행하세요.',
            },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          data: latestReport,
        });
      }

      case 'analysis-history': {
        // 분석 히스토리 조회
        const history = analysisService.getAnalysisHistory();

        return NextResponse.json({
          success: true,
          data: history,
          total: history.length,
        });
      }

      case 'learning-metrics': {
        // 학습 메트릭 조회
        const metrics = await analysisService.getLearningMetrics();

        return NextResponse.json({
          success: true,
          data: metrics,
        });
      }

      case 'compare-patterns': {
        // 패턴 성능 비교
        const oldPatternId = searchParams.get('oldPatternId');
        const newPatternId = searchParams.get('newPatternId');

        if (!oldPatternId || !newPatternId) {
          return NextResponse.json(
            {
              success: false,
              error: 'oldPatternId와 newPatternId가 필요합니다.',
            },
            { status: 400 }
          );
        }

        const comparison = await analysisService.comparePatterns(
          oldPatternId,
          newPatternId
        );

        if (!comparison) {
          return NextResponse.json(
            {
              success: false,
              error: '패턴 비교에 실패했습니다.',
            },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          data: comparison,
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
    console.error('❌ [Pattern Analysis API] GET 요청 처리 실패:', error);

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

// POST: 패턴 제안 관리 및 테스트 시작
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    const analysisService = PatternAnalysisService.getInstance();

    switch (action) {
      case 'approve-suggestion': {
        // 패턴 제안 승인
        const { suggestionId } = data;

        if (!suggestionId) {
          return NextResponse.json(
            {
              success: false,
              error: 'suggestionId가 필요합니다.',
            },
            { status: 400 }
          );
        }

        const success =
          await analysisService.approvePatternSuggestion(suggestionId);

        return NextResponse.json({
          success,
          message: success
            ? '패턴 제안이 승인되었습니다.'
            : '패턴 제안 승인에 실패했습니다.',
        });
      }

      case 'reject-suggestion': {
        // 패턴 제안 거부
        const { suggestionId, reason } = data;

        if (!suggestionId) {
          return NextResponse.json(
            {
              success: false,
              error: 'suggestionId가 필요합니다.',
            },
            { status: 400 }
          );
        }

        const success = await analysisService.rejectPatternSuggestion(
          suggestionId,
          reason
        );

        return NextResponse.json({
          success,
          message: success
            ? '패턴 제안이 거부되었습니다.'
            : '패턴 제안 거부에 실패했습니다.',
        });
      }

      case 'start-test': {
        // A/B 테스트 시작
        const { suggestion } = data;

        if (!suggestion) {
          return NextResponse.json(
            {
              success: false,
              error: 'suggestion 데이터가 필요합니다.',
            },
            { status: 400 }
          );
        }

        const testResult = await analysisService.startPatternTest(suggestion);

        if (!testResult) {
          return NextResponse.json(
            {
              success: false,
              error:
                'A/B 테스트 시작에 실패했습니다. (최대 동시 테스트 수 초과 가능)',
            },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          data: testResult,
          message: 'A/B 테스트가 시작되었습니다.',
        });
      }

      case 'bulk-approve': {
        // 여러 제안 일괄 승인
        const { suggestionIds } = data;

        if (!Array.isArray(suggestionIds) || suggestionIds.length === 0) {
          return NextResponse.json(
            {
              success: false,
              error: 'suggestionIds 배열이 필요합니다.',
            },
            { status: 400 }
          );
        }

        const results = await Promise.all(
          suggestionIds.map(id => analysisService.approvePatternSuggestion(id))
        );

        const successCount = results.filter(r => r).length;

        return NextResponse.json({
          success: true,
          data: {
            total: suggestionIds.length,
            successful: successCount,
            failed: suggestionIds.length - successCount,
          },
          message: `${successCount}/${suggestionIds.length}개의 제안이 승인되었습니다.`,
        });
      }

      case 'auto-approve-high-confidence': {
        // 높은 신뢰도 제안 자동 승인
        const { confidenceThreshold = 0.85 } = data;

        const latestReport = analysisService.getLatestReport();
        if (!latestReport) {
          return NextResponse.json(
            {
              success: false,
              error: '분석 보고서가 없습니다. 먼저 분석을 실행하세요.',
            },
            { status: 404 }
          );
        }

        const highConfidenceSuggestions = latestReport.suggestions.filter(
          s => s.confidenceScore >= confidenceThreshold
        );

        const results = await Promise.all(
          highConfidenceSuggestions.map(s =>
            analysisService.approvePatternSuggestion(s.id)
          )
        );

        const successCount = results.filter(r => r).length;

        return NextResponse.json({
          success: true,
          data: {
            threshold: confidenceThreshold,
            total: highConfidenceSuggestions.length,
            successful: successCount,
            failed: highConfidenceSuggestions.length - successCount,
          },
          message: `신뢰도 ${confidenceThreshold} 이상의 ${successCount}개 제안이 자동 승인되었습니다.`,
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
    console.error('❌ [Pattern Analysis API] POST 요청 처리 실패:', error);

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

// PUT: 분석 설정 업데이트
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { config } = body;

    if (!config) {
      return NextResponse.json(
        {
          success: false,
          error: 'config 데이터가 필요합니다.',
        },
        { status: 400 }
      );
    }

    // 새로운 설정으로 서비스 재초기화
    PatternAnalysisService.getInstance(config);

    return NextResponse.json({
      success: true,
      message: '분석 설정이 업데이트되었습니다.',
      data: config,
    });
  } catch (error) {
    console.error('❌ [Pattern Analysis API] PUT 요청 처리 실패:', error);

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

// DELETE: 분석 데이터 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'clear-history': {
        // 분석 히스토리 삭제 (개발 환경에서만)
        if (process.env.NODE_ENV === 'development') {
          // TODO: 실제 히스토리 삭제 구현

          return NextResponse.json({
            success: true,
            message: '분석 히스토리가 삭제되었습니다.',
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

      case 'cancel-test': {
        // A/B 테스트 취소
        const testId = searchParams.get('testId');

        if (!testId) {
          return NextResponse.json(
            {
              success: false,
              error: 'testId가 필요합니다.',
            },
            { status: 400 }
          );
        }

        // TODO: 테스트 취소 구현

        return NextResponse.json({
          success: true,
          message: `테스트 ${testId}가 취소되었습니다.`,
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
    console.error('❌ [Pattern Analysis API] DELETE 요청 처리 실패:', error);

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
