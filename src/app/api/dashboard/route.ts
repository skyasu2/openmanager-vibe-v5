/**
 * 📊 대시보드 API - Enhanced & Prometheus Compatible
 * GET /api/dashboard
 * 개선된 시뮬레이션 엔진 기반의 실시간 대시보드 데이터와 Prometheus 메트릭을 제공합니다
 */

import { NextRequest, NextResponse } from 'next/server';
import { simulationEngine } from '../../../services/simulationEngine';
import { prometheusFormatter } from '../../../modules/data-generation/PrometheusMetricsFormatter';
import type { EnhancedServerMetrics } from '../../../services/simulationEngine';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const includePrometheus = searchParams.get('include_prometheus') === 'true';
    const includeHistory = searchParams.get('include_history') === 'true';
    const format = searchParams.get('format') || 'dashboard'; // dashboard | prometheus | hybrid

    console.log(`📊 대시보드 데이터 요청: format=${format}, prometheus=${includePrometheus}, history=${includeHistory}`);

    // 1. 시뮬레이션 엔진 상태 확인
    const currentState = simulationEngine.getState();
    if (!currentState.isRunning) {
      console.log('⚠️ 시뮬레이션 엔진이 실행되지 않음. 시작 시도...');
      simulationEngine.start();
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 2. 서버 데이터 조회
    const servers: EnhancedServerMetrics[] = simulationEngine.getServers();
    console.log(`📊 총 ${servers.length}개 서버에서 대시보드 데이터 생성`);

    if (format === 'prometheus') {
      // 순수 Prometheus 형식
      let allMetrics: any[] = [];
      
      servers.forEach(server => {
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
          'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
          'X-Total-Servers': servers.length.toString(),
          'X-Total-Metrics': allMetrics.length.toString(),
          'X-Processing-Time-Ms': (Date.now() - startTime).toString()
        }
      });
    }

    // 3. 서버 상태 분석
    const statusDistribution = analyzeServerStatus(servers);
    const environmentStats = analyzeByEnvironment(servers);
    const roleStats = analyzeByRole(servers);
    const performanceMetrics = calculatePerformanceMetrics(servers);
    const resourceUtilization = calculateResourceUtilization(servers);
    const alertsSummary = analyzeAlerts(servers);
    const topServers = getTopResourceConsumers(servers);

    // 4. 시뮬레이션 요약
    const simulationSummary = simulationEngine.getSimulationSummary();

    // 5. 대시보드 데이터 구성
    const dashboardData = {
      // 🖥️ 서버 원본 데이터 (AI 컴포넌트용)
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
        simulation_running: currentState.isRunning
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

      // 📊 패턴 분석 (AI 기반)
      pattern_analysis: analyzePatterns(servers),

      // 🎯 상관관계 메트릭
      correlation_insights: analyzeCorrelations(servers),

      // 📈 트렌드 분석
      trends: analyzeTrends(servers),

      // 💡 권장사항
      recommendations: generateRecommendations(servers, alertsSummary),

      // 🔄 호환성을 위한 중첩 구조 (기존 코드 지원)
      data: {
        servers: servers,
        overview: {
          total_servers: servers.length,
          healthy_servers: statusDistribution.healthy,
          warning_servers: statusDistribution.warning,
          critical_servers: statusDistribution.critical
        }
      }
    };

    // 6. Prometheus 메트릭 추가 (요청시)
    if (includePrometheus || format === 'hybrid') {
      let allPrometheusMetrics: any[] = [];
      
      servers.forEach(server => {
        const serverMetrics = prometheusFormatter.formatServerMetrics(server);
        allPrometheusMetrics = allPrometheusMetrics.concat(serverMetrics);
      });

      const systemMetrics = prometheusFormatter.generateSystemSummaryMetrics(servers);
      allPrometheusMetrics = allPrometheusMetrics.concat(systemMetrics);

      (dashboardData as any).prometheus_metrics = {
        total_metrics: allPrometheusMetrics.length,
        metric_types: {
          counter: allPrometheusMetrics.filter(m => m.type === 'counter').length,
          gauge: allPrometheusMetrics.filter(m => m.type === 'gauge').length,
          histogram: allPrometheusMetrics.filter(m => m.type === 'histogram').length,
          summary: allPrometheusMetrics.filter(m => m.type === 'summary').length
        },
        sample_metrics: allPrometheusMetrics.slice(0, 5), // 샘플 5개
        prometheus_endpoint: '/api/metrics'
      };
    }

    // 7. 히스토리 데이터 추가 (요청시)
    if (includeHistory) {
      (dashboardData as any).historical_data = generateHistoricalSummary(servers);
    }

    // 8. 메타데이터 추가
    const response = {
      meta: {
        request_info: {
          format,
          include_prometheus: includePrometheus,
          include_history: includeHistory,
          processing_time_ms: Date.now() - startTime,
          timestamp: new Date().toISOString()
        },
        simulation_info: simulationSummary,
        data_freshness: {
          last_simulation_update: currentState.isRunning ? 'real-time' : 'static',
          cache_ttl_seconds: 30,
          refresh_recommended: true
        }
      },
      data: dashboardData
    };

    return NextResponse.json(response, {
      headers: {
        'X-Total-Servers': servers.length.toString(),
        'X-Health-Score': calculateHealthScore(statusDistribution).toString(),
        'X-Active-Alerts': alertsSummary.total_alerts.toString(),
        'X-Processing-Time-Ms': (Date.now() - startTime).toString(),
        'Cache-Control': 'no-cache, must-revalidate',
        'X-Refresh-Interval': '30'
      }
    });

  } catch (error) {
    console.error('❌ 대시보드 데이터 생성 실패:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Dashboard data generation failed',
      message: error instanceof Error ? error.message : '대시보드 데이터 생성 중 오류가 발생했습니다',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * 📊 서버 상태 분석
 */
function analyzeServerStatus(servers: EnhancedServerMetrics[]) {
  const summary = {
    healthy: servers.filter(s => s.status === 'healthy').length,
    warning: servers.filter(s => s.status === 'warning').length,
    critical: servers.filter(s => s.status === 'critical').length,
    total: servers.length
  };

  return summary;
}

/**
 * 🏗️ 환경별 분석
 */
function analyzeByEnvironment(servers: EnhancedServerMetrics[]) {
  const environments = ['aws', 'azure', 'gcp', 'kubernetes', 'onpremise', 'idc', 'vdi'];
  
  return environments.map(env => {
    const envServers = servers.filter(s => s.environment === env);
    const avgCpu = envServers.length > 0 ? 
      Math.round(envServers.reduce((sum, s) => sum + s.cpu_usage, 0) / envServers.length) : 0;
    const avgMemory = envServers.length > 0 ? 
      Math.round(envServers.reduce((sum, s) => sum + s.memory_usage, 0) / envServers.length) : 0;
    
    return {
      environment: env,
      total_servers: envServers.length,
      healthy: envServers.filter(s => s.status === 'healthy').length,
      warning: envServers.filter(s => s.status === 'warning').length,
      critical: envServers.filter(s => s.status === 'critical').length,
      avg_cpu_usage: avgCpu,
      avg_memory_usage: avgMemory,
      total_alerts: envServers.reduce((sum, s) => sum + (s.alerts?.length || 0), 0)
    };
  }).filter(env => env.total_servers > 0);
}

/**
 * 🔧 역할별 분석  
 */
function analyzeByRole(servers: EnhancedServerMetrics[]) {
  const roles = ['web', 'database', 'api', 'cache', 'worker', 'gateway', 'storage', 'monitoring'];
  
  return roles.map(role => {
    const roleServers = servers.filter(s => s.role === role);
    const avgResponseTime = roleServers.length > 0 ? 
      Math.round(roleServers.reduce((sum, s) => sum + s.response_time, 0) / roleServers.length) : 0;
    
    return {
      role,
      total_servers: roleServers.length,
      healthy: roleServers.filter(s => s.status === 'healthy').length,
      warning: roleServers.filter(s => s.status === 'warning').length,
      critical: roleServers.filter(s => s.status === 'critical').length,
      avg_response_time: avgResponseTime,
      total_alerts: roleServers.reduce((sum, s) => sum + (s.alerts?.length || 0), 0)
    };
  }).filter(role => role.total_servers > 0);
}

/**
 * 📈 성능 메트릭 계산
 */
function calculatePerformanceMetrics(servers: EnhancedServerMetrics[]) {
  if (servers.length === 0) return {};
  
  const totalNetworkIn = servers.reduce((sum, s) => sum + s.network_in, 0);
  const totalNetworkOut = servers.reduce((sum, s) => sum + s.network_out, 0);
  const avgResponseTime = servers.reduce((sum, s) => sum + s.response_time, 0) / servers.length;
  
  return {
    total_network_throughput_mbps: Math.round((totalNetworkIn + totalNetworkOut) / 1024 / 1024),
    avg_response_time_ms: Math.round(avgResponseTime),
    total_active_connections: servers.length * 50, // 추정값
    error_rate_percent: Math.round(Math.random() * 2), // 시뮬레이션
    system_load_average: Math.round((servers.reduce((sum, s) => sum + s.cpu_usage, 0) / servers.length) / 10) / 10,
    uptime_percentage: 99.5 + Math.random() * 0.5 // 99.5-100%
  };
}

/**
 * 💾 리소스 사용률 계산
 */
function calculateResourceUtilization(servers: EnhancedServerMetrics[]) {
  if (servers.length === 0) return {};
  
  return {
    cpu: {
      average: Math.round(servers.reduce((sum, s) => sum + s.cpu_usage, 0) / servers.length),
      max: Math.max(...servers.map(s => s.cpu_usage)),
      min: Math.min(...servers.map(s => s.cpu_usage)),
      high_usage_servers: servers.filter(s => s.cpu_usage > 80).length
    },
    memory: {
      average: Math.round(servers.reduce((sum, s) => sum + s.memory_usage, 0) / servers.length),
      max: Math.max(...servers.map(s => s.memory_usage)),
      min: Math.min(...servers.map(s => s.memory_usage)),
      high_usage_servers: servers.filter(s => s.memory_usage > 80).length
    },
    disk: {
      average: Math.round(servers.reduce((sum, s) => sum + s.disk_usage, 0) / servers.length),
      max: Math.max(...servers.map(s => s.disk_usage)),
      min: Math.min(...servers.map(s => s.disk_usage)),
      high_usage_servers: servers.filter(s => s.disk_usage > 80).length
    }
  };
}

/**
 * 🚨 알림 분석
 */
function analyzeAlerts(servers: EnhancedServerMetrics[]) {
  const allAlerts = servers.flatMap(s => s.alerts || []);
  
  return {
    total_alerts: allAlerts.length,
    critical_alerts: allAlerts.filter(a => a.severity === 'critical').length,
    warning_alerts: allAlerts.filter(a => a.severity === 'warning').length,
    by_type: {
      cpu: allAlerts.filter(a => a.type === 'cpu').length,
      memory: allAlerts.filter(a => a.type === 'memory').length,
      disk: allAlerts.filter(a => a.type === 'disk').length,
      network: allAlerts.filter(a => a.type === 'network').length,
      response_time: allAlerts.filter(a => a.type === 'response_time').length,
      custom: allAlerts.filter(a => a.type === 'custom').length
    },
    servers_with_alerts: servers.filter(s => s.alerts && s.alerts.length > 0).length
  };
}

/**
 * 🔝 상위 리소스 소비 서버
 */
function getTopResourceConsumers(servers: EnhancedServerMetrics[]) {
  return {
    highest_cpu: servers
      .sort((a, b) => b.cpu_usage - a.cpu_usage)
      .slice(0, 5)
      .map(s => ({ id: s.id, hostname: s.hostname, cpu_usage: s.cpu_usage, environment: s.environment })),
    highest_memory: servers
      .sort((a, b) => b.memory_usage - a.memory_usage)
      .slice(0, 5)
      .map(s => ({ id: s.id, hostname: s.hostname, memory_usage: s.memory_usage, role: s.role })),
    highest_response_time: servers
      .sort((a, b) => b.response_time - a.response_time)
      .slice(0, 5)
      .map(s => ({ id: s.id, hostname: s.hostname, response_time: s.response_time, role: s.role }))
  };
}

/**
 * 📊 패턴 분석
 */
function analyzePatterns(servers: EnhancedServerMetrics[]) {
  const serversWithPatterns = servers.filter(s => s.pattern_info);
  
  return {
    total_servers_with_patterns: serversWithPatterns.length,
    active_burst_patterns: serversWithPatterns.filter(s => s.pattern_info?.burst_active).length,
    high_load_servers: serversWithPatterns.filter(s => s.pattern_info?.current_load === 'high').length,
    medium_load_servers: serversWithPatterns.filter(s => s.pattern_info?.current_load === 'medium').length,
    low_load_servers: serversWithPatterns.filter(s => s.pattern_info?.current_load === 'low').length,
    avg_time_multiplier: serversWithPatterns.length > 0 ? 
      Math.round((serversWithPatterns.reduce((sum, s) => sum + (s.pattern_info?.time_multiplier || 1), 0) / serversWithPatterns.length) * 100) / 100 : 1,
    avg_seasonal_multiplier: serversWithPatterns.length > 0 ? 
      Math.round((serversWithPatterns.reduce((sum, s) => sum + (s.pattern_info?.seasonal_multiplier || 1), 0) / serversWithPatterns.length) * 100) / 100 : 1
  };
}

/**
 * 🎯 상관관계 분석
 */
function analyzeCorrelations(servers: EnhancedServerMetrics[]) {
  const serversWithCorrelations = servers.filter(s => s.correlation_metrics);
  
  if (serversWithCorrelations.length === 0) return {};
  
  return {
    avg_cpu_memory_correlation: Math.round(
      (serversWithCorrelations.reduce((sum, s) => sum + (s.correlation_metrics?.cpu_memory_correlation || 0), 0) / serversWithCorrelations.length) * 100
    ) / 100,
    avg_response_time_impact: Math.round(
      (serversWithCorrelations.reduce((sum, s) => sum + (s.correlation_metrics?.response_time_impact || 0), 0) / serversWithCorrelations.length) * 100
    ) / 100,
    avg_stability_score: Math.round(
      (serversWithCorrelations.reduce((sum, s) => sum + (s.correlation_metrics?.stability_score || 0), 0) / serversWithCorrelations.length) * 100
    ) / 100,
    servers_with_high_stability: serversWithCorrelations.filter(s => (s.correlation_metrics?.stability_score || 0) > 0.8).length,
    servers_with_low_stability: serversWithCorrelations.filter(s => (s.correlation_metrics?.stability_score || 0) < 0.5).length
  };
}

/**
 * 📈 트렌드 분석
 */
function analyzeTrends(servers: EnhancedServerMetrics[]) {
  const now = new Date();
  const hour = now.getHours();
  
  return {
    current_hour: hour,
    is_business_hours: hour >= 9 && hour <= 18,
    predicted_load_trend: hour >= 9 && hour <= 18 ? 'increasing' : 'decreasing',
    peak_hour_prediction: '14:00-15:00',
    resource_pressure_forecast: servers.filter(s => s.cpu_usage > 70 || s.memory_usage > 70).length > servers.length * 0.3 ? 'high' : 'normal'
  };
}

/**
 * 💡 권장사항 생성
 */
function generateRecommendations(servers: EnhancedServerMetrics[], alertsSummary: any) {
  const recommendations = [];
  
  if (alertsSummary.critical_alerts > 0) {
    recommendations.push('🔴 긴급: Critical 알림 해결 필요');
  }
  
  if (servers.filter(s => s.cpu_usage > 80).length > 0) {
    recommendations.push('⚠️ 고CPU 사용률 서버 성능 최적화 필요');
  }
  
  if (servers.filter(s => s.memory_usage > 85).length > 0) {
    recommendations.push('💾 메모리 사용률이 높은 서버 점검 필요');
  }
  
  if (alertsSummary.total_alerts > servers.length * 0.2) {
    recommendations.push('📊 전체적인 시스템 안정성 점검 권장');
  }
  
  const avgResponseTime = servers.reduce((sum, s) => sum + s.response_time, 0) / servers.length;
  if (avgResponseTime > 500) {
    recommendations.push('⚡ 응답시간 개선을 위한 성능 튜닝 필요');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('✅ 시스템이 정상적으로 운영되고 있습니다');
  }
  
  return recommendations;
}

/**
 * 💯 헬스 스코어 계산
 */
function calculateHealthScore(statusDistribution: any): number {
  const total = statusDistribution.total;
  if (total === 0) return 100;
  
  const score = (
    (statusDistribution.healthy * 100) +
    (statusDistribution.warning * 70) +
    (statusDistribution.critical * 30)
  ) / total;
  
  return Math.round(score);
}

/**
 * 📡 시스템 가용성 계산
 */
function calculateSystemAvailability(servers: EnhancedServerMetrics[]): number {
  const healthyServers = servers.filter(s => s.status === 'healthy' || s.status === 'warning').length;
  return servers.length > 0 ? Math.round((healthyServers / servers.length) * 10000) / 100 : 100;
}

/**
 * 📈 히스토리 요약 생성
 */
function generateHistoricalSummary(servers: EnhancedServerMetrics[]) {
  // 24시간 간격으로 24개 데이터 포인트 생성
  const history = [];
  const now = Date.now();
  
  for (let i = 23; i >= 0; i--) {
    const timestamp = new Date(now - (i * 60 * 60 * 1000)); // 1시간씩 거슬러 올라감
    const hour = timestamp.getHours();
    const businessHourMultiplier = (hour >= 9 && hour <= 18) ? 1.2 : 0.8;
    
    history.push({
      timestamp: timestamp.toISOString(),
      avg_cpu_usage: Math.round(
        (servers.reduce((sum, s) => sum + s.cpu_usage, 0) / servers.length) * businessHourMultiplier
      ),
      avg_memory_usage: Math.round(
        (servers.reduce((sum, s) => sum + s.memory_usage, 0) / servers.length) * businessHourMultiplier
      ),
      total_alerts: Math.floor(servers.reduce((sum, s) => sum + (s.alerts?.length || 0), 0) * businessHourMultiplier),
      active_servers: servers.filter(s => s.status === 'healthy' || s.status === 'warning' || s.status === 'critical').length
    });
  }
  
  return {
    time_range: '24h',
    interval: '1h',
    data_points: history
  };
}