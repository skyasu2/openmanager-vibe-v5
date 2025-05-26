/**
 * Response Generator
 * 
 * 💬 AI 응답 생성 시스템
 * - 의도 기반 응답 생성
 * - 모드별 응답 스타일 적용
 * - 컨텍스트 기반 응답 보강
 */

import { Intent } from './IntentClassifier';

export interface ResponseRequest {
  query: string;
  intent: Intent;
  context: any;
  serverData?: any;
  mcpResponse?: any;
}

export interface ResponseResult {
  text: string;
  confidence: number;
  metadata: Record<string, any>;
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
    console.log('💬 Response Generator initialized');
  }

  /**
   * 메인 응답 생성 메서드
   */
  async generate(request: ResponseRequest): Promise<ResponseResult> {
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
      confidence: request.intent.confidence,
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
   * 실제 서버 데이터로 응답 보강
   */
  private enrichWithServerData(response: string, serverData?: any): string {
    if (!serverData) {
      return response.replace(/{[^}]+}/g, '실시간 데이터를 수집하고 있습니다...');
    }

    let enrichedResponse = response;

    // 실제 서버 배열 처리
    const servers = Array.isArray(serverData) ? serverData : [serverData];
    
    // 서버 요약 정보
    if (response.includes('{server_summary}')) {
      const summary = this.generateRealServerSummary(servers);
      enrichedResponse = enrichedResponse.replace('{server_summary}', summary);
    }

    // 성능 요약
    if (response.includes('{performance_summary}')) {
      const perfSummary = this.generateRealPerformanceSummary(servers);
      enrichedResponse = enrichedResponse.replace('{performance_summary}', perfSummary);
    }

    // 상세 상태
    if (response.includes('{detailed_status}')) {
      const detailedStatus = this.generateRealDetailedStatus(servers);
      enrichedResponse = enrichedResponse.replace('{detailed_status}', detailedStatus);
    }

    // 리소스 분석
    if (response.includes('{resource_analysis}')) {
      const resourceAnalysis = this.generateResourceAnalysis(servers);
      enrichedResponse = enrichedResponse.replace('{resource_analysis}', resourceAnalysis);
    }

    // 성능 트렌드
    if (response.includes('{performance_trends}')) {
      const trends = this.generatePerformanceTrends(servers);
      enrichedResponse = enrichedResponse.replace('{performance_trends}', trends);
    }

    // 병목 현상 분석
    if (response.includes('{bottlenecks}')) {
      const bottlenecks = this.analyzeBottlenecks(servers);
      enrichedResponse = enrichedResponse.replace('{bottlenecks}', bottlenecks);
    }

    // 최적화 팁
    if (response.includes('{optimization_tips}')) {
      const tips = this.generateOptimizationTips(servers);
      enrichedResponse = enrichedResponse.replace('{optimization_tips}', tips);
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
    // if (intent.context.includes('urgent')) return 'warning'; // 임시로 주석 처리
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

  /**
   * 실제 서버 데이터 기반 요약 생성
   */
  private generateRealServerSummary(servers: any[]): string {
    const totalServers = servers.length;
    const onlineServers = servers.filter(s => s.status === 'healthy' || s.status === 'online').length;
    const warningServers = servers.filter(s => s.status === 'warning').length;
    const offlineServers = servers.filter(s => s.status === 'critical' || s.status === 'offline').length;
    
    const avgCpu = servers.reduce((sum, s) => sum + (s.metrics?.cpu || s.cpu || 0), 0) / totalServers;
    const avgMemory = servers.reduce((sum, s) => sum + (s.metrics?.memory || s.memory || 0), 0) / totalServers;
    
    return `**📊 전체 서버 현황**
• 총 서버 수: **${totalServers}대**
• 정상 운영: **${onlineServers}대** (${Math.round(onlineServers/totalServers*100)}%)
• 경고 상태: **${warningServers}대** (${Math.round(warningServers/totalServers*100)}%)
• 오프라인: **${offlineServers}대** (${Math.round(offlineServers/totalServers*100)}%)
• 평균 CPU 사용률: **${avgCpu.toFixed(1)}%**
• 평균 메모리 사용률: **${avgMemory.toFixed(1)}%**`;
  }

  private generateRealPerformanceSummary(servers: any[]): string {
    const highCpuServers = servers.filter(s => (s.metrics?.cpu || s.cpu || 0) > 80);
    const highMemoryServers = servers.filter(s => (s.metrics?.memory || s.memory || 0) > 80);
    const criticalServers = servers.filter(s => s.status === 'critical');
    
    return `**⚡ 성능 분석 결과**
• 고부하 CPU 서버: **${highCpuServers.length}대** ${highCpuServers.length > 0 ? `(${highCpuServers.map(s => s.name || s.id).join(', ')})` : ''}
• 고사용 메모리 서버: **${highMemoryServers.length}대** ${highMemoryServers.length > 0 ? `(${highMemoryServers.map(s => s.name || s.id).join(', ')})` : ''}
• 긴급 조치 필요: **${criticalServers.length}대** ${criticalServers.length > 0 ? `(${criticalServers.map(s => s.name || s.id).join(', ')})` : ''}
• 전체 시스템 건강도: **${this.calculateSystemHealth(servers)}%**`;
  }

  private generateRealDetailedStatus(servers: any[]): string {
    const avgResponseTime = servers.length > 0 
      ? servers.reduce((sum, s) => sum + (s.metrics?.responseTime || 20), 0) / servers.length 
      : 0;
    const uptimePercent = servers.length > 0 
      ? servers.reduce((sum, s) => sum + (s.metrics?.uptime || 99), 0) / servers.length 
      : 99;
    const errorRate = servers.length > 0 
      ? servers.reduce((sum, s) => sum + (s.metrics?.errorRate || 0.1), 0) / servers.length 
      : 0.1;
    
    return `**🔍 상세 상태 분석**
• 평균 응답 시간: **${avgResponseTime.toFixed(1)}ms** ${avgResponseTime < 50 ? '✅ 양호' : avgResponseTime < 100 ? '⚠️ 주의' : '🚨 느림'}
• 시스템 가동률: **${uptimePercent.toFixed(2)}%** ${uptimePercent > 99.9 ? '✅ 매우 안정적' : uptimePercent > 99 ? '✅ 안정적' : '⚠️ 개선 필요'}
• 평균 에러율: **${errorRate.toFixed(2)}%** ${errorRate < 0.1 ? '✅ 매우 낮음' : errorRate < 1 ? '✅ 낮음' : '⚠️ 높음'}
• 네트워크 상태: **정상** (평균 지연시간 ${Math.round(avgResponseTime/2)}ms)`;
  }



  private generateResourceAnalysis(servers: any[]): string {
    const cpuStats = this.calculateResourceStats(servers, 'cpu');
    const memoryStats = this.calculateResourceStats(servers, 'memory');
    const diskStats = this.calculateResourceStats(servers, 'disk');
    
    return `**📈 리소스 사용률 분석**
• **CPU 사용률**
  - 평균: ${cpuStats.avg.toFixed(1)}% | 최대: ${cpuStats.max.toFixed(1)}% | 최소: ${cpuStats.min.toFixed(1)}%
• **메모리 사용률**
  - 평균: ${memoryStats.avg.toFixed(1)}% | 최대: ${memoryStats.max.toFixed(1)}% | 최소: ${memoryStats.min.toFixed(1)}%
• **디스크 사용률**
  - 평균: ${diskStats.avg.toFixed(1)}% | 최대: ${diskStats.max.toFixed(1)}% | 최소: ${diskStats.min.toFixed(1)}%`;
  }

  private generatePerformanceTrends(servers: any[]): string {
    const trends = this.analyzePerformanceTrends(servers);
    return `**📊 성능 트렌드 분석**
• CPU 트렌드: ${trends.cpu}
• 메모리 트렌드: ${trends.memory}
• 전반적 성능: ${trends.overall}
• 예상 병목: ${trends.bottleneck}`;
  }

  private analyzeBottlenecks(servers: any[]): string {
    const bottlenecks = [];
    
    const highCpuServers = servers.filter(s => (s.metrics?.cpu || s.cpu || 0) > 85);
    const highMemoryServers = servers.filter(s => (s.metrics?.memory || s.memory || 0) > 85);
    const highDiskServers = servers.filter(s => (s.metrics?.disk || s.disk || 0) > 90);
    
    if (highCpuServers.length > 0) {
      bottlenecks.push(`🔴 **CPU 병목** (${highCpuServers.length}대): ${highCpuServers.map(s => s.name || s.id).join(', ')}`);
    }
    if (highMemoryServers.length > 0) {
      bottlenecks.push(`🟡 **메모리 병목** (${highMemoryServers.length}대): ${highMemoryServers.map(s => s.name || s.id).join(', ')}`);
    }
    if (highDiskServers.length > 0) {
      bottlenecks.push(`🟠 **디스크 병목** (${highDiskServers.length}대): ${highDiskServers.map(s => s.name || s.id).join(', ')}`);
    }
    
    return bottlenecks.length > 0 ? bottlenecks.join('\n') : '✅ **현재 병목 현상 없음** - 모든 서버가 정상 범위 내에서 동작 중입니다.';
  }

  private generateOptimizationTips(servers: any[]): string {
    const tips = [];
    
    const highCpuCount = servers.filter(s => (s.metrics?.cpu || s.cpu || 0) > 80).length;
    const highMemoryCount = servers.filter(s => (s.metrics?.memory || s.memory || 0) > 80).length;
    const offlineCount = servers.filter(s => s.status === 'critical' || s.status === 'offline').length;
    
    if (highCpuCount > 0) {
      tips.push('💡 **CPU 최적화**: 불필요한 프로세스 정리, 로드 밸런싱 검토');
    }
    if (highMemoryCount > 0) {
      tips.push('💡 **메모리 최적화**: 캐시 정리, 메모리 누수 점검');
    }
    if (offlineCount > 0) {
      tips.push('🚨 **긴급 조치**: 오프라인 서버 즉시 점검 필요');
    }
    if (tips.length === 0) {
      tips.push('✅ **현재 최적 상태**: 모든 서버가 효율적으로 운영되고 있습니다.');
    }
    
    return tips.join('\n');
  }

  private calculateSystemHealth(servers: any[]): number {
    const healthScores = servers.map(server => {
      const cpu = server.metrics?.cpu || server.cpu || 0;
      const memory = server.metrics?.memory || server.memory || 0;
      const disk = server.metrics?.disk || server.disk || 0;
      
      let score = 100;
      if (cpu > 80) score -= 20;
      if (memory > 80) score -= 20;
      if (disk > 90) score -= 30;
      if (server.status === 'critical') score -= 50;
      if (server.status === 'warning') score -= 10;
      
      return Math.max(0, score);
    });
    
    return Math.round(healthScores.reduce((sum, score) => sum + score, 0) / healthScores.length);
  }

  private calculateResourceStats(servers: any[], resource: string) {
    const values = servers.map(s => s.metrics?.[resource] || s[resource] || 0);
    return {
      avg: values.reduce((sum, val) => sum + val, 0) / values.length,
      max: Math.max(...values),
      min: Math.min(...values)
    };
  }

  private analyzePerformanceTrends(servers: any[]) {
    const avgCpu = servers.reduce((sum, s) => sum + (s.metrics?.cpu || s.cpu || 0), 0) / servers.length;
    const avgMemory = servers.reduce((sum, s) => sum + (s.metrics?.memory || s.memory || 0), 0) / servers.length;
    
    return {
      cpu: avgCpu > 70 ? '📈 증가 추세 (주의 필요)' : avgCpu > 50 ? '➡️ 안정적' : '📉 낮은 사용률',
      memory: avgMemory > 70 ? '📈 증가 추세 (주의 필요)' : avgMemory > 50 ? '➡️ 안정적' : '📉 낮은 사용률',
      overall: (avgCpu + avgMemory) / 2 > 70 ? '⚠️ 성능 저하 우려' : '✅ 양호한 성능',
      bottleneck: avgCpu > avgMemory ? 'CPU 집약적 워크로드' : 'I/O 집약적 워크로드'
    };
  }
} 