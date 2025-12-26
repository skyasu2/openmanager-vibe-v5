/**
 * Cloud Run Generate Service
 * Mistral AI 텍스트 생성 담당
 *
 * Hybrid Architecture:
 * - Vercel에서 프록시를 통해 이 서비스 호출
 * - API 키는 Cloud Run에서만 관리
 *
 * Updated: 2025-12-26 - Migrated from Gemini to Mistral AI
 */

import { Mistral } from '@mistralai/mistralai';

interface GenerateOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
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
  // Use Mistral Small for high availability and fast responses
  private readonly DEFAULT_MODEL = 'mistral-small-latest';
  private client: Mistral | null = null;

  // 통계
  private stats = {
    requests: 0,
    successes: 0,
    errors: 0,
    totalTokens: 0,
  };

  /**
   * Get Mistral client (lazy initialization)
   */
  private getClient(): Mistral | null {
    if (this.client) return this.client;

    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      console.error('❌ [Generate] MISTRAL_API_KEY not configured');
      return null;
    }

    this.client = new Mistral({ apiKey });
    return this.client;
  }

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

    const client = this.getClient();
    if (!client) {
      return { success: false, error: 'No API key configured' };
    }

    try {
      const response = await client.chat.complete({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: options.temperature ?? 0.7,
        maxTokens: options.maxTokens ?? 2048,
        topP: options.topP ?? 0.95,
      });

      const processingTime = Date.now() - startTime;
      const text = response.choices?.[0]?.message?.content || '';

      // 사용량 추적
      const usage = {
        promptTokens: response.usage?.promptTokens || 0,
        completionTokens: response.usage?.completionTokens || 0,
        totalTokens: response.usage?.totalTokens || 0,
      };

      this.stats.successes++;
      this.stats.totalTokens += usage.totalTokens;

      console.log(
        `✅ [Generate] Success: ${model}, ${usage.totalTokens} tokens, ${processingTime}ms`
      );

      return {
        success: true,
        text: typeof text === 'string' ? text : JSON.stringify(text),
        model,
        usage,
        processingTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ [Generate] Error:', errorMessage);

      this.stats.errors++;
      return {
        success: false,
        error: errorMessage,
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * 스트리밍 생성
   */
  async generateStream(
    prompt: string,
    options: GenerateOptions = {}
  ): Promise<ReadableStream<Uint8Array> | null> {
    const model = options.model || this.DEFAULT_MODEL;

    const client = this.getClient();
    if (!client) {
      console.error('❌ [Generate Stream] No API key available');
      return null;
    }

    try {
      const stream = await client.chat.stream({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: options.temperature ?? 0.7,
        maxTokens: options.maxTokens ?? 2048,
        topP: options.topP ?? 0.95,
      });

      const encoder = new TextEncoder();
      return new ReadableStream({
        async start(controller) {
          try {
            for await (const event of stream) {
              const content = event.data.choices?.[0]?.delta?.content;
              if (content) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: content })}\n\n`));
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
   * 서비스 통계
   */
  getStats() {
    return {
      ...this.stats,
      successRate:
        this.stats.requests > 0
          ? Math.round((this.stats.successes / this.stats.requests) * 100)
          : 0,
      provider: 'mistral',
      model: this.DEFAULT_MODEL,
    };
  }
}

// 싱글톤 인스턴스
export const generateService = new CloudRunGenerateService();
