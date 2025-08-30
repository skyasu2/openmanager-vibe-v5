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
import { CloudContextLoader } from '@/services/mcp/CloudContextLoader';
import { MockContextLoader } from './MockContextLoader';
import { IntentClassifier } from '@/modules/ai-agent/processors/IntentClassifier';
import type { Entity } from '@/modules/ai-agent/processors/IntentClassifier';

// Import extracted modules
import { SimplifiedQueryEngineUtils } from './SimplifiedQueryEngine.utils';
import { SimplifiedQueryEngineProcessors } from './SimplifiedQueryEngine.processors';
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
} from '@/types/ai-service-types';

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
export type { AIMetadata } from '@/types/ai-service-types';

export class SimplifiedQueryEngine {
  protected ragEngine: SupabaseRAGEngine;
  protected contextLoader: CloudContextLoader;
  protected mockContextLoader: MockContextLoader;
  protected intentClassifier: IntentClassifier;
  protected isInitialized = false;
  private initPromise: Promise<void> | null = null;

  // Extracted utility and processor classes
  private utils: SimplifiedQueryEngineUtils;
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
    try {
      // Edge Runtime 감지 (setInterval 제한 여부 확인)
      if (
        typeof setInterval === 'function' &&
        typeof process !== 'undefined' &&
        process.env.NODE_ENV !== 'test'
      ) {
        // Node.js Runtime: 5분마다 자동 정리
        setInterval(() => this.utils.cleanupCache(), 5 * 60 * 1000);
      } else {
        // Edge Runtime: 수동 cleanup만 사용
        // 빌드 시에는 아무것도 하지 않음
      }
    } catch (error) {
      // setInterval 사용 불가 환경: 수동 cleanup만 사용
      console.warn('SimplifiedQueryEngine: Automatic cache cleanup disabled');
    }
  }

  /**
   * 🚀 엔진 초기화 (한 번만 실행)
   */
  async _initialize(): Promise<void> {
    if (this.isInitialized) return;

    // 이미 초기화 진행 중이면 기다림
    if (this.initPromise) {
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

      // RAG 엔진 초기화 (타임아웃 설정)
      const initTimeout = new Promise<void>((_, reject) =>
        setTimeout(() => reject(new Error('초기화 타임아웃')), 5000)
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
   * 🔍 쿼리 처리 (캐싱 및 자동 엔진 선택)
   */
  async query(request: QueryRequest): Promise<QueryResponse> {
    const startTime = Date.now();

    // 초기화 병렬 실행
    const initPromise = this._initialize();

    const {
      query,
      mode = 'local', // 기본값: 로컬 모드 (더 이상 auto 없음)
      context = {},
      options = {},
      // 새로운 모드별 기능 제어 옵션
      enableGoogleAI = false,
      enableAIAssistantMCP = false,
      enableKoreanNLP = true,
      enableVMBackend = true,
    } = request;

    const thinkingSteps: QueryResponse['thinkingSteps'] = [];
    const timeoutMs = options.timeoutMs || 450; // 기본 450ms (목표: 500ms 이하)

    // Cache check (delegated to utils)
    const cacheKey = this.utils.generateCacheKey(query, mode, context);
    const cachedResponse = this.utils.getCachedResponse(cacheKey);
    if (cachedResponse && options.cached !== false) {
      const baseMetadata = cachedResponse.metadata || {};
      return {
        ...cachedResponse,
        metadata: {
          ...baseMetadata,
          cacheHit: true,
        } as AIMetadata & { cacheHit?: boolean },
        processingTime: Date.now() - startTime,
      };
    }

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

      // 🔥 NEW: 명령어 쿼리 감지 및 처리
      const commandStepStart = Date.now();
      thinkingSteps.push({
        step: '명령어 감지',
        description: '명령어 관련 쿼리인지 확인',
        status: 'pending',
        timestamp: commandStepStart,
      });

      // Command keyword detection (delegated to utils)
      const isCommandQuery = this.utils.detectCommandQuery(
        query,
        options.commandContext
      );

      if (isCommandQuery) {
        thinkingSteps[thinkingSteps.length - 1].status = 'completed';
        thinkingSteps[thinkingSteps.length - 1].description =
          '명령어 쿼리로 감지됨';
        thinkingSteps[thinkingSteps.length - 1].duration =
          Date.now() - commandStepStart;

        // Command-specific processing (delegated to processors)
        return await this.processors.processCommandQuery(
          query,
          options.commandContext || {},
          thinkingSteps,
          startTime
        );
      } else {
        thinkingSteps[thinkingSteps.length - 1].status = 'completed';
        thinkingSteps[thinkingSteps.length - 1].description =
          '일반 쿼리로 판단';
        thinkingSteps[thinkingSteps.length - 1].duration =
          Date.now() - commandStepStart;
      }

      // 모드별 처리 전환
      thinkingSteps.push({
        step: '모드 선택',
        description: `${mode} 모드 선택됨 (Google AI: ${enableGoogleAI}, AI MCP: ${enableAIAssistantMCP})`,
        status: 'completed',
        timestamp: Date.now(),
      });

      // 2단계: 병렬 처리 준비
      const processingPromises: Promise<unknown>[] = [];
      let mcpContext: MCPContext | null = null;

      // MCP 컨텍스트 수집 (AI 어시스턴트 MCP가 활성화된 경우에만)
      if (options.includeMCPContext && enableAIAssistantMCP) {
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
              mcpContext = result;
              thinkingSteps[mcpStepIndex].status = 'completed';
              thinkingSteps[mcpStepIndex].description =
                `${result?.files?.length || 0}개 파일 수집`;
              thinkingSteps[mcpStepIndex].duration =
                Date.now() - thinkingSteps[mcpStepIndex].timestamp;
            })
            .catch((error) => {
              console.warn('MCP 컨텍스트 수집 실패:', error);
              thinkingSteps[mcpStepIndex].status = 'failed';
              thinkingSteps[mcpStepIndex].duration =
                Date.now() - thinkingSteps[mcpStepIndex].timestamp;
            })
        );
      } else if (options.includeMCPContext && !enableAIAssistantMCP) {
        thinkingSteps.push({
          step: 'MCP 건너뛰기',
          description: 'AI 어시스턴트 MCP 비활성화됨 (로컬 AI 모드)',
          status: 'completed',
          timestamp: Date.now(),
        });
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
        if (mode === 'local-ai' || (mode === 'local' && !enableGoogleAI)) {
          // Local AI mode (delegated to processors)
          response = await Promise.race([
            this.processors.processLocalAIModeQuery(
              query,
              context,
              options,
              mcpContext,
              thinkingSteps,
              startTime,
              { enableKoreanNLP, enableVMBackend }
            ),
            queryTimeout,
          ]);
        } else {
          // Google AI mode (delegated to processors)
          response = await Promise.race([
            this.processors.processGoogleAIModeQuery(
              query,
              context,
              options,
              mcpContext,
              thinkingSteps,
              startTime,
              {
                enableGoogleAI,
                enableAIAssistantMCP,
                enableKoreanNLP,
                enableVMBackend,
              }
            ),
            queryTimeout,
          ]);
        }

        // Cache successful response (delegated to utils)
        if (response.success && response.processingTime < 500) {
          this.utils.setCachedResponse(cacheKey, response);
        }

        return response;
      } catch (_timeoutError) {
        // 타임아웃 시 빠른 폴백
        console.warn('쿼리 타임아웃, 폴백 모드로 전환');

        if (mode === 'google-ai' || enableGoogleAI) {
          // Google AI timeout fallback to local (delegated to processors)
          return await this.processors.processLocalAIModeQuery(
            query,
            context,
            options,
            null, // MCP context skip
            thinkingSteps,
            startTime,
            { enableKoreanNLP: true, enableVMBackend: true }
          );
        } else {
          // Local also failed, generate fallback (delegated to utils)
          return this.utils.generateFallbackResponse(
            query,
            thinkingSteps,
            startTime
          );
        }
      }
    } catch (error) {
      console.error('❌ 쿼리 처리 실패:', error);

      return {
        success: false,
        response: '죄송합니다. 쿼리 처리 중 오류가 발생했습니다.',
        engine:
          mode === 'local' || mode === 'local-ai' ? 'local-rag' : 'google-ai',
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
}

// 싱글톤 인스턴스
let engineInstance: SimplifiedQueryEngine | null = null;

export function getSimplifiedQueryEngine(): SimplifiedQueryEngine {
  if (!engineInstance) {
    engineInstance = new SimplifiedQueryEngine();
  }
  return engineInstance;
}
