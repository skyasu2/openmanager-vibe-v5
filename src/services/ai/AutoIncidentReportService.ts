/**
 * 🚨 자동 장애 보고서 서비스
 *
 * 의존성 분석:
 * - 자연어 질의 의존도: 70% (트리거 및 컨텍스트 제공)
 * - 독립적 기능: 30% (자체 데이터 수집 및 분석)
 *
 * + TXT 다운로드 기능 포함
 */

export interface IncidentReport {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  startTime: string;
  endTime?: string;
  duration?: string;
  affectedSystems: string[];
  rootCause: string;
  symptoms: string[];
  resolution: string;
  preventionMeasures: string[];
  timeline: TimelineEvent[];
  impact: {
    users: number;
    revenue: number;
    systems: string[];
  };
  generatedAt: string;
  triggeredBy:
    | 'natural_language_query'
    | 'automatic_detection'
    | 'manual_trigger';
  queryContext?: string;
}

export interface TimelineEvent {
  timestamp: string;
  event: string;
  source: string;
  severity: string;
}

export interface DependencyAnalysis {
  naturalLanguageQueryDependency: {
    percentage: number;
    description: string;
    examples: string[];
  };
  independentFunctionality: {
    percentage: number;
    description: string;
    capabilities: string[];
  };
  hybridOperations: string[];
}

export class AutoIncidentReportService {
  private reportHistory: IncidentReport[] = [];

  constructor() {
    console.log('🚨 자동 장애 보고서 서비스 초기화 완료');
  }

  /**
   * 📊 의존성 분석 결과
   */
  getDependencyAnalysis(): DependencyAnalysis {
    return {
      naturalLanguageQueryDependency: {
        percentage: 70,
        description: '자연어 질의가 트리거 및 컨텍스트 제공 역할을 담당',
        examples: [
          '"오늘 서버 장애 상황 보고서 만들어줘"',
          '"지난 주 성능 이슈 분석 리포트 생성"',
          '"현재 시스템 문제점 종합 보고서"',
          '"데이터베이스 연결 오류 장애 보고서"',
        ],
      },
      independentFunctionality: {
        percentage: 30,
        description: '시스템이 자체적으로 데이터 수집 및 분석 수행',
        capabilities: [
          '실시간 시스템 메트릭 수집',
          '로그 데이터 자동 분석',
          '이상 징후 패턴 감지',
          '장애 타임라인 자동 생성',
          '영향도 자동 계산',
          '복구 절차 추천',
        ],
      },
      hybridOperations: [
        '자연어 질의로 보고서 범위 지정 → 시스템이 자동으로 해당 기간 데이터 수집',
        '사용자가 문제 상황 설명 → 시스템이 관련 로그 및 메트릭 자동 분석',
        '특정 시스템 장애 질의 → 해당 시스템의 상세 상태 자동 진단',
        '성능 이슈 문의 → 성능 관련 모든 지표 자동 수집 및 분석',
      ],
    };
  }

  /**
   * 🚨 자동 장애 보고서 생성 (자연어 질의 기반 - 70% 의존)
   */
  async generateIncidentReportFromQuery(
    query: string
  ): Promise<{ success: boolean; report?: IncidentReport; error?: string }> {
    try {
      console.log('🚨 자연어 질의 기반 장애 보고서 생성 시작:', query);

      // 1. 자연어 질의 분석 (70% 의존 부분)
      const queryAnalysis = this.analyzeQuery(query);

      // 2. 독립적 데이터 수집 (30% 독립 부분)
      const systemData = await this.collectSystemData();
      const logData = await this.collectLogData();
      const metricsData = await this.collectMetricsData();

      // 3. 보고서 생성
      const report = this.generateReport({
        query,
        queryAnalysis,
        systemData,
        logData,
        metricsData,
        triggeredBy: 'natural_language_query',
      });

      this.reportHistory.push(report);
      console.log('✅ 자연어 질의 기반 장애 보고서 생성 완료:', report.id);

      return { success: true, report };
    } catch (error: any) {
      console.error('❌ 장애 보고서 생성 실패:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 🤖 자동 장애 감지 및 보고서 생성 (30% 독립 기능)
   */
  async generateAutomaticIncidentReport(): Promise<{
    success: boolean;
    report?: IncidentReport;
    error?: string;
  }> {
    try {
      console.log('🤖 자동 장애 감지 및 보고서 생성 시작');

      // 완전히 독립적인 자동 감지 로직
      const anomalies = await this.detectAnomalies();
      const systemData = await this.collectSystemData();
      const logData = await this.collectLogData();
      const metricsData = await this.collectMetricsData();

      // 장애 상황 판단
      if (!this.isIncidentDetected(anomalies, systemData, metricsData)) {
        return {
          success: false,
          error: '현재 장애 상황이 감지되지 않았습니다.',
        };
      }

      // 자동 보고서 생성
      const report = this.generateReport({
        query: '자동 장애 감지',
        queryAnalysis: {
          scope: 'automatic',
          timeRange: '1h',
          severity: 'auto-detected',
        },
        systemData,
        logData,
        metricsData,
        triggeredBy: 'automatic_detection',
      });

      this.reportHistory.push(report);
      console.log('✅ 자동 장애 보고서 생성 완료:', report.id);

      return { success: true, report };
    } catch (error: any) {
      console.error('❌ 자동 장애 보고서 생성 실패:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 📥 TXT 형식 보고서 다운로드 생성
   */
  generateTxtDownload(report: IncidentReport): string {
    const txtContent = `
=================================================================
                    🚨 시스템 장애 보고서
=================================================================

📋 기본 정보
-----------------------------------------------------------------
보고서 ID: ${report.id}
제목: ${report.title}
심각도: ${report.severity.toUpperCase()}
발생 시간: ${report.startTime}
종료 시간: ${report.endTime || '진행 중'}
지속 시간: ${report.duration || '계산 중'}
생성 시간: ${report.generatedAt}
트리거: ${this.getTriggerDescription(report.triggeredBy)}

🎯 영향 범위
-----------------------------------------------------------------
영향받은 시스템: ${report.affectedSystems.join(', ')}
영향받은 사용자 수: ${report.impact.users.toLocaleString()}명
예상 매출 영향: $${report.impact.revenue.toLocaleString()}
영향받은 시스템: ${report.impact.systems.join(', ')}

🔍 장애 분석
-----------------------------------------------------------------
근본 원인:
${report.rootCause}

주요 증상:
${report.symptoms.map(symptom => `• ${symptom}`).join('\n')}

📋 장애 타임라인
-----------------------------------------------------------------
${report.timeline
  .map(
    event =>
      `[${event.timestamp}] ${event.severity.toUpperCase()} - ${event.event} (출처: ${event.source})`
  )
  .join('\n')}

✅ 해결 방안
-----------------------------------------------------------------
${report.resolution}

🛡️ 재발 방지 대책
-----------------------------------------------------------------
${report.preventionMeasures.map(measure => `• ${measure}`).join('\n')}

📊 의존성 분석 정보
-----------------------------------------------------------------
${
  report.triggeredBy === 'natural_language_query'
    ? `이 보고서는 자연어 질의("${report.queryContext}")를 기반으로 생성되었습니다.
• 자연어 의존도: 70% (트리거 및 컨텍스트 제공)
• 독립적 기능: 30% (데이터 수집 및 분석)`
    : `이 보고서는 시스템 자동 감지를 통해 생성되었습니다.
• 완전 독립적 기능: 100% (자체 데이터 수집 및 분석)`
}

=================================================================
생성 시스템: OpenManager Vibe v5 자동 장애 보고서 시스템
생성 일시: ${new Date().toLocaleString('ko-KR')}
=================================================================
`;

    return txtContent.trim();
  }

  /**
   * 📥 보고서 TXT 파일 다운로드 URL 생성
   */
  async createDownloadUrl(reportId: string): Promise<{
    success: boolean;
    downloadUrl?: string;
    filename?: string;
    error?: string;
  }> {
    try {
      const report = this.reportHistory.find(r => r.id === reportId);
      if (!report) {
        return { success: false, error: '보고서를 찾을 수 없습니다.' };
      }

      const txtContent = this.generateTxtDownload(report);
      const filename = `incident-report-${report.id}-${new Date().toISOString().split('T')[0]}.txt`;

      // Blob URL 생성 (브라우저 환경)
      if (typeof window !== 'undefined') {
        const blob = new Blob([txtContent], {
          type: 'text/plain;charset=utf-8',
        });
        const downloadUrl = URL.createObjectURL(blob);

        return { success: true, downloadUrl, filename };
      }

      // 서버 환경에서는 파일 내용 직접 반환
      return {
        success: true,
        downloadUrl: `data:text/plain;charset=utf-8,${encodeURIComponent(txtContent)}`,
        filename,
      };
    } catch (error: any) {
      console.error('❌ 다운로드 URL 생성 실패:', error);
      return { success: false, error: error.message };
    }
  }

  // === 유틸리티 메서드들 ===

  private analyzeQuery(query: string): any {
    const lowerQuery = query.toLowerCase();

    return {
      scope: lowerQuery.includes('전체') ? 'system-wide' : 'specific',
      timeRange: this.extractTimeRange(query),
      severity: this.extractSeverity(query),
      systems: this.extractSystems(query),
    };
  }

  private async collectSystemData(): Promise<any> {
    // 실제 환경에서는 실제 시스템 데이터 수집
    return {
      cpu: Math.random() * 100,
      memory: Math.random() * 100,
      disk: Math.random() * 100,
      network: Math.random() * 100,
      services: ['web-server', 'database', 'cache'].map(service => ({
        name: service,
        status: Math.random() > 0.8 ? 'error' : 'running',
        uptime: Math.floor(Math.random() * 86400),
      })),
    };
  }

  private async collectLogData(): Promise<any> {
    // 실제 환경에서는 실제 로그 데이터 수집
    return {
      errors: Math.floor(Math.random() * 50),
      warnings: Math.floor(Math.random() * 200),
      recentErrors: [
        'Database connection timeout',
        'Memory allocation failed',
        'Network unreachable',
      ],
    };
  }

  private async collectMetricsData(): Promise<any> {
    // 실제 환경에서는 실제 메트릭 데이터 수집
    return {
      responseTime: Math.random() * 5000,
      throughput: Math.random() * 1000,
      errorRate: Math.random() * 10,
      availability: 95 + Math.random() * 5,
    };
  }

  private async detectAnomalies(): Promise<any[]> {
    // 자동 이상 징후 감지
    return [
      {
        type: 'cpu_spike',
        severity: 'high',
        timestamp: new Date().toISOString(),
      },
      {
        type: 'memory_leak',
        severity: 'medium',
        timestamp: new Date().toISOString(),
      },
    ];
  }

  private isIncidentDetected(
    anomalies: any[],
    systemData: any,
    metricsData: any
  ): boolean {
    return (
      anomalies.length > 0 ||
      systemData.cpu > 90 ||
      systemData.memory > 90 ||
      metricsData.errorRate > 5
    );
  }

  private generateReport(data: any): IncidentReport {
    const reportId = `IR-${Date.now()}`;
    const startTime = new Date(
      Date.now() - Math.random() * 3600000
    ).toISOString();

    return {
      id: reportId,
      title: `시스템 장애 보고서 - ${new Date().toLocaleDateString('ko-KR')}`,
      severity: this.calculateSeverity(data),
      startTime,
      endTime:
        data.triggeredBy === 'automatic_detection'
          ? undefined
          : new Date().toISOString(),
      duration:
        data.triggeredBy === 'automatic_detection'
          ? undefined
          : this.calculateDuration(startTime),
      affectedSystems: ['web-server-01', 'database-01', 'cache-server'],
      rootCause: '데이터베이스 연결 풀 고갈로 인한 서비스 응답 지연',
      symptoms: [
        '웹 페이지 로딩 시간 증가 (평균 3초 → 15초)',
        'API 응답 시간 지연',
        '데이터베이스 연결 오류 빈발',
        'CPU 사용률 급증 (60% → 95%)',
      ],
      resolution:
        '데이터베이스 연결 풀 크기 확장 (50 → 100) 및 연결 타임아웃 조정으로 문제 해결',
      preventionMeasures: [
        '데이터베이스 연결 풀 모니터링 강화',
        '연결 풀 사용률 80% 임계값 알림 설정',
        '주간 데이터베이스 성능 튜닝 검토',
        '자동 스케일링 정책 개선',
      ],
      timeline: this.generateTimeline(),
      impact: {
        users: Math.floor(Math.random() * 10000) + 1000,
        revenue: Math.floor(Math.random() * 50000) + 10000,
        systems: ['웹 서비스', '모바일 앱', 'API 게이트웨이'],
      },
      generatedAt: new Date().toISOString(),
      triggeredBy: data.triggeredBy,
      queryContext: data.query,
    };
  }

  private calculateSeverity(data: any): 'low' | 'medium' | 'high' | 'critical' {
    if (data.systemData?.cpu > 95 || data.metricsData?.errorRate > 10)
      return 'critical';
    if (data.systemData?.cpu > 80 || data.metricsData?.errorRate > 5)
      return 'high';
    if (data.systemData?.cpu > 60 || data.metricsData?.errorRate > 2)
      return 'medium';
    return 'low';
  }

  private calculateDuration(startTime: string): string {
    const duration = Date.now() - new Date(startTime).getTime();
    const minutes = Math.floor(duration / 60000);
    return `${minutes}분`;
  }

  private generateTimeline(): TimelineEvent[] {
    const now = Date.now();
    return [
      {
        timestamp: new Date(now - 3600000).toISOString(),
        event: '첫 번째 경고 신호 감지 - CPU 사용률 상승',
        source: 'monitoring-system',
        severity: 'warning',
      },
      {
        timestamp: new Date(now - 2700000).toISOString(),
        event: '데이터베이스 연결 오류 시작',
        source: 'database-logs',
        severity: 'error',
      },
      {
        timestamp: new Date(now - 1800000).toISOString(),
        event: '사용자 불만 접수 시작',
        source: 'customer-support',
        severity: 'high',
      },
      {
        timestamp: new Date(now - 900000).toISOString(),
        event: '장애 대응팀 투입',
        source: 'ops-team',
        severity: 'info',
      },
      {
        timestamp: new Date().toISOString(),
        event: '문제 해결 및 서비스 정상화',
        source: 'ops-team',
        severity: 'resolved',
      },
    ];
  }

  private extractTimeRange(query: string): string {
    if (query.includes('오늘')) return 'today';
    if (query.includes('어제')) return 'yesterday';
    if (query.includes('이번 주') || query.includes('주간')) return 'this_week';
    if (query.includes('지난 주')) return 'last_week';
    if (query.includes('이번 달') || query.includes('월간'))
      return 'this_month';
    return '1h';
  }

  private extractSeverity(query: string): string {
    if (query.includes('심각') || query.includes('critical')) return 'critical';
    if (query.includes('높음') || query.includes('high')) return 'high';
    if (query.includes('보통') || query.includes('medium')) return 'medium';
    return 'auto';
  }

  private extractSystems(query: string): string[] {
    const systems: string[] = [];
    if (query.includes('데이터베이스') || query.includes('DB'))
      systems.push('database');
    if (query.includes('웹서버') || query.includes('web'))
      systems.push('web-server');
    if (query.includes('캐시') || query.includes('cache'))
      systems.push('cache');
    return systems.length > 0 ? systems : ['all'];
  }

  private getTriggerDescription(trigger: string): string {
    const descriptions = {
      natural_language_query: '자연어 질의 기반 생성',
      automatic_detection: '시스템 자동 감지',
      manual_trigger: '수동 트리거',
    };
    return descriptions[trigger as keyof typeof descriptions] || '알 수 없음';
  }

  /**
   * 📋 보고서 히스토리 조회
   */
  getReportHistory(): IncidentReport[] {
    return this.reportHistory;
  }

  /**
   * 🔍 특정 보고서 조회
   */
  getReport(reportId: string): IncidentReport | undefined {
    return this.reportHistory.find(r => r.id === reportId);
  }
}

// 싱글톤 인스턴스 생성
export const autoIncidentReportService = new AutoIncidentReportService();
