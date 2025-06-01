/**
 * 📈 GET /api/prediction/accuracy - 예측 정확도 통계
 */

import { NextRequest, NextResponse } from 'next/server';
import { predictiveAnalysisEngine } from '@/engines/PredictiveAnalysisEngine';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serverId = searchParams.get('serverId');
    const timeRange = searchParams.get('timeRange') || '24h'; // 24h, 7d, 30d

    // 예측 정확도 계산
    const accuracy = await predictiveAnalysisEngine.calculateAccuracy(serverId || undefined);
    
    // 전체 예측 이력 조회
    const allHistory = predictiveAnalysisEngine.getPredictionHistory(serverId || undefined);
    
    // 시간대별 필터링
    let timeRangeMs: number;
    switch (timeRange) {
      case '7d':
        timeRangeMs = 7 * 24 * 60 * 60 * 1000;
        break;
      case '30d':
        timeRangeMs = 30 * 24 * 60 * 60 * 1000;
        break;
      case '24h':
      default:
        timeRangeMs = 24 * 60 * 60 * 1000;
        break;
    }

    const cutoffTime = new Date(Date.now() - timeRangeMs);
    const recentHistory = allHistory.filter(h => h.timestamp >= cutoffTime);

    // 시간대별 정확도 계산
    const hourlyAccuracy: { [hour: string]: { total: number; accurate: number; accuracy: number } } = {};
    
    recentHistory.forEach(history => {
      const hour = history.timestamp.getHours().toString().padStart(2, '0');
      if (!hourlyAccuracy[hour]) {
        hourlyAccuracy[hour] = { total: 0, accurate: 0, accuracy: 0 };
      }
      
      hourlyAccuracy[hour].total++;
      if (history.actualOutcome && history.actualOutcome.accuracy >= 70) {
        hourlyAccuracy[hour].accurate++;
      }
    });

    // 시간대별 정확도 퍼센트 계산
    Object.keys(hourlyAccuracy).forEach(hour => {
      const data = hourlyAccuracy[hour];
      data.accuracy = data.total > 0 ? (data.accurate / data.total) * 100 : 0;
    });

    // 심각도별 정확도
    const severityAccuracy: { [severity: string]: { total: number; accurate: number; accuracy: number } } = {};
    
    recentHistory.forEach(history => {
      const severity = history.prediction.severity;
      if (!severityAccuracy[severity]) {
        severityAccuracy[severity] = { total: 0, accurate: 0, accuracy: 0 };
      }
      
      severityAccuracy[severity].total++;
      if (history.actualOutcome && history.actualOutcome.accuracy >= 70) {
        severityAccuracy[severity].accurate++;
      }
    });

    Object.keys(severityAccuracy).forEach(severity => {
      const data = severityAccuracy[severity];
      data.accuracy = data.total > 0 ? (data.accurate / data.total) * 100 : 0;
    });

    // 예측 타입별 정확도
    const typeAccuracy: { [type: string]: { total: number; accurate: number; accuracy: number } } = {};
    
    recentHistory.forEach(history => {
      const type = history.prediction.analysisType;
      if (!typeAccuracy[type]) {
        typeAccuracy[type] = { total: 0, accurate: 0, accuracy: 0 };
      }
      
      typeAccuracy[type].total++;
      if (history.actualOutcome && history.actualOutcome.accuracy >= 70) {
        typeAccuracy[type].accurate++;
      }
    });

    Object.keys(typeAccuracy).forEach(type => {
      const data = typeAccuracy[type];
      data.accuracy = data.total > 0 ? (data.accurate / data.total) * 100 : 0;
    });

    // 최근 트렌드 분석 (최근 10개 예측)
    const recentPredictions = recentHistory
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);

    const recentAccuracyTrend = recentPredictions.map(h => ({
      timestamp: h.timestamp,
      accuracy: h.actualOutcome?.accuracy || 0,
      confidence: h.prediction.confidence,
      severity: h.prediction.severity
    }));

    // 종합 통계
    const totalPredictions = recentHistory.length;
    const accuratePredictions = recentHistory.filter(h => 
      h.actualOutcome && h.actualOutcome.accuracy >= 70
    ).length;

    const recentOverallAccuracy = totalPredictions > 0 
      ? (accuratePredictions / totalPredictions) * 100 
      : 0;

    // 성능 메트릭
    const averageConfidence = recentHistory.length > 0 
      ? recentHistory.reduce((sum, h) => sum + h.prediction.confidence, 0) / recentHistory.length
      : 0;

    const falsePositiveRate = recentHistory.length > 0
      ? (recentHistory.filter(h => 
          h.actualOutcome && !h.actualOutcome.occurred && h.prediction.failureProbability > 50
        ).length / recentHistory.length) * 100
      : 0;

    const falseNegativeRate = recentHistory.length > 0
      ? (recentHistory.filter(h => 
          h.actualOutcome && h.actualOutcome.occurred && h.prediction.failureProbability < 50
        ).length / recentHistory.length) * 100
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        overallAccuracy: {
          global: accuracy.overall,
          recent: Math.round(recentOverallAccuracy * 100) / 100,
          byServer: accuracy.byServer
        },
        timeRangeStats: {
          range: timeRange,
          totalPredictions,
          accuratePredictions,
          accuracy: Math.round(recentOverallAccuracy * 100) / 100
        },
        detailedAnalysis: {
          hourlyAccuracy,
          severityAccuracy,
          typeAccuracy
        },
        performanceMetrics: {
          averageConfidence: Math.round(averageConfidence * 100) / 100,
          falsePositiveRate: Math.round(falsePositiveRate * 100) / 100,
          falseNegativeRate: Math.round(falseNegativeRate * 100) / 100
        },
        trends: {
          recent: recentAccuracyTrend,
          improvement: recentAccuracyTrend.length >= 2 
            ? recentAccuracyTrend[0].accuracy - recentAccuracyTrend[recentAccuracyTrend.length - 1].accuracy
            : 0
        }
      },
      message: `${timeRange} 기간 예측 정확도 통계를 성공적으로 계산했습니다`
    });

  } catch (error) {
    console.error('🚨 예측 정확도 계산 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '예측 정확도 계산 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 