/**
 * 📊 대시보드 API - Enhanced (Prometheus 제거됨)
 *
 * 실시간 서버 메트릭과 시스템 상태를 제공하는 통합 API
 *
 * @author OpenManager Team
 * @version 5.12.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { unifiedMetricsManager } from '@/services/UnifiedMetricsManager';
import type { EnhancedServerMetrics } from '@/types/server';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const includeHistory = searchParams.get('include_history') === 'true';
    const format = searchParams.get('format') || 'dashboard';

    console.log(
      `📊 대시보드 데이터 요청: format=${format}, history=${includeHistory}`
    );

    // 1. 통합 메트릭 관리자 상태 확인
    const managerStatus = unifiedMetricsManager.getStatus();
    if (!managerStatus.isRunning) {
      console.log('⚠️ 통합 메트릭 관리자가 실행되지 않음. 시작 시도...');
      await unifiedMetricsManager.start();
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 2. 서버 데이터 조회
    const servers: any[] = unifiedMetricsManager.getServers();
    console.log(`📊 총 ${servers.length}개 서버에서 대시보드 데이터 생성`);

    // 3. 서버 상태 분석
    const statusDistribution = analyzeServerStatus(servers);
    const environmentStats = analyzeByEnvironment(servers);
    const roleStats = analyzeByRole(servers);
    const performanceMetrics = calculatePerformanceMetrics(servers);
    const resourceUtilization = calculateResourceUtilization(servers);
    const alertsSummary = analyzeAlerts(servers);
    const topServers = getTopResourceConsumers(servers);

    // 4. 대시보드 데이터 구성
    const dashboardData = {
      // 🖥️ 서버 원본 데이터
      servers: servers,

      // 📊 전체 현황 요약
      overview: {
        total_servers: servers.length,
        healthy_servers: statusDistribution.healthy,
        warning_servers: statusDistribution.warning,
        critical_servers: statusDistribution.critical,
        health_score: calculateHealthScore(statusDistribution),
        system_availability: calculateSystemAvailability(servers),
        active_incidents: alertsSummary.total_alerts,
        last_updated: new Date().toISOString(),
        system_running: managerStatus.isRunning,
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
      pattern_analysis: analyzePatterns(servers),

      // 🎯 상관관계 메트릭
      correlation_insights: analyzeCorrelations(servers),

      // 📈 트렌드 분석
      trends: analyzeTrends(servers),

      // 💡 권장사항
      recommendations: generateRecommendations(servers, alertsSummary),

      // 🔄 호환성을 위한 중첩 구조
      data: {
        servers: servers,
        overview: {
          total_servers: servers.length,
          healthy_servers: statusDistribution.healthy,
          warning_servers: statusDistribution.warning,
          critical_servers: statusDistribution.critical,
        },
      },
    };

    // 5. 히스토리 데이터 추가 (요청시)
    if (includeHistory) {
      (dashboardData as any).historical_data =
        generateHistoricalSummary(servers);
    }

    // 6. 메타데이터 추가
    const response = {
      meta: {
        request_info: {
          format,
          include_history: includeHistory,
          processing_time_ms: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        },
        system_info: managerStatus,
        data_freshness: {
          last_system_update: managerStatus.isRunning ? 'real-time' : 'static',
          cache_ttl_seconds: 30,
          refresh_recommended: true,
        },
      },
      data: dashboardData,
    };

    return NextResponse.json(response, {
      headers: {
        'X-Total-Servers': servers.length.toString(),
        'X-Health-Score': calculateHealthScore(statusDistribution).toString(),
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
    healthy: servers.filter(s => s.status === 'healthy').length,
    warning: servers.filter(s => s.status === 'warning').length,
    critical: servers.filter(s => s.status === 'critical').length,
  };
}

function analyzeByEnvironment(servers: any[]) {
  const environments = ['production', 'staging', 'development'];
  return environments.map(env => ({
    environment: env,
    total: servers.filter(s => s.environment === env).length,
    healthy: servers.filter(
      s => s.environment === env && s.status === 'healthy'
    ).length,
    warning: servers.filter(
      s => s.environment === env && s.status === 'warning'
    ).length,
    critical: servers.filter(
      s => s.environment === env && s.status === 'critical'
    ).length,
  }));
}

function analyzeByRole(servers: any[]) {
  const roles = ['web', 'api', 'database', 'cache', 'worker'];
  return roles.map(role => ({
    role,
    total: servers.filter(s => s.role === role).length,
    healthy: servers.filter(s => s.role === role && s.status === 'healthy')
      .length,
    warning: servers.filter(s => s.role === role && s.status === 'warning')
      .length,
    critical: servers.filter(s => s.role === role && s.status === 'critical')
      .length,
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
    (sum, s) => sum + (s.cpu_usage || s.node_cpu_usage_percent || 0),
    0
  );
  const totalMemory = servers.reduce(
    (sum, s) => sum + (s.memory_usage || s.node_memory_usage_percent || 0),
    0
  );
  const totalDisk = servers.reduce(
    (sum, s) => sum + (s.disk_usage || s.node_disk_usage_percent || 0),
    0
  );

  return {
    avg_cpu: totalCpu / servers.length,
    avg_memory: totalMemory / servers.length,
    avg_disk: totalDisk / servers.length,
  };
}

function analyzeAlerts(servers: any[]) {
  const criticalServers = servers.filter(s => s.status === 'critical').length;
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
        (b.cpu_usage || b.node_cpu_usage_percent || 0) -
        (a.cpu_usage || a.node_cpu_usage_percent || 0)
    )
    .slice(0, 5)
    .map(server => ({
      id: server.id,
      hostname: server.hostname,
      cpu_usage: server.cpu_usage || server.node_cpu_usage_percent || 0,
      memory_usage:
        server.memory_usage || server.node_memory_usage_percent || 0,
      status: server.status,
    }));
}

function analyzePatterns(servers: any[]) {
  return {
    high_cpu_pattern: servers.filter(
      s => (s.cpu_usage || s.node_cpu_usage_percent || 0) > 80
    ).length,
    high_memory_pattern: servers.filter(
      s => (s.memory_usage || s.node_memory_usage_percent || 0) > 80
    ).length,
    error_pattern: servers.filter(s => s.status === 'critical').length,
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
  const recommendations = [];

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
  const healthyServers = servers.filter(s => s.status === 'healthy').length;
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
