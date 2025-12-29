/**
 * Langfuse Observability Integration
 *
 * MIT 라이선스 LLM 관측성 플랫폼
 * - 무료 티어: 1M spans/월
 * - 트레이싱, 토큰 사용량, 성능 분석
 *
 * @see https://langfuse.com/docs
 */

// Langfuse types (manually defined to avoid import errors when module not installed)
interface LangfuseConfig {
  secretKey: string;
  publicKey: string;
  baseUrl?: string;
  flushAt?: number;
  flushInterval?: number;
}

interface LangfuseTrace {
  generation: (params: {
    name: string;
    model: string;
    input: unknown;
    output?: string;
    usage?: { input: number; output: number; total: number };
    metadata?: Record<string, unknown>;
  }) => unknown;
  span: (params: {
    name: string;
    input: object;
    output: object;
    metadata?: Record<string, unknown>;
  }) => unknown;
  event: (params: { name: string; metadata?: Record<string, unknown> }) => unknown;
  update: (params: { output: string; metadata?: Record<string, unknown> }) => void;
  score: (params: { name: string; value: number }) => void;
}

interface LangfuseClient {
  trace: (params: {
    name: string;
    sessionId?: string;
    userId?: string;
    metadata?: Record<string, unknown>;
    input?: string;
  }) => LangfuseTrace;
  flushAsync: () => Promise<void>;
  shutdownAsync: () => Promise<void>;
}

// Dynamic import wrapper
type LangfuseConstructor = new (config: LangfuseConfig) => LangfuseClient;
let LangfuseClass: LangfuseConstructor | null = null;
let loadAttempted = false;

async function loadLangfuse(): Promise<LangfuseConstructor | null> {
  if (loadAttempted) {
    return LangfuseClass;
  }
  loadAttempted = true;

  try {
    // Dynamic import with type assertion
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const module = (await import('langfuse' as string)) as any;
    LangfuseClass = module.Langfuse as LangfuseConstructor;
    return LangfuseClass;
  } catch {
    console.warn('⚠️ [Langfuse] Module not installed, observability disabled');
    return null;
  }
}

// ============================================================================
// 1. Langfuse Client Singleton
// ============================================================================

let langfuseClient: LangfuseClient | null = null;
let initPromise: Promise<LangfuseClient> | null = null;

async function initLangfuse(): Promise<LangfuseClient> {
  const Langfuse = await loadLangfuse();

  if (!Langfuse) {
    return createNoOpLangfuse();
  }

  const secretKey = process.env.LANGFUSE_SECRET_KEY;
  const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
  const baseUrl = process.env.LANGFUSE_BASE_URL || 'https://us.cloud.langfuse.com';

  if (!secretKey || !publicKey) {
    console.warn('⚠️ [Langfuse] Missing API keys, observability disabled');
    return createNoOpLangfuse();
  }

  const client = new Langfuse({
    secretKey,
    publicKey,
    baseUrl,
    flushAt: 10,
    flushInterval: 5000,
  });

  console.log('✅ [Langfuse] Initialized with', baseUrl);
  return client;
}

export function getLangfuse(): LangfuseClient {
  // Synchronous access - use no-op if not initialized yet
  if (!langfuseClient) {
    // Start async initialization
    if (!initPromise) {
      initPromise = initLangfuse().then((client) => {
        langfuseClient = client;
        return client;
      });
    }
    // Return no-op until initialized
    return createNoOpLangfuse();
  }

  return langfuseClient;
}

// ============================================================================
// 2. Trace Helpers
// ============================================================================

export interface TraceMetadata {
  sessionId: string;
  userId?: string;
  mode?: 'single' | 'multi' | 'auto';
  query: string;
}

export interface GenerationParams {
  model: string;
  provider: string;
  input: string | object;
  output?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  duration?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Create a trace for a supervisor execution
 */
export function createSupervisorTrace(metadata: TraceMetadata): LangfuseTrace {
  const langfuse = getLangfuse();

  const trace = langfuse.trace({
    name: 'supervisor-execution',
    sessionId: metadata.sessionId,
    userId: metadata.userId,
    metadata: {
      mode: metadata.mode,
      queryLength: metadata.query.length,
    },
    input: metadata.query,
  });

  return trace;
}

/**
 * Log a generation (LLM call)
 */
export function logGeneration(trace: LangfuseTrace, params: GenerationParams): void {
  trace.generation({
    name: `${params.provider}/${params.model}`,
    model: params.model,
    input: params.input,
    output: params.output,
    usage: params.usage
      ? {
          input: params.usage.inputTokens,
          output: params.usage.outputTokens,
          total: params.usage.totalTokens,
        }
      : undefined,
    metadata: {
      provider: params.provider,
      duration: params.duration,
      ...params.metadata,
    },
  });
}

/**
 * Log a tool call span
 */
export function logToolCall(
  trace: LangfuseTrace,
  toolName: string,
  input: unknown,
  output: unknown,
  durationMs: number
): void {
  trace.span({
    name: `tool:${toolName}`,
    input: input as object,
    output: output as object,
    metadata: {
      durationMs,
      toolName,
    },
  });
}

/**
 * Log agent handoff
 */
export function logHandoff(
  trace: LangfuseTrace,
  fromAgent: string,
  toAgent: string,
  reason?: string
): void {
  trace.event({
    name: 'agent-handoff',
    metadata: {
      from: fromAgent,
      to: toAgent,
      reason,
    },
  });
}

/**
 * Finalize trace with output and score
 */
export function finalizeTrace(
  trace: LangfuseTrace,
  output: string,
  success: boolean,
  metadata?: Record<string, unknown>
): void {
  trace.update({
    output,
    metadata: {
      success,
      ...metadata,
    },
  });

  // Optionally add a score
  if (success) {
    trace.score({
      name: 'execution-success',
      value: 1,
    });
  }
}

/**
 * Flush pending traces (call before shutdown)
 */
export async function flushLangfuse(): Promise<void> {
  if (langfuseClient) {
    await langfuseClient.flushAsync();
  }
}

/**
 * Shutdown Langfuse client
 */
export async function shutdownLangfuse(): Promise<void> {
  if (langfuseClient) {
    await langfuseClient.shutdownAsync();
    langfuseClient = null;
  }
}

// ============================================================================
// 3. No-Op Client (for when keys are missing or module not installed)
// ============================================================================

function createNoOpLangfuse(): LangfuseClient {
  // Create a mock that does nothing
  const noOpTrace: LangfuseTrace = {
    generation: () => ({}),
    span: () => ({}),
    event: () => ({}),
    update: () => {},
    score: () => {},
  };

  return {
    trace: () => noOpTrace,
    flushAsync: async () => {},
    shutdownAsync: async () => {},
  };
}

// ============================================================================
// 4. Export Types
// ============================================================================

export type { LangfuseClient, LangfuseTrace };
