import { createDeveloperContextStreamPayload } from '@/lib/ai/developer-panel';
import { normalizeRouteDecision } from '@/lib/ai/route-decision';
import { logger } from '@/lib/logging';
import { UI_MESSAGE_STREAM_HEADERS } from './route-utils';

export const AI_WARMUP_STARTED_AT_HEADER = 'x-ai-warmup-started-at';
export const AI_FIRST_QUERY_HEADER = 'x-ai-first-query';
const DEVELOPER_CONTEXT_STREAM_PART_TYPE = 'data-developer-context';

export function normalizeFrontendLocalRouteDecision(value: unknown) {
  const decision = normalizeRouteDecision(value);
  if (!decision) return undefined;
  return decision.decidedBy === 'frontend' ? decision : undefined;
}

export function createDeveloperContextStreamPart(params: {
  cloudRunHealthy: boolean;
  cloudRunUrl: string;
}) {
  return {
    type: DEVELOPER_CONTEXT_STREAM_PART_TYPE,
    data: createDeveloperContextStreamPayload({
      cloudRunHealthy: params.cloudRunHealthy,
      cloudRunUrl: params.cloudRunUrl,
      disclosureMode: 'developer',
    }),
  } satisfies { type: `data-${string}`; data: unknown };
}

export function createDeveloperContextDataParts(params: {
  enabled: boolean;
  cloudRunHealthy: boolean;
  cloudRunUrl: string;
}) {
  return params.enabled
    ? [
        createDeveloperContextStreamPart({
          cloudRunHealthy: params.cloudRunHealthy,
          cloudRunUrl: params.cloudRunUrl,
        }),
      ]
    : [];
}

export function createSupervisorStreamHeaders(params: {
  sessionId: string;
  streamId: string;
  resumable: boolean;
  timingHeaders: Record<string, string>;
}): HeadersInit {
  return {
    ...UI_MESSAGE_STREAM_HEADERS,
    'X-Session-Id': params.sessionId,
    'X-Stream-Id': params.streamId,
    'X-Backend': 'cloud-run-stream-v2',
    'X-Stream-Protocol': 'ui-message-stream',
    'X-Resumable': params.resumable ? 'true' : 'false',
    ...params.timingHeaders,
  };
}

export function trackFirstQueryLatency(params: {
  isFirstQuery: boolean;
  warmupStartedAt: number | null;
  sessionId: string;
}): void {
  if (!params.isFirstQuery || !params.warmupStartedAt) {
    return;
  }

  const latencyMs = Date.now() - params.warmupStartedAt;
  if (latencyMs >= 0 && latencyMs <= 15 * 60 * 1000) {
    logger.info(
      {
        event: 'first_query_latency',
        sessionId: params.sessionId,
        first_query_latency_ms: latencyMs,
        warmup_started_at_ms: params.warmupStartedAt,
      },
      '[AI Warmup] First query latency tracked'
    );
    return;
  }

  logger.warn(
    {
      event: 'first_query_latency_invalid',
      sessionId: params.sessionId,
      warmup_started_at_ms: params.warmupStartedAt,
      computed_latency_ms: latencyMs,
    },
    '[AI Warmup] Invalid first query latency window'
  );
}

/**
 * 실패 종결(terminal) 분류
 *
 * 이 라우트의 실패 종결은 두 표면으로 나뉘며, 분리는 **의도적**이다:
 * - `json`: 스트림을 시작하기 전(요청 검증/설정 단계) 실패 → `NextResponse.json` + 4xx/5xx
 * - `stream`: 스트림 계약이 이미 시작된 실행 단계 실패 → UI message stream + 200
 *
 * 스트림 응답을 시작한 뒤에는 HTTP status를 바꿀 수 없으므로, 실행 단계 실패는
 * HTTP가 아니라 스트림 내부 이벤트(`error` / `data-warning`)로 표기한다.
 * 성공 종결(캐시 HIT·정상 pass-through)은 이 분류에 포함하지 않는다.
 */
export type StreamTerminalCategory =
  | 'invalid_payload'
  | 'empty_query'
  | 'invalid_normalized_messages'
  | 'config_unavailable'
  | 'policy_blocked'
  | 'upstream_policy_blocked'
  | 'upstream_error'
  | 'upstream_fallback'
  | 'upstream_empty_body'
  | 'unhandled_error';

export type StreamTerminalSurface = 'json' | 'stream';

const STREAM_TERMINAL_SURFACES: Record<
  StreamTerminalCategory,
  StreamTerminalSurface
> = {
  invalid_payload: 'json',
  empty_query: 'json',
  invalid_normalized_messages: 'json',
  config_unavailable: 'json',
  policy_blocked: 'stream',
  upstream_policy_blocked: 'stream',
  upstream_error: 'stream',
  upstream_fallback: 'stream',
  upstream_empty_body: 'json',
  unhandled_error: 'stream',
};

/** 사용자 입력/정책으로 설명되는 종결은 warn, 시스템 실패는 error */
const STREAM_TERMINAL_LEVELS: Record<StreamTerminalCategory, 'warn' | 'error'> =
  {
    invalid_payload: 'warn',
    empty_query: 'warn',
    invalid_normalized_messages: 'warn',
    config_unavailable: 'error',
    policy_blocked: 'warn',
    upstream_policy_blocked: 'warn',
    upstream_error: 'error',
    upstream_fallback: 'warn',
    upstream_empty_body: 'error',
    unhandled_error: 'error',
  };

export const STREAM_TERMINAL_EVENT = 'supervisor_stream_terminal';

/**
 * 실패 종결마다 동일 형식의 종결 로그를 한 줄 남긴다(진단용 상세 로그와는 별개).
 * 표기(category·surface·httpStatus)를 고정해 종결 경로 간 drift를 관측 가능하게 만든다.
 */
export function logStreamTerminal(params: {
  category: StreamTerminalCategory;
  httpStatus: number;
  detail?: string;
}): void {
  const surface = STREAM_TERMINAL_SURFACES[params.category];
  const level = STREAM_TERMINAL_LEVELS[params.category];
  const payload = {
    event: STREAM_TERMINAL_EVENT,
    category: params.category,
    surface,
    httpStatus: params.httpStatus,
    ...(params.detail ? { detail: params.detail } : {}),
  };

  logger[level](
    payload,
    `[SupervisorStreamV2] Terminal (${params.category}/${surface})`
  );
}

export function prependStreamDataPart(
  body: ReadableStream<Uint8Array>,
  dataPart: { type: `data-${string}`; data: unknown }
): ReadableStream<Uint8Array> {
  const reader = body.getReader();
  const encoder = new TextEncoder();
  let didPrepend = false;

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (!didPrepend) {
        didPrepend = true;
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(dataPart)}\n\n`)
        );
        return;
      }

      const { done, value } = await reader.read();
      if (done) {
        controller.close();
        return;
      }
      controller.enqueue(value);
    },
    cancel(reason) {
      return reader.cancel(reason);
    },
  });
}
