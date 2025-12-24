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

// LangFuse Callback Handler interface (compatible with LangChain)
interface LangFuseCallbackHandler {
  flushAsync?: () => Promise<void>;
  shutdownAsync?: () => Promise<void>;
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
    const module = await import('langfuse-langchain');
    CallbackHandlerClass = module.CallbackHandler;
    return CallbackHandlerClass;
  } catch {
    console.warn('⚠️ [LangFuse] langfuse-langchain not installed. Run: npm install langfuse-langchain');
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
 * @returns CallbackHandler instance or null if not configured
 */
export function createSessionHandler(
  options: SessionHandlerOptions
): LangFuseCallbackHandler | null {
  if (!isLangFuseEnabled()) {
    return null;
  }

  // Synchronous version - we'll initialize lazily in the handler
  const config = getConfig();
  const { sessionId, userId, metadata } = options;

  // Return a proxy handler that initializes on first use
  let actualHandler: LangFuseCallbackHandler | null = null;
  let initPromise: Promise<LangFuseCallbackHandler | null> | null = null;

  const initHandler = async () => {
    if (actualHandler) return actualHandler;
    if (initPromise) return initPromise;

    initPromise = (async () => {
      const HandlerClass = await getCallbackHandlerClass();
      if (!HandlerClass) return null;

      actualHandler = new HandlerClass({
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
      return actualHandler;
    })();

    return initPromise;
  };

  // Return wrapper object that acts as callback handler
  // LangChain callbacks are duck-typed, so we can return a compatible object
  const wrapper: LangFuseCallbackHandler = {
    async flushAsync() {
      const handler = await initHandler();
      await handler?.flushAsync?.();
    },
    async shutdownAsync() {
      const handler = await initHandler();
      await handler?.shutdownAsync?.();
    },
  };

  // Trigger initialization immediately
  initHandler().catch(err => console.warn('⚠️ [LangFuse] Init failed:', err));

  return wrapper;
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
