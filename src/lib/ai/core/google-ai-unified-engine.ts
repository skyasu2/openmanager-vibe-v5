/**
 * 🤖 Google AI Unified Engine
 *
 * 핵심 역할:
 * 1. Provider 오케스트레이션 (RAG, ML, Rule)
 * 2. Google AI API 통합
 * 3. 시나리오 기반 라우팅
 * 4. 캐싱 및 성능 최적화
 *
 * 아키텍처 원칙:
 * - Google AI API = 설명·요약·보고서 생성
 * - Cloud Functions = 전처리·ML·룰 기반 처리
 * - Provider = 컨텍스트 제공자 (RAG/ML/Rule)
 */

import type {
  IUnifiedEngine,
  UnifiedQueryRequest,
  UnifiedQueryResponse,
  ProviderContexts,
  IContextProvider,
  EngineHealthStatus,
  EngineConfig,
  ThinkingStep,
  GoogleAIPrompt,
} from './types';

import { GoogleAIError } from './types';

// Provider imports
import { RAGProvider } from '../providers/rag-provider';
import { MLProvider } from '../providers/ml-provider';
import { KoreanNLPProvider } from '../providers/korean-nlp-provider';

// PromptBuilder import
import { promptBuilder } from './prompt-builder';

// Usage Tracker import (할당량 보호)
import { getGoogleAIUsageTracker } from '@/services/ai/GoogleAIUsageTracker';
import type { GoogleAIModel } from '@/services/ai/QueryDifficultyAnalyzer';

// ============================================================================
// Cache Entry
// ============================================================================

interface CacheEntry {
  response: UnifiedQueryResponse;
  timestamp: number;
}

// ============================================================================
// Google AI Unified Engine
// ============================================================================

export class GoogleAiUnifiedEngine implements IUnifiedEngine {
  // Provider 관리
  private providers: Map<string, IContextProvider>;

  // 캐시
  private cache = new Map<string, CacheEntry>();
  private readonly cacheTTL: number;

  // 설정
  private config: EngineConfig;

  // 통계
  private stats = {
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    errors: 0,
  };

  // 할당량 추적기 (429 에러 방지)
  private usageTracker = getGoogleAIUsageTracker();

  constructor(config?: Partial<EngineConfig>) {
    // 기본 설정
    this.config = {
      model: config?.model || 'gemini-2.0-flash-lite',
      temperature: config?.temperature ?? 0.7,
      maxTokens: config?.maxTokens || 2048,
      timeout: config?.timeout || 30000,
      cache: {
        enabled: config?.cache?.enabled ?? true,
        ttl: config?.cache?.ttl || 5 * 60 * 1000, // 5분
        maxSize: config?.cache?.maxSize || 100,
      },
      providers: {
        rag: {
          enabled: config?.providers?.rag?.enabled ?? true,
          maxResults: config?.providers?.rag?.maxResults || 5,
          threshold: config?.providers?.rag?.threshold || 0.7,
        },
        ml: {
          enabled: config?.providers?.ml?.enabled ?? true,
          models: config?.providers?.ml?.models || [
            'anomaly-detection',
            'trend-analysis',
          ],
        },
        rule: {
          enabled: config?.providers?.rule?.enabled ?? true,
          confidenceThreshold:
            config?.providers?.rule?.confidenceThreshold || 0.6,
        },
      },
      enableMcp: config?.enableMcp ?? false,
    };

    this.cacheTTL = this.config.cache.ttl;

    // Provider 초기화
    this.providers = new Map<
      string,
      RAGProvider | MLProvider | KoreanNLPProvider
    >([
      ['rag', new RAGProvider()],
      ['ml', new MLProvider()],
      ['rule', new KoreanNLPProvider()], // Korean NLP = Rule Provider
    ]);
  }

  /**
   * 메인 쿼리 처리 메서드
   */
  async query(request: UnifiedQueryRequest): Promise<UnifiedQueryResponse> {
    const startTime = Date.now();
    const thinkingSteps: ThinkingStep[] = [];

    try {
      this.stats.totalRequests++;

      // Step 1: 캐시 확인
      if (this.config.cache.enabled && request.options?.cached !== false) {
        const cached = this.getFromCache(request);
        if (cached) {
          this.stats.cacheHits++;
          return {
            ...cached.response,
            metadata: {
              ...cached.response.metadata,
              cacheHit: true,
              processingTime: Date.now() - startTime,
            },
          };
        }
      }
      this.stats.cacheMisses++;

      // Step 2: 시나리오 기반 Provider 활성화 결정
      thinkingSteps.push({
        step: 'provider-selection',
        description: `시나리오 "${request.scenario}"에 맞는 Provider 선택`,
        status: 'completed',
        timestamp: Date.now(),
        duration: Date.now() - startTime,
      });

      const enabledProviders = this.selectProviders(request);

      // Step 3: 병렬 컨텍스트 수집
      const contextStartTime = Date.now();
      thinkingSteps.push({
        step: 'context-collection',
        description: `${enabledProviders.length}개 Provider에서 컨텍스트 수집`,
        status: 'pending',
        timestamp: Date.now(),
      });

      const contexts = await this.collectContexts(request, enabledProviders);

      const lastContextStep = thinkingSteps[thinkingSteps.length - 1];
      if (lastContextStep) {
        lastContextStep.status = 'completed';
        lastContextStep.duration = Date.now() - contextStartTime;
      }

      // Step 4: 프롬프트 생성
      const promptStartTime = Date.now();
      thinkingSteps.push({
        step: 'prompt-generation',
        description: '컨텍스트 기반 프롬프트 생성',
        status: 'pending',
        timestamp: Date.now(),
      });

      const prompt = this.buildPrompt(request, contexts);

      const lastPromptStep = thinkingSteps[thinkingSteps.length - 1];
      if (lastPromptStep) {
        lastPromptStep.status = 'completed';
        lastPromptStep.duration = Date.now() - promptStartTime;
      }

      // 🛡️ 할당량 보호 로직 - API 호출 전 체크
      let selectedModel = this.config.model as GoogleAIModel;

      if (!this.usageTracker.canUseModel(selectedModel)) {
        console.warn(
          `⚠️ [GoogleAiUnifiedEngine] ${selectedModel} 할당량 초과, 대체 모델 확인 중...`
        );

        // 사용 가능한 대체 모델 찾기
        const availableModels = this.usageTracker.getAvailableModels();

        if (availableModels.length === 0) {
          // 모든 모델 할당량 초과 - 에러 반환
          const errorMsg =
            'Google AI 모든 모델의 할당량이 초과되었습니다. 잠시 후 다시 시도해주세요.';
          console.error(`❌ [GoogleAiUnifiedEngine] ${errorMsg}`);
          throw new GoogleAIError(errorMsg);
        }

        // 첫 번째 사용 가능한 모델로 전환
        const fallbackModel = availableModels.at(0);
        if (!fallbackModel) {
          throw new GoogleAIError(
            'Internal error: availableModels array is empty after length check'
          );
        }

        console.log(
          `✅ [GoogleAiUnifiedEngine] 대체 모델 사용: ${selectedModel} → ${fallbackModel}`
        );
        selectedModel = fallbackModel;
        this.config.model = selectedModel;
      }

      // Step 5: Google AI API 호출
      const aiStartTime = Date.now();
      thinkingSteps.push({
        step: 'google-ai-call',
        description: `${this.config.model} 모델 호출`,
        status: 'pending',
        timestamp: Date.now(),
      });

      const aiResponse = await this.callGoogleAI(
        prompt,
        request.options?.temperature
      );
      const aiLatency = Date.now() - aiStartTime;
      const tokensUsed = this.estimateTokens(
        prompt.systemInstruction + prompt.userMessage + aiResponse
      );

      // 📊 사용량 추적 (할당량 관리)
      this.usageTracker.recordUsage({
        model: selectedModel,
        timestamp: Date.now(),
        requestCount: 1,
        tokenCount: tokensUsed,
        latency: aiLatency,
        success: true,
      });

      const lastAIStep = thinkingSteps[thinkingSteps.length - 1];
      if (lastAIStep) {
        lastAIStep.status = 'completed';
        lastAIStep.duration = Date.now() - aiStartTime;
      }

      // Step 6: 응답 생성
      const response: UnifiedQueryResponse = {
        success: true,
        response: aiResponse,
        scenario: request.scenario,
        metadata: {
          engine: 'google-ai-unified',
          model: this.config.model,
          tokensUsed,
          processingTime: Date.now() - startTime,
          cacheHit: false,
          providersUsed: enabledProviders.map((p) => p.name),
          timestamp: new Date(),
        },
        contexts: this.sanitizeContexts(contexts),
        thinkingSteps: request.options?.includeThinking
          ? thinkingSteps
          : undefined,
      };

      // Step 7: 캐시 저장
      if (this.config.cache.enabled) {
        this.setCache(request, response);
      }

      return response;
    } catch (error) {
      this.stats.errors++;

      // 에러를 ThinkingStep으로 기록
      if (thinkingSteps.length > 0) {
        const lastStep = thinkingSteps[thinkingSteps.length - 1];
        if (lastStep && lastStep.status === 'pending') {
          lastStep.status = 'failed';
          lastStep.error =
            error instanceof Error ? error.message : String(error);
        }
      }

      return {
        success: false,
        response: '',
        scenario: request.scenario,
        metadata: {
          engine: 'google-ai-unified',
          model: this.config.model,
          tokensUsed: 0,
          processingTime: Date.now() - startTime,
          cacheHit: false,
          providersUsed: [],
          timestamp: new Date(),
        },
        thinkingSteps: request.options?.includeThinking
          ? thinkingSteps
          : undefined,
        error:
          error instanceof Error
            ? error.message
            : '알 수 없는 오류가 발생했습니다',
      };
    }
  }

  /**
   * Provider 선택 (시나리오 기반)
   */
  private selectProviders(request: UnifiedQueryRequest): IContextProvider[] {
    const providers: IContextProvider[] = [];

    for (const [_key, provider] of this.providers.entries()) {
      // 1. Provider가 시나리오에 활성화되어 있는지 확인
      if (!provider.isEnabled(request.scenario)) {
        continue;
      }

      // 2. 사용자 옵션 확인 (수동 비활성화)
      if (_key === 'rag' && request.options?.enableRAG === false) continue;
      if (_key === 'ml' && request.options?.enableML === false) continue;
      if (_key === 'rule' && request.options?.enableRules === false) continue;

      // 3. 엔진 설정 확인 (전역 비활성화)
      if (_key === 'rag' && !this.config.providers.rag.enabled) continue;
      if (_key === 'ml' && !this.config.providers.ml.enabled) continue;
      if (_key === 'rule' && !this.config.providers.rule.enabled) continue;

      providers.push(provider);
    }

    return providers;
  }

  /**
   * 병렬 컨텍스트 수집
   */
  private async collectContexts(
    request: UnifiedQueryRequest,
    providers: IContextProvider[]
  ): Promise<ProviderContexts> {
    const contexts: ProviderContexts = {};

    // 병렬 실행
    const results = await Promise.allSettled(
      providers.map((provider) =>
        provider.getContext(request.query, {
          maxResults: this.config.providers.rag.maxResults,
          threshold: this.config.providers.rag.threshold,
          timeoutMs: this.config.timeout,
          ...request.options,
        })
      )
    );

    // 결과 수집
    providers.forEach((provider, index) => {
      const result = results[index];
      if (result && result.status === 'fulfilled') {
        const context = result.value;
        if (context.type === 'rag') contexts.rag = context;
        if (context.type === 'ml') contexts.ml = context;
        if (context.type === 'rule') contexts.rule = context;
      } else if (result && result.status === 'rejected') {
        console.warn(
          `[GoogleAiUnifiedEngine] Provider ${provider.name} failed:`,
          result.reason
        );
      }
    });

    return contexts;
  }

  /**
   * 프롬프트 생성 (PromptBuilder 사용)
   */
  private buildPrompt(
    request: UnifiedQueryRequest,
    contexts: ProviderContexts
  ): GoogleAIPrompt {
    return promptBuilder.build(
      {
        query: request.query,
        contexts,
        options: request.options,
      },
      request.scenario
    );
  }

  /**
   * Google AI API 호출 (GoogleAIPrompt 사용)
   */
  private async callGoogleAI(
    prompt: GoogleAIPrompt,
    temperature?: number
  ): Promise<string> {
    const apiKey =
      process.env.GOOGLE_AI_API_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;

    if (!apiKey) {
      throw new GoogleAIError(
        'Google AI API 키가 설정되지 않았습니다. GOOGLE_AI_API_KEY 환경변수를 확인하세요.'
      );
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.config.model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: prompt.systemInstruction }],
            },
            contents: [
              {
                role: 'user',
                parts: [{ text: prompt.userMessage }],
              },
            ],
            generationConfig: {
              temperature: temperature ?? this.config.temperature,
              maxOutputTokens: this.config.maxTokens,
            },
          }),
          signal: AbortSignal.timeout(this.config.timeout),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new GoogleAIError(
          `Google AI API 오류: ${response.status}`,
          response.status,
          errorText
        );
      }

      const data = await response.json();

      if (!data.candidates || data.candidates.length === 0) {
        throw new GoogleAIError(
          'Google AI API 응답에 결과가 없습니다.',
          undefined,
          data
        );
      }

      const candidate = data.candidates[0];
      const text = candidate.content?.parts?.[0]?.text;

      if (!text) {
        throw new GoogleAIError(
          'Google AI API 응답에 텍스트가 없습니다.',
          undefined,
          data
        );
      }

      return text;
    } catch (error) {
      if (error instanceof GoogleAIError) {
        throw error;
      }

      throw new GoogleAIError(
        error instanceof Error ? error.message : 'Google AI API 호출 실패',
        undefined,
        error
      );
    }
  }

  /**
   * 토큰 수 추정 (간단한 버전)
   */
  private estimateTokens(text: string): number {
    // 간단한 추정: 1 토큰 ≈ 4 글자
    return Math.ceil(text.length / 4);
  }

  /**
   * 컨텍스트 정리 (민감한 정보 제거)
   */
  private sanitizeContexts(contexts: ProviderContexts): ProviderContexts {
    // 현재는 그대로 반환, 향후 필요 시 민감한 정보 제거 로직 추가
    return contexts;
  }

  /**
   * 캐시 키 생성
   */
  private getCacheKey(request: UnifiedQueryRequest): string {
    const normalized = request.query.trim().toLowerCase();
    const scenarioNormalized = request.scenario.toLowerCase();
    return `unified:${scenarioNormalized}:${normalized}`;
  }

  /**
   * 캐시 조회
   */
  private getFromCache(request: UnifiedQueryRequest): CacheEntry | null {
    const key = this.getCacheKey(request);
    const cached = this.cache.get(key);

    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }

    // LRU: 캐시 히트 시 최신 항목으로 갱신 (재삽입)
    this.cache.delete(key);
    this.cache.set(key, cached);

    return cached;
  }

  /**
   * 캐시 저장
   */
  private setCache(
    request: UnifiedQueryRequest,
    response: UnifiedQueryResponse
  ): void {
    const cacheKey = this.getCacheKey(request);
    this.cache.set(cacheKey, { response, timestamp: Date.now() });

    // 캐시 크기 제한
    if (this.cache.size > this.config.cache.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
  }

  /**
   * 헬스 체크
   */
  async healthCheck(): Promise<EngineHealthStatus> {
    const providers: Array<{
      name: string;
      type: 'rag' | 'ml' | 'rule';
      healthy: boolean;
      responseTime?: number;
      error?: string;
    }> = [];

    // Provider 상태 확인 (간단한 테스트 쿼리)
    for (const [_key, provider] of this.providers.entries()) {
      const startTime = Date.now();
      try {
        await provider.getContext('health check', { timeoutMs: 5000 });
        providers.push({
          name: provider.name,
          type: provider.type,
          healthy: true,
          responseTime: Date.now() - startTime,
        });
      } catch (error) {
        providers.push({
          name: provider.name,
          type: provider.type,
          healthy: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Google AI 상태 확인
    let googleAIStatus: {
      available: boolean;
      latency?: number;
      error?: string;
    };
    const aiStartTime = Date.now();
    try {
      await this.callGoogleAI({
        systemInstruction: 'Health check',
        userMessage: 'ping',
        estimatedTokens: 10,
      });
      googleAIStatus = {
        available: true,
        latency: Date.now() - aiStartTime,
      };
    } catch (error) {
      googleAIStatus = {
        available: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }

    // 캐시 통계
    const hitRate =
      this.stats.totalRequests > 0
        ? this.stats.cacheHits / this.stats.totalRequests
        : 0;

    return {
      healthy: providers.every((p) => p.healthy) && googleAIStatus.available,
      message:
        providers.every((p) => p.healthy) && googleAIStatus.available
          ? 'All systems operational'
          : 'Some systems are unavailable',
      providers,
      googleAIStatus,
      cacheStatus: {
        hitRate,
        size: this.cache.size,
        maxSize: this.config.cache.maxSize,
      },
      timestamp: new Date(),
    };
  }

  /**
   * 엔진 설정 업데이트
   */
  configure(config: Partial<EngineConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      cache: { ...this.config.cache, ...config.cache },
      providers: {
        rag: { ...this.config.providers.rag, ...config.providers?.rag },
        ml: { ...this.config.providers.ml, ...config.providers?.ml },
        rule: { ...this.config.providers.rule, ...config.providers?.rule },
      },
    };
  }

  /**
   * 통계 조회
   */
  getStats() {
    return {
      ...this.stats,
      hitRate:
        this.stats.totalRequests > 0
          ? this.stats.cacheHits / this.stats.totalRequests
          : 0,
    };
  }
}
