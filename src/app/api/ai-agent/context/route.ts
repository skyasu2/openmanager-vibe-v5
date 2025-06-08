/**
 * 🤖 독립적 AI 에이전트 컨텍스트 API
 *
 * OpenManager 7.0 - AI 에이전트 시스템 전용 API
 * 서버 데이터 생성기와 독립적으로 운영되며 API를 통해서만 데이터 교환
 * 24시간 누적 데이터 + 실시간 변동 분석 지원
 */

import { NextRequest, NextResponse } from 'next/server';
import { RealServerDataGenerator } from '@/services/data-generator/RealServerDataGenerator';

// AI 에이전트 컨텍스트 조회 API - GET 요청
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contextType = searchParams.get('type') || 'full';
    const timeframe = searchParams.get('timeframe') || '1h';
    const includeBaseline = searchParams.get('include_baseline') === 'true';
    const includePatterns = searchParams.get('include_patterns') === 'true';

    const dataGenerator = RealServerDataGenerator.getInstance();

    // 기본 서버 데이터 조회
    const servers = dataGenerator.getAllServers();
    const clusters = dataGenerator.getAllClusters();
    const applications = dataGenerator.getAllApplications();
    const dashboardSummary = dataGenerator.getDashboardSummary();
    const environmentConfig = dataGenerator.getEnvironmentConfig();
    const advancedFeatures = dataGenerator.getAdvancedFeaturesStatus();

    // AI 컨텍스트 형식으로 변환
    const aiContext = {
      meta: {
        timestamp: new Date().toISOString(),
        timeframe,
        contextType,
        dataGeneratorVersion: 'v3.0',
        totalEntities: {
          servers: servers.length,
          clusters: clusters.length,
          applications: applications.length,
        },
      },

      // 🎯 시스템 현황 요약 (AI 분석용)
      systemOverview: {
        architecture: environmentConfig.serverArchitecture,
        environment: {
          total: servers.length,
          production: servers.filter(s => s.environment === 'production')
            .length,
          staging: servers.filter(s => s.environment === 'staging').length,
          development: servers.filter(s => s.environment === 'development')
            .length,
        },
        healthStatus: {
          healthy: servers.filter(s => s.status === 'running').length,
          warning: servers.filter(s => s.status === 'warning').length,
          critical: servers.filter(s => s.status === 'error').length,
          maintenance: servers.filter(s => s.status === 'maintenance').length,
        },
        resourceUtilization: calculateSystemResourceUtilization(servers),
        trends: generateTrendAnalysis(servers),
      },

      // 🖥️ 서버 엔티티 (AI 분석용 형식)
      servers: servers.map(server =>
        convertToAIFormat(server, includeBaseline)
      ),

      // 🏗️ 클러스터 정보 (고급 분석용)
      clusters: clusters.map(cluster => convertClusterToAIFormat(cluster)),

      // 📱 애플리케이션 메트릭
      applications: applications.map(app => convertApplicationToAIFormat(app)),

      // 🔍 고급 기능 상태
      advancedFeatures: {
        networkTopology: advancedFeatures.networkTopology,
        baselineOptimizer: advancedFeatures.baselineOptimizer,
        demoScenarios: advancedFeatures.demoScenarios,
      },

      // 📊 24시간 베이스라인 데이터 (요청시)
      ...(includeBaseline && {
        baseline: await generateBaselineContext(dataGenerator),
      }),

      // 🔄 패턴 분석 데이터 (요청시)
      ...(includePatterns && {
        patterns: await generatePatternAnalysis(dataGenerator),
      }),

      // 🎯 AI 추천사항
      recommendations: generateAIRecommendations(servers, clusters),
    };

    // 컨텍스트 타입별 필터링
    if (contextType === 'summary') {
      return NextResponse.json({
        meta: aiContext.meta,
        systemOverview: aiContext.systemOverview,
        recommendations: aiContext.recommendations,
      });
    } else if (contextType === 'servers_only') {
      return NextResponse.json({
        meta: aiContext.meta,
        servers: aiContext.servers,
      });
    } else if (contextType === 'analysis_ready') {
      return NextResponse.json({
        meta: aiContext.meta,
        systemOverview: aiContext.systemOverview,
        servers: aiContext.servers,
        clusters: aiContext.clusters,
        advancedFeatures: aiContext.advancedFeatures,
        recommendations: aiContext.recommendations,
      });
    }

    // 전체 컨텍스트 반환
    return NextResponse.json(aiContext);
  } catch (error) {
    console.error('❌ AI 에이전트 컨텍스트 API 오류:', error);
    return NextResponse.json(
      { error: 'AI 컨텍스트 조회 실패' },
      { status: 500 }
    );
  }
}

// AI 에이전트 분석 결과 저장 API - POST 요청
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { analysisType, results, serverId, recommendations } = body;

    // 분석 결과를 로그로 기록 (실제 구현에서는 DB 저장)
    console.log(`🤖 AI 분석 완료: ${analysisType}`, {
      serverId,
      results,
      recommendations,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'AI 분석 결과 저장 완료',
      analysisId: `analysis_${Date.now()}`,
    });
  } catch (error) {
    console.error('❌ AI 분석 결과 저장 실패:', error);
    return NextResponse.json(
      { error: 'AI 분석 결과 저장 실패' },
      { status: 500 }
    );
  }
}

// 🔄 서버 데이터를 AI 형식으로 변환
function convertToAIFormat(server: any, includeBaseline: boolean = false) {
  const aiServer = {
    // 기본 식별 정보
    entity: {
      id: server.id,
      name: server.name,
      type: server.type,
      role: server.role,
      environment: server.environment,
      location: server.location,
    },

    // 현재 상태
    status: {
      operational: server.status,
      health_score: server.health.score,
      uptime_seconds: server.metrics.uptime,
      last_check: server.health.lastCheck,
    },

    // 실시간 메트릭
    metrics: {
      cpu: {
        usage_percent: server.metrics.cpu,
        cores: server.specs.cpu.cores,
        model: server.specs.cpu.model,
      },
      memory: {
        usage_percent: server.metrics.memory,
        total_bytes: server.specs.memory.total,
        type: server.specs.memory.type,
      },
      disk: {
        usage_percent: server.metrics.disk,
        total_bytes: server.specs.disk.total,
        type: server.specs.disk.type,
        iops: server.specs.disk.iops,
      },
      network: {
        in_mbps: server.metrics.network.in,
        out_mbps: server.metrics.network.out,
        bandwidth_mbps: server.specs.network.bandwidth,
        latency_ms: server.specs.network.latency,
      },
    },

    // 특화 메트릭
    customMetrics: server.metrics.customMetrics,

    // 문제 및 알람
    issues: {
      active_alerts: server.health.issues,
      alert_count: server.health.issues.length,
      severity_level: calculateSeverityLevel(server.health.issues),
    },

    // 보안 정보
    security: server.security
      ? {
          level: server.security.level,
          vulnerabilities: server.security.vulnerabilities,
          patch_level: server.security.patchLevel,
          last_scan: server.security.lastSecurityScan,
        }
      : null,

    // AI 분석을 위한 추가 컨텍스트
    aiContext: {
      risk_factors: identifyRiskFactors(server),
      optimization_potential: calculateOptimizationPotential(server),
      correlation_group: determineCorrelationGroup(server),
    },
  };

  return aiServer;
}

function convertClusterToAIFormat(cluster: any) {
  return {
    id: cluster.id,
    name: cluster.name,
    composition: {
      server_count: cluster.servers.length,
      server_ids: cluster.servers.map((s: any) => s.id),
    },
    loadBalancer: {
      algorithm: cluster.loadBalancer.algorithm,
      active_connections: cluster.loadBalancer.activeConnections,
      total_requests: cluster.loadBalancer.totalRequests,
    },
    scaling: {
      current_instances: cluster.scaling.current,
      min_instances: cluster.scaling.min,
      max_instances: cluster.scaling.max,
      target_instances: cluster.scaling.target,
      policy: cluster.scaling.policy,
    },
    health: {
      cluster_status: calculateClusterHealth(cluster.servers),
      healthy_servers: cluster.servers.filter(
        (s: any) => s.status === 'running'
      ).length,
      total_servers: cluster.servers.length,
    },
  };
}

function convertApplicationToAIFormat(app: any) {
  return {
    name: app.name,
    version: app.version,
    deployment_summary: {
      total_servers: Object.values(app.deployments).reduce(
        (sum: number, env: any) => sum + env.servers,
        0
      ),
      environments: app.deployments,
    },
    performance_metrics: {
      response_time_ms: app.performance.responseTime,
      throughput_rps: app.performance.throughput,
      error_rate_percent: app.performance.errorRate,
      availability_percent: app.performance.availability,
    },
    resource_consumption: app.resources,
    health_status: calculateApplicationHealth(app.performance),
  };
}

// 시스템 리소스 사용률 계산
function calculateSystemResourceUtilization(servers: any[]) {
  if (servers.length === 0) return { cpu: 0, memory: 0, disk: 0, network: 0 };

  const totals = servers.reduce(
    (acc, server) => ({
      cpu: acc.cpu + server.metrics.cpu,
      memory: acc.memory + server.metrics.memory,
      disk: acc.disk + server.metrics.disk,
      network:
        acc.network +
        (server.metrics.network.in + server.metrics.network.out) / 2,
    }),
    { cpu: 0, memory: 0, disk: 0, network: 0 }
  );

  return {
    cpu: Math.round(totals.cpu / servers.length),
    memory: Math.round(totals.memory / servers.length),
    disk: Math.round(totals.disk / servers.length),
    network: Math.round(totals.network / servers.length),
  };
}

// 트렌드 분석 생성
function generateTrendAnalysis(servers: any[]) {
  const now = Date.now();
  const hour = 60 * 60 * 1000;

  // 간단한 트렌드 시뮬레이션 (실제로는 시계열 데이터 분석)
  return {
    cpu_trend: 'stable', // increasing, decreasing, stable
    memory_trend: 'increasing',
    disk_trend: 'stable',
    network_trend: 'stable',
    alert_trend: 'decreasing',
    last_updated: new Date(now).toISOString(),
  };
}

// 24시간 베이스라인 컨텍스트 생성
async function generateBaselineContext(dataGenerator: any) {
  const features = dataGenerator.getAdvancedFeaturesStatus();

  if (!features.baselineOptimizer.enabled) {
    return { available: false, message: '베이스라인 최적화 기능이 비활성화됨' };
  }

  return {
    available: true,
    stats: features.baselineOptimizer.stats,
    patterns: {
      peak_hours: [9, 10, 11, 14, 15, 16],
      low_hours: [1, 2, 3, 4, 5, 6],
      business_hours: [9, 10, 11, 12, 13, 14, 15, 16, 17],
      weekend_pattern: 'reduced_load',
    },
  };
}

// 패턴 분석 생성
async function generatePatternAnalysis(dataGenerator: any) {
  const networkTopology = dataGenerator.getNetworkTopology();

  return {
    network_patterns: networkTopology
      ? {
          node_count: networkTopology.nodes.length,
          connection_count: networkTopology.connections.length,
          topology_type: 'hybrid',
        }
      : null,

    load_patterns: {
      current_scenario: dataGenerator.getCurrentDemoScenario(),
      detected_anomalies: [],
      correlation_insights: [
        '높은 CPU 사용률과 네트워크 지연 간 상관관계 발견',
        '메모리 사용률 증가 시 응답시간 지연 패턴 확인',
      ],
    },
  };
}

// AI 추천사항 생성
function generateAIRecommendations(servers: any[], clusters: any[]) {
  const recommendations = [];

  // 높은 CPU 사용률 서버 체크
  const highCpuServers = servers.filter(s => s.metrics.cpu > 80);
  if (highCpuServers.length > 0) {
    recommendations.push({
      type: 'performance',
      priority: 'high',
      message: `${highCpuServers.length}개 서버에서 높은 CPU 사용률 감지`,
      action: 'cpu_optimization',
      affected_servers: highCpuServers.map(s => s.id),
    });
  }

  // 메모리 사용률 체크
  const highMemoryServers = servers.filter(s => s.metrics.memory > 85);
  if (highMemoryServers.length > 0) {
    recommendations.push({
      type: 'resource',
      priority: 'medium',
      message: `${highMemoryServers.length}개 서버에서 높은 메모리 사용률`,
      action: 'memory_optimization',
      affected_servers: highMemoryServers.map(s => s.id),
    });
  }

  // 클러스터 스케일링 권장
  clusters.forEach(cluster => {
    const healthyServers = cluster.servers.filter(
      (s: any) => s.status === 'running'
    ).length;
    const healthPercentage = (healthyServers / cluster.servers.length) * 100;

    if (healthPercentage < 70) {
      recommendations.push({
        type: 'scaling',
        priority: 'high',
        message: `클러스터 ${cluster.name}의 가용성 저하`,
        action: 'scale_up',
        affected_cluster: cluster.id,
      });
    }
  });

  return recommendations;
}

// 보조 함수들
function calculateSeverityLevel(
  issues: string[]
): 'low' | 'medium' | 'high' | 'critical' {
  if (issues.length === 0) return 'low';
  if (issues.length <= 2) return 'medium';
  if (issues.length <= 5) return 'high';
  return 'critical';
}

function identifyRiskFactors(server: any): string[] {
  const risks = [];

  if (server.metrics.cpu > 90) risks.push('cpu_overload');
  if (server.metrics.memory > 95) risks.push('memory_exhaustion');
  if (server.metrics.disk > 90) risks.push('disk_full');
  if (server.health.score < 50) risks.push('health_degradation');
  if (server.security?.vulnerabilities > 0)
    risks.push('security_vulnerabilities');

  return risks;
}

function calculateOptimizationPotential(
  server: any
): 'low' | 'medium' | 'high' {
  const cpu = server.metrics.cpu;
  const memory = server.metrics.memory;
  const disk = server.metrics.disk;

  const avgUtilization = (cpu + memory + disk) / 3;

  if (avgUtilization > 80) return 'high';
  if (avgUtilization > 60) return 'medium';
  return 'low';
}

function determineCorrelationGroup(server: any): string {
  return `${server.environment}_${server.type}_${server.location.replace(/\s/g, '_')}`;
}

function calculateClusterHealth(
  servers: any[]
): 'healthy' | 'warning' | 'critical' {
  const healthyCount = servers.filter(s => s.status === 'running').length;
  const healthPercentage = (healthyCount / servers.length) * 100;

  if (healthPercentage >= 90) return 'healthy';
  if (healthPercentage >= 70) return 'warning';
  return 'critical';
}

function calculateApplicationHealth(
  performance: any
): 'healthy' | 'warning' | 'critical' {
  const { errorRate, availability } = performance;

  if (errorRate < 1 && availability > 99.5) return 'healthy';
  if (errorRate < 5 && availability > 95) return 'warning';
  return 'critical';
}
