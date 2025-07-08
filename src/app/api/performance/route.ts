/**
 * 📊 성능 모니터링 API v1.0
 *
 * ✅ 실시간 성능 통계 조회
 * ✅ 알림 조회
 * ✅ 성능 메트릭 기록
 * ✅ 대시보드 데이터 제공
 */

import { PerformanceMonitor } from '@/services/ai/PerformanceMonitor';
import { UnifiedLogger } from '@/services/ai/UnifiedLogger';
import { NextRequest, NextResponse } from 'next/server';

const performanceMonitor = PerformanceMonitor.getInstance();
const logger = UnifiedLogger.getInstance();

/**
 * 📊 GET - 성능 통계 조회
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange');
    const includeAlerts = searchParams.get('includeAlerts') === 'true';
    const includeStatus = searchParams.get('includeStatus') === 'true';

    // 성능 통계 조회
    const stats = performanceMonitor.getPerformanceStats(
      timeRange ? parseInt(timeRange) : undefined
    );

    const response: any = {
      success: true,
      data: {
        stats,
        timestamp: new Date().toISOString(),
      },
    };

    // 알림 포함
    if (includeAlerts) {
      response.data.alerts = performanceMonitor.getAlerts(20);
    }

    // 상태 포함
    if (includeStatus) {
      response.data.status = performanceMonitor.getStatus();
    }

    logger.info(
      'performance',
      'PerformanceAPI',
      'Performance stats retrieved',
      {
        timeRange,
        includeAlerts,
        includeStatus,
        statsCount: stats.totalRequests,
      }
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ 성능 통계 조회 실패:', error);

    logger.error(
      'performance',
      'PerformanceAPI',
      'Failed to retrieve performance stats',
      error instanceof Error ? error : new Error(String(error))
    );

    return NextResponse.json(
      {
        success: false,
        error: '성능 통계 조회에 실패했습니다.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * 📊 POST - 성능 메트릭 기록
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      engine,
      mode,
      responseTime,
      success,
      confidence,
      queryType,
      errorType,
    } = body;

    // 필수 필드 검증
    if (
      !engine ||
      !mode ||
      responseTime === undefined ||
      success === undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            '필수 필드가 누락되었습니다. (engine, mode, responseTime, success)',
        },
        { status: 400 }
      );
    }

    // 성능 메트릭 기록
    performanceMonitor.recordMetric({
      engine,
      mode,
      responseTime,
      success,
      confidence: confidence || 0,
      queryType,
      errorType,
    });

    logger.info(
      'performance',
      'PerformanceAPI',
      'Performance metric recorded',
      {
        engine,
        mode,
        responseTime,
        success,
        confidence,
      }
    );

    return NextResponse.json({
      success: true,
      message: '성능 메트릭이 기록되었습니다.',
    });
  } catch (error) {
    console.error('❌ 성능 메트릭 기록 실패:', error);

    logger.error(
      'performance',
      'PerformanceAPI',
      'Failed to record performance metric',
      error instanceof Error ? error : new Error(String(error))
    );

    return NextResponse.json(
      {
        success: false,
        error: '성능 메트릭 기록에 실패했습니다.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * 🔧 PUT - 성능 임계값 업데이트
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { thresholds } = body;

    if (!thresholds) {
      return NextResponse.json(
        {
          success: false,
          error: 'thresholds 필드가 필요합니다.',
        },
        { status: 400 }
      );
    }

    performanceMonitor.updateThresholds(thresholds);

    logger.info(
      'performance',
      'PerformanceAPI',
      'Performance thresholds updated',
      { thresholds }
    );

    return NextResponse.json({
      success: true,
      message: '성능 임계값이 업데이트되었습니다.',
    });
  } catch (error) {
    console.error('❌ 성능 임계값 업데이트 실패:', error);

    logger.error(
      'performance',
      'PerformanceAPI',
      'Failed to update performance thresholds',
      error instanceof Error ? error : new Error(String(error))
    );

    return NextResponse.json(
      {
        success: false,
        error: '성능 임계값 업데이트에 실패했습니다.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * 🗑️ DELETE - 성능 메트릭 리셋
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const confirm = searchParams.get('confirm');

    if (confirm !== 'true') {
      return NextResponse.json(
        {
          success: false,
          error: '메트릭 리셋을 확인하려면 confirm=true 파라미터를 추가하세요.',
        },
        { status: 400 }
      );
    }

    performanceMonitor.resetMetrics();

    logger.warn('performance', 'PerformanceAPI', 'Performance metrics reset', {
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: '성능 메트릭이 리셋되었습니다.',
    });
  } catch (error) {
    console.error('❌ 성능 메트릭 리셋 실패:', error);

    logger.error(
      'performance',
      'PerformanceAPI',
      'Failed to reset performance metrics',
      error instanceof Error ? error : new Error(String(error))
    );

    return NextResponse.json(
      {
        success: false,
        error: '성능 메트릭 리셋에 실패했습니다.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
