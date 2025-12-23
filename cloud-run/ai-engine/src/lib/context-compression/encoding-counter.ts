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
 * Note: Using conservative limits (80% of actual to leave room for output)
 */
const DEFAULT_MODEL_LIMITS: Record<string, number> = {
  // Google Gemini (80% of actual limits)
  'gemini-2.5-flash-lite': 800_000, // Actual: 1M
  'gemini-2.0-flash': 800_000,
  'gemini-1.5-flash': 800_000,

  // Groq (Llama models) - 80% of actual
  'llama-3.3-70b-versatile': 100_000, // Actual: 128K
  'llama-3.1-8b-instant': 100_000,
  'llama-3.1-70b-versatile': 100_000,

  // Default fallback (conservative)
  default: 100_000,
};

// Mutable model limits (can be updated at runtime)
const modelContextLimits: Record<string, number> = { ...DEFAULT_MODEL_LIMITS };

/**
 * Get model context limits (read-only view)
 */
export const MODEL_CONTEXT_LIMITS: Readonly<Record<string, number>> = modelContextLimits;

/**
 * Register or update a model's context limit
 * Use this to add new models or adjust limits at runtime
 */
export function setModelContextLimit(modelId: string, limit: number): void {
  if (limit <= 0) {
    console.warn(`[TokenCounter] Invalid limit ${limit} for ${modelId}, ignoring`);
    return;
  }
  modelContextLimits[modelId] = limit;
}

/**
 * Get context limit for a model (with fallback)
 */
export function getModelContextLimit(modelId: string): number {
  return modelContextLimits[modelId] ?? modelContextLimits.default;
}

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
   * Extract ALL content from a message (text + tool calls + additional_kwargs)
   * Fix: Previously only counted text parts, missing tool/function payloads
   */
  private extractMessageContent(message: BaseMessage): string {
    const parts: string[] = [];
    const content = message.content;

    // 1. Extract text content
    if (typeof content === 'string') {
      parts.push(content);
    } else if (Array.isArray(content)) {
      for (const part of content) {
        if (typeof part === 'object' && part !== null) {
          if (part.type === 'text' && 'text' in part) {
            parts.push(part.text as string);
          } else if (part.type === 'tool_use' || part.type === 'tool_result') {
            // Tool use/result payloads
            parts.push(JSON.stringify(part));
          }
        }
      }
    }

    // 2. Extract tool_calls from additional_kwargs (OpenAI format)
    const kwargs = message.additional_kwargs;
    if (kwargs?.tool_calls && Array.isArray(kwargs.tool_calls)) {
      for (const toolCall of kwargs.tool_calls) {
        parts.push(JSON.stringify(toolCall));
      }
    }

    // 3. Extract function_call (legacy format)
    if (kwargs?.function_call) {
      parts.push(JSON.stringify(kwargs.function_call));
    }

    return parts.join('\n');
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
