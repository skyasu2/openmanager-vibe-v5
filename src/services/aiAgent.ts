/**
 * Smart AI Agent Service
 * 
 * 🤖 상황 인식 AI 에이전트 - 시스템 상태에 따른 스마트 응답
 */

import { usePowerStore, AutoReport, SystemAlert } from '../stores/powerStore';
import { useDemoStore } from '../stores/demoStore';
import { THRESHOLDS } from '../config/thresholds';

export type SystemCondition = 'normal' | 'warning' | 'critical' | 'emergency';
export type QueryType = 'status' | 'performance' | 'troubleshooting' | 'optimization' | 'general';

interface SmartResponse {
  response: string;
  suggestedActions: string[];
  relatedReports: AutoReport[];
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  followUpQuestions: string[];
}

interface QueryPreset {
  condition: SystemCondition;
  type: QueryType;
  templates: string[];
  actions: string[];
  followUps: string[];
}

export class SmartAIAgent {
  private queryPresets: QueryPreset[] = [
    // 정상 상태 프리셋
    {
      condition: 'normal',
      type: 'status',
      templates: [
        '현재 모든 시스템이 정상 작동 중입니다. 🟢\n\n📊 **시스템 현황**\n- 전체 서버: {totalServers}대\n- 온라인: {onlineServers}대\n- 평균 CPU: {avgCpu}%\n- 평균 메모리: {avgMemory}%\n\n✨ 모든 지표가 안정적입니다.',
        '시스템 상태가 매우 양호합니다! 🎉\n\n🔍 **상세 분석**\n- 성능 지표: 모두 정상 범위\n- 네트워크 지연: 최적화됨\n- 리소스 사용률: 효율적\n\n💡 현재는 시스템 최적화나 새로운 기능 테스트에 좋은 시점입니다.'
      ],
      actions: [
        '성능 최적화 제안 보기',
        '시스템 리포트 생성',
        '예방적 유지보수 계획',
        '용량 계획 검토'
      ],
      followUps: [
        '특정 서버의 상세 성능을 확인하고 싶으신가요?',
        '시스템 최적화 방안을 제안해드릴까요?',
        '정기 점검 일정을 설정하시겠습니까?'
      ]
    },
    
    // 경고 상태 프리셋
    {
      condition: 'warning',
      type: 'status',
      templates: [
        '⚠️ 일부 시스템에서 주의가 필요한 상황이 감지되었습니다.\n\n🔍 **경고 사항**\n- 경고 서버: {warningServers}대\n- 주요 이슈: {mainIssues}\n- 영향도: 중간\n\n🛠️ 즉시 조치가 필요하지는 않지만 모니터링을 강화하겠습니다.',
        '시스템에 몇 가지 주의사항이 있습니다. ⚡\n\n📋 **현재 상황**\n- 리소스 사용률 증가 감지\n- 일부 서버 성능 저하\n- 예방적 조치 권장\n\n🎯 문제가 악화되기 전에 대응하는 것이 좋겠습니다.'
      ],
      actions: [
        '경고 서버 상세 분석',
        '리소스 사용률 최적화',
        '성능 튜닝 실행',
        '알림 설정 조정'
      ],
      followUps: [
        '어떤 서버의 문제를 우선 해결하시겠습니까?',
        '자동 최적화를 실행하시겠습니까?',
        '상세한 성능 분석 리포트를 생성할까요?'
      ]
    },
    
    // 심각 상태 프리셋
    {
      condition: 'critical',
      type: 'status',
      templates: [
        '🚨 **긴급 상황 감지!**\n\n⛔ **심각한 문제**\n- 위험 서버: {criticalServers}대\n- 긴급 조치 필요\n- 서비스 영향 가능성: 높음\n\n🔧 즉시 대응 조치를 시작하겠습니다.',
        '🔴 **시스템 위험 상태**\n\n💥 **즉시 조치 필요**\n- 서버 다운 위험\n- 성능 심각 저하\n- 사용자 영향 발생 중\n\n⚡ 자동 복구 프로세스를 실행하고 있습니다.'
      ],
      actions: [
        '긴급 복구 실행',
        '백업 서버 활성화',
        '장애 격리 조치',
        '관리자 알림 발송'
      ],
      followUps: [
        '자동 복구를 시도하시겠습니까?',
        '백업 시스템으로 전환하시겠습니까?',
        '긴급 대응팀에 연락하시겠습니까?'
      ]
    }
  ];

  /**
   * 현재 시스템 상태 분석
   */
  analyzeSystemCondition(): SystemCondition {
    const { servers } = useDemoStore.getState();
    const { getCriticalAlerts, getActiveAlerts } = usePowerStore.getState();
    
    const criticalAlerts = getCriticalAlerts();
    const activeAlerts = getActiveAlerts();
    
    // 심각한 알림이 있는 경우
    if (criticalAlerts.length > 0) {
      return 'critical';
    }
    
    // 서버 상태 분석
    const criticalServers = servers.filter(s => s.status === 'critical').length;
    const warningServers = servers.filter(s => s.status === 'warning').length;
    
    if (criticalServers > 0 || activeAlerts.length > 5) {
      return 'critical';
    }
    
    if (warningServers > 2 || activeAlerts.length > 2) {
      return 'warning';
    }
    
    return 'normal';
  }

  /**
   * 쿼리 타입 분류
   */
  classifyQuery(query: string): QueryType {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('상태') || lowerQuery.includes('현황') || lowerQuery.includes('status')) {
      return 'status';
    }
    if (lowerQuery.includes('성능') || lowerQuery.includes('느림') || lowerQuery.includes('performance')) {
      return 'performance';
    }
    if (lowerQuery.includes('문제') || lowerQuery.includes('오류') || lowerQuery.includes('장애')) {
      return 'troubleshooting';
    }
    if (lowerQuery.includes('최적화') || lowerQuery.includes('개선') || lowerQuery.includes('튜닝')) {
      return 'optimization';
    }
    
    return 'general';
  }

  /**
   * 스마트 응답 생성
   */
  generateSmartResponse(query: string): SmartResponse {
    const condition = this.analyzeSystemCondition();
    const queryType = this.classifyQuery(query);
    const { servers } = useDemoStore.getState();
    const { autoReports, getActiveAlerts } = usePowerStore.getState();
    
    // 적절한 프리셋 찾기
    const preset = this.queryPresets.find(p => 
      p.condition === condition && p.type === queryType
    ) || this.queryPresets.find(p => p.condition === condition);
    
    if (!preset) {
      return this.generateFallbackResponse(query, condition);
    }
    
    // 템플릿 선택 및 변수 치환
    const template = preset.templates[Math.floor(Math.random() * preset.templates.length)];
    const response = this.substituteVariables(template, servers);
    
    // 관련 리포트 찾기
    const relatedReports = autoReports
      .filter(report => this.isReportRelevant(report, queryType, condition))
      .slice(0, 3);
    
    // 긴급도 결정
    const urgencyLevel = this.determineUrgency(condition, queryType);
    
    return {
      response,
      suggestedActions: preset.actions,
      relatedReports,
      urgencyLevel,
      followUpQuestions: preset.followUps
    };
  }

  /**
   * 자동 리포트 생성
   */
  generateAutoReport(): void {
    const condition = this.analyzeSystemCondition();
    const { servers } = useDemoStore.getState();
    const { addAutoReport, getActiveAlerts } = usePowerStore.getState();
    
    const activeAlerts = getActiveAlerts();
    const healthyServers = servers.filter(s => s.status === 'healthy').length;
    const warningServers = servers.filter(s => s.status === 'warning').length;
    const criticalServers = servers.filter(s => s.status === 'critical').length;
    
    let reportType: 'daily' | 'warning' | 'critical' | 'performance';
    let severity: 'info' | 'warning' | 'critical';
    let title: string;
    let summary: string;
    
    switch (condition) {
      case 'critical':
        reportType = 'critical';
        severity = 'critical';
        title = '🚨 시스템 위험 상태 감지';
        summary = `${criticalServers}개 서버에서 심각한 문제가 감지되어 즉시 조치가 필요합니다.`;
        break;
        
      case 'warning':
        reportType = 'warning';
        severity = 'warning';
        title = '⚠️ 시스템 주의 상태';
        summary = `${warningServers}개 서버에서 주의가 필요한 상황이 감지되었습니다.`;
        break;
        
      default:
        reportType = 'daily';
        severity = 'info';
        title = '📊 시스템 상태 정상';
        summary = `모든 시스템이 정상 작동 중이며, ${healthyServers}개 서버가 안정적으로 운영되고 있습니다.`;
    }
    
    const details = this.generateDetailedAnalysis(servers, activeAlerts, condition);
    const recommendations = this.generateRecommendations(condition, servers);
    
    addAutoReport({
      type: reportType,
      title,
      summary,
      details,
      severity,
      recommendations
    });
  }

  /**
   * 프리셋 질문 생성
   */
  generatePresetQuestions(): string[] {
    const condition = this.analyzeSystemCondition();
    
    const baseQuestions = [
      '현재 시스템 상태는 어떤가요?',
      '성능에 문제가 있는 서버가 있나요?',
      '최근 발생한 알림들을 확인해주세요'
    ];
    
    switch (condition) {
      case 'critical':
        return [
          '🚨 긴급 상황을 어떻게 해결해야 하나요?',
          '어떤 서버에 문제가 있나요?',
          '자동 복구를 실행해주세요',
          '백업 시스템으로 전환이 필요한가요?'
        ];
        
      case 'warning':
        return [
          '⚠️ 경고 상태인 서버들을 확인해주세요',
          '성능 최적화가 필요한 부분은?',
          '예방적 조치를 추천해주세요',
          '리소스 사용률을 분석해주세요'
        ];
        
      default:
        return [
          '📊 전체 시스템 현황을 알려주세요',
          '성능 최적화 방안을 제안해주세요',
          '정기 점검 일정을 확인해주세요',
          '용량 계획을 검토해주세요'
        ];
    }
  }

  // Private Methods
  
  private substituteVariables(template: string, servers: any[]): string {
    const totalServers = servers.length;
    const onlineServers = servers.filter(s => s.status === 'healthy').length;
    const warningServers = servers.filter(s => s.status === 'warning').length;
    const criticalServers = servers.filter(s => s.status === 'critical').length;
    
    const avgCpu = Math.round(
      servers.reduce((sum, s) => sum + s.metrics.cpu, 0) / servers.length
    );
    const avgMemory = Math.round(
      servers.reduce((sum, s) => sum + s.metrics.memory, 0) / servers.length
    );
    
    const mainIssues = this.identifyMainIssues(servers);
    
    return template
      .replace('{totalServers}', totalServers.toString())
      .replace('{onlineServers}', onlineServers.toString())
      .replace('{warningServers}', warningServers.toString())
      .replace('{criticalServers}', criticalServers.toString())
      .replace('{avgCpu}', avgCpu.toString())
      .replace('{avgMemory}', avgMemory.toString())
      .replace('{mainIssues}', mainIssues);
  }
  
  private identifyMainIssues(servers: any[]): string {
    const issues: string[] = [];
    
    const highCpuServers = servers.filter(s => s.metrics.cpu > THRESHOLDS.SERVER.CPU.WARNING).length;
    const highMemoryServers = servers.filter(s => s.metrics.memory > THRESHOLDS.SERVER.MEMORY.WARNING).length;
    const highDiskServers = servers.filter(s => s.metrics.disk > THRESHOLDS.SERVER.DISK.WARNING).length;
    
    if (highCpuServers > 0) issues.push(`CPU 사용률 높음 (${highCpuServers}대)`);
    if (highMemoryServers > 0) issues.push(`메모리 사용률 높음 (${highMemoryServers}대)`);
    if (highDiskServers > 0) issues.push(`디스크 사용률 높음 (${highDiskServers}대)`);
    
    return issues.length > 0 ? issues.join(', ') : '특별한 이슈 없음';
  }
  
  private isReportRelevant(report: AutoReport, queryType: QueryType, condition: SystemCondition): boolean {
    // 심각한 상황에서는 모든 리포트가 관련성 있음
    if (condition === 'critical') return true;
    
    // 쿼리 타입과 리포트 타입 매칭
    if (queryType === 'status' && report.type === 'daily') return true;
    if (queryType === 'performance' && report.type === 'performance') return true;
    if (queryType === 'troubleshooting' && ['warning', 'critical'].includes(report.type)) return true;
    
    return false;
  }
  
  private determineUrgency(condition: SystemCondition, queryType: QueryType): 'low' | 'medium' | 'high' | 'critical' {
    if (condition === 'critical') return 'critical';
    if (condition === 'warning' && queryType === 'troubleshooting') return 'high';
    if (condition === 'warning') return 'medium';
    return 'low';
  }
  
  private generateFallbackResponse(query: string, condition: SystemCondition): SmartResponse {
    return {
      response: `현재 시스템 상태는 ${condition}입니다. 구체적인 질문을 해주시면 더 정확한 답변을 드릴 수 있습니다.`,
      suggestedActions: ['시스템 상태 확인', '성능 분석', '로그 검토'],
      relatedReports: [],
      urgencyLevel: condition === 'critical' ? 'critical' : 'low',
      followUpQuestions: ['어떤 부분이 궁금하신가요?', '특정 서버를 확인하시겠습니까?']
    };
  }
  
  private generateDetailedAnalysis(servers: any[], alerts: SystemAlert[], condition: SystemCondition): string {
    const totalServers = servers.length;
    const healthyServers = servers.filter(s => s.status === 'healthy').length;
    const warningServers = servers.filter(s => s.status === 'warning').length;
    const criticalServers = servers.filter(s => s.status === 'critical').length;
    
    return `
📊 **시스템 분석 리포트**

🖥️ **서버 현황**
- 전체 서버: ${totalServers}대
- 정상: ${healthyServers}대 (${Math.round(healthyServers/totalServers*100)}%)
- 경고: ${warningServers}대 (${Math.round(warningServers/totalServers*100)}%)
- 위험: ${criticalServers}대 (${Math.round(criticalServers/totalServers*100)}%)

🔔 **알림 현황**
- 활성 알림: ${alerts.length}개
- 심각 알림: ${alerts.filter(a => a.severity === 'critical').length}개
- 경고 알림: ${alerts.filter(a => a.severity === 'warning').length}개

📈 **성능 지표**
- 평균 CPU: ${Math.round(servers.reduce((sum, s) => sum + s.metrics.cpu, 0) / servers.length)}%
- 평균 메모리: ${Math.round(servers.reduce((sum, s) => sum + s.metrics.memory, 0) / servers.length)}%
- 평균 디스크: ${Math.round(servers.reduce((sum, s) => sum + s.metrics.disk, 0) / servers.length)}%

🎯 **상태 평가**
현재 시스템은 ${condition === 'normal' ? '안정적' : condition === 'warning' ? '주의 필요' : '위험'} 상태입니다.
    `;
  }
  
  private generateRecommendations(condition: SystemCondition, servers: any[]): string[] {
    switch (condition) {
      case 'critical':
        return [
          '즉시 위험 서버 점검 및 복구',
          '백업 시스템 활성화 검토',
          '긴급 대응팀 연락',
          '서비스 영향도 평가'
        ];
        
      case 'warning':
        return [
          '경고 서버 상세 분석',
          '리소스 사용률 최적화',
          '예방적 유지보수 실행',
          '모니터링 강화'
        ];
        
      default:
        return [
          '정기 시스템 점검',
          '성능 최적화 검토',
          '용량 계획 업데이트',
          '보안 패치 적용'
        ];
    }
  }
}

// 싱글톤 인스턴스
export const smartAIAgent = new SmartAIAgent(); 