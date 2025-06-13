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
import { AnomalyDetectionService } from '@/services/ai/AnomalyDetectionService';
import { createSafeError } from '@/lib/error-handler';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Zod 스키마로 요청 본문 유효성 검사
const AnomalyDetectionRequestSchema = z.object({
  metrics: z.array(z.any()), // 간소화된 검증
  logs: z.array(z.any()), // 간소화된 검증
  config: z
    .object({
      statisticalSensitivity: z.number().min(1).max(5).optional(),
      logKeywords: z
        .object({
          warning: z.array(z.string()).optional(),
          critical: z.array(z.string()).optional(),
        })
        .optional(),
    })
    .optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 요청 본문 유효성 검사
    const validationResult = AnomalyDetectionRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: '잘못된 요청 형식입니다.',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { metrics, logs, config } = validationResult.data;

    const anomalyDetectionService = new AnomalyDetectionService();
    const anomalies = await anomalyDetectionService.detect(
      metrics,
      logs,
      config
    );

    return NextResponse.json({ success: true, anomalies });
  } catch (error) {
    const safeError = createSafeError(error);
    console.error('API Error in /api/ai/anomaly-detection:', safeError);

    return NextResponse.json(
      { success: false, error: safeError.message },
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
