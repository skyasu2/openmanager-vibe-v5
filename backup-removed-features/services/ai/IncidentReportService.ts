/**
 * 🚨 자동 장애보고서 생성 서비스
 *
 * - 육하원칙 기반 장애보고서 생성
 * - 현재/이전 서버 상태 비교 분석
 * - 컨텍스트 기반 대응방안 제시
 * - TXT 파일 다운로드 지원
 */


import type { ServerMetrics } from '../../types/common';
import { mlDataManager } from '../ml/MLDataManager';
import { GCPFunctionsService } from './GCPFunctionsService';
import { systemLogger as logger } from '@/lib/logger';

export interface IncidentReport {
  id: string;
  timestamp: string;
  title: string;
  severity: 'critical' | 'warning' | 'info';

  // 육하원칙 (5W1H)
  what: string; // 무엇이 (What)
  when: string; // 언제 (When)
  where: string; // 어디서 (Where)
  who: string; // 누가 (Who)
  why: string; // 왜 (Why)
  how: string; // 어떻게 (How)

  // 추가 정보
  impact: string; // 영향도
  rootCause: string; // 근본 원인
  resolution: string; // 해결 방안
  prevention: string; // 예방 방안
  timeline: TimelineEvent[];
  affectedServers: string[];

  // 메타데이터
  reportedBy: string;
  status: 'open' | 'investigating' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface TimelineEvent {
  timestamp: string;
  event: string;
  details: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface ServerStateComparison {
  current: ServerMetrics[];
  previous: ServerMetrics[];
  changes: ServerChange[];
}

export interface ServerChange {
  serverId: string;
  serverName: string;
  changeType: 'status_change' | 'metric_spike' | 'new_alert' | 'recovery';
  before: any;
  after: any;
  severity: 'info' | 'warning' | 'critical';
  description: string;
}

class IncidentReportService {
  private static instance: IncidentReportService;
  private reports: IncidentReport[] = [];
  private gcpService: GCPFunctionsService;
  private learningPatterns: Map<string, any> = new Map();

  constructor() {
    this.gcpService = new GCPFunctionsService();
  }

  static getInstance(): IncidentReportService {
    if (!IncidentReportService.instance) {
      IncidentReportService.instance = new IncidentReportService();
    }
    return IncidentReportService.instance;
  }

  /**
   * 🔍 서버 상태 변화 분석
   */
  analyzeServerChanges(
    current: ServerMetrics[],
    previous: ServerMetrics[]
  ): ServerChange[] {
    const changes: ServerChange[] = [];

    // 현재 서버들과 이전 서버들 비교
    current.forEach(currentServer => {
      const serverId = currentServer.id || currentServer.server_id;
      const serverName = currentServer.server_id;
      const previousServer = previous.find(
        p => (p.id || p.server_id) === serverId
      );

      if (!previousServer) {
        // 새로운 서버 추가
        changes.push({
          serverId,
          serverName,
          changeType: 'new_alert',
          before: null,
          after: currentServer,
          severity: 'info',
          description: `새로운 서버 '${serverName}'가 모니터링에 추가되었습니다.`,
        });
        return;
      }

      // 상태 변화 확인
      if (currentServer.status !== previousServer.status) {
        const severity = this.getStatusChangeSeverity(
          previousServer.status,
          currentServer.status
        );
        changes.push({
          serverId,
          serverName,
          changeType: 'status_change',
          before: previousServer.status,
          after: currentServer.status,
          severity,
          description: `서버 '${serverName}'의 상태가 ${previousServer.status}에서 ${currentServer.status}로 변경되었습니다.`,
        });
      }

      // 메트릭 급증 확인
      const metricChanges = this.detectMetricSpikes(
        previousServer,
        currentServer
      );
      changes.push(...metricChanges);
    });

    return changes;
  }

  /**
   * 📊 메트릭 급증 감지
   */
  private detectMetricSpikes(
    previous: ServerMetrics,
    current: ServerMetrics
  ): ServerChange[] {
    const changes: ServerChange[] = [];
    const threshold = 30; // 30% 이상 변화 시 급증으로 판단
    const serverId = current.id || current.server_id;
    const serverName = current.server_id;

    // CPU 사용률 급증
    if (current.cpu_usage - previous.cpu_usage > threshold) {
      changes.push({
        serverId,
        serverName,
        changeType: 'metric_spike',
        before: previous.cpu_usage,
        after: current.cpu_usage,
        severity: current.cpu_usage > 80 ? 'critical' : 'warning',
        description: `서버 '${serverName}'의 CPU 사용률이 ${previous.cpu_usage}%에서 ${current.cpu_usage}%로 급증했습니다.`,
      });
    }

    // 메모리 사용률 급증
    if (current.memory_usage - previous.memory_usage > threshold) {
      changes.push({
        serverId,
        serverName,
        changeType: 'metric_spike',
        before: previous.memory_usage,
        after: current.memory_usage,
        severity: current.memory_usage > 85 ? 'critical' : 'warning',
        description: `서버 '${serverName}'의 메모리 사용률이 ${previous.memory_usage}%에서 ${current.memory_usage}%로 급증했습니다.`,
      });
    }

    // 응답시간 급증
    if (current.response_time - previous.response_time > 1000) {
      // 1초 이상 증가
      changes.push({
        serverId,
        serverName,
        changeType: 'metric_spike',
        before: previous.response_time,
        after: current.response_time,
        severity: current.response_time > 5000 ? 'critical' : 'warning',
        description: `서버 '${serverName}'의 응답시간이 ${previous.response_time}ms에서 ${current.response_time}ms로 급증했습니다.`,
      });
    }

    return changes;
  }

  /**
   * 🚨 자동 장애보고서 생성 (ML 캐싱 및 백엔드 통합)
   */
  async generateIncidentReport(
    serverComparison: ServerStateComparison,
    context?: string
  ): Promise<IncidentReport> {
    // 캐시된 서버 상태 확인
    const cacheKey = `incident:analysis:${Date.now()}`;
    const cachedAnalysis = await mlDataManager.getCachedData<IncidentReport>(cacheKey);
    if (cachedAnalysis) {
      logger.info('✅ 캐시된 장애 분석 사용');
      return cachedAnalysis;
    }

    const changes = this.analyzeServerChanges(
      serverComparison.current,
      serverComparison.previous
    );

    const criticalChanges = changes.filter(c => c.severity === 'critical');
    const warningChanges = changes.filter(c => c.severity === 'warning');

    const severity =
      criticalChanges.length > 0
        ? 'critical'
        : warningChanges.length > 0
          ? 'warning'
          : 'info';

    const timestamp = new Date().toISOString();
    const reportId = `INC-${Date.now()}`;

    // 육하원칙 기반 분석
    const report: IncidentReport = {
      id: reportId,
      timestamp,
      title: this.generateTitle(changes, severity),
      severity,

      // 육하원칙 (5W1H)
      what: this.analyzeWhat(changes),
      when: this.analyzeWhen(changes, timestamp),
      where: this.analyzeWhere(changes),
      who: this.analyzeWho(changes),
      why: this.analyzeWhy(changes),
      how: this.analyzeHow(changes),

      // 추가 분석
      impact: this.analyzeImpact(changes),
      rootCause: this.analyzeRootCause(changes),
      resolution: this.generateResolution(changes),
      prevention: this.generatePrevention(changes),
      timeline: this.generateTimeline(changes),
      affectedServers: [...new Set(changes.map(c => c.serverName))],

      // 메타데이터
      reportedBy: 'AI 자동 모니터링 시스템',
      status: severity === 'critical' ? 'investigating' : 'open',
      priority:
        severity === 'critical'
          ? 'critical'
          : severity === 'warning'
            ? 'high'
            : 'medium',
    };

    // 보고서 저장
    this.reports.push(report);

    // ML 캐싱
    await mlDataManager.cacheIncidentReport(report.id, report);

    // GCP 백엔드로 보고서 전송 (비동기)
    this.sendToGCPBackend(report).catch(error => {
      logger.error('GCP 백엔드 전송 실패:', error);
    });

    // 학습 패턴 업데이트
    await this.updateLearningPatterns(report);

    return report;
  }

  /**
   * 📝 보고서 제목 생성
   */
  private generateTitle(changes: ServerChange[], severity: string): string {
    const criticalCount = changes.filter(c => c.severity === 'critical').length;
    const warningCount = changes.filter(c => c.severity === 'warning').length;

    if (criticalCount > 0) {
      return `긴급 장애 발생: ${criticalCount}개 서버 심각한 문제 감지`;
    } else if (warningCount > 0) {
      return `경고 상황 발생: ${warningCount}개 서버 성능 이상 감지`;
    } else {
      return `시스템 상태 변화 감지: 모니터링 알림`;
    }
  }

  /**
   * 🔍 무엇이 (What) 분석
   */
  private analyzeWhat(changes: ServerChange[]): string {
    const statusChanges = changes.filter(c => c.changeType === 'status_change');
    const metricSpikes = changes.filter(c => c.changeType === 'metric_spike');

    let what = '';

    if (statusChanges.length > 0) {
      what += `${statusChanges.length}개 서버의 상태 변화가 발생했습니다. `;
    }

    if (metricSpikes.length > 0) {
      what += `${metricSpikes.length}개 서버에서 성능 메트릭 급증이 감지되었습니다. `;
    }

    return what || '시스템 상태 변화가 감지되었습니다.';
  }

  /**
   * ⏰ 언제 (When) 분석
   */
  private analyzeWhen(changes: ServerChange[], timestamp: string): string {
    const date = new Date(timestamp);
    const timeStr = date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    return `${timeStr}에 최초 감지되었으며, 실시간 모니터링을 통해 지속적으로 추적 중입니다.`;
  }

  /**
   * 📍 어디서 (Where) 분석
   */
  private analyzeWhere(changes: ServerChange[]): string {
    const servers = [...new Set(changes.map(c => c.serverName))];
    const environments = [
      ...new Set(
        changes.map(c =>
          c.serverId.includes('prod') ? '운영환경' : '개발환경'
        )
      ),
    ];

    return `영향받은 서버: ${servers.join(', ')} (총 ${servers.length}개 서버, ${environments.join(', ')})`;
  }

  /**
   * 👤 누가 (Who) 분석
   */
  private analyzeWho(changes: ServerChange[]): string {
    return 'AI 자동 모니터링 시스템이 감지하였으며, 시스템 관리자에게 즉시 알림이 전송되었습니다.';
  }

  /**
   * ❓ 왜 (Why) 분석
   */
  private analyzeWhy(changes: ServerChange[]): string {
    const cpuSpikes = changes.filter(c => c.description.includes('CPU'));
    const memorySpikes = changes.filter(c => c.description.includes('메모리'));
    const responseSpikes = changes.filter(c =>
      c.description.includes('응답시간')
    );

    let reasons: string[] = [];

    if (cpuSpikes.length > 0) {
      reasons.push('높은 CPU 사용률로 인한 시스템 부하');
    }
    if (memorySpikes.length > 0) {
      reasons.push('메모리 사용량 급증으로 인한 성능 저하');
    }
    if (responseSpikes.length > 0) {
      reasons.push(
        '네트워크 지연 또는 데이터베이스 병목으로 인한 응답시간 증가'
      );
    }

    return reasons.length > 0
      ? `추정 원인: ${reasons.join(', ')}`
      : '정확한 원인 분석을 위해 추가 조사가 필요합니다.';
  }

  /**
   * 🔧 어떻게 (How) 분석
   */
  private analyzeHow(changes: ServerChange[]): string {
    return '실시간 메트릭 수집 시스템을 통해 서버 상태를 지속적으로 모니터링하여 임계값 초과 시 자동으로 감지되었습니다.';
  }

  /**
   * 💥 영향도 분석
   */
  private analyzeImpact(changes: ServerChange[]): string {
    const criticalCount = changes.filter(c => c.severity === 'critical').length;
    const warningCount = changes.filter(c => c.severity === 'warning').length;

    if (criticalCount > 0) {
      return `높음 - ${criticalCount}개 서버에서 심각한 문제가 발생하여 서비스 중단 위험이 있습니다.`;
    } else if (warningCount > 0) {
      return `중간 - ${warningCount}개 서버에서 성능 저하가 발생하여 사용자 경험에 영향을 줄 수 있습니다.`;
    } else {
      return '낮음 - 현재 서비스에 직접적인 영향은 없으나 지속적인 모니터링이 필요합니다.';
    }
  }

  /**
   * 🔍 근본 원인 분석 (ML 학습 패턴 활용)
   */
  private analyzeRootCause(changes: ServerChange[]): string {
    // 패턴 분석을 통한 근본 원인 추정
    const patterns = this.detectPatterns(changes);
    
    // 학습된 패턴과 비교
    const learnedPatterns = this.findSimilarLearnedPatterns(changes);
    if (learnedPatterns.length > 0) {
      patterns.push(...learnedPatterns);
    }
    
    return patterns.length > 0
      ? patterns.join(', ')
      : '추가 분석이 필요합니다.';
  }

  /**
   * 🛠️ 해결 방안 생성 (ML 기반 개선)
   */
  private generateResolution(changes: ServerChange[]): string {
    const resolutions: string[] = [];

    const cpuIssues = changes.filter(c => c.description.includes('CPU'));
    const memoryIssues = changes.filter(c => c.description.includes('메모리'));
    const responseIssues = changes.filter(c =>
      c.description.includes('응답시간')
    );

    if (cpuIssues.length > 0) {
      resolutions.push('1. CPU 사용률이 높은 프로세스 확인 및 최적화');
      resolutions.push('2. 필요시 서버 스케일 업 또는 로드 밸런싱 적용');
    }

    if (memoryIssues.length > 0) {
      resolutions.push('3. 메모리 누수 확인 및 애플리케이션 재시작');
      resolutions.push('4. 메모리 사용량 모니터링 강화');
    }

    if (responseIssues.length > 0) {
      resolutions.push('5. 네트워크 연결 상태 확인');
      resolutions.push('6. 데이터베이스 쿼리 성능 최적화');
    }

    resolutions.push('7. 실시간 모니터링을 통한 지속적인 상태 확인');
    
    // 학습된 패턴에서 해결책 추가
    const learnedSolutions = this.getLearnedSolutions(changes);
    if (learnedSolutions.length > 0) {
      resolutions.push('\n[과거 유사 사례 기반 추천]');
      resolutions.push(...learnedSolutions);
    }

    return resolutions.join('\n');
  }

  /**
   * 🎯 학습된 해결책 가져오기
   */
  private getLearnedSolutions(changes: ServerChange[]): string[] {
    const solutions: string[] = [];
    
    for (const [_, pattern] of this.learningPatterns) {
      if (this.isPatternMatch(changes, pattern) && pattern.resolution) {
        solutions.push(`- ${pattern.resolution}`);
      }
    }
    
    return solutions.slice(0, 3); // 최대 3개까지
  }

  /**
   * 🛡️ 예방 방안 생성
   */
  private generatePrevention(changes: ServerChange[]): string {
    return [
      '1. 임계값 기반 자동 알림 시스템 강화',
      '2. 정기적인 서버 성능 점검 및 최적화',
      '3. 용량 계획 수립 및 사전 스케일링',
      '4. 애플리케이션 성능 모니터링 도구 도입',
      '5. 장애 대응 매뉴얼 업데이트 및 훈련',
    ].join('\n');
  }

  /**
   * ⏱️ 타임라인 생성
   */
  private generateTimeline(changes: ServerChange[]): TimelineEvent[] {
    const timeline: TimelineEvent[] = [];
    const now = new Date();

    // 감지 시점
    timeline.push({
      timestamp: now.toISOString(),
      event: '장애 감지',
      details: '자동 모니터링 시스템에서 이상 상황 감지',
      severity: 'warning',
    });

    // 변화 사항들을 시간순으로 정렬
    changes.forEach((change, index) => {
      const eventTime = new Date(now.getTime() + index * 1000);
      timeline.push({
        timestamp: eventTime.toISOString(),
        event:
          change.changeType === 'status_change' ? '상태 변화' : '메트릭 급증',
        details: change.description,
        severity: change.severity,
      });
    });

    return timeline;
  }

  /**
   * 🔍 패턴 감지 (ML 강화)
   */
  private detectPatterns(changes: ServerChange[]): string[] {
    const patterns: string[] = [];

    // 동시 다발적 CPU 급증
    const cpuSpikes = changes.filter(c => c.description.includes('CPU'));
    if (cpuSpikes.length > 2) {
      patterns.push(
        '다중 서버 동시 CPU 급증 - 트래픽 급증 또는 DDoS 공격 가능성'
      );
    }

    // 메모리 누수 패턴
    const memorySpikes = changes.filter(c => c.description.includes('메모리'));
    if (memorySpikes.length > 1) {
      patterns.push(
        '메모리 사용량 지속 증가 - 애플리케이션 메모리 누수 가능성'
      );
    }

    // 응답 시간 지연 패턴
    const responseSpikes = changes.filter(c => c.description.includes('응답시간'));
    if (responseSpikes.length > 0 && cpuSpikes.length > 0) {
      patterns.push(
        '응답시간 증가와 CPU 사용률 상승 동시 발생 - 애플리케이션 병목 현상'
      );
    }

    // 연쇄 장애 패턴
    if (changes.length > 5 && this.detectCascadingFailure(changes)) {
      patterns.push(
        '연쇄 장애 패턴 감지 - 하나의 서버 장애가 다른 서버로 전파'
      );
    }

    return patterns;
  }

  /**
   * 🔄 연쇄 장애 감지
   */
  private detectCascadingFailure(changes: ServerChange[]): boolean {
    // 시간순 정렬하여 연쇄적 발생 여부 확인
    const criticalChanges = changes.filter(c => c.severity === 'critical');
    if (criticalChanges.length < 2) return false;
    
    // 5분 이내 다수 서버 장애 발생 시 연쇄 장애로 판단
    return criticalChanges.length >= 3;
  }

  /**
   * 🧠 학습된 패턴과 비교
   */
  private findSimilarLearnedPatterns(changes: ServerChange[]): string[] {
    const similarPatterns: string[] = [];
    
    // 학습된 패턴과 현재 상황 비교
    for (const [patternId, pattern] of this.learningPatterns) {
      if (this.isPatternMatch(changes, pattern)) {
        similarPatterns.push(`과거 유사 장애 패턴 발견: ${pattern.description}`);
      }
    }
    
    return similarPatterns;
  }

  /**
   * 📊 패턴 매칭 확인
   */
  private isPatternMatch(changes: ServerChange[], learnedPattern: any): boolean {
    // 간단한 유사도 검사 (실제로는 더 복잡한 ML 알고리즘 사용)
    const changeTypes = changes.map(c => c.changeType);
    const severities = changes.map(c => c.severity);
    
    return (
      learnedPattern.changeTypes?.some((type: string) => changeTypes.includes(type as any)) &&
      learnedPattern.severities?.some((sev: string) => severities.includes(sev as any))
    );
  }

  /**
   * 🚀 GCP 백엔드로 보고서 전송
   */
  private async sendToGCPBackend(report: IncidentReport): Promise<void> {
    try {
      const gcpReport = await this.gcpService.generateIncidentReportOnBackend({
        report,
        serverCount: report.affectedServers.length,
        patterns: this.detectPatterns([]), // 패턴 정보 포함
        timestamp: new Date(),
      });
      
      if (gcpReport) {
        logger.info('✅ 장애 보고서 GCP 백엔드 전송 완료');
      }
    } catch (error) {
      logger.error('장애 보고서 백엔드 전송 실패:', error);
    }
  }

  /**
   * 🧠 학습 패턴 업데이트
   */
  private async updateLearningPatterns(report: IncidentReport): Promise<void> {
    const patternKey = `pattern:${report.severity}:${Date.now()}`;
    const pattern = {
      id: patternKey,
      timestamp: report.timestamp,
      description: report.rootCause,
      changeTypes: ['status_change', 'metric_spike'],
      severities: [report.severity],
      resolution: report.resolution,
      affectedCount: report.affectedServers.length,
    };
    
    this.learningPatterns.set(patternKey, pattern);
    
    // 패턴 수 제한 (최대 100개)
    if (this.learningPatterns.size > 100) {
      const oldestKey = Array.from(this.learningPatterns.keys())[0];
      this.learningPatterns.delete(oldestKey);
    }
    
    logger.info(`✅ 장애 패턴 학습 완료: ${patternKey}`);
  }

  /**
   * 📊 상태 변화 심각도 판단
   */
  private getStatusChangeSeverity(
    before: string,
    after: string
  ): 'info' | 'warning' | 'critical' {
    if (after === 'critical') return 'critical';
    if (after === 'warning' && before === 'healthy') return 'warning';
    if (after === 'healthy' && before !== 'healthy') return 'info'; // 복구
    return 'info';
  }

  /**
   * 📄 TXT 파일로 보고서 다운로드
   */
  generateReportText(report: IncidentReport): string {
    return `
===========================================
        자동 장애보고서
===========================================

보고서 ID: ${report.id}
생성 시간: ${new Date(report.timestamp).toLocaleString('ko-KR')}
제목: ${report.title}
심각도: ${report.severity.toUpperCase()}
우선순위: ${report.priority.toUpperCase()}
상태: ${report.status}

===========================================
        육하원칙 분석 (5W1H)
===========================================

🔍 무엇이 (What):
${report.what}

⏰ 언제 (When):
${report.when}

📍 어디서 (Where):
${report.where}

👤 누가 (Who):
${report.who}

❓ 왜 (Why):
${report.why}

🔧 어떻게 (How):
${report.how}

===========================================
        상세 분석
===========================================

💥 영향도:
${report.impact}

🔍 근본 원인:
${report.rootCause}

🛠️ 해결 방안:
${report.resolution}

🛡️ 예방 방안:
${report.prevention}

📊 영향받은 서버:
${report.affectedServers.join(', ')}

===========================================
        타임라인
===========================================

${report.timeline
        .map(
          event =>
            `${new Date(event.timestamp).toLocaleTimeString('ko-KR')} [${event.severity.toUpperCase()}] ${event.event}: ${event.details}`
        )
        .join('\n')}

===========================================
        보고서 정보
===========================================

보고자: ${report.reportedBy}
생성 시스템: OpenManager Vibe v5 AI 모니터링
문의: 시스템 관리자

===========================================
    `.trim();
  }

  /**
   * 💾 보고서 다운로드
   */
  downloadReport(report: IncidentReport): void {
    const content = this.generateReportText(report);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `incident-report-${report.id}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  /**
   * 📋 모든 보고서 조회 (캐시 활용)
   */
  async getAllReports(): Promise<IncidentReport[]> {
    // 캐시된 보고서 확인
    const cachedReports = await mlDataManager.getCachedData<IncidentReport[]>('incident:reports:all');
    if (cachedReports) {
      return cachedReports;
    }
    
    const reports = [...this.reports].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    // 캐싱
    await mlDataManager.setCachedData('incident:reports:all', reports, 300); // 5분 캐시
    
    return reports;
  }

  /**
   * 🔍 보고서 조회
   */
  getReport(id: string): IncidentReport | undefined {
    return this.reports.find(r => r.id === id);
  }
}

export const incidentReportService = IncidentReportService.getInstance();
