/**
 * 📊 대시보드 API - Enhanced (Prometheus 제거됨)
 *
 * 실시간 서버 메트릭과 시스템 상태를 제공하는 통합 API
 *
 * @author OpenManager Team
 * @version 5.12.0
 */

import { createServerDataGenerator } from '@/services/data-generator/RealServerDataGenerator';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'standard';
    const includeHistory = searchParams.get('include_history') === 'true';
    const sinceTimestamp = searchParams.get('since')
      ? parseInt(searchParams.get('since')!)
      : null;

    console.log(
      `🚀 대시보드 API 요청: format=${format}, history=${includeHistory}, since=${sinceTimestamp}`
    );

    // 🚫 서버리스 호환: 요청별 데이터 생성기 생성
    const dataGenerator = createServerDataGenerator({
      count: 16,
      includeMetrics: true,
    });

    // 🔧 서버 데이터 생성 (요청별)
    const originalServers = await dataGenerator.generateServers();

    console.log(
      `📊 총 ${originalServers.length}개 서버에서 대시보드 데이터 생성`
    );

    // 🔄 sinceTimestamp가 지정되면 변화된 서버만 필터링
    const servers: any[] = sinceTimestamp
      ? originalServers.filter(
        s =>
          new Date(s.lastUpdate || Date.now()).getTime() >
          (sinceTimestamp as number)
      )
      : originalServers;

    // 서버 데이터를 대시보드 API 형식으로 변환
    const formattedServers = servers.map(server => ({
      id: server.id,
      hostname: server.hostname || server.name,
      environment: server.environment || 'production',
      role: server.role || 'web',
      status: server.status,
      node_cpu_usage_percent: server.cpu || 0,
      node_memory_usage_percent: server.memory || 0,
      node_disk_usage_percent: server.disk || 0,
      node_network_receive_rate_mbps: server.network || 0,
      node_network_transmit_rate_mbps: server.network || 0,
      node_uptime_seconds: server.uptime || 0,
      http_request_duration_seconds: (server.responseTime || 0) / 1000,
      http_requests_total: server.requests || 0,
      http_requests_errors_total: server.errors || 0,
      timestamp: Date.now(),
      labels: {
        environment: server.environment || 'production',
        role: server.role || 'web',
        cluster: 'openmanager-v5',
        version: '5.11.0',
      },
      // 호환성을 위한 추가 필드
      cpu_usage: server.cpu || 0,
      memory_usage: server.memory || 0,
      disk_usage: server.disk || 0,
      response_time: server.responseTime || 0,
      uptime: (server.uptime || 0) / 3600, // 시간 단위로 변환
      last_updated: new Date().toISOString(),
    }));

    // 3. 서버 상태 분석
    const statusDistributionAll = analyzeServerStatus(originalServers);
    const statusDistribution = analyzeServerStatus(formattedServers);
    const environmentStats = analyzeByEnvironment(formattedServers);
    const roleStats = analyzeByRole(formattedServers);
    const performanceMetrics = calculatePerformanceMetrics(formattedServers);
    const resourceUtilization = calculateResourceUtilization(formattedServers);
    const alertsSummary = analyzeAlerts(formattedServers);
    const topServers = getTopResourceConsumers(formattedServers);

    // 🎭 AI 분석 가능한 장애 시나리오 정보 추가
    const scenarioManager = (
      await import('@/services/DemoScenarioManager')
    ).DemoScenarioManager.getInstance();
    const currentScenario = scenarioManager.getCurrentScenario();
    const scenarioStatus = scenarioManager.getStatus();

    // 4. 대시보드 데이터 구성
    const dashboardData = {
      // 🖥️ 서버 원본 데이터
      servers: formattedServers,

      // 📊 전체 현황 요약
      overview: {
        total_servers: originalServers.length,
        healthy_servers: statusDistributionAll.healthy,
        warning_servers: statusDistributionAll.warning,
        critical_servers: statusDistributionAll.critical,
        health_score: calculateHealthScore(statusDistributionAll),
        system_availability: calculateSystemAvailability(formattedServers),
        active_incidents: alertsSummary.total_alerts,
        last_updated: new Date().toISOString(),
        system_running: true, // Assuming system_running is always true in this context
      },

      // 🏗️ 환경별 현황
      environment_stats: environmentStats,

      // 🔧 역할별 현황
      role_stats: roleStats,

      // 📈 실시간 성능 지표
      performance_metrics: performanceMetrics,

      // 💾 리소스 사용률
      resource_utilization: resourceUtilization,

      // 🚨 알림 현황
      alerts_summary: alertsSummary,

      // 🔝 상위 리소스 사용 서버
      top_resource_consumers: topServers,

      // 📊 패턴 분석
      pattern_analysis: analyzePatterns(formattedServers),

      // 🎯 상관관계 메트릭
      correlation_insights: analyzeCorrelations(formattedServers),

      // 📈 트렌드 분석
      trends: analyzeTrends(formattedServers),

      // 💡 권장사항
      recommendations: generateRecommendations(formattedServers, alertsSummary),

      // 🔄 호환성을 위한 중첩 구조
      data: {
        servers: formattedServers,
        overview: {
          total_servers: originalServers.length,
          healthy_servers: statusDistributionAll.healthy,
          warning_servers: statusDistributionAll.warning,
          critical_servers: statusDistributionAll.critical,
        },
      },

      // 🎭 AI 분석용 장애 시나리오 정보
      scenario_analysis: {
        is_active: scenarioStatus?.isActive || false,
        current_scenario: currentScenario
          ? {
            session_id: currentScenario.sessionInfo?.sessionId,
            main_failure: currentScenario.sessionInfo?.mainFailure,
            cascade_failures: currentScenario.sessionInfo?.cascadeFailures,
            current_phase: currentScenario.phase,
            phase_description: currentScenario.description,
            korean_description: currentScenario.koreanDescription,
            ai_analysis_points: currentScenario.aiAnalysisPoints,
            time_range: currentScenario.timeRange,
            affected_servers: currentScenario.changes?.targetServers || [],
            affected_server_types: currentScenario.changes?.serverTypes || [],
          }
          : null,
      },
    };

    // 5. 히스토리 데이터 추가 (요청시)
    if (includeHistory) {
      (dashboardData as any).historical_data =
        generateHistoricalSummary(formattedServers);
    }

    // 6. 메타데이터 추가
    const response = {
      meta: {
        request_info: {
          format,
          include_history: includeHistory,
          since: sinceTimestamp,
          processing_time_ms: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        },
        system_info: { isRunning: true }, // Assuming system_info is always running in this context
        data_freshness: {
          last_system_update: 'real-time',
          cache_ttl_seconds: 30,
          refresh_recommended: true,
        },
      },
      data: dashboardData,
    };

    return NextResponse.json(response, {
      headers: {
        'X-Total-Servers': originalServers.length.toString(),
        'X-Returned-Servers': servers.length.toString(),
        'X-Delta-Mode': sinceTimestamp ? 'true' : 'false',
        'X-Health-Score': calculateHealthScore(
          statusDistributionAll
        ).toString(),
        'X-Active-Alerts': alertsSummary.total_alerts.toString(),
        'X-Processing-Time-Ms': (Date.now() - startTime).toString(),
        'Cache-Control': 'no-cache, must-revalidate',
        'X-Refresh-Interval': '30',
      },
    });
  } catch (error) {
    console.error('❌ 대시보드 데이터 생성 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Dashboard data generation failed',
        message:
          error instanceof Error
            ? error.message
            : '대시보드 데이터 생성 중 오류가 발생했습니다',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// 🔧 분석 함수들
function analyzeServerStatus(servers: any[]) {
  return {
    healthy: servers.filter(
      s => s.status === 'running' || s.status === 'healthy'
    ).length,
    warning: servers.filter(s => s.status === 'warning').length,
    critical: servers.filter(
      s => s.status === 'error' || s.status === 'critical'
    ).length,
  };
}

function analyzeByEnvironment(servers: any[]) {
  const environments = ['production', 'staging', 'development'];
  return environments.map(env => ({
    environment: env,
    total: servers.filter(s => s.environment === env).length,
    healthy: servers.filter(
      s =>
        s.environment === env &&
        (s.status === 'running' || s.status === 'healthy')
    ).length,
    warning: servers.filter(
      s => s.environment === env && s.status === 'warning'
    ).length,
    critical: servers.filter(
      s =>
        s.environment === env &&
        (s.status === 'error' || s.status === 'critical')
    ).length,
  }));
}

function analyzeByRole(servers: any[]) {
  const roles = ['web', 'api', 'database', 'cache'];
  return roles.map(role => ({
    role,
    total: servers.filter(s => s.role === role).length,
    healthy: servers.filter(
      s => s.role === role && (s.status === 'running' || s.status === 'healthy')
    ).length,
    warning: servers.filter(s => s.role === role && s.status === 'warning')
      .length,
    critical: servers.filter(
      s => s.role === role && (s.status === 'error' || s.status === 'critical')
    ).length,
  }));
}

function calculatePerformanceMetrics(servers: any[]) {
  if (servers.length === 0)
    return { avg_response_time: 0, total_requests: 0, error_rate: 0 };

  const totalResponseTime = servers.reduce(
    (sum, s) => sum + (s.response_time || 0),
    0
  );
  const totalRequests = servers.reduce(
    (sum, s) => sum + (s.http_requests_total || 0),
    0
  );
  const totalErrors = servers.reduce(
    (sum, s) => sum + (s.http_requests_errors_total || 0),
    0
  );

  return {
    avg_response_time: totalResponseTime / servers.length,
    total_requests: totalRequests,
    error_rate: totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0,
  };
}

function calculateResourceUtilization(servers: any[]) {
  if (servers.length === 0) return { avg_cpu: 0, avg_memory: 0, avg_disk: 0 };

  const totalCpu = servers.reduce(
    (sum, s) => sum + (s.cpu_usage || 0),
    0
  );
  const totalMemory = servers.reduce(
    (sum, s) => sum + (s.memory_usage || 0),
    0
  );
  const totalDisk = servers.reduce(
    (sum, s) => sum + (s.disk_usage || 0),
    0
  );

  return {
    avg_cpu: totalCpu / servers.length,
    avg_memory: totalMemory / servers.length,
    avg_disk: totalDisk / servers.length,
  };
}

function analyzeAlerts(servers: any[]) {
  const criticalServers = servers.filter(
    s => s.status === 'error' || s.status === 'critical'
  ).length;
  const warningServers = servers.filter(s => s.status === 'warning').length;

  return {
    total_alerts: criticalServers + warningServers,
    critical_alerts: criticalServers,
    warning_alerts: warningServers,
  };
}

function getTopResourceConsumers(servers: any[]) {
  return servers
    .sort(
      (a, b) =>
        (b.cpu_usage || 0) -
        (a.cpu_usage || 0)
    )
    .slice(0, 5)
    .map(server => ({
      id: server.id,
      hostname: server.hostname,
      cpu_usage: server.cpu_usage || 0,
      memory_usage:
        server.memory_usage || 0,
      status: server.status,
    }));
}

function analyzePatterns(servers: any[]) {
  return {
    high_cpu_pattern: servers.filter(
      s => (s.cpu_usage || 0) > 80
    ).length,
    high_memory_pattern: servers.filter(
      s => (s.memory_usage || 0) > 80
    ).length,
    error_pattern: servers.filter(
      s => s.status === 'error' || s.status === 'critical'
    ).length,
  };
}

function analyzeCorrelations(servers: any[]) {
  return {
    cpu_memory_correlation: 0.75, // 예시 값
    response_time_correlation: 0.65,
    error_rate_correlation: 0.45,
  };
}

function analyzeTrends(servers: any[]) {
  return {
    cpu_trend: 'stable',
    memory_trend: 'increasing',
    error_trend: 'decreasing',
  };
}

function generateRecommendations(servers: any[], alertsSummary: any) {
  const recommendations: string[] = [];

  if (alertsSummary.critical_alerts > 0) {
    recommendations.push('Critical servers need immediate attention');
  }

  if (alertsSummary.warning_alerts > 5) {
    recommendations.push('Consider scaling resources for warning servers');
  }

  return recommendations;
}

function calculateHealthScore(statusDistribution: any): number {
  const total =
    statusDistribution.healthy +
    statusDistribution.warning +
    statusDistribution.critical;
  if (total === 0) return 100;

  return Math.round((statusDistribution.healthy / total) * 100);
}

function calculateSystemAvailability(servers: any[]): number {
  const healthyServers = servers.filter(
    s => s.status === 'running' || s.status === 'healthy'
  ).length;
  return servers.length > 0
    ? Math.round((healthyServers / servers.length) * 100)
    : 100;
}

function generateHistoricalSummary(servers: any[]) {
  return {
    last_24h: {
      avg_cpu: 45.2,
      avg_memory: 62.1,
      incidents: 2,
    },
    last_7d: {
      avg_cpu: 43.8,
      avg_memory: 58.9,
      incidents: 12,
    },
  };
}
