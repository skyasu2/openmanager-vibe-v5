/**
 * Type declarations for @langfuse/langchain (v4+)
 *
 * @module langfuse-langchain.d.ts
 * @version 4.5.1
 *
 * ## Migration History
 * - 2025-12-25: Migrated from deprecated `langfuse-langchain` (v3.x)
 *
 * ## Package Changes
 * | v3 (deprecated) | v4 (current) |
 * |-----------------|--------------|
 * | langfuse-langchain | @langfuse/langchain |
 * | langfuse | @langfuse/core |
 *
 * ## Peer Dependencies
 * - @langchain/core >=0.3.0 (native support, no --legacy-peer-deps)
 * - @opentelemetry/api ^1.9.0
 *
 * @see https://langfuse.com/docs/observability/sdk/typescript/upgrade-path
 */

declare module '@langfuse/langchain' {
  export interface CallbackHandlerConfig {
    publicKey?: string;
    secretKey?: string;
    baseUrl?: string;
    sessionId?: string;
    userId?: string;
    metadata?: Record<string, unknown>;
    tags?: string[];
  }

  /**
   * LangChain CallbackHandler for LangFuse tracing
   * Compatible with @langchain/core >=0.3.0
   */
  export class CallbackHandler {
    constructor(config?: CallbackHandlerConfig);
    flushAsync(): Promise<void>;
    shutdownAsync(): Promise<void>;
    // Allow as LangChain callback handler
    [key: string]: unknown;
  }
}
