/**
 * 🚀 최적화된 데이터 생성기 API
 * MetricsGenerator를 사용한 신규 아키텍처
 */

import { NextRequest, NextResponse } from 'next/server';
import { MetricsGenerator } from '../../../../services/data-generator/modules/MetricsGenerator';

/**
 * GET: 메트릭 데이터 조회
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const count = parseInt(searchParams.get('count') || '20');

    const metricsGenerator = new MetricsGenerator();
    const metrics = await metricsGenerator.generateMetrics(count);

    return NextResponse.json({
      success: true,
      data: metrics,
      count: metrics.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('메트릭 데이터 조회 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}

/**
 * POST: 메트릭 데이터 생성
 */
export async function POST(request: NextRequest) {
  try {
    const { servers = 50 } = await request.json();
    const metricsGenerator = new MetricsGenerator();

    // 메트릭 생성
    const results = await metricsGenerator.generateMetrics(servers);

    return NextResponse.json({
      success: true,
      data: results,
      count: results.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('최적화된 데이터 생성 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
