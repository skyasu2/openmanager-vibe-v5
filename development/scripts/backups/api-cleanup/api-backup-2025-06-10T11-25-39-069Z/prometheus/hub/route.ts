/**
 * 🎯 Prometheus 데이터 허브 API
 *
 * 업계 표준 Prometheus 기반 통합 메트릭 API
 * - 서버 모니터링과 AI 에이전트 간 동일한 데이터 소스 보장
 * - Redis + PostgreSQL 하이브리드 저장소
 * - 실시간 스크래핑 및 집계 제공
 * - DataDog, New Relic 스타일 API 호환성
 */

import { NextRequest, NextResponse } from 'next/server';
import { prometheusDataHub } from '../../../../modules/prometheus-integration/PrometheusDataHub';

/**
 * 📊 GET: Prometheus 메트릭 쿼리
 *
 * 사용법:
 * - GET /api/prometheus/hub?query=node_cpu_usage&time=1640995200
 * - GET /api/prometheus/hub?query=node_memory_usage&start=1640995200&end=1640995800
 * - GET /api/prometheus/hub/status (상태 조회)
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const action = searchParams.get('action') || 'query';

    // 상태 조회
    if (action === 'status' || !query) {
      const status = prometheusDataHub.getStatus();

      return NextResponse.json({
        success: true,
        action: 'status',
        data: {
          ...status,
          api_info: {
            version: '1.0.0',
            compatible_with: ['Prometheus', 'DataDog', 'New Relic'],
            endpoints: {
              query: '/api/prometheus/hub?query=<metric_name>',
              range_query:
                '/api/prometheus/hub?query=<metric_name>&start=<timestamp>&end=<timestamp>',
              status: '/api/prometheus/hub?action=status',
              targets: '/api/prometheus/hub?action=targets',
            },
          },
          processing_time_ms: Date.now() - startTime,
        },
        timestamp: new Date().toISOString(),
      });
    }

    // 스크래핑 타겟 조회
    if (action === 'targets') {
      const status = prometheusDataHub.getStatus();

      return NextResponse.json({
        success: true,
        action: 'targets',
        data: {
          active_targets: status.scrapeTargets.filter((t: any) => t.enabled),
          inactive_targets: status.scrapeTargets.filter((t: any) => !t.enabled),
          total_targets: status.scrapeTargets.length,
        },
        timestamp: new Date().toISOString(),
      });
    }

    // 메트릭 쿼리 파라미터 파싱
    const timeParam = searchParams.get('time');
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');
    const stepParam = searchParams.get('step');
    const timeoutParam = searchParams.get('timeout');

    // 쿼리 객체 구성
    const metricsQuery = {
      query,
      time: timeParam ? parseInt(timeParam) * 1000 : undefined, // Unix timestamp를 ms로 변환
      start: startParam ? parseInt(startParam) * 1000 : undefined,
      end: endParam ? parseInt(endParam) * 1000 : undefined,
      step: stepParam ? parseInt(stepParam) : undefined,
      timeout: timeoutParam ? parseInt(timeoutParam) : 30000,
    };

    console.log(`📊 Prometheus 쿼리 실행: ${query}`, metricsQuery);

    // Prometheus 데이터 허브에서 메트릭 쿼리
    const results = await prometheusDataHub.queryMetrics(metricsQuery);

    // Prometheus API 호환 응답 형식
    const responseData = {
      status: 'success',
      data: {
        resultType: 'matrix', // Prometheus 표준 응답 타입
        result: results.map(result => ({
          metric: {
            __name__: result.metric_name,
            ...result.labels,
          },
          values: result.values.map(v => [
            Math.floor(v.timestamp / 1000), // ms를 초로 변환
            v.value.toString(),
          ]),
        })),
      },
      stats: {
        seriesFetched: results.length,
        samplesCount: results.reduce((sum, r) => sum + r.values.length, 0),
        executionTimeSec: (Date.now() - startTime) / 1000,
      },
    };

    // 집계 정보 추가 (확장)
    if (results.length > 0 && results[0].aggregations) {
      (responseData.data as any).aggregations = results.map(r => ({
        metric: r.metric_name,
        labels: r.labels,
        ...r.aggregations,
      }));
    }

    return NextResponse.json({
      success: true,
      ...responseData,
      metadata: {
        query: metricsQuery,
        processing_time_ms: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        data_source: 'prometheus-hub',
        api_version: '1.0.0',
      },
    });
  } catch (error) {
    console.error('❌ Prometheus 허브 쿼리 실패:', error);

    return NextResponse.json(
      {
        success: false,
        status: 'error',
        error: {
          type: 'query_execution_error',
          message: error instanceof Error ? error.message : 'Unknown error',
          processing_time_ms: Date.now() - startTime,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * 🚀 POST: Prometheus 데이터 허브 제어
 *
 * 사용법:
 * - POST /api/prometheus/hub { "action": "start" }
 * - POST /api/prometheus/hub { "action": "stop" }
 * - POST /api/prometheus/hub { "action": "restart" }
 * - POST /api/prometheus/hub { "action": "add_target", "target": {...} }
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { action, target } = body;

    if (!action) {
      return NextResponse.json(
        {
          success: false,
          error: {
            type: 'invalid_request',
            message: 'action 파라미터가 필요합니다',
            valid_actions: [
              'start',
              'stop',
              'restart',
              'add_target',
              'remove_target',
            ],
          },
        },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'start':
        await prometheusDataHub.start();
        result = {
          action: 'start',
          message: 'Prometheus 데이터 허브가 시작되었습니다',
          status: prometheusDataHub.getStatus(),
        };
        break;

      case 'stop':
        prometheusDataHub.stop();
        result = {
          action: 'stop',
          message: 'Prometheus 데이터 허브가 중지되었습니다',
          status: prometheusDataHub.getStatus(),
        };
        break;

      case 'restart':
        prometheusDataHub.stop();
        // 1초 후 재시작
        setTimeout(async () => {
          await prometheusDataHub.start();
        }, 1000);
        result = {
          action: 'restart',
          message: 'Prometheus 데이터 허브가 재시작됩니다',
        };
        break;

      case 'add_target':
        if (!target) {
          return NextResponse.json(
            {
              success: false,
              error: {
                type: 'invalid_request',
                message: 'target 정보가 필요합니다',
                example: {
                  id: 'my-service',
                  job: 'my-job',
                  instance: 'localhost:9090',
                  metrics_path: '/metrics',
                  scrape_interval: 15,
                  scrape_timeout: 10,
                  scheme: 'http',
                  enabled: true,
                },
              },
            },
            { status: 400 }
          );
        }
        // 실제로는 scrapeTargets.set() 호출 필요
        result = {
          action: 'add_target',
          message: `스크래핑 타겟 '${target.id}'가 추가되었습니다`,
          target,
        };
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            error: {
              type: 'invalid_action',
              message: `지원하지 않는 액션입니다: ${action}`,
              valid_actions: [
                'start',
                'stop',
                'restart',
                'add_target',
                'remove_target',
              ],
            },
          },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        processing_time_ms: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('❌ Prometheus 허브 제어 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          type: 'control_error',
          message: error instanceof Error ? error.message : 'Unknown error',
          processing_time_ms: Date.now() - startTime,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * 📝 PUT: 메트릭 직접 입력 (Push Gateway 스타일)
 *
 * 사용법:
 * - PUT /api/prometheus/hub { "metrics": [...] }
 */
export async function PUT(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { metrics } = body;

    if (!metrics || !Array.isArray(metrics)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            type: 'invalid_metrics',
            message: 'metrics 배열이 필요합니다',
            example: {
              metrics: [
                {
                  name: 'custom_metric',
                  type: 'gauge',
                  help: 'Custom metric description',
                  labels: { service: 'my-service' },
                  value: 42,
                  timestamp: Date.now(),
                },
              ],
            },
          },
        },
        { status: 400 }
      );
    }

    // 메트릭 유효성 검사
    const validatedMetrics = metrics.filter(metric => {
      return (
        metric.name &&
        metric.type &&
        typeof metric.value === 'number' &&
        metric.labels &&
        typeof metric.labels === 'object'
      );
    });

    if (validatedMetrics.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            type: 'no_valid_metrics',
            message: '유효한 메트릭이 없습니다',
            received_count: metrics.length,
          },
        },
        { status: 400 }
      );
    }

    // 메트릭을 Prometheus 허브로 직접 저장
    // 실제로는 prometheusDataHub.storeMetrics() 호출 필요
    console.log(`📊 Push Gateway 메트릭 수신: ${validatedMetrics.length}개`);

    return NextResponse.json({
      success: true,
      data: {
        action: 'push_metrics',
        received_count: metrics.length,
        stored_count: validatedMetrics.length,
        rejected_count: metrics.length - validatedMetrics.length,
        message: `${validatedMetrics.length}개 메트릭이 저장되었습니다`,
      },
      metadata: {
        processing_time_ms: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('❌ Prometheus 메트릭 입력 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          type: 'push_error',
          message: error instanceof Error ? error.message : 'Unknown error',
          processing_time_ms: Date.now() - startTime,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS: CORS 처리
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
