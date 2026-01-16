/**
 * Langfuse Observability Integration
 *
 * MIT 라이선스 LLM 관측성 플랫폼
 * - 무료 티어: 50,000 events/월 (공식 가격)
 * - 트레이싱, 토큰 사용량, 성능 분석
 * - ⚠️ 무료 티어 초과 시 자동 비활성화
 *
 * @see https://langfuse.com/docs
 */

// ============================================================================
// 0. 무료 티어 보호 시스템
// ============================================================================

const FREE_TIER_LIMIT = 50_000; // 월간 무료 한도
const SAFETY_THRESHOLD = 0.9; // 90%에서 차단 (45,000)
const DEFAULT_SAMPLE_RATE = 1.0; // 100% 전체 추적 (사용량 낮아 안전)

// 테스트 모드: 환경변수 또는 런타임 설정으로 100% 추적
let testModeEnabled = process.env.LANGFUSE_TEST_MODE === 'true';

// 테스트 모드 함수들은 클라이언트 선언 후 정의됨 (아래 섹션 참조)

interface UsageState {
  eventCount: number;
  monthKey: string; // "2025-01" 형식
  isDisabled: boolean;
  lastWarning: string | null;
}

// 메모리 내 사용량 추적 (서버 재시작 시 리셋 - 보수적 접근)
let usageState: UsageState = {
  eventCount: 0,
  monthKey: getCurrentMonthKey(),
  isDisabled: false,
  lastWarning: null,
};

function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function checkAndResetMonth(): void {
  const currentMonth = getCurrentMonthKey();
  if (usageState.monthKey !== currentMonth) {
    console.log(`🔄 [Langfuse] 월간 카운터 리셋: ${usageState.monthKey} → ${currentMonth}`);
    usageState = {
      eventCount: 0,
      monthKey: currentMonth,
      isDisabled: false,
      lastWarning: null,
    };
  }
}

function incrementUsage(count: number = 1): boolean {
  checkAndResetMonth();

  // 이미 비활성화된 경우
  if (usageState.isDisabled) {
    return false;
  }

  usageState.eventCount += count;
  const usagePercent = (usageState.eventCount / FREE_TIER_LIMIT) * 100;

  // 90% 도달 시 차단
  if (usageState.eventCount >= FREE_TIER_LIMIT * SAFETY_THRESHOLD) {
    usageState.isDisabled = true;
    console.error(
      `🚨 [Langfuse] 무료 티어 한도 90% 도달! 자동 비활성화됨 ` +
        `(${usageState.eventCount.toLocaleString()}/${FREE_TIER_LIMIT.toLocaleString()} events)`
    );
    return false;
  }

  // 70%, 80% 경고
  const warningThresholds = [0.7, 0.8];
  for (const threshold of warningThresholds) {
    const thresholdKey = `${threshold * 100}%`;
    if (
      usageState.eventCount >= FREE_TIER_LIMIT * threshold &&
      usageState.lastWarning !== thresholdKey
    ) {
      usageState.lastWarning = thresholdKey;
      console.warn(
        `⚠️ [Langfuse] 무료 티어 ${thresholdKey} 사용 중 ` +
          `(${usageState.eventCount.toLocaleString()}/${FREE_TIER_LIMIT.toLocaleString()} events)`
      );
    }
  }

  return true;
}

function shouldSample(): boolean {
  // 테스트 모드: 100% 추적
  if (testModeEnabled) {
    return true;
  }
  // 프로덕션: 10% 샘플링
  return Math.random() < DEFAULT_SAMPLE_RATE;
}

/** 현재 사용량 상태 조회 */
export function getLangfuseUsageStatus(): {
  eventCount: number;
  limit: number;
  usagePercent: number;
  isDisabled: boolean;
  monthKey: string;
  testMode: boolean;
  sampleRate: string;
} {
  checkAndResetMonth();
  return {
    eventCount: usageState.eventCount,
    limit: FREE_TIER_LIMIT,
    usagePercent: Math.round((usageState.eventCount / FREE_TIER_LIMIT) * 100),
    isDisabled: usageState.isDisabled,
    monthKey: usageState.monthKey,
    testMode: testModeEnabled,
    sampleRate: testModeEnabled ? '100%' : `${DEFAULT_SAMPLE_RATE * 100}%`,
  };
}

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

  // 테스트 모드: 즉시 플러시 (flushAt: 1), 프로덕션: 배치 플러시 (flushAt: 10)
  const flushConfig = testModeEnabled
    ? { flushAt: 1, flushInterval: 1000 }
    : { flushAt: 10, flushInterval: 5000 };

  const client = new Langfuse({
    secretKey,
    publicKey,
    baseUrl,
    ...flushConfig,
  });

  console.log(`✅ [Langfuse] Initialized with ${baseUrl} (flushAt: ${flushConfig.flushAt})`);
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
// 1.5. 테스트 모드 관리
// ============================================================================

/** Langfuse 클라이언트 재초기화 (설정 변경 시) */
async function reinitializeLangfuse(): Promise<void> {
  if (langfuseClient) {
    await langfuseClient.flushAsync();
    await langfuseClient.shutdownAsync();
    langfuseClient = null;
    initPromise = null;
  }
  // 새 클라이언트로 재초기화 트리거
  initPromise = initLangfuse().then((client) => {
    langfuseClient = client;
    return client;
  });
  await initPromise;
}

/** 테스트 모드 활성화 (AI 어시스턴트 테스트 시 사용) */
export async function enableLangfuseTestMode(): Promise<void> {
  testModeEnabled = true;
  console.log('🧪 [Langfuse] 테스트 모드 활성화 - 100% 추적, 즉시 플러시');

  // 클라이언트 재초기화 (즉시 플러시 설정 적용)
  await reinitializeLangfuse();
}

/** 테스트 모드 비활성화 */
export async function disableLangfuseTestMode(): Promise<void> {
  testModeEnabled = false;
  console.log('🔒 [Langfuse] 테스트 모드 비활성화 - 10% 샘플링, 배치 플러시 복귀');

  // 클라이언트 재초기화 (배치 플러시 설정 적용)
  await reinitializeLangfuse();
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
 *
 * ⚠️ 무료 티어 보호:
 * - 10% 샘플링 적용 (90%는 No-Op)
 * - 월간 45,000 events 도달 시 자동 비활성화
 */
export function createSupervisorTrace(metadata: TraceMetadata): LangfuseTrace {
  // 1. 샘플링 체크 (10%만 추적)
  if (!shouldSample()) {
    return createNoOpTrace();
  }

  // 2. 한도 체크 (90% 초과 시 차단)
  if (!incrementUsage(1)) {
    return createNoOpTrace();
  }

  const langfuse = getLangfuse();

  const trace = langfuse.trace({
    name: 'supervisor-execution',
    sessionId: metadata.sessionId,
    userId: metadata.userId,
    metadata: {
      mode: metadata.mode,
      queryLength: metadata.query.length,
      sampled: true, // 샘플링된 트레이스임을 표시
    },
    input: metadata.query,
  });

  return trace;
}

/** No-Op 트레이스 (샘플링 제외 또는 한도 초과 시) */
function createNoOpTrace(): LangfuseTrace {
  return {
    generation: () => ({}),
    span: () => ({}),
    event: () => ({}),
    update: () => {},
    score: () => {},
  };
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
