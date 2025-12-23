/**
 * Compression Node for LangGraph Integration
 *
 * Provides a LangGraph-compatible node that compresses conversation
 * history when token limits are approached.
 *
 * Phase 3 of Context Compression System Implementation
 *
 * @module context-compression/compression-node
 */

import type { BaseMessage } from '@langchain/core/messages';
import type { AgentStateType, CompressionMetadata } from '../state-definition';
import { getCompressionTrigger } from './compression-trigger';
import { getSummarizer, type SummarizationResult } from './summarizer';

// ============================================================================
// 1. Types
// ============================================================================

export interface CompressionNodeResult {
  /** Updated messages array (summary + recent messages) */
  messages: BaseMessage[];
  /** Updated conversation summary */
  conversationSummary: string;
  /** Updated compression metadata */
  compressionMetadata: CompressionMetadata;
}

export interface CompressionStats {
  wasCompressed: boolean;
  originalMessageCount: number;
  compressedMessageCount: number;
  removedMessageCount: number;
  processingTimeMs: number;
  compressionRatio: number;
}

// ============================================================================
// 2. Compression Node Function
// ============================================================================

/**
 * LangGraph node that handles context compression
 *
 * This node should be added before long-running agents to ensure
 * context stays within token limits.
 *
 * @example
 * ```typescript
 * const graph = new StateGraph(AgentState)
 *   .addNode('compression', compressionNode)
 *   .addNode('supervisor', supervisorNode)
 *   .addEdge(START, 'compression')
 *   .addEdge('compression', 'supervisor');
 * ```
 */
export async function compressionNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  const { messages } = state;

  // Check if compression is needed
  const trigger = getCompressionTrigger();
  const decision = trigger.evaluate(messages);

  if (!decision.shouldCompress) {
    // No compression needed
    console.log('[CompressionNode] No compression needed', {
      usagePercent: Math.round(decision.usageRatio * 100),
      level: decision.level,
    });
    return {};
  }

  console.log('[CompressionNode] Starting compression', {
    level: decision.level,
    usagePercent: Math.round(decision.usageRatio * 100),
    messageCount: messages.length,
  });

  // Perform summarization
  const summarizer = getSummarizer();
  const result = await summarizer.summarize(messages);

  if (!result.wasCompressed) {
    return {};
  }

  // Build new message array: [summary, ...recentMessages]
  const newMessages: BaseMessage[] = [
    result.summaryMessage,
    ...result.compressedBuffer.recentMessages,
  ];

  console.log('[CompressionNode] Compression complete', {
    originalCount: messages.length,
    newCount: newMessages.length,
    compressedCount: result.compressedBuffer.compressedCount,
    compressionRatio: result.compressedBuffer.metadata.compressionRatio,
    processingTimeMs: result.processingTimeMs,
  });

  return {
    messages: newMessages,
    conversationSummary: result.summary,
    compressionMetadata: result.compressedBuffer.metadata,
  };
}

// ============================================================================
// 3. Conditional Compression Edge
// ============================================================================

/**
 * Conditional edge function for LangGraph
 *
 * Use this to conditionally route to compression based on context usage.
 *
 * @example
 * ```typescript
 * graph.addConditionalEdges('some_node', shouldCompress, {
 *   compress: 'compression',
 *   continue: 'next_node',
 * });
 * ```
 */
export function shouldCompress(
  state: AgentStateType
): 'compress' | 'continue' {
  const trigger = getCompressionTrigger();
  const decision = trigger.evaluate(state.messages);

  return decision.shouldCompress ? 'compress' : 'continue';
}

// ============================================================================
// 4. Utility Functions
// ============================================================================

/**
 * Get compression statistics for current state
 */
export function getCompressionStats(state: AgentStateType): {
  currentUsage: number;
  needsCompression: boolean;
  level: string;
  lastCompressedAt: string | null;
  totalCompressedMessages: number;
} {
  const trigger = getCompressionTrigger();
  const decision = trigger.evaluate(state.messages);
  const metadata = state.compressionMetadata;

  return {
    currentUsage: Math.round(decision.usageRatio * 100),
    needsCompression: decision.shouldCompress,
    level: decision.level,
    lastCompressedAt: metadata.lastCompressedAt,
    totalCompressedMessages: metadata.totalCompressedMessages,
  };
}

/**
 * Force compression regardless of threshold
 * Useful for explicit user-triggered compression
 */
export async function forceCompression(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  const { messages } = state;

  if (messages.length < 2) {
    console.log('[CompressionNode] Too few messages to compress');
    return {};
  }

  console.log('[CompressionNode] Force compression requested', {
    messageCount: messages.length,
  });

  const summarizer = getSummarizer();
  const result = await summarizer.summarize(messages);

  if (!result.wasCompressed) {
    return {};
  }

  const newMessages: BaseMessage[] = [
    result.summaryMessage,
    ...result.compressedBuffer.recentMessages,
  ];

  return {
    messages: newMessages,
    conversationSummary: result.summary,
    compressionMetadata: result.compressedBuffer.metadata,
  };
}

// ============================================================================
// 5. Integration Helper
// ============================================================================

/**
 * Create a compression-aware message handler
 *
 * Wraps message processing to automatically compress when needed.
 */
export function createCompressionMiddleware(
  options: { autoCompress?: boolean; modelId?: string } = {}
): (
  messages: BaseMessage[],
  processor: (messages: BaseMessage[]) => Promise<BaseMessage[]>
) => Promise<BaseMessage[]> {
  const { autoCompress = true, modelId = 'default' } = options;

  return async (messages, processor) => {
    let processedMessages = messages;

    // Check if compression needed before processing
    if (autoCompress) {
      const trigger = getCompressionTrigger();
      const decision = trigger.evaluate(messages, modelId);

      if (decision.shouldCompress) {
        const summarizer = getSummarizer();
        const result = await summarizer.summarize(messages);

        if (result.wasCompressed) {
          processedMessages = [
            result.summaryMessage,
            ...result.compressedBuffer.recentMessages,
          ];
        }
      }
    }

    // Process messages
    return processor(processedMessages);
  };
}
