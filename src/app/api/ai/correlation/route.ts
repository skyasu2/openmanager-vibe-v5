/**
 * 🔍 서버 간 상관관계 분석 API 엔드포인트
 *
 * Simple Statistics를 활용한 실시간 메트릭 상관관계 분석
 * CPU-메모리-응답시간-디스크 상관관계 실시간 분석
 */

import { NextRequest, NextResponse } from 'next/server';
import { masterAIEngine } from '@/services/ai/MasterAIEngine';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 서버 상관관계 분석 상태 조회');

    const systemInfo = masterAIEngine.getSystemInfo();
    const engineStatuses = masterAIEngine.getEngineStatuses();
    const correlationEngine = engineStatuses.find(
      e => e.name === 'correlation'
    );

    return NextResponse.json({
      success: true,
      data: {
        correlation_status: {
          engine_info: {
            name: 'correlation',
            type: 'analysis_engine',
            status: correlationEngine?.status || 'ready',
            memory_usage: '~1MB',
            description: 'Simple Statistics 기반 실시간 상관관계 분석',
          },
          capabilities: [
            'cpu_memory_correlation',
            'response_time_analysis',
            'disk_network_correlation',
            'anomaly_detection',
            'batch_processing',
            'memory_optimization',
          ],
          thresholds: {
            strong_correlation: 0.7,
            moderate_correlation: 0.4,
            weak_correlation: 0.2,
          },
          performance: {
            max_servers_batch: 50,
            analysis_time: '<100ms',
            memory_per_server: '~0.01MB',
          },
        },
        system_overview: {
          total_engines: systemInfo.master_engine.total_engines,
          initialized: systemInfo.master_engine.initialized,
        },
      },
      message: '상관관계 분석 엔진 상태 조회 완료',
    });
  } catch (error) {
    console.error('❌ 상관관계 분석 상태 조회 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: '상관관계 분석 상태 조회 중 오류 발생',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 서버 간 상관관계 분석 실행');

    const body = await request.json().catch(() => ({}));
    const { servers, options = {} } = body;

    if (!Array.isArray(servers)) {
      return NextResponse.json(
        {
          success: false,
          error: '서버 메트릭 데이터 배열이 필요합니다',
          expected_format: {
            servers: [
              {
                id: 'server-1',
                name: 'Web Server 1',
                cpu: 75.5,
                memory: 68.2,
                responseTime: 120,
                diskUsage: 45.0,
                networkIO: 1024,
              },
            ],
          },
        },
        { status: 400 }
      );
    }

    if (servers.length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: '상관관계 분석을 위해서는 최소 2개 서버의 데이터가 필요합니다',
        },
        { status: 400 }
      );
    }

    // MasterAIEngine을 통한 상관관계 분석
    const result = await masterAIEngine.query({
      engine: 'correlation',
      query: '서버 간 메트릭 상관관계 분석',
      data: servers,
      options: {
        use_cache: true,
        fallback_enabled: true,
        enable_thinking_log: options.enable_thinking || false,
        ...options,
      },
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || '상관관계 분석 실패',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        analysis_info: {
          servers_analyzed: servers.length,
          analysis_time: result.response_time,
          engine_used: result.engine_used,
          confidence: result.confidence,
          cache_hit: result.cache_hit || false,
          timestamp: new Date().toISOString(),
        },
        correlation_results: result.result.correlations,
        summary: {
          answer: result.result.answer,
          top_correlations_count:
            result.result.correlations?.topCorrelations?.length || 0,
          critical_correlations_count:
            result.result.correlations?.criticalCorrelations?.length || 0,
          anomalies_detected:
            result.result.correlations?.anomalies?.length || 0,
          recommendations_count:
            result.result.correlations?.recommendations?.length || 0,
        },
        performance: {
          processing_method: result.fallback_used
            ? 'fallback_engine'
            : 'correlation_engine',
          memory_efficient: true,
          batch_processed: servers.length > 50,
          analysis_time_ms: result.response_time,
        },
        reasoning: result.reasoning_steps || [],
      },
      message: `${servers.length}개 서버의 상관관계 분석 완료`,
    });
  } catch (error) {
    console.error('❌ 상관관계 분석 실행 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: '상관관계 분석 중 오류 발생',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
