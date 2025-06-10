/**
 * 🧠 실제 동작하는 통합 AI 엔진
 *
 * 모든 AI 기능을 실제로 구현:
 * - 실제 MCP 라우팅
 * - 실제 Intent 분류
 * - 실제 시스템 분석
 * - 실제 추천 생성
 * - 실제 결과 병합 및 최적화
 * - AI 컨텍스트 최적화 (v5.41.3 추가)
 */

import {
  MCPAIRouter,
  MCPContext,
  MCPResponse,
} from '@/services/ai/MCPAIRouter';
import { getRedisClient } from '@/lib/redis';
import { getMCPClient } from '@/core/mcp/official-mcp-client';
import { ContextManager, ContextSearchResult } from '@/core/ai/ContextManager';
import { GoogleAIService } from '@/services/ai/GoogleAIService';

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
    enableMCP?: boolean;
    enableAnalysis?: boolean;
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
    contextsUsed?: number;
    contextIds?: string[];
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
  private mcpClient: any;
  private redis: any;
  private contextManager: ContextManager;
  private googleAI?: GoogleAIService;
  private betaModeEnabled: boolean = false;
  private initialized: boolean = false;
  private analysisCache: Map<string, any> = new Map();

  private constructor() {
    // 싱글톤 패턴
    this.contextManager = ContextManager.getInstance();
    this.betaModeEnabled = process.env.GOOGLE_AI_BETA_MODE === 'true';
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
   * 🚀 실제 초기화 (ContextManager 통합)
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('🧠 UnifiedAIEngine 실제 초기화 시작...');

    try {
      // 실제 서비스들 초기화
      this.redis = await getRedisClient();
      this.mcpClient = getMCPClient();

      // MCP 클라이언트 연결
      await this.mcpClient.connect();

      // 🆕 ContextManager 초기화
      await this.contextManager.initialize();

      // 🆕 Google AI 베타 모드 초기화
      if (this.betaModeEnabled) {
        try {
          this.googleAI = new GoogleAIService();
          const initialized = await this.googleAI.initialize();
          if (initialized) {
            console.log('🤖 Google AI 베타 모드 활성화됨');
          } else {
            console.log(
              '⚠️ Google AI 베타 모드 초기화 실패 - 기존 모드로 동작'
            );
            this.googleAI = undefined;
          }
        } catch (error) {
          console.warn('⚠️ Google AI 베타 모드 오류:', error);
          this.googleAI = undefined;
        }
      }

      // 캐시 정리 스케줄러 시작
      this.startCacheCleanup();

      this.initialized = true;
      console.log('✅ UnifiedAIEngine 실제 초기화 완료! (ContextManager 포함)');
    } catch (error) {
      console.error('❌ UnifiedAIEngine 초기화 실패:', error);

      // 초기화 실패해도 기본 모드로 동작
      this.initialized = true;
      console.log('⚠️ UnifiedAIEngine 기본 모드로 초기화됨');
    }
  }

  /**
   * 🎯 실제 쿼리 처리 - 단일 진입점 (컨텍스트 최적화 적용)
   */
  public async processQuery(
    request: UnifiedAnalysisRequest
  ): Promise<UnifiedAnalysisResponse> {
    const startTime = Date.now();

    try {
      // 1. 초기화 확인
      if (!this.initialized) {
        await this.initialize();
      }

      // 2. 세션 생성/관리
      const sessionId = request.context?.sessionId || this.generateSessionId();

      // 3. 실제 Intent 분류
      const intent = await this.classifyIntentReal(
        request.query,
        request.context
      );

      // 🆕 4. AI 컨텍스트 검색 및 활용
      const relevantContexts = await this.contextManager.findRelevantContexts(
        request.query,
        intent.primary,
        request.context?.urgency || 'medium',
        5
      );

      // 5. 실제 컨텍스트 구성 (AI 컨텍스트 포함)
      const mcpContext: MCPContext = {
        userQuery: request.query,
        serverMetrics: request.context?.serverMetrics || [],
        logEntries: request.context?.logEntries || [],
        timeRange: request.context?.timeRange || {
          start: new Date(Date.now() - 24 * 60 * 60 * 1000),
          end: new Date(),
        },
        sessionId,
        // 🆕 AI 컨텍스트 추가
        aiContexts: relevantContexts,
      };

      // 6. 실제 분석 수행 (컨텍스트 강화)
      const analysisResult = await this.performContextEnhancedAnalysis(
        intent,
        mcpContext,
        request.options
      );

      // 7. 실제 응답 구성
      const response: UnifiedAnalysisResponse = {
        success: true,
        query: request.query,
        intent: {
          primary: intent.primary,
          confidence: intent.confidence,
          category: this.categorizeIntent(intent.primary),
          urgency: intent.urgency,
        },
        analysis: {
          summary: analysisResult.summary,
          details: analysisResult.results,
          confidence: analysisResult.confidence,
          processingTime: Date.now() - startTime,
        },
        recommendations: analysisResult.recommendations,
        engines: {
          used: [...(analysisResult.enginesUsed || []), 'ContextManager'],
          results: analysisResult.results,
          fallbacks: analysisResult.metadata?.fallbacksUsed || 0,
        },
        metadata: {
          sessionId,
          timestamp: new Date().toISOString(),
          version: '2.1.0-context-optimized',
          // 🆕 컨텍스트 메타데이터 추가
          contextsUsed: relevantContexts.length,
          contextIds: relevantContexts.map(c => c.context.metadata.context_id),
        },
      };

      // 8. 세션 업데이트 (Redis 캐시)
      await this.updateSession(sessionId, {
        query: request.query,
        intent: intent,
        results: analysisResult.results,
        response: response,
        contextsUsed: relevantContexts,
      });

      return response;
    } catch (error) {
      console.error('❌ UnifiedAIEngine 쿼리 처리 실패:', error);
      return this.createErrorResponse(
        request.query,
        error,
        Date.now() - startTime
      );
    }
  }

  /**
   * 🎯 실제 Intent 분류
   */
  private async classifyIntentReal(query: string, context?: any): Promise<any> {
    try {
      // 캐시 확인
      const cacheKey = `intent:${Buffer.from(query).toString('base64')}`;
      const cached = this.analysisCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < 300000) {
        // 5분 캐시
        return cached.intent;
      }

      // 실제 Intent 분류 로직
      const intent = await this.performIntentClassification(query, context);

      // 캐시 저장
      this.analysisCache.set(cacheKey, {
        intent,
        timestamp: Date.now(),
      });

      return intent;
    } catch (error) {
      console.warn('⚠️ Intent 분류 실패, 기본 분류 사용:', error);
      return this.createFallbackIntent(query);
    }
  }

  /**
   * 🔍 실제 Intent 분류 수행
   */
  private async performIntentClassification(
    query: string,
    context?: any
  ): Promise<any> {
    // 한국어 키워드 분석
    const lowercaseQuery = query.toLowerCase();
    const koreanQuery = query;

    // 1. 상태 조회 의도
    if (
      lowercaseQuery.includes('상태') ||
      lowercaseQuery.includes('status') ||
      koreanQuery.includes('어때') ||
      koreanQuery.includes('괜찮') ||
      lowercaseQuery.includes('health') ||
      lowercaseQuery.includes('check')
    ) {
      return {
        primary: 'status_inquiry',
        confidence: 0.9,
        urgency: 'medium',
        keywords: ['상태', 'status', 'health'],
        category: 'monitoring',
      };
    }

    // 2. 문제 해결 의도
    if (
      lowercaseQuery.includes('문제') ||
      lowercaseQuery.includes('오류') ||
      lowercaseQuery.includes('error') ||
      lowercaseQuery.includes('issue') ||
      koreanQuery.includes('안돼') ||
      koreanQuery.includes('작동') ||
      lowercaseQuery.includes('fail') ||
      lowercaseQuery.includes('down')
    ) {
      return {
        primary: 'troubleshooting',
        confidence: 0.95,
        urgency: 'high',
        keywords: ['문제', 'error', 'issue'],
        category: 'problem_solving',
      };
    }

    // 3. 분석 요청 의도
    if (
      lowercaseQuery.includes('분석') ||
      lowercaseQuery.includes('analyze') ||
      koreanQuery.includes('보여줘') ||
      koreanQuery.includes('알려줘') ||
      lowercaseQuery.includes('report') ||
      lowercaseQuery.includes('summary')
    ) {
      return {
        primary: 'analysis_request',
        confidence: 0.85,
        urgency: 'medium',
        keywords: ['분석', 'analyze', 'report'],
        category: 'analysis',
      };
    }

    // 4. 설정 변경 의도
    if (
      lowercaseQuery.includes('설정') ||
      lowercaseQuery.includes('config') ||
      koreanQuery.includes('바꿔') ||
      koreanQuery.includes('변경') ||
      lowercaseQuery.includes('change') ||
      lowercaseQuery.includes('modify')
    ) {
      return {
        primary: 'configuration',
        confidence: 0.8,
        urgency: 'low',
        keywords: ['설정', 'config', 'change'],
        category: 'configuration',
      };
    }

    // 5. 예측/추천 의도
    if (
      lowercaseQuery.includes('예측') ||
      lowercaseQuery.includes('predict') ||
      koreanQuery.includes('추천') ||
      koreanQuery.includes('제안') ||
      lowercaseQuery.includes('recommend') ||
      lowercaseQuery.includes('suggest')
    ) {
      return {
        primary: 'prediction',
        confidence: 0.8,
        urgency: 'low',
        keywords: ['예측', 'predict', 'recommend'],
        category: 'prediction',
      };
    }

    // 기본 일반 질의
    return {
      primary: 'general_inquiry',
      confidence: 0.6,
      urgency: 'low',
      keywords: [],
      category: 'general',
    };
  }

  /**
   * 🔧 실제 분석 수행 (Google AI 베타 모드 포함)
   */
  private async performRealAnalysis(
    intent: any,
    context: MCPContext,
    options?: any
  ): Promise<MCPResponse> {
    try {
      // 🆕 0차: Google AI 베타 모드 시도 (활성화된 경우)
      if (this.googleAI && this.googleAI.isAvailable()) {
        try {
          const googleResult = await this.performGoogleAIAnalysis(
            intent,
            context
          );
          if (googleResult.success && googleResult.confidence > 0.8) {
            console.log('🤖 Google AI 베타 모드로 분석 완료');
            return googleResult;
          }
        } catch (error) {
          console.warn('⚠️ Google AI 베타 분석 실패, MCP로 폴백:', error);
        }
      }

      // 1차: MCP 도구를 사용한 실제 분석
      if (options?.enableMCP !== false && this.mcpClient) {
        const mcpResult = await this.performMCPAnalysis(intent, context);
        if (mcpResult.success && mcpResult.confidence > 0.7) {
          return mcpResult;
        }
      }

      // 2차: 직접 시스템 분석
      return await this.performDirectSystemAnalysis(intent, context);
    } catch (error) {
      console.warn('⚠️ 실제 분석 실패, 기본 분석으로 대체:', error);
      return await this.performBasicAnalysis(intent, context);
    }
  }

  /**
   * 🤖 Google AI 베타 모드 분석
   */
  private async performGoogleAIAnalysis(
    intent: any,
    context: MCPContext
  ): Promise<MCPResponse> {
    if (!this.googleAI) {
      throw new Error('Google AI 서비스가 초기화되지 않았습니다.');
    }

    const startTime = Date.now();

    try {
      // 서버 메트릭이 있는 경우 전문적인 분석 수행
      if (context.serverMetrics && context.serverMetrics.length > 0) {
        // GoogleAI의 ServerMetrics 타입에 맞게 변환
        const googleMetrics = context.serverMetrics.map(metric => ({
          name: `Server-${metric.timestamp}`,
          cpu_usage: metric.cpu,
          memory_usage: metric.memory,
          disk_usage: metric.disk,
          response_time: metric.responseTime || 0,
          status: 'running',
          timestamp: metric.timestamp,
        }));

        const analysisResult =
          await this.googleAI.analyzeServerMetrics(googleMetrics);

        return {
          success: true,
          results: [
            {
              taskId: `google-ai-${Date.now()}`,
              type: 'google_ai_analysis',
              success: true,
              result: analysisResult,
              executionTime: Date.now() - startTime,
              engine: 'Google AI Studio (Gemini)',
              confidence: 0.95,
            },
          ],
          summary: `🤖 Google AI 베타 분석: ${analysisResult.slice(0, 200)}...`,
          confidence: 0.95,
          processingTime: Date.now() - startTime,
          enginesUsed: ['Google AI Studio (Beta)'],
          recommendations:
            this.extractRecommendationsFromGoogleAI(analysisResult),
          metadata: {
            tasksExecuted: 1,
            successRate: 1.0,
            fallbacksUsed: 0,
            pythonWarmupTriggered: false,
            contextId: `google-ai-${Date.now()}`,
            relevanceScore: 0.95,
            matchedKeywords: ['google-ai', 'beta-mode', 'gemini'],
            processingTime: Date.now() - startTime,
          },
        };
      }

      // 일반적인 쿼리 처리
      const generalAnalysis = await this.googleAI.generateContent(
        this.buildGoogleAIPrompt(intent, context)
      );

      if (generalAnalysis.success) {
        return {
          success: true,
          results: [
            {
              taskId: `google-ai-general-${Date.now()}`,
              type: 'google_ai_general',
              success: true,
              result: generalAnalysis.content,
              executionTime: generalAnalysis.processingTime,
              engine: 'Google AI Studio (Gemini)',
              confidence: generalAnalysis.confidence,
            },
          ],
          summary: `🤖 Google AI 베타 분석: ${generalAnalysis.content.slice(0, 200)}...`,
          confidence: generalAnalysis.confidence,
          processingTime: generalAnalysis.processingTime,
          enginesUsed: ['Google AI Studio (Beta)'],
          recommendations: this.extractRecommendationsFromGoogleAI(
            generalAnalysis.content
          ),
          metadata: {
            tasksExecuted: 1,
            successRate: 1.0,
            fallbacksUsed: 0,
            pythonWarmupTriggered: false,
            contextId: `google-ai-${Date.now()}`,
            relevanceScore: generalAnalysis.confidence,
            matchedKeywords: ['google-ai', 'beta-mode', 'gemini'],
            processingTime: generalAnalysis.processingTime,
          },
        };
      }

      throw new Error('Google AI 응답 생성 실패');
    } catch (error) {
      console.error('❌ Google AI 베타 분석 실패:', error);
      throw error;
    }
  }

  /**
   * 🛠️ Google AI용 프롬프트 구성
   */
  private buildGoogleAIPrompt(intent: any, context: MCPContext): string {
    let prompt = `당신은 OpenManager 서버 모니터링 전문 AI입니다.

사용자 질의: ${context.userQuery}
분석 의도: ${intent.primary} (${intent.category})
긴급도: ${intent.urgency}

`;

    // 서버 메트릭 추가
    if (context.serverMetrics && context.serverMetrics.length > 0) {
      prompt += `\n📊 서버 메트릭 데이터:\n`;
      context.serverMetrics.forEach((metric, index) => {
        prompt += `${index + 1}. CPU: ${metric.cpu}%, 메모리: ${metric.memory}%, 디스크: ${metric.disk}%\n`;
      });
    }

    // 로그 엔트리 추가
    if (context.logEntries && context.logEntries.length > 0) {
      prompt += `\n📝 최근 로그 엔트리:\n`;
      context.logEntries.slice(-5).forEach((log, index) => {
        prompt += `${index + 1}. [${log.level}] ${log.message}\n`;
      });
    }

    // AI 컨텍스트 추가
    if (context.aiContexts && context.aiContexts.length > 0) {
      prompt += `\n🧠 관련 AI 컨텍스트:\n`;
      context.aiContexts.forEach((ctx, index) => {
        prompt += `${index + 1}. ${ctx.context.content.slice(0, 100)}...\n`;
      });
    }

    prompt += `\n다음 형식으로 분석해주세요:
1. 🎯 **핵심 요약** (2-3줄)
2. 📊 **상세 분석**
3. ⚠️ **주의사항** (있는 경우)
4. 💡 **권장 조치사항** (구체적이고 실행 가능한)
5. 🔮 **예측 및 트렌드** (해당하는 경우)

전문적이고 실용적인 분석을 제공해주세요.`;

    return prompt;
  }

  /**
   * 🎯 Google AI 응답에서 권장사항 추출
   */
  private extractRecommendationsFromGoogleAI(content: string): string[] {
    const recommendations: string[] = [];

    // "권장" 또는 "조치" 관련 문장들을 찾아서 추출
    const lines = content.split('\n');
    let inRecommendationSection = false;

    for (const line of lines) {
      const trimmedLine = line.trim();

      // 권장사항 섹션 시작 감지
      if (
        trimmedLine.includes('💡') ||
        trimmedLine.includes('권장') ||
        trimmedLine.includes('조치')
      ) {
        inRecommendationSection = true;
        continue;
      }

      // 다른 섹션 시작시 종료
      if (
        trimmedLine.startsWith('🔮') ||
        trimmedLine.startsWith('##') ||
        trimmedLine.startsWith('#')
      ) {
        inRecommendationSection = false;
      }

      // 권장사항 섹션 내의 항목들 추출
      if (
        inRecommendationSection &&
        trimmedLine &&
        !trimmedLine.startsWith('💡')
      ) {
        const cleanLine = trimmedLine
          .replace(/^[-*•]\s*/, '')
          .replace(/^\d+\.\s*/, '');
        if (cleanLine.length > 10) {
          recommendations.push(cleanLine);
        }
      }
    }

    // 기본 권장사항이 없으면 일반적인 것들 추가
    if (recommendations.length === 0) {
      recommendations.push(
        '시스템 리소스 모니터링을 지속적으로 수행하세요',
        '정기적인 성능 최적화를 실시하세요',
        '로그 분석을 통해 잠재적 문제를 조기 발견하세요'
      );
    }

    return recommendations.slice(0, 5); // 최대 5개까지
  }

  /**
   * 🛠️ MCP 도구를 사용한 실제 분석
   */
  private async performMCPAnalysis(
    intent: any,
    context: MCPContext
  ): Promise<MCPResponse> {
    const startTime = Date.now();
    const results: any[] = [];
    let confidence = 0;

    try {
      // 시스템 메트릭 도구 사용
      if (intent.category === 'monitoring' || intent.category === 'analysis') {
        try {
          const metricsResult = await this.mcpClient.callTool(
            'system',
            'get_metrics',
            {
              type: 'all',
            }
          );

          if (metricsResult && !metricsResult.isError) {
            results.push({
              type: 'system_metrics',
              data: metricsResult.content[0].text,
              confidence: 0.9,
            });
            confidence += 0.3;
          }
        } catch (error) {
          console.warn('⚠️ 시스템 메트릭 조회 실패:', error);
        }
      }

      // 프로세스 정보 도구 사용
      if (
        intent.category === 'troubleshooting' ||
        intent.category === 'monitoring'
      ) {
        try {
          const processResult = await this.mcpClient.callTool(
            'system',
            'get_processes',
            {
              limit: 10,
            }
          );

          if (processResult && !processResult.isError) {
            results.push({
              type: 'process_info',
              data: processResult.content[0].text,
              confidence: 0.8,
            });
            confidence += 0.2;
          }
        } catch (error) {
          console.warn('⚠️ 프로세스 정보 조회 실패:', error);
        }
      }

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        results,
        summary: this.generateMCPSummary(results, intent),
        confidence: Math.min(confidence, 1.0),
        processingTime,
        enginesUsed: ['MCP-System'],
        recommendations: this.generateMCPRecommendations(results, intent),
        metadata: {
          tasksExecuted: results.length,
          successRate: results.length > 0 ? 1.0 : 0.0,
          fallbacksUsed: 0,
          pythonWarmupTriggered: false,
        },
      };
    } catch (error) {
      console.error('❌ MCP 분석 실패:', error);
      throw error;
    }
  }

  /**
   * 🔍 직접 시스템 분석
   */
  private async performDirectSystemAnalysis(
    intent: any,
    context: MCPContext
  ): Promise<MCPResponse> {
    const startTime = Date.now();
    const results: any[] = [];

    try {
      // 서버 메트릭 분석
      if (context.serverMetrics && context.serverMetrics.length > 0) {
        const metricsAnalysis = this.analyzeServerMetrics(
          context.serverMetrics
        );
        results.push({
          type: 'metrics_analysis',
          data: metricsAnalysis,
          confidence: 0.8,
        });
      }

      // 로그 엔트리 분석
      if (context.logEntries && context.logEntries.length > 0) {
        const logAnalysis = this.analyzeLogEntries(context.logEntries);
        results.push({
          type: 'log_analysis',
          data: logAnalysis,
          confidence: 0.7,
        });
      }

      // 시스템 상태 체크
      const systemStatus = await this.checkSystemStatus();
      results.push({
        type: 'system_status',
        data: systemStatus,
        confidence: 0.9,
      });

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        results,
        summary: this.generateDirectSummary(results, intent),
        confidence: 0.85,
        processingTime,
        enginesUsed: ['DirectAnalysis'],
        recommendations: this.generateDirectRecommendations(results, intent),
        metadata: {
          tasksExecuted: results.length,
          successRate: 1.0,
          fallbacksUsed: 0,
          pythonWarmupTriggered: false,
        },
      };
    } catch (error) {
      console.error('❌ 직접 시스템 분석 실패:', error);
      throw error;
    }
  }

  /**
   * 📊 서버 메트릭 분석
   */
  private analyzeServerMetrics(metrics: ServerMetrics[]): any {
    if (metrics.length === 0) return { message: '메트릭 데이터가 없습니다.' };

    const latest = metrics[metrics.length - 1];
    const avgCpu = metrics.reduce((sum, m) => sum + m.cpu, 0) / metrics.length;
    const avgMemory =
      metrics.reduce((sum, m) => sum + m.memory, 0) / metrics.length;
    const avgDisk =
      metrics.reduce((sum, m) => sum + m.disk, 0) / metrics.length;

    const status = this.determineSystemStatus(
      latest.cpu,
      latest.memory,
      latest.disk
    );

    return {
      current: {
        cpu: latest.cpu,
        memory: latest.memory,
        disk: latest.disk,
        timestamp: latest.timestamp,
      },
      averages: {
        cpu: Math.round(avgCpu * 100) / 100,
        memory: Math.round(avgMemory * 100) / 100,
        disk: Math.round(avgDisk * 100) / 100,
      },
      status,
      trends: {
        cpu: this.calculateTrend(metrics.slice(-5).map(m => m.cpu)),
        memory: this.calculateTrend(metrics.slice(-5).map(m => m.memory)),
        disk: this.calculateTrend(metrics.slice(-5).map(m => m.disk)),
      },
      summary: `시스템 상태: ${status}, CPU ${latest.cpu}%, 메모리 ${latest.memory}%, 디스크 ${latest.disk}%`,
    };
  }

  /**
   * 📋 로그 엔트리 분석
   */
  private analyzeLogEntries(logs: LogEntry[]): any {
    const errorLogs = logs.filter(log => log.level === 'ERROR');
    const warnLogs = logs.filter(log => log.level === 'WARN');
    const recentLogs = logs.filter(
      log => new Date(log.timestamp).getTime() > Date.now() - 3600000 // 1시간 이내
    );

    const keywordCounts = this.countLogKeywords(logs);

    return {
      total: logs.length,
      byLevel: {
        ERROR: errorLogs.length,
        WARN: warnLogs.length,
        INFO: logs.filter(log => log.level === 'INFO').length,
        DEBUG: logs.filter(log => log.level === 'DEBUG').length,
      },
      recent: recentLogs.length,
      keywords: keywordCounts,
      criticalIssues: errorLogs.slice(-3).map(log => ({
        timestamp: log.timestamp,
        message: log.message,
        source: log.source,
      })),
      summary: `총 ${logs.length}개 로그, 에러 ${errorLogs.length}개, 경고 ${warnLogs.length}개`,
    };
  }

  /**
   * 🔍 시스템 상태 체크
   */
  private async checkSystemStatus(): Promise<any> {
    try {
      // Redis 연결 상태
      const redisStatus = await this.checkRedisStatus();

      // MCP 클라이언트 상태
      const mcpStatus = this.mcpClient
        ? this.mcpClient.getConnectionStatus()
        : {};

      // 메모리 사용량 (Edge 환경 대비)
      const memoryUsage =
        typeof process !== 'undefined' &&
        typeof process.memoryUsage === 'function'
          ? process.memoryUsage()
          : { heapUsed: 0, heapTotal: 0, external: 0, rss: 0, arrayBuffers: 0 };

      return {
        redis: redisStatus,
        mcp: mcpStatus,
        memory: {
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          external: Math.round(memoryUsage.external / 1024 / 1024),
        },
        uptime:
          typeof process !== 'undefined' && typeof process.uptime === 'function'
            ? Math.round(process.uptime())
            : 0,
        timestamp: new Date().toISOString(),
        status: 'healthy',
      };
    } catch (error) {
      return {
        status: 'error',
        error: error instanceof Error ? error.message : '상태 확인 실패',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 🔧 기본 분석 (폴백)
   */
  private async performBasicAnalysis(
    intent: any,
    context: MCPContext
  ): Promise<MCPResponse> {
    const startTime = Date.now();

    const basicSummary = this.generateBasicSummary(intent, context);
    const basicRecommendations = this.generateBasicRecommendations(intent);

    return {
      success: true,
      results: [
        {
          taskId: `basic_${Date.now()}`,
          type: 'basic_analysis',
          success: true,
          result: basicSummary,
          executionTime: Date.now() - startTime,
          engine: 'BasicAnalysis',
          confidence: 0.6,
        },
      ],
      summary: basicSummary,
      confidence: 0.6,
      processingTime: Date.now() - startTime,
      enginesUsed: ['BasicAnalysis'],
      recommendations: basicRecommendations,
      metadata: {
        tasksExecuted: 1,
        successRate: 1.0,
        fallbacksUsed: 1,
        pythonWarmupTriggered: false,
      },
    };
  }

  /**
   * 📊 캐시 정리 스케줄러
   */
  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.analysisCache.entries()) {
        if (now - value.timestamp > 600000) {
          // 10분 후 정리
          this.analysisCache.delete(key);
        }
      }
    }, 300000); // 5분마다 정리
  }

  /**
   * 🎯 유틸리티 메서드들
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private categorizeIntent(primary: string): string {
    const categories: Record<string, string> = {
      status_inquiry: 'monitoring',
      troubleshooting: 'problem_solving',
      analysis_request: 'analysis',
      configuration: 'configuration',
      prediction: 'prediction',
      general_inquiry: 'general',
    };
    return categories[primary] || 'general';
  }

  private createFallbackIntent(query: string): any {
    return {
      primary: 'general_inquiry',
      confidence: 0.5,
      urgency: 'low',
      keywords: [],
      category: 'general',
      originalQuery: query,
    };
  }

  private determineSystemStatus(
    cpu: number,
    memory: number,
    disk: number
  ): string {
    if (cpu > 90 || memory > 90 || disk > 95) return 'critical';
    if (cpu > 80 || memory > 80 || disk > 85) return 'warning';
    return 'healthy';
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    const first = values[0];
    const last = values[values.length - 1];
    return ((last - first) / first) * 100;
  }

  private countLogKeywords(logs: LogEntry[]): Record<string, number> {
    const keywords = [
      'error',
      'timeout',
      'connection',
      'failed',
      'success',
      'warning',
    ];
    const counts: Record<string, number> = {};

    keywords.forEach(keyword => {
      counts[keyword] = logs.filter(log =>
        log.message.toLowerCase().includes(keyword)
      ).length;
    });

    return counts;
  }

  private async checkRedisStatus(): Promise<any> {
    try {
      if (this.redis) {
        await this.redis.ping();
        return { status: 'connected', type: 'redis' };
      }
      return { status: 'not_configured', type: 'dummy' };
    } catch (error) {
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Redis 연결 실패',
      };
    }
  }

  private async updateSession(sessionId: string, data: any): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.setex(
          `session:${sessionId}`,
          3600,
          JSON.stringify(data)
        );
      }
    } catch (error) {
      console.warn('⚠️ 세션 업데이트 실패:', error);
    }
  }

  private generateMCPSummary(results: any[], intent: any): string {
    if (results.length === 0) return 'MCP 도구를 통한 분석을 완료했습니다.';

    const summaryParts = results.map(result => {
      switch (result.type) {
        case 'system_metrics':
          return '시스템 메트릭을 조회했습니다.';
        case 'process_info':
          return '실행 중인 프로세스 정보를 확인했습니다.';
        case 'git_status':
          return '코드 저장소 상태를 확인했습니다.';
        default:
          return `${result.type} 분석을 완료했습니다.`;
      }
    });

    return `MCP 도구를 사용하여 분석을 완료했습니다: ${summaryParts.join(', ')}`;
  }

  private generateMCPRecommendations(results: any[], intent: any): string[] {
    const recommendations: string[] = [];

    results.forEach(result => {
      switch (result.type) {
        case 'system_metrics':
          recommendations.push('정기적인 시스템 메트릭 모니터링을 권장합니다.');
          break;
        case 'process_info':
          recommendations.push(
            '리소스 사용량이 높은 프로세스를 주기적으로 확인하세요.'
          );
          break;
        case 'git_status':
          recommendations.push(
            '코드 변경사항을 정기적으로 커밋하고 백업하세요.'
          );
          break;
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('시스템이 정상적으로 작동 중입니다.');
    }

    return recommendations;
  }

  private generateDirectSummary(results: any[], intent: any): string {
    if (results.length === 0) return '직접 시스템 분석을 완료했습니다.';

    const summaryParts: string[] = [];

    results.forEach(result => {
      switch (result.type) {
        case 'metrics_analysis':
          summaryParts.push(`시스템 상태: ${result.data.status}`);
          break;
        case 'log_analysis':
          summaryParts.push(`로그 분석: ${result.data.summary}`);
          break;
        case 'system_status':
          summaryParts.push(`시스템 상태: ${result.data.status}`);
          break;
      }
    });

    return `시스템 분석 완료. ${summaryParts.join(', ')}`;
  }

  private generateDirectRecommendations(results: any[], intent: any): string[] {
    const recommendations: string[] = [];

    results.forEach(result => {
      if (result.type === 'metrics_analysis' && result.data.status) {
        switch (result.data.status) {
          case 'critical':
            recommendations.push(
              '⚠️ 시스템 리소스가 위험 수준입니다. 즉시 확인이 필요합니다.'
            );
            break;
          case 'warning':
            recommendations.push(
              '⚡ 시스템 리소스 사용량이 높습니다. 모니터링을 강화하세요.'
            );
            break;
          case 'healthy':
            recommendations.push('✅ 시스템이 정상적으로 작동 중입니다.');
            break;
        }
      }

      if (result.type === 'log_analysis' && result.data.byLevel) {
        if (result.data.byLevel.ERROR > 0) {
          recommendations.push(
            `🔍 ${result.data.byLevel.ERROR}개의 에러 로그를 확인하세요.`
          );
        }
        if (result.data.byLevel.WARN > 5) {
          recommendations.push(
            `⚠️ 경고 로그가 많습니다(${result.data.byLevel.WARN}개). 주의깊게 모니터링하세요.`
          );
        }
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('시스템이 안정적으로 운영되고 있습니다.');
    }

    return recommendations;
  }

  private generateBasicSummary(intent: any, context: MCPContext): string {
    return `${intent.primary} 요청을 처리했습니다. ${context.userQuery}에 대한 기본 분석을 완료했습니다.`;
  }

  private generateBasicRecommendations(intent: any): string[] {
    const basicRecommendations: Record<string, string[]> = {
      status_inquiry: [
        '시스템 상태를 정기적으로 확인하세요.',
        '모니터링 대시보드를 활용하세요.',
      ],
      troubleshooting: [
        '로그를 자세히 확인하세요.',
        '시스템 관리자에게 문의하세요.',
      ],
      analysis_request: ['더 자세한 분석을 위해 추가 데이터를 제공하세요.'],
      configuration: ['설정 변경 전 백업을 수행하세요.'],
      prediction: ['지속적인 모니터링으로 예측 정확도를 높이세요.'],
      general_inquiry: ['구체적인 질문으로 더 정확한 답변을 받으세요.'],
    };

    return (
      basicRecommendations[intent.primary] || ['시스템을 계속 모니터링하세요.']
    );
  }

  private createErrorResponse(
    query: string,
    error: any,
    processingTime: number
  ): UnifiedAnalysisResponse {
    return {
      success: false,
      query,
      intent: {
        primary: 'error',
        confidence: 0,
        category: 'error',
        urgency: 'low',
      },
      analysis: {
        summary: `쿼리 처리 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        details: [],
        confidence: 0,
        processingTime,
      },
      recommendations: [
        '잠시 후 다시 시도해보세요.',
        '시스템 관리자에게 문의하세요.',
      ],
      engines: {
        used: [],
        results: [],
        fallbacks: 1,
      },
      metadata: {
        sessionId: this.generateSessionId(),
        timestamp: new Date().toISOString(),
        version: '2.1.0',
      },
    };
  }

  /**
   * 🏥 시스템 상태 조회
   */
  public async getSystemStatus(): Promise<any> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      return await this.checkSystemStatus();
    } catch (error) {
      console.error('❌ 시스템 상태 조회 실패:', error);
      return {
        status: 'error',
        error: error instanceof Error ? error.message : '상태 조회 실패',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 🆕 컨텍스트 강화 분석 수행
   */
  private async performContextEnhancedAnalysis(
    intent: any,
    context: MCPContext,
    options?: any
  ): Promise<MCPResponse> {
    try {
      // 1. 컨텍스트 기반 응답 생성 시도
      if (context.aiContexts && context.aiContexts.length > 0) {
        const contextBasedResponse = await this.generateContextBasedResponse(
          intent,
          context
        );
        if (contextBasedResponse.confidence > 0.7) {
          return contextBasedResponse;
        }
      }

      // 2. 기존 분석 방식으로 폴백
      return await this.performRealAnalysis(intent, context, options);
    } catch (error) {
      console.error('❌ 컨텍스트 강화 분석 실패:', error);
      return await this.performRealAnalysis(intent, context, options);
    }
  }

  /**
   * 🆕 컨텍스트 기반 응답 생성
   */
  private async generateContextBasedResponse(
    intent: any,
    context: MCPContext
  ): Promise<MCPResponse> {
    const relevantContexts = context.aiContexts || [];
    const topContext = relevantContexts[0];

    if (!topContext) {
      throw new Error('No relevant contexts available');
    }

    // JSON 구조화 데이터 추출
    const structuredData = this.extractStructuredData(
      topContext.context.content
    );

    // 컨텍스트 기반 분석
    const analysis = this.analyzeWithContext(intent, context, structuredData);

    return {
      success: true,
      summary: analysis.summary,
      results: analysis.results,
      recommendations: analysis.recommendations,
      confidence: analysis.confidence,
      enginesUsed: ['ContextManager', 'StructuredAnalysis'],
      processingTime: Date.now(),
      metadata: {
        tasksExecuted: 1,
        successRate: 1.0,
        fallbacksUsed: 0,
        pythonWarmupTriggered: false,
        contextId: topContext.context.metadata.context_id,
        relevanceScore: topContext.relevanceScore,
        matchedKeywords: topContext.matchedKeywords,
        processingTime: Date.now(),
      },
    };
  }

  /**
   * 🆕 구조화된 데이터 추출
   */
  private extractStructuredData(content: string): any {
    const jsonBlocks = content.match(/```json\n([\s\S]*?)\n```/g) || [];
    const structuredData: any = {};

    for (const block of jsonBlocks) {
      try {
        const jsonContent = block.replace(/```json\n/, '').replace(/\n```/, '');
        const parsed = JSON.parse(jsonContent);
        Object.assign(structuredData, parsed);
      } catch (error) {
        console.warn('JSON 파싱 실패:', error);
      }
    }

    return structuredData;
  }

  /**
   * 🆕 컨텍스트 기반 분석
   */
  private analyzeWithContext(
    intent: any,
    context: MCPContext,
    structuredData: any
  ): any {
    const serverMetrics = context.serverMetrics || [];
    const currentMetrics = serverMetrics[serverMetrics.length - 1];

    if (!currentMetrics) {
      return this.generateFallbackAnalysis(intent, structuredData);
    }

    // 시스템 상태 평가
    const systemEvaluation = this.evaluateSystemHealth(
      currentMetrics,
      structuredData
    );

    // 패턴 매칭
    const patternAnalysis = this.detectPatterns(serverMetrics, structuredData);

    // 추천 생성
    const recommendations = this.generateContextRecommendations(
      systemEvaluation,
      patternAnalysis,
      structuredData
    );

    return {
      summary: this.generateContextSummary(systemEvaluation, patternAnalysis),
      results: [systemEvaluation, patternAnalysis],
      recommendations,
      confidence: Math.min(systemEvaluation.confidence || 0.8, 0.95),
    };
  }

  /**
   * 🆕 시스템 상태 평가 (구조화된 데이터 활용)
   */
  private evaluateSystemHealth(metrics: any, structuredData: any): any {
    const evaluation: any = {
      cpu: this.evaluateMetric(
        metrics.cpu,
        structuredData.system_health_evaluation?.cpu
      ),
      memory: this.evaluateMetric(
        metrics.memory,
        structuredData.system_health_evaluation?.memory
      ),
      disk: this.evaluateMetric(
        metrics.disk,
        structuredData.system_health_evaluation?.disk
      ),
      confidence: 0.9,
    };

    // 복합 평가
    if (structuredData.composite_evaluation) {
      const weights = structuredData.composite_evaluation.weights;
      const compositeScore =
        evaluation.cpu.score * weights.cpu +
        evaluation.memory.score * weights.memory +
        evaluation.disk.score * weights.disk;

      evaluation.overall = {
        score: compositeScore,
        status: this.determineOverallStatus(
          compositeScore,
          structuredData.composite_evaluation.overall_status
        ),
      };
    }

    return evaluation;
  }

  /**
   * 🆕 개별 메트릭 평가
   */
  private evaluateMetric(value: number, thresholds: any): any {
    if (!thresholds) {
      return { score: value, status: 'unknown', confidence: 0.5 };
    }

    for (const [status, config] of Object.entries(thresholds)) {
      const range = (config as any).range;
      if (value >= range[0] && value <= range[1]) {
        return {
          score: value,
          status,
          confidence: (config as any).confidence,
          ai_response: (config as any).ai_response,
        };
      }
    }

    return { score: value, status: 'unknown', confidence: 0.5 };
  }

  /**
   * 🆕 패턴 감지 (구조화된 데이터 활용)
   */
  private detectPatterns(metricsHistory: any[], structuredData: any): any {
    const patterns = structuredData.anomaly_patterns || {};
    const detectedPatterns = [];

    for (const [patternName, patternConfig] of Object.entries(patterns)) {
      const confidence = this.checkPatternMatch(
        metricsHistory,
        patternConfig as any
      );
      if (confidence > (patternConfig as any).confidence_threshold) {
        detectedPatterns.push({
          name: patternName,
          confidence,
          response: (patternConfig as any).ai_response_template,
          actions: (patternConfig as any).recommended_actions,
        });
      }
    }

    return {
      detected: detectedPatterns,
      confidence:
        detectedPatterns.length > 0
          ? Math.max(...detectedPatterns.map(p => p.confidence))
          : 0.5,
    };
  }

  /**
   * 🆕 패턴 매칭 확인
   */
  private checkPatternMatch(metricsHistory: any[], patternConfig: any): number {
    // 간단한 패턴 매칭 로직 (실제로는 더 복잡한 알고리즘 필요)
    const indicators = patternConfig.indicators || [];
    let matchCount = 0;

    // 메모리 누수 패턴 예시
    if (indicators.includes('메모리 사용률의 지속적인 증가 (>1% per hour)')) {
      const memoryTrend = this.calculateMemoryTrend(metricsHistory);
      if (memoryTrend > 1) matchCount++;
    }

    return matchCount / indicators.length;
  }

  /**
   * 🆕 메모리 트렌드 계산
   */
  private calculateMemoryTrend(metricsHistory: any[]): number {
    if (metricsHistory.length < 2) return 0;

    const recent = metricsHistory.slice(-5); // 최근 5개 데이터
    const first = recent[0]?.memory || 0;
    const last = recent[recent.length - 1]?.memory || 0;

    return ((last - first) / first) * 100; // 퍼센트 변화율
  }

  /**
   * 🆕 컨텍스트 기반 추천 생성
   */
  private generateContextRecommendations(
    systemEvaluation: any,
    patternAnalysis: any,
    structuredData: any
  ): string[] {
    const recommendations: string[] = [];

    // 시스템 상태 기반 추천
    if (systemEvaluation.cpu?.status === 'critical') {
      const actions =
        structuredData.immediate_actions?.cpu_overload?.steps || [];
      recommendations.push(...actions);
    }

    if (systemEvaluation.memory?.status === 'critical') {
      const actions =
        structuredData.immediate_actions?.memory_shortage?.steps || [];
      recommendations.push(...actions);
    }

    // 패턴 기반 추천
    for (const pattern of patternAnalysis.detected || []) {
      recommendations.push(...(pattern.actions || []));
    }

    return recommendations.slice(0, 5); // 최대 5개 추천
  }

  /**
   * 🆕 컨텍스트 요약 생성
   */
  private generateContextSummary(
    systemEvaluation: any,
    patternAnalysis: any
  ): string {
    const parts = [];

    // 전체 상태
    if (systemEvaluation.overall) {
      parts.push(`시스템 전체 상태: ${systemEvaluation.overall.status}`);
    }

    // 개별 메트릭
    if (systemEvaluation.cpu?.ai_response) {
      parts.push(systemEvaluation.cpu.ai_response);
    }

    // 감지된 패턴
    for (const pattern of patternAnalysis.detected || []) {
      parts.push(pattern.response);
    }

    return parts.join(' ') || '시스템 상태를 분석 중입니다.';
  }

  /**
   * 🆕 폴백 분석 생성
   */
  private generateFallbackAnalysis(intent: any, structuredData: any): any {
    return {
      summary: '현재 메트릭 데이터가 없어 기본 분석을 제공합니다.',
      results: [{ type: 'fallback', data: structuredData }],
      recommendations: [
        '시스템 메트릭 수집을 확인하세요.',
        '모니터링 시스템 상태를 점검하세요.',
      ],
      confidence: 0.6,
    };
  }

  /**
   * 🆕 전체 상태 결정
   */
  private determineOverallStatus(score: number, statusConfig: any): string {
    for (const [status, config] of Object.entries(statusConfig)) {
      const range = (config as any).score_range;
      if (score >= range[0] && score <= range[1]) {
        return status;
      }
    }
    return 'unknown';
  }

  /**
   * 🆕 컨텍스트 사용 통계 조회
   */
  public getContextUsageStats(): any {
    return this.contextManager.getUsageStats();
  }

  /**
   * 🆕 컨텍스트 새로고침
   */
  public async refreshContexts(): Promise<void> {
    await this.contextManager.refresh();
  }
}

// 싱글톤 인스턴스 export
export const unifiedAIEngine = UnifiedAIEngine.getInstance();
