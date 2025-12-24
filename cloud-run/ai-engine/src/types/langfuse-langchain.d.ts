/**
 * Type declarations for langfuse-langchain
 * This module provides LangChain callback handler for LangFuse tracing
 *
 * Note: We use a flexible type to avoid version conflicts between
 * langfuse-langchain and @langchain/core versions
 */

declare module 'langfuse-langchain' {
  export interface CallbackHandlerConfig {
    publicKey: string;
    secretKey: string;
    baseUrl?: string;
    sessionId?: string;
    userId?: string;
    metadata?: Record<string, unknown>;
  }

  // Use flexible type to work with any @langchain/core version
  export class CallbackHandler {
    constructor(config: CallbackHandlerConfig);
    flushAsync(): Promise<void>;
    shutdownAsync(): Promise<void>;
    // Allow as LangChain callback handler
    [key: string]: unknown;
  }
}
