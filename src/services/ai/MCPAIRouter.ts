// MCP (Model Context Protocol) 기반 AI 라우터
export interface MCPTask {
  id: string;
  type: 'timeseries' | 'nlp' | 'anomaly' | 'complex_ml';
  priority: 'high' | 'medium' | 'low';
  data: any;
  context: MCPContext;
  timeout?: number;
}

export interface MCPContext {
  serverMetrics?: ServerMetrics[];
  logEntries?: LogEntry[];
  timeRange?: { start: Date; end: Date };
  userQuery?: string;
  previousResults?: any[];
  sessionId?: string;
  aiContexts?: any[]; // AI 컨텍스트 검색 결과
}

export interface MCPResponse {
  success: boolean;
  content: string;
  confidence: number;
  sources: string[];
  metadata?: {
    tier?: string;
    engine?: string;
    [key: string]: any;
  };
  error?: string;
  warning?: string;
}

export interface MCPRouterResponse {
  success: boolean;
  data?: any;
  error?: string;
  source: 'mcp' | 'python' | 'fallback';
  responseTime: number;
  processingTime?: number;
  results?: MCPTaskResult[];
  summary?: string;
  confidence?: number;
  enginesUsed?: string[];
  recommendations?: string[];
  metadata?: {
    tasksExecuted: number;
    successRate: number;
    fallbacksUsed: number;
  };
}

export interface MCPTaskResult {
  taskId: string;
  type: string;
  success: boolean;
  result?: any;
  error?: string;
  executionTime: number;
  engine: string;
  confidence?: number;
  warning?: string;
}

export interface Intent {
  primary: string;
  confidence: number;
  needsTimeSeries: boolean;
  needsNLP: boolean;
  needsAnomalyDetection: boolean;
  needsComplexML: boolean;
  entities: string[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

export interface ServerMetrics {
  timestamp: string;
  cpu: number;
  memory: number;
  disk: number;
  networkIn: number;
  networkOut: number;
  responseTime?: number;
  activeConnections?: number;
}

export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
  source: string;
  details?: any;
}

export class MCPAIRouter {
  private intentClassifier: any; // UnifiedIntentClassifier 또는 fallback
  private taskOrchestrator: TaskOrchestrator;
  private responseMerger: ResponseMerger;
  private sessionManager: SessionManager;

  constructor() {
    this.initializeIntentClassifier();
    this.taskOrchestrator = new TaskOrchestrator();
    this.responseMerger = new ResponseMerger();
    this.sessionManager = new SessionManager();

    console.log('🔧 MCP AI Router 초기화 (Google Cloud VM 24시간 동작)');
  }

  /**
   * 🎯 통합 Intent Classifier 초기화 (Jules 분석 기반)
   */
  private async initializeIntentClassifier(): Promise<void> {
    try {
      // 기존 IntentClassifier 사용
      const { IntentClassifier } = await import(
        '@/modules/ai-agent/processors/IntentClassifier'
      );
      this.intentClassifier = new IntentClassifier();
      console.log('🎯 Intent Classifier 로드 완료');
    } catch (error) {
      console.warn('⚠️ IntentClassifier 로드 실패:', error);
      // 기본 fallback
      this.intentClassifier = {
        classify: async (query: string) => ({
          primary: 'general_inquiry',
          confidence: 0.5,
          needsTimeSeries: false,
          needsNLP: false,
          needsAnomalyDetection: false,
          needsComplexML: false,
          entities: [],
          urgency: 'medium',
        }),
      };
    }
  }

  /**
   * 🎯 메인 처리 흐름
   */
  async processQuery(query: string, context: MCPContext): Promise<MCPRouterResponse> {
    const startTime = Date.now();
    const sessionId = context.sessionId || this.generateSessionId();

    try {
      // 1. 세션 관리 및 컨텍스트 개선
      const enrichedContext = await this.sessionManager.enrichContext(
        sessionId,
        context
      );

      // 2. 의도 분석 및 작업 분해 (통합 분류기 사용)
      const intent = await this.classifyIntent(query);
      const tasks = await this.decomposeTasks(intent, enrichedContext);

      // 3. 작업 우선순위 정렬
      const prioritizedTasks = this.prioritizeTasks(tasks, intent.urgency);

      // 4. 병렬 처리 (JavaScript + Google Cloud VM MCP)
      const results =
        await this.taskOrchestrator.executeParallel(prioritizedTasks);

      // 5. 결과 통합 및 응답 생성
      const response = await this.responseMerger.mergeResults(
        results,
        intent,
        enrichedContext
      );

      // 6. 세션 업데이트
      await this.sessionManager.updateSession(sessionId, {
        query,
        intent,
        results,
        response,
      });

      return {
        success: true,
        source: 'mcp' as const,
        responseTime: Date.now() - startTime,
        results: results,
        summary: (response as any)?.summary || '작업이 완료되었습니다.',
        confidence: (response as any)?.confidence || 0.8,
        processingTime: Date.now() - startTime,
        enginesUsed: (response as any)?.enginesUsed || ['mcp'],
        recommendations: (response as any)?.recommendations || [],
        metadata: {
          tasksExecuted: results.length,
          successRate: results.filter(r => r.success).length / results.length,
          fallbacksUsed: results.filter(r => r.warning?.includes('fallback'))
            .length,
        },
      };
    } catch (error) {
      console.error('MCP Router 처리 오류:', error);
      return this.createErrorResponse(error, Date.now() - startTime);
    }
  }

  /**
   * 🎯 통합 의도 분류 (새로운 분류기 호환)
   */
  private async classifyIntent(query: string): Promise<Intent> {
    try {
      const result = await this.intentClassifier.classify(query);

      // UnifiedIntentClassifier 결과를 기존 Intent 타입으로 변환
      if (result.intent && result.confidence !== undefined) {
        return {
          primary: result.intent,
          confidence: result.confidence,
          needsTimeSeries: result.needsTimeSeries || false,
          needsNLP: result.needsNLP || false,
          needsAnomalyDetection: result.needsAnomalyDetection || false,
          needsComplexML: result.needsComplexML || false,
          entities: result.entities || [],
          urgency: result.urgency || 'medium',
        };
      }

      // 기존 IntentClassifier 결과는 그대로 반환
      return result;
    } catch (error) {
      console.warn('⚠️ 의도 분류 실패, 기본값 사용:', error);
      return {
        primary: 'general_inquiry',
        confidence: 0.5,
        needsTimeSeries: false,
        needsNLP: false,
        needsAnomalyDetection: false,
        needsComplexML: false,
        entities: [],
        urgency: 'medium',
      };
    }
  }

  /**
   * 🔧 의도 기반 작업 분해
   */
  private async decomposeTasks(
    intent: Intent,
    context: MCPContext
  ): Promise<MCPTask[]> {
    const tasks: MCPTask[] = [];
    const baseId = Date.now();

    // 🔥 시계열 예측 작업 (TensorFlow.js)
    if (intent.needsTimeSeries && context.serverMetrics) {
      tasks.push({
        id: `timeseries_${baseId}`,
        type: 'timeseries',
        priority: intent.urgency === 'critical' ? 'high' : 'medium',
        data: {
          metrics: context.serverMetrics,
          predictionHours: this.getPredictionHours(intent),
          features: ['cpu', 'memory', 'disk', 'networkIn', 'networkOut'],
        },
        context,
        timeout: 15000,
      });
    }

    // 📝 텍스트 분석 작업 (Transformers.js)
    if (intent.needsNLP) {
      tasks.push({
        id: `nlp_${baseId + 1}`,
        type: 'nlp',
        priority: 'medium',
        data: {
          text: context.userQuery,
          logs: context.logEntries,
          analysisType: this.getNLPAnalysisType(intent),
        },
        context,
        timeout: 10000,
      });
    }

    // ⚡ 이상 탐지 작업 (ONNX.js)
    if (intent.needsAnomalyDetection && context.serverMetrics) {
      tasks.push({
        id: `anomaly_${baseId + 2}`,
        type: 'anomaly',
        priority: intent.urgency === 'critical' ? 'high' : 'medium',
        data: {
          metrics: context.serverMetrics,
          sensitivity: this.getAnomalySensitivity(intent),
          lookbackHours: 24,
        },
        context,
        timeout: 8000,
      });
    }

    // 🐍 복잡한 ML 작업 (External Python)
    if (intent.needsComplexML) {
      tasks.push({
        id: `complex_ml_${baseId + 3}`,
        type: 'complex_ml',
        priority: 'low', // 외부 서비스라 우선순위 낮음
        data: {
          query: context.userQuery,
          metrics: context.serverMetrics,
          logs: context.logEntries,
          analysisType: 'advanced_pattern_detection',
        },
        context,
        timeout: 20000,
      });
    }

    return tasks;
  }

  /**
   * 📊 작업 우선순위 정렬
   */
  private prioritizeTasks(tasks: MCPTask[], urgency: string): MCPTask[] {
    const priorityOrder = { high: 3, medium: 2, low: 1 };

    return tasks.sort((a, b) => {
      // 긴급도가 높으면 우선순위 조정
      if (urgency === 'critical') {
        if (a.type === 'anomaly' || a.type === 'timeseries')
          a.priority = 'high';
      }

      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * 🆔 세션 ID 생성
   */
  private generateSessionId(): string {
    return `mcp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * ❌ 오류 응답 생성
   */
  private createErrorResponse(error: any, processingTime: number): MCPRouterResponse {
    return {
      success: false,
      source: 'fallback',
      responseTime: processingTime,
      error: `AI 처리 중 오류가 발생했습니다: ${error.message}`,
      results: [],
      summary: `AI 처리 중 오류가 발생했습니다: ${error.message}`,
      confidence: 0,
      processingTime,
      enginesUsed: [],
      recommendations: [
        '시스템 관리자에게 문의하세요',
        '잠시 후 다시 시도해보세요',
      ],
      metadata: {
        tasksExecuted: 0,
        successRate: 0,
        fallbacksUsed: 0,
      },
    };
  }

  /**
   * 📈 예측 시간 결정
   */
  private getPredictionHours(intent: Intent): number {
    if (intent.urgency === 'critical') return 1;
    if (intent.urgency === 'high') return 6;
    return 24;
  }

  /**
   * 🔍 NLP 분석 타입 결정
   */
  private getNLPAnalysisType(intent: Intent): string {
    const primary = intent.primary.toLowerCase();
    if (primary.includes('log')) return 'log_analysis';
    if (primary.includes('error')) return 'error_classification';
    if (primary.includes('performance')) return 'performance_analysis';
    return 'general_analysis';
  }

  /**
   * 🎯 이상 탐지 민감도 설정
   */
  private getAnomalySensitivity(intent: Intent): number {
    switch (intent.urgency) {
      case 'critical':
        return 0.8;
      case 'high':
        return 0.85;
      case 'medium':
        return 0.9;
      default:
        return 0.95;
    }
  }
}

// Import 선언들
import { ResponseMerger } from './ResponseMerger';
import { SessionManager } from './SessionManager';
import { TaskOrchestrator } from './TaskOrchestrator';

