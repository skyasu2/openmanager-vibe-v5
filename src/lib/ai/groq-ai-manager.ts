/**
 * @deprecated v5.84.0 - Hybrid Architecture 전환
 *
 * ⚠️ DEPRECATED: 이 모듈은 Cloud Run으로 이관되었습니다.
 *
 * Hybrid Architecture 설계:
 * - Vercel = Frontend/Proxy Only (API 키 없음, 직접 AI 호출 금지)
 * - Cloud Run = ALL AI processing (Groq API 호출 포함)
 *
 * 대체 방법:
 * - AI 요청: /api/ai/supervisor → Cloud Run 프록시
 * - 타입 정의: src/types/ai/routing-types.ts (GroqModel 타입)
 *
 * 이 파일은 하위 호환성을 위해 유지되지만, 신규 코드에서는 사용하지 마세요.
 *
 * ---
 * (Legacy) Groq AI Manager v2.0 - Vercel AI SDK 통합
 * @ai-sdk/groq를 사용한 현대적인 Groq 통합
 * 무료 티어: 14,400 RPD, 30 RPM (llama-3.1-8b-instant)
 *
 * 모델 옵션:
 * - llama-3.1-8b-instant: 30 RPM, 14,400 RPD, 6K TPM (빠른 응답)
 * - llama-3.3-70b-versatile: 30 RPM, 1,000 RPD, 12K TPM (고품질)
 * - qwen-qwq-32b: 30 RPM, 1,000 RPD, 6K TPM (reasoning 지원)
 *
 * @see https://sdk.vercel.ai/providers/ai-sdk-providers/groq
 */

import { groq } from '@ai-sdk/groq';
import { generateText, type ModelMessage, streamText } from 'ai';

export type GroqModel =
  | 'llama-3.1-8b-instant'
  | 'llama-3.3-70b-versatile'
  | 'qwen-qwq-32b';

interface GroqRateLimits {
  rpm: number; // Requests Per Minute
  rpd: number; // Requests Per Day
  tpm: number; // Tokens Per Minute
}

const MODEL_LIMITS: Record<GroqModel, GroqRateLimits> = {
  'llama-3.1-8b-instant': { rpm: 30, rpd: 14400, tpm: 6000 },
  'llama-3.3-70b-versatile': { rpm: 30, rpd: 1000, tpm: 12000 },
  'qwen-qwq-32b': { rpm: 30, rpd: 1000, tpm: 6000 },
};

// Reasoning 지원 모델
const REASONING_MODELS: GroqModel[] = ['qwen-qwq-32b'];

interface GenerateOptions {
  model?: GroqModel;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  /** Reasoning mode (qwen-qwq-32b only) */
  enableReasoning?: boolean;
  /** Reasoning effort: 'low' | 'medium' | 'high' */
  reasoningEffort?: 'low' | 'medium' | 'high';
}

interface GenerateResult {
  success: boolean;
  text?: string;
  error?: string;
  model?: string;
  reasoning?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

interface StreamOptions extends GenerateOptions {
  messages?: ModelMessage[];
}

class GroqAIManager {
  private static instance: GroqAIManager;
  private apiKey: string | null = null;
  private defaultModel: GroqModel = 'llama-3.1-8b-instant';

  // Rate limiting 추적
  private requestLog: number[] = [];
  private dailyRequestCount = 0;
  private lastResetDate: string = '';

  private constructor() {
    this.loadAPIKey();
  }

  static getInstance(): GroqAIManager {
    if (!GroqAIManager.instance) {
      GroqAIManager.instance = new GroqAIManager();
    }
    return GroqAIManager.instance;
  }

  private loadAPIKey(): void {
    this.apiKey =
      process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY || null;
  }

  /**
   * Groq API 키 가져오기
   */
  getAPIKey(): string | null {
    if (this.apiKey) {
      return this.apiKey;
    }
    return null;
  }

  /**
   * API 키 사용 가능 여부 확인
   */
  isAPIKeyAvailable(): boolean {
    return this.getAPIKey() !== null;
  }

  /**
   * 기본 모델 설정
   */
  setDefaultModel(model: GroqModel): void {
    this.defaultModel = model;
  }

  /**
   * 기본 모델 가져오기
   */
  getDefaultModel(): GroqModel {
    return this.defaultModel;
  }

  /**
   * API 키 상태 정보
   */
  getKeyStatus(): {
    keySource: 'env' | 'none';
    isAvailable: boolean;
    defaultModel: GroqModel;
    modelLimits: GroqRateLimits;
    supportsReasoning: boolean;
  } {
    const apiKey = this.getAPIKey();
    return {
      keySource: apiKey ? 'env' : 'none',
      isAvailable: apiKey !== null,
      defaultModel: this.defaultModel,
      modelLimits: MODEL_LIMITS[this.defaultModel],
      supportsReasoning: REASONING_MODELS.includes(this.defaultModel),
    };
  }

  /**
   * 🚦 Rate Limit 체크
   */
  checkRateLimit(model?: GroqModel): { allowed: boolean; reason?: string } {
    const targetModel = model || this.defaultModel;
    const limits = MODEL_LIMITS[targetModel];
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    const today = new Date().toISOString().split('T')[0] ?? '';

    // 일일 할당량 초기화
    if (this.lastResetDate !== today) {
      this.dailyRequestCount = 0;
      this.lastResetDate = today;
    }

    // 1분 동안의 요청 수 계산
    this.requestLog = this.requestLog.filter(
      (timestamp) => timestamp > oneMinuteAgo
    );
    const requestsPerMinute = this.requestLog.length;

    // RPM 한도 체크
    if (requestsPerMinute >= limits.rpm) {
      return {
        allowed: false,
        reason: `Groq rate limit: ${requestsPerMinute}/${limits.rpm} RPM`,
      };
    }

    // RPD 한도 체크
    if (this.dailyRequestCount >= limits.rpd) {
      return {
        allowed: false,
        reason: `Groq daily quota: ${this.dailyRequestCount}/${limits.rpd} RPD`,
      };
    }

    return { allowed: true };
  }

  /**
   * 🔄 요청 기록
   */
  recordRequest(): void {
    const now = Date.now();
    this.requestLog.push(now);
    this.dailyRequestCount++;
  }

  /**
   * 📊 Rate Limit 상태 조회
   */
  getRateLimitStatus(model?: GroqModel): {
    requestsLastMinute: number;
    requestsToday: number;
    remainingRPM: number;
    remainingRPD: number;
    model: GroqModel;
  } {
    const targetModel = model || this.defaultModel;
    const limits = MODEL_LIMITS[targetModel];
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    const requestsLastMinute = this.requestLog.filter(
      (timestamp) => timestamp > oneMinuteAgo
    ).length;

    return {
      requestsLastMinute,
      requestsToday: this.dailyRequestCount,
      remainingRPM: Math.max(0, limits.rpm - requestsLastMinute),
      remainingRPD: Math.max(0, limits.rpd - this.dailyRequestCount),
      model: targetModel,
    };
  }

  /**
   * 🤖 Groq API 호출 (Vercel AI SDK - generateText)
   *
   * @example
   * ```ts
   * const result = await generateGroqText('서버 상태 분석해줘', {
   *   model: 'qwen-qwq-32b',
   *   enableReasoning: true,
   *   reasoningEffort: 'medium',
   * });
   * ```
   */
  async generateText(
    prompt: string,
    options?: GenerateOptions
  ): Promise<GenerateResult> {
    if (!this.isAPIKeyAvailable()) {
      return { success: false, error: 'Groq API 키가 설정되지 않았습니다.' };
    }

    const rateCheck = this.checkRateLimit(options?.model);
    if (!rateCheck.allowed) {
      return { success: false, error: rateCheck.reason };
    }

    const model = options?.model || this.defaultModel;
    const supportsReasoning = REASONING_MODELS.includes(model);

    try {
      const messages: ModelMessage[] = [];

      if (options?.systemPrompt) {
        messages.push({ role: 'system', content: options.systemPrompt });
      }
      messages.push({ role: 'user', content: prompt });

      // Vercel AI SDK 기반 호출
      const result = await generateText({
        model: groq(model),
        messages,
        maxOutputTokens: options?.maxTokens || 2048,
        temperature: options?.temperature ?? 0.7,
        // Reasoning 지원 (qwen-qwq-32b only)
        ...(supportsReasoning &&
          options?.enableReasoning && {
            experimental_providerOptions: {
              groq: {
                reasoningFormat: 'parsed',
                ...(options.reasoningEffort && {
                  reasoningEffort: options.reasoningEffort,
                }),
              },
            },
          }),
      });

      this.recordRequest();

      // Reasoning 결과 추출 (providerMetadata에서)
      let reasoning: string | undefined;
      if (supportsReasoning && options?.enableReasoning) {
        const providerMeta = result.providerMetadata?.groq as
          | { reasoning?: string }
          | undefined;
        reasoning = providerMeta?.reasoning;
      }

      return {
        success: true,
        text: result.text,
        model,
        reasoning,
        usage: {
          promptTokens: result.usage?.inputTokens || 0,
          completionTokens: result.usage?.outputTokens || 0,
          totalTokens: result.usage?.totalTokens || 0,
        },
      };
    } catch (error) {
      console.error('❌ Groq API 호출 실패:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Groq API 호출 중 오류 발생',
      };
    }
  }

  /**
   * 🌊 Groq API 스트리밍 호출 (Vercel AI SDK - streamText)
   *
   * @example
   * ```ts
   * const stream = await groqManager.streamText('분석해줘', {
   *   model: 'llama-3.3-70b-versatile',
   * });
   * return stream.toTextStreamResponse();
   * ```
   */
  async streamTextResponse(
    prompt: string,
    options?: StreamOptions
  ): Promise<ReturnType<typeof streamText> | null> {
    if (!this.isAPIKeyAvailable()) {
      console.error('Groq API 키가 설정되지 않았습니다.');
      return null;
    }

    const rateCheck = this.checkRateLimit(options?.model);
    if (!rateCheck.allowed) {
      console.error(rateCheck.reason);
      return null;
    }

    const model = options?.model || this.defaultModel;
    const supportsReasoning = REASONING_MODELS.includes(model);

    const messages: ModelMessage[] = options?.messages || [];

    if (messages.length === 0) {
      if (options?.systemPrompt) {
        messages.push({ role: 'system', content: options.systemPrompt });
      }
      messages.push({ role: 'user', content: prompt });
    }

    this.recordRequest();

    // Vercel AI SDK streamText 반환
    return streamText({
      model: groq(model),
      messages,
      maxOutputTokens: options?.maxTokens || 2048,
      temperature: options?.temperature ?? 0.7,
      // Reasoning 지원
      ...(supportsReasoning &&
        options?.enableReasoning && {
          experimental_providerOptions: {
            groq: {
              reasoningFormat: 'parsed',
              ...(options.reasoningEffort && {
                reasoningEffort: options.reasoningEffort,
              }),
            },
          },
        }),
    });
  }

  /**
   * 🧠 Groq 모델 Provider 가져오기 (직접 사용)
   *
   * @example
   * ```ts
   * const model = getGroqModel('llama-3.3-70b-versatile');
   * const result = await generateText({ model, messages: [...] });
   * ```
   */
  getModel(modelId?: GroqModel) {
    return groq(modelId || this.defaultModel);
  }
}

const groqAIManager = GroqAIManager.getInstance();

// 내보내기 - 기존 API 호환성 유지
export const getGroqAIKey = () => groqAIManager.getAPIKey();
export const isGroqAIAvailable = () => groqAIManager.isAPIKeyAvailable();
export const getGroqAIStatus = () => groqAIManager.getKeyStatus();
export const checkGroqAIRateLimit = (model?: GroqModel) =>
  groqAIManager.checkRateLimit(model);
export const recordGroqAIRequest = () => groqAIManager.recordRequest();
export const getGroqAIRateLimitStatus = (model?: GroqModel) =>
  groqAIManager.getRateLimitStatus(model);
export const generateGroqText = (prompt: string, options?: GenerateOptions) =>
  groqAIManager.generateText(prompt, options);
export const streamGroqText = (prompt: string, options?: StreamOptions) =>
  groqAIManager.streamTextResponse(prompt, options);
export const setGroqDefaultModel = (model: GroqModel) =>
  groqAIManager.setDefaultModel(model);
export const getGroqModel = (modelId?: GroqModel) =>
  groqAIManager.getModel(modelId);

export default groqAIManager;
