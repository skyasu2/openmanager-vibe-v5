import { NextResponse } from 'next/server'
import { CacheService } from '../../../lib/redis'
import { ENTERPRISE_SERVERS, SERVER_STATS, IDC_LOCATIONS } from '../../../lib/enterprise-servers'
import { 
  CRITICAL_FAILURE_CHAINS, 
  WARNING_FAILURES,
  FAILURE_ANALYTICS 
} from '../../../lib/enterprise-failures'
import { 
  getCurrentPerformanceMetrics,
  SLA_TARGETS 
} from '../../../lib/enterprise-metrics'

export async function GET() {
  try {
    // 캐시에서 먼저 확인 (30초 캐시)
    const cached = await CacheService.get('dashboard:overview')
    if (cached) {
      return NextResponse.json({ 
        success: true, 
        data: cached, 
        timestamp: new Date().toISOString(),
        cached: true
      })
    }

    // 🏢 대시보드 핵심 지표 생성
    const currentTime = new Date()
    const performanceMetrics = getCurrentPerformanceMetrics()
    
    // 서버 상태 분포
    const statusDistribution = {
      healthy: ENTERPRISE_SERVERS.filter(s => s.status === 'online').length,
      warning: ENTERPRISE_SERVERS.filter(s => s.status === 'warning').length,
      critical: ENTERPRISE_SERVERS.filter(s => s.status === 'error').length,
      total: ENTERPRISE_SERVERS.length
    }

    // 플랫폼별 서버 현황
    const platformStats = {
      kubernetes: {
        total: ENTERPRISE_SERVERS.filter(s => s.id.includes('k8s-')).length,
        healthy: ENTERPRISE_SERVERS.filter(s => s.id.includes('k8s-') && s.status === 'online').length,
        warning: ENTERPRISE_SERVERS.filter(s => s.id.includes('k8s-') && s.status === 'warning').length,
        critical: ENTERPRISE_SERVERS.filter(s => s.id.includes('k8s-') && s.status === 'error').length
      },
      onPremise: {
        total: ENTERPRISE_SERVERS.filter(s => !s.id.includes('k8s-')).length,
        healthy: ENTERPRISE_SERVERS.filter(s => !s.id.includes('k8s-') && s.status === 'online').length,
        warning: ENTERPRISE_SERVERS.filter(s => !s.id.includes('k8s-') && s.status === 'warning').length,
        critical: ENTERPRISE_SERVERS.filter(s => !s.id.includes('k8s-') && s.status === 'error').length
      }
    }

    // 상위 리소스 사용률 서버들
    const topResourceUsage = ENTERPRISE_SERVERS
      .sort((a, b) => (b.metrics.cpu + b.metrics.memory) - (a.metrics.cpu + a.metrics.memory))
      .slice(0, 5)
      .map(server => ({
        id: server.id,
        name: server.name,
        status: server.status,
        cpu: server.metrics.cpu,
        memory: server.metrics.memory,
        disk: server.metrics.disk,
        totalUsage: Math.round((server.metrics.cpu + server.metrics.memory + server.metrics.disk) / 3)
      }))

    // 최근 장애 이벤트
    const recentIncidents = [
      ...CRITICAL_FAILURE_CHAINS.map(chain => ({
        id: chain.id,
        severity: 'critical' as const,
        title: chain.name,
        server: chain.origin,
        startTime: chain.startTime,
        impact: chain.businessImpact
      })),
      ...WARNING_FAILURES.map(failure => ({
        id: failure.id,
        severity: 'warning' as const,
        title: failure.name,
        server: failure.origin,
        startTime: failure.startTime,
        impact: failure.businessImpact
      }))
    ].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())

    // 시스템 건강도 점수 계산
    const healthScore = Math.round(
      ((statusDistribution.healthy * 100) + 
       (statusDistribution.warning * 50) + 
       (statusDistribution.critical * 0)) / statusDistribution.total
    )

    // IDC별 상태 요약
    const datacenterSummary = Object.entries(IDC_LOCATIONS).map(([location, serverIds]) => {
      const servers = ENTERPRISE_SERVERS.filter(s => serverIds.includes(s.id))
      return {
        location,
        totalServers: servers.length,
        healthyServers: servers.filter(s => s.status === 'online').length,
        warningServers: servers.filter(s => s.status === 'warning').length,
        criticalServers: servers.filter(s => s.status === 'error').length,
        healthScore: Math.round(
          ((servers.filter(s => s.status === 'online').length * 100) + 
           (servers.filter(s => s.status === 'warning').length * 50)) / servers.length
        )
      }
    })

    const dashboardData = {
      // 📊 전체 현황 요약
      overview: {
        totalServers: statusDistribution.total,
        healthyServers: statusDistribution.healthy,
        warningServers: statusDistribution.warning,
        criticalServers: statusDistribution.critical,
        healthScore,
        systemAvailability: SLA_TARGETS.availability.current,
        activeIncidents: FAILURE_ANALYTICS.totalIncidents,
        lastUpdated: currentTime.toISOString()
      },

      // 🏗️ 플랫폼별 현황
      platformStats,

      // 📈 실시간 성능 지표
      performanceMetrics: {
        systemLoad: performanceMetrics.systemLoad,
        networkThroughput: performanceMetrics.networkThroughput,
        diskIoUtilization: performanceMetrics.diskIoUtilization,
        activeConnections: performanceMetrics.activeConnections,
        responseTime: performanceMetrics.responseTime,
        errorRate: performanceMetrics.errorRate
      },

      // 🎯 SLA 현황
      slaStatus: {
        availability: {
          current: SLA_TARGETS.availability.current,
          target: SLA_TARGETS.availability.target,
          status: SLA_TARGETS.availability.current >= SLA_TARGETS.availability.target ? 'healthy' : 'critical'
        },
        responseTime: {
          current: SLA_TARGETS.responseTime.current,
          target: SLA_TARGETS.responseTime.target,
          status: SLA_TARGETS.responseTime.current <= SLA_TARGETS.responseTime.target ? 'healthy' : 'critical'
        },
        throughput: {
          current: SLA_TARGETS.throughput.current,
          target: SLA_TARGETS.throughput.target,
          status: SLA_TARGETS.throughput.current >= SLA_TARGETS.throughput.target ? 'healthy' : 'critical'
        },
        errorRate: {
          current: SLA_TARGETS.errorRate.current,
          target: SLA_TARGETS.errorRate.target,
          status: SLA_TARGETS.errorRate.current <= SLA_TARGETS.errorRate.target ? 'healthy' : 'critical'
        }
      },

      // 🔝 리소스 사용률 상위 서버
      topResourceUsage,

      // 🚨 최근 장애 이벤트
      recentIncidents: recentIncidents.slice(0, 10),

      // 🏢 데이터센터별 요약
      datacenterSummary,

      // 📊 통계 정보
      statistics: {
        uptimeAverage: Math.round(
          ENTERPRISE_SERVERS.reduce((sum, server) => sum + server.uptime, 0) / ENTERPRISE_SERVERS.length / 86400
        ), // 평균 업타임 (일)
        totalConnections: ENTERPRISE_SERVERS.reduce((sum, server) => sum + server.metrics.network.connections, 0),
        totalProcesses: ENTERPRISE_SERVERS.reduce((sum, server) => sum + server.metrics.processes, 0),
        averageCpuUsage: Math.round(
          ENTERPRISE_SERVERS.reduce((sum, server) => sum + server.metrics.cpu, 0) / ENTERPRISE_SERVERS.length
        ),
        averageMemoryUsage: Math.round(
          ENTERPRISE_SERVERS.reduce((sum, server) => sum + server.metrics.memory, 0) / ENTERPRISE_SERVERS.length
        ),
        criticalThresholdBreaches: ENTERPRISE_SERVERS.filter(s => 
          s.metrics.cpu > 90 || s.metrics.memory > 90 || s.metrics.disk > 90
        ).length
      },

      // ⚠️ 알림 및 권장사항
      alerts: {
        critical: CRITICAL_FAILURE_CHAINS.length,
        warning: WARNING_FAILURES.length,
        info: 0,
        recommendations: [
          '🔴 DB 마스터 서버 즉시 최적화 필요',
          '🔴 스토리지 용량 긴급 확장 필요',
          '🔴 K8s Control Plane 안정화 필요',
          '⚠️ 전체 시스템 SLA 목표 미달성',
          '💡 용량 계획 검토 및 확장 준비'
        ]
      }
    }

    // 캐시에 저장 (30초)
    await CacheService.set('dashboard:overview', dashboardData, 30)

    return NextResponse.json({
      success: true,
      data: dashboardData,
      timestamp: new Date().toISOString(),
      cached: false,
      metadata: {
        refreshInterval: 30, // seconds
        dataSource: 'enterprise-infrastructure',
        environment: 'production'
      }
    })

  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch dashboard data',
      timestamp: new Date().toISOString(),
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 