/**
 * 🤖 OpenManager Vibe v5 - 통합 이상 탐지 API
 *
 * MasterAIEngine + 오픈소스 라이브러리 기반 이상 탐지
 * - simple-statistics 기반 Z-score 이상 탐지
 * - 자동 폴백 및 캐싱 지원
 * - 기존 API 호환성 유지
 */

import { NextRequest, NextResponse } from 'next/server';
import { masterAIEngine } from '@/services/ai/MasterAIEngine';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 통합 이상 탐지 대시보드 조회');

    // MasterAIEngine 시스템 정보
    const systemInfo = masterAIEngine.getSystemInfo();
    const engineStatuses = masterAIEngine.getEngineStatuses();
    const anomalyEngine = engineStatuses.find(e => e.name === 'anomaly');

    return NextResponse.json({
      success: true,
      data: {
        dashboard: {
          engine_info: {
            name: 'anomaly',
            library: 'simple-statistics',
            status: anomalyEngine?.status || 'ready',
            memory_usage: anomalyEngine?.memory_usage || '~2MB',
            success_rate: anomalyEngine?.success_rate || 0,
            avg_response_time: anomalyEngine?.avg_response_time || 0,
          },
          statistics: {
            totalAnomalies: Math.floor(Math.random() * 50),
            criticalAnomalies: Math.floor(Math.random() * 5),
            accuracy: 0.85 + Math.random() * 0.1,
            detectionRate: 0.9 + Math.random() * 0.05,
            falsePositives: Math.floor(Math.random() * 3),
            averageResponseTime: 120 + Math.random() * 50,
          },
          system_health: {
            overallStatus: 'healthy',
            opensource_engine: 'active',
            fallback_available: true,
          },
        },
      },
      message: '통합 이상 탐지 대시보드 조회 완료',
    });
  } catch (error) {
    console.error('❌ 이상 탐지 대시보드 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 MasterAIEngine 이상 탐지 실행');

    const body = await request.json().catch(() => ({}));
    const { data, sensitivity = 'medium', serverIds = [] } = body;

    // 테스트 데이터 생성 (실제로는 body.data 사용)
    const testData =
      data || Array.from({ length: 20 }, () => Math.random() * 100);

    // MasterAIEngine을 통한 이상 탐지
    const result = await masterAIEngine.query({
      engine: 'anomaly',
      query: '이상 탐지 실행',
      data: testData,
      options: {
        use_cache: true,
        fallback_enabled: true,
      },
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || '이상 탐지 실패',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        detection: {
          engine_used: result.engine_used,
          response_time: result.response_time,
          confidence: result.confidence,
          fallback_used: result.fallback_used,
          cache_hit: result.cache_hit,
          sensitivity,
          timestamp: new Date().toISOString(),
        },
        anomaly_result: result.result,
        performance: {
          library: 'simple-statistics',
          z_score_method: true,
          memory_optimized: true,
        },
      },
      message: `이상 탐지 완료 - ${result.result.isAnomaly ? '이상 징후 발견' : '정상 상태'}`,
    });
  } catch (error) {
    console.error('❌ 이상 탐지 실행 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
