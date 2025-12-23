/**
 * Token Counter for Context Compression
 *
 * Uses js-tiktoken for accurate token counting compatible with
 * OpenAI/Gemini/Groq models.
 *
 * Phase 1 of Context Compression System Implementation
 *
 * @module context-compression/encoding-counter
 */

import type { BaseMessage } from '@langchain/core/messages';
import { getEncoding, type Tiktoken, type TiktokenEncoding } from 'js-tiktoken';

// ============================================================================
// 1. Types
// ============================================================================

export interface TokenCountResult {
  totalTokens: number;
  inputTokens: number;
  messageCount: number;
  avgTokensPerMessage: number;
}

export interface UsageRatioResult {
  ratio: number;
  usedTokens: number;
  limitTokens: number;
  remainingTokens: number;
  percentUsed: number;
}

// ============================================================================
// 2. Model Context Limits
// ============================================================================

/**
 * Context window limits for supported models
 * Note: Using conservative limits (leaving room for output)
 */
export const MODEL_CONTEXT_LIMITS: Record<string, number> = {
  // Google Gemini
  'gemini-2.5-flash-lite': 1_000_000, // 1M tokens
  'gemini-2.0-flash': 1_000_000,
  'gemini-1.5-flash': 1_000_000,

  // Groq (Llama models)
  'llama-3.3-70b-versatile': 128_000,
  'llama-3.1-8b-instant': 128_000,
  'llama-3.1-70b-versatile': 128_000,

  // Default fallback
  default: 128_000,
} as const;

// ============================================================================
// 3. TokenCounter Class
// ============================================================================

export class TokenCounter {
  private encoding: Tiktoken;
  private encodingName: TiktokenEncoding;

  constructor(encodingName: TiktokenEncoding = 'cl100k_base') {
    this.encodingName = encodingName;
    // cl100k_base is compatible with GPT-4/Claude/Gemini token approximation
    this.encoding = getEncoding(encodingName);
  }

  /**
   * Count tokens in a text string
   */
  countTokens(text: string): number {
    if (!text || typeof text !== 'string') {
      return 0;
    }
    try {
      return this.encoding.encode(text).length;
    } catch (error) {
      // Fallback: approximate 4 chars per token
      console.warn('[TokenCounter] Encoding failed, using approximation:', error);
      return Math.ceil(text.length / 4);
    }
  }

  /**
   * Count tokens in an array of LangChain messages
   */
  countMessages(messages: BaseMessage[]): TokenCountResult {
    if (!messages || messages.length === 0) {
      return {
        totalTokens: 0,
        inputTokens: 0,
        messageCount: 0,
        avgTokensPerMessage: 0,
      };
    }

    let totalTokens = 0;
    let inputTokens = 0;

    for (const message of messages) {
      const content = this.extractMessageContent(message);
      const tokens = this.countTokens(content);
      totalTokens += tokens;

      // Track input (human) vs output (ai) tokens
      if (message._getType() === 'human') {
        inputTokens += tokens;
      }

      // Add overhead for message metadata (role, etc.)
      totalTokens += 4; // ~4 tokens per message structure
    }

    return {
      totalTokens,
      inputTokens,
      messageCount: messages.length,
      avgTokensPerMessage: messages.length > 0
        ? Math.round(totalTokens / messages.length)
        : 0,
    };
  }

  /**
   * Calculate usage ratio against model context limit
   */
  getUsageRatio(messages: BaseMessage[], modelId: string = 'default'): UsageRatioResult {
    const { totalTokens } = this.countMessages(messages);
    const limitTokens = MODEL_CONTEXT_LIMITS[modelId] || MODEL_CONTEXT_LIMITS.default;

    const ratio = totalTokens / limitTokens;
    const remainingTokens = Math.max(0, limitTokens - totalTokens);

    return {
      ratio,
      usedTokens: totalTokens,
      limitTokens,
      remainingTokens,
      percentUsed: Math.round(ratio * 100),
    };
  }

  /**
   * Extract text content from a message
   */
  private extractMessageContent(message: BaseMessage): string {
    const content = message.content;

    if (typeof content === 'string') {
      return content;
    }

    if (Array.isArray(content)) {
      return content
        .filter((part): part is { type: 'text'; text: string } =>
          typeof part === 'object' && part !== null && part.type === 'text'
        )
        .map((part) => part.text)
        .join('\n');
    }

    return '';
  }

  /**
   * Get encoding name
   */
  getEncodingName(): TiktokenEncoding {
    return this.encodingName;
  }

  /**
   * Cleanup (js-tiktoken doesn't require explicit cleanup)
   */
  dispose(): void {
    // js-tiktoken doesn't require explicit resource cleanup
    // This method is kept for API consistency
  }
}

// ============================================================================
// 4. Singleton Instance
// ============================================================================

let tokenCounterInstance: TokenCounter | null = null;

/**
 * Get the global TokenCounter instance
 */
export function getTokenCounter(): TokenCounter {
  if (!tokenCounterInstance) {
    tokenCounterInstance = new TokenCounter();
  }
  return tokenCounterInstance;
}

/**
 * Reset the global TokenCounter instance (for testing)
 */
export function resetTokenCounter(): void {
  if (tokenCounterInstance) {
    tokenCounterInstance.dispose();
    tokenCounterInstance = null;
  }
}

// ============================================================================
// 5. Helper Functions
// ============================================================================

/**
 * Quick token count for a string
 */
export function countTokens(text: string): number {
  return getTokenCounter().countTokens(text);
}

/**
 * Quick token count for messages
 */
export function countMessageTokens(messages: BaseMessage[]): TokenCountResult {
  return getTokenCounter().countMessages(messages);
}

/**
 * Quick usage ratio check
 */
export function getContextUsageRatio(
  messages: BaseMessage[],
  modelId?: string
): UsageRatioResult {
  return getTokenCounter().getUsageRatio(messages, modelId);
}
