/**
 * Buffer Manager for Context Compression
 *
 * Manages conversation history with hybrid approach:
 * - Recent N messages: Keep original (for context continuity)
 * - Older messages: Compress into summary
 *
 * Uses LangGraph RemoveMessage pattern for state management.
 *
 * Phase 2 of Context Compression System Implementation
 *
 * @module context-compression/buffer-manager
 */

import type { BaseMessage } from '@langchain/core/messages';
import { RemoveMessage, SystemMessage } from '@langchain/core/messages';
import type { CompressionMetadata } from '../state-definition';
import { getTokenCounter } from './encoding-counter';

// ============================================================================
// 1. Types
// ============================================================================

export interface BufferConfig {
  /** Number of recent messages to keep as original (default: 10) */
  recentMessageCount: number;
  /** Maximum tokens for summary (default: 500) */
  summaryMaxTokens: number;
  /** Minimum messages before allowing compression */
  minMessagesForCompression: number;
}

export interface CompressedBuffer {
  /** Summary of compressed messages */
  summary: string;
  /** Recent messages kept as original */
  recentMessages: BaseMessage[];
  /** Messages to be removed (for LangGraph RemoveMessage pattern) */
  messagesToRemove: RemoveMessage[];
  /** Number of messages that were compressed */
  compressedCount: number;
  /** Compression metadata */
  metadata: CompressionMetadata;
}

export interface BufferAnalysis {
  /** Total message count */
  totalMessages: number;
  /** Messages that would be compressed */
  messagesToCompress: number;
  /** Messages that would be kept */
  messagesToKeep: number;
  /** Whether compression is recommended */
  shouldCompress: boolean;
  /** Token count of messages to compress */
  compressableTokens: number;
}

// ============================================================================
// 2. Default Configuration
// ============================================================================

export const DEFAULT_BUFFER_CONFIG: BufferConfig = {
  recentMessageCount: 10,
  summaryMaxTokens: 500,
  minMessagesForCompression: 6,
};

// ============================================================================
// 3. BufferManager Class
// ============================================================================

export class BufferManager {
  private config: BufferConfig;

  constructor(config: Partial<BufferConfig> = {}) {
    this.config = { ...DEFAULT_BUFFER_CONFIG, ...config };
  }

  /**
   * Analyze current message buffer
   */
  analyze(messages: BaseMessage[]): BufferAnalysis {
    const totalMessages = messages.length;
    const messagesToKeep = Math.min(totalMessages, this.config.recentMessageCount);
    const messagesToCompress = Math.max(0, totalMessages - this.config.recentMessageCount);

    const shouldCompress =
      messagesToCompress > 0 && totalMessages >= this.config.minMessagesForCompression;

    // Calculate token count for compressable messages
    let compressableTokens = 0;
    if (messagesToCompress > 0) {
      const toCompress = messages.slice(0, messagesToCompress);
      const tokenCounter = getTokenCounter();
      for (const msg of toCompress) {
        const content = this.extractContent(msg);
        compressableTokens += tokenCounter.countTokens(content);
      }
    }

    return {
      totalMessages,
      messagesToCompress,
      messagesToKeep,
      shouldCompress,
      compressableTokens,
    };
  }

  /**
   * Compress messages, keeping recent ones and summarizing older ones
   * Note: This method prepares the buffer but does NOT call LLM for summary.
   * The summary should be generated externally and passed to finalize().
   */
  prepareCompression(messages: BaseMessage[]): {
    messagesToSummarize: BaseMessage[];
    recentMessages: BaseMessage[];
    messagesToRemove: RemoveMessage[];
  } {
    const analysis = this.analyze(messages);

    if (!analysis.shouldCompress) {
      return {
        messagesToSummarize: [],
        recentMessages: messages,
        messagesToRemove: [],
      };
    }

    const splitIndex = messages.length - this.config.recentMessageCount;
    const messagesToSummarize = messages.slice(0, splitIndex);
    const recentMessages = messages.slice(splitIndex);

    // Create RemoveMessage entries for LangGraph
    const messagesToRemove = messagesToSummarize
      .filter((msg) => msg.id !== undefined)
      .map((msg) => new RemoveMessage({ id: msg.id as string }));

    return {
      messagesToSummarize,
      recentMessages,
      messagesToRemove,
    };
  }

  /**
   * Finalize compression with provided summary
   */
  finalize(
    originalMessages: BaseMessage[],
    summary: string,
    messagesToRemove: RemoveMessage[],
    recentMessages: BaseMessage[]
  ): CompressedBuffer {
    const tokenCounter = getTokenCounter();

    // Calculate original token count
    let originalTokenCount = 0;
    for (const msg of originalMessages) {
      const content = this.extractContent(msg);
      originalTokenCount += tokenCounter.countTokens(content);
    }

    // Calculate summary token count
    const summaryTokenCount = tokenCounter.countTokens(summary);

    // Calculate compression ratio
    const compressedCount = originalMessages.length - recentMessages.length;
    const compressionRatio =
      originalTokenCount > 0 ? 1 - summaryTokenCount / originalTokenCount : 0;

    const metadata: CompressionMetadata = {
      lastCompressedAt: new Date().toISOString(),
      totalCompressedMessages: compressedCount,
      compressionRatio: Math.round(compressionRatio * 100) / 100,
      summaryTokenCount,
      originalTokenCount,
    };

    return {
      summary,
      recentMessages,
      messagesToRemove,
      compressedCount,
      metadata,
    };
  }

  /**
   * Format messages for summarization
   */
  formatForSummarization(messages: BaseMessage[]): string {
    return messages
      .map((msg) => {
        const role = msg._getType();
        const content = this.extractContent(msg);
        return `[${role}]: ${content}`;
      })
      .join('\n\n');
  }

  /**
   * Create a system message containing the conversation summary
   */
  createSummaryMessage(summary: string): SystemMessage {
    return new SystemMessage({
      content: `## 이전 대화 요약\n\n${summary}\n\n---\n(이전 대화 내용이 요약되었습니다. 위 내용을 참고하여 대화를 계속하세요.)`,
    });
  }

  /**
   * Extract text content from a message
   */
  private extractContent(message: BaseMessage): string {
    const content = message.content;

    if (typeof content === 'string') {
      return content;
    }

    if (Array.isArray(content)) {
      return content
        .filter(
          (part): part is { type: 'text'; text: string } =>
            typeof part === 'object' && part !== null && part.type === 'text'
        )
        .map((part) => part.text)
        .join('\n');
    }

    return '';
  }

  /**
   * Get current configuration
   */
  getConfig(): BufferConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<BufferConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}

// ============================================================================
// 4. Singleton Instance
// ============================================================================

let bufferManagerInstance: BufferManager | null = null;

/**
 * Get the global BufferManager instance
 */
export function getBufferManager(): BufferManager {
  if (!bufferManagerInstance) {
    bufferManagerInstance = new BufferManager();
  }
  return bufferManagerInstance;
}

/**
 * Reset the global BufferManager instance (for testing)
 */
export function resetBufferManager(): void {
  bufferManagerInstance = null;
}

// ============================================================================
// 5. Helper Functions
// ============================================================================

/**
 * Analyze message buffer
 */
export function analyzeBuffer(messages: BaseMessage[]): BufferAnalysis {
  return getBufferManager().analyze(messages);
}

/**
 * Prepare messages for compression
 */
export function prepareCompression(messages: BaseMessage[]): ReturnType<
  BufferManager['prepareCompression']
> {
  return getBufferManager().prepareCompression(messages);
}

/**
 * Format messages for LLM summarization
 */
export function formatMessagesForSummary(messages: BaseMessage[]): string {
  return getBufferManager().formatForSummarization(messages);
}
