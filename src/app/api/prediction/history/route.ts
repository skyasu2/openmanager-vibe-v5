/**
 * 📊 GET /api/prediction/history - 예측 이력 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { predictiveAnalysisEngine } from '@/engines/PredictiveAnalysisEngine';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serverId = searchParams.get('serverId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');

    // 예측 이력 조회
    const allHistory = predictiveAnalysisEngine.getPredictionHistory(serverId || undefined);
    
    // 페이지네이션 적용
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedHistory = allHistory
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()) // 최신순 정렬
      .slice(startIndex, endIndex);

    // 통계 정보 계산
    const totalPredictions = allHistory.length;
    const accuratePredictions = allHistory.filter(h => 
      h.actualOutcome && h.actualOutcome.accuracy >= 70
    ).length;

    const overallAccuracy = totalPredictions > 0 
      ? (accuratePredictions / totalPredictions) * 100 
      : 0;

    // 심각도별 통계
    const severityStats = allHistory.reduce((acc, history) => {
      const severity = history.prediction.severity;
      acc[severity] = (acc[severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 분석 타입별 통계
    const analysisTypeStats = allHistory.reduce((acc, history) => {
      const type = history.prediction.analysisType;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      data: {
        history: paginatedHistory,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalPredictions / limit),
          totalItems: totalPredictions,
          itemsPerPage: limit
        },
        statistics: {
          totalPredictions,
          accuratePredictions,
          overallAccuracy: Math.round(overallAccuracy * 100) / 100,
          severityDistribution: severityStats,
          analysisTypeDistribution: analysisTypeStats
        }
      },
      message: '예측 이력을 성공적으로 조회했습니다'
    });

  } catch (error) {
    console.error('🚨 예측 이력 조회 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '예측 이력 조회 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serverId = searchParams.get('serverId');

    if (serverId) {
      // 특정 서버의 이력만 삭제 (구현 필요)
      return NextResponse.json({
        success: false,
        message: '특정 서버 이력 삭제는 아직 지원되지 않습니다'
      });
    }

    // 전체 이력 정리 (48시간 이상된 데이터)
    predictiveAnalysisEngine.cleanup();

    return NextResponse.json({
      success: true,
      message: '오래된 예측 이력이 성공적으로 정리되었습니다'
    });

  } catch (error) {
    console.error('🚨 예측 이력 정리 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '예측 이력 정리 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 