/**
 * 🤖 MCP LangGraph Agent
 * 
 * LangGraph 스타일의 사고 과정과 ReAct 프레임워크를 통합한 MCP Agent
 * - 단계별 로직 추적 (logStep)
 * - Thought → Observation → Action → Answer 흐름
 * - OpenManager Vibe v5 시스템과 완전 통합
 * - 실시간 모니터링 및 분석 기능
 */

import { 
  langGraphProcessor, 
  logStep, 
  thought, 
  observation, 
  action, 
  answer, 
  reflection 
} from '@/modules/ai-agent/core/LangGraphThinkingProcessor';
import { simulationEngine } from '@/services/simulationEngine';
import type { ServerMetrics } from '@/types/server';

export interface MCPQuery {
  id: string;
  question: string;
  context?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'monitoring' | 'analysis' | 'prediction' | 'incident' | 'general';
}

export interface MCPResponse {
  query_id: string;
  answer: string;
  confidence: number;
  reasoning_steps: string[];
  recommendations: string[];
  related_servers: string[];
  execution_time: number;
  sources: string[];
}

export class MCPLangGraphAgent {
  private static instance: MCPLangGraphAgent;
  private isInitialized = false;
  private sessionId: string;

  private constructor() {
    this.sessionId = `mcp_session_${Date.now()}`;
  }

  static getInstance(): MCPLangGraphAgent {
    if (!MCPLangGraphAgent.instance) {
      MCPLangGraphAgent.instance = new MCPLangGraphAgent();
    }
    return MCPLangGraphAgent.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    await langGraphProcessor.initialize();
    this.isInitialized = true;
    
    console.log(`🤖 MCP LangGraph Agent initialized (session: ${this.sessionId})`);
  }

  /**
   * 🎯 메인 질의응답 처리 - LangGraph 스타일
   */
  async processQuery(query: MCPQuery): Promise<MCPResponse> {
    const startTime = Date.now();
    
    // 1. 사고 흐름 시작
    const queryId = langGraphProcessor.startThinking(this.sessionId, query.question, 'react');
    
    try {
      // 2. 질문 분석 단계
      const intent = await this.analyzeQuery(query);
      
      // 3. 컨텍스트 수집 단계
      const context = await this.gatherContext(query, intent);
      
      // 4. 분석 및 추론 단계
      const analysis = await this.performAnalysis(context, intent);
      
      // 5. 답변 생성 단계
      const response = await this.generateResponse(query, analysis);
      
      // 6. 검증 및 최종화 단계
      const finalResponse = await this.validateAndFinalize(response);
      
      // 7. 사고 과정 완료
      langGraphProcessor.completeThinking(finalResponse);
      
      return {
        ...finalResponse,
        query_id: queryId,
        execution_time: Date.now() - startTime
      };
      
    } catch (error) {
      console.error('MCP 질의 처리 실패:', error);
      langGraphProcessor.errorThinking(error instanceof Error ? error.message : '알 수 없는 오류');
      
      throw error;
    }
  }

  /**
   * 🔍 1단계: 질문 분석
   */
  private async analyzeQuery(query: MCPQuery): Promise<string> {
    const stepId = logStep("질문을 분석하고 있습니다...", `사용자 질문: "${query.question}"`, 'analysis');
    
    thought(`사용자가 "${query.question}"에 대해 ${query.priority} 우선순위로 질문했습니다. 카테고리는 ${query.category}입니다.`);
    
    // 질문 의도 분석
    const keywords = query.question.toLowerCase();
    let intent = 'general_inquiry';
    
    if (keywords.includes('서버') || keywords.includes('server')) {
      if (keywords.includes('상태') || keywords.includes('status')) {
        intent = 'server_status_check';
      } else if (keywords.includes('성능') || keywords.includes('performance')) {
        intent = 'performance_analysis';
      } else if (keywords.includes('장애') || keywords.includes('error') || keywords.includes('down')) {
        intent = 'incident_investigation';
      }
    } else if (keywords.includes('예측') || keywords.includes('predict')) {
      intent = 'predictive_analysis';
    } else if (keywords.includes('추천') || keywords.includes('recommend')) {
      intent = 'recommendation_request';
    }
    
    observation(`질문 분석 완료: 의도=${intent}, 카테고리=${query.category}, 우선순위=${query.priority}`);
    langGraphProcessor.completeStep(stepId, { intent, category: query.category, priority: query.priority });
    
    return intent;
  }

  /**
   * 📊 2단계: 컨텍스트 수집
   */
  private async gatherContext(query: MCPQuery, intent: string): Promise<any> {
    const stepId = logStep("관련 데이터를 수집 중...", `의도: ${intent}`, 'query');
    langGraphProcessor.thought("분석에 필요한 컨텍스트 데이터를 수집해야 합니다.");
    
    try {
      console.log('📡 서버 데이터 수집 시작...');
      
      // 🔧 서버사이드에서는 시뮬레이션 엔진 직접 사용
      const servers = simulationEngine.getServers();
      console.log('✅ 시뮬레이션 엔진에서 직접 데이터 수신:', servers.length + '개 서버');
      
      if (servers.length === 0) {
        console.warn('⚠️ 서버 데이터가 비어있습니다. 시뮬레이션 엔진 시작...');
        simulationEngine.start();
        await new Promise(resolve => setTimeout(resolve, 500));
        const retryServers = simulationEngine.getServers();
        console.log('🔄 재시도 후 서버 수:', retryServers.length);
        
        if (retryServers.length === 0) {
          throw new Error('시뮬레이션 엔진에서 서버 데이터를 가져올 수 없습니다');
        }
        
        return await this.processServerData(retryServers, intent);
      }
      
      const context = await this.processServerData(servers, intent);
      
      observation(`컨텍스트 수집 완료: ${servers.length}개 서버, 분석 대상 선정됨`);
      langGraphProcessor.completeStep(stepId, context);
      
      return context;
      
    } catch (error) {
      console.error('❌ 컨텍스트 수집 실패:', error);
      langGraphProcessor.errorStep(stepId, error instanceof Error ? error.message : '컨텍스트 수집 실패');
      
      // 🔄 Fallback: 기본 컨텍스트 생성
      const fallbackContext = {
        servers: [],
        intent,
        timestamp: new Date().toISOString(),
        source: 'fallback',
        error: error instanceof Error ? error.message : '데이터 수집 실패'
      };
      
      observation(`Fallback 컨텍스트 사용: 오류로 인한 기본 데이터 생성`);
      langGraphProcessor.completeStep(stepId, fallbackContext);
      
      return fallbackContext;
    }
  }

  /**
   * 🔧 서버 데이터 처리 및 분석
   */
  private async processServerData(servers: any[], intent: string): Promise<any> {
    // 의도에 따른 관련 서버 필터링 및 분석
    const relevantServers = servers.filter(server => {
      if (intent === 'server_status_check') return true;
      if (intent === 'performance_analysis') return server.cpu_usage > 70 || server.memory_usage > 80;
      if (intent === 'incident_investigation') return server.status !== 'healthy' || server.alerts?.length > 0;
      return true; // 기본적으로 모든 서버 포함
    });

    // 상태별 분류
    const statusSummary = {
      healthy: relevantServers.filter(s => s.status === 'healthy').length,
      warning: relevantServers.filter(s => s.status === 'warning').length,
      critical: relevantServers.filter(s => s.status === 'critical').length,
      total: relevantServers.length
    };

    // 성능 메트릭 요약
    const performanceSummary = {
      avg_cpu: relevantServers.reduce((sum, s) => sum + (s.cpu_usage || 0), 0) / relevantServers.length,
      avg_memory: relevantServers.reduce((sum, s) => sum + (s.memory_usage || 0), 0) / relevantServers.length,
      max_response_time: Math.max(...relevantServers.map(s => s.response_time || 0)),
      total_alerts: relevantServers.reduce((sum, s) => sum + (s.alerts?.length || 0), 0)
    };

    const relevantData: any = {
      servers: relevantServers,
      status_summary: statusSummary,
      performance_summary: performanceSummary,
      intent,
      timestamp: new Date().toISOString(),
      analysis_scope: `${relevantServers.length}/${servers.length} 서버 분석`
    };

    return relevantData;
  }

  /**
   * 🧮 3단계: 분석 및 추론
   */
  private async performAnalysis(context: any, intent: string): Promise<any> {
    const stepId = logStep("데이터를 분석하고 패턴을 찾는 중...", `${intent} 기반 심층 분석 수행`, 'processing');
    
    thought("수집된 데이터를 바탕으로 패턴을 분석하고 인사이트를 도출해야 합니다.");
    action(`${intent} 분석 알고리즘 실행`);
    
    let analysis: any = {};
    
    switch (intent) {
      case 'server_status_check':
        analysis = this.analyzeServerStatus(context);
        break;
      case 'performance_analysis':
        analysis = this.analyzePerformance(context);
        break;
      case 'incident_investigation':
        analysis = this.analyzeIncidents(context);
        break;
      case 'predictive_analysis':
        analysis = this.predictTrends(context);
        break;
      default:
        analysis = this.generalAnalysis(context);
    }
    
    observation(`분석 완료: ${Object.keys(analysis).length}개 분석 항목 도출`);
    langGraphProcessor.completeStep(stepId, analysis);
    
    return analysis;
  }

  /**
   * 📝 4단계: 답변 생성
   */
  private async generateResponse(query: MCPQuery, analysis: any): Promise<Partial<MCPResponse>> {
    const stepId = logStep("답변을 구성하고 있습니다...", "분석 결과를 바탕으로 사용자 친화적인 답변 생성", 'summary');
    
    thought("분석 결과를 종합하여 명확하고 실행 가능한 답변을 구성해야 합니다.");
    action("답변 템플릿 생성 및 개인화");
    
    let responseText = '';
    let recommendations: string[] = [];
    let relatedServers: string[] = [];
    let confidence = 0.8; // 기본 신뢰도
    
    // 분석 결과에 따른 답변 생성
    if (analysis.serverStatus) {
      responseText = this.formatServerStatusResponse(analysis.serverStatus);
      relatedServers = analysis.serverStatus.allServers?.map((s: any) => s.hostname) || [];
      recommendations = this.generateServerStatusRecommendations(analysis.serverStatus);
    } else if (analysis.performance) {
      responseText = this.formatPerformanceResponse(analysis.performance);
      relatedServers = analysis.performance.issueServers?.map((s: any) => s.hostname) || [];
      recommendations = this.generatePerformanceRecommendations(analysis.performance);
    } else if (analysis.incidents) {
      responseText = this.formatIncidentResponse(analysis.incidents);
      relatedServers = analysis.incidents.affectedServers?.map((s: any) => s.hostname) || [];
      recommendations = this.generateIncidentRecommendations(analysis.incidents);
      confidence = 0.9; // 인시던트 분석은 높은 신뢰도
    } else {
      responseText = this.formatGeneralResponse(analysis);
      recommendations = ['추가 정보가 필요합니다.', '더 구체적인 질문을 해주세요.'];
      confidence = 0.6; // 일반 분석은 낮은 신뢰도
    }
    
    const response = {
      answer: responseText,
      confidence,
      recommendations,
      related_servers: relatedServers,
      reasoning_steps: this.extractReasoningSteps(),
      sources: ['OpenManager Simulation Engine', 'Real-time Server Metrics']
    };
    
    answer(responseText);
    langGraphProcessor.completeStep(stepId, response);
    
    return response;
  }

  /**
   * ✅ 5단계: 검증 및 최종화
   */
  private async validateAndFinalize(response: Partial<MCPResponse>): Promise<MCPResponse> {
    const stepId = logStep("답변을 검증하고 최종화하는 중...", "품질 검사 및 최종 답변 준비", 'validation');
    
    thought("생성된 답변의 정확성과 완성도를 검증해야 합니다.");
    action("답변 품질 검사 실행");
    
    // 기본값 설정
    const finalResponse: MCPResponse = {
      query_id: '',
      answer: response.answer || '답변을 생성할 수 없습니다.',
      confidence: response.confidence || 0.5,
      reasoning_steps: response.reasoning_steps || [],
      recommendations: response.recommendations || [],
      related_servers: response.related_servers || [],
      execution_time: 0,
      sources: response.sources || []
    };
    
    // 신뢰도 조정
    if (finalResponse.answer.length < 50) {
      finalResponse.confidence *= 0.8; // 짧은 답변은 신뢰도 감소
    }
    if (finalResponse.recommendations.length === 0) {
      finalResponse.confidence *= 0.9; // 추천사항 없으면 신뢰도 감소
    }
    
    // 최종 검증
    if (finalResponse.confidence < 0.3) {
      finalResponse.answer = "죄송합니다. 충분한 정보를 수집하지 못했습니다. 더 구체적인 질문을 해주시겠어요?";
      finalResponse.recommendations = ["질문을 더 구체적으로 작성해주세요", "시스템 상태를 확인해주세요"];
    }
    
    observation(`답변 검증 완료: 신뢰도 ${Math.round(finalResponse.confidence * 100)}%, ${finalResponse.recommendations.length}개 추천사항`);
    langGraphProcessor.completeStep(stepId, finalResponse);
    
    reflection(`총 분석 시간과 품질을 고려할 때, 이 답변은 사용자의 질문에 적절히 대응했다고 판단됩니다.`);
    
    return finalResponse;
  }

  /**
   * 🏥 서버 상태 분석
   */
  private analyzeServerStatus(context: any): any {
    const { servers, healthyServers, warningServers, errorServers } = context;
    
    return {
      serverStatus: {
        total: servers.length,
        healthy: healthyServers.length,
        warning: warningServers.length,
        error: errorServers.length,
        healthPercentage: Math.round((healthyServers.length / servers.length) * 100),
        allServers: servers,
        issueServers: [...warningServers, ...errorServers]
      }
    };
  }

  /**
   * ⚡ 성능 분석
   */
  private analyzePerformance(context: any): any {
    const { servers, highCpuServers, highMemoryServers, slowResponseServers } = context;
    
    return {
      performance: {
        totalServers: servers.length,
        highCpuCount: highCpuServers.length,
        highMemoryCount: highMemoryServers.length,
        slowResponseCount: slowResponseServers.length,
        issueServers: [...new Set([...highCpuServers, ...highMemoryServers, ...slowResponseServers])],
        avgCpu: servers.reduce((sum: number, s: any) => sum + s.cpu_usage, 0) / servers.length,
        avgMemory: servers.reduce((sum: number, s: any) => sum + s.memory_usage, 0) / servers.length,
        avgResponseTime: servers.reduce((sum: number, s: any) => sum + s.response_time, 0) / servers.length
      }
    };
  }

  /**
   * 🚨 인시던트 분석
   */
  private analyzeIncidents(context: any): any {
    const { servers, alertedServers, criticalAlerts } = context;
    
    return {
      incidents: {
        totalServers: servers.length,
        affectedServers: alertedServers,
        criticalAlerts: criticalAlerts,
        severityDistribution: this.calculateSeverityDistribution(criticalAlerts),
        topIssues: this.identifyTopIssues(criticalAlerts)
      }
    };
  }

  /**
   * 🔮 트렌드 예측
   */
  private predictTrends(context: any): any {
    const { servers } = context;
    
    return {
      predictions: {
        systemLoad: this.predictSystemLoad(servers),
        potentialIssues: this.identifyPotentialIssues(servers),
        recommendations: this.generatePredictiveRecommendations(servers)
      }
    };
  }

  /**
   * 📊 일반 분석
   */
  private generalAnalysis(context: any): any {
    const { servers, summary } = context;
    
    return {
      general: {
        serverCount: servers.length,
        simulationInfo: summary,
        systemOverview: {
          avgCpu: servers.reduce((sum: number, s: any) => sum + s.cpu_usage, 0) / servers.length,
          avgMemory: servers.reduce((sum: number, s: any) => sum + s.memory_usage, 0) / servers.length,
          totalAlerts: servers.reduce((sum: number, s: any) => sum + (s.alerts?.length || 0), 0)
        }
      }
    };
  }

  // 유틸리티 메서드들...
  private formatServerStatusResponse(status: any): string {
    return `🏥 **서버 상태 요약**

전체 ${status.total}개 서버 중:
- ✅ 정상: ${status.healthy}개 (${status.healthPercentage}%)
- ⚠️ 경고: ${status.warning}개
- ❌ 오류: ${status.error}개

${status.error > 0 ? '⚠️ 즉시 조치가 필요한 서버가 있습니다.' : '✨ 모든 서버가 안정적으로 운영되고 있습니다.'}`;
  }

  private formatPerformanceResponse(perf: any): string {
    return `⚡ **성능 분석 결과**

시스템 평균 지표:
- CPU 사용률: ${Math.round(perf.avgCpu)}%
- 메모리 사용률: ${Math.round(perf.avgMemory)}%
- 평균 응답시간: ${Math.round(perf.avgResponseTime)}ms

성능 이슈:
- 높은 CPU 사용률: ${perf.highCpuCount}대
- 높은 메모리 사용률: ${perf.highMemoryCount}대
- 느린 응답시간: ${perf.slowResponseCount}대`;
  }

  private formatIncidentResponse(incidents: any): string {
    return `🚨 **인시던트 분석**

- 영향받은 서버: ${incidents.affectedServers.length}대
- 심각한 알림: ${incidents.criticalAlerts.length}건
- 주요 이슈 유형: ${incidents.topIssues.slice(0, 3).join(', ')}

즉시 조치가 필요한 상황입니다.`;
  }

  private formatGeneralResponse(analysis: any): string {
    return `📊 **시스템 개요**

현재 ${analysis.general?.serverCount || 0}개의 서버가 모니터링되고 있으며, 시뮬레이션 엔진을 통해 실시간으로 상태를 추적하고 있습니다.

더 구체적인 정보가 필요하시면 서버 상태, 성능 분석, 또는 특정 서버에 대해 질문해주세요.`;
  }

  private generateServerStatusRecommendations(status: any): string[] {
    const recommendations = [];
    
    if (status.error > 0) {
      recommendations.push("오류 상태 서버의 로그를 확인하고 즉시 조치하세요");
      recommendations.push("장애 서버의 백업 시스템 가동을 검토하세요");
    }
    
    if (status.warning > 0) {
      recommendations.push("경고 상태 서버의 리소스 사용량을 모니터링하세요");
    }
    
    if (status.healthPercentage < 80) {
      recommendations.push("전체 시스템 건강도가 낮습니다. 인프라 점검을 권장합니다");
    }
    
    return recommendations;
  }

  private generatePerformanceRecommendations(perf: any): string[] {
    const recommendations = [];
    
    if (perf.avgCpu > 80) {
      recommendations.push("CPU 사용률이 높습니다. 로드 밸런싱을 검토하세요");
    }
    
    if (perf.avgMemory > 80) {
      recommendations.push("메모리 사용률이 높습니다. 메모리 증설을 고려하세요");
    }
    
    if (perf.avgResponseTime > 300) {
      recommendations.push("응답시간이 느립니다. 캐시 설정을 확인하세요");
    }
    
    return recommendations;
  }

  private generateIncidentRecommendations(incidents: any): string[] {
    return [
      "영향받은 서버들의 로그를 즉시 확인하세요",
      "심각한 알림에 대한 에스컬레이션을 시작하세요",
      "백업 시스템 상태를 점검하세요",
      "관련 팀에 상황을 공유하세요"
    ];
  }

  private extractReasoningSteps(): string[] {
    const currentFlow = langGraphProcessor.getCurrentFlow();
    if (!currentFlow) return [];
    
    return currentFlow.logic_steps.map(step => `${step.step}. ${step.title}`);
  }

  // 추가 유틸리티 메서드들
  private calculateSeverityDistribution(alerts: any[]): Record<number, number> {
    return alerts.reduce((dist, alert) => {
      const severity = Number(alert.severity);
      dist[severity] = (dist[severity] || 0) + 1;
      return dist;
    }, {} as Record<number, number>);
  }

  private identifyTopIssues(alerts: any[]): string[] {
    const issueTypes = alerts.reduce((types, alert) => {
      types[alert.type] = (types[alert.type] || 0) + 1;
      return types;
    }, {} as Record<string, number>);
    
    return Object.entries(issueTypes)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([type]) => type);
  }

  private predictSystemLoad(servers: any[]): string {
    const avgLoad = servers.reduce((sum, s) => sum + s.cpu_usage, 0) / servers.length;
    
    if (avgLoad > 80) return 'HIGH';
    if (avgLoad > 60) return 'MEDIUM';
    return 'LOW';
  }

  private identifyPotentialIssues(servers: any[]): string[] {
    const issues = [];
    
    const highCpuServers = servers.filter(s => s.cpu_usage > 85);
    if (highCpuServers.length > 0) {
      issues.push(`${highCpuServers.length}개 서버에서 CPU 과부하 예상`);
    }
    
    const highMemoryServers = servers.filter(s => s.memory_usage > 90);
    if (highMemoryServers.length > 0) {
      issues.push(`${highMemoryServers.length}개 서버에서 메모리 부족 예상`);
    }
    
    return issues;
  }

  private generatePredictiveRecommendations(servers: any[]): string[] {
    return [
      "리소스 사용량 트렌드를 지속적으로 모니터링하세요",
      "피크 시간대 대비 추가 용량을 준비하세요",
      "자동 스케일링 정책을 검토하세요"
    ];
  }
}

// 전역 인스턴스
export const mcpLangGraphAgent = MCPLangGraphAgent.getInstance(); 