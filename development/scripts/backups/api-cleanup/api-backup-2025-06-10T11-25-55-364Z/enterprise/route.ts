import { NextResponse } from 'next/server';
import { cacheService } from '../../../services/cacheService';
import {
  ENTERPRISE_SERVERS,
  SERVER_STATS,
  IDC_LOCATIONS,
} from '../../../lib/enterprise-servers';
import {
  CRITICAL_FAILURE_CHAINS,
  WARNING_FAILURES,
  FAILURE_CORRELATIONS,
  FAILURE_ANALYTICS,
  FAILURE_TIMELINE,
  AI_RECOMMENDATIONS,
} from '../../../lib/enterprise-failures';
import {
  BUSINESS_HOURS_PATTERNS,
  getCurrentPerformanceMetrics,
  SLA_TARGETS,
  CAPACITY_PLANNING,
  AUTOMATION_METRICS,
} from '../../../lib/enterprise-metrics';

export async function GET() {
  try {
    // 캐시에서 먼저 확인 (1분 캐시)
    const cached = await cacheService.get('enterprise:overview');
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        timestamp: new Date().toISOString(),
        cached: true,
      });
    }

    // 🏢 기업 인프라 전체 현황 생성
    const currentTime = new Date();
    const kstTime = new Date(currentTime.getTime() + 9 * 60 * 60 * 1000); // KST 변환

    // 현재 비즈니스 시간 패턴 확인
    const currentHour = kstTime.getHours();
    const currentPattern =
      BUSINESS_HOURS_PATTERNS.find(pattern => {
        const [start, end] = pattern.timeRange
          .split('-')
          .map(time => parseInt(time.split(':')[0]));
        if (start <= end) {
          return currentHour >= start && currentHour < end;
        } else {
          // 야간 시간 (18:00-09:00)
          return currentHour >= start || currentHour < end;
        }
      }) || BUSINESS_HOURS_PATTERNS[4]; // 기본값: 야간 배치

    // 서버 상태별 분류
    const serversByStatus = {
      critical: ENTERPRISE_SERVERS.filter(s => s.status === 'error'),
      warning: ENTERPRISE_SERVERS.filter(s => s.status === 'warning'),
      healthy: ENTERPRISE_SERVERS.filter(s => s.status === 'online'),
    };

    // IDC별 서버 분류
    const serversByLocation = Object.entries(IDC_LOCATIONS).map(
      ([location, serverIds]) => ({
        location,
        servers: ENTERPRISE_SERVERS.filter(s => serverIds.includes(s.id)),
        totalServers: serverIds.length,
        healthyServers: ENTERPRISE_SERVERS.filter(
          s => serverIds.includes(s.id) && s.status === 'online'
        ).length,
        warningServers: ENTERPRISE_SERVERS.filter(
          s => serverIds.includes(s.id) && s.status === 'warning'
        ).length,
        criticalServers: ENTERPRISE_SERVERS.filter(
          s => serverIds.includes(s.id) && s.status === 'error'
        ).length,
      })
    );

    // 실시간 성능 메트릭
    const performanceMetrics = getCurrentPerformanceMetrics();

    // 전체 응답 데이터 구성
    const enterpriseOverview = {
      // 📊 전체 현황 요약
      summary: {
        totalServers: SERVER_STATS.total,
        criticalServers: SERVER_STATS.critical,
        warningServers: SERVER_STATS.warning,
        healthyServers: SERVER_STATS.healthy,
        kubernetesNodes: SERVER_STATS.kubernetes,
        onPremiseServers: SERVER_STATS.onpremise,
        overallHealthScore: Math.round(
          (SERVER_STATS.healthy * 100 + SERVER_STATS.warning * 50) /
            SERVER_STATS.total
        ),
        systemAvailability: SLA_TARGETS.availability.current,
        currentIncidents: FAILURE_ANALYTICS.totalIncidents,
      },

      // 🏢 IDC 위치별 현황
      datacenterStatus: serversByLocation,

      // 🚨 현재 장애 상황
      activeIncidents: {
        critical: CRITICAL_FAILURE_CHAINS.map(chain => ({
          id: chain.id,
          name: chain.name,
          origin: chain.origin,
          affectedServers: chain.affected.length,
          startTime: chain.startTime,
          businessImpact: chain.businessImpact,
          status: 'active',
        })),
        warning: WARNING_FAILURES.map(failure => ({
          id: failure.id,
          name: failure.name,
          origin: failure.origin,
          startTime: failure.startTime,
          businessImpact: failure.businessImpact,
          status: 'active',
        })),
        analytics: FAILURE_ANALYTICS,
      },

      // 🔗 장애 상관관계
      correlationAnalysis: FAILURE_CORRELATIONS.map(corr => ({
        primaryServer: corr.primaryFailure,
        affectedServers: corr.secondaryFailures,
        strength: corr.correlationStrength,
        propagationTime: corr.propagationTime,
        impactedSystems: corr.affectedSystems,
      })),

      // ⏰ 현재 운영 상황
      operationalContext: {
        currentTime: kstTime.toISOString(),
        businessHour: currentPattern.pattern,
        description: currentPattern.description,
        expectedLoad: currentPattern.expectedLoad,
        criticalSystems: currentPattern.criticalSystems,
        timeline: FAILURE_TIMELINE,
      },

      // 📈 실시간 성능 지표
      performanceMetrics: {
        ...performanceMetrics,
        slaTargets: SLA_TARGETS,
        automationMetrics: AUTOMATION_METRICS,
      },

      // 🎯 AI 분석 및 권장사항
      aiAnalysis: {
        priorityActions: AI_RECOMMENDATIONS.immediateActions,
        shortTermRecommendations: AI_RECOMMENDATIONS.shortTermActions,
        longTermPlanning: AI_RECOMMENDATIONS.longTermActions,
        preventiveMeasures: AI_RECOMMENDATIONS.preventiveActions,
        capacityPlanning: CAPACITY_PLANNING.filter(
          plan => plan.currentUsage > plan.scalingTrigger
        ),
      },

      // 📊 서버별 상세 현황
      serverDetails: {
        byStatus: serversByStatus,
        kubernetes: {
          masters: ENTERPRISE_SERVERS.filter(s => s.id.includes('master')),
          workers: ENTERPRISE_SERVERS.filter(s => s.id.includes('worker')),
        },
        onPremise: {
          web: ENTERPRISE_SERVERS.filter(s => s.id.includes('web-')),
          database: ENTERPRISE_SERVERS.filter(s => s.id.includes('db-')),
          storage: ENTERPRISE_SERVERS.filter(
            s =>
              s.id.includes('storage-') ||
              s.id.includes('file-') ||
              s.id.includes('backup-')
          ),
          infrastructure: ENTERPRISE_SERVERS.filter(
            s =>
              s.id.includes('monitor-') ||
              s.id.includes('log-') ||
              s.id.includes('proxy-') ||
              s.id.includes('dns-')
          ),
        },
      },

      // 🔧 복구 우선순위
      recoveryPriority: FAILURE_ANALYTICS.recoveryPriority.map(
        (serverId, index) => ({
          priority: index + 1,
          serverId,
          server: ENTERPRISE_SERVERS.find(s => s.id === serverId),
          estimatedImpact:
            CRITICAL_FAILURE_CHAINS.find(c => c.origin === serverId)
              ?.businessImpact || 0,
          dependencies:
            FAILURE_CORRELATIONS.find(c => c.primaryFailure === serverId)
              ?.secondaryFailures || [],
        })
      ),
    };

    // 캐시에 저장 (1분)
    await cacheService.set('enterprise:overview', enterpriseOverview, 60);

    return NextResponse.json({
      success: true,
      data: enterpriseOverview,
      timestamp: new Date().toISOString(),
      cached: false,
      metadata: {
        lastUpdate: new Date().toISOString(),
        dataSource: 'enterprise-infrastructure',
        environment: 'production',
        region: 'IDC-Seoul-Main',
      },
    });
  } catch (error) {
    console.error('Enterprise API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch enterprise infrastructure status',
        timestamp: new Date().toISOString(),
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
