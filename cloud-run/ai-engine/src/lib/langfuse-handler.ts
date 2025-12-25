/**
 * LangFuse Integration Handler
 * Provides tracing and observability for LangGraph Multi-Agent Supervisor
 *
 * @module langfuse-handler
 * @version 1.0.0
 */

// =============================================================================
// Types
// =============================================================================

interface LangFuseConfig {
  publicKey?: string;
  secretKey?: string;
  baseUrl?: string;
}

interface SessionHandlerOptions {
  sessionId: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

// LangFuse Callback Handler type (compatible with LangChain callbacks)
// Uses a flexible interface to work with any @langchain/core version
export interface LangFuseCallbackHandler {
  flushAsync?: () => Promise<void>;
  shutdownAsync?: () => Promise<void>;
  [key: string]: unknown;
}

// =============================================================================
// Configuration
// =============================================================================

const DEFAULT_BASE_URL = 'https://cloud.langfuse.com';

function getConfig(): LangFuseConfig {
  return {
    publicKey: process.env.LANGFUSE_PUBLIC_KEY,
    secretKey: process.env.LANGFUSE_SECRET_KEY,
    baseUrl: process.env.LANGFUSE_BASE_URL || DEFAULT_BASE_URL,
  };
}

function isLangFuseEnabled(): boolean {
  const config = getConfig();
  return !!(config.publicKey && config.secretKey);
}

// =============================================================================
// Dynamic Import Helper (avoids missing module errors)
// =============================================================================

let CallbackHandlerClass: (new (config: {
  publicKey: string;
  secretKey: string;
  baseUrl?: string;
  sessionId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}) => LangFuseCallbackHandler) | null = null;

async function getCallbackHandlerClass() {
  if (CallbackHandlerClass) return CallbackHandlerClass;

  try {
    // v4: Use scoped package @langfuse/langchain (supports @langchain/core >=0.3.0)
    const module = await import('@langfuse/langchain');
    CallbackHandlerClass = module.CallbackHandler;
    return CallbackHandlerClass;
  } catch {
    console.warn('⚠️ [LangFuse] @langfuse/langchain not installed. Run: npm install @langfuse/langchain');
    return null;
  }
}

// =============================================================================
// Singleton Handler (for global tracing)
// =============================================================================

let globalHandler: LangFuseCallbackHandler | null = null;

/**
 * Get or create the global LangFuse callback handler
 * Reuses the same instance for all calls (singleton pattern)
 *
 * @returns CallbackHandler instance or null if not configured
 */
export async function getLangfuseHandler(): Promise<LangFuseCallbackHandler | null> {
  if (!isLangFuseEnabled()) {
    return null;
  }

  if (!globalHandler) {
    const HandlerClass = await getCallbackHandlerClass();
    if (!HandlerClass) return null;

    const config = getConfig();
    globalHandler = new HandlerClass({
      publicKey: config.publicKey!,
      secretKey: config.secretKey!,
      baseUrl: config.baseUrl,
    });
    console.log('✅ [LangFuse] Global handler initialized');
  }

  return globalHandler;
}

// =============================================================================
// Session-based Handler (for per-conversation tracing)
// =============================================================================

/**
 * Create a new session-specific LangFuse handler
 * Each conversation/session gets its own handler for proper trace grouping
 *
 * @param options - Session configuration
 * @returns Promise of CallbackHandler instance or null if not configured
 */
export async function createSessionHandler(
  options: SessionHandlerOptions
): Promise<LangFuseCallbackHandler | null> {
  if (!isLangFuseEnabled()) {
    return null;
  }

  const config = getConfig();
  const { sessionId, userId, metadata } = options;

  try {
    const HandlerClass = await getCallbackHandlerClass();
    if (!HandlerClass) return null;

    const handler = new HandlerClass({
      publicKey: config.publicKey!,
      secretKey: config.secretKey!,
      baseUrl: config.baseUrl,
      sessionId,
      userId: userId || 'anonymous',
      metadata: {
        ...metadata,
        service: 'openmanager-ai-engine',
        version: process.env.npm_package_version || '5.83.10',
      },
    });

    console.log(`✅ [LangFuse] Session handler created: ${sessionId}`);
    return handler as LangFuseCallbackHandler;
  } catch (err) {
    console.warn('⚠️ [LangFuse] Init failed:', err);
    return null;
  }
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Flush all pending LangFuse events
 * Call this before shutting down to ensure all traces are sent
 */
export async function flushLangfuse(): Promise<void> {
  if (globalHandler) {
    await globalHandler.flushAsync?.();
    console.log('✅ [LangFuse] Global handler flushed');
  }
}

/**
 * Get LangFuse status for health checks
 */
export function getLangfuseStatus(): {
  enabled: boolean;
  baseUrl: string;
  hasGlobalHandler: boolean;
} {
  const config = getConfig();
  return {
    enabled: isLangFuseEnabled(),
    baseUrl: config.baseUrl || DEFAULT_BASE_URL,
    hasGlobalHandler: globalHandler !== null,
  };
}

/**
 * Shutdown LangFuse handler
 * Call this on application shutdown
 */
export async function shutdownLangfuse(): Promise<void> {
  if (globalHandler) {
    await globalHandler.shutdownAsync?.();
    globalHandler = null;
    console.log('✅ [LangFuse] Handler shutdown complete');
  }
}
