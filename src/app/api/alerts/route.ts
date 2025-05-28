import { NextRequest, NextResponse } from 'next/server';

/**
 * 🚨 알림 조회 API
 * GET /api/alerts
 * 시스템 알림 목록을 반환합니다
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🚨 알림 목록 조회 API 호출');

    // 모의 알림 데이터 생성
    const alerts = [
      {
        id: 'alert-001',
        server_id: 'api-prod-01',
        type: 'cpu',
        severity: 'warning',
        message: 'CPU 사용률이 80%를 초과했습니다',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        resolved: false
      },
      {
        id: 'alert-002', 
        server_id: 'api-prod-01',
        type: 'memory',
        severity: 'critical',
        message: '메모리 사용률이 90%를 초과했습니다',
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        resolved: false
      },
      {
        id: 'alert-003',
        server_id: 'web-prod-01',
        type: 'response_time',
        severity: 'warning',
        message: '응답 시간이 평균보다 느립니다',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        resolved: true
      }
    ];

    // 알림 통계 생성
    const summary = {
      total: alerts.length,
      critical: alerts.filter(a => a.severity === 'critical').length,
      warning: alerts.filter(a => a.severity === 'warning').length,
      resolved: alerts.filter(a => a.resolved).length,
      unresolved: alerts.filter(a => !a.resolved).length
    };

    return NextResponse.json({
      success: true,
      message: `${alerts.length}개 알림 조회 완료`,
      data: {
        alerts,
        summary,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ 알림 목록 조회 오류:', error);
    
    return NextResponse.json({
      success: false,
      message: '알림 조회에 실패했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
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