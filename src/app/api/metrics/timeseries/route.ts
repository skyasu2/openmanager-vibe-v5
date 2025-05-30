/**
 * 📊 시계열 메트릭 API - Prometheus 호환
 * 
 * 기존 시계열 데이터와 Prometheus 메트릭을 모두 지원
 * - 기존 OpenManager 형식 유지
 * - Prometheus 표준 메트릭 추가 지원
 * - 유연한 데이터 형식 변환
 * - 백워드 호환성 보장
 */

import { NextRequest, NextResponse } from 'next/server';
import { simulationEngine } from '../../../../services/simulationEngine';
import { prometheusFormatter } from '../../../../modules/data-generation/PrometheusMetricsFormatter';
import type { EnhancedServerMetrics } from '../../../../services/simulationEngine';

interface TimeSeriesDataPoint {
  timestamp: string;
  value: number;
  metadata?: {
    pattern_info?: any;
    correlation_metrics?: any;
  };
}

interface TimeSeriesResponse {
  server_id: string;
  hostname: string;
  environment: string;
  role: string;
  metric_name: string;
  time_range: string;
  data_points: TimeSeriesDataPoint[];
  prometheus_metrics?: any[]; // 새로 추가된 Prometheus 메트릭
  summary: {
    total_points: number;
    avg_value: number;
    min_value: number;
    max_value: number;
    latest_value: number;
  };
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const serverId = searchParams.get('serverId') || 'server-onprem-01';
    const timeRange = searchParams.get('timeRange') || '1h';
    const metrics = searchParams.get('metrics')?.split(',') || ['cpu_usage', 'memory_usage'];
    const format = searchParams.get('format') || 'openmanager'; // openmanager | prometheus | hybrid
    const includePrometheus = searchParams.get('include_prometheus') === 'true'; // Prometheus 메트릭 포함 여부

    console.log(`📊 시계열 메트릭 요청: server=${serverId}, metrics=${metrics.join(',')}, format=${format}`);

    // 1. 서버 정보 조회
    const server = simulationEngine.getServerById(serverId);
    if (!server) {
      return NextResponse.json({
        error: 'Server not found',
        message: `서버 '${serverId}'를 찾을 수 없습니다`,
        available_servers: simulationEngine.getServers().map(s => s.id)
      }, { status: 404 });
    }

    // 2. 시간 범위 파싱
    const timeRangeMs = parseTimeRange(timeRange);
    const endTime = Date.now();
    const startTimeRange = endTime - timeRangeMs;

    // 3. 시계열 데이터 생성 (실제로는 DB에서 조회)
    const dataPoints = generateTimeSeriesData(server, metrics, startTimeRange, endTime, 60); // 1분 간격

    // 4. Prometheus 메트릭 생성 (옵션)
    let prometheusMetrics: any[] = [];
    if (format === 'prometheus' || format === 'hybrid' || includePrometheus) {
      prometheusMetrics = simulationEngine.getPrometheusMetrics(serverId);
    }

    // 5. 응답 형식에 따른 처리
    if (format === 'prometheus') {
      // 순수 Prometheus 형식
      const prometheusText = prometheusFormatter.formatToPrometheusText(prometheusMetrics);
      
      return new NextResponse(prometheusText, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
          'X-Server-Id': serverId,
          'X-Metrics-Count': prometheusMetrics.length.toString(),
          'X-Processing-Time-Ms': (Date.now() - startTime).toString()
        }
      });
    } else {
      // OpenManager 형식 또는 하이브리드
      const responses: TimeSeriesResponse[] = metrics.map(metricName => {
        const metricDataPoints = dataPoints.filter(dp => dp.metric === metricName);
        const values = metricDataPoints.map(dp => dp.value);

        const response: TimeSeriesResponse = {
          server_id: server.id,
          hostname: server.hostname,
          environment: server.environment,
          role: server.role,
          metric_name: metricName,
          time_range: timeRange,
          data_points: metricDataPoints.map(dp => ({
            timestamp: new Date(dp.timestamp).toISOString(),
            value: dp.value,
            metadata: {
              pattern_info: server.pattern_info,
              correlation_metrics: server.correlation_metrics
            }
          })),
          summary: {
            total_points: metricDataPoints.length,
            avg_value: values.length > 0 ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100 : 0,
            min_value: values.length > 0 ? Math.min(...values) : 0,
            max_value: values.length > 0 ? Math.max(...values) : 0,
            latest_value: values.length > 0 ? values[values.length - 1] : 0
          }
        };

        // Prometheus 메트릭 추가 (하이브리드 모드 또는 요청시)
        if (format === 'hybrid' || includePrometheus) {
          const relevantPrometheusMetrics = prometheusMetrics.filter(pm => 
            pm.labels.server_id === serverId && 
            (pm.name.includes(metricName) || isRelatedMetric(pm.name, metricName))
          );
          response.prometheus_metrics = relevantPrometheusMetrics;
        }

        return response;
      });

      // 6. 메타데이터 추가
      const result = {
        meta: {
          server_info: {
            id: server.id,
            hostname: server.hostname,
            environment: server.environment,
            role: server.role,
            status: server.status,
            uptime: server.uptime,
            last_updated: server.last_updated
          },
          request_info: {
            requested_metrics: metrics,
            time_range: timeRange,
            format,
            include_prometheus: includePrometheus,
            processing_time_ms: Date.now() - startTime,
            timestamp: new Date().toISOString()
          },
          simulation_info: simulationEngine.getSimulationSummary()
        },
        data: responses,
        prometheus_summary: includePrometheus || format === 'hybrid' ? {
          total_metrics: prometheusMetrics.length,
          metric_types: {
            counter: prometheusMetrics.filter(m => m.type === 'counter').length,
            gauge: prometheusMetrics.filter(m => m.type === 'gauge').length,
            histogram: prometheusMetrics.filter(m => m.type === 'histogram').length,
            summary: prometheusMetrics.filter(m => m.type === 'summary').length
          }
        } : undefined
      };

      return NextResponse.json(result, {
        headers: {
          'X-Server-Id': serverId,
          'X-Total-Data-Points': dataPoints.length.toString(),
          'X-Prometheus-Metrics': prometheusMetrics.length.toString(),
          'X-Processing-Time-Ms': (Date.now() - startTime).toString()
        }
      });
    }

  } catch (error) {
    console.error('❌ 시계열 메트릭 생성 실패:', error);
    
    return NextResponse.json({
      error: 'Timeseries generation failed',
      message: error instanceof Error ? error.message : '시계열 데이터 생성 중 오류가 발생했습니다',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * 📝 메트릭 내보내기 (POST)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { server_ids, metrics, time_range, export_format = 'json' } = body;

    console.log(`📤 메트릭 내보내기: ${server_ids?.length || 'all'} 서버, format=${export_format}`);

    const servers: EnhancedServerMetrics[] = server_ids ? 
      server_ids.map((id: string) => simulationEngine.getServerById(id)).filter(Boolean) :
      simulationEngine.getServers();

    if (servers.length === 0) {
      return NextResponse.json({
        error: 'No servers found',
        message: '지정된 서버를 찾을 수 없습니다'
      }, { status: 404 });
    }

    if (export_format === 'prometheus') {
      // 전체 Prometheus 메트릭 내보내기
      let allMetrics: any[] = [];
      
      servers.forEach((server: EnhancedServerMetrics) => {
        const serverMetrics = prometheusFormatter.formatServerMetrics(server);
        allMetrics = allMetrics.concat(serverMetrics);
      });

      // 시스템 요약 메트릭 추가
      const systemMetrics = prometheusFormatter.generateSystemSummaryMetrics(servers);
      allMetrics = allMetrics.concat(systemMetrics);

      const prometheusText = prometheusFormatter.formatToPrometheusText(allMetrics);

      return new NextResponse(prometheusText, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="openmanager-metrics-${Date.now()}.txt"`,
          'X-Total-Metrics': allMetrics.length.toString(),
          'X-Total-Servers': servers.length.toString()
        }
      });
    } else {
      // JSON 형식 내보내기
      const exportData = {
        export_info: {
          timestamp: new Date().toISOString(),
          total_servers: servers.length,
          metrics_requested: metrics || 'all',
          time_range: time_range || 'current',
          format: export_format
        },
        servers: servers.map((server: EnhancedServerMetrics) => ({
          server_info: {
            id: server.id,
            hostname: server.hostname,
            environment: server.environment,
            role: server.role,
            status: server.status
          },
          current_metrics: {
            cpu_usage: server.cpu_usage,
            memory_usage: server.memory_usage,
            disk_usage: server.disk_usage,
            network_in: server.network_in,
            network_out: server.network_out,
            response_time: server.response_time,
            uptime: server.uptime
          },
          pattern_info: server.pattern_info,
          correlation_metrics: server.correlation_metrics,
          alerts: server.alerts
        }))
      };

      return NextResponse.json(exportData, {
        headers: {
          'Content-Disposition': `attachment; filename="openmanager-export-${Date.now()}.json"`
        }
      });
    }

  } catch (error) {
    console.error('❌ 메트릭 내보내기 실패:', error);
    
    return NextResponse.json({
      error: 'Export failed',
      message: error instanceof Error ? error.message : '메트릭 내보내기 중 오류가 발생했습니다'
    }, { status: 500 });
  }
}

/**
 * ⏰ 시간 범위 파싱
 */
function parseTimeRange(timeRange: string): number {
  const unit = timeRange.slice(-1);
  const value = parseInt(timeRange.slice(0, -1));
  
  switch (unit) {
    case 'm': return value * 60 * 1000; // 분
    case 'h': return value * 60 * 60 * 1000; // 시간
    case 'd': return value * 24 * 60 * 60 * 1000; // 일
    default: return 60 * 60 * 1000; // 기본 1시간
  }
}

/**
 * 📊 시계열 데이터 생성 (실제로는 DB에서 조회해야 함)
 */
function generateTimeSeriesData(
  server: EnhancedServerMetrics,
  metrics: string[],
  startTime: number,
  endTime: number,
  intervalSeconds: number
): Array<{ timestamp: number; metric: string; value: number }> {
  const data: Array<{ timestamp: number; metric: string; value: number }> = [];
  const interval = intervalSeconds * 1000;
  
  for (let time = startTime; time <= endTime; time += interval) {
    metrics.forEach(metric => {
      let value = 0;
      
      // 현재 서버 값을 기준으로 시간에 따른 변화 시뮬레이션
      switch (metric) {
        case 'cpu_usage':
          value = server.cpu_usage + (Math.random() - 0.5) * 10;
          break;
        case 'memory_usage':
          value = server.memory_usage + (Math.random() - 0.5) * 5;
          break;
        case 'disk_usage':
          value = server.disk_usage + (Math.random() - 0.5) * 2;
          break;
        case 'network_in':
          value = server.network_in + (Math.random() - 0.5) * 20;
          break;
        case 'network_out':
          value = server.network_out + (Math.random() - 0.5) * 15;
          break;
        case 'response_time':
          value = server.response_time + (Math.random() - 0.5) * 50;
          break;
        default:
          value = Math.random() * 100;
      }
      
      data.push({
        timestamp: time,
        metric,
        value: Math.max(0, Math.round(value * 100) / 100)
      });
    });
  }
  
  return data;
}

/**
 * 🔍 관련 메트릭 확인
 */
function isRelatedMetric(prometheusMetricName: string, requestedMetric: string): boolean {
  const relationMap: Record<string, string[]> = {
    'cpu_usage': ['node_cpu_usage_percent', 'node_cpu_seconds_total'],
    'memory_usage': ['node_memory_usage_percent', 'node_memory_MemTotal_bytes', 'node_memory_MemAvailable_bytes'],
    'disk_usage': ['node_disk_usage_percent', 'node_filesystem_size_bytes', 'node_filesystem_free_bytes'],
    'network_in': ['node_network_receive_bytes_total', 'node_network_receive_rate_mbps'],
    'network_out': ['node_network_transmit_bytes_total', 'node_network_transmit_rate_mbps'],
    'response_time': ['http_request_duration_seconds']
  };

  return relationMap[requestedMetric]?.some(related => 
    prometheusMetricName.includes(related)
  ) || false;
} 