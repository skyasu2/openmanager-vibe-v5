import { MCPProcessor, MCPResponse } from '../modules/mcp';
import { Server } from '../types/server';

export interface AgentRequest {
  query: string;
  serverId?: string;
  context?: Record<string, any>;
}

export interface AgentResponse {
  success: boolean;
  data?: MCPResponse;
  error?: string;
}

export class AgentService {
  private static instance: AgentService;
  private mcpProcessor: MCPProcessor;
  private serverCache: Map<string, Server> = new Map();

  constructor() {
    this.mcpProcessor = MCPProcessor.getInstance();
  }

  static getInstance(): AgentService {
    if (!AgentService.instance) {
      AgentService.instance = new AgentService();
    }
    return AgentService.instance;
  }

  // 서버 데이터 캐시 업데이트
  updateServerCache(servers: Server[]) {
    this.serverCache.clear();
    servers.forEach(server => {
      this.serverCache.set(server.id, server);
    });
  }

  // AI 질의 처리
  async processQuery(request: AgentRequest): Promise<AgentResponse> {
    try {
      const { query, serverId, context } = request;
      
      // 서버 데이터 가져오기
      let serverData: Server | undefined;
      if (serverId) {
        serverData = this.serverCache.get(serverId);
      }

      // MCP 엔진으로 질의 처리
      const mcpResponse = await this.mcpProcessor.processQuery(
        query, 
        serverData
      );

      // 추가 컨텍스트 정보 보강
      const enhancedResponse = await this.enhanceResponse(mcpResponse, context);

      return {
        success: true,
        data: enhancedResponse
      };

    } catch (error) {
      console.error('AgentService 오류:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
      };
    }
  }

  // 응답 개선 및 컨텍스트 보강
  private async enhanceResponse(
    mcpResponse: MCPResponse, 
    context?: Record<string, any>
  ): Promise<MCPResponse> {
    
    // 시간대별 맞춤 응답
    const currentHour = new Date().getHours();
    let timeContext = '';
    
    if (currentHour >= 9 && currentHour < 18) {
      timeContext = '(업무시간 중)';
    } else if (currentHour >= 18 && currentHour < 22) {
      timeContext = '(저녁시간)';
    } else {
      timeContext = '(야간시간)';
    }

    // 추가 액션 제안
    const additionalActions = this.generateAdditionalActions(
      mcpResponse.intent.intent,
      context
    );

    return {
      ...mcpResponse,
      response: mcpResponse.response + `\n\n*${timeContext} 분석 완료*`,
      actions: [...(mcpResponse.actions || []), ...additionalActions],
      metadata: {
        ...mcpResponse.metadata,
        enhancedAt: new Date().toISOString(),
        contextApplied: !!context
      }
    };
  }

  // 인텐트별 추가 액션 생성
  private generateAdditionalActions(intent: string, context?: Record<string, any>): string[] {
    const actions: string[] = [];

    switch (intent) {
      case 'server_status':
        actions.push('export_report', 'schedule_maintenance');
        break;
        
      case 'performance_analysis':
        actions.push('auto_optimize', 'create_alert');
        break;
        
      case 'log_analysis':
        actions.push('filter_logs', 'create_ticket');
        break;
        
      case 'alert_management':
        actions.push('silence_alert', 'escalate');
        break;
        
      case 'specific_server_analysis':
        actions.push('remote_access', 'backup_config');
        break;
    }

    return actions;
  }

  // 빠른 상태 확인
  async getQuickStatus(): Promise<AgentResponse> {
    return this.processQuery({
      query: '전체 서버 상태를 간단히 알려주세요'
    });
  }

  // 성능 요약
  async getPerformanceSummary(): Promise<AgentResponse> {
    return this.processQuery({
      query: '성능 이슈가 있는 서버들을 찾아주세요'
    });
  }

  // 특정 서버 분석
  async analyzeServer(serverId: string): Promise<AgentResponse> {
    return this.processQuery({
      query: `${serverId} 서버를 상세히 분석해주세요`,
      serverId
    });
  }

  // 로그 분석 요청
  async analyzeLogs(serverId?: string): Promise<AgentResponse> {
    const query = serverId 
      ? `${serverId} 서버의 최근 로그를 분석해주세요`
      : '전체 시스템의 최근 에러 로그를 분석해주세요';
      
    return this.processQuery({
      query,
      serverId
    });
  }

  // 권장사항 생성
  async getRecommendations(): Promise<AgentResponse> {
    return this.processQuery({
      query: '시스템 최적화를 위한 권장사항을 알려주세요'
    });
  }
}

// 싱글톤 인스턴스 export
export const agentService = AgentService.getInstance();
export default AgentService; 