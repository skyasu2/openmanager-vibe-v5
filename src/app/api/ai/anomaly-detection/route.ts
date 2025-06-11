/**
 * 🚨 AI 이상 탐지 엔드포인트 v5.43.0 - 경량 ML 엔진 기반
 *
 * 완전히 리팩터링된 이상 탐지 API:
 * - TensorFlow 완전 제거
 * - Z-Score 기반 통계적 이상 탐지
 * - 실시간 메트릭 분석
 * - Vercel 서버리스 최적화
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  detectAnomalies,
  generateRecommendations,
} from '@/lib/ml/lightweight-ml-engine';
import type { MetricPoint } from '@/lib/ml/lightweight-ml-engine';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🚨 AI 이상 탐지 API 호출 시작');

    const body = await request.json();
    const { history, threshold = 2.5, serverId } = body;

    if (!Array.isArray(history) || history.length === 0) {
      return NextResponse.json(
        { error: '히스토리 데이터가 필요합니다.' },
        { status: 400 }
      );
    }

    // 이상 탐지 실행
    const anomalies = detectAnomalies(history as MetricPoint[], threshold);

    // 추천사항 생성
    const recommendations = generateRecommendations(history as MetricPoint[]);

    // 이상 탐지 결과 분석
    const analysis = {
      anomaly_count: anomalies.length,
      anomaly_rate: (anomalies.length / history.length) * 100,
      severity:
        anomalies.length > history.length * 0.1
          ? 'high'
          : anomalies.length > history.length * 0.05
            ? 'medium'
            : 'low',
      latest_anomaly:
        anomalies.length > 0 ? anomalies[anomalies.length - 1] : null,
    };

    console.log(`✅ 이상 탐지 완료: ${anomalies.length}개 발견`);

    return NextResponse.json({
      success: true,
      data: {
        anomalies,
        analysis,
        recommendations,
        threshold_used: threshold,
      },
      meta: {
        serverId: serverId || 'unknown',
        total_points: history.length,
        anomaly_count: anomalies.length,
        generatedAt: new Date().toISOString(),
        engine: 'lightweight-ml-v5.43.0',
      },
    });
  } catch (error) {
    console.error('❌ AI 이상 탐지 API 오류:', error);

    return NextResponse.json(
      {
        error: '이상 탐지 처리 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serverId = searchParams.get('serverId');
    const threshold = parseFloat(searchParams.get('threshold') || '2.5');

    if (!serverId) {
      return NextResponse.json(
        { error: '서버 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 샘플 히스토리 데이터 생성 (실제 구현에서는 데이터 소스에서 가져옴)
    const sampleHistory: MetricPoint[] = Array.from(
      { length: 100 },
      (_, i) => ({
        timestamp: new Date(Date.now() - (100 - i) * 60 * 1000).toISOString(),
        cpu: Math.random() * 80 + 10, // 10-90% 사이의 CPU 사용률
        memory: Math.random() * 70 + 20, // 20-90% 사이의 메모리 사용률
      })
    );

    // 인위적인 이상값 추가 (테스트용)
    if (Math.random() > 0.7) {
      sampleHistory[Math.floor(Math.random() * sampleHistory.length)] = {
        timestamp: new Date().toISOString(),
        cpu: 95 + Math.random() * 5, // 95-100% 비정상적으로 높은 CPU
        memory: 90 + Math.random() * 10, // 90-100% 비정상적으로 높은 메모리
      };
    }

    const anomalies = detectAnomalies(sampleHistory, threshold);
    const recommendations = generateRecommendations(sampleHistory);

    const analysis = {
      anomaly_count: anomalies.length,
      anomaly_rate: (anomalies.length / sampleHistory.length) * 100,
      severity:
        anomalies.length > sampleHistory.length * 0.1
          ? 'high'
          : anomalies.length > sampleHistory.length * 0.05
            ? 'medium'
            : 'low',
      latest_anomaly:
        anomalies.length > 0 ? anomalies[anomalies.length - 1] : null,
    };

    return NextResponse.json({
      success: true,
      data: {
        anomalies,
        analysis,
        recommendations,
        threshold_used: threshold,
      },
      meta: {
        serverId,
        total_points: sampleHistory.length,
        anomaly_count: anomalies.length,
        generatedAt: new Date().toISOString(),
        engine: 'lightweight-ml-v5.43.0',
      },
    });
  } catch (error) {
    console.error('❌ AI 이상 탐지 API 오류:', error);

    return NextResponse.json(
      {
        error: '이상 탐지 처리 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
