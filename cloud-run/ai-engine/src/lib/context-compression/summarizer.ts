/**
 * LLM Summarizer for Context Compression
 *
 * Uses Gemini Flash Lite (high quota) to generate conversation summaries.
 * Integrates with BufferManager for hybrid buffer strategy.
 *
 * Phase 3 of Context Compression System Implementation
 *
 * @module context-compression/summarizer
 */

import type { BaseMessage } from '@langchain/core/messages';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { createGeminiModel, invokeGeminiWithFailover } from '../model-config';
import type { CompressionMetadata } from '../state-definition';
import {
  BufferManager,
  getBufferManager,
  type CompressedBuffer,
} from './buffer-manager';
import { getTokenCounter } from './encoding-counter';

// ============================================================================
// 1. Types
// ============================================================================

export interface SummarizerConfig {
  /** Maximum tokens for generated summary */
  maxSummaryTokens: number;
  /** Temperature for LLM (lower = more deterministic) */
  temperature: number;
  /** Model to use for summarization */
  model: 'gemini-2.5-flash-lite' | 'gemini-2.5-flash';
}

export interface SummarizationResult {
  /** Generated summary text */
  summary: string;
  /** Summary as SystemMessage for LangGraph state */
  summaryMessage: SystemMessage;
  /** Compressed buffer with metadata */
  compressedBuffer: CompressedBuffer;
  /** Whether summarization was performed */
  wasCompressed: boolean;
  /** Processing time in milliseconds */
  processingTimeMs: number;
}

// ============================================================================
// 2. Default Configuration
// ============================================================================

export const DEFAULT_SUMMARIZER_CONFIG: SummarizerConfig = {
  maxSummaryTokens: 500,
  temperature: 0.2,
  model: 'gemini-2.5-flash-lite', // High quota (1500 RPD)
};

// ============================================================================
// 3. Summarization Prompt
// ============================================================================

const SUMMARIZATION_SYSTEM_PROMPT = `당신은 대화 요약 전문가입니다. 주어진 대화 내용을 간결하고 핵심적인 요약으로 압축해야 합니다.

## 요약 규칙:
1. 핵심 정보와 맥락만 유지
2. 중복되는 내용 제거
3. 기술적 세부사항 보존 (서버명, 메트릭 값, 에러 메시지 등)
4. 사용자의 주요 질문과 AI의 핵심 답변 포함
5. 시간순 흐름 유지
6. 한국어로 작성

## 출력 형식:
- 2-4개의 핵심 포인트로 구성
- 각 포인트는 1-2문장
- 총 500 토큰 이내`;

// ============================================================================
// 4. Summarizer Class
// ============================================================================

export class Summarizer {
  private config: SummarizerConfig;
  private bufferManager: BufferManager;

  constructor(config: Partial<SummarizerConfig> = {}) {
    this.config = { ...DEFAULT_SUMMARIZER_CONFIG, ...config };
    this.bufferManager = getBufferManager();
  }

  /**
   * Summarize messages and return compressed buffer
   */
  async summarize(messages: BaseMessage[]): Promise<SummarizationResult> {
    const startTime = Date.now();

    // Check if compression is needed
    const preparation = this.bufferManager.prepareCompression(messages);

    if (preparation.messagesToSummarize.length === 0) {
      // No compression needed
      return {
        summary: '',
        summaryMessage: new SystemMessage({ content: '' }),
        compressedBuffer: {
          summary: '',
          recentMessages: messages,
          messagesToRemove: [],
          compressedCount: 0,
          metadata: this.createEmptyMetadata(),
        },
        wasCompressed: false,
        processingTimeMs: Date.now() - startTime,
      };
    }

    // Format messages for summarization
    const formattedMessages =
      this.bufferManager.formatForSummarization(preparation.messagesToSummarize);

    // Generate summary using LLM
    const summary = await this.generateSummary(formattedMessages);

    // Create summary message
    const summaryMessage = this.bufferManager.createSummaryMessage(summary);

    // Finalize compression
    const compressedBuffer = this.bufferManager.finalize(
      messages,
      summary,
      preparation.messagesToRemove,
      preparation.recentMessages
    );

    return {
      summary,
      summaryMessage,
      compressedBuffer,
      wasCompressed: true,
      processingTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Maximum input tokens for summarization request
   * Gemini Flash Lite has 1M context, but we limit input to avoid timeouts
   */
  private static readonly MAX_INPUT_TOKENS = 50_000;

  /**
   * Generate summary using Gemini model
   * Fix: Added input length control to prevent context overflow
   */
  private async generateSummary(formattedMessages: string): Promise<string> {
    try {
      // Truncate input if too long (Fix for Issue #2)
      const truncatedInput = this.truncateInput(formattedMessages);

      const summary = await invokeGeminiWithFailover(
        this.config.model,
        async (model) => {
          const response = await model.invoke([
            new SystemMessage({ content: SUMMARIZATION_SYSTEM_PROMPT }),
            new HumanMessage({
              content: `다음 대화를 요약해주세요:\n\n${truncatedInput}`,
            }),
          ]);

          return typeof response.content === 'string'
            ? response.content
            : JSON.stringify(response.content);
        },
        {
          temperature: this.config.temperature,
          maxOutputTokens: this.config.maxSummaryTokens,
        }
      );

      return summary;
    } catch (error) {
      console.error('[Summarizer] Failed to generate summary:', error);
      // Fallback: Return a basic extractive summary
      return this.createFallbackSummary(formattedMessages);
    }
  }

  /**
   * Truncate input to prevent context overflow
   */
  private truncateInput(input: string): string {
    const tokenCounter = getTokenCounter();
    const inputTokens = tokenCounter.countTokens(input);

    if (inputTokens <= Summarizer.MAX_INPUT_TOKENS) {
      return input;
    }

    // Truncate: keep first 20% and last 60% (prioritize recent context)
    const lines = input.split('\n');
    const totalLines = lines.length;
    const firstPart = Math.floor(totalLines * 0.2);
    const lastPart = Math.floor(totalLines * 0.6);

    const truncated = [
      ...lines.slice(0, firstPart),
      '\n... (중간 대화 일부 생략 - 토큰 제한) ...\n',
      ...lines.slice(-lastPart),
    ].join('\n');

    console.warn(
      `[Summarizer] Input truncated: ${inputTokens} → ~${tokenCounter.countTokens(truncated)} tokens`
    );

    return truncated;
  }

  /**
   * Create fallback summary when LLM fails
   */
  private createFallbackSummary(formattedMessages: string): string {
    const lines = formattedMessages.split('\n').filter((line) => line.trim());
    const tokenCounter = getTokenCounter();

    // Take first and last few messages as summary
    const summaryLines: string[] = [];
    let tokenCount = 0;
    const maxTokens = this.config.maxSummaryTokens;

    // Add first few lines
    for (const line of lines.slice(0, 3)) {
      const tokens = tokenCounter.countTokens(line);
      if (tokenCount + tokens < maxTokens / 2) {
        summaryLines.push(line);
        tokenCount += tokens;
      }
    }

    // Add separator
    if (lines.length > 6) {
      summaryLines.push('...(중간 대화 생략)...');
    }

    // Add last few lines
    for (const line of lines.slice(-3)) {
      const tokens = tokenCounter.countTokens(line);
      if (tokenCount + tokens < maxTokens) {
        summaryLines.push(line);
        tokenCount += tokens;
      }
    }

    return summaryLines.join('\n');
  }

  /**
   * Create empty metadata for no-compression case
   */
  private createEmptyMetadata(): CompressionMetadata {
    return {
      lastCompressedAt: null,
      totalCompressedMessages: 0,
      compressionRatio: 0,
      summaryTokenCount: 0,
      originalTokenCount: 0,
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): SummarizerConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<SummarizerConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}

// ============================================================================
// 5. Singleton Instance
// ============================================================================

let summarizerInstance: Summarizer | null = null;

/**
 * Get the global Summarizer instance
 */
export function getSummarizer(): Summarizer {
  if (!summarizerInstance) {
    summarizerInstance = new Summarizer();
  }
  return summarizerInstance;
}

/**
 * Reset the global Summarizer instance (for testing)
 */
export function resetSummarizer(): void {
  summarizerInstance = null;
}

// ============================================================================
// 6. Helper Functions
// ============================================================================

/**
 * Summarize messages using global instance
 */
export async function summarizeMessages(
  messages: BaseMessage[]
): Promise<SummarizationResult> {
  return getSummarizer().summarize(messages);
}

/**
 * Check if summarization would be beneficial
 */
export function shouldSummarize(messages: BaseMessage[]): boolean {
  const bufferManager = getBufferManager();
  const analysis = bufferManager.analyze(messages);
  return analysis.shouldCompress;
}
