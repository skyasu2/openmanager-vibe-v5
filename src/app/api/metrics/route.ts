/**
 * 📊 Prometheus 메트릭 엔드포인트
 * 
 * Prometheus가 스크래핑할 수 있는 표준 /metrics 엔드포인트
 * - 실시간 서버 메트릭 노출
 * - Prometheus 텍스트 형식 지원
 * - 라벨 기반 필터링
 * - 시스템 전체 요약 메트릭 포함
 */

import { NextRequest, NextResponse } from 'next/server';
import { simulationEngine } from '../../../services/simulationEngine';
import { prometheusFormatter } from '../../../modules/data-generation/PrometheusMetricsFormatter';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'prometheus'; // prometheus | json
    const environment = searchParams.get('environment'); // 환경 필터
    const role = searchParams.get('role'); // 역할 필터
    const serverId = searchParams.get('server_id'); // 특정 서버
    const includeSystem = searchParams.get('include_system') !== 'false'; // 시스템 메트릭 포함 여부

    // 필터 정보 객체 생성
    const filters = { environment, role, serverId, includeSystem };

    console.log(`📊 Prometheus 메트릭 요청: format=${format}, filters=${JSON.stringify(filters)}`);

    // 1. 현재 서버 상태 가져오기
    const servers = simulationEngine.getServers();
    
    if (servers.length === 0) {
      return NextResponse.json({
        error: 'No servers available',
        message: '시뮬레이션이 실행되지 않았거나 서버가 없습니다'
      }, { status: 503 });
    }

    // 2. 서버 필터링 적용
    let filteredServers = servers;
    
    if (serverId) {
      filteredServers = servers.filter(s => s.id === serverId);
      if (filteredServers.length === 0) {
        return NextResponse.json({
          error: 'Server not found',
          message: `서버 '${serverId}'를 찾을 수 없습니다`
        }, { status: 404 });
      }
    } else {
      if (environment) {
        filteredServers = filteredServers.filter(s => s.environment === environment);
      }
      if (role) {
        filteredServers = filteredServers.filter(s => s.role === role);
      }
    }

    // 3. Prometheus 메트릭으로 변환
    let allMetrics: any[] = [];
    
    filteredServers.forEach(server => {
      const serverMetrics = prometheusFormatter.formatServerMetrics(server);
      allMetrics = allMetrics.concat(serverMetrics);
    });

    // 4. 시스템 전체 요약 메트릭 추가
    if (includeSystem && !serverId) {
      const systemMetrics = prometheusFormatter.generateSystemSummaryMetrics(filteredServers);
      allMetrics = allMetrics.concat(systemMetrics);
    }

    // 5. 응답 형식에 따른 처리
    if (format === 'json') {
      // JSON 형식으로 반환 (개발/디버깅용)
      const processingTime = Date.now() - startTime;
      
      return NextResponse.json({
        meta: {
          total_metrics: allMetrics.length,
          total_servers: filteredServers.length,
          processing_time_ms: processingTime,
          timestamp: new Date().toISOString(),
          filters
        },
        metrics: allMetrics,
        summary: {
          metric_types: {
            counter: allMetrics.filter(m => m.type === 'counter').length,
            gauge: allMetrics.filter(m => m.type === 'gauge').length,
            histogram: allMetrics.filter(m => m.type === 'histogram').length,
            summary: allMetrics.filter(m => m.type === 'summary').length
          },
          environments: [...new Set(filteredServers.map(s => s.environment))],
          roles: [...new Set(filteredServers.map(s => s.role))]
        }
      });
    } else {
      // Prometheus 텍스트 형식으로 반환 (표준)
      const prometheusText = prometheusFormatter.formatToPrometheusText(allMetrics);
      
      // 메타 정보를 주석으로 추가
      const meta = [
        `# OpenManager Vibe v5 - Prometheus Metrics`,
        `# Generated at: ${new Date().toISOString()}`,
        `# Total metrics: ${allMetrics.length}`,
        `# Total servers: ${filteredServers.length}`,
        `# Processing time: ${Date.now() - startTime}ms`,
        environment && `# Environment filter: ${environment}`,
        role && `# Role filter: ${role}`,
        serverId && `# Server filter: ${serverId}`,
        `# Realistic Pattern Engine: ${simulationEngine.getSimulationSummary().patternsEnabled ? 'enabled' : 'disabled'}`,
        `# Current Load: ${simulationEngine.getSimulationSummary().currentLoad}`,
        `# Active Failures: ${simulationEngine.getSimulationSummary().activeFailures}`,
        ``
      ].filter(Boolean).join('\n');

      const fullText = meta + prometheusText;

      return new NextResponse(fullText, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-OpenManager-Metrics-Count': allMetrics.length.toString(),
          'X-OpenManager-Servers-Count': filteredServers.length.toString(),
          'X-Processing-Time-Ms': (Date.now() - startTime).toString()
        }
      });
    }

  } catch (error) {
    console.error('❌ Prometheus 메트릭 생성 실패:', error);
    
    return NextResponse.json({
      error: 'Metrics generation failed',
      message: error instanceof Error ? error.message : '메트릭 생성 중 오류가 발생했습니다',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * 🎯 특정 메트릭 쿼리 (POST)
 * 
 * PromQL 스타일의 메트릭 조회 지원
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, start, end, step } = body;

    console.log(`🔍 Prometheus 쿼리 요청: ${query}`);

    // 현재는 간단한 메트릭 쿼리만 지원
    // 향후 실제 PromQL 파서 구현 가능
    const servers = simulationEngine.getServers();
    let allMetrics: any[] = [];
    
    servers.forEach(server => {
      const serverMetrics = prometheusFormatter.formatServerMetrics(server);
      allMetrics = allMetrics.concat(serverMetrics);
    });

    // 쿼리 기반 필터링 (간단한 구현)
    let filteredMetrics = allMetrics;
    
    if (query) {
      // 메트릭 이름 매칭
      const metricNameMatch = query.match(/^([a-zA-Z_:][a-zA-Z0-9_:]*)/);
      if (metricNameMatch) {
        const metricName = metricNameMatch[1];
        filteredMetrics = allMetrics.filter(m => m.name === metricName);
      }

      // 라벨 필터링 (예: {environment="aws"})
      const labelMatch = query.match(/\{([^}]+)\}/);
      if (labelMatch) {
        const labelFilters = labelMatch[1].split(',').map((filter: string) => {
          const [key, value] = filter.split('=');
          return { key: key.trim(), value: value?.replace(/"/g, '').trim() };
        });

        labelFilters.forEach(({ key, value }: { key: string; value: string }) => {
          if (key && value) {
            filteredMetrics = filteredMetrics.filter(m => m.labels[key] === value);
          }
        });
      }
    }

    return NextResponse.json({
      status: 'success',
      data: {
        resultType: 'vector',
        result: filteredMetrics.map(metric => ({
          metric: metric.labels,
          value: [metric.timestamp ? metric.timestamp / 1000 : Date.now() / 1000, metric.value.toString()]
        }))
      },
      meta: {
        query,
        execution_time_ms: Date.now() - Date.now(),
        total_results: filteredMetrics.length
      }
    });

  } catch (error) {
    console.error('❌ Prometheus 쿼리 실패:', error);
    
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : '쿼리 처리 중 오류가 발생했습니다',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * 📋 메트릭 정보 조회 (OPTIONS)
 */
export async function OPTIONS(request: NextRequest) {
  const servers = simulationEngine.getServers();
  const sampleServer = servers[0];
  
  if (!sampleServer) {
    return NextResponse.json({
      error: 'No servers available for metadata'
    }, { status: 503 });
  }

  // 샘플 메트릭 생성으로 메타데이터 제공
  const sampleMetrics = prometheusFormatter.formatServerMetrics(sampleServer);
  const metricNames = [...new Set(sampleMetrics.map(m => m.name))];
  const labelKeys = new Set<string>();
  
  sampleMetrics.forEach(m => {
    Object.keys(m.labels).forEach(key => labelKeys.add(key));
  });

  return NextResponse.json({
    status: 'success',
    metadata: {
      available_metrics: metricNames.length,
      metric_names: metricNames,
      label_keys: Array.from(labelKeys),
      metric_types: {
        counter: sampleMetrics.filter(m => m.type === 'counter').length,
        gauge: sampleMetrics.filter(m => m.type === 'gauge').length,
        histogram: sampleMetrics.filter(m => m.type === 'histogram').length,
        summary: sampleMetrics.filter(m => m.type === 'summary').length
      },
      servers: {
        total: servers.length,
        environments: [...new Set(servers.map(s => s.environment))],
        roles: [...new Set(servers.map(s => s.role))]
      }
    },
    examples: {
      prometheus_scrape: `${request.nextUrl.origin}/api/metrics`,
      json_format: `${request.nextUrl.origin}/api/metrics?format=json`,
      filter_by_environment: `${request.nextUrl.origin}/api/metrics?environment=aws`,
      filter_by_role: `${request.nextUrl.origin}/api/metrics?role=web`,
      specific_server: `${request.nextUrl.origin}/api/metrics?server_id=server-aws-01`,
      query_endpoint: `POST ${request.nextUrl.origin}/api/metrics`
    }
  });
} 