/**
 * 🧠 지능형 모니터링 상태 조회 API
 */

import { NextRequest, NextResponse } from 'next/server';

// 임시 메모리 저장소 (실제로는 Redis나 데이터베이스 사용)
const analysisStatusStore = new Map<
  string,
  {
    status: 'running' | 'completed' | 'failed';
    progress: number;
    currentStep: string;
    startTime: Date;
    result?: any;
  }
>();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const analysisId = searchParams.get('analysisId');

    if (analysisId) {
      // 특정 분석 상태 조회
      const status = analysisStatusStore.get(analysisId);

      if (!status) {
        return NextResponse.json(
          {
            success: false,
            error: '분석 ID를 찾을 수 없습니다.',
            analysisId,
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          analysisId,
          ...status,
          elapsedTime: Date.now() - status.startTime.getTime(),
        },
      });
    } else {
      // 전체 활성 분석 목록 조회
      const activeAnalyses = Array.from(analysisStatusStore.entries()).map(
        ([id, status]) => ({
          analysisId: id,
          ...status,
          elapsedTime: Date.now() - status.startTime.getTime(),
        })
      );

      return NextResponse.json({
        success: true,
        data: {
          activeAnalyses,
          totalCount: activeAnalyses.length,
          runningCount: activeAnalyses.filter(a => a.status === 'running')
            .length,
          completedCount: activeAnalyses.filter(a => a.status === 'completed')
            .length,
          failedCount: activeAnalyses.filter(a => a.status === 'failed').length,
        },
      });
    }
  } catch (error) {
    console.error('❌ 지능형 모니터링 상태 조회 API 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '상태 조회 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const analysisId = searchParams.get('analysisId');

    if (!analysisId) {
      return NextResponse.json(
        {
          success: false,
          error: '분석 ID가 필요합니다.',
        },
        { status: 400 }
      );
    }

    const deleted = analysisStatusStore.delete(analysisId);

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          error: '분석 ID를 찾을 수 없습니다.',
          analysisId,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '분석 상태가 삭제되었습니다.',
      analysisId,
    });
  } catch (error) {
    console.error('❌ 지능형 모니터링 상태 삭제 API 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '상태 삭제 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
