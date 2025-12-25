/**
 * Type declarations for @langfuse/langchain (v4+)
 * Migrated from deprecated langfuse-langchain package
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
