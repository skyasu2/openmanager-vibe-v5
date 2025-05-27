import { NextRequest, NextResponse } from 'next/server';
import { monitoringService } from '@/services/ai/MonitoringService';
import { rateLimiters, withRateLimit } from '@/lib/rate-limiter';

/**
 * 📊 AI 시스템 모니터링 API
 * GET: 모니터링 데이터 조회 (Rate Limited: 1분에 30회)
 * POST: 헬스체크 실행 (Rate Limited: 1분에 30회)
 */

async function handleGET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';

    switch (type) {
      case 'metrics':
        return NextResponse.json({
          success: true,
          data: monitoringService.getAllMetrics()
        });

      case 'realtime':
        return NextResponse.json({
          success: true,
          data: monitoringService.getRealTimeStats()
        });

      case 'health':
        const healthCheck = await monitoringService.performHealthCheck();
        return NextResponse.json({
          success: true,
          data: healthCheck
        });

      case 'warmup':
        const allMetrics = monitoringService.getAllMetrics();
        return NextResponse.json({
          success: true,
          data: {
            warmup: allMetrics.warmup,
            pythonStatus: allMetrics.health.pythonServiceStatus,
            warmupHealth: allMetrics.health.warmupHealth
          }
        });

      case 'performance':
        const perfMetrics = monitoringService.getAllMetrics();
        return NextResponse.json({
          success: true,
          data: {
            performance: perfMetrics.performance,
            summary: perfMetrics.summary
          }
        });

      case 'errors':
        const errorMetrics = monitoringService.getAllMetrics();
        return NextResponse.json({
          success: true,
          data: {
            errors: errorMetrics.errors,
            systemStatus: errorMetrics.health.status
          }
        });

      default: // 'all'
        return NextResponse.json({
          success: true,
          data: monitoringService.getAllMetrics()
        });
    }

  } catch (error: any) {
    console.error('모니터링 API 오류:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch monitoring data',
      message: error.message
    }, { status: 500 });
  }
}

// Rate Limited exports
export const GET = withRateLimit(rateLimiters.monitoring, handleGET);
export const POST = withRateLimit(rateLimiters.monitoring, handlePOST);

/**
 * POST: 헬스체크 및 시스템 상태 확인
 */
async function handlePOST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    
    if (body.action === 'healthcheck') {
      const healthCheck = await monitoringService.performHealthCheck();
      
      return NextResponse.json({
        success: true,
        data: healthCheck,
        timestamp: new Date().toISOString()
      });
    }
    
    if (body.action === 'reset-metrics') {
      // 메트릭 리셋 (개발/테스트용)
      const newMonitoringService = await import('@/services/ai/MonitoringService');
      
      return NextResponse.json({
        success: true,
        message: '모니터링 메트릭이 리셋되었습니다',
        timestamp: new Date().toISOString()
      });
    }

    // 기본적으로 헬스체크 실행
    const healthCheck = await monitoringService.performHealthCheck();
    
    return NextResponse.json({
      success: true,
      data: healthCheck,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('모니터링 헬스체크 오류:', error);
    return NextResponse.json({
      success: false,
      error: 'Health check failed',
      message: error.message
    }, { status: 500 });
  }
} 