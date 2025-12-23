/**
 * Compression Trigger for Context Compression
 *
 * Determines when and how aggressively to compress conversation context
 * based on token usage ratios.
 *
 * Phase 1 of Context Compression System Implementation
 *
 * @module context-compression/compression-trigger
 */

import type { BaseMessage } from '@langchain/core/messages';
import { getTokenCounter, MODEL_CONTEXT_LIMITS } from './encoding-counter';

// ============================================================================
// 1. Types
// ============================================================================

export type CompressionLevel = 'none' | 'light' | 'aggressive';

export interface CompressionConfig {
  /** Threshold to start light compression (default: 0.85 = 85%) */
  usageThreshold: number;
  /** Threshold for aggressive compression (default: 0.95 = 95%) */
  emergencyThreshold: number;
  /** Minimum messages before considering compression */
  minMessagesBeforeCompression: number;
}

export interface CompressionDecision {
  shouldCompress: boolean;
  level: CompressionLevel;
  reason: string;
  usageRatio: number;
  usedTokens: number;
  limitTokens: number;
}

// ============================================================================
// 2. Default Configuration
// ============================================================================

export const DEFAULT_COMPRESSION_CONFIG: CompressionConfig = {
  usageThreshold: 0.85,
  emergencyThreshold: 0.95,
  minMessagesBeforeCompression: 6, // At least 3 exchanges (user + assistant)
};

// ============================================================================
// 3. CompressionTrigger Class
// ============================================================================

export class CompressionTrigger {
  private config: CompressionConfig;

  constructor(config: Partial<CompressionConfig> = {}) {
    this.config = { ...DEFAULT_COMPRESSION_CONFIG, ...config };
  }

  /**
   * Determine if compression should be triggered
   */
  shouldCompress(usageRatio: number, threshold?: number): boolean {
    const effectiveThreshold = threshold ?? this.config.usageThreshold;
    return usageRatio >= effectiveThreshold;
  }

  /**
   * Get the compression level based on usage ratio
   */
  getLevel(usageRatio: number): CompressionLevel {
    if (usageRatio >= this.config.emergencyThreshold) {
      return 'aggressive';
    }
    if (usageRatio >= this.config.usageThreshold) {
      return 'light';
    }
    return 'none';
  }

  /**
   * Evaluate messages and return a compression decision
   */
  evaluate(messages: BaseMessage[], modelId: string = 'default'): CompressionDecision {
    const tokenCounter = getTokenCounter();
    const usageResult = tokenCounter.getUsageRatio(messages, modelId);

    // Check minimum message count
    if (messages.length < this.config.minMessagesBeforeCompression) {
      return {
        shouldCompress: false,
        level: 'none',
        reason: `Message count (${messages.length}) below minimum (${this.config.minMessagesBeforeCompression})`,
        usageRatio: usageResult.ratio,
        usedTokens: usageResult.usedTokens,
        limitTokens: usageResult.limitTokens,
      };
    }

    const level = this.getLevel(usageResult.ratio);
    const shouldCompress = level !== 'none';

    let reason: string;
    if (level === 'aggressive') {
      reason = `Emergency: ${usageResult.percentUsed}% usage exceeds ${this.config.emergencyThreshold * 100}% threshold`;
    } else if (level === 'light') {
      reason = `High usage: ${usageResult.percentUsed}% exceeds ${this.config.usageThreshold * 100}% threshold`;
    } else {
      reason = `Normal: ${usageResult.percentUsed}% usage is within limits`;
    }

    return {
      shouldCompress,
      level,
      reason,
      usageRatio: usageResult.ratio,
      usedTokens: usageResult.usedTokens,
      limitTokens: usageResult.limitTokens,
    };
  }

  /**
   * Quick check if compression is needed (for middleware use)
   */
  needsCompression(messages: BaseMessage[], modelId: string = 'default'): boolean {
    if (messages.length < this.config.minMessagesBeforeCompression) {
      return false;
    }

    const tokenCounter = getTokenCounter();
    const usageResult = tokenCounter.getUsageRatio(messages, modelId);
    return usageResult.ratio >= this.config.usageThreshold;
  }

  /**
   * Get remaining capacity before compression is needed
   */
  getRemainingCapacity(messages: BaseMessage[], modelId: string = 'default'): {
    tokensUntilCompression: number;
    percentUntilCompression: number;
  } {
    const tokenCounter = getTokenCounter();
    const usageResult = tokenCounter.getUsageRatio(messages, modelId);

    const thresholdTokens = Math.floor(usageResult.limitTokens * this.config.usageThreshold);
    const tokensUntilCompression = Math.max(0, thresholdTokens - usageResult.usedTokens);
    const percentUntilCompression = Math.max(
      0,
      Math.round((this.config.usageThreshold - usageResult.ratio) * 100)
    );

    return {
      tokensUntilCompression,
      percentUntilCompression,
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): CompressionConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<CompressionConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}

// ============================================================================
// 4. Singleton Instance
// ============================================================================

let compressionTriggerInstance: CompressionTrigger | null = null;

/**
 * Get the global CompressionTrigger instance
 */
export function getCompressionTrigger(): CompressionTrigger {
  if (!compressionTriggerInstance) {
    compressionTriggerInstance = new CompressionTrigger();
  }
  return compressionTriggerInstance;
}

/**
 * Reset the global CompressionTrigger instance (for testing)
 */
export function resetCompressionTrigger(): void {
  compressionTriggerInstance = null;
}

// ============================================================================
// 5. Helper Functions
// ============================================================================

/**
 * Quick compression check for messages
 */
export function shouldCompressMessages(
  messages: BaseMessage[],
  modelId?: string
): CompressionDecision {
  return getCompressionTrigger().evaluate(messages, modelId);
}

/**
 * Quick check if compression is needed
 */
export function needsCompression(messages: BaseMessage[], modelId?: string): boolean {
  return getCompressionTrigger().needsCompression(messages, modelId);
}

/**
 * Get compression level for current usage
 */
export function getCompressionLevel(messages: BaseMessage[], modelId?: string): CompressionLevel {
  const decision = getCompressionTrigger().evaluate(messages, modelId);
  return decision.level;
}
