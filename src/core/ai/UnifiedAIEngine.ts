/**
 * 🧠 통합 AI 엔진 - 경연대회용 최적화
 * 
 * 모든 AI 기능을 하나로 통합:
 * - MCP 라우팅
 * - Intent 분류  
 * - Python ML 연동
 * - JavaScript AI 엔진들
 * - 결과 병합 및 최적화
 */

import { MCPAIRouter, MCPContext, MCPResponse } from '@/services/ai/MCPAIRouter';
import { IntentClassifier } from '@/services/ai/IntentClassifier';
import { TaskOrchestrator } from '@/services/ai/TaskOrchestrator';
import { ResponseMerger } from '@/services/ai/ResponseMerger';
import { SessionManager } from '@/services/ai/SessionManager';

export interface UnifiedAnalysisRequest {
  query: string;
  context?: {
    serverMetrics?: ServerMetrics[];
    logEntries?: LogEntry[];
    timeRange?: { start: Date; end: Date };
    sessionId?: string;
    urgency?: 'low' | 'medium' | 'high' | 'critical';
  };
  options?: {
    enablePython?: boolean;
    enableJavaScript?: boolean;
    maxResponseTime?: number;
    confidenceThreshold?: number;
  };
}

export interface UnifiedAnalysisResponse {
  success: boolean;
  query: string;
  intent: {
    primary: string;
    confidence: number;
    category: string;
    urgency: string;
  };
  analysis: {
    summary: string;
    details: any[];
    confidence: number;
    processingTime: number;
  };
  recommendations: string[];
  engines: {
    used: string[];
    results: any[];
    fallbacks: number;
  };
  metadata: {
    sessionId: string;
    timestamp: string;
    version: string;
  };
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

export class UnifiedAIEngine {
  private static instance: UnifiedAIEngine | null = null;
  private mcpRouter: MCPAIRouter;
  private intentClassifier: IntentClassifier;
  private taskOrchestrator: TaskOrchestrator;
  private responseMerger: ResponseMerger;
  private sessionManager: SessionManager;
  private initialized: boolean = false;

  private constructor() {
    // 싱글톤 패턴
    this.mcpRouter = new MCPAIRouter();
    this.intentClassifier = new IntentClassifier();
    this.taskOrchestrator = new TaskOrchestrator();
    this.responseMerger = new ResponseMerger();
    this.sessionManager = new SessionManager();
  }

  /**
   * 🎯 싱글톤 인스턴스 가져오기
   */
  public static getInstance(): UnifiedAIEngine {
    if (!UnifiedAIEngine.instance) {
      UnifiedAIEngine.instance = new UnifiedAIEngine();
    }
    return UnifiedAIEngine.instance;
  }

  /**
   * 🚀 초기화
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('🧠 UnifiedAIEngine 초기화 시작...');
    
    try {
      // 모든 서비스 초기화
      await Promise.all([
        this.initializeCore(),
        this.warmupEngines()
      ]);
      
      this.initialized = true;
      console.log('✅ UnifiedAIEngine 초기화 완료!');
    } catch (error) {
      console.error('❌ UnifiedAIEngine 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 🎯 단일 진입점 - 쿼리 처리
   */
  public async processQuery(request: UnifiedAnalysisRequest): Promise<UnifiedAnalysisResponse> {
    const startTime = Date.now();
    
    try {
      // 1. 초기화 확인
      if (!this.initialized) {
        await this.initialize();
      }

      // 2. 세션 생성/관리
      const sessionId = request.context?.sessionId || this.generateSessionId();

      // 3. Intent 분류 (개선된 로직)
      const intent = await this.classifyIntentEnhanced(request.query, request.context);
      
      // 4. 컨텍스트 구성
      const mcpContext: MCPContext = {
        userQuery: request.query,
        serverMetrics: request.context?.serverMetrics || [],
        logEntries: request.context?.logEntries || [],
        timeRange: request.context?.timeRange || {
          start: new Date(Date.now() - 24 * 60 * 60 * 1000),
          end: new Date()
        },
        sessionId
      };

      // 5. 실제 분석 수행 (개선된 로직)
      const analysisResult = await this.performEnhancedAnalysis(intent, mcpContext, request.options);

      // 6. 응답 구성
      const response: UnifiedAnalysisResponse = {
        success: true,
        query: request.query,
        intent: {
          primary: intent.primary,
          confidence: intent.confidence,
          category: this.categorizeIntent(intent.primary),
          urgency: intent.urgency
        },
        analysis: {
          summary: analysisResult.summary,
          details: analysisResult.results,
          confidence: analysisResult.confidence,
          processingTime: Date.now() - startTime
        },
        recommendations: analysisResult.recommendations,
        engines: {
          used: analysisResult.enginesUsed,
          results: analysisResult.results,
          fallbacks: analysisResult.metadata?.fallbacksUsed || 0
        },
        metadata: {
          sessionId,
          timestamp: new Date().toISOString(),
          version: '2.0.0'
        }
      };

      // 7. 세션 업데이트
      await this.sessionManager.updateSession(sessionId, {
        query: request.query,
        intent: intent,
        results: analysisResult.results,
        response: response
      });

      console.log('🎯 UnifiedAIEngine 분석 완료:', {
        sessionId,
        success: true,
        intent: intent.primary,
        confidence: analysisResult.confidence,
        enginesUsed: analysisResult.enginesUsed,
        processingTime: Date.now() - startTime
      });

      return response;

    } catch (error: any) {
      console.error('❌ UnifiedAIEngine 분석 실패:', error);
      
      return {
        success: false,
        query: request.query,
        intent: {
          primary: 'error',
          confidence: 0,
          category: 'system',
          urgency: 'medium'
        },
        analysis: {
          summary: `분석 중 오류가 발생했습니다: ${error.message}`,
          details: [],
          confidence: 0,
          processingTime: Date.now() - startTime
        },
        recommendations: [
          '시스템 관리자에게 문의하세요',
          '잠시 후 다시 시도해보세요'
        ],
        engines: {
          used: [],
          results: [],
          fallbacks: 0
        },
        metadata: {
          sessionId: request.context?.sessionId || 'error_session',
          timestamp: new Date().toISOString(),
          version: '2.0.0'
        }
      };
    }
  }

  /**
   * 🔍 개선된 Intent 분류
   */
  private async classifyIntentEnhanced(query: string, context?: any): Promise<any> {
    try {
      // 기존 분류기 사용하되 결과 개선
      const baseIntent = await this.intentClassifier.classify(query);
      
      // 컨텍스트 기반 개선
      if (context?.serverMetrics && context.serverMetrics.length > 0) {
        baseIntent.needsTimeSeries = true;
        baseIntent.needsAnomalyDetection = true;
      }

      // 키워드 기반 보완
      const queryLower = query.toLowerCase();
      if (queryLower.includes('예측') || queryLower.includes('predict')) {
        baseIntent.needsTimeSeries = true;
        baseIntent.needsComplexML = true;
      }
      
      if (queryLower.includes('이상') || queryLower.includes('문제') || queryLower.includes('오류')) {
        baseIntent.needsAnomalyDetection = true;
        baseIntent.urgency = 'high';
      }

      return baseIntent;
    } catch (error) {
      console.warn('⚠️ Intent 분류 실패, 기본값 사용:', error);
      return this.createFallbackIntent(query);
    }
  }

  /**
   * 🔧 개선된 분석 수행
   */
  private async performEnhancedAnalysis(intent: any, context: MCPContext, options?: any): Promise<MCPResponse> {
    try {
      // MCP 라우터 사용하되 결과 검증
      const result = await this.mcpRouter.processQuery(context.userQuery || '', context);
      
      // 결과가 실패하면 직접 분석 수행
      if (!result.success || result.confidence === 0) {
        console.log('🔄 MCP 실패, 직접 분석 수행');
        return await this.performDirectAnalysis(intent, context);
      }

      return result;
    } catch (error) {
      console.warn('⚠️ MCP 분석 실패, 직접 분석으로 대체:', error);
      return await this.performDirectAnalysis(intent, context);
    }
  }

  /**
   * 🛠️ 직접 분석 수행 (Fallback)
   */
  private async performDirectAnalysis(intent: any, context: MCPContext): Promise<MCPResponse> {
    const startTime = Date.now();
    const results: any[] = [];
    const enginesUsed: string[] = [];

    try {
      // 1. 기본 통계 분석
      if (context.serverMetrics && context.serverMetrics.length > 0) {
        const statsResult = this.performBasicStatistics(context.serverMetrics);
        results.push({
          type: 'statistics',
          data: statsResult,
          engine: 'javascript_stats'
        });
        enginesUsed.push('javascript_stats');
      }

      // 2. 텍스트 분석
      if (context.userQuery) {
        const textResult = this.performBasicTextAnalysis(context.userQuery);
        results.push({
          type: 'text_analysis',
          data: textResult,
          engine: 'javascript_nlp'
        });
        enginesUsed.push('javascript_nlp');
      }

      // 3. Python 서비스 시도 (선택적)
      try {
        const pythonResult = await this.tryPythonAnalysis(context);
        if (pythonResult) {
          results.push({
            type: 'python_analysis',
            data: pythonResult,
            engine: 'python_service'
          });
          enginesUsed.push('python_service');
        }
      } catch (pythonError) {
        console.warn('⚠️ Python 분석 스킵:', pythonError);
      }

      // 4. 결과 생성
      const summary = this.generateAnalysisSummary(results, context);
      const recommendations = this.generateRecommendations(results, intent);

      return {
        success: true,
        results,
        summary,
        confidence: results.length > 0 ? 0.8 : 0.3,
        processingTime: Date.now() - startTime,
        enginesUsed,
        recommendations,
        metadata: {
          tasksExecuted: results.length,
          successRate: 1.0,
          fallbacksUsed: 1,
          pythonWarmupTriggered: false
        }
      };

    } catch (error) {
      console.error('❌ 직접 분석 실패:', error);
      return {
        success: false,
        results: [],
        summary: '분석 수행 중 오류가 발생했습니다.',
        confidence: 0,
        processingTime: Date.now() - startTime,
        enginesUsed: [],
        recommendations: ['시스템 점검이 필요합니다'],
        metadata: {
          tasksExecuted: 0,
          successRate: 0,
          fallbacksUsed: 1,
          pythonWarmupTriggered: false
        }
      };
    }
  }

  // 헬퍼 메서드들...
  private async initializeCore(): Promise<void> {
    // 핵심 서비스 초기화
  }

  private async warmupEngines(): Promise<void> {
    // AI 엔진들 워밍업
  }

  private generateSessionId(): string {
    return `unified_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private categorizeIntent(primary: string): string {
    if (primary.includes('performance') || primary.includes('cpu') || primary.includes('memory')) {
      return 'performance';
    }
    if (primary.includes('error') || primary.includes('log')) {
      return 'troubleshooting';
    }
    if (primary.includes('predict') || primary.includes('forecast')) {
      return 'prediction';
    }
    return 'general';
  }

  private createFallbackIntent(query: string): any {
    return {
      primary: 'general_inquiry',
      confidence: 0.5,
      needsTimeSeries: false,
      needsNLP: true,
      needsAnomalyDetection: false,
      needsComplexML: false,
      entities: [],
      urgency: 'medium'
    };
  }

  private performBasicStatistics(metrics: ServerMetrics[]): any {
    const latest = metrics[metrics.length - 1];
    const average = {
      cpu: metrics.reduce((sum, m) => sum + m.cpu, 0) / metrics.length,
      memory: metrics.reduce((sum, m) => sum + m.memory, 0) / metrics.length,
      disk: metrics.reduce((sum, m) => sum + m.disk, 0) / metrics.length
    };

    return {
      current: latest,
      average,
      trend: this.calculateTrend(metrics.map(m => m.cpu)),
      analysis: this.analyzeResourceUsage(latest, average)
    };
  }

  private performBasicTextAnalysis(text: string): any {
    const words = text.toLowerCase().split(/\s+/);
    const keywords = words.filter(word => 
      ['서버', '성능', 'cpu', '메모리', '디스크', '네트워크', '오류', '문제'].includes(word)
    );

    return {
      wordCount: words.length,
      keywords,
      sentiment: this.analyzeSentiment(text),
      category: this.categorizeQuery(text)
    };
  }

  private async tryPythonAnalysis(context: MCPContext): Promise<any> {
    const pythonUrl = process.env.AI_ENGINE_URL || 'https://openmanager-vibe-v5.onrender.com';
    
    const response = await fetch(`${pythonUrl}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: context.userQuery,
        metrics: context.serverMetrics,
        analysis_type: 'comprehensive'
      })
    });

    if (response.ok) {
      return await response.json();
    }
    
    throw new Error(`Python 서비스 오류: ${response.status}`);
  }

  private generateAnalysisSummary(results: any[], context: MCPContext): string {
    if (results.length === 0) {
      return '분석할 데이터가 부족합니다.';
    }

    const statsResult = results.find(r => r.type === 'statistics');
    if (statsResult && statsResult.data.current) {
      const { cpu, memory, disk } = statsResult.data.current;
      return `현재 시스템 상태: CPU ${cpu}%, 메모리 ${memory}%, 디스크 ${disk}% 사용 중입니다. ${this.getStatusMessage(cpu, memory, disk)}`;
    }

    return '시스템 분석이 완료되었습니다.';
  }

  private generateRecommendations(results: any[], intent: any): string[] {
    const recommendations: string[] = [];
    
    const statsResult = results.find(r => r.type === 'statistics');
    if (statsResult && statsResult.data.current) {
      const { cpu, memory, disk } = statsResult.data.current;
      
      if (cpu > 80) recommendations.push('CPU 사용률이 높습니다. 프로세스 최적화를 검토하세요.');
      if (memory > 85) recommendations.push('메모리 사용률이 높습니다. 메모리 정리가 필요합니다.');
      if (disk > 90) recommendations.push('디스크 공간이 부족합니다. 불필요한 파일을 정리하세요.');
    }

    if (recommendations.length === 0) {
      recommendations.push('현재 시스템 상태는 안정적입니다.');
      recommendations.push('정기적인 모니터링을 지속하세요.');
    }

    return recommendations;
  }

  // 기타 유틸리티 메서드들...
  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    const recent = values.slice(-Math.min(5, values.length));
    const first = recent[0];
    const last = recent[recent.length - 1];
    return ((last - first) / first) * 100;
  }

  private analyzeResourceUsage(current: any, average: any): string {
    const cpuStatus = current.cpu > average.cpu * 1.2 ? 'high' : current.cpu < average.cpu * 0.8 ? 'low' : 'normal';
    const memStatus = current.memory > average.memory * 1.2 ? 'high' : current.memory < average.memory * 0.8 ? 'low' : 'normal';
    
    return `CPU: ${cpuStatus}, Memory: ${memStatus}`;
  }

  private analyzeSentiment(text: string): string {
    const positiveWords = ['좋', '정상', '안정', '최적'];
    const negativeWords = ['문제', '오류', '느림', '높', '부족'];
    
    const words = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => words.includes(word)).length;
    const negativeCount = negativeWords.filter(word => words.includes(word)).length;
    
    if (negativeCount > positiveCount) return 'negative';
    if (positiveCount > negativeCount) return 'positive';
    return 'neutral';
  }

  private categorizeQuery(text: string): string {
    const text_lower = text.toLowerCase();
    if (text_lower.includes('cpu') || text_lower.includes('프로세서')) return 'cpu_analysis';
    if (text_lower.includes('메모리') || text_lower.includes('memory')) return 'memory_analysis';
    if (text_lower.includes('디스크') || text_lower.includes('disk')) return 'disk_analysis';
    if (text_lower.includes('네트워크') || text_lower.includes('network')) return 'network_analysis';
    return 'general_inquiry';
  }

  private getStatusMessage(cpu: number, memory: number, disk: number): string {
    const issues = [];
    if (cpu > 80) issues.push('CPU 부하 높음');
    if (memory > 85) issues.push('메모리 부족');
    if (disk > 90) issues.push('디스크 공간 부족');
    
    if (issues.length === 0) return '모든 리소스가 정상 범위입니다.';
    return `주의사항: ${issues.join(', ')}`;
  }

  /**
   * 🔧 시스템 상태 확인
   */
  public async getSystemStatus(): Promise<any> {
    return {
      initialized: this.initialized,
      engines: {
        mcpRouter: !!this.mcpRouter,
        intentClassifier: !!this.intentClassifier,
        taskOrchestrator: !!this.taskOrchestrator,
        responseMerger: !!this.responseMerger,
        sessionManager: !!this.sessionManager
      },
      version: '2.0.0',
      timestamp: new Date().toISOString()
    };
  }
}

// Export singleton instance
export const unifiedAIEngine = UnifiedAIEngine.getInstance(); 