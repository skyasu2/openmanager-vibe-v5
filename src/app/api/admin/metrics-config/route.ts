import { NextRequest, NextResponse } from 'next/server';

// 메트릭 설정 기본값
const defaultMetricsConfig = {
  refreshInterval: 30000,
  retentionPeriod: 86400000, // 24시간
  alertThresholds: {
    cpu: 80,
    memory: 85,
    disk: 90,
    network: 70,
  },
  enabledMetrics: ['cpu', 'memory', 'disk', 'network', 'processes'],
  aggregationLevel: 'minute',
  compression: true,
};

export async function GET(request: NextRequest) {
  try {
    // 실제 환경에서는 데이터베이스나 설정 파일에서 로드
    const config = defaultMetricsConfig;

    return NextResponse.json({
      success: true,
      data: config,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Admin metrics config GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load metrics configuration',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const newConfig = await request.json();

    // 설정 유효성 검사
    if (!newConfig.refreshInterval || newConfig.refreshInterval < 1000) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid refresh interval (minimum 1000ms)',
        },
        { status: 400 }
      );
    }

    // 실제 환경에서는 데이터베이스나 설정 파일에 저장
    console.log('💾 Admin metrics config updated:', newConfig);

    return NextResponse.json({
      success: true,
      message: 'Metrics configuration updated successfully',
      data: { ...defaultMetricsConfig, ...newConfig },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Admin metrics config POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update metrics configuration',
      },
      { status: 500 }
    );
  }
}
