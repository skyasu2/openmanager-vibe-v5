/**
 * 📊 ML Analytics API Route
 *
 * Google Cloud Functions 100% 사용 (실제 클라우드 환경)
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { analyzeMLMetrics } from '@/lib/gcp/gcp-functions-client';
import { getErrorMessage } from '@/types/type-utils';
import debug from '@/utils/debug';

interface MLAnalysisData {
  analysis_type: string;
  metrics_count: number;
  summary: {
    cpu_average: number;
    memory_average: number;
    trend: string;
    health_score: number;
  };
  anomalies: Array<{
    type: string;
    severity: string;
    value: number;
    threshold: number;
  }>;
  prediction: {
    next_hour_cpu: number;
    next_hour_memory: number;
    confidence: number;
  };
  processed_at: string;
  processing_time_ms: number;
  region: string;
  country: string;
  [key: string]: unknown;
}

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // 요청 파싱
    const body = await request.json();
    const { metrics, context } = body;

    if (!metrics || !Array.isArray(metrics)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Metrics parameter is required and must be an array',
        },
        { status: 400 }
      );
    }

    // 메트릭 수 제한
    if (metrics.length > 10000) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many metrics. Maximum 10000 allowed.',
        },
        { status: 400 }
      );
    }

    debug.log('🌐 ML Analytics 요청 처리 중... (GCP Functions 100%)');

    // GCP Functions 호출
    const result = await analyzeMLMetrics(metrics, context);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'ML Analytics processing failed',
        },
        { status: 500 }
      );
    }

    // 성공 응답
    const mlData = result.data as MLAnalysisData;
    return NextResponse.json({
      success: true,
      data: result.data,
      source: 'gcp-functions',
      timestamp: new Date().toISOString(),
      performance: {
        metrics_analyzed: metrics.length,
        anomalies_found: mlData?.anomalies?.length || 0,
      },
    });
  } catch (error) {
    debug.error('❌ ML Analytics API 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS 요청 처리 (CORS)
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
