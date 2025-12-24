/**
 * Type declarations for langfuse-langchain
 * This module provides LangChain callback handler for LangFuse tracing
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

  export class CallbackHandler {
    constructor(config: CallbackHandlerConfig);
    flushAsync(): Promise<void>;
    shutdownAsync(): Promise<void>;
  }
}
