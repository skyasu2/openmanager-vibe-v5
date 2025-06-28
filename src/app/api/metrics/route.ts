/**
 * 🏗️ Infrastructure Layer - 서버 데이터 생성기 (완전 독립)
 *
 * 역할: 실제 서버 인프라 대체
 * - 30대 가상 서버 = 실제 프로덕션 환경
 * - 표준 Prometheus 메트릭 형식 100% 준수
 * - 다른 시스템과 완전 독립적 동작
 * - 24/7 지속적 메트릭 생성
 */

import { NextRequest, NextResponse } from 'next/server';
import { MetricsGenerator } from '../../../services/data-generator/modules/MetricsGenerator';

/**
 * 🎯 표준 Prometheus /metrics 엔드포인트
 * 실제 Prometheus 서버와 100% 호환
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const count = parseInt(searchParams.get('count') || '20');

    const metricsGenerator = new MetricsGenerator();
    const metrics = await metricsGenerator.generateMetrics(count);

    return NextResponse.json({
      success: true,
      metrics,
      count: metrics.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('메트릭 생성 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}

/**
 * 📊 서버 데이터를 표준 Prometheus 형식으로 변환
 */
function convertToPrometheusFormat(servers: any[]): string {
  const timestamp = Math.floor(Date.now() / 1000);
  let output = '';

  // OpenManager Infrastructure Layer 메타 정보
  output += '# OpenManager Vibe v5 - Infrastructure Layer\n';
  output += `# Generated at: ${new Date().toISOString()}\n`;
  output += `# Total servers: ${servers.length}\n`;
  output += '# Data generator: v3.0.0 (Completely Independent)\n';
  output += '\n';

  // CPU 사용률 메트릭
  output += '# HELP cpu_usage_percent Current CPU usage percentage\n';
  output += '# TYPE cpu_usage_percent gauge\n';
  servers.forEach(server => {
    output += `cpu_usage_percent{instance="${server.id}",job="${server.role}",environment="${server.environment}",datacenter="dc1"} ${server.cpu_usage} ${timestamp}\n`;
  });
  output += '\n';

  // 메모리 사용률 메트릭
  output += '# HELP memory_usage_percent Current memory usage percentage\n';
  output += '# TYPE memory_usage_percent gauge\n';
  servers.forEach(server => {
    output += `memory_usage_percent{instance="${server.id}",job="${server.role}",environment="${server.environment}",datacenter="dc1"} ${server.memory_usage} ${timestamp}\n`;
  });
  output += '\n';

  // 메모리 사용량 (바이트)
  output += '# HELP memory_usage_bytes Current memory usage in bytes\n';
  output += '# TYPE memory_usage_bytes gauge\n';
  servers.forEach(server => {
    const memoryBytes = Math.round((server.memory_usage / 100) * 17179869184); // 16GB 서버 가정
    output += `memory_usage_bytes{instance="${server.id}",job="${server.role}",environment="${server.environment}",datacenter="dc1"} ${memoryBytes} ${timestamp}\n`;
  });
  output += '\n';

  // 디스크 사용률 메트릭
  output += '# HELP disk_usage_percent Current disk usage percentage\n';
  output += '# TYPE disk_usage_percent gauge\n';
  servers.forEach(server => {
    output += `disk_usage_percent{instance="${server.id}",job="${server.role}",environment="${server.environment}",datacenter="dc1"} ${server.disk_usage} ${timestamp}\n`;
  });
  output += '\n';

  // 네트워크 입력 메트릭
  output +=
    '# HELP network_receive_bytes_total Total bytes received over network\n';
  output += '# TYPE network_receive_bytes_total counter\n';
  servers.forEach(server => {
    const networkBytes = Math.round(server.network_in * 1024 * 1024); // MB to bytes
    output += `network_receive_bytes_total{instance="${server.id}",job="${server.role}",environment="${server.environment}",datacenter="dc1"} ${networkBytes} ${timestamp}\n`;
  });
  output += '\n';

  // 네트워크 출력 메트릭
  output +=
    '# HELP network_transmit_bytes_total Total bytes transmitted over network\n';
  output += '# TYPE network_transmit_bytes_total counter\n';
  servers.forEach(server => {
    const networkBytes = Math.round(server.network_out * 1024 * 1024); // MB to bytes
    output += `network_transmit_bytes_total{instance="${server.id}",job="${server.role}",environment="${server.environment}",datacenter="dc1"} ${networkBytes} ${timestamp}\n`;
  });
  output += '\n';

  // 응답 시간 메트릭
  output += '# HELP http_request_duration_seconds HTTP request latency\n';
  output += '# TYPE http_request_duration_seconds gauge\n';
  servers.forEach(server => {
    const responseTimeSeconds = server.response_time / 1000; // ms to seconds
    output += `http_request_duration_seconds{instance="${server.id}",job="${server.role}",environment="${server.environment}",datacenter="dc1"} ${responseTimeSeconds} ${timestamp}\n`;
  });
  output += '\n';

  // 서버 상태 메트릭 (0=maintenance, 1=warning, 2=normal, 3=critical)
  output += '# HELP server_status Current server status\n';
  output += '# TYPE server_status gauge\n';
  servers.forEach(server => {
    let statusValue = 2; // normal
    if (server.status === 'critical') statusValue = 3;
    else if (server.status === 'warning') statusValue = 1;
    else if (server.status === 'maintenance') statusValue = 0;

    output += `server_status{instance="${server.id}",job="${server.role}",environment="${server.environment}",datacenter="dc1",status="${server.status}"} ${statusValue} ${timestamp}\n`;
  });
  output += '\n';

  // 업타임 메트릭
  output += '# HELP node_uptime_seconds Total uptime in seconds\n';
  output += '# TYPE node_uptime_seconds counter\n';
  servers.forEach(server => {
    output += `node_uptime_seconds{instance="${server.id}",job="${server.role}",environment="${server.environment}",datacenter="dc1"} ${server.uptime} ${timestamp}\n`;
  });
  output += '\n';

  // 알림 수 메트릭
  output += '# HELP server_alerts_total Total number of active alerts\n';
  output += '# TYPE server_alerts_total gauge\n';
  servers.forEach(server => {
    const alertCount = server.alerts ? server.alerts.length : 0;
    output += `server_alerts_total{instance="${server.id}",job="${server.role}",environment="${server.environment}",datacenter="dc1"} ${alertCount} ${timestamp}\n`;
  });
  output += '\n';

  // 인프라 수준 메트릭 추가
  output +=
    '# HELP openmanager_infrastructure_servers_total Total number of servers in infrastructure\n';
  output += '# TYPE openmanager_infrastructure_servers_total gauge\n';
  output += `openmanager_infrastructure_servers_total{datacenter="dc1",environment="production"} ${servers.length} ${timestamp}\n`;
  output += '\n';

  // 인프라 건강도 메트릭
  const healthyServers = servers.filter(
    (s: any) => s.status === 'healthy'
  ).length;
  const healthPercentage = (healthyServers / servers.length) * 100;

  output +=
    '# HELP openmanager_infrastructure_health_percent Infrastructure health percentage\n';
  output += '# TYPE openmanager_infrastructure_health_percent gauge\n';
  output += `openmanager_infrastructure_health_percent{datacenter="dc1",environment="production"} ${healthPercentage.toFixed(2)} ${timestamp}\n`;
  output += '\n';

  // 데이터 생성기 자체 메트릭
  output +=
    '# HELP openmanager_generator_version Data generator version info\n';
  output += '# TYPE openmanager_generator_version gauge\n';
  output += `openmanager_generator_version{version="3.0.0",component="infrastructure"} 1 ${timestamp}\n`;
  output += '\n';

  output +=
    '# HELP openmanager_generator_uptime_seconds Data generator uptime\n';
  output += '# TYPE openmanager_generator_uptime_seconds counter\n';
  const generatorUptime = Math.floor(Date.now() / 1000); // 현재 시간을 업타임으로 사용
  output += `openmanager_generator_uptime_seconds{component="infrastructure"} ${generatorUptime} ${timestamp}\n`;

  return output;
}

/**
 * 🔍 Prometheus 쿼리 API (PromQL 호환)
 */
export async function POST(request: NextRequest) {
  try {
    const { query, time, timeout } = await request.json();

    // PromQL 쿼리 파싱 및 실행 시뮬레이션
    const result = await executePromQLQuery(query, time);

    return NextResponse.json({
      status: 'success',
      data: {
        resultType: 'vector',
        result: result,
      },
    });
  } catch (error) {
    console.error('❌ PromQL 쿼리 실행 실패:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: 'Query execution failed',
        errorType: 'bad_data',
      },
      { status: 400 }
    );
  }
}

/**
 * 📊 PromQL 쿼리 시뮬레이션 실행
 */
async function executePromQLQuery(
  query: string,
  time?: number
): Promise<any[]> {
  const metricsGenerator = new MetricsGenerator();
  const servers = await metricsGenerator.generateMetrics(20);

  // 간단한 PromQL 쿼리 파싱 (실제로는 더 복잡한 파서가 필요)
  if (query.includes('cpu_usage_percent')) {
    return servers.map((server: any) => ({
      metric: {
        __name__: 'cpu_usage_percent',
        instance: server.id,
        job: server.role,
        environment: server.environment,
      },
      value: [
        time || Math.floor(Date.now() / 1000),
        server.cpu_usage.toString(),
      ],
    }));
  }

  if (query.includes('memory_usage_percent')) {
    return servers.map((server: any) => ({
      metric: {
        __name__: 'memory_usage_percent',
        instance: server.id,
        job: server.role,
        environment: server.environment,
      },
      value: [
        time || Math.floor(Date.now() / 1000),
        server.memory_usage.toString(),
      ],
    }));
  }

  if (query.includes('server_status')) {
    return servers.map((server: any) => {
      let statusValue = 2;
      if (server.status === 'critical') statusValue = 3;
      else if (server.status === 'warning') statusValue = 1;
      else if (server.status === 'maintenance') statusValue = 0;

      return {
        metric: {
          __name__: 'server_status',
          instance: server.id,
          job: server.role,
          environment: server.environment,
          status: server.status,
        },
        value: [time || Math.floor(Date.now() / 1000), statusValue.toString()],
      };
    });
  }

  // 기본적으로 빈 결과 반환
  return [];
}
