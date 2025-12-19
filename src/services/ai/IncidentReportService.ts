/**
 * 🚨 IncidentReportService - 장애 분석 및 자동 보고서 생성
 *
 * 서버 메트릭을 분석하여 장애를 감지하고
 * 영향 범위를 파악하여 자동으로 보고서 생성
 */

import { getThreshold, isCritical, isWarning } from '@/config/rules';
import { getCachedData, setCachedData } from '../../lib/cache/cache-helper';

export interface IncidentReport {
  id: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affected: string[];
  recommendations: string[];
  title?: string;
  description?: string;
  rootCause?: string;
  impact?: {
    users?: number;
    services?: string[];
    estimatedDowntime?: number;
    businessImpact?: string;
  };
  metrics?: {
    cpu?: number;
    memory?: number;
    disk?: number;
    network?: number;
    errorRate?: number;
    responseTime?: number;
  };
  timeline?: {
    detected: string;
    started?: string;
    acknowledged?: string;
    resolved?: string;
  };
  status?: 'open' | 'investigating' | 'identified' | 'monitoring' | 'resolved';
}

interface ServerMetric {
  serverId: string;
  serverName?: string;
  cpu: number;
  memory: number;
  disk: number;
  network?: number;
  status?: string;
  errorRate?: number;
  responseTime?: number;
}

interface IncidentPattern {
  type: string;
  pattern: (metrics: ServerMetric) => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  recommendations: string[];
}

export class IncidentReportService {
  private incidentPatterns: IncidentPattern[] = [
    // CPU 과부하
    {
      type: 'cpu_overload',
      pattern: (m) => isCritical('cpu', m.cpu),
      severity: 'critical',
      title: 'CPU 과부하 감지',
      recommendations: [
        '프로세스 확인 및 불필요한 프로세스 종료',
        '자동 스케일링 활성화',
        '부하 분산 설정 확인',
        'CPU 사용량이 높은 쿼리 최적화',
      ],
    },

    // 메모리 부족
    {
      type: 'memory_shortage',
      pattern: (m) => isCritical('memory', m.memory),
      severity: 'high',
      title: '메모리 부족 경고',
      recommendations: [
        '메모리 누수 확인',
        '캐시 설정 최적화',
        '메모리 증설 고려',
        '불필요한 서비스 재시작',
      ],
    },

    // 디스크 공간 부족
    {
      type: 'disk_full',
      pattern: (m) => isCritical('disk', m.disk),
      severity: 'high',
      title: '디스크 공간 부족',
      recommendations: [
        '로그 파일 정리',
        '오래된 백업 삭제',
        '임시 파일 제거',
        '디스크 용량 증설 계획',
      ],
    },

    // 네트워크 포화
    {
      type: 'network_saturation',
      pattern: (m) => isCritical('network', m.network || 0),
      severity: 'medium',
      title: '네트워크 트래픽 포화',
      recommendations: [
        '트래픽 패턴 분석',
        'CDN 설정 확인',
        '대역폭 증설 고려',
        'DDoS 공격 가능성 확인',
      ],
    },

    // 높은 에러율
    {
      type: 'high_error_rate',
      pattern: (m) => (m.errorRate || 0) > 5,
      severity: 'high',
      title: '높은 에러율 감지',
      recommendations: [
        '에러 로그 분석',
        '최근 배포 롤백 고려',
        '외부 API 상태 확인',
        '데이터베이스 연결 확인',
      ],
    },

    // 응답 시간 지연
    {
      type: 'slow_response',
      pattern: (m) => isWarning('responseTime', m.responseTime || 0),
      severity: 'medium',
      title: '응답 시간 지연',
      recommendations: [
        '쿼리 최적화',
        '캐시 설정 확인',
        '인덱스 재구성',
        '서버 리소스 확인',
      ],
    },

    // 복합 장애 (여러 지표 동시 이상)
    {
      type: 'multiple_issues',
      pattern: (m) => isWarning('cpu', m.cpu) && isWarning('memory', m.memory),
      severity: 'critical',
      title: '복합 시스템 장애',
      recommendations: [
        '즉시 스케일 아웃 실행',
        '긴급 대응팀 호출',
        '트래픽 제한 활성화',
        '백업 시스템 전환 준비',
      ],
    },
  ];

  /**
   * 장애 분석 및 보고서 생성
   */
  async analyzeIncident(
    data: ServerMetric | ServerMetric[]
  ): Promise<IncidentReport> {
    const metrics = Array.isArray(data) ? data : [data];

    // 캐시 확인
    const cacheKey = `incident:${JSON.stringify(metrics.map((m) => m.serverId)).slice(0, 50)}`;
    const cached = await getCachedData<IncidentReport>(cacheKey);

    if (cached) {
      return cached;
    }

    // 장애 패턴 감지
    const detectedIncidents = this.detectIncidents(metrics);

    // 가장 심각한 장애 선택
    const primaryIncident = this.selectPrimaryIncident(detectedIncidents);

    // 영향 범위 분석
    const affectedServers = this.analyzeAffectedServers(
      metrics,
      primaryIncident
    );

    // 연쇄 영향 분석
    const cascadeImpact = this.analyzeCascadeImpact(affectedServers, metrics);

    // 보고서 생성
    const report: IncidentReport = {
      id: this.generateIncidentId(),
      timestamp: new Date().toISOString(),
      severity: primaryIncident?.severity || 'low',
      affected: affectedServers,
      recommendations: this.generateRecommendations(
        primaryIncident,
        cascadeImpact
      ),
      title: primaryIncident?.title || '시스템 상태 정상',
      description: this.generateDescription(primaryIncident, metrics),
      rootCause: this.identifyRootCause(primaryIncident, metrics),
      impact: {
        users: this.estimateAffectedUsers(affectedServers),
        services: cascadeImpact.services,
        estimatedDowntime: this.estimateDowntime(primaryIncident),
        businessImpact: this.assessBusinessImpact(
          primaryIncident,
          affectedServers
        ),
      },
      metrics: this.aggregateMetrics(metrics),
      timeline: {
        detected: new Date().toISOString(),
        started: this.estimateStartTime(metrics),
      },
      status: primaryIncident ? 'investigating' : 'monitoring',
    };

    // 캐시 저장
    void setCachedData(cacheKey, report, 300);

    return report;
  }

  /**
   * 장애 패턴 감지
   */
  private detectIncidents(metrics: ServerMetric[]): IncidentPattern[] {
    const incidents: IncidentPattern[] = [];

    for (const metric of metrics) {
      for (const pattern of this.incidentPatterns) {
        if (pattern.pattern(metric)) {
          incidents.push(pattern);
        }
      }
    }

    return incidents;
  }

  /**
   * 주요 장애 선택
   */
  private selectPrimaryIncident(
    incidents: IncidentPattern[]
  ): IncidentPattern | null {
    if (incidents.length === 0) return null;

    // 심각도 우선순위
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };

    const sortedIncidents = incidents.sort(
      (a, b) => severityOrder[b.severity] - severityOrder[a.severity]
    );
    return sortedIncidents[0] ?? null;
  }

  /**
   * 영향받는 서버 분석
   */
  private analyzeAffectedServers(
    metrics: ServerMetric[],
    incident: IncidentPattern | null
  ): string[] {
    if (!incident) return [];

    return metrics.filter((m) => incident.pattern(m)).map((m) => m.serverId);
  }

  /**
   * 연쇄 영향 분석
   */
  private analyzeCascadeImpact(
    affectedServers: string[],
    _metrics: ServerMetric[]
  ): { services: string[]; dependencies: string[] } {
    const services: Set<string> = new Set();
    const dependencies: Set<string> = new Set();

    // 서버 타입별 영향 분석
    for (const serverId of affectedServers) {
      if (serverId.includes('web')) {
        services.add('웹 서비스');
        dependencies.add('로드밸런서');
      }
      if (serverId.includes('api')) {
        services.add('API 서비스');
        dependencies.add('데이터베이스');
      }
      if (serverId.includes('db')) {
        services.add('데이터베이스');
        services.add('API 서비스');
        services.add('웹 서비스');
      }
      if (serverId.includes('cache')) {
        services.add('캐시 서비스');
        dependencies.add('응답 속도');
      }
    }

    return {
      services: Array.from(services),
      dependencies: Array.from(dependencies),
    };
  }

  /**
   * 권장사항 생성
   */
  private generateRecommendations(
    incident: IncidentPattern | null,
    cascadeImpact: { services: string[]; dependencies: string[] }
  ): string[] {
    const recommendations: string[] = [];

    // 기본 권장사항
    if (incident) {
      recommendations.push(...incident.recommendations);
    }

    // 연쇄 영향 기반 권장사항
    if (cascadeImpact.services.includes('데이터베이스')) {
      recommendations.push('데이터베이스 백업 상태 확인');
      recommendations.push('읽기 전용 복제본 활성화');
    }

    if (cascadeImpact.services.includes('API 서비스')) {
      recommendations.push('API 요청 제한 설정');
      recommendations.push('비필수 API 일시 중단');
    }

    // 중복 제거
    return [...new Set(recommendations)];
  }

  /**
   * 설명 생성
   */
  private generateDescription(
    incident: IncidentPattern | null,
    metrics: ServerMetric[]
  ): string {
    if (!incident) {
      return '모든 시스템이 정상 범위 내에서 작동 중입니다.';
    }

    const avgMetrics = this.aggregateMetrics(metrics);
    const cpuValue = avgMetrics?.cpu || 0;
    const memoryValue = avgMetrics?.memory || 0;

    return (
      `${incident.title}가 감지되었습니다. ` +
      `현재 평균 CPU ${cpuValue.toFixed(1)}%, ` +
      `메모리 ${memoryValue.toFixed(1)}% 사용 중입니다. ` +
      `${metrics.length}개 서버가 영향을 받고 있습니다.`
    );
  }

  /**
   * 근본 원인 식별
   */
  private identifyRootCause(
    incident: IncidentPattern | null,
    _metrics: ServerMetric[]
  ): string {
    if (!incident) return '특별한 이상 없음';

    switch (incident.type) {
      case 'cpu_overload':
        return '과도한 요청 처리 또는 비효율적인 코드 실행';
      case 'memory_shortage':
        return '메모리 누수 또는 캐시 오버플로우';
      case 'disk_full':
        return '로그 축적 또는 백업 파일 과다';
      case 'network_saturation':
        return '트래픽 급증 또는 DDoS 공격 가능성';
      case 'high_error_rate':
        return '애플리케이션 버그 또는 외부 서비스 장애';
      case 'slow_response':
        return '데이터베이스 쿼리 지연 또는 네트워크 병목';
      case 'multiple_issues':
        return '시스템 전반적 과부하 또는 연쇄 장애';
      default:
        return '원인 분석 중';
    }
  }

  /**
   * 영향받는 사용자 추정
   */
  private estimateAffectedUsers(affectedServers: string[]): number {
    // 서버당 평균 사용자 수 추정
    const usersPerServer = 1000;
    return affectedServers.length * usersPerServer;
  }

  /**
   * 다운타임 추정 (분)
   */
  private estimateDowntime(incident: IncidentPattern | null): number {
    if (!incident) return 0;

    const downtimeMap = {
      critical: 60,
      high: 30,
      medium: 15,
      low: 5,
    };

    return downtimeMap[incident.severity];
  }

  /**
   * 비즈니스 영향 평가
   */
  private assessBusinessImpact(
    incident: IncidentPattern | null,
    affectedServers: string[]
  ): string {
    if (!incident) return '영향 없음';

    if (incident.severity === 'critical') {
      return '심각: 서비스 전면 중단 가능성';
    }

    if (affectedServers.length > 5) {
      return '높음: 다수 서비스 영향';
    }

    if (incident.severity === 'high') {
      return '중간: 일부 기능 제한';
    }

    return '낮음: 제한적 영향';
  }

  /**
   * 메트릭 집계
   */
  private aggregateMetrics(metrics: ServerMetric[]): IncidentReport['metrics'] {
    if (metrics.length === 0) {
      return { cpu: 0, memory: 0, disk: 0, network: 0 };
    }

    const sum = metrics.reduce(
      (acc, m) => ({
        cpu: acc.cpu + m.cpu,
        memory: acc.memory + m.memory,
        disk: acc.disk + m.disk,
        network: acc.network + (m.network || 0),
        errorRate: acc.errorRate + (m.errorRate || 0),
        responseTime: acc.responseTime + (m.responseTime || 0),
      }),
      {
        cpu: 0,
        memory: 0,
        disk: 0,
        network: 0,
        errorRate: 0,
        responseTime: 0,
      }
    );

    const count = metrics.length;

    return {
      cpu: sum.cpu / count,
      memory: sum.memory / count,
      disk: sum.disk / count,
      network: sum.network / count,
      errorRate: sum.errorRate / count,
      responseTime: sum.responseTime / count,
    };
  }

  /**
   * 시작 시간 추정
   */
  private estimateStartTime(_metrics: ServerMetric[]): string {
    // 현재 시간에서 5분 전으로 추정
    const startTime = new Date();
    startTime.setMinutes(startTime.getMinutes() - 5);
    return startTime.toISOString();
  }

  /**
   * 장애 ID 생성
   */
  private generateIncidentId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `INC-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * 대량 분석 (여러 서버 동시 분석)
   */
  async analyzeBatch(serverMetrics: ServerMetric[]): Promise<IncidentReport[]> {
    const reports: IncidentReport[] = [];

    // 서버별 그룹화
    const groupedByStatus = this.groupByStatus(serverMetrics);

    // 상태별 분석
    for (const [status, metrics] of Object.entries(groupedByStatus)) {
      if (status !== 'normal' && metrics.length > 0) {
        const report = await this.analyzeIncident(metrics);
        reports.push(report);
      }
    }

    return reports;
  }

  /**
   * 상태별 그룹화
   */
  private groupByStatus(
    metrics: ServerMetric[]
  ): Record<string, ServerMetric[]> {
    const groups: Record<string, ServerMetric[]> = {
      critical: [],
      high: [],
      medium: [],
      low: [],
      normal: [],
    };

    // 임계값 조회 (system-rules.json 기반)
    const cpuThreshold = getThreshold('cpu');
    const memThreshold = getThreshold('memory');

    for (const metric of metrics) {
      // Critical: 둘 다 critical 수준 이상
      if (
        isCritical('cpu', metric.cpu) ||
        isCritical('memory', metric.memory)
      ) {
        groups.critical?.push(metric);
      }
      // High: Warning 이상 (하나라도)
      else if (
        isWarning('cpu', metric.cpu) ||
        isWarning('memory', metric.memory)
      ) {
        groups.high?.push(metric);
      }
      // Medium: Warning 직전 (warning의 80% 이상)
      else if (
        metric.cpu > cpuThreshold.warning * 0.8 ||
        metric.memory > memThreshold.warning * 0.8
      ) {
        groups.medium?.push(metric);
      }
      // Low: 관심 수준 (warning의 60% 이상)
      else if (
        metric.cpu > cpuThreshold.warning * 0.6 ||
        metric.memory > memThreshold.warning * 0.6
      ) {
        groups.low?.push(metric);
      }
      // Normal: 정상
      else {
        groups.normal?.push(metric);
      }
    }

    return groups;
  }
}
