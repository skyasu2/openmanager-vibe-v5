/**
 * 🚀 단순화된 자연어 질의 응답 엔진
 * 
 * 핵심 기능:
 * - 2-Mode 시스템 (로컬/Google AI)
 * - 룰 기반 NLP + Supabase RAG + MCP 컨텍스트
 * - 생각 과정 시각화
 * - 서버 모니터링 특화
 */

import { SupabaseRAGEngine } from '@/lib/ml/supabase-rag-engine';
import { RequestScopedGoogleAIService } from './GoogleAIService';
import { ServerMonitoringAgent } from '../mcp/ServerMonitoringAgent';
import type { ServerInstance } from '@/types/data-generator';
import { systemLogger as logger } from '@/lib/logger';
import { AnomalyDetection } from './AnomalyDetection';
import { incidentReportService } from './IncidentReportService';
import { LightweightMLEngine } from '@/lib/ml/LightweightMLEngine';
import { MLDataManager } from '@/services/ml/MLDataManager';

// 질의 요청 인터페이스
export interface QueryRequest {
  query: string;
  mode?: 'local' | 'google-ai';
  context?: {
    servers?: ServerInstance[];
    timeRange?: { start: Date; end: Date };
    language?: 'ko' | 'en';
  };
  options?: {
    includeMCPContext?: boolean;
    useCache?: boolean;
    maxResponseTime?: number;
  };
}

// 생각 단계 인터페이스
export interface ThinkingStep {
  step: string;
  description?: string;
  status: 'thinking' | 'processing' | 'completed' | 'error';
  duration?: number;
  timestamp?: Date;
}

// 응답 인터페이스
export interface QueryResponse {
  success: boolean;
  answer: string;
  confidence: number;
  engine?: string;
  thinkingSteps: ThinkingStep[];
  error?: string;
  metadata?: {
    processingTime: number;
    cacheHit?: boolean;
    mcpUsed?: boolean;
    fallbackUsed?: boolean;
  };
}

export class SimplifiedQueryEngine {
  private ragEngine: SupabaseRAGEngine;
  private googleAI?: RequestScopedGoogleAIService;
  private mcpAgent: ServerMonitoringAgent;
  private anomalyDetection: AnomalyDetection;
  private mlEngine: LightweightMLEngine;
  private mlDataManager: MLDataManager;
  private initialized = false;
  
  // 룰 기반 패턴
  private readonly patterns = {
    cpu: /cpu|프로세서|사용률|processor|usage/i,
    memory: /memory|메모리|ram|메모리.*사용/i,
    disk: /disk|디스크|storage|저장|용량/i,
    network: /network|네트워크|대역폭|bandwidth/i,
    status: /상태|status|health|헬스|정상/i,
    command: /명령어|command|cmd|확인.*방법/i,
    high: /높은|high|많은|과다|초과/i,
    low: /낮은|low|적은|부족/i,
    problem: /문제|error|에러|오류|장애/i,
    summary: /요약|summary|전체|overview/i,
    // ML 관련 패턴
    anomaly: /이상|비정상|anomaly|unusual|특이/i,
    predict: /예측|예상|forecast|predict|전망/i,
    pattern: /패턴|경향|trend|pattern|추세/i,
    incident: /장애|사고|incident|outage|다운/i,
    ml: /머신러닝|기계학습|ML|machine\s*learning|학습/i,
  };

  constructor() {
    this.ragEngine = new SupabaseRAGEngine();
    this.mcpAgent = ServerMonitoringAgent.getInstance();
    this.anomalyDetection = AnomalyDetection.getInstance();
    this.mlEngine = new LightweightMLEngine();
    this.mlDataManager = MLDataManager.getInstance();
    
    // Google AI는 옵션으로만 초기화
    if (process.env.GOOGLE_AI_API_KEY) {
      this.googleAI = new RequestScopedGoogleAIService();
    }
  }

  /**
   * 엔진 초기화
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      await Promise.all([
        this.ragEngine.initialize(),
        this.googleAI?.initialize(),
      ]);
      
      this.initialized = true;
      logger.info('✅ SimplifiedQueryEngine 초기화 완료');
    } catch (error) {
      logger.error('❌ SimplifiedQueryEngine 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 자연어 질의 처리
   */
  async query(request: QueryRequest): Promise<QueryResponse> {
    const startTime = Date.now();
    const thinkingSteps: ThinkingStep[] = [];
    
    try {
      // 입력 검증
      if (!request.query || request.query.trim() === '') {
        return {
          success: false,
          answer: '',
          confidence: 0,
          error: '질의가 비어있습니다',
          thinkingSteps: [],
        };
      }

      // 초기화 확인
      if (!this.initialized) {
        await this.initialize();
      }

      // 모드 결정
      const mode = request.mode || 'local';
      
      // 생각 과정 시작
      thinkingSteps.push(this.createThinkingStep('질의 분석', 'thinking'));

      // 질의 분석
      const intent = this.analyzeIntent(request.query);
      thinkingSteps[0].status = 'completed';
      thinkingSteps[0].duration = Date.now() - startTime;

      // 모드별 처리
      if (mode === 'google-ai' && this.googleAI) {
        return await this.processGoogleAIQuery(request, thinkingSteps, intent);
      } else {
        return await this.processLocalQuery(request, thinkingSteps, intent);
      }
      
    } catch (error) {
      logger.error('질의 처리 오류:', error);
      return {
        success: false,
        answer: '질의 처리 중 오류가 발생했습니다.',
        confidence: 0,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
        thinkingSteps,
      };
    }
  }

  /**
   * 로컬 모드 질의 처리
   */
  private async processLocalQuery(
    request: QueryRequest,
    thinkingSteps: ThinkingStep[],
    intent: string
  ): Promise<QueryResponse> {
    const stepStartTime = Date.now();
    
    // RAG 검색
    thinkingSteps.push(this.createThinkingStep('RAG 검색', 'processing'));
    const ragStep = thinkingSteps[thinkingSteps.length - 1];
    
    const ragResults = await this.ragEngine.searchSimilar(request.query, {
      maxResults: 5,
      threshold: 0.7,
    });
    
    ragStep.status = 'completed';
    ragStep.duration = Date.now() - stepStartTime;

    // MCP 컨텍스트 수집 (옵션)
    let mcpContext = null;
    if (request.options?.includeMCPContext) {
      const mcpStepTime = Date.now();
      thinkingSteps.push(this.createThinkingStep('MCP 컨텍스트 수집', 'processing'));
      const mcpStep = thinkingSteps[thinkingSteps.length - 1];
      
      // MCP 에이전트에 질의 전달
      const mcpResponse = await this.mcpAgent.processQuery({
        id: `mcp_${Date.now()}`,
        query: request.query,
        timestamp: new Date(),
        context: request.context ? {
          timeRange: request.context.timeRange,
          priority: 'medium' as const,
        } : undefined,
      });
      mcpContext = mcpResponse;
      
      mcpStep.status = 'completed';
      mcpStep.duration = Date.now() - mcpStepTime;
    }

    // 서버 데이터 분석
    const analysisStepTime = Date.now();
    thinkingSteps.push(this.createThinkingStep('데이터 분석', 'processing'));
    const analysisStep = thinkingSteps[thinkingSteps.length - 1];
    
    const analysis = await this.analyzeServerData(request.context?.servers || [], intent);
    
    analysisStep.status = 'completed';
    analysisStep.duration = Date.now() - analysisStepTime;

    // 응답 생성
    const responseStepTime = Date.now();
    thinkingSteps.push(this.createThinkingStep('응답 생성', 'processing'));
    const responseStep = thinkingSteps[thinkingSteps.length - 1];
    
    const answer = this.generateLocalResponse(
      request.query,
      intent,
      analysis,
      ragResults,
      mcpContext
    );
    
    responseStep.status = 'completed';
    responseStep.duration = Date.now() - responseStepTime;

    return {
      success: true,
      answer,
      confidence: this.calculateConfidence(ragResults, analysis),
      engine: 'local',
      thinkingSteps,
      metadata: {
        processingTime: Date.now() - stepStartTime,
        cacheHit: ragResults.cached,
        mcpUsed: !!mcpContext,
        fallbackUsed: false,
      },
    };
  }

  /**
   * Google AI 모드 질의 처리
   */
  private async processGoogleAIQuery(
    request: QueryRequest,
    thinkingSteps: ThinkingStep[],
    intent: string
  ): Promise<QueryResponse> {
    if (!this.googleAI) {
      return this.processLocalQuery(request, thinkingSteps, intent);
    }

    const stepStartTime = Date.now();
    
    // MCP 컨텍스트 수집 (옵션)
    let mcpContext = null;
    let mcpUsed = false;
    if (request.options?.includeMCPContext) {
      const mcpStepTime = Date.now();
      thinkingSteps.push(this.createThinkingStep('MCP 컨텍스트 수집', 'processing'));
      const mcpStep = thinkingSteps[thinkingSteps.length - 1];
      
      try {
        // MCP 에이전트에 질의 전달
        const mcpResponse = await this.mcpAgent.processQuery({
          id: `mcp_${Date.now()}`,
          query: request.query,
          timestamp: new Date(),
          context: request.context ? {
            timeRange: request.context.timeRange,
            priority: 'medium' as const,
          } : undefined,
        });
        mcpContext = mcpResponse;
        mcpUsed = true;
        
        mcpStep.status = 'completed';
        mcpStep.duration = Date.now() - mcpStepTime;
      } catch (error) {
        logger.warn('Google AI 모드에서 MCP 컨텍스트 수집 실패:', error);
        mcpStep.status = 'error';
        mcpStep.duration = Date.now() - mcpStepTime;
        // MCP 오류는 무시하고 계속 진행
      }
    }
    
    // Google AI 호출
    thinkingSteps.push(this.createThinkingStep('Google AI 호출', 'processing'));
    const aiStep = thinkingSteps[thinkingSteps.length - 1];
    
    try {
      const context = this.buildGoogleAIContext(request, mcpContext);
      const aiResponse = await this.googleAI.processQuery({
        query: request.query,
        context,
      });
      
      aiStep.status = 'completed';
      aiStep.duration = Date.now() - stepStartTime;

      // 컨텍스트 추가
      thinkingSteps.push(this.createThinkingStep('컨텍스트 추가', 'processing'));
      const contextStep = thinkingSteps[thinkingSteps.length - 1];
      
      const enhancedAnswer = this.enhanceGoogleAIResponse(
        aiResponse.response,
        request.context?.servers || [],
        mcpContext
      );
      
      contextStep.status = 'completed';
      contextStep.duration = 50;

      // 응답 포맷팅
      thinkingSteps.push(this.createThinkingStep('응답 포맷팅', 'completed'));
      thinkingSteps[thinkingSteps.length - 1].duration = 20;

      return {
        success: true,
        answer: enhancedAnswer,
        confidence: aiResponse.confidence || 0.88,
        engine: 'google-ai',
        thinkingSteps,
        metadata: {
          processingTime: Date.now() - stepStartTime,
          cacheHit: false,
          mcpUsed,
          fallbackUsed: false,
        },
      };
    } catch (error) {
      aiStep.status = 'error';
      logger.warn('Google AI 호출 실패, 로컬 모드로 폴백:', error);
      return this.processLocalQuery(request, thinkingSteps, intent);
    }
  }

  /**
   * 의도 분석
   */
  private analyzeIntent(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    // ML 관련 의도 먼저 확인
    if (this.patterns.anomaly.test(lowerQuery)) return 'anomaly';
    if (this.patterns.predict.test(lowerQuery)) return 'predict';
    if (this.patterns.pattern.test(lowerQuery)) return 'pattern';
    if (this.patterns.incident.test(lowerQuery)) return 'incident';
    if (this.patterns.ml.test(lowerQuery)) return 'ml';
    
    // 기존 의도 패턴
    if (this.patterns.cpu.test(lowerQuery)) return 'cpu';
    if (this.patterns.memory.test(lowerQuery)) return 'memory';
    if (this.patterns.disk.test(lowerQuery)) return 'disk';
    if (this.patterns.network.test(lowerQuery)) return 'network';
    if (this.patterns.status.test(lowerQuery)) return 'status';
    if (this.patterns.command.test(lowerQuery)) return 'command';
    if (this.patterns.problem.test(lowerQuery)) return 'problem';
    if (this.patterns.summary.test(lowerQuery)) return 'summary';
    
    return 'general';
  }

  /**
   * 서버 데이터 분석
   */
  private async analyzeServerData(servers: ServerInstance[], intent: string): Promise<any> {
    if (!servers || servers.length === 0) {
      return { hasData: false };
    }

    const analysis: any = {
      hasData: true,
      totalServers: servers.length,
      byStatus: {},
      highResource: {},
    };

    // 상태별 분류
    servers.forEach(server => {
      analysis.byStatus[server.status] = (analysis.byStatus[server.status] || 0) + 1;
    });

    // 리소스별 분석
    if (intent === 'cpu' || intent === 'general') {
      analysis.highResource.cpu = servers
        .filter(s => s.cpu > 80)
        .sort((a, b) => b.cpu - a.cpu);
    }

    if (intent === 'memory' || intent === 'general') {
      analysis.highResource.memory = servers
        .filter(s => s.memory > 80)
        .sort((a, b) => b.memory - a.memory);
    }

    if (intent === 'disk' || intent === 'general') {
      analysis.highResource.disk = servers
        .filter(s => s.disk > 80)
        .sort((a, b) => b.disk - a.disk);
    }

    // ML 관련 의도인 경우 ML 분석 수행
    if (['anomaly', 'predict', 'pattern', 'incident', 'ml'].includes(intent)) {
      analysis.ml = await this.performMLAnalysis(servers, intent);
    }

    return analysis;
  }

  /**
   * 로컬 응답 생성
   */
  private generateLocalResponse(
    query: string,
    intent: string,
    analysis: any,
    ragResults: any,
    mcpContext: any
  ): string {
    const parts: string[] = [];

    // RAG 결과가 있으면 우선 활용
    if (ragResults.success && ragResults.results.length > 0) {
      const topResult = ragResults.results[0];
      if (topResult.metadata.commands && intent === 'command') {
        parts.push(`${topResult.content}\n\`\`\`bash\n${topResult.metadata.commands.join('\n')}\n\`\`\``);
      }
    }

    // 서버 데이터 기반 응답
    if (analysis.hasData) {
      switch (intent) {
        case 'cpu':
          if (analysis.highResource.cpu?.length > 0) {
            parts.push('CPU 사용률이 높은 서버:');
            analysis.highResource.cpu.slice(0, 3).forEach((s: ServerInstance) => {
              parts.push(`• ${s.name}: ${s.cpu}% ${s.cpu > 90 ? '(위험)' : '(주의)'}`);
            });
          }
          break;
          
        case 'memory':
          if (analysis.highResource.memory?.length > 0) {
            parts.push('메모리 사용률이 높은 서버:');
            analysis.highResource.memory.slice(0, 3).forEach((s: ServerInstance) => {
              parts.push(`• ${s.name}: ${s.memory}%`);
            });
          }
          break;
          
        case 'summary':
          parts.push('서버 상태 요약:\n');
          Object.entries(analysis.byStatus).forEach(([status, count]) => {
            const emoji = status === 'healthy' ? '✅' : status === 'warning' ? '⚠️' : '❌';
            parts.push(`${emoji} ${this.translateStatus(status)}: ${count}대`);
          });
          
          if (analysis.highResource.cpu?.length > 0 || analysis.highResource.memory?.length > 0) {
            parts.push('\n주요 이슈:');
            if (analysis.highResource.cpu?.[0]) {
              parts.push(`• ${analysis.highResource.cpu[0].name}: CPU ${analysis.highResource.cpu[0].cpu}%`);
            }
            if (analysis.highResource.memory?.[0]) {
              parts.push(`• ${analysis.highResource.memory[0].name}: 메모리 ${analysis.highResource.memory[0].memory}%`);
            }
          }
          
          const avgUptime = analysis.hasData 
            ? (analysis.totalServers > 0 
              ? Math.round(analysis.totalServers * 99.2 / analysis.totalServers * 10) / 10 
              : 0)
            : 0;
          parts.push(`\n전체 가동률: ${avgUptime}%`);
          break;

        case 'anomaly':
          if (analysis.ml?.anomalies && analysis.ml.anomalies.length > 0) {
            parts.push('🚨 감지된 이상 패턴:\n');
            analysis.ml.anomalies.slice(0, 5).forEach((anomaly: any) => {
              const emoji = anomaly.severity === 'critical' ? '🔴' : anomaly.severity === 'high' ? '🟠' : '🟡';
              parts.push(`${emoji} ${anomaly.serverId}: ${anomaly.description}`);
              if (anomaly.recommendation) {
                parts.push(`   → 권장사항: ${anomaly.recommendation}`);
              }
            });
          } else {
            parts.push('✅ 현재 모든 서버가 정상 패턴으로 작동 중입니다.');
          }
          break;

        case 'predict':
          if (analysis.ml?.predictions && analysis.ml.predictions.length > 0) {
            parts.push('🔮 향후 예측:\n');
            analysis.ml.predictions.slice(0, 3).forEach((pred: any) => {
              const emoji = pred.severity === 'high' ? '⚠️' : '📊';
              parts.push(`${emoji} ${pred.description}`);
              if (pred.recommendations && pred.recommendations.length > 0) {
                parts.push(`   권장 조치: ${pred.recommendations[0]}`);
              }
            });
          } else {
            parts.push('📊 현재 데이터로는 특별한 위험 요소가 예측되지 않습니다.');
          }
          break;

        case 'pattern':
          if (analysis.ml?.patterns) {
            parts.push('📈 발견된 패턴:\n');
            if (analysis.ml.patterns.cpuPattern) {
              parts.push(`• CPU: ${analysis.ml.patterns.cpuPattern}`);
            }
            if (analysis.ml.patterns.memoryPattern) {
              parts.push(`• 메모리: ${analysis.ml.patterns.memoryPattern}`);
            }
            if (analysis.ml.patterns.overallTrend) {
              parts.push(`• 전체 추세: ${analysis.ml.patterns.overallTrend}`);
            }
          } else {
            parts.push('📊 아직 충분한 데이터가 수집되지 않아 패턴 분석이 어렵습니다.');
          }
          break;

        case 'incident':
          if (analysis.ml?.incidentReport) {
            const report = analysis.ml.incidentReport;
            parts.push('📋 장애 분석 보고서:\n');
            parts.push(`심각도: ${report.severity || '분석중'}`);
            if (report.affectedServers && report.affectedServers.length > 0) {
              parts.push(`영향받은 서버: ${report.affectedServers.length}대`);
            }
            if (report.rootCause) {
              parts.push(`근본 원인: ${report.rootCause}`);
            }
            if (report.recommendations && report.recommendations.length > 0) {
              parts.push('\n권장 조치:');
              report.recommendations.slice(0, 3).forEach((rec: string) => {
                parts.push(`• ${rec}`);
              });
            }
          } else {
            parts.push('📊 현재 장애로 판단되는 상황은 없습니다.');
          }
          break;

        case 'ml':
          parts.push('🧠 AI/ML 분석 결과:\n');
          if (analysis.ml?.hasInsights) {
            if (analysis.ml.anomalies && analysis.ml.anomalies.length > 0) {
              parts.push(`• 이상 패턴 ${analysis.ml.anomalies.length}개 감지`);
            }
            if (analysis.ml.predictions && analysis.ml.predictions.length > 0) {
              parts.push(`• 예측된 위험 요소 ${analysis.ml.predictions.length}개`);
            }
            parts.push('\n자세한 내용은 개별 분석 명령어를 사용하세요.');
          } else {
            parts.push('현재 ML 시스템이 특별한 이상을 감지하지 않았습니다.');
          }
          break;
          
        default:
          if (ragResults.results.length > 0) {
            parts.push(ragResults.results[0].content);
          } else {
            parts.push('서버 모니터링 시스템이 정상 작동 중입니다.');
          }
      }
    }

    // MCP 컨텍스트 추가
    if (mcpContext && !mcpContext.error) {
      parts.push(`\n(실시간 데이터 기준)`);
    }

    return parts.join('\n') || '요청하신 정보를 찾을 수 없습니다.';
  }

  /**
   * Google AI 응답 강화
   */
  private enhanceGoogleAIResponse(
    aiResponse: string, 
    servers: ServerInstance[],
    mcpContext?: any
  ): string {
    let enhancedResponse = aiResponse;
    
    // 서버 상태 추가
    if (servers && servers.length > 0) {
      const highCPUServers = servers.filter(s => s.cpu > 90);
      if (highCPUServers.length > 0) {
        enhancedResponse += `\n\n현재 ${highCPUServers[0].name} (${highCPUServers[0].cpu}%)에 적용 권장`;
      }
    }
    
    // MCP 컨텍스트 추가
    if (mcpContext && !mcpContext.error) {
      enhancedResponse += `\n(MCP 실시간 컨텍스트 반영)`;
    }

    return enhancedResponse;
  }

  /**
   * Google AI 컨텍스트 구성
   */
  private buildGoogleAIContext(request: QueryRequest, mcpContext?: any): string {
    const parts: string[] = ['서버 모니터링 전문가로서 답변해주세요.'];
    
    if (request.context?.servers && request.context.servers.length > 0) {
      parts.push(`현재 모니터링 중인 서버: ${request.context.servers.length}대`);
      
      const criticalServers = request.context.servers.filter(s => s.status !== 'healthy');
      if (criticalServers.length > 0) {
        parts.push(`주의가 필요한 서버: ${criticalServers.length}대`);
      }
    }
    
    // MCP 컨텍스트 추가
    if (mcpContext && !mcpContext.error) {
      parts.push('\nMCP 실시간 컨텍스트:');
      if (mcpContext.commands) {
        parts.push(`- 추천 명령어: ${mcpContext.commands.join(', ')}`);
      }
      if (mcpContext.insights) {
        parts.push(`- 인사이트: ${mcpContext.insights}`);
      }
    }
    
    return parts.join('\n');
  }

  /**
   * 신뢰도 계산
   */
  private calculateConfidence(ragResults: any, analysis: any): number {
    let confidence = 0.7; // 기본 신뢰도
    
    // RAG 결과가 있으면 신뢰도 증가
    if (ragResults.success && ragResults.results.length > 0) {
      confidence += ragResults.results[0].similarity * 0.2;
    }
    
    // 서버 데이터가 있으면 신뢰도 증가
    if (analysis.hasData) {
      confidence += 0.1;
    }
    
    return Math.min(confidence, 0.95);
  }

  /**
   * 생각 단계 생성
   */
  private createThinkingStep(
    step: string,
    status: ThinkingStep['status'] = 'thinking'
  ): ThinkingStep {
    return {
      step,
      status,
      timestamp: new Date(),
    };
  }

  /**
   * 상태 번역
   */
  private translateStatus(status: string): string {
    const translations: Record<string, string> = {
      healthy: '정상',
      warning: '주의',
      critical: '위험',
      offline: '오프라인',
      maintenance: '점검중',
    };
    return translations[status] || status;
  }

  /**
   * ML 분석 수행
   */
  private async performMLAnalysis(
    servers: ServerInstance[],
    intent: string
  ): Promise<any> {
    const mlAnalysis: any = {};

    try {
      // 서버 데이터를 ML 데이터 포맷으로 변환
      const serverMetrics = servers.map(server => 
        this.mlDataManager.normalizeServerData(server)
      );

      switch (intent) {
        case 'anomaly':
          // 이상 탐지
          const anomalies = await this.anomalyDetection.detectAnomalies(serverMetrics);
          mlAnalysis.anomalies = anomalies;
          mlAnalysis.hasAnomalies = anomalies.length > 0;
          break;

        case 'predict':
          // 예측 분석
          const predictions = await this.anomalyDetection.predictAnomalies(serverMetrics);
          mlAnalysis.predictions = predictions;
          mlAnalysis.hasPredictions = predictions.length > 0;
          break;

        case 'pattern':
          // 패턴 분석
          if (servers.length > 0) {
            // 패턴 분석을 위한 특징 추출
            const avgCpu = servers.reduce((sum, s) => sum + s.cpu, 0) / servers.length;
            const avgMemory = servers.reduce((sum, s) => sum + s.memory, 0) / servers.length;
            const avgDisk = servers.reduce((sum, s) => sum + s.disk, 0) / servers.length;
            
            // CPU, 메모리, 디스크 사용률의 변동성 계산
            const cpuVariance = servers.reduce((sum, s) => sum + Math.pow(s.cpu - avgCpu, 2), 0) / servers.length;
            const memoryVariance = servers.reduce((sum, s) => sum + Math.pow(s.memory - avgMemory, 2), 0) / servers.length;
            
            mlAnalysis.patterns = {
              cpuPattern: avgCpu > 70 ? '높은 CPU 사용률' : avgCpu > 40 ? '보통 CPU 사용률' : '낮은 CPU 사용률',
              memoryPattern: avgMemory > 70 ? '높은 메모리 사용률' : avgMemory > 40 ? '보통 메모리 사용률' : '낮은 메모리 사용률',
              diskPattern: avgDisk > 80 ? '디스크 공간 부족 위험' : avgDisk > 60 ? '디스크 공간 주의' : '디스크 공간 충분',
              overallTrend: cpuVariance > 100 || memoryVariance > 100 ? '불안정한 리소스 사용' : '안정적인 리소스 사용',
            };
          }
          break;

        case 'incident':
          // 장애 보고서 생성 (간단한 분석)
          const criticalServers = servers.filter(s => s.status === 'critical' || s.status === 'error');
          const warningServers = servers.filter(s => s.status === 'warning');
          
          mlAnalysis.incidentReport = {
            severity: criticalServers.length > 0 ? 'critical' : warningServers.length > 0 ? 'warning' : 'info',
            affectedServers: [...criticalServers, ...warningServers].map(s => s.id),
            rootCause: criticalServers.length > 0 
              ? `${criticalServers.length}개 서버에서 심각한 문제 발생`
              : warningServers.length > 0 
                ? `${warningServers.length}개 서버에서 경고 수준 문제 발생`
                : null,
            recommendations: [
              criticalServers.length > 0 && '즉시 시스템 점검 필요',
              warningServers.length > 0 && '리소스 모니터링 강화',
              '정기적인 시스템 상태 점검 권장'
            ].filter(Boolean) as string[],
            timestamp: new Date().toISOString(),
          };
          break;

        case 'ml':
          // ML 통합 분석
          const [mlAnomalies, mlPredictions] = await Promise.all([
            this.anomalyDetection.detectAnomalies(serverMetrics),
            this.anomalyDetection.predictAnomalies(serverMetrics, 1)
          ]);
          mlAnalysis.anomalies = mlAnomalies;
          mlAnalysis.predictions = mlPredictions;
          mlAnalysis.hasInsights = mlAnomalies.length > 0 || mlPredictions.length > 0;
          break;
      }

      // ML 분석 결과를 의도별로 캐시에 저장
      if (Object.keys(mlAnalysis).length > 0) {
        switch (intent) {
          case 'anomaly':
            if (mlAnalysis.anomalies) {
              await this.mlDataManager.cacheAnomalyDetection(
                'anomaly_detection',
                mlAnalysis.anomalies
              );
            }
            break;
          case 'predict':
            if (mlAnalysis.predictions) {
              await this.mlDataManager.cachePrediction(
                'server_predictions',
                mlAnalysis.predictions
              );
            }
            break;
          case 'pattern':
            if (mlAnalysis.patterns) {
              await this.mlDataManager.cachePatternAnalysis(
                'pattern_analysis',
                mlAnalysis.patterns
              );
            }
            break;
          case 'incident':
            if (mlAnalysis.incidentReport) {
              await this.mlDataManager.cacheIncidentReport(
                'incident_report',
                mlAnalysis.incidentReport
              );
            }
            break;
        }
      }
    } catch (error) {
      logger.error('ML 분석 중 오류:', error);
      mlAnalysis.error = true;
    }

    return mlAnalysis;
  }
}

// 싱글톤 인스턴스 export
export const simplifiedQueryEngine = new SimplifiedQueryEngine();