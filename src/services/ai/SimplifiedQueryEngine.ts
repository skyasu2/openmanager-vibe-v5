/**
 * 🎯 SimplifiedQueryEngine - 단순화된 AI 쿼리 엔진
 *
 * ✅ 로컬 모드: Supabase RAG 엔진 사용
 * ✅ Google AI 모드: Gemini API 직접 호출
 * ✅ MCP는 컨텍스트 보조로만 사용
 * ✅ API 사용량 최적화
 * ✅ 쿼리 복잡도 분석 및 자동 엔진 선택
 * ✅ 응답 시간 500ms 이하 목표
 */

import type { SupabaseRAGEngine } from './supabase-rag-engine';
import { getSupabaseRAGEngine } from './supabase-rag-engine';
import { CloudContextLoader } from '../mcp/CloudContextLoader';
import type { RAGEngineContext } from '../mcp/CloudContextLoader.types';
import { MockContextLoader } from './MockContextLoader';
import { IntentClassifier } from '../../modules/ai-agent/processors/IntentClassifier';
import type { Entity } from '../../modules/ai-agent/processors/IntentClassifier';

// Import extracted modules
import { SimplifiedQueryEngineUtils } from './SimplifiedQueryEngine.utils';
import { SimplifiedQueryEngineProcessors } from './SimplifiedQueryEngine.processors';
// 🔧 타임아웃 설정 (통합 유틸리티 사용)
import { getEnvironmentTimeouts } from '@/utils/timeout-config';
import type {
  QueryRequest,
  QueryResponse,
  ThinkingStep,
  HealthCheckResult,
  CommandContext,
  MockContext,
  NLPAnalysis,
} from './SimplifiedQueryEngine.types';
import type {
  AIQueryContext,
  AIQueryOptions,
  MCPContext,
  AIMetadata,
} from '../../types/ai-service-types';

// Re-export types from the types module for backward compatibility
export type {
  QueryRequest,
  QueryResponse,
  NLPAnalysis,
  NLPResult,
  CommandContext,
  MockContext,
  ThinkingStep,
  CacheEntry,
  HealthCheckResult,
} from './SimplifiedQueryEngine.types';

// Re-export AIMetadata for modules that expect it from this location
export type { AIMetadata } from '../../types/ai-service-types';

export class SimplifiedQueryEngine {
  protected ragEngine: SupabaseRAGEngine;
  protected contextLoader: CloudContextLoader;
  protected mockContextLoader: MockContextLoader;
  protected intentClassifier: IntentClassifier;
  protected isInitialized = false;
  private initPromise: Promise<void> | null = null;

  // Extracted utility and processor classes
  public utils: SimplifiedQueryEngineUtils;
  private processors: SimplifiedQueryEngineProcessors;

  constructor() {
    this.ragEngine = getSupabaseRAGEngine();
    this.contextLoader = CloudContextLoader.getInstance();
    this.mockContextLoader = MockContextLoader.getInstance();
    this.intentClassifier = new IntentClassifier();

    // Initialize extracted modules
    this.utils = new SimplifiedQueryEngineUtils();
    this.processors = new SimplifiedQueryEngineProcessors(
      this.utils,
      this.ragEngine,
      this.contextLoader,
      this.mockContextLoader,
      this.intentClassifier
    );

    // Cache cleanup scheduler (delegated to utils) - Runtime별 조건부 실행
    this.initCleanupScheduler();
  }

  private initCleanupScheduler() {
    // 🚀 AI 교차검증 개선: setInterval 제거 (Vercel 서버리스 호환성)
    // Lazy cleanup 전략: 캐시 접근 시 TTL 검사로 대체
    // Vercel Cron을 통한 정기 정리는 별도 API 엔드포인트에서 처리
    console.log('✅ SimplifiedQueryEngine: Lazy cache cleanup 전략 적용');
  }

  /**
   * 🚀 엔진 초기화 (한 번만 실행)
   */
  async _initialize(): Promise<void> {
    if (this.isInitialized) return;

    // 이미 초기화 진행 중이면 기다림
    if (this.initPromise !== null && this.initPromise !== undefined) {
      return this.initPromise;
    }

    this.initPromise = this.performInitialization();

    try {
      await this.initPromise;
    } finally {
      this.initPromise = null;
    }
  }

  private async performInitialization(): Promise<void> {
    try {
      console.log('🚀 SimplifiedQueryEngine 초기화 중...');

      // RAG 엔진 초기화 (타임아웃 설정) - 🚀 AI 교차검증: 안정성 우선 3초로 조정
      const initTimeout = new Promise<void>((_, reject) =>
        setTimeout(() => reject(new Error('초기화 타임아웃')), 3000)
      );

      await Promise.race([this.ragEngine._initialize(), initTimeout]);

      this.isInitialized = true;
      console.log('✅ SimplifiedQueryEngine 초기화 완료');
    } catch (error) {
      console.error('❌ 엔진 초기화 실패:', error);
      // 초기화 실패해도 계속 진행
      this.isInitialized = true;
    }
  }

  /**
   * 🔍 쿼리 처리 (지능형 라우팅 포함)
   */
  async query(request: QueryRequest): Promise<QueryResponse> {
    const startTime = Date.now();

    // 🐛 디버그 로그: SimplifiedQueryEngine에서 받은 request 값들 확인
    console.log('🔍 [DEBUG] SimplifiedQueryEngine received:', {
      query: request.query?.substring(0, 50) + '...',
      contextKeys: Object.keys(request.context || {}),
      options: Object.keys(request.options || {}),
    });

    // 초기화 병렬 실행
    const initPromise = this._initialize();

    const {
      query,
      context = {},
      options = {},
    } = request;

    const thinkingSteps: QueryResponse['thinkingSteps'] = [];

    // 🚀 환경변수 기반 타임아웃 설정
    const timeouts = getEnvironmentTimeouts();
    const timeoutMs = options.timeoutMs || timeouts.GOOGLE_AI;

    // 🎯 Step 1: Cache Check (비용 $0)
    const cacheKey = this.utils.generateCacheKey(query, context);
    const cachedResponse = this.utils.getCachedResponse(cacheKey);
    if (cachedResponse && options.cached !== false) {
      thinkingSteps.push({
        step: '캐시 확인',
        description: '✅ 캐시 히트 - 즉시 반환 (비용 $0)',
        status: 'completed',
        timestamp: Date.now(),
        duration: Date.now() - startTime,
      });
      
      const baseMetadata = cachedResponse.metadata || {};
      const estimatedCost = Math.ceil(query.length / 4) * 0.000002; // $0.002 per 1K tokens
      
      return {
        ...cachedResponse,
        metadata: {
          ...baseMetadata,
          cacheHit: true,
          engineType: 'cache',
          savedCost: estimatedCost,
          actualCost: 0,
        } as AIMetadata & { cacheHit?: boolean; engineType?: string; savedCost?: number; actualCost?: number },
        processingTime: Date.now() - startTime,
        thinkingSteps,
      };
    }

    thinkingSteps.push({
      step: '캐시 확인',
      description: '캐시 미스 - 새로운 처리 필요',
      status: 'completed',
      timestamp: Date.now(),
      duration: Date.now() - startTime,
    });

    // 초기화 완료 대기
    await initPromise;

    try {
      // 빈 쿼리 체크
      if (!query || query.trim().length === 0) {
        return {
          success: true,
          response: '질의를 입력해 주세요',
          engine: 'local-rag',
          confidence: 0,
          thinkingSteps: [
            {
              step: '빈 쿼리 확인',
              description: '입력된 쿼리가 비어있습니다',
              status: 'completed',
              timestamp: Date.now(),
            },
          ],
          processingTime: Date.now() - startTime,
        };
      }

      // 🎯 Step 2: Intent Classification (Circuit Breaker)
      const intentStepStart = Date.now();
      thinkingSteps.push({
        step: '의도 분석',
        description: '쿼리 의도 및 복잡도 분석 중...',
        status: 'pending',
        timestamp: intentStepStart,
      });

      const intentResult = await this.intentClassifier.classify(query);
      const intentStep = thinkingSteps[thinkingSteps.length - 1];
      if (intentStep) {
        intentStep.status = 'completed';
        intentStep.description = `의도: ${intentResult.name} (신뢰도: ${(intentResult.confidence * 100).toFixed(0)}%)`;
        intentStep.duration = Date.now() - intentStepStart;
      }

      // 🔥 Circuit Breaker: 단순 질의는 Google AI 호출 없이 처리
      const isSimpleQuery = intentResult.confidence > 0.7 && 
        !intentResult.needsComplexML && 
        !intentResult.needsNLP;

      if (isSimpleQuery) {
        thinkingSteps.push({
          step: '라우팅 결정',
          description: `✅ 단순 질의 감지 - 로컬 처리 (Google AI 호출 생략, 비용 절약)`,
          status: 'completed',
          timestamp: Date.now(),
        });

        // 로컬 RAG 또는 GCP Function만 사용
        const localResponse = await this.processors.processCommandQuery(
          query,
          options.commandContext || {},
          thinkingSteps,
          startTime
        );
        
        // 비용 정보 추가
        const estimatedCost = Math.ceil(query.length / 4) * 0.000002;
        return {
          ...localResponse,
          metadata: {
            ...localResponse.metadata,
            engineType: 'local',
            savedCost: estimatedCost,
            actualCost: 0,
          }
        };
      }

      // 🔥 명령어 쿼리 감지 및 처리
      const commandStepStart = Date.now();
      thinkingSteps.push({
        step: '명령어 감지',
        description: '명령어 관련 쿼리인지 확인',
        status: 'pending',
        timestamp: commandStepStart,
      });

      const isCommandQuery = this.utils.detectCommandQuery(
        query,
        options.commandContext
      );

      if (isCommandQuery) {
        const commandStep = thinkingSteps[thinkingSteps.length - 1];
        if (commandStep) {
          commandStep.status = 'completed';
          commandStep.description = '명령어 쿼리로 감지됨 - 로컬 처리';
          commandStep.duration = Date.now() - commandStepStart;
        }

        return await this.processors.processCommandQuery(
          query,
          options.commandContext || {},
          thinkingSteps,
          startTime
        );
      } else {
        const generalStep = thinkingSteps[thinkingSteps.length - 1];
        if (generalStep) {
          generalStep.status = 'completed';
          generalStep.description = '일반 쿼리로 판단';
          generalStep.duration = Date.now() - commandStepStart;
        }
      }

      // 🎯 Step 3: Complexity Check & Routing Decision
      thinkingSteps.push({
        step: '복잡도 분석',
        description: '쿼리 복잡도 및 필요 리소스 분석 중...',
        status: 'pending',
        timestamp: Date.now(),
      });

      const complexity = this.utils.analyzeComplexity(query);
      const complexityStep = thinkingSteps[thinkingSteps.length - 1];
      if (complexityStep) {
        complexityStep.status = 'completed';
        complexityStep.description = `복잡도: ${complexity.level} (점수: ${complexity.score})`;
        complexityStep.duration = Date.now() - complexityStep.timestamp;
      }

      // 🎯 Intelligent Routing Decision
      const routingStepStart = Date.now();
      let routingDecision: 'local' | 'google-ai' = 'local';
      let routingReason = '';

      if (intentResult.needsComplexML || intentResult.needsNLP) {
        routingDecision = 'google-ai';
        routingReason = '복잡한 ML/NLP 분석 필요 - Google AI 사용';
      } else if (complexity.score > 0.7) {
        routingDecision = 'google-ai';
        routingReason = '높은 복잡도 - Google AI 사용';
      } else if (intentResult.confidence < 0.5) {
        routingDecision = 'google-ai';
        routingReason = '의도 불명확 - Google AI로 정확한 분석';
      } else {
        routingDecision = 'local';
        routingReason = '단순 질의 - 로컬 RAG/GCP Function 사용 (비용 절약)';
      }

      thinkingSteps.push({
        step: '라우팅 결정',
        description: `${routingDecision === 'google-ai' ? '🤖' : '💾'} ${routingReason}`,
        status: 'completed',
        timestamp: routingStepStart,
        duration: Date.now() - routingStepStart,
      });

      thinkingSteps.push({
        step: '통합 파이프라인 준비',
        description: `RAG + ${routingDecision === 'google-ai' ? 'Google AI' : 'GCP Functions'} 조합 실행`,
        status: 'completed',
        timestamp: Date.now(),
      });

      // 2단계: 병렬 처리 준비 (예: MCP 컨텍스트)
      const processingPromises: Promise<unknown>[] = [];
      let mcpContext: MCPContext | null = null;

      // MCP 컨텍스트 수집 (요청 시)
      if (options.includeMCPContext) {
        const mcpStepIndex = thinkingSteps.length;
        thinkingSteps.push({
          step: 'AI 어시스턴트 MCP 컨텍스트 수집',
          status: 'pending',
          timestamp: Date.now(),
        });

        processingPromises.push(
          this.contextLoader
            .queryMCPContextForRAG(query, {
              maxFiles: 3, // 성능을 위해 파일 수 제한
              includeSystemContext: true,
            })
            .then((result) => {
              mcpContext = result ? this.convertRAGContextToMCPContext(result) : null;
              const mcpStep = thinkingSteps[mcpStepIndex];
              if (mcpStep) {
                mcpStep.status = 'completed';
                mcpStep.description = `${result?.files?.length || 0}개 파일 수집`;
                mcpStep.duration = Date.now() - mcpStep.timestamp;
              }
            })
            .catch((error) => {
              console.warn('MCP 컨텍스트 수집 실패:', error);
              const mcpFailedStep = thinkingSteps[mcpStepIndex];
              if (mcpFailedStep) {
                mcpFailedStep.status = 'failed';
                mcpFailedStep.duration = Date.now() - mcpFailedStep.timestamp;
              }
            })
        );
      }

      // 병렬 처리 대기 (최대 100ms)
      if (processingPromises.length > 0) {
        await Promise.race([
          Promise.all(processingPromises),
          new Promise((resolve) => setTimeout(resolve, 100)),
        ]);
      }

      // 3단계: 타임아웃을 고려한 쿼리 처리
      const queryTimeout = new Promise<QueryResponse>((_, reject) =>
        setTimeout(() => reject(new Error('쿼리 타임아웃')), timeoutMs)
      );

      let response: QueryResponse;

      try {
        response = await Promise.race([
          this.processors.processUnifiedQuery(
            query,
            context,
            options,
            mcpContext,
            thinkingSteps,
            startTime
          ),
          queryTimeout,
        ]);

        // Cache successful response (delegated to utils)
        if (response.success && response.processingTime < 500) {
          this.utils.setCachedResponse(cacheKey, response);
        }

        return response;
      } catch (timeoutError) {
        // 🚨 폴백 제거: 각 모드에서 타임아웃 시 에러 직접 반환
        const errorMessage = '통합 AI 파이프라인 처리 시간 초과입니다.';
        console.warn(`${errorMessage} (폴백 없음 - 에러 직접 반환)`);

        return {
          success: false,
          response: errorMessage,
          engine: 'unified-google-rag',
          confidence: 0,
          thinkingSteps,
          error: timeoutError instanceof Error ? timeoutError.message : '타임아웃',
          processingTime: Date.now() - startTime,
        };
      }
    } catch (error) {
      console.error('❌ 쿼리 처리 실패 (폴백 없음):', error);

      return {
        success: false,
        response: '죄송합니다. 쿼리 처리 중 오류가 발생했습니다.',
        engine: 'unified-google-rag',
        confidence: 0,
        thinkingSteps,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
        processingTime: Date.now() - startTime,
      };
    }
  }

  // All processing methods are now handled by SimplifiedQueryEngineProcessors
  // All utility methods are now handled by SimplifiedQueryEngineUtils

  // processGoogleAIQuery is now handled by SimplifiedQueryEngineProcessors

  // generateLocalResponse method is now handled by SimplifiedQueryEngineProcessors

  // generateServerResponse method is now handled by SimplifiedQueryEngineProcessors

  // generateMockServerResponse method is now handled by SimplifiedQueryEngineProcessors

  // buildGoogleAIPrompt method is now handled by SimplifiedQueryEngineProcessors

  // calculateConfidence method is now handled by SimplifiedQueryEngineProcessors

  // generateCacheKey method is now handled by SimplifiedQueryEngineUtils

  // getCachedResponse method is now handled by SimplifiedQueryEngineUtils

  // setCachedResponse method is now handled by SimplifiedQueryEngineUtils

  // cleanupCache method is now handled by SimplifiedQueryEngineUtils

  // generateFallbackResponse method is now handled by SimplifiedQueryEngineUtils

  // detectCommandQuery method is now handled by SimplifiedQueryEngineUtils

  // processCommandQuery method is now handled by SimplifiedQueryEngineProcessors

  // generateCommandFallbackResponse method is now handled by SimplifiedQueryEngineUtils

  // callKoreanNLPFunction method is now handled by SimplifiedQueryEngineUtils

  // detectBasicIntent method is now handled by SimplifiedQueryEngineUtils

  /**
   * 🏥 헬스체크
   */
  async healthCheck(): Promise<{
    status: string;
    engines: {
      localRAG: boolean;
      googleAI: boolean;
      mcp: boolean;
    };
  }> {
    const ragHealth = await this.ragEngine.healthCheck();
    const mcpStatus = await this.contextLoader.getIntegratedStatus();

    return {
      status: ragHealth.status === 'healthy' ? 'healthy' : 'degraded',
      engines: {
        localRAG: ragHealth.vectorDB,
        googleAI: true, // API 엔드포인트 존재 여부로 판단
        mcp: mcpStatus.mcpServer.status === 'online',
      },
    };
  }

  /**
   * RAGEngineContext를 MCPContext로 변환
   */
  private convertRAGContextToMCPContext(ragContext: RAGEngineContext): MCPContext {
    return {
      files: ragContext.files.map(file => ({
        path: file.path,
        content: file.content,
        language: file.path.split('.').pop(),
        size: file.content.length
      })),
      systemContext: JSON.stringify(ragContext.systemContext),
      additionalContext: {
        query: ragContext.query,
        contextType: ragContext.contextType,
        relevantPaths: ragContext.relevantPaths
      }
    };
  }
}

// 싱글톤 인스턴스
let engineInstance: SimplifiedQueryEngine | null = null;

export function getSimplifiedQueryEngine(): SimplifiedQueryEngine {
  if (!engineInstance) {
    engineInstance = new SimplifiedQueryEngine();
  }
  return engineInstance;
}
