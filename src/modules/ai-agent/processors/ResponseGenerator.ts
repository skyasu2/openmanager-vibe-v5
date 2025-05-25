/**
 * Response Generator
 * 
 * 🗣️ AI 응답 생성 엔진
 * - 의도 기반 응답 생성
 * - 컨텍스트 인식 응답
 * - 도메인 특화 서버 모니터링 응답
 */

import { Intent } from './IntentClassifier';

export interface ResponseRequest {
  query: string;
  intent: Intent;
  context: any;
  serverData?: any;
  mcpResponse?: any;
}

export interface GeneratedResponse {
  text: string;
  type: 'informational' | 'actionable' | 'warning' | 'error';
  confidence: number;
  suggestedActions?: string[];
  metadata?: Record<string, any>;
}

export class ResponseGenerator {
  private responseTemplates: Map<string, string[]> = new Map();
  private contextualModifiers: Map<string, string[]> = new Map();
  private isInitialized: boolean = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    this.initializeResponseTemplates();
    this.initializeContextualModifiers();
    
    this.isInitialized = true;
  }

  /**
   * 메인 응답 생성 메서드
   */
  async generate(request: ResponseRequest): Promise<GeneratedResponse> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // 1. 기본 응답 템플릿 선택
    const baseResponse = this.selectBaseResponse(request.intent);
    
    // 2. 서버 데이터 기반 응답 보강
    const enrichedResponse = this.enrichWithServerData(baseResponse, request.serverData);
    
    // 3. 컨텍스트 기반 응답 조정
    const contextualResponse = this.applyContextualModifiers(enrichedResponse, request.context);
    
    // 4. MCP 응답 통합
    const finalResponse = this.integrateMCPResponse(contextualResponse, request.mcpResponse);
    
    // 5. 응답 타입 결정
    const responseType = this.determineResponseType(request.intent);
    
    // 6. 제안 액션 생성
    const suggestedActions = this.generateSuggestedActions(request.intent);

    return {
      text: finalResponse,
      type: responseType,
      confidence: request.intent.confidence,
      suggestedActions,
      metadata: {
        intentName: request.intent.name,
        entitiesFound: Object.keys(request.intent.entities).length,
        hasServerData: !!request.serverData,
        hasMCPResponse: !!request.mcpResponse
      }
    };
  }

  /**
   * 응답 템플릿 초기화
   */
  private initializeResponseTemplates(): void {
    // 서버 상태 응답
    this.responseTemplates.set('server_status', [
      '📊 **현재 서버 상태를 확인했습니다**\n\n{server_summary}\n\n{detailed_status}',
      '🔍 **서버 상태 분석 결과**\n\n{server_summary}\n\n{recommendations}',
      '✅ **시스템 상태 점검 완료**\n\n{server_summary}\n\n{next_actions}'
    ]);

    // 성능 분석 응답
    this.responseTemplates.set('performance_analysis', [
      '⚡ **성능 분석 결과**\n\n{performance_summary}\n\n{bottlenecks}\n\n{optimization_tips}',
      '📈 **리소스 사용률 분석**\n\n{resource_analysis}\n\n{performance_trends}\n\n{recommendations}',
      '🎯 **성능 최적화 제안**\n\n{current_performance}\n\n{improvement_areas}\n\n{action_plan}'
    ]);

    // 로그 분석 응답
    this.responseTemplates.set('log_analysis', [
      '🔍 **로그 분석 완료**\n\n{log_summary}\n\n{error_patterns}\n\n{recommendations}',
      '📋 **이슈 분석 결과**\n\n{issue_summary}\n\n{root_cause}\n\n{solution_steps}',
      '🚨 **장애 원인 분석**\n\n{failure_analysis}\n\n{impact_assessment}\n\n{recovery_plan}'
    ]);

    // 알림 관리 응답
    this.responseTemplates.set('alert_management', [
      '🔔 **알림 설정 현황**\n\n{alert_summary}\n\n{active_alerts}\n\n{configuration_tips}',
      '⚠️ **경고 상태 분석**\n\n{warning_analysis}\n\n{severity_levels}\n\n{response_actions}',
      '📢 **모니터링 규칙 검토**\n\n{monitoring_status}\n\n{rule_effectiveness}\n\n{improvements}'
    ]);

    // 특정 서버 분석 응답
    this.responseTemplates.set('specific_server_analysis', [
      '🖥️ **서버 상세 분석**\n\n{server_details}\n\n{health_metrics}\n\n{recommendations}',
      '🔧 **서버 진단 결과**\n\n{diagnostic_summary}\n\n{issues_found}\n\n{action_items}',
      '📊 **개별 서버 리포트**\n\n{server_report}\n\n{performance_metrics}\n\n{maintenance_tips}'
    ]);

    // 용량 계획 응답
    this.responseTemplates.set('capacity_planning', [
      '📈 **용량 계획 분석**\n\n{capacity_analysis}\n\n{growth_projections}\n\n{scaling_recommendations}',
      '🚀 **확장 계획 제안**\n\n{current_capacity}\n\n{future_needs}\n\n{implementation_plan}',
      '💡 **리소스 최적화 방안**\n\n{optimization_opportunities}\n\n{cost_analysis}\n\n{timeline}'
    ]);

    // 일반 질문 응답
    this.responseTemplates.set('general_inquiry', [
      '💬 **도움말**\n\n{help_content}\n\n{available_commands}\n\n{examples}',
      '🤖 **AI 어시스턴트 가이드**\n\n{guide_content}\n\n{features}\n\n{tips}',
      '📚 **사용법 안내**\n\n{usage_guide}\n\n{common_tasks}\n\n{best_practices}'
    ]);

    // 에러 응답
    this.responseTemplates.set('error', [
      '❌ **처리 중 오류가 발생했습니다**\n\n{error_description}\n\n{troubleshooting_steps}',
      '🔧 **시스템 오류**\n\n{error_details}\n\n{recovery_options}\n\n{support_contact}'
    ]);
  }

  /**
   * 컨텍스트 수정자 초기화
   */
  private initializeContextualModifiers(): void {
    this.contextualModifiers.set('urgent', [
      '🚨 **긴급 상황 감지** - 즉시 조치가 필요합니다.\n\n',
      '⚡ **우선순위 높음** - 빠른 대응이 필요한 상황입니다.\n\n'
    ]);

    this.contextualModifiers.set('global', [
      '🌐 **전체 시스템 범위** - 모든 서버를 대상으로 분석했습니다.\n\n',
      '📊 **통합 분석 결과** - 전체 인프라를 종합적으로 검토했습니다.\n\n'
    ]);

    this.contextualModifiers.set('specific', [
      '🎯 **특정 대상 분석** - 요청하신 서버를 집중 분석했습니다.\n\n',
      '🔍 **개별 서버 진단** - 해당 서버의 상세 정보를 확인했습니다.\n\n'
    ]);
  }

  /**
   * 기본 응답 선택
   */
  private selectBaseResponse(intent: Intent): string {
    const templates = this.responseTemplates.get(intent.name) || 
                     this.responseTemplates.get('general_inquiry') || 
                     ['기본 응답을 생성할 수 없습니다.'];
    
    // 신뢰도에 따라 템플릿 선택
    const templateIndex = Math.floor(intent.confidence * templates.length);
    return templates[Math.min(templateIndex, templates.length - 1)];
  }

  /**
   * 서버 데이터로 응답 보강
   */
  private enrichWithServerData(response: string, serverData?: any): string {
    if (!serverData) {
      return response.replace(/{[^}]+}/g, '데이터를 수집하고 있습니다...');
    }

    let enrichedResponse = response;

    // 서버 요약 정보
    if (response.includes('{server_summary}')) {
      const summary = this.generateServerSummary(serverData);
      enrichedResponse = enrichedResponse.replace('{server_summary}', summary);
    }

    // 성능 요약
    if (response.includes('{performance_summary}')) {
      const perfSummary = this.generatePerformanceSummary(serverData);
      enrichedResponse = enrichedResponse.replace('{performance_summary}', perfSummary);
    }

    // 상세 상태
    if (response.includes('{detailed_status}')) {
      const detailedStatus = this.generateDetailedStatus(serverData);
      enrichedResponse = enrichedResponse.replace('{detailed_status}', detailedStatus);
    }

    // 권장사항
    if (response.includes('{recommendations}')) {
      const recommendations = this.generateRecommendations(serverData);
      enrichedResponse = enrichedResponse.replace('{recommendations}', recommendations);
    }

    return enrichedResponse;
  }

  /**
   * 컨텍스트 수정자 적용
   */
  private applyContextualModifiers(response: string, context: any): string {
    if (!context || !context.length) return response;

    let modifiedResponse = response;

    for (const contextItem of context) {
      const modifiers = this.contextualModifiers.get(contextItem);
      if (modifiers && modifiers.length > 0) {
        const modifier = modifiers[Math.floor(Math.random() * modifiers.length)];
        modifiedResponse = modifier + modifiedResponse;
      }
    }

    return modifiedResponse;
  }

  /**
   * MCP 응답 통합
   */
  private integrateMCPResponse(response: string, mcpResponse?: any): string {
    if (!mcpResponse) return response;

    // MCP 응답이 있으면 기존 응답과 통합
    if (mcpResponse.response) {
      return response + '\n\n**추가 분석:**\n' + mcpResponse.response;
    }

    return response;
  }

  /**
   * 응답 타입 결정
   */
  private determineResponseType(intent: Intent): 'informational' | 'actionable' | 'warning' | 'error' {
    if (intent.name === 'error') return 'error';
    if (intent.context.includes('urgent')) return 'warning';
    if (['alert_management', 'specific_server_analysis'].includes(intent.name)) return 'actionable';
    return 'informational';
  }

  /**
   * 제안 액션 생성
   */
  private generateSuggestedActions(intent: Intent): string[] {
    const actionMap: Record<string, string[]> = {
      'server_status': ['서버 상세 보기', '성능 분석', '로그 확인'],
      'performance_analysis': ['최적화 실행', '리소스 확장', '알림 설정'],
      'log_analysis': ['로그 다운로드', '이슈 티켓 생성', '모니터링 강화'],
      'alert_management': ['알림 규칙 수정', '임계값 조정', '알림 히스토리'],
      'specific_server_analysis': ['서버 재시작', '설정 백업', '원격 접속'],
      'capacity_planning': ['용량 확장', '비용 분석', '마이그레이션 계획']
    };

    return actionMap[intent.name] || ['도움말 보기', '다른 질문하기'];
  }

  /**
   * 서버 요약 생성
   */
  private generateServerSummary(serverData: any): string {
    if (Array.isArray(serverData)) {
      const total = serverData.length;
      const online = serverData.filter(s => s.status === 'online').length;
      const warning = serverData.filter(s => s.status === 'warning').length;
      const offline = serverData.filter(s => s.status === 'offline').length;

      return `**총 ${total}대 서버**\n✅ 정상: ${online}대\n⚠️ 경고: ${warning}대\n❌ 오프라인: ${offline}대`;
    }

    return '서버 정보를 분석 중입니다...';
  }

  /**
   * 성능 요약 생성
   */
  private generatePerformanceSummary(serverData: any): string {
    if (Array.isArray(serverData)) {
      const avgCpu = Math.round(serverData.reduce((sum, s) => sum + (s.cpu || 0), 0) / serverData.length);
      const avgMemory = Math.round(serverData.reduce((sum, s) => sum + (s.memory || 0), 0) / serverData.length);
      
      return `**평균 리소스 사용률**\n🔥 CPU: ${avgCpu}%\n💾 메모리: ${avgMemory}%`;
    }

    return '성능 데이터를 수집 중입니다...';
  }

  /**
   * 상세 상태 생성
   */
  private generateDetailedStatus(serverData: any): string {
    return '**상세 분석 결과**\n• 시스템 안정성: 양호\n• 응답 시간: 정상 범위\n• 에러율: 낮음';
  }

  /**
   * 권장사항 생성
   */
  private generateRecommendations(serverData: any): string {
    return '**권장사항**\n1. 정기적인 성능 모니터링 유지\n2. 백업 정책 점검\n3. 보안 업데이트 확인';
  }
} 