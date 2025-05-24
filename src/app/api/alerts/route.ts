import { NextResponse } from 'next/server'
import { CacheService } from '../../../lib/redis'
import { ENTERPRISE_SERVERS } from '../../../lib/enterprise-servers'
import { 
  CRITICAL_FAILURE_CHAINS, 
  WARNING_FAILURES,
  FAILURE_TIMELINE 
} from '../../../lib/enterprise-failures'

export async function GET() {
  try {
    // 캐시에서 먼저 확인 (15초 캐시)
    const cached = await CacheService.get('alerts:active')
    if (cached) {
      return NextResponse.json({ 
        success: true, 
        data: cached, 
        timestamp: new Date().toISOString(),
        cached: true
      })
    }

    const currentTime = new Date()

    // 🚨 활성 알림 생성
    const activeAlerts = []

    // CRITICAL 알림들
    for (const failure of CRITICAL_FAILURE_CHAINS) {
      const server = ENTERPRISE_SERVERS.find(s => s.name === failure.origin)
      if (server) {
        activeAlerts.push({
          id: `critical-${failure.id}`,
          severity: 'critical' as const,
          title: failure.name,
          description: failure.description,
          server: {
            id: server.id,
            name: server.name,
            location: server.location
          },
          metrics: {
            cpu: server.metrics.cpu,
            memory: server.metrics.memory,
            disk: server.metrics.disk,
            latency: server.metrics.network.latency
          },
          startTime: failure.startTime,
          duration: Math.round((currentTime.getTime() - new Date(failure.startTime).getTime()) / (1000 * 60)), // 분 단위
          impact: failure.businessImpact,
          affectedSystems: failure.affected,
          estimatedResolution: failure.estimatedResolution,
          rootCause: failure.rootCause,
          status: 'active',
          acknowledgedBy: null,
          actions: [
            '즉시 해당 서버 점검',
            '연관 서버 상태 모니터링',
            '비즈니스 영향 평가',
            '복구 절차 시작'
          ]
        })
      }
    }

    // WARNING 알림들
    for (const failure of WARNING_FAILURES) {
      const server = ENTERPRISE_SERVERS.find(s => s.name === failure.origin)
      if (server) {
        activeAlerts.push({
          id: `warning-${failure.id}`,
          severity: 'warning' as const,
          title: failure.name,
          description: failure.description,
          server: {
            id: server.id,
            name: server.name,
            location: server.location
          },
          metrics: {
            cpu: server.metrics.cpu,
            memory: server.metrics.memory,
            disk: server.metrics.disk,
            latency: server.metrics.network.latency
          },
          startTime: failure.startTime,
          duration: Math.round((currentTime.getTime() - new Date(failure.startTime).getTime()) / (1000 * 60)),
          impact: failure.businessImpact,
          affectedSystems: failure.affected,
          estimatedResolution: failure.estimatedResolution,
          rootCause: failure.rootCause,
          status: 'active',
          acknowledgedBy: null,
          actions: [
            '서버 상태 점검',
            '성능 지표 모니터링',
            '예방 조치 검토'
          ]
        })
      }
    }

    // 리소스 임계값 초과 알림
    const resourceThresholdAlerts = ENTERPRISE_SERVERS
      .filter(server => 
        server.metrics.cpu > 90 || 
        server.metrics.memory > 90 || 
        server.metrics.disk > 90
      )
      .map(server => ({
        id: `resource-${server.id}`,
        severity: server.metrics.cpu > 95 || server.metrics.memory > 95 || server.metrics.disk > 95 
          ? 'critical' as const 
          : 'warning' as const,
        title: `리소스 임계값 초과: ${server.name}`,
        description: `CPU ${server.metrics.cpu}%, 메모리 ${server.metrics.memory}%, 디스크 ${server.metrics.disk}%`,
        server: {
          id: server.id,
          name: server.name,
          location: server.location
        },
        metrics: {
          cpu: server.metrics.cpu,
          memory: server.metrics.memory,
          disk: server.metrics.disk,
          latency: server.metrics.network.latency
        },
        startTime: new Date(currentTime.getTime() - (10 * 60 * 1000)).toISOString(), // 10분 전 시작으로 가정
        duration: 10,
        impact: 5,
        affectedSystems: [server.name],
        estimatedResolution: '리소스 최적화 또는 확장 필요',
        rootCause: '높은 리소스 사용률',
        status: 'active',
        acknowledgedBy: null,
        actions: [
          '리소스 사용량 분석',
          '불필요한 프로세스 정리',
          '용량 확장 검토'
        ]
      }))

    // 모든 알림 통합 및 정렬
    const allAlerts = [...activeAlerts, ...resourceThresholdAlerts]
      .sort((a, b) => {
        // 심각도 순서: critical > warning > info
        const severityOrder = { critical: 3, warning: 2, info: 1 }
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
          return severityOrder[b.severity] - severityOrder[a.severity]
        }
        // 같은 심각도면 시작 시간 순서 (최신순)
        return new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      })

    // 📊 알림 통계
    const alertStats = {
      total: allAlerts.length,
      critical: allAlerts.filter(a => a.severity === 'critical').length,
      warning: allAlerts.filter(a => a.severity === 'warning').length,
      info: 0, // info 알림이 현재 없으므로 0으로 설정
      acknowledged: allAlerts.filter(a => a.acknowledgedBy !== null).length,
      unacknowledged: allAlerts.filter(a => a.acknowledgedBy === null).length,
      averageDuration: Math.round(
        allAlerts.reduce((sum, alert) => sum + alert.duration, 0) / allAlerts.length
      ),
      highImpactAlerts: allAlerts.filter(a => a.impact >= 7).length
    }

    // 🔔 긴급 알림 (즉시 대응 필요)
    const urgentAlerts = allAlerts.filter(alert => 
      alert.severity === 'critical' && 
      alert.duration > 15 && // 15분 이상 지속
      alert.acknowledgedBy === null
    )

    // 📈 시간대별 알림 발생 패턴
    const timelineEvents = FAILURE_TIMELINE.map(event => ({
      time: event.time,
      event: event.event,
      severity: event.severity,
      servers: event.servers,
      timestamp: event.time === '현재' ? currentTime.toISOString() : 
                new Date(`2024-01-01 ${event.time.replace(' KST', '')}`).toISOString()
    }))

    const alertData = {
      // 📊 활성 알림 목록
      alerts: allAlerts,
      
      // 📈 알림 통계
      statistics: alertStats,
      
      // 🚨 긴급 대응 필요
      urgentAlerts,
      
      // ⏰ 장애 타임라인
      timeline: timelineEvents,
      
      // 🎯 권장 조치사항
      recommendedActions: {
        immediate: [
          '🔴 DB 마스터 서버 긴급 점검 및 쿼리 최적화',
          '🔴 스토리지 서버 디스크 정리 및 용량 확장',
          '🔴 K8s Control Plane etcd 상태 점검'
        ],
        shortTerm: [
          '⚠️ 영향받는 애플리케이션 모니터링 강화',
          '⚠️ 백업 시스템 복구 작업 우선 처리',
          '⚠️ 워커 노드 리소스 재분배'
        ],
        longTerm: [
          '💡 자동 알림 시스템 개선',
          '💡 예측적 장애 감지 도입',
          '💡 용량 계획 및 확장 정책 수립'
        ]
      },
      
      // 📱 알림 설정 정보
      notificationSettings: {
        criticalAlertChannels: ['SMS', 'Email', 'Slack', 'PagerDuty'],
        warningAlertChannels: ['Email', 'Slack'],
        escalationPolicy: {
          level1: '즉시 (0분)',
          level2: '15분 후 팀 리더',
          level3: '30분 후 부서장',
          level4: '60분 후 CTO'
        },
        businessHoursOnly: false,
        autoAcknowledgment: false
      },

      // 🔄 자동 복구 상태
      autoRecovery: {
        enabled: true,
        successRate: 0.67, // 67%
        attemptedActions: 12,
        successfulActions: 8,
        lastAttempt: new Date(currentTime.getTime() - (5 * 60 * 1000)).toISOString()
      }
    }

    // 캐시에 저장 (15초)
    await CacheService.set('alerts:active', alertData, 15)

    return NextResponse.json({
      success: true,
      data: alertData,
      timestamp: new Date().toISOString(),
      cached: false,
      metadata: {
        refreshInterval: 15, // seconds
        alertCount: allAlerts.length,
        criticalCount: alertStats.critical,
        lastUpdated: currentTime.toISOString()
      }
    })

  } catch (error) {
    console.error('Alerts API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch alerts',
      timestamp: new Date().toISOString(),
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 