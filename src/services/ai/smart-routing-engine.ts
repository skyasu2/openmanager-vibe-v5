/**
 * SmartRoutingEngine - 다차원 AI 라우팅 엔진
 *
 * 복잡도, 토큰 가용성, 기능 요구사항 등 다양한 조건을 고려하여
 * 최적의 AI 모델과 기능 조합을 결정합니다.
 *
 * @author OpenManager VIBE
 * @since v5.80.0
 */

import {
  checkGoogleAIRateLimit,
  getGoogleAIKey,
} from '../../lib/ai/google-ai-manager';
import {
  checkGroqAIRateLimit,
  type GroqModel,
  getGroqAIRateLimitStatus,
  isGroqAIAvailable,
} from '../../lib/ai/groq-ai-manager';
import {
  type AIModel,
  type AIProviderStatus,
  type CircuitState,
  COMPLEXITY_TOKEN_MAP,
  DEFAULT_CIRCUIT_BREAKER_CONFIG,
  DEFAULT_SCORE_WEIGHTS,
  type EnhancedRoutingDecision,
  type FeatureRequirements,
  INTENT_FEATURE_MAP,
  type LoadBalanceStrategy,
  MODEL_CAPABILITIES,
  MODEL_SPECIALIZATION,
  type ModelHealth,
  type ModelLoadState,
  type QueryAnalysis,
  type RateLimitStatus,
  type RouteScore,
  type RoutingContext,
  type RoutingDecision,
  type RoutingPreferences,
  type ScoreWeights,
  type TaskType,
} from '../../types/ai/routing-types';
import type { QueryIntent } from '../../types/rag/rag-types';

// ============================================================================
// 토큰 추정 유틸리티
// ============================================================================

/**
 * 문자열의 토큰 수 추정 (한국어 고려)
 * 한국어는 영어보다 토큰당 문자 수가 적음
 */
function estimateTokenCount(text: string): number {
  const koreanChars = (text.match(/[\uAC00-\uD7AF]/g) || []).length;
  const otherChars = text.length - koreanChars;
  // 한국어: ~1.5 tokens per char, 영어: ~0.25 tokens per char
  return Math.ceil(koreanChars * 1.5 + otherChars * 0.25);
}

/**
 * 복잡도 기반 예상 응답 토큰 계산
 */
function estimateResponseTokens(complexity: number): number {
  const baseTokens = [256, 512, 1024, 2048, 4096];
  return baseTokens[Math.min(complexity - 1, 4)] ?? 1024;
}

// ============================================================================
// SmartRoutingEngine
// ============================================================================

export class SmartRoutingEngine {
  private static instance: SmartRoutingEngine;

  // ============================================================================
  // Circuit Breaker State (Best Practice #3)
  // ============================================================================
  private modelHealth = new Map<AIModel, ModelHealth>();
  private modelLoads = new Map<AIModel, ModelLoadState>();
  private lastSelectedModel: AIModel | null = null;
  private loadBalanceStrategy: LoadBalanceStrategy = 'adaptive';
  private scoreWeights: ScoreWeights = DEFAULT_SCORE_WEIGHTS;

  // 지원 모델 목록
  private readonly ALL_MODELS: AIModel[] = [
    'llama-3.1-8b-instant',
    'llama-3.3-70b-versatile',
    'qwen-qwq-32b',
    'gemini-2.5-flash',
    'gemini-2.5-pro',
  ];

  private constructor() {
    // Circuit Breaker 초기화
    this.initializeModelHealth();
  }

  static getInstance(): SmartRoutingEngine {
    if (!SmartRoutingEngine.instance) {
      SmartRoutingEngine.instance = new SmartRoutingEngine();
    }
    return SmartRoutingEngine.instance;
  }

  // ============================================================================
  // Circuit Breaker 초기화 및 관리
  // ============================================================================

  private initializeModelHealth(): void {
    for (const model of this.ALL_MODELS) {
      this.modelHealth.set(model, {
        model,
        circuitState: 'closed',
        consecutiveFailures: 0,
        lastFailureTime: null,
        lastSuccessTime: null,
        avgLatencyMs: 1000,
        recentSuccessRate: 1.0,
      });

      this.modelLoads.set(model, {
        model,
        activeRequests: 0,
        tokensUsedLastMinute: 0,
        remainingCapacity: 1.0,
        estimatedWaitMs: 0,
      });
    }
  }

  /**
   * 모델 성공 기록 (Circuit Breaker)
   */
  recordSuccess(model: AIModel, latencyMs: number): void {
    const health = this.modelHealth.get(model);
    if (!health) return;

    const now = Date.now();
    const newAvgLatency = health.avgLatencyMs * 0.8 + latencyMs * 0.2; // EMA (Exponential Moving Average)

    this.modelHealth.set(model, {
      ...health,
      circuitState: 'closed',
      consecutiveFailures: 0,
      lastSuccessTime: now,
      avgLatencyMs: newAvgLatency,
      recentSuccessRate: Math.min(1.0, health.recentSuccessRate * 0.9 + 0.1),
    });
  }

  /**
   * 모델 실패 기록 (Circuit Breaker)
   */
  recordFailure(model: AIModel): void {
    const health = this.modelHealth.get(model);
    if (!health) return;

    const now = Date.now();
    const newFailures = health.consecutiveFailures + 1;
    const newSuccessRate = Math.max(0, health.recentSuccessRate * 0.9);

    // Circuit Open 조건 확인
    let newState: CircuitState = health.circuitState;
    if (newFailures >= DEFAULT_CIRCUIT_BREAKER_CONFIG.failureThreshold) {
      newState = 'open';
      console.warn(`⚠️ Circuit OPEN for ${model} after ${newFailures} failures`);
    }

    this.modelHealth.set(model, {
      ...health,
      circuitState: newState,
      consecutiveFailures: newFailures,
      lastFailureTime: now,
      recentSuccessRate: newSuccessRate,
    });
  }

  /**
   * Circuit 상태 확인 (Half-Open 전환 포함)
   */
  private getCircuitState(model: AIModel): CircuitState {
    const health = this.modelHealth.get(model);
    if (!health) return 'closed';

    // Open 상태에서 복구 시간 경과 시 Half-Open 전환
    if (health.circuitState === 'open' && health.lastFailureTime) {
      const elapsed = Date.now() - health.lastFailureTime;
      if (elapsed >= DEFAULT_CIRCUIT_BREAKER_CONFIG.recoveryTimeMs) {
        this.modelHealth.set(model, { ...health, circuitState: 'half-open' });
        console.log(`🔄 Circuit HALF-OPEN for ${model} (recovery attempt)`);
        return 'half-open';
      }
    }

    return health.circuitState;
  }

  /**
   * 모델 사용 가능 여부 (Circuit Breaker 기반)
   */
  isModelAvailable(model: AIModel): boolean {
    const state = this.getCircuitState(model);
    return state !== 'open';
  }

  // ============================================================================
  // RouteLLM-style 스코어링 시스템 (Best Practice #1)
  // ============================================================================

  /**
   * 모델별 라우팅 스코어 계산
   */
  calculateRouteScore(
    model: AIModel,
    taskType: TaskType,
    providerStatus: AIProviderStatus
  ): RouteScore {
    const capabilities = MODEL_CAPABILITIES[model];
    const health = this.modelHealth.get(model);
    const load = this.modelLoads.get(model);

    // 1. Quality Score (모델 고유 품질)
    const quality = capabilities.qualityScore;

    // 2. Cost Score (비용 효율)
    const cost = capabilities.costScore;

    // 3. Latency Score (응답 속도)
    const baseLatency = capabilities.speedScore;
    const healthLatencyPenalty = health
      ? Math.max(0, (health.avgLatencyMs - 1000) / 1000)
      : 0;
    const latency = Math.max(1, baseLatency - healthLatencyPenalty);

    // 4. Capability Score (태스크 적합성)
    const specializedModels = MODEL_SPECIALIZATION[taskType];
    const specializationRank = specializedModels.indexOf(model);
    const capability =
      specializationRank === -1 ? 5 : 10 - specializationRank * 2; // 1순위=10, 2순위=8, 3순위=6

    // 5. Availability Score (가용성)
    const circuitState = this.getCircuitState(model);
    let availability = 10;
    if (circuitState === 'open') availability = 0;
    else if (circuitState === 'half-open') availability = 5;
    if (health) availability *= health.recentSuccessRate;
    if (load) availability *= load.remainingCapacity;

    // Rate Limit 반영
    const rateStatus = this.getRateLimitForModel(model, providerStatus);
    if (!rateStatus.isAvailable) availability = 0;

    // 총점 (가중 평균)
    const total =
      quality * this.scoreWeights.quality +
      cost * this.scoreWeights.cost +
      latency * this.scoreWeights.latency +
      capability * this.scoreWeights.capability +
      availability * this.scoreWeights.availability;

    return {
      quality,
      cost,
      latency,
      capability,
      availability,
      total,
    };
  }

  /**
   * 모델별 Rate Limit 상태 조회 헬퍼
   */
  private getRateLimitForModel(
    model: AIModel,
    status: AIProviderStatus
  ): RateLimitStatus {
    switch (model) {
      case 'llama-3.1-8b-instant':
        return status.groq['8b'];
      case 'llama-3.3-70b-versatile':
        return status.groq['70b'];
      case 'qwen-qwq-32b':
        return status.groq['32b'];
      case 'gemini-2.5-flash':
        return status.google.flash;
      case 'gemini-2.5-pro':
        return status.google.pro;
      default:
        return {
          remainingRPM: 0,
          remainingRPD: 0,
          remainingTPM: 0,
          isAvailable: false,
        };
    }
  }

  // ============================================================================
  // Task-Based 라우팅 (Best Practice #2)
  // ============================================================================

  /**
   * 쿼리에서 태스크 타입 추론
   */
  detectTaskType(query: string, intent: QueryIntent | 'coding'): TaskType {
    const q = query.toLowerCase();

    // Intent 기반 매핑
    if (intent === 'coding') return 'coding';
    if (intent === 'analysis') return 'reasoning';

    // 키워드 기반 추가 감지
    if (
      q.includes('이미지') ||
      q.includes('사진') ||
      q.includes('스크린샷') ||
      q.includes('image')
    ) {
      return 'multimodal';
    }

    if (
      q.includes('코드') ||
      q.includes('구현') ||
      q.includes('프로그래밍') ||
      q.includes('함수') ||
      q.includes('클래스')
    ) {
      return 'coding';
    }

    if (
      q.includes('분석') ||
      q.includes('왜') ||
      q.includes('이유') ||
      q.includes('추론') ||
      q.includes('생각')
    ) {
      return 'reasoning';
    }

    if (
      q.includes('작성') ||
      q.includes('창작') ||
      q.includes('이야기') ||
      q.includes('시') ||
      q.includes('소설')
    ) {
      return 'creative';
    }

    if (
      q.includes('사실') ||
      q.includes('정보') ||
      q.includes('뭐야') ||
      q.includes('알려줘')
    ) {
      return 'factual';
    }

    if (intent === 'monitoring') return 'realtime';
    if (intent === 'guide') return 'factual';

    return 'general';
  }

  // ============================================================================
  // Load Balancing (Best Practice #4)
  // ============================================================================

  /**
   * 로드 밸런싱 기반 모델 선택
   */
  private selectModelWithLoadBalancing(
    candidates: AIModel[],
    scores: Map<AIModel, RouteScore>
  ): AIModel {
    if (candidates.length === 0) {
      throw new Error('No available models');
    }

    if (candidates.length === 1) {
      return candidates[0]!; // Safe: already checked length === 1
    }

    switch (this.loadBalanceStrategy) {
      case 'round-robin':
        return this.selectRoundRobin(candidates);

      case 'least-loaded':
        return this.selectLeastLoaded(candidates);

      case 'weighted-random':
        return this.selectWeightedRandom(candidates, scores);
      default:
        return this.selectAdaptive(candidates, scores);
    }
  }

  private selectRoundRobin(candidates: AIModel[]): AIModel {
    if (!this.lastSelectedModel) {
      this.lastSelectedModel = candidates[0]!;
      return candidates[0]!;
    }

    const lastIndex = candidates.indexOf(this.lastSelectedModel);
    const nextIndex = (lastIndex + 1) % candidates.length;
    this.lastSelectedModel = candidates[nextIndex]!;
    return candidates[nextIndex]!;
  }

  private selectLeastLoaded(candidates: AIModel[]): AIModel {
    let leastLoaded = candidates[0]!;
    let lowestLoad = Infinity;

    for (const model of candidates) {
      const load = this.modelLoads.get(model);
      if (load && load.activeRequests < lowestLoad) {
        lowestLoad = load.activeRequests;
        leastLoaded = model;
      }
    }

    return leastLoaded;
  }

  private selectWeightedRandom(
    candidates: AIModel[],
    scores: Map<AIModel, RouteScore>
  ): AIModel {
    const weights = candidates.map((m) => scores.get(m)?.total ?? 0);
    const totalWeight = weights.reduce((a, b) => a + b, 0);

    if (totalWeight === 0) return candidates[0]!; // Safe: candidates.length >= 1

    let random = Math.random() * totalWeight;
    for (let i = 0; i < candidates.length; i++) {
      random -= weights[i]!;
      if (random <= 0) return candidates[i]!; // Safe: i < candidates.length
    }

    return candidates[candidates.length - 1]!; // Safe: candidates.length >= 1
  }

  private selectAdaptive(
    candidates: AIModel[],
    scores: Map<AIModel, RouteScore>
  ): AIModel {
    // Adaptive: 스코어 최고 + 최근 성공률 가중
    let bestModel = candidates[0]!; // Safe: candidates.length >= 1
    let bestScore = -Infinity;

    for (const model of candidates) {
      const score = scores.get(model)?.total ?? 0;
      const health = this.modelHealth.get(model);
      const adjustedScore = score * (health?.recentSuccessRate ?? 1.0);

      if (adjustedScore > bestScore) {
        bestScore = adjustedScore;
        bestModel = model;
      }
    }

    return bestModel;
  }

  /**
   * 로드 밸런싱 전략 설정
   */
  setLoadBalanceStrategy(strategy: LoadBalanceStrategy): void {
    this.loadBalanceStrategy = strategy;
  }

  /**
   * 스코어 가중치 설정
   */
  setScoreWeights(weights: Partial<ScoreWeights>): void {
    this.scoreWeights = { ...this.scoreWeights, ...weights };
  }

  // ============================================================================
  // 공개 API
  // ============================================================================

  /**
   * 쿼리 분석 - 복잡도, 의도, 토큰 추정
   */
  analyzeQuery(
    query: string,
    options: {
      intent?: QueryIntent | 'coding';
      complexity?: number;
      hasImages?: boolean;
      thinkingRequested?: boolean;
      contextMessages?: number;
    } = {}
  ): QueryAnalysis {
    const estimatedTokens = estimateTokenCount(query);
    const complexity = options.complexity ?? this.estimateComplexity(query);
    const intent = options.intent ?? this.inferIntent(query);

    return {
      query,
      estimatedTokens,
      complexity,
      intent,
      hasImages: options.hasImages ?? false,
      thinkingRequested: options.thinkingRequested ?? false,
      contextSize: (options.contextMessages ?? 0) * 500, // 메시지당 평균 500 토큰
      estimatedResponseTokens: estimateResponseTokens(complexity),
    };
  }

  /**
   * AI 제공자 상태 조회
   */
  getProviderStatus(): AIProviderStatus {
    const googleKey = getGoogleAIKey();
    const googleRateCheck = checkGoogleAIRateLimit();
    const groqAvailable = isGroqAIAvailable();

    const groq8bStatus = getGroqAIRateLimitStatus('llama-3.1-8b-instant');
    const groq70bStatus = getGroqAIRateLimitStatus('llama-3.3-70b-versatile');
    const groq32bStatus = getGroqAIRateLimitStatus('qwen-qwq-32b');

    const createGroqStatus = (
      model: GroqModel,
      status: ReturnType<typeof getGroqAIRateLimitStatus>
    ): RateLimitStatus => {
      const rateCheck = checkGroqAIRateLimit(model);
      return {
        remainingRPM: status.remainingRPM,
        remainingRPD: status.remainingRPD,
        remainingTPM:
          MODEL_CAPABILITIES[model].tpm - status.requestsLastMinute * 100,
        isAvailable: groqAvailable && rateCheck.allowed,
      };
    };

    return {
      groq: {
        '8b': createGroqStatus('llama-3.1-8b-instant', groq8bStatus),
        '70b': createGroqStatus('llama-3.3-70b-versatile', groq70bStatus),
        '32b': createGroqStatus('qwen-qwq-32b', groq32bStatus),
      },
      google: {
        flash: {
          remainingRPM: googleKey && googleRateCheck.allowed ? 60 : 0,
          remainingRPD: googleKey && googleRateCheck.allowed ? 1500 : 0,
          remainingTPM: googleKey && googleRateCheck.allowed ? 1000000 : 0,
          isAvailable: !!googleKey && googleRateCheck.allowed,
        },
        pro: {
          remainingRPM: googleKey && googleRateCheck.allowed ? 60 : 0,
          remainingRPD: googleKey && googleRateCheck.allowed ? 1500 : 0,
          remainingTPM: googleKey && googleRateCheck.allowed ? 1000000 : 0,
          isAvailable: !!googleKey && googleRateCheck.allowed,
        },
      },
    };
  }

  /**
   * 기능 요구사항 결정
   */
  determineFeatureRequirements(
    queryAnalysis: QueryAnalysis
  ): FeatureRequirements {
    const intentFeatures = INTENT_FEATURE_MAP[queryAnalysis.intent] ?? {};

    // 기본값
    const requirements: FeatureRequirements = {
      needsRAG: intentFeatures.needsRAG ?? false,
      ragMaxResults: intentFeatures.ragMaxResults,
      needsML: intentFeatures.needsML ?? false,
      needsNLP: intentFeatures.needsNLP ?? false,
      needsGCPProcessor: intentFeatures.needsGCPProcessor ?? false,
      needsServerMetrics: intentFeatures.needsServerMetrics ?? false,
      needsTools: intentFeatures.needsTools ?? queryAnalysis.complexity >= 3,
      needsVision: queryAnalysis.hasImages,
      needsReasoning:
        intentFeatures.needsReasoning ?? queryAnalysis.thinkingRequested,
    };

    // 복잡도 기반 조정
    if (queryAnalysis.complexity >= 4) {
      requirements.needsRAG = true;
      requirements.ragMaxResults = Math.max(requirements.ragMaxResults ?? 3, 5);
      requirements.needsTools = true;
    }

    if (queryAnalysis.complexity === 5) {
      requirements.needsML = true;
      requirements.needsGCPProcessor = true;
    }

    return requirements;
  }

  /**
   * 🎯 핵심 메서드: 라우팅 결정
   */
  determineRoute(context: RoutingContext): RoutingDecision {
    const { queryAnalysis, providerStatus, featureRequirements, preferences } =
      context;

    const reasoning: string[] = [];

    // 1. 이미지 처리 필요 시 Google 필수
    if (featureRequirements.needsVision) {
      reasoning.push('이미지 분석 필요 → Google Vision 모델 선택');
      return this.createVisionRoute(providerStatus, reasoning);
    }

    // 2. Thinking/Reasoning 모드
    if (featureRequirements.needsReasoning || queryAnalysis.thinkingRequested) {
      reasoning.push('심층 추론 요청 → Reasoning 지원 모델 선택');
      return this.createReasoningRoute(
        queryAnalysis,
        providerStatus,
        featureRequirements,
        reasoning
      );
    }

    // 3. 복잡도 기반 라우팅
    return this.createComplexityRoute(
      queryAnalysis,
      providerStatus,
      featureRequirements,
      preferences,
      reasoning
    );
  }

  /**
   * 간편 API - 쿼리만으로 라우팅 결정
   */
  route(
    query: string,
    options: {
      intent?: QueryIntent | 'coding';
      complexity?: number;
      hasImages?: boolean;
      thinkingRequested?: boolean;
      contextMessages?: number;
      preferences?: RoutingPreferences;
    } = {}
  ): RoutingDecision {
    const queryAnalysis = this.analyzeQuery(query, options);
    const providerStatus = this.getProviderStatus();
    const featureRequirements =
      this.determineFeatureRequirements(queryAnalysis);

    return this.determineRoute({
      queryAnalysis,
      providerStatus,
      featureRequirements,
      preferences: options.preferences,
    });
  }

  /**
   * 🎯 향상된 라우팅 API - Best Practices 통합
   *
   * RouteLLM-style 스코어링, Task-Based 라우팅, Circuit Breaker, Load Balancing을
   * 모두 통합한 고급 라우팅 결정 API입니다.
   *
   * @returns EnhancedRoutingDecision - 후보 모델 스코어, 폴백 체인, 태스크 타입 포함
   */
  routeEnhanced(
    query: string,
    options: {
      intent?: QueryIntent | 'coding';
      complexity?: number;
      hasImages?: boolean;
      thinkingRequested?: boolean;
      contextMessages?: number;
      preferences?: RoutingPreferences;
    } = {}
  ): EnhancedRoutingDecision {
    // 1. 기본 분석
    const queryAnalysis = this.analyzeQuery(query, options);
    const providerStatus = this.getProviderStatus();
    const featureRequirements =
      this.determineFeatureRequirements(queryAnalysis);

    // 2. Task Type 감지
    const taskType = this.detectTaskType(
      query,
      options.intent ?? queryAnalysis.intent
    );

    // 3. 모든 모델 스코어 계산
    const scores = new Map<AIModel, RouteScore>();
    const availableCandidates: AIModel[] = [];

    for (const model of this.ALL_MODELS) {
      // Circuit Breaker 확인
      if (!this.isModelAvailable(model)) {
        continue;
      }

      const score = this.calculateRouteScore(model, taskType, providerStatus);

      // 가용성 0이면 제외 (Rate Limit 초과 등)
      if (score.availability === 0) {
        continue;
      }

      scores.set(model, score);
      availableCandidates.push(model);
    }

    // 4. 후보 모델 없으면 에러
    if (availableCandidates.length === 0) {
      throw new Error(
        'No available AI models (all circuits open or rate limited)'
      );
    }

    // 5. 스코어 기반 정렬
    availableCandidates.sort((a, b) => {
      const scoreA = scores.get(a)?.total ?? 0;
      const scoreB = scores.get(b)?.total ?? 0;
      return scoreB - scoreA; // 내림차순
    });

    // 6. 로드 밸런싱 적용
    const selectedModel = this.selectModelWithLoadBalancing(
      availableCandidates,
      scores
    );

    // 7. 기본 라우팅 결정 생성
    const baseDecision = this.determineRoute({
      queryAnalysis,
      providerStatus,
      featureRequirements,
      preferences: options.preferences,
    });

    // 8. Fallback 체인 구축 (상위 3개)
    const fallbackChain = availableCandidates
      .filter((m) => m !== selectedModel)
      .slice(0, 2);

    // 9. 후보 모델 스코어 변환
    const candidateScores = availableCandidates.map((model) => ({
      model,
      score: scores.get(model)!,
      rank: availableCandidates.indexOf(model) + 1,
    }));

    // 10. EnhancedRoutingDecision 반환
    return {
      ...baseDecision,
      primaryModel: selectedModel,
      fallbackModel: fallbackChain[0] ?? null,
      taskType,
      candidateScores,
      fallbackChain,
      circuitBreakerState: {
        openCircuits: this.ALL_MODELS.filter(
          (m) => this.getCircuitState(m) === 'open'
        ),
        halfOpenCircuits: this.ALL_MODELS.filter(
          (m) => this.getCircuitState(m) === 'half-open'
        ),
      },
      selectionMethod: this.loadBalanceStrategy,
    };
  }

  /**
   * 모델 Health 상태 조회 (디버깅/모니터링용)
   */
  getModelHealth(model?: AIModel): ModelHealth | Map<AIModel, ModelHealth> {
    if (model) {
      return (
        this.modelHealth.get(model) ?? {
          model,
          circuitState: 'closed',
          consecutiveFailures: 0,
          lastFailureTime: null,
          lastSuccessTime: null,
          avgLatencyMs: 1000,
          recentSuccessRate: 1.0,
        }
      );
    }
    return new Map(this.modelHealth);
  }

  /**
   * 모델 Load 상태 조회 (디버깅/모니터링용)
   */
  getModelLoad(model?: AIModel): ModelLoadState | Map<AIModel, ModelLoadState> {
    if (model) {
      return (
        this.modelLoads.get(model) ?? {
          model,
          activeRequests: 0,
          tokensUsedLastMinute: 0,
          remainingCapacity: 1.0,
          estimatedWaitMs: 0,
        }
      );
    }
    return new Map(this.modelLoads);
  }

  /**
   * Active Request 증가 (요청 시작 시 호출)
   */
  incrementActiveRequests(model: AIModel): void {
    const load = this.modelLoads.get(model);
    if (load) {
      this.modelLoads.set(model, {
        ...load,
        activeRequests: load.activeRequests + 1,
        remainingCapacity: Math.max(
          0,
          1 - (load.activeRequests + 1) / 10 // 최대 10개 동시 요청 기준
        ),
      });
    }
  }

  /**
   * Active Request 감소 (요청 완료 시 호출)
   */
  decrementActiveRequests(model: AIModel): void {
    const load = this.modelLoads.get(model);
    if (load && load.activeRequests > 0) {
      this.modelLoads.set(model, {
        ...load,
        activeRequests: load.activeRequests - 1,
        remainingCapacity: Math.max(0, 1 - (load.activeRequests - 1) / 10),
      });
    }
  }

  // ============================================================================
  // 내부 헬퍼 메서드
  // ============================================================================

  /**
   * 쿼리에서 복잡도 추정 (Fallback용)
   */
  private estimateComplexity(query: string): number {
    const q = query.toLowerCase();
    const tokens = estimateTokenCount(query);

    // 긴 쿼리 = 높은 복잡도
    if (tokens > 200) return 5;
    if (tokens > 100) return 4;

    // 키워드 기반 복잡도
    if (
      q.includes('분석') ||
      q.includes('왜') ||
      q.includes('어떻게') ||
      q.includes('코드')
    ) {
      return 4;
    }

    if (
      q.includes('상태') ||
      q.includes('cpu') ||
      q.includes('메모리') ||
      q.includes('서버')
    ) {
      return 2;
    }

    if (q.includes('안녕') || q.includes('뭐야') || q.includes('도움')) {
      return 1;
    }

    return 3; // 기본값
  }

  /**
   * 쿼리에서 의도 추론
   */
  private inferIntent(query: string): QueryIntent | 'coding' {
    const q = query.toLowerCase();

    if (
      q.includes('코드') ||
      q.includes('스크립트') ||
      q.includes('구현') ||
      q.includes('함수')
    ) {
      return 'coding';
    }

    if (
      q.includes('분석') ||
      q.includes('왜') ||
      q.includes('원인') ||
      q.includes('문제')
    ) {
      return 'analysis';
    }

    if (
      q.includes('상태') ||
      q.includes('cpu') ||
      q.includes('메모리') ||
      q.includes('서버')
    ) {
      return 'monitoring';
    }

    if (
      q.includes('방법') ||
      q.includes('어떻게') ||
      q.includes('가이드') ||
      q.includes('설명')
    ) {
      return 'guide';
    }

    return 'general';
  }

  /**
   * Vision(이미지) 라우팅
   */
  private createVisionRoute(
    status: AIProviderStatus,
    reasoning: string[]
  ): RoutingDecision {
    if (!status.google.flash.isAvailable) {
      throw new Error('이미지 분석을 위한 Google AI 모델 사용이 불가능합니다.');
    }

    reasoning.push('Google Gemini Flash (Vision 지원) 선택');

    return {
      primaryModel: 'gemini-2.5-flash',
      fallbackModel: status.google.pro.isAvailable ? 'gemini-2.5-pro' : null,
      level: 'multimodal',
      provider: 'google',
      features: {
        useTools: true,
        useRAG: false,
        useML: false,
        useNLP: false,
        useGCP: false,
      },
      tokens: {
        maxOutputTokens: 4096,
        temperature: 0.5,
        ragContextBudget: 0,
      },
      reasoning,
      expectedPerformance: {
        latencyMs: 2000,
        qualityScore: 8,
      },
    };
  }

  /**
   * Reasoning 라우팅
   */
  private createReasoningRoute(
    _analysis: QueryAnalysis,
    status: AIProviderStatus,
    features: FeatureRequirements,
    reasoning: string[]
  ): RoutingDecision {
    // Google Pro 우선 (Reasoning 지원)
    if (status.google.pro.isAvailable) {
      reasoning.push('Google Gemini Pro (Reasoning 지원) 선택');
      return {
        primaryModel: 'gemini-2.5-pro',
        fallbackModel: status.groq['70b'].isAvailable
          ? 'llama-3.3-70b-versatile'
          : null,
        level: 'thinking',
        provider: 'google',
        features: {
          useTools: true,
          useRAG: features.needsRAG,
          useML: features.needsML,
          useNLP: features.needsNLP,
          useGCP: features.needsGCPProcessor,
        },
        tokens: {
          maxOutputTokens: 8192,
          temperature: 0.7,
          ragContextBudget: COMPLEXITY_TOKEN_MAP[5].ragBudget,
        },
        reasoning,
        expectedPerformance: {
          latencyMs: 5000,
          qualityScore: 10,
        },
      };
    }

    // Qwen-QWQ (Reasoning 지원)
    if (status.groq['32b'].isAvailable) {
      reasoning.push('Qwen-QWQ 32B (Reasoning 지원) 선택');
      return {
        primaryModel: 'qwen-qwq-32b',
        fallbackModel: status.groq['70b'].isAvailable
          ? 'llama-3.3-70b-versatile'
          : null,
        level: 'thinking',
        provider: 'groq',
        features: {
          useTools: true,
          useRAG: features.needsRAG,
          useML: features.needsML,
          useNLP: features.needsNLP,
          useGCP: features.needsGCPProcessor,
        },
        tokens: {
          maxOutputTokens: 4096,
          temperature: 0.7,
          ragContextBudget: COMPLEXITY_TOKEN_MAP[5].ragBudget,
        },
        reasoning,
        expectedPerformance: {
          latencyMs: 4000,
          qualityScore: 8,
        },
      };
    }

    // Fallback to 70b
    if (status.groq['70b'].isAvailable) {
      reasoning.push('Llama 70B (고품질, Reasoning 미지원) Fallback');
      return {
        primaryModel: 'llama-3.3-70b-versatile',
        fallbackModel: null,
        level: 'thinking',
        provider: 'groq',
        features: {
          useTools: true,
          useRAG: features.needsRAG,
          useML: features.needsML,
          useNLP: features.needsNLP,
          useGCP: features.needsGCPProcessor,
        },
        tokens: {
          maxOutputTokens: 4096,
          temperature: 0.7,
          ragContextBudget: COMPLEXITY_TOKEN_MAP[4].ragBudget,
        },
        reasoning,
        expectedPerformance: {
          latencyMs: 3000,
          qualityScore: 8,
        },
      };
    }

    throw new Error('Reasoning 지원 모델 사용이 불가능합니다.');
  }

  /**
   * 복잡도 기반 라우팅
   */
  private createComplexityRoute(
    analysis: QueryAnalysis,
    status: AIProviderStatus,
    features: FeatureRequirements,
    _preferences: RoutingPreferences | undefined,
    reasoning: string[]
  ): RoutingDecision {
    const complexity = Math.min(5, Math.max(1, analysis.complexity)) as
      | 1
      | 2
      | 3
      | 4
      | 5;
    const tokenConfig = COMPLEXITY_TOKEN_MAP[complexity];

    reasoning.push(`복잡도 ${complexity} 분석됨`);

    // 복잡도 5: 최고 품질 모델
    if (complexity === 5) {
      return this.routeHighComplexity(status, features, tokenConfig, reasoning);
    }

    // 복잡도 4: 고성능 모델
    if (complexity === 4) {
      return this.routeMediumHighComplexity(
        status,
        features,
        tokenConfig,
        reasoning
      );
    }

    // 복잡도 2-3: 밸런스 모델
    if (complexity >= 2) {
      return this.routeMediumComplexity(
        status,
        features,
        complexity as 2 | 3,
        tokenConfig as (typeof COMPLEXITY_TOKEN_MAP)[2 | 3],
        reasoning
      );
    }

    // 복잡도 1: 빠른 모델
    return this.routeLowComplexity(status, features, tokenConfig, reasoning);
  }

  /**
   * 복잡도 5 라우팅 (최고 품질)
   */
  private routeHighComplexity(
    status: AIProviderStatus,
    features: FeatureRequirements,
    tokenConfig: (typeof COMPLEXITY_TOKEN_MAP)[5],
    reasoning: string[]
  ): RoutingDecision {
    // Google Flash 우선 (높은 컨텍스트, 좋은 품질)
    if (status.google.flash.isAvailable) {
      reasoning.push('Google Gemini Flash (대용량 컨텍스트) 선택');
      return {
        primaryModel: 'gemini-2.5-flash',
        fallbackModel: status.groq['70b'].isAvailable
          ? 'llama-3.3-70b-versatile'
          : null,
        level: 5,
        provider: 'google',
        features: {
          useTools: true,
          useRAG: features.needsRAG,
          useML: features.needsML,
          useNLP: features.needsNLP,
          useGCP: features.needsGCPProcessor,
        },
        tokens: {
          maxOutputTokens: tokenConfig.maxOutput,
          temperature: tokenConfig.temperature,
          ragContextBudget: tokenConfig.ragBudget,
        },
        reasoning,
        expectedPerformance: {
          latencyMs: 3000,
          qualityScore: 8,
        },
      };
    }

    // Groq 70b Fallback
    if (status.groq['70b'].isAvailable) {
      reasoning.push('Llama 70B (고품질) 선택');
      return {
        primaryModel: 'llama-3.3-70b-versatile',
        fallbackModel: status.groq['8b'].isAvailable
          ? 'llama-3.1-8b-instant'
          : null,
        level: 5,
        provider: 'groq',
        features: {
          useTools: true,
          useRAG: features.needsRAG,
          useML: features.needsML,
          useNLP: features.needsNLP,
          useGCP: features.needsGCPProcessor,
        },
        tokens: {
          maxOutputTokens: tokenConfig.maxOutput,
          temperature: tokenConfig.temperature,
          ragContextBudget: tokenConfig.ragBudget,
        },
        reasoning,
        expectedPerformance: {
          latencyMs: 3000,
          qualityScore: 8,
        },
      };
    }

    throw new Error('AI API가 모두 사용 불가합니다.');
  }

  /**
   * 복잡도 4 라우팅
   */
  private routeMediumHighComplexity(
    status: AIProviderStatus,
    features: FeatureRequirements,
    tokenConfig: (typeof COMPLEXITY_TOKEN_MAP)[4],
    reasoning: string[]
  ): RoutingDecision {
    // 70b 우선 (비용 효율)
    if (status.groq['70b'].isAvailable) {
      reasoning.push('Llama 70B (고성능, 무료) 선택');
      return {
        primaryModel: 'llama-3.3-70b-versatile',
        fallbackModel: status.google.flash.isAvailable
          ? 'gemini-2.5-flash'
          : null,
        level: 4,
        provider: 'groq',
        features: {
          useTools: true,
          useRAG: features.needsRAG,
          useML: features.needsML,
          useNLP: features.needsNLP,
          useGCP: features.needsGCPProcessor,
        },
        tokens: {
          maxOutputTokens: tokenConfig.maxOutput,
          temperature: tokenConfig.temperature,
          ragContextBudget: tokenConfig.ragBudget,
        },
        reasoning,
        expectedPerformance: {
          latencyMs: 2500,
          qualityScore: 8,
        },
      };
    }

    // Google Flash Fallback
    if (status.google.flash.isAvailable) {
      reasoning.push('Google Gemini Flash Fallback');
      return {
        primaryModel: 'gemini-2.5-flash',
        fallbackModel: status.groq['8b'].isAvailable
          ? 'llama-3.1-8b-instant'
          : null,
        level: 4,
        provider: 'google',
        features: {
          useTools: true,
          useRAG: features.needsRAG,
          useML: features.needsML,
          useNLP: features.needsNLP,
          useGCP: features.needsGCPProcessor,
        },
        tokens: {
          maxOutputTokens: tokenConfig.maxOutput,
          temperature: tokenConfig.temperature,
          ragContextBudget: tokenConfig.ragBudget,
        },
        reasoning,
        expectedPerformance: {
          latencyMs: 2000,
          qualityScore: 8,
        },
      };
    }

    throw new Error('AI API가 모두 사용 불가합니다.');
  }

  /**
   * 복잡도 2-3 라우팅
   */
  private routeMediumComplexity(
    status: AIProviderStatus,
    features: FeatureRequirements,
    complexity: 2 | 3,
    tokenConfig: (typeof COMPLEXITY_TOKEN_MAP)[2 | 3],
    reasoning: string[]
  ): RoutingDecision {
    // 8b 우선 (빠르고 저렴)
    if (status.groq['8b'].isAvailable) {
      reasoning.push('Llama 8B (빠른 응답, 무료) 선택');
      return {
        primaryModel: 'llama-3.1-8b-instant',
        fallbackModel: status.google.flash.isAvailable
          ? 'gemini-2.5-flash'
          : null,
        level: complexity,
        provider: 'groq',
        features: {
          useTools: features.needsTools,
          useRAG: features.needsRAG,
          useML: false, // 복잡도 2-3에서는 ML 비활성화
          useNLP: false,
          useGCP: false,
        },
        tokens: {
          maxOutputTokens: tokenConfig.maxOutput,
          temperature: tokenConfig.temperature,
          ragContextBudget: tokenConfig.ragBudget,
        },
        reasoning,
        expectedPerformance: {
          latencyMs: 1000,
          qualityScore: 6,
        },
      };
    }

    // Google Flash Fallback
    if (status.google.flash.isAvailable) {
      reasoning.push('Google Gemini Flash Fallback');
      return {
        primaryModel: 'gemini-2.5-flash',
        fallbackModel: null,
        level: complexity,
        provider: 'google',
        features: {
          useTools: features.needsTools,
          useRAG: features.needsRAG,
          useML: false,
          useNLP: false,
          useGCP: false,
        },
        tokens: {
          maxOutputTokens: tokenConfig.maxOutput,
          temperature: tokenConfig.temperature,
          ragContextBudget: tokenConfig.ragBudget,
        },
        reasoning,
        expectedPerformance: {
          latencyMs: 1500,
          qualityScore: 8,
        },
      };
    }

    throw new Error('AI API가 모두 사용 불가합니다.');
  }

  /**
   * 복잡도 1 라우팅 (간단한 쿼리)
   */
  private routeLowComplexity(
    status: AIProviderStatus,
    _features: FeatureRequirements,
    tokenConfig: (typeof COMPLEXITY_TOKEN_MAP)[1],
    reasoning: string[]
  ): RoutingDecision {
    // 8b 최우선 (가장 빠름)
    if (status.groq['8b'].isAvailable) {
      reasoning.push('Llama 8B (최소 지연, 무료) 선택');
      return {
        primaryModel: 'llama-3.1-8b-instant',
        fallbackModel: status.google.flash.isAvailable
          ? 'gemini-2.5-flash'
          : null,
        level: 1,
        provider: 'groq',
        features: {
          useTools: false, // 복잡도 1에서는 Tools 비활성화
          useRAG: false,
          useML: false,
          useNLP: false,
          useGCP: false,
        },
        tokens: {
          maxOutputTokens: tokenConfig.maxOutput,
          temperature: tokenConfig.temperature,
          ragContextBudget: 0,
        },
        reasoning,
        expectedPerformance: {
          latencyMs: 500,
          qualityScore: 6,
        },
      };
    }

    if (status.google.flash.isAvailable) {
      reasoning.push('Google Gemini Flash Fallback');
      return {
        primaryModel: 'gemini-2.5-flash',
        fallbackModel: null,
        level: 1,
        provider: 'google',
        features: {
          useTools: false,
          useRAG: false,
          useML: false,
          useNLP: false,
          useGCP: false,
        },
        tokens: {
          maxOutputTokens: tokenConfig.maxOutput,
          temperature: tokenConfig.temperature,
          ragContextBudget: 0,
        },
        reasoning,
        expectedPerformance: {
          latencyMs: 800,
          qualityScore: 8,
        },
      };
    }

    throw new Error('AI API가 모두 사용 불가합니다.');
  }
}

// 싱글톤 인스턴스 내보내기
export const smartRoutingEngine = SmartRoutingEngine.getInstance();

// 간편 함수 내보내기
export const routeQuery = (
  query: string,
  options?: Parameters<SmartRoutingEngine['route']>[1]
) => smartRoutingEngine.route(query, options);

export const analyzeQueryForRouting = (
  query: string,
  options?: Parameters<SmartRoutingEngine['analyzeQuery']>[1]
) => smartRoutingEngine.analyzeQuery(query, options);

export const getAIProviderStatus = () => smartRoutingEngine.getProviderStatus();

// ============================================================================
// 🚀 향상된 라우팅 API (Best Practices 통합)
// ============================================================================

/**
 * 향상된 쿼리 라우팅 (RouteLLM 스코어링 + Circuit Breaker + Load Balancing)
 */
export const routeQueryEnhanced = (
  query: string,
  options?: Parameters<SmartRoutingEngine['routeEnhanced']>[1]
) => smartRoutingEngine.routeEnhanced(query, options);

/**
 * 모델 성공 기록 (Circuit Breaker + 레이턴시 추적)
 */
export const recordModelSuccess = (model: AIModel, latencyMs: number) =>
  smartRoutingEngine.recordSuccess(model, latencyMs);

/**
 * 모델 실패 기록 (Circuit Breaker 상태 업데이트)
 */
export const recordModelFailure = (model: AIModel) =>
  smartRoutingEngine.recordFailure(model);

/**
 * 모델 헬스 상태 조회 (디버깅/모니터링용)
 */
export const getModelHealthStatus = (model?: AIModel) =>
  smartRoutingEngine.getModelHealth(model);

/**
 * 모델 로드 상태 조회 (디버깅/모니터링용)
 */
export const getModelLoadStatus = (model?: AIModel) =>
  smartRoutingEngine.getModelLoad(model);

/**
 * 활성 요청 증가 (로드 밸런싱용 - 요청 시작 시 호출)
 */
export const incrementModelLoad = (model: AIModel) =>
  smartRoutingEngine.incrementActiveRequests(model);

/**
 * 활성 요청 감소 (로드 밸런싱용 - 요청 완료 시 호출)
 */
export const decrementModelLoad = (model: AIModel) =>
  smartRoutingEngine.decrementActiveRequests(model);

// Type exports for consumers
export type {
  EnhancedRoutingDecision,
  RouteScore,
  RoutingDecision,
  TaskType,
} from '../../types/ai/routing-types';
