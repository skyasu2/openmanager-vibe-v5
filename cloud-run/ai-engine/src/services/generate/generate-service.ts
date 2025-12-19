/**
 * Cloud Run Generate Service
 * Google AI (Gemini) 텍스트 생성 담당
 *
 * Hybrid Architecture:
 * - Vercel에서 프록시를 통해 이 서비스 호출
 * - API 키는 Cloud Run에서만 관리
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

interface GenerateOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topK?: number;
  topP?: number;
}

interface GenerateResult {
  success: boolean;
  text?: string;
  error?: string;
  model?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  processingTime?: number;
}

class CloudRunGenerateService {
  private readonly DEFAULT_MODEL = 'gemini-2.5-flash';
  private currentKeyIndex = 0; // For key rotation on error

  // 통계
  private stats = {
    requests: 0,
    successes: 0,
    errors: 0,
    keyFailovers: 0,
    totalTokens: 0,
  };

  /**
   * 텍스트 생성
   */
  async generate(
    prompt: string,
    options: GenerateOptions = {}
  ): Promise<GenerateResult> {
    const startTime = Date.now();
    const model = options.model || this.DEFAULT_MODEL;

    this.stats.requests++;

    // 입력 검증
    if (!prompt || prompt.trim().length === 0) {
      return { success: false, error: 'Empty prompt provided' };
    }

    // API 키 가져오기
    const apiKey = this.getApiKey();
    if (!apiKey) {
      console.error('❌ [Generate] No API key available');
      return { success: false, error: 'No API key configured' };
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const generativeModel = genAI.getGenerativeModel({ model });

      const generationConfig = {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? 2048,
        topK: options.topK ?? 40,
        topP: options.topP ?? 0.95,
      };

      const result = await generativeModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig,
      });

      const response = result.response;
      const text = response.text();
      const processingTime = Date.now() - startTime;

      // 사용량 추적
      const usage = {
        promptTokens: response.usageMetadata?.promptTokenCount || 0,
        completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: response.usageMetadata?.totalTokenCount || 0,
      };

      this.stats.successes++;
      this.stats.totalTokens += usage.totalTokens;

      console.log(
        `✅ [Generate] Success: ${model}, ${usage.totalTokens} tokens, ${processingTime}ms`
      );

      return {
        success: true,
        text,
        model,
        usage,
        processingTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ [Generate] Error:', errorMessage);

      // Rate limit 에러 시 키 교체 시도
      if (errorMessage.includes('429') || errorMessage.includes('quota')) {
        const altKey = this.getAlternativeKey();
        if (altKey && altKey !== apiKey) {
          console.log('🔄 [Generate] Trying alternative key...');
          this.stats.keyFailovers++;
          return this.generateWithKey(prompt, options, altKey, startTime, model);
        }
      }

      this.stats.errors++;
      return {
        success: false,
        error: errorMessage,
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * 특정 키로 생성 시도 (failover용)
   */
  private async generateWithKey(
    prompt: string,
    options: GenerateOptions,
    apiKey: string,
    startTime: number,
    model: string
  ): Promise<GenerateResult> {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const generativeModel = genAI.getGenerativeModel({ model });

      const generationConfig = {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? 2048,
        topK: options.topK ?? 40,
        topP: options.topP ?? 0.95,
      };

      const result = await generativeModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig,
      });

      const response = result.response;
      const text = response.text();
      const processingTime = Date.now() - startTime;

      const usage = {
        promptTokens: response.usageMetadata?.promptTokenCount || 0,
        completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: response.usageMetadata?.totalTokenCount || 0,
      };

      this.stats.successes++;
      this.stats.totalTokens += usage.totalTokens;

      console.log(
        `✅ [Generate] Success (failover): ${model}, ${usage.totalTokens} tokens`
      );

      return {
        success: true,
        text,
        model,
        usage,
        processingTime,
      };
    } catch (error) {
      this.stats.errors++;
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * 스트리밍 생성 (선택적)
   */
  async generateStream(
    prompt: string,
    options: GenerateOptions = {}
  ): Promise<ReadableStream<Uint8Array> | null> {
    const model = options.model || this.DEFAULT_MODEL;

    const apiKey = this.getApiKey();
    if (!apiKey) {
      console.error('❌ [Generate Stream] No API key available');
      return null;
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const generativeModel = genAI.getGenerativeModel({ model });

      const generationConfig = {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? 2048,
        topK: options.topK ?? 40,
        topP: options.topP ?? 0.95,
      };

      const result = await generativeModel.generateContentStream({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig,
      });

      // Convert to ReadableStream
      const encoder = new TextEncoder();
      return new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of result.stream) {
              const text = chunk.text();
              if (text) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
              }
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        },
      });
    } catch (error) {
      console.error('❌ [Generate Stream] Error:', error);
      return null;
    }
  }

  /**
   * API 키 가져오기
   */
  private getApiKey(): string | null {
    const keys = this.getAvailableKeys();
    if (keys.length === 0) return null;

    // Round-robin 방식으로 키 선택
    const key = keys[this.currentKeyIndex % keys.length];
    return key ?? null;
  }

  /**
   * 대체 키 가져오기
   */
  private getAlternativeKey(): string | null {
    const keys = this.getAvailableKeys();
    if (keys.length <= 1) return null;

    this.currentKeyIndex = (this.currentKeyIndex + 1) % keys.length;
    return keys[this.currentKeyIndex] ?? null;
  }

  /**
   * 사용 가능한 모든 키 가져오기
   */
  private getAvailableKeys(): string[] {
    const keys: string[] = [];

    if (process.env.GEMINI_API_KEY_PRIMARY) {
      keys.push(process.env.GEMINI_API_KEY_PRIMARY);
    }
    if (process.env.GOOGLE_AI_API_KEY) {
      keys.push(process.env.GOOGLE_AI_API_KEY);
    }
    if (process.env.GEMINI_API_KEY_SECONDARY) {
      keys.push(process.env.GEMINI_API_KEY_SECONDARY);
    }
    if (process.env.GOOGLE_AI_API_KEY_SECONDARY) {
      keys.push(process.env.GOOGLE_AI_API_KEY_SECONDARY);
    }

    // 중복 제거
    return [...new Set(keys)];
  }

  /**
   * 서비스 통계
   */
  getStats() {
    return {
      ...this.stats,
      successRate:
        this.stats.requests > 0
          ? Math.round((this.stats.successes / this.stats.requests) * 100)
          : 0,
      availableKeys: this.getAvailableKeys().length,
    };
  }
}

// 싱글톤 인스턴스
export const generateService = new CloudRunGenerateService();
