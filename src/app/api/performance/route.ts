import { NextRequest, NextResponse } from 'next/server';
import { CentralizedPerformanceMonitor } from '@/services/monitoring/CentralizedPerformanceMonitor';

/**
 * 🔧 성능 모니터링 API
 * GET /api/performance - 성능 메트릭 조회
 * POST /api/performance - 모니터링 제어
 */

const performanceMonitor = CentralizedPerformanceMonitor.getInstance();

// 🚨 개발 환경에서 성능 모니터링 차단 (Vercel 과금 방지)
function isMonitoringDisabled(): boolean {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const forceDisabled = process.env.PERFORMANCE_MONITORING_ENABLED === 'false';
  return isDevelopment || forceDisabled;
}

export async function GET(request: NextRequest) {
  // 🚨 개발 환경에서 차단
  if (isMonitoringDisabled()) {
    return NextResponse.json(
      {
        success: false,
        message:
          '개발 환경에서 성능 모니터링이 비활성화되었습니다 (Vercel 과금 방지)',
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
      },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const hours = parseInt(searchParams.get('hours') || '24');

    switch (action) {
      case 'current':
        const currentMetrics = performanceMonitor.getCurrentMetrics();
        return NextResponse.json({
          success: true,
          data: currentMetrics,
          timestamp: new Date().toISOString(),
        });

      case 'history':
        const history = performanceMonitor.getMetricsHistory(hours);
        return NextResponse.json({
          success: true,
          data: history,
          count: history.length,
          period: `${hours}시간`,
          timestamp: new Date().toISOString(),
        });

      case 'alerts':
        const alerts = performanceMonitor.getActiveAlerts();
        return NextResponse.json({
          success: true,
          data: alerts,
          count: alerts.length,
          timestamp: new Date().toISOString(),
        });

      case 'stats':
        const stats = performanceMonitor.getStats();
        return NextResponse.json({
          success: true,
          data: stats,
          timestamp: new Date().toISOString(),
        });

      case 'collect':
        const metrics = await performanceMonitor.collectAllMetrics();
        return NextResponse.json({
          success: true,
          data: metrics,
          message: '메트릭이 성공적으로 수집되었습니다.',
          timestamp: new Date().toISOString(),
        });

      default:
        const overview = {
          current: performanceMonitor.getCurrentMetrics(),
          stats: performanceMonitor.getStats(),
          activeAlerts: performanceMonitor.getActiveAlerts().length,
        };

        return NextResponse.json({
          success: true,
          data: overview,
          timestamp: new Date().toISOString(),
        });
    }
  } catch (error) {
    console.error('🚨 성능 모니터링 API 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '성능 모니터링 데이터 조회 실패',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // 🚨 개발 환경에서 차단
  if (isMonitoringDisabled()) {
    return NextResponse.json(
      {
        success: false,
        message:
          '개발 환경에서 성능 모니터링 제어가 비활성화되었습니다 (Vercel 과금 방지)',
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
      },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'start':
        await performanceMonitor.startMonitoring();
        return NextResponse.json({
          success: true,
          message: '성능 모니터링이 시작되었습니다.',
          timestamp: new Date().toISOString(),
        });

      case 'stop':
        await performanceMonitor.stopMonitoring();
        return NextResponse.json({
          success: true,
          message: '성능 모니터링이 중지되었습니다.',
          timestamp: new Date().toISOString(),
        });

      case 'restart':
        await performanceMonitor.restart();
        return NextResponse.json({
          success: true,
          message: '성능 모니터링이 재시작되었습니다.',
          timestamp: new Date().toISOString(),
        });

      case 'disable':
        await performanceMonitor.stopMonitoring();
        return NextResponse.json({
          success: true,
          message: '성능 모니터링이 비활성화되었습니다 (과금 절약 모드)',
          timestamp: new Date().toISOString(),
        });

      case 'enable':
        await performanceMonitor.startMonitoring();
        return NextResponse.json({
          success: true,
          message: '성능 모니터링이 활성화되었습니다',
          timestamp: new Date().toISOString(),
        });

      case 'cost-saving':
        // 과금 절약 모드: 간격을 크게 늘림
        performanceMonitor.updateConfig({
          intervals: {
            systemMetrics: 600000, // 10분
            applicationMetrics: 1200000, // 20분
            aiMetrics: 1200000, // 20분
            optimization: 3600000, // 1시간
          },
          alerts: {
            enabled: false, // 알림 비활성화
            thresholds: {
              cpu: 80,
              memory: 85,
              disk: 90,
              responseTime: 2000,
              errorRate: 0.05,
              aiAccuracy: 0.7,
            },
          },
        });
        return NextResponse.json({
          success: true,
          message: '과금 절약 모드가 활성화되었습니다',
          config: performanceMonitor.getStats().config,
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: '지원하지 않는 액션입니다.',
            supportedActions: [
              'start',
              'stop',
              'restart',
              'disable',
              'enable',
              'cost-saving',
            ],
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('🚨 성능 모니터링 API 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '성능 모니터링 작업 실패',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
