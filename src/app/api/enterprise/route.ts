import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import {
  AI_RECOMMENDATIONS,
  CRITICAL_FAILURE_CHAINS,
  FAILURE_ANALYTICS,
  FAILURE_CORRELATIONS,
  FAILURE_TIMELINE,
  WARNING_FAILURES,
} from '../../../lib/enterprise-failures';
import {
  AUTOMATION_METRICS,
  BUSINESS_HOURS_PATTERNS,
  CAPACITY_PLANNING,
  getCurrentPerformanceMetrics,
  SLA_TARGETS,
} from '../../../lib/enterprise-metrics';
import {
  ENTERPRISE_SERVERS,
  IDC_LOCATIONS,
  SERVER_STATS,
} from '../../../lib/enterprise-servers';
import { getCacheService } from '@/lib/cache-helper';
import debug from '@/utils/debug';

/**
 * Enterprise API Endpoint
 *
 * 엔터프라이즈 기능 및 설정을 제공합니다.
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const feature = searchParams.get('feature');

    // 캐시에서 먼저 확인 (1분 캐시)
    const cache = getCacheService();
    const cached = await cache.get('enterprise:overview');
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
    const currentPattern = BUSINESS_HOURS_PATTERNS.find((pattern) => {
      const timeParts = pattern.timeRange?.split('-') ?? [];
      if (timeParts.length !== 2) return false;

      const startStr = timeParts[0]?.split(':')[0];
      const endStr = timeParts[1]?.split(':')[0];

      if (!startStr || !endStr) return false;

      const start = parseInt(startStr);
      const end = parseInt(endStr);

      if (start <= end) {
        return currentHour >= start && currentHour < end;
      } else {
        // 야간 시간 (18:00-09:00)
        return currentHour >= start || currentHour < end;
      }
    }) ??
      BUSINESS_HOURS_PATTERNS[4] ?? {
        pattern: 'night-batch',
        description: '야간 배치 시간',
        expectedLoad: '낮음',
        criticalSystems: ['모니터링'],
        timeRange: '18:00-09:00',
      }; // 기본값 보장

    // 서버 상태별 분류
    const serversByStatus = {
      critical: ENTERPRISE_SERVERS.filter((s) => s.status === 'error'),
      warning: ENTERPRISE_SERVERS.filter((s) => s.status === 'warning'),
      healthy: ENTERPRISE_SERVERS.filter((s) => s.status === 'online'),
    };

    // IDC별 서버 분류
    const serversByLocation = Object.entries(IDC_LOCATIONS).map(
      ([location, serverIds]) => ({
        location,
        servers: ENTERPRISE_SERVERS.filter((s) => serverIds.includes(s.id)),
        totalServers: serverIds.length,
        healthyServers: ENTERPRISE_SERVERS.filter(
          (s) => serverIds.includes(s.id) && s.status === 'online'
        ).length,
        warningServers: ENTERPRISE_SERVERS.filter(
          (s) => serverIds.includes(s.id) && s.status === 'warning'
        ).length,
        criticalServers: ENTERPRISE_SERVERS.filter(
          (s) => serverIds.includes(s.id) && s.status === 'error'
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
        critical: CRITICAL_FAILURE_CHAINS.map((chain) => ({
          id: chain.id,
          name: chain.name,
          origin: chain.origin,
          affectedServers: chain.affected.length,
          startTime: chain.startTime,
          businessImpact: chain.businessImpact,
          status: 'active',
        })),
        warning: WARNING_FAILURES.map((failure) => ({
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
      correlationAnalysis: FAILURE_CORRELATIONS.map((corr) => ({
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
          (plan) => plan.currentUsage > plan.scalingTrigger
        ),
      },

      // 📊 서버별 상세 현황
      serverDetails: {
        byStatus: serversByStatus,
        kubernetes: {
          masters: ENTERPRISE_SERVERS.filter((s) => s.id.includes('master')),
          workers: ENTERPRISE_SERVERS.filter((s) => s.id.includes('worker')),
        },
        onPremise: {
          web: ENTERPRISE_SERVERS.filter((s) => s.id.includes('web-')),
          database: ENTERPRISE_SERVERS.filter((s) => s.id.includes('db-')),
          storage: ENTERPRISE_SERVERS.filter(
            (s) =>
              s.id.includes('storage-') ||
              s.id.includes('file-') ||
              s.id.includes('backup-')
          ),
          infrastructure: ENTERPRISE_SERVERS.filter(
            (s) =>
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
          server: ENTERPRISE_SERVERS.find((s) => s.id === serverId),
          estimatedImpact:
            CRITICAL_FAILURE_CHAINS.find((c) => c.origin === serverId)
              ?.businessImpact || 0,
          dependencies:
            FAILURE_CORRELATIONS.find((c) => c.primaryFailure === serverId)
              ?.secondaryFailures || [],
        })
      ),
    };

    // 캐시에 저장 (1분)
    await cache.set('enterprise:overview', enterpriseOverview, 60);

    if (feature) {
      // 기능별 정보를 별도로 처리
      const availableFeatures = {
        'ai-analysis': enterpriseOverview.aiAnalysis,
        'performance-metrics': enterpriseOverview.performanceMetrics,
        'incident-management': enterpriseOverview.activeIncidents,
        'capacity-planning': enterpriseOverview.aiAnalysis.capacityPlanning,
      };

      const featureInfo =
        availableFeatures[feature as keyof typeof availableFeatures];
      if (featureInfo) {
        return NextResponse.json({
          feature,
          data: featureInfo,
          timestamp: new Date().toISOString(),
        });
      } else {
        return NextResponse.json(
          {
            error: `지원되지 않는 기능: ${feature}`,
          },
          { status: 404 }
        );
      }
    }

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
    debug.error('Enterprise API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get enterprise information',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST 요청으로 엔터프라이즈 기능 설정
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, feature, settings } = body;

    switch (action) {
      case 'enable':
        return NextResponse.json({
          success: true,
          message: `${feature} 기능이 활성화되었습니다`,
          timestamp: new Date().toISOString(),
        });

      case 'disable':
        return NextResponse.json({
          success: true,
          message: `${feature} 기능이 비활성화되었습니다`,
          timestamp: new Date().toISOString(),
        });

      case 'configure':
        return NextResponse.json({
          success: true,
          message: `${feature} 기능이 구성되었습니다`,
          settings,
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json(
          {
            error: `지원되지 않는 액션: ${action}`,
          },
          { status: 400 }
        );
    }
  } catch (error) {
    debug.error('❌ 엔터프라이즈 설정 오류:', error);
    return NextResponse.json(
      {
        error: '엔터프라이즈 설정 중 오류가 발생했습니다',
      },
      { status: 500 }
    );
  }
}
