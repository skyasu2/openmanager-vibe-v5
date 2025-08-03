/**
 * 📊 ML Analytics API Route
 * 
 * GCP Functions의 ml-analytics-engine을 호출하는 API
 * 개발 환경에서는 Mock 사용
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { analyzeMLMetrics, shouldUseMockGCPFunctions } from '@/lib/gcp/gcp-functions-client';
import { getErrorMessage } from '@/types/type-utils';

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

    console.log(`📊 ML Analytics 요청 처리 중... (Mock: ${shouldUseMockGCPFunctions})`);

    // GCP Functions 호출 (실제 또는 Mock)
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
    return NextResponse.json({
      success: true,
      data: result.data,
      source: shouldUseMockGCPFunctions ? 'mock' : 'gcp-functions',
      timestamp: new Date().toISOString(),
      performance: {
        metrics_analyzed: metrics.length,
        anomalies_found: (result.data as any)?.anomalies?.length || 0,
      },
    });

  } catch (error) {
    console.error('❌ ML Analytics API 오류:', error);
    
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