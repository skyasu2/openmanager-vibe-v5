/**
 * 📊 Daily Metrics API
 *
 * 서버 모니터링 메트릭 데이터 API
 * - 시계열 데이터 조회
 * - 서버별 필터링
 * - 장애 감지 지원
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMetrics } from '@/lib/supabase-metrics';
import {
  interpolateMetricsByServer,
  getInterpolationStats,
  validateInterpolationQuality,
  InterpolationOptions,
} from '@/lib/interpolateMetrics';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 쿼리 파라미터 추출
    const serverId = searchParams.get('server_id');
    const startTime = searchParams.get('start_time');
    const endTime = searchParams.get('end_time');
    const limit = searchParams.get('limit');
    const status = searchParams.get('status');

    // 보간 관련 파라미터
    const interpolate = searchParams.get('interpolate') === 'true';
    const resolutionMinutes = parseInt(
      searchParams.get('resolution') || '1'
    ) as 1 | 2 | 5;
    const noiseLevel = parseFloat(searchParams.get('noise') || '0.02');
    const preserveOriginal = searchParams.get('preserve_original') !== 'false';

    console.log('📊 메트릭 데이터 조회 요청:', {
      serverId,
      startTime,
      endTime,
      limit,
      status,
      interpolate,
      resolutionMinutes,
    });

    // 데이터 조회
    let metrics = await getMetrics(
      serverId || undefined,
      startTime || undefined,
      endTime || undefined,
      limit ? parseInt(limit) : undefined
    );

    // 상태별 필터링
    if (status && ['healthy', 'warning', 'critical'].includes(status)) {
      metrics = metrics.filter(metric => metric.status === status);
    }

    // 보간 처리
    let finalMetrics = metrics;
    let interpolationStats = null;
    let interpolationQuality = null;

    if (interpolate && metrics.length > 1) {
      console.log(`🔄 시계열 보간 처리 시작: ${resolutionMinutes}분 간격`);

      const interpolationOptions: Partial<InterpolationOptions> = {
        resolutionMinutes: [1, 2, 5].includes(resolutionMinutes)
          ? resolutionMinutes
          : 1,
        noiseLevel: Math.max(0, Math.min(1, noiseLevel)),
        preserveOriginal,
        smoothingFactor: 0.1,
      };

      const interpolatedMetrics = interpolateMetricsByServer(
        metrics,
        interpolationOptions
      );

      // 상태별 재필터링 (보간 후)
      if (status && ['healthy', 'warning', 'critical'].includes(status)) {
        finalMetrics = interpolatedMetrics.filter(
          metric => metric.status === status
        );
      } else {
        finalMetrics = interpolatedMetrics;
      }

      // 보간 통계
      interpolationStats = getInterpolationStats(interpolatedMetrics);

      // 보간 품질 검증 (샘플링해서 성능 향상)
      const sampleSize = Math.min(500, metrics.length);
      const sampleOriginal = metrics.slice(0, sampleSize);
      const sampleInterpolated = interpolatedMetrics.slice(0, sampleSize * 10);
      interpolationQuality = validateInterpolationQuality(
        sampleOriginal,
        sampleInterpolated
      );

      console.log(
        `✅ 보간 완료: ${metrics.length} → ${interpolatedMetrics.length}개 (${interpolationQuality.qualityScore}점)`
      );
    }

    // 통계 계산
    const stats = {
      total: finalMetrics.length,
      healthy: finalMetrics.filter(m => m.status === 'healthy').length,
      warning: finalMetrics.filter(m => m.status === 'warning').length,
      critical: finalMetrics.filter(m => m.status === 'critical').length,
      servers: [...new Set(finalMetrics.map(m => m.server_id))].length,
      timeRange:
        finalMetrics.length > 0
          ? {
              start: finalMetrics[0]?.timestamp,
              end: finalMetrics[finalMetrics.length - 1]?.timestamp,
            }
          : null,
      interpolated: interpolate,
      originalCount: interpolate ? metrics.length : finalMetrics.length,
    };

    // 응답 데이터 구성
    const response = {
      success: true,
      data: finalMetrics,
      stats,
      interpolation: interpolate
        ? {
            enabled: true,
            resolutionMinutes,
            stats: interpolationStats,
            quality: interpolationQuality,
          }
        : { enabled: false },
      pagination: {
        total: stats.total,
        limit: limit ? parseInt(limit) : null,
        hasMore: limit ? finalMetrics.length === parseInt(limit) : false,
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ 메트릭 조회 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// POST: 메트릭 데이터 생성 (개발용)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'generate') {
      // 개발 환경에서만 허용
      if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json(
          { success: false, error: '개발 환경에서만 사용 가능합니다.' },
          { status: 403 }
        );
      }

      console.log('🔄 메트릭 데이터 생성 요청 받음');

      // TODO: 백그라운드에서 데이터 생성 스크립트 실행
      // 실제로는 별도 프로세스나 큐를 사용해야 함

      return NextResponse.json({
        success: true,
        message:
          '메트릭 데이터 생성이 시작되었습니다. npm run generate:metrics 명령어를 직접 실행하세요.',
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      { success: false, error: '지원하지 않는 액션입니다.' },
      { status: 400 }
    );
  } catch (error) {
    console.error('❌ 메트릭 생성 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
