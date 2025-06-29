import { NextRequest, NextResponse } from 'next/server';

/**
 * 🚨 알림 조회 API
 * GET /api/alerts
 * 시스템 알림 목록을 반환합니다
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🚨 알림 목록 조회 API 호출');

    const alerts = generateMockAlerts();

    // 최신 순으로 정렬
    alerts.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // 알림 통계 생성
    const summary = {
      total: alerts.length,
      critical: alerts.filter(a => a.severity === 'critical').length,
      warning: alerts.filter(a => a.severity === 'warning').length,
      resolved: alerts.filter(a => a.resolved).length,
      unresolved: alerts.filter(a => !a.resolved).length,
    };

    return NextResponse.json({
      success: true,
      message: `${alerts.length}개 알림 조회 완료`,
      data: {
        alerts,
        summary,
        timestamp: new Date().toISOString(),
      },
      headers: {
        'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    console.error('❌ 알림 목록 조회 오류:', error);

    return NextResponse.json(
      {
        success: false,
        message: '알림 조회에 실패했습니다.',
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS - CORS 지원
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

const generateMockAlerts = () => {
  const alerts = [
    {
      id: 'alert-001',
      serverId: 'server-001',
      type: 'cpu' as const,
      message: 'CPU 사용률이 85%를 초과했습니다',
      severity: 'warning' as const,
      timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10분 전
      resolved: false,
    },
    {
      id: 'alert-002',
      serverId: 'server-003',
      type: 'memory' as const,
      message: '메모리 사용률이 90%를 초과했습니다',
      severity: 'critical' as const,
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5분 전
      resolved: false,
    },
    {
      id: 'alert-003',
      serverId: 'server-005',
      type: 'disk' as const,
      message: '디스크 공간이 부족합니다 (95% 사용 중)',
      severity: 'error' as const,
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30분 전
      resolved: false,
    },
    {
      id: 'alert-004',
      serverId: 'server-007',
      type: 'network' as const,
      message: '네트워크 연결이 불안정합니다',
      severity: 'warning' as const,
      timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1시간 전
      resolved: true,
    },
    {
      id: 'alert-005',
      serverId: 'server-002',
      type: 'service' as const,
      message: 'nginx 서비스가 중지되었습니다',
      severity: 'critical' as const,
      timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2분 전
      resolved: false,
    },
    {
      id: 'alert-006',
      serverId: 'server-010',
      type: 'cpu' as const,
      message: 'CPU 온도가 높습니다 (78°C)',
      severity: 'info' as const,
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45분 전
      resolved: false,
    },
  ];

  return alerts;
};
