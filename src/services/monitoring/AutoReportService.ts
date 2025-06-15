/**
 * 📊 자동 장애 보고서 서비스 (Vercel 최적화)
 * 
 * 간단한 패턴 기반 장애 감지 및 보고서 생성
 * - 실시간 메트릭 분석
 * - 임계값 기반 알림
 * - Slack 웹훅 연동
 * - 메모리 기반 캐싱
 */

export interface ServerMetric {
  serverId: string;
  serverName: string;
  timestamp: string;
  cpu: number;
  memory: number;
  disk: number;
  network: {
    in: number;
    out: number;
  };
  status: 'running' | 'warning' | 'error';
}

export interface IncidentReport {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedServers: string[];
  detectedAt: string;
  metrics: ServerMetric[];
  recommendations: string[];
  status: 'active' | 'resolved';
}

export interface AlertThresholds {
  cpu: { warning: number; critical: number };
  memory: { warning: number; critical: number };
  disk: { warning: number; critical: number };
  network: { warning: number; critical: number };
}

export class AutoReportService {
  private static instance: AutoReportService;
  private incidents = new Map<string, IncidentReport>();
  private lastMetrics = new Map<string, ServerMetric>();
  private isEnabled: boolean;

  // 🚨 임계값 설정
  private readonly THRESHOLDS: AlertThresholds = {
    cpu: { warning: 80, critical: 95 },
    memory: { warning: 85, critical: 95 },
    disk: { warning: 90, critical: 98 },
    network: { warning: 800, critical: 950 }
  };

  // 🔔 Slack 웹훅 URL (환경변수에서 가져오기)
  private readonly SLACK_WEBHOOK = process.env.SLACK_WEBHOOK_URL || 
    'https://hooks.slack.com/services/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';

  private constructor() {
    this.isEnabled = process.env.AUTO_REPORT_ENABLED !== 'false';
    console.log(`🚨 자동 장애 보고서 서비스 초기화됨 (활성화: ${this.isEnabled})`);
  }

  public static getInstance(): AutoReportService {
    if (!AutoReportService.instance) {
      AutoReportService.instance = new AutoReportService();
    }
    return AutoReportService.instance;
  }

  /**
   * 📊 메트릭 분석 및 장애 감지
   */
  async analyzeMetrics(metrics: ServerMetric[]): Promise<IncidentReport[]> {
    if (!this.isEnabled) {
      return [];
    }

    const newIncidents: IncidentReport[] = [];

    for (const metric of metrics) {
      // 이전 메트릭과 비교
      const previousMetric = this.lastMetrics.get(metric.serverId);
      this.lastMetrics.set(metric.serverId, metric);

      // 장애 패턴 감지
      const incidents = this.detectIncidents(metric, previousMetric);
      newIncidents.push(...incidents);
    }

    // 새로운 장애 저장 및 알림
    for (const incident of newIncidents) {
      this.incidents.set(incident.id, incident);
      await this.sendAlert(incident);
    }

    return newIncidents;
  }

  /**
   * 🔍 장애 패턴 감지
   */
  private detectIncidents(current: ServerMetric, previous?: ServerMetric): IncidentReport[] {
    const incidents: IncidentReport[] = [];

    // CPU 사용률 체크
    if (current.cpu >= this.THRESHOLDS.cpu.critical) {
      incidents.push(this.createIncident(
        'cpu-critical',
        `${current.serverName} CPU 사용률 위험`,
        'critical',
        `CPU 사용률이 ${current.cpu}%로 위험 수준에 도달했습니다.`,
        [current.serverId],
        [current],
        [
          'CPU 집약적인 프로세스 확인',
          '서버 스케일 업 고려',
          '부하 분산 검토'
        ]
      ));
    } else if (current.cpu >= this.THRESHOLDS.cpu.warning) {
      incidents.push(this.createIncident(
        'cpu-warning',
        `${current.serverName} CPU 사용률 경고`,
        'medium',
        `CPU 사용률이 ${current.cpu}%로 경고 수준입니다.`,
        [current.serverId],
        [current],
        [
          'CPU 사용률 모니터링 강화',
          '프로세스 최적화 검토'
        ]
      ));
    }

    // 메모리 사용률 체크
    if (current.memory >= this.THRESHOLDS.memory.critical) {
      incidents.push(this.createIncident(
        'memory-critical',
        `${current.serverName} 메모리 사용률 위험`,
        'critical',
        `메모리 사용률이 ${current.memory}%로 위험 수준에 도달했습니다.`,
        [current.serverId],
        [current],
        [
          '메모리 누수 확인',
          '불필요한 프로세스 종료',
          '메모리 증설 고려'
        ]
      ));
    }

    // 디스크 사용률 체크
    if (current.disk >= this.THRESHOLDS.disk.critical) {
      incidents.push(this.createIncident(
        'disk-critical',
        `${current.serverName} 디스크 공간 부족`,
        'critical',
        `디스크 사용률이 ${current.disk}%로 위험 수준입니다.`,
        [current.serverId],
        [current],
        [
          '불필요한 파일 정리',
          '로그 파일 정리',
          '디스크 용량 확장'
        ]
      ));
    }

    // 급격한 변화 감지 (이전 메트릭이 있는 경우)
    if (previous) {
      const cpuDelta = current.cpu - previous.cpu;
      const memoryDelta = current.memory - previous.memory;

      if (cpuDelta > 30) {
        incidents.push(this.createIncident(
          'cpu-spike',
          `${current.serverName} CPU 급증`,
          'high',
          `CPU 사용률이 ${cpuDelta}% 급증했습니다. (${previous.cpu}% → ${current.cpu}%)`,
          [current.serverId],
          [current],
          [
            '급증 원인 분석',
            '프로세스 상태 확인',
            '부하 패턴 분석'
          ]
        ));
      }

      if (memoryDelta > 20) {
        incidents.push(this.createIncident(
          'memory-spike',
          `${current.serverName} 메모리 급증`,
          'high',
          `메모리 사용률이 ${memoryDelta}% 급증했습니다. (${previous.memory}% → ${current.memory}%)`,
          [current.serverId],
          [current],
          [
            '메모리 누수 의심',
            '애플리케이션 상태 확인',
            '메모리 덤프 분석'
          ]
        ));
      }
    }

    return incidents;
  }

  /**
   * 📝 장애 보고서 생성
   */
  private createIncident(
    type: string,
    title: string,
    severity: IncidentReport['severity'],
    description: string,
    affectedServers: string[],
    metrics: ServerMetric[],
    recommendations: string[]
  ): IncidentReport {
    const id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      id,
      title,
      severity,
      description,
      affectedServers,
      detectedAt: new Date().toISOString(),
      metrics,
      recommendations,
      status: 'active'
    };
  }

  /**
   * 🔔 Slack 알림 전송
   */
  private async sendAlert(incident: IncidentReport): Promise<void> {
    if (!this.SLACK_WEBHOOK) {
      console.log('Slack 웹훅이 설정되지 않음');
      return;
    }

    try {
      const color = this.getSeverityColor(incident.severity);
      const emoji = this.getSeverityEmoji(incident.severity);
      
      const payload = {
        text: `${emoji} 장애 감지: ${incident.title}`,
        attachments: [
          {
            color,
            title: incident.title,
            text: incident.description,
            fields: [
              {
                title: '심각도',
                value: incident.severity.toUpperCase(),
                short: true
              },
              {
                title: '영향받는 서버',
                value: incident.affectedServers.join(', '),
                short: true
              },
              {
                title: '감지 시간',
                value: new Date(incident.detectedAt).toLocaleString('ko-KR'),
                short: true
              },
              {
                title: '권장 조치',
                value: incident.recommendations.join('\n• '),
                short: false
              }
            ],
            footer: 'OpenManager Vibe v5 자동 장애 보고서',
            ts: Math.floor(new Date(incident.detectedAt).getTime() / 1000)
          }
        ]
      };

      const response = await fetch(this.SLACK_WEBHOOK, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        console.log(`✅ Slack 알림 전송 성공: ${incident.title}`);
      } else {
        console.error('❌ Slack 알림 전송 실패:', response.statusText);
      }

    } catch (error) {
      console.error('❌ Slack 알림 전송 오류:', error);
    }
  }

  /**
   * 🎨 심각도별 색상
   */
  private getSeverityColor(severity: IncidentReport['severity']): string {
    const colors = {
      low: '#36a64f',      // 녹색
      medium: '#ff9500',   // 주황색
      high: '#ff6b6b',     // 빨간색
      critical: '#d63031'  // 진한 빨간색
    };
    return colors[severity];
  }

  /**
   * 😀 심각도별 이모지
   */
  private getSeverityEmoji(severity: IncidentReport['severity']): string {
    const emojis = {
      low: '⚠️',
      medium: '🚨',
      high: '🔥',
      critical: '💥'
    };
    return emojis[severity];
  }

  /**
   * 📊 장애 현황 조회
   */
  getActiveIncidents(): IncidentReport[] {
    return Array.from(this.incidents.values())
      .filter(incident => incident.status === 'active')
      .sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime());
  }

  /**
   * 📈 장애 통계
   */
  getIncidentStats() {
    const incidents = Array.from(this.incidents.values());
    const active = incidents.filter(i => i.status === 'active');
    const resolved = incidents.filter(i => i.status === 'resolved');

    const severityCount = {
      low: incidents.filter(i => i.severity === 'low').length,
      medium: incidents.filter(i => i.severity === 'medium').length,
      high: incidents.filter(i => i.severity === 'high').length,
      critical: incidents.filter(i => i.severity === 'critical').length,
    };

    return {
      total: incidents.length,
      active: active.length,
      resolved: resolved.length,
      severityCount,
      lastIncident: incidents.length > 0 ? incidents[incidents.length - 1].detectedAt : null
    };
  }

  /**
   * ✅ 장애 해결 처리
   */
  resolveIncident(incidentId: string): boolean {
    const incident = this.incidents.get(incidentId);
    if (incident) {
      incident.status = 'resolved';
      return true;
    }
    return false;
  }

  /**
   * 🧹 오래된 장애 정리 (메모리 관리)
   */
  cleanupOldIncidents(maxAge: number = 24 * 60 * 60 * 1000): number {
    const cutoff = Date.now() - maxAge;
    let cleaned = 0;

    for (const [id, incident] of this.incidents) {
      const incidentTime = new Date(incident.detectedAt).getTime();
      if (incidentTime < cutoff && incident.status === 'resolved') {
        this.incidents.delete(id);
        cleaned++;
      }
    }

    return cleaned;
  }
}

// 싱글톤 인스턴스 export
export const autoReportService = AutoReportService.getInstance();

// 주기적 정리 (1시간마다)
if (typeof window === 'undefined') { // 서버 사이드에서만
  setInterval(() => {
    const cleaned = autoReportService.cleanupOldIncidents();
    if (cleaned > 0) {
      console.log(`🧹 ${cleaned}개의 오래된 장애 보고서 정리됨`);
    }
  }, 60 * 60 * 1000);
} 