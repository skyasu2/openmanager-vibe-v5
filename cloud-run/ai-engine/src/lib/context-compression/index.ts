/**
 * Context Compression Module
 *
 * Provides token counting and compression triggers for managing
 * conversation context within LLM token limits.
 *
 * Phase 1 Implementation:
 * - TokenCounter: Accurate token counting using js-tiktoken
 * - CompressionTrigger: Threshold-based compression decisions
 *
 * Phase 2 Implementation:
 * - BufferManager: Hybrid buffer with recent messages + summary
 *
 * Phase 3 Implementation:
 * - Summarizer: LLM-based conversation summarization
 * - CompressionNode: LangGraph integration node
 *
 * @module context-compression
 */

// Token Counter
export {
  TokenCounter,
  getTokenCounter,
  resetTokenCounter,
  countTokens,
  countMessageTokens,
  getContextUsageRatio,
  MODEL_CONTEXT_LIMITS,
  type TokenCountResult,
  type UsageRatioResult,
} from './encoding-counter';

// Compression Trigger
export {
  CompressionTrigger,
  getCompressionTrigger,
  resetCompressionTrigger,
  shouldCompressMessages,
  needsCompression,
  getCompressionLevel,
  DEFAULT_COMPRESSION_CONFIG,
  type CompressionLevel,
  type CompressionConfig,
  type CompressionDecision,
} from './compression-trigger';

// Buffer Manager (Phase 2)
export {
  BufferManager,
  getBufferManager,
  resetBufferManager,
  analyzeBuffer,
  prepareCompression,
  formatMessagesForSummary,
  DEFAULT_BUFFER_CONFIG,
  type BufferConfig,
  type CompressedBuffer,
  type BufferAnalysis,
} from './buffer-manager';

// Summarizer (Phase 3)
export {
  Summarizer,
  getSummarizer,
  resetSummarizer,
  summarizeMessages,
  shouldSummarize,
  DEFAULT_SUMMARIZER_CONFIG,
  type SummarizerConfig,
  type SummarizationResult,
} from './summarizer';

// Compression Node - LangGraph Integration (Phase 3)
export {
  compressionNode,
  shouldCompress,
  forceCompression,
  getCompressionStats,
  createCompressionMiddleware,
  type CompressionNodeResult,
  type CompressionStats,
} from './compression-node';
