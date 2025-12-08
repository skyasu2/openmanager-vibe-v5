/**
 * Groq AI API 키 관리자 v1.0
 *
 * Google Gemini API 폴백으로 사용
 * 무료 티어: 14,400 RPD, 30 RPM (llama-3.1-8b-instant)
 *
 * 모델 옵션:
 * - llama-3.1-8b-instant: 30 RPM, 14,400 RPD, 6K TPM (빠른 응답)
 * - llama-3.3-70b-versatile: 30 RPM, 1,000 RPD, 12K TPM (고품질)
 * - qwen3-32b: 60 RPM, 1,000 RPD, 6K TPM (균형)
 */

export type GroqModel =
  | 'llama-3.1-8b-instant'
  | 'llama-3.3-70b-versatile'
  | 'qwen3-32b';

interface GroqRateLimits {
  rpm: number; // Requests Per Minute
  rpd: number; // Requests Per Day
  tpm: number; // Tokens Per Minute
}

const MODEL_LIMITS: Record<GroqModel, GroqRateLimits> = {
  'llama-3.1-8b-instant': { rpm: 30, rpd: 14400, tpm: 6000 },
  'llama-3.3-70b-versatile': { rpm: 30, rpd: 1000, tpm: 12000 },
  'qwen3-32b': { rpm: 60, rpd: 1000, tpm: 6000 },
};

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
      console.log('🔑 Groq API 키 소스: 환경변수');
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
  } {
    const apiKey = this.getAPIKey();
    return {
      keySource: apiKey ? 'env' : 'none',
      isAvailable: apiKey !== null,
      defaultModel: this.defaultModel,
      modelLimits: MODEL_LIMITS[this.defaultModel],
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
   * Groq API 호출 (직접 fetch)
   */
  async generateText(
    prompt: string,
    options?: {
      model?: GroqModel;
      maxTokens?: number;
      temperature?: number;
      systemPrompt?: string;
    }
  ): Promise<{
    success: boolean;
    text?: string;
    error?: string;
    model?: string;
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  }> {
    const apiKey = this.getAPIKey();
    if (!apiKey) {
      return { success: false, error: 'Groq API 키가 설정되지 않았습니다.' };
    }

    const rateCheck = this.checkRateLimit(options?.model);
    if (!rateCheck.allowed) {
      return { success: false, error: rateCheck.reason };
    }

    const model = options?.model || this.defaultModel;

    try {
      const messages: Array<{ role: 'system' | 'user'; content: string }> = [];

      if (options?.systemPrompt) {
        messages.push({ role: 'system', content: options.systemPrompt });
      }
      messages.push({ role: 'user', content: prompt });

      const response = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages,
            max_tokens: options?.maxTokens || 2048,
            temperature: options?.temperature ?? 0.7,
          }),
          signal: AbortSignal.timeout(30000),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          (errorData as { error?: { message?: string } })?.error?.message ||
          `HTTP ${response.status}`;
        return { success: false, error: `Groq API 오류: ${errorMessage}` };
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
        usage?: {
          prompt_tokens?: number;
          completion_tokens?: number;
          total_tokens?: number;
        };
      };
      this.recordRequest();

      const text = data.choices?.[0]?.message?.content || '';

      return {
        success: true,
        text,
        model,
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
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
}

const groqAIManager = GroqAIManager.getInstance();

// 내보내기
export const getGroqAIKey = () => groqAIManager.getAPIKey();
export const isGroqAIAvailable = () => groqAIManager.isAPIKeyAvailable();
export const getGroqAIStatus = () => groqAIManager.getKeyStatus();
export const checkGroqAIRateLimit = (model?: GroqModel) =>
  groqAIManager.checkRateLimit(model);
export const recordGroqAIRequest = () => groqAIManager.recordRequest();
export const getGroqAIRateLimitStatus = (model?: GroqModel) =>
  groqAIManager.getRateLimitStatus(model);
export const generateGroqText = (
  prompt: string,
  options?: Parameters<typeof groqAIManager.generateText>[1]
) => groqAIManager.generateText(prompt, options);
export const setGroqDefaultModel = (model: GroqModel) =>
  groqAIManager.setDefaultModel(model);

export default groqAIManager;
