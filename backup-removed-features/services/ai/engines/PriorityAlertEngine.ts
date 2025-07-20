/**
 * 🚨 의존성 기반 알림 우선순위 엔진
 *
 * 시뮬레이션 데이터 + 규칙엔진을 활용한 스마트 알림 시스템
 * DB장애 → API영향 → 웹서버영향 순으로 우선순위 알림
 * Vercel 메모리 제약(1GB) 및 실행시간 제약(10초) 최적화
 */

export interface ServerAlert {
  id: string;
  serverId: string;
  serverName: string;
  alertType:
    | 'cpu'
    | 'memory'
    | 'disk'
    | 'network'
    | 'response_time'
    | 'service_down';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  timestamp: number;
  metrics?: {
    cpu?: number;
    memory?: number;
    disk?: number;
    responseTime?: number;
  };
}

export interface ServerDependency {
  id: string;
  name: string;
  type:
    | 'database'
    | 'api'
    | 'web'
    | 'cache'
    | 'queue'
    | 'load_balancer'
    | 'cdn';
  dependsOn: string[]; // 의존하는 서버 ID들
  criticality: 'essential' | 'important' | 'optional';
  impact_radius: number; // 영향 반경 (1-10)
}

export interface PrioritizedAlert extends ServerAlert {
  priority_score: number;
  impact_analysis: {
    affected_servers: string[];
    cascade_risk: 'high' | 'medium' | 'low';
    business_impact: 'critical' | 'major' | 'minor';
    estimated_downtime: string;
  };
  recommended_actions: string[];
  escalation_path: string[];
}

export interface AlertPriorityInsights {
  prioritized_alerts: PrioritizedAlert[];
  cascade_warnings: string[];
  resource_allocation: {
    immediate_attention: PrioritizedAlert[];
    scheduled_maintenance: PrioritizedAlert[];
    monitoring_only: PrioritizedAlert[];
  };
  system_health_score: number;
  recommendations: string[];
  processing_time: number;
}

export class PriorityAlertEngine {
  private readonly CRITICALITY_WEIGHTS = {
    essential: 10,
    important: 5,
    optional: 1,
  };

  private readonly SEVERITY_MULTIPLIERS = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  private readonly ALERT_TYPE_WEIGHTS = {
    service_down: 10,
    cpu: 6,
    memory: 7,
    disk: 5,
    network: 8,
    response_time: 4,
  };

  /**
   * 🚨 의존성 기반 알림 우선순위 분석 (10분 내 구현)
   */
  async prioritizeAlerts(
    alerts: ServerAlert[],
    dependencies: ServerDependency[]
  ): Promise<AlertPriorityInsights> {
    const startTime = Date.now();

    try {
      // 1. 의존성 그래프 구축
      const dependencyGraph = this.buildDependencyGraph(dependencies);

      // 2. 각 알림의 우선순위 점수 계산
      const prioritizedAlerts = await this.calculateAlertPriorities(
        alerts,
        dependencies,
        dependencyGraph
      );

      // 3. 캐스케이드 분석 및 경고
      const cascadeWarnings = this.analyzeCascadeRisks(
        prioritizedAlerts,
        dependencyGraph
      );

      // 4. 리소스 할당 전략
      const resourceAllocation = this.categorizeByUrgency(prioritizedAlerts);

      // 5. 시스템 전체 건강도 계산
      const systemHealthScore =
        this.calculateSystemHealthScore(prioritizedAlerts);

      // 6. 권장사항 생성
      const recommendations = this.generateActionRecommendations(
        prioritizedAlerts,
        cascadeWarnings,
        systemHealthScore
      );

      return {
        prioritized_alerts: prioritizedAlerts.sort(
          (a, b) => b.priority_score - a.priority_score
        ),
        cascade_warnings: cascadeWarnings,
        resource_allocation: resourceAllocation,
        system_health_score: systemHealthScore,
        recommendations: recommendations,
        processing_time: Date.now() - startTime,
      };
    } catch (error) {
      console.error('❌ 알림 우선순위 분석 실패:', error);
      return this.getFallbackAnalysis(alerts, Date.now() - startTime);
    }
  }

  /**
   * 의존성 그래프 구축
   */
  private buildDependencyGraph(
    dependencies: ServerDependency[]
  ): Map<string, string[]> {
    const graph = new Map<string, string[]>();

    dependencies.forEach(dep => {
      // 정방향: 이 서버가 의존하는 서버들
      graph.set(dep.id, dep.dependsOn);

      // 역방향: 이 서버에 의존하는 서버들
      dep.dependsOn.forEach(dependencyId => {
        const dependents = graph.get(`reverse_${dependencyId}`) || [];
        dependents.push(dep.id);
        graph.set(`reverse_${dependencyId}`, dependents);
      });
    });

    return graph;
  }

  /**
   * 알림 우선순위 점수 계산
   */
  private async calculateAlertPriorities(
    alerts: ServerAlert[],
    dependencies: ServerDependency[],
    dependencyGraph: Map<string, string[]>
  ): Promise<PrioritizedAlert[]> {
    return alerts.map(alert => {
      const server = dependencies.find(dep => dep.id === alert.serverId);
      if (!server) {
        return this.createBasicPrioritizedAlert(alert);
      }

      // 기본 점수 계산
      let priorityScore = this.calculateBaseScore(alert, server);

      // 의존성 영향 계산
      const impactAnalysis = this.analyzeImpact(alert, server, dependencyGraph);
      priorityScore += impactAnalysis.impact_multiplier;

      // 권장 조치 생성
      const recommendedActions = this.generateRecommendedActions(
        alert,
        server,
        impactAnalysis
      );

      // 에스컬레이션 경로 생성
      const escalationPath = this.generateEscalationPath(alert, server);

      return {
        ...alert,
        priority_score: Math.min(100, priorityScore), // 최대 100점
        impact_analysis: {
          affected_servers: impactAnalysis.affected_servers,
          cascade_risk: impactAnalysis.cascade_risk,
          business_impact: impactAnalysis.business_impact,
          estimated_downtime: impactAnalysis.estimated_downtime,
        },
        recommended_actions: recommendedActions,
        escalation_path: escalationPath,
      };
    });
  }

  /**
   * 기본 점수 계산
   */
  private calculateBaseScore(
    alert: ServerAlert,
    server: ServerDependency
  ): number {
    const severityScore = this.SEVERITY_MULTIPLIERS[alert.severity] * 5;
    const alertTypeScore = this.ALERT_TYPE_WEIGHTS[alert.alertType];
    const criticalityScore = this.CRITICALITY_WEIGHTS[server.criticality];
    const impactRadiusScore = server.impact_radius;

    return (
      severityScore + alertTypeScore + criticalityScore + impactRadiusScore
    );
  }

  /**
   * 영향 분석
   */
  private analyzeImpact(
    alert: ServerAlert,
    server: ServerDependency,
    dependencyGraph: Map<string, string[]>
  ): {
    affected_servers: string[];
    cascade_risk: 'high' | 'medium' | 'low';
    business_impact: 'critical' | 'major' | 'minor';
    estimated_downtime: string;
    impact_multiplier: number;
  } {
    // 영향받는 서버들 찾기
    const affectedServers = this.findAffectedServers(
      server.id,
      dependencyGraph
    );

    // 캐스케이드 위험도 계산
    const cascadeRisk = this.calculateCascadeRisk(
      affectedServers.length,
      server.type
    );

    // 비즈니스 영향도 계산
    const businessImpact = this.calculateBusinessImpact(
      server,
      affectedServers.length
    );

    // 예상 다운타임 계산
    const estimatedDowntime = this.estimateDowntime(alert, server);

    // 영향 승수 계산
    const impactMultiplier =
      affectedServers.length * 2 +
      (cascadeRisk === 'high' ? 20 : cascadeRisk === 'medium' ? 10 : 0);

    return {
      affected_servers: affectedServers,
      cascade_risk: cascadeRisk,
      business_impact: businessImpact,
      estimated_downtime: estimatedDowntime,
      impact_multiplier: impactMultiplier,
    };
  }

  /**
   * 영향받는 서버들 찾기 (DFS)
   */
  private findAffectedServers(
    serverId: string,
    dependencyGraph: Map<string, string[]>
  ): string[] {
    const affected = new Set<string>();
    const visited = new Set<string>();

    const dfs = (currentId: string) => {
      if (visited.has(currentId)) return;
      visited.add(currentId);

      const dependents = dependencyGraph.get(`reverse_${currentId}`) || [];
      dependents.forEach(dependent => {
        affected.add(dependent);
        dfs(dependent);
      });
    };

    dfs(serverId);
    return Array.from(affected);
  }

  /**
   * 캐스케이드 위험도 계산
   */
  private calculateCascadeRisk(
    affectedCount: number,
    serverType: string
  ): 'high' | 'medium' | 'low' {
    if (serverType === 'database' && affectedCount > 0) return 'high';
    if (affectedCount >= 5) return 'high';
    if (affectedCount >= 2) return 'medium';
    return 'low';
  }

  /**
   * 비즈니스 영향도 계산
   */
  private calculateBusinessImpact(
    server: ServerDependency,
    affectedCount: number
  ): 'critical' | 'major' | 'minor' {
    if (server.criticality === 'essential' || affectedCount >= 5)
      return 'critical';
    if (server.criticality === 'important' || affectedCount >= 2)
      return 'major';
    return 'minor';
  }

  /**
   * 예상 다운타임 계산
   */
  private estimateDowntime(
    alert: ServerAlert,
    server: ServerDependency
  ): string {
    const baseTime = {
      service_down: 30,
      cpu: 5,
      memory: 10,
      disk: 15,
      network: 20,
      response_time: 5,
    }[alert.alertType];

    const multiplier =
      server.criticality === 'essential'
        ? 0.5
        : server.criticality === 'important'
          ? 1
          : 1.5;

    const estimatedMinutes = Math.ceil(baseTime * multiplier);

    if (estimatedMinutes < 60) return `${estimatedMinutes}분`;
    return `${Math.ceil(estimatedMinutes / 60)}시간`;
  }

  /**
   * 권장 조치 생성
   */
  private generateRecommendedActions(
    alert: ServerAlert,
    server: ServerDependency,
    impactAnalysis: any
  ): string[] {
    const actions: string[] = [];

    // 알림 타입별 기본 조치
    const basicActions = {
      service_down: ['즉시 서비스 재시작', '로그 분석', '헬스체크 확인'],
      cpu: ['프로세스 최적화', 'CPU 사용량 모니터링 강화', '스케일링 검토'],
      memory: ['메모리 누수 점검', '불필요한 프로세스 종료', 'GC 최적화'],
      disk: ['디스크 정리', '로그 로테이션', '스토리지 확장 검토'],
      network: ['네트워크 연결 점검', '대역폭 모니터링', 'DNS 확인'],
      response_time: [
        '성능 프로파일링',
        '데이터베이스 쿼리 최적화',
        '캐시 확인',
      ],
    };

    actions.push(...(basicActions[alert.alertType] || []));

    // 서버 타입별 추가 조치
    if (server.type === 'database') {
      actions.push('읽기 전용 모드 전환 검토', '슬레이브 DB 상태 확인');
    } else if (server.type === 'load_balancer') {
      actions.push('트래픽 분산 재조정', '백업 로드밸런서 활성화');
    }

    // 영향도별 추가 조치
    if (impactAnalysis.cascade_risk === 'high') {
      actions.unshift('🚨 즉시 대응팀 소집', '관련 서비스 모니터링 강화');
    }

    return actions.slice(0, 5); // 최대 5개 조치
  }

  /**
   * 에스컬레이션 경로 생성
   */
  private generateEscalationPath(
    alert: ServerAlert,
    server: ServerDependency
  ): string[] {
    const basePath = ['운영팀', '시니어 엔지니어'];

    if (alert.severity === 'critical' || server.criticality === 'essential') {
      basePath.push('DevOps 리드', 'CTO');
    } else if (
      alert.severity === 'high' ||
      server.criticality === 'important'
    ) {
      basePath.push('DevOps 리드');
    }

    return basePath;
  }

  /**
   * 캐스케이드 위험 분석
   */
  private analyzeCascadeRisks(
    alerts: PrioritizedAlert[],
    dependencyGraph: Map<string, string[]>
  ): string[] {
    const warnings: string[] = [];

    // 데이터베이스 관련 경고
    const dbAlerts = alerts.filter(
      a => a.impact_analysis.cascade_risk === 'high'
    );
    if (dbAlerts.length > 0) {
      warnings.push(
        `🚨 ${dbAlerts.length}개의 고위험 캐스케이드 알림 발생 - 즉시 대응 필요`
      );
    }

    // 동시 다발 알림 경고
    const criticalAlerts = alerts.filter(a => a.severity === 'critical');
    if (criticalAlerts.length >= 3) {
      warnings.push('⚠️ 다중 시스템 장애 가능성 - 전체 시스템 점검 권장');
    }

    return warnings;
  }

  /**
   * 긴급도별 분류
   */
  private categorizeByUrgency(alerts: PrioritizedAlert[]): {
    immediate_attention: PrioritizedAlert[];
    scheduled_maintenance: PrioritizedAlert[];
    monitoring_only: PrioritizedAlert[];
  } {
    return {
      immediate_attention: alerts.filter(a => a.priority_score >= 70),
      scheduled_maintenance: alerts.filter(
        a => a.priority_score >= 30 && a.priority_score < 70
      ),
      monitoring_only: alerts.filter(a => a.priority_score < 30),
    };
  }

  /**
   * 시스템 건강도 계산
   */
  private calculateSystemHealthScore(alerts: PrioritizedAlert[]): number {
    if (alerts.length === 0) return 100;

    const totalImpact = alerts.reduce(
      (sum, alert) => sum + alert.priority_score,
      0
    );
    const avgImpact = totalImpact / alerts.length;

    return Math.max(0, Math.min(100, 100 - avgImpact));
  }

  /**
   * 권장사항 생성
   */
  private generateActionRecommendations(
    alerts: PrioritizedAlert[],
    cascadeWarnings: string[],
    healthScore: number
  ): string[] {
    const recommendations: string[] = [];

    if (healthScore < 50) {
      recommendations.push(
        '🚨 시스템 상태가 심각합니다. 즉시 전체 점검이 필요합니다.'
      );
    } else if (healthScore < 70) {
      recommendations.push('⚠️ 시스템 안정성 개선이 필요합니다.');
    }

    if (cascadeWarnings.length > 0) {
      recommendations.push(
        '🔄 캐스케이드 장애 방지를 위한 의존성 검토가 필요합니다.'
      );
    }

    const immediateAlerts = alerts.filter(a => a.priority_score >= 70);
    if (immediateAlerts.length > 0) {
      recommendations.push(
        `⚡ ${immediateAlerts.length}개의 즉시 대응 필요 알림이 있습니다.`
      );
    }

    return recommendations;
  }

  /**
   * 기본 우선순위 알림 생성
   */
  private createBasicPrioritizedAlert(alert: ServerAlert): PrioritizedAlert {
    return {
      ...alert,
      priority_score: this.SEVERITY_MULTIPLIERS[alert.severity] * 10,
      impact_analysis: {
        affected_servers: [],
        cascade_risk: 'low',
        business_impact: 'minor',
        estimated_downtime: '5분',
      },
      recommended_actions: ['기본 점검 수행'],
      escalation_path: ['운영팀'],
    };
  }

  /**
   * 폴백 분석 결과
   */
  private getFallbackAnalysis(
    alerts: ServerAlert[],
    processingTime: number
  ): AlertPriorityInsights {
    return {
      prioritized_alerts: alerts.map(alert =>
        this.createBasicPrioritizedAlert(alert)
      ),
      cascade_warnings: ['⚠️ 우선순위 분석 중 오류 발생'],
      resource_allocation: {
        immediate_attention: [],
        scheduled_maintenance: alerts.map(alert =>
          this.createBasicPrioritizedAlert(alert)
        ),
        monitoring_only: [],
      },
      system_health_score: 70,
      recommendations: ['🔄 시스템 안정화 후 재분석을 권장합니다'],
      processing_time: processingTime,
    };
  }
}

export const priorityAlertEngine = new PriorityAlertEngine();
