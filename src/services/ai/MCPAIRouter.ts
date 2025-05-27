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
}

export interface MCPResponse {
  success: boolean;
  results: MCPTaskResult[];
  summary: string;
  confidence: number;
  processingTime: number;
  enginesUsed: string[];
  recommendations: string[];
  metadata: {
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
  private intentClassifier: IntentClassifier;
  private taskOrchestrator: TaskOrchestrator;
  private responseMerger: ResponseMerger;
  private sessionManager: SessionManager;
  
  constructor() {
    this.intentClassifier = new IntentClassifier();
    this.taskOrchestrator = new TaskOrchestrator();
    this.responseMerger = new ResponseMerger();
    this.sessionManager = new SessionManager();
  }

  /**
   * 🎯 메인 처리 흐름
   */
  async processQuery(query: string, context: MCPContext): Promise<MCPResponse> {
    const startTime = Date.now();
    const sessionId = context.sessionId || this.generateSessionId();
    
    try {
      // 1. 세션 관리 및 컨텍스트 개선
      const enrichedContext = await this.sessionManager.enrichContext(sessionId, context);
      
      // 2. 의도 분석 및 작업 분해
      const intent = await this.intentClassifier.classify(query);
      const tasks = await this.decomposeTasks(intent, enrichedContext);
      
      // 3. 작업 우선순위 정렬
      const prioritizedTasks = this.prioritizeTasks(tasks, intent.urgency);
      
      // 4. 병렬 처리 (JavaScript + Python)
      const results = await this.taskOrchestrator.executeParallel(prioritizedTasks);
      
      // 5. 결과 통합 및 응답 생성
      const response = await this.responseMerger.mergeResults(results, intent, enrichedContext);
      
      // 6. 세션 업데이트
      await this.sessionManager.updateSession(sessionId, { query, intent, results, response });
      
      return {
        ...response,
        processingTime: Date.now() - startTime,
        metadata: {
          tasksExecuted: results.length,
          successRate: results.filter(r => r.success).length / results.length,
          fallbacksUsed: results.filter(r => r.warning?.includes('fallback')).length
        }
      };
      
    } catch (error) {
      console.error('MCP Router 처리 오류:', error);
      return this.createErrorResponse(error, Date.now() - startTime);
    }
  }

  /**
   * 🔧 의도 기반 작업 분해
   */
  private async decomposeTasks(intent: Intent, context: MCPContext): Promise<MCPTask[]> {
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
          features: ['cpu', 'memory', 'disk', 'networkIn', 'networkOut']
        },
        context,
        timeout: 15000
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
          analysisType: this.getNLPAnalysisType(intent)
        },
        context,
        timeout: 10000
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
          lookbackHours: 24
        },
        context,
        timeout: 8000
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
          analysisType: 'advanced_pattern_detection'
        },
        context,
        timeout: 20000
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
        if (a.type === 'anomaly' || a.type === 'timeseries') a.priority = 'high';
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
  private createErrorResponse(error: any, processingTime: number): MCPResponse {
    return {
      success: false,
      results: [],
      summary: `AI 처리 중 오류가 발생했습니다: ${error.message}`,
      confidence: 0,
      processingTime,
      enginesUsed: [],
      recommendations: ['시스템 관리자에게 문의하세요', '잠시 후 다시 시도해보세요'],
      metadata: {
        tasksExecuted: 0,
        successRate: 0,
        fallbacksUsed: 0
      }
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
      case 'critical': return 0.8;
      case 'high': return 0.85;
      case 'medium': return 0.9;
      default: return 0.95;
    }
  }

  /**
   * 🔧 엔진 상태 확인
   */
  async getEngineStatus(): Promise<any> {
    return {
      tensorflow: await this.taskOrchestrator.checkTensorFlowStatus(),
      transformers: await this.taskOrchestrator.checkTransformersStatus(),
      onnx: await this.taskOrchestrator.checkONNXStatus(),
      python: await this.taskOrchestrator.checkPythonStatus(),
      allReady: true
    };
  }
}

// Import 선언들
import { IntentClassifier } from './IntentClassifier';
import { TaskOrchestrator } from './TaskOrchestrator';
import { ResponseMerger } from './ResponseMerger';
import { SessionManager } from './SessionManager'; 