/**
 * useHybridAIQuery Hook
 *
 * @description 쿼리 복잡도에 따라 자동으로 최적의 방식을 선택하는 하이브리드 AI 쿼리 훅
 *
 * 라우팅 전략:
 * - simple (score ≤ 20): useChat (빠른 스트리밍)
 * - moderate (20 < score ≤ 45): useChat (표준 스트리밍)
 * - complex/very_complex (score > 45): Job Queue (진행률 표시 + 타임아웃 회피)
 *
 * @example
 * ```tsx
 * const { sendQuery, messages, isLoading, progress, mode } = useHybridAIQuery({
 *   sessionId: 'session_123',
 * });
 *
 * const handleSubmit = () => {
 *   sendQuery(userInput);
 * };
 * ```
 *
 * @created 2025-12-30
 * @updated 2026-01-01 - AI SDK v6 베스트 프랙티스 적용
 *   - DefaultChatTransport 동적 헤더/바디 패턴 적용
 *   - crypto.randomUUID 기반 메시지 ID 생성
 *   - onData 콜백 지원 추가
 */

import type { UIMessage } from '@ai-sdk/react';
import { useChat } from '@ai-sdk/react';
import type { ChatTransport } from 'ai';
import { DefaultChatTransport } from 'ai';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  applyClarification,
  applyCustomClarification,
  type ClarificationOption,
  type ClarificationRequest,
  generateClarification,
} from '@/lib/ai/clarification-generator';
import { classifyQuery } from '@/lib/ai/query-classifier';
import {
  analyzeQueryComplexity,
  type QueryComplexity,
  shouldForceJobQueue,
} from '@/lib/ai/utils/query-complexity';
import { logger } from '@/lib/logging';
import {
  type AsyncQueryProgress,
  type AsyncQueryResult,
  useAsyncAIQuery,
} from './useAsyncAIQuery';

// ============================================================================
// Types
// ============================================================================

export type QueryMode = 'streaming' | 'job-queue';

// Re-export clarification types for convenience
export type { ClarificationRequest, ClarificationOption };

export interface HybridQueryState {
  /** 현재 쿼리 모드 */
  mode: QueryMode;
  /** 쿼리 복잡도 */
  complexity: QueryComplexity | null;
  /** Job Queue 진행률 (job-queue 모드에서만) */
  progress: AsyncQueryProgress | null;
  /** Job ID (job-queue 모드에서만) */
  jobId: string | null;
  /** 로딩 중 여부 */
  isLoading: boolean;
  /** 에러 메시지 */
  error: string | null;
  /** 명확화 요청 (모호한 쿼리일 때) */
  clarification: ClarificationRequest | null;
  /** 처리 지연 경고 메시지 (25초 초과 시) */
  warning: string | null;
  /** 현재 처리 경과 시간 (ms) */
  processingTime: number;
}

/**
 * 스트리밍 이벤트 타입
 * Cloud Run AI Engine의 StreamEventType과 동기화
 */
export type StreamEventType =
  | 'text_delta'
  | 'tool_call'
  | 'tool_result'
  | 'step_finish'
  | 'handoff'
  | 'agent_status'
  | 'warning' // 처리 지연 경고 (25초 초과 시) (2026-01-19)
  | 'redirect' // Job Queue 리다이렉트 이벤트 (2026-01-18)
  | 'done'
  | 'error';

/**
 * Agent Status 타입
 */
export type AgentStatus = 'thinking' | 'processing' | 'completed' | 'idle';

/**
 * Handoff 이벤트 데이터
 */
export interface HandoffEventData {
  from: string;
  to: string;
  reason?: string;
}

/**
 * Agent Status 이벤트 데이터
 */
export interface AgentStatusEventData {
  agent: string;
  status: AgentStatus;
}

/**
 * Redirect 이벤트 데이터 (Job Queue 전환)
 */
export interface RedirectEventData {
  mode: 'job-queue';
  complexity: QueryComplexity;
  estimatedTime: number;
  message: string;
}

/**
 * Warning 이벤트 데이터 (처리 지연 또는 스트림 에러)
 * 🎯 CODEX Review Fix: STREAM_ERROR_OCCURRED 코드 추가
 */
export type WarningEventData =
  | {
      code: 'SLOW_PROCESSING';
      message: string;
      elapsed: number;
      threshold: number;
    }
  | {
      code: 'STREAM_ERROR_OCCURRED';
      message: string;
    };

/**
 * 스트리밍 데이터 파트 타입
 * AI SDK v5 onData 콜백으로 받는 데이터
 */
export interface StreamDataPart {
  type: StreamEventType | string;
  data?: unknown;
  /** 텍스트 청크 (type: 'text_delta') */
  text?: string;
  /** 도구 호출 (type: 'tool_call') */
  toolName?: string;
  toolArgs?: Record<string, unknown>;
  /** 사용자 정의 데이터 알림 (type: 'data-notification') */
  message?: string;
  level?: 'info' | 'warning' | 'error';
  /** Handoff 이벤트 데이터 (type: 'handoff') */
  handoff?: HandoffEventData;
  /** Agent Status 이벤트 데이터 (type: 'agent_status') */
  agentStatus?: AgentStatusEventData;
  /** Warning 이벤트 데이터 (type: 'warning') */
  warning?: WarningEventData;
  /** Redirect 이벤트 데이터 (type: 'redirect') */
  redirect?: RedirectEventData;
}

// ============================================================================
// Error Detection Constants (SSOT)
// ============================================================================
// Import for local use and re-export for backward compatibility
import {
  COLD_START_ERROR_PATTERNS as _COLD_START_ERROR_PATTERNS,
  STREAM_ERROR_MARKER as _STREAM_ERROR_MARKER,
  STREAM_ERROR_REGEX as _STREAM_ERROR_REGEX,
  extractStreamError,
  isColdStartRelatedError,
} from '@/lib/ai/constants/stream-errors';

// Re-export for consumers
export {
  _STREAM_ERROR_MARKER as STREAM_ERROR_MARKER,
  _COLD_START_ERROR_PATTERNS as COLD_START_ERROR_PATTERNS,
  _STREAM_ERROR_REGEX as STREAM_ERROR_REGEX,
  extractStreamError,
  isColdStartRelatedError,
};

export interface UseHybridAIQueryOptions {
  /** 세션 ID */
  sessionId?: string;
  /** API 엔드포인트 */
  apiEndpoint?: string;
  /** 복잡도 임계값 (이 점수 초과시 Job Queue 사용) */
  complexityThreshold?: number;
  /** 스트리밍 완료 콜백 */
  onStreamFinish?: () => void;
  /** Job 결과 콜백 */
  onJobResult?: (result: AsyncQueryResult) => void;
  /** 진행률 업데이트 콜백 */
  onProgress?: (progress: AsyncQueryProgress) => void;
  /**
   * 스트리밍 데이터 콜백 (AI SDK v6 베스트 프랙티스)
   * 실시간으로 데이터 파트를 받아 처리
   * @example
   * ```tsx
   * onData: (dataPart) => {
   *   if (dataPart.type === 'data-notification') {
   *     showToast(dataPart.message, dataPart.level);
   *   }
   * }
   * ```
   */
  onData?: (dataPart: StreamDataPart) => void;
}

export interface UseHybridAIQueryReturn {
  /** 쿼리 전송 (자동 라우팅) */
  sendQuery: (query: string) => void;
  /** 현재 상태 */
  state: HybridQueryState;
  /** 메시지 목록 (스트리밍 모드) */
  messages: UIMessage[];
  /** 메시지 설정 */
  setMessages: (messages: UIMessage[]) => void;
  /** 진행률 (0-100) */
  progressPercent: number;
  /** 진행 메시지 */
  progressMessage: string;
  /** 스트리밍/Job Queue 로딩 중 */
  isLoading: boolean;
  /** 생성 중단 */
  stop: () => void;
  /** 취소 (Job Queue 전용) */
  cancel: () => Promise<void>;
  /** 상태 리셋 */
  reset: () => void;
  /** 현재 모드 */
  currentMode: QueryMode;
  /** 복잡도 미리 분석 (UI에서 힌트 표시용) */
  previewComplexity: (query: string) => QueryComplexity;
  /** 명확화 옵션 선택 */
  selectClarification: (option: ClarificationOption) => void;
  /** 커스텀 명확화 입력 */
  submitCustomClarification: (customInput: string) => void;
  /** 명확화 건너뛰기 (원본 쿼리 그대로 전송) */
  skipClarification: () => void;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * 복잡도 임계값: 이 점수 초과시 Job Queue 사용
 *
 * @note 45 → 30으로 하향 조정 (2026-01-21)
 *   - moderate 레벨 (21-45점) 쿼리가 스트리밍 모드에서 타임아웃 발생
 *   - "전체 서버 상태 요약" (35점) 같은 쿼리가 Vercel 55s 타임아웃에 걸림
 *   - 19점 초과 시 Job Queue로 라우팅 (보고서=20점 포함)
 *
 * @updated 2026-01-21 - 25 → 19로 재조정 (보고서 키워드 20점이 Job Queue로 라우팅되도록)
 */
const DEFAULT_COMPLEXITY_THRESHOLD = 19;

// ============================================================================
// Utilities
// ============================================================================

/**
 * 고유 메시지 ID 생성
 * @description crypto.randomUUID 사용 (Date.now() 대비 충돌 방지)
 */
function generateMessageId(prefix: string = 'msg'): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  // Fallback for environments without crypto.randomUUID
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * 메시지 배열에서 undefined parts를 정리 (AI SDK 에러 방지)
 *
 * AI SDK가 메시지를 직렬화할 때 undefined parts가 있으면
 * "Cannot read properties of undefined (reading 'text')" 에러 발생
 */
function sanitizeMessages(messages: UIMessage[]): UIMessage[] {
  return messages.map((msg) => {
    // parts가 없거나 비어있으면 빈 text part로 대체
    if (!msg.parts || msg.parts.length === 0) {
      return {
        ...msg,
        parts: [{ type: 'text' as const, text: '' }],
      };
    }

    // undefined parts 필터링 및 유효한 text 보장
    const sanitizedParts = msg.parts
      .filter((part): part is NonNullable<typeof part> => part != null)
      .map((part) => {
        // text 타입이면서 text가 undefined인 경우 빈 문자열로 대체
        if (
          part.type === 'text' &&
          typeof (part as { text?: string }).text !== 'string'
        ) {
          return { ...part, text: '' };
        }
        return part;
      });

    // 정리 후에도 parts가 비어있으면 빈 text part 추가
    if (sanitizedParts.length === 0) {
      return {
        ...msg,
        parts: [{ type: 'text' as const, text: '' }],
      };
    }

    return {
      ...msg,
      parts: sanitizedParts,
    };
  });
}

/**
 * 🛡️ SanitizingChatTransport
 *
 * AI SDK의 DefaultChatTransport를 래핑하여 메시지 전송 전에 sanitize 적용
 * 이는 AI SDK 내부 상태와 React 상태의 동기화 문제를 해결합니다.
 *
 * 문제: AI SDK가 메시지를 직렬화할 때 undefined parts가 있으면
 * "Cannot read properties of undefined (reading 'text')" 에러 발생
 *
 * 해결: Transport 레벨에서 메시지를 sanitize하여 에러 방지
 */
class SanitizingChatTransport implements ChatTransport<UIMessage> {
  private baseTransport: DefaultChatTransport<UIMessage>;

  constructor(
    options: ConstructorParameters<typeof DefaultChatTransport<UIMessage>>[0]
  ) {
    this.baseTransport = new DefaultChatTransport<UIMessage>(options);
  }

  // ChatTransport 인터페이스 구현: sendMessages
  // 메시지 전송 전에 sanitize 적용
  sendMessages(
    options: Parameters<ChatTransport<UIMessage>['sendMessages']>[0]
  ): ReturnType<ChatTransport<UIMessage>['sendMessages']> {
    // 메시지 sanitize 적용
    const sanitizedMessages = sanitizeMessages(options.messages as UIMessage[]);

    if (process.env.NODE_ENV === 'development') {
      logger.debug(
        `[SanitizingTransport] Sanitizing ${options.messages.length} messages`
      );
    }

    // sanitized 메시지로 기본 transport 호출
    return this.baseTransport.sendMessages({
      ...options,
      messages: sanitizedMessages,
    });
  }

  // ChatTransport 인터페이스 구현: reconnectToStream (기본 transport 위임)
  reconnectToStream(
    ...args: Parameters<ChatTransport<UIMessage>['reconnectToStream']>
  ): ReturnType<ChatTransport<UIMessage>['reconnectToStream']> {
    return this.baseTransport.reconnectToStream(...args);
  }
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useHybridAIQuery(
  options: UseHybridAIQueryOptions = {}
): UseHybridAIQueryReturn {
  const {
    sessionId: initialSessionId,
    // 🎯 Real-time streaming endpoint (2026-01-09)
    // Cloud Run SSE streaming → Vercel proxy → Frontend
    apiEndpoint: customEndpoint,
    complexityThreshold = DEFAULT_COMPLEXITY_THRESHOLD,
    onStreamFinish,
    onJobResult,
    onProgress,
    onData,
  } = options;

  // Determine API endpoint (v2 only - v1 deprecated and removed)
  // v2 uses AI SDK native UIMessageStream protocol with resumable streams
  const apiEndpoint = customEndpoint ?? '/api/ai/supervisor/stream/v2';

  // Session ID with stable initial value
  const sessionIdRef = useRef<string>(
    initialSessionId || generateMessageId('session')
  );

  // State
  const [state, setState] = useState<HybridQueryState>({
    mode: 'streaming',
    complexity: null,
    progress: null,
    jobId: null,
    isLoading: false,
    error: null,
    clarification: null,
    warning: null,
    processingTime: 0,
  });

  // 명확화 건너뛰기 시 원본 쿼리 저장
  const pendingQueryRef = useRef<string | null>(null);

  // Redirect 이벤트 처리를 위한 쿼리 저장
  const currentQueryRef = useRef<string | null>(null);

  // 🔒 Error Race Condition 방지: onError/onFinish 중 먼저 처리된 쪽이 에러 핸들링
  const errorHandledRef = useRef<boolean>(false);

  // 🎯 AbortController for graceful request cancellation (Phase 2 개선)
  // Vercel 10s timeout 대응: 8초 내부 timeout + graceful abort
  const abortControllerRef = useRef<AbortController | null>(null);

  // ============================================================================
  // useChat Hook (Streaming Mode) - AI SDK v6 베스트 프랙티스 적용
  // ============================================================================
  // Transport: DefaultChatTransport with AI SDK native UIMessageStream protocol
  // Features: Resumable streams, structured data events, automatic reconnection
  //
  // 🎯 Real-time streaming enabled (2026-01-09)
  // 🌊 Native protocol support (2026-01-24)
  // @see https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol
  // v2 only: AI SDK native UIMessageStream with resumable stream support
  // 🎯 Best Practice: prepareReconnectToStreamRequest로 resume URL 커스터마이징
  // AI SDK 기본 패턴 {api}/{id}/stream 대신 query parameter 방식 사용
  // @see https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-resume-streams
  // 🛡️ SanitizingChatTransport: 메시지 전송 전에 undefined parts 제거
  // 이는 AI SDK 내부 직렬화 에러 "Cannot read properties of undefined (reading 'text')" 방지
  const transport = useMemo(
    () =>
      new SanitizingChatTransport({
        api: apiEndpoint,
        // Resume stream URL customization (fixes 404 error)
        prepareReconnectToStreamRequest: ({ id }) => ({
          api: `${apiEndpoint}?sessionId=${id}`,
        }),
      }),
    [apiEndpoint]
  );

  const {
    messages,
    sendMessage,
    status: chatStatus,
    setMessages,
    stop: stopChat,
  } = useChat({
    // AI SDK v6: Session ID for resumable streams
    id: sessionIdRef.current,
    transport,
    // 🚫 resume 비활성화: 명확화 흐름에서 "Cannot read properties of undefined (reading 'text')" 에러 발생
    // AI SDK 내부에서 이전 세션 메시지 복원 시 parts 배열 처리 문제로 추정
    // TODO: AI SDK 업데이트 후 재활성화 테스트 필요
    // @see https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-resume-streams
    resume: false,
    onFinish: ({ message }) => {
      // 🔒 Race Condition 방지: onError가 이미 에러를 처리했으면 스킵
      // Note: errorHandledRef는 executeQuery에서 새 요청 시작 시 리셋됨
      if (errorHandledRef.current) {
        logger.debug(
          '[HybridAI] onFinish skipped (error already handled by onError)'
        );
        setState((prev) => ({ ...prev, isLoading: false }));
        onStreamFinish?.();
        return;
      }

      // 🚨 스트림 완료 후 에러 패턴 감지 (Cold Start 등)
      // AI SDK v6: message.parts 배열에서 텍스트 추출 (null/undefined 방어 코드)
      const parts = message.parts ?? [];
      const content = parts
        .filter(
          (p): p is { type: 'text'; text: string } =>
            p != null && p.type === 'text'
        )
        .map((p) => p.text)
        .join('');

      // 🎯 개선된 에러 추출 (false positive 방지)
      const errorMessage = extractStreamError(content);

      if (errorMessage) {
        logger.warn(`[HybridAI] Stream error detected: ${errorMessage}`);
        errorHandledRef.current = true;
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
      } else {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
      onStreamFinish?.();
    },
    // AI SDK v6: 실시간 데이터 파트 처리 콜백 + Redirect/Warning 이벤트 내부 처리
    onData: (dataPart) => {
      const part = dataPart as StreamDataPart;

      // Warning 이벤트 처리 (처리 지연 또는 스트림 에러 경고)
      // 🎯 CODEX Review Fix: SLOW_PROCESSING과 STREAM_ERROR_OCCURRED 분기 처리
      if (part.type === 'warning' && part.data) {
        const warningData = part.data as WarningEventData;

        if (warningData.code === 'SLOW_PROCESSING') {
          logger.warn(
            `⚠️ [HybridAI] Slow processing: ${warningData.message} (${warningData.elapsed}ms)`
          );
          setState((prev) => {
            if (prev.warning) return prev;
            return {
              ...prev,
              warning: warningData.message,
              processingTime: warningData.elapsed,
            };
          });
        } else {
          // STREAM_ERROR_OCCURRED - elapsed 필드 없음
          logger.warn(`⚠️ [HybridAI] Stream error: ${warningData.message}`);
          setState((prev) => {
            if (prev.warning) return prev;
            return {
              ...prev,
              warning: warningData.message,
            };
          });
        }
        return;
      }

      // Redirect 이벤트 내부 처리 (Job Queue 모드 전환)
      if (part.type === 'redirect' && part.data) {
        const redirectData = part.data as RedirectEventData;
        logger.info(
          `🔀 [HybridAI] Redirect received: switching to job-queue (${redirectData.complexity})`
        );

        // Job Queue 모드로 전환
        setState((prev) => ({
          ...prev,
          mode: 'job-queue',
          complexity: redirectData.complexity,
          isLoading: true,
        }));

        // 현재 스트리밍 중단
        stopChat();

        // 🎯 Phase 2 개선: AbortController 패턴으로 race condition 방지
        // setTimeout(50ms) 대신 queueMicrotask 사용하여 stopChat 완료 후 실행 보장
        // AbortController로 컴포넌트 언마운트 시 안전한 취소 지원
        const query = currentQueryRef.current;
        if (query) {
          // 기존 abort controller가 있으면 취소
          abortControllerRef.current?.abort();
          const controller = new AbortController();
          abortControllerRef.current = controller;

          // 🎯 P0 Fix: Capture current references before microtask to avoid stale closure
          const currentAsyncQuery = asyncQuery;
          const currentQuery = query;

          // queueMicrotask: stopChat의 현재 실행 컨텍스트 완료 후 실행
          queueMicrotask(() => {
            // 이미 취소되었으면 스킵 (컴포넌트 언마운트 등)
            if (controller.signal.aborted) {
              logger.debug('[HybridAI] Job Queue redirect aborted');
              return;
            }
            // 🎯 P0 Fix: Removed stale jobId reference - asyncQuery manages its own jobId state
            // 🎯 P1 Fix: Add catch handler for unhandled promise rejection
            currentAsyncQuery
              .sendQuery(currentQuery)
              .then(() => {
                // Note: jobId is managed internally by useAsyncAIQuery
                // Access via asyncQuery.jobId (not currentAsyncQuery which is stale)
                if (!controller.signal.aborted) {
                  logger.debug('[HybridAI] Job Queue redirect completed');
                }
              })
              .catch((error) => {
                if (!controller.signal.aborted) {
                  logger.error('[HybridAI] Job Queue redirect failed:', error);
                  setState((prev) => ({
                    ...prev,
                    isLoading: false,
                    error:
                      error instanceof Error
                        ? error.message
                        : 'Job Queue 전환 실패',
                  }));
                }
              });
          });
        }
        return;
      }

      // 사용자 onData 콜백 호출
      onData?.(part);
    },
    onError: async (error) => {
      logger.error('[HybridAI] useChat error:', error);

      // 🎯 P1-4 Fix: Atomic check-and-set pattern to prevent double handling
      // Check FIRST, then set immediately to prevent race with onFinish
      if (errorHandledRef.current) {
        logger.debug(
          '[HybridAI] onError skipped (already handled by onFinish)'
        );
        return;
      }
      errorHandledRef.current = true; // Set immediately after check (atomic pattern)

      // v2: Automatic stream recovery via useChat({ resume: true })
      // Manual recovery code removed - AI SDK v6 handles reconnection natively

      // 복구 실패 시 기존 에러 처리
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || 'AI 응답 중 오류가 발생했습니다.',
        warning: null,
        processingTime: 0,
      }));
    },
  });

  // ============================================================================
  // useAsyncAIQuery Hook (Job Queue Mode)
  // ============================================================================
  const asyncQuery = useAsyncAIQuery({
    sessionId: sessionIdRef.current,
    onProgress: (progress) => {
      setState((prev) => ({ ...prev, progress }));
      onProgress?.(progress);
    },
    onResult: (result) => {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        progress: null,
      }));
      onJobResult?.(result);

      // Job 결과를 메시지로 변환하여 추가
      // crypto.randomUUID 기반 ID로 충돌 방지
      if (result.success && result.response) {
        // 메시지에 추가 (assistant 메시지로)
        setMessages((prev) => [
          ...prev,
          {
            id: generateMessageId('assistant'),
            role: 'assistant' as const,
            content: result.response,
            parts: [{ type: 'text' as const, text: result.response }],
          } as UIMessage,
        ]);
      }
    },
    onError: (error) => {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error,
      }));
    },
  });

  // ============================================================================
  // Computed Values
  // ============================================================================
  const isChatLoading =
    chatStatus === 'streaming' || chatStatus === 'submitted';
  const isLoading = state.isLoading || isChatLoading || asyncQuery.isLoading;

  // ============================================================================
  // Send Query (Auto Routing)
  // ============================================================================

  /**
   * 실제 쿼리 전송 로직 (명확화 완료 후 호출)
   */
  const executeQuery = useCallback(
    (query: string) => {
      // 빈 쿼리 방어
      if (!query || !query.trim()) {
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          logger.warn('[HybridAI] executeQuery: Empty query, skipping');
        }
        return;
      }

      const trimmedQuery = query.trim();

      // 🔒 새 요청 시작 시 에러 핸들링 플래그 리셋 (Codex review feedback)
      errorHandledRef.current = false;

      // Redirect 이벤트 처리를 위해 현재 쿼리 저장
      currentQueryRef.current = trimmedQuery;

      // 1. 복잡도 분석 + 의도 기반 Job Queue 강제 라우팅
      const analysis = analyzeQueryComplexity(trimmedQuery);
      const forceJobQueue = shouldForceJobQueue(trimmedQuery);
      const isComplex =
        analysis.score > complexityThreshold || forceJobQueue.force;

      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        logger.info(
          `[HybridAI] Query complexity: ${analysis.level} (score: ${analysis.score}), ` +
            `Force Job Queue: ${forceJobQueue.force}${forceJobQueue.matchedKeyword ? ` (keyword: "${forceJobQueue.matchedKeyword}")` : ''}, ` +
            `Mode: ${isComplex ? 'job-queue' : 'streaming'}`
        );
      }

      // 사용자 메시지 생성 (공통) - AI SDK v5 UIMessage 형식
      const userMessage: UIMessage = {
        id: generateMessageId('user'),
        role: 'user' as const,
        parts: [{ type: 'text' as const, text: trimmedQuery }],
      };

      // 2. 모드별 처리
      if (isComplex) {
        // Job Queue 모드: 긴 작업, 진행률 표시
        setMessages((prev) => [...prev, userMessage]);

        setState((prev) => ({
          ...prev,
          mode: 'job-queue',
          complexity: analysis.level,
          progress: null,
          jobId: null,
          isLoading: true,
          error: null,
          clarification: null,
        }));

        // 🎯 P1 Fix: Add catch handler for unhandled promise rejection
        asyncQuery
          .sendQuery(trimmedQuery)
          .then((_result) => {
            setState((prev) => ({ ...prev, jobId: asyncQuery.jobId }));
          })
          .catch((error) => {
            logger.error('[HybridAI] Job Queue query failed:', error);
            setState((prev) => ({
              ...prev,
              isLoading: false,
              error:
                error instanceof Error ? error.message : 'Job Queue 쿼리 실패',
            }));
          });
      } else {
        // Streaming 모드: 빠른 응답
        // Note: sendMessage(AI SDK)가 자동으로 user 메시지를 추가하므로
        //       수동으로 setMessages 하지 않음 (중복 방지)
        setState((prev) => ({
          ...prev,
          mode: 'streaming',
          complexity: analysis.level,
          progress: null,
          jobId: null,
          isLoading: true,
          error: null,
          clarification: null,
        }));

        // 🛡️ SanitizingChatTransport가 메시지 전송 전에 undefined parts를 자동 정리
        // 따라서 별도의 flushSync나 setTimeout이 필요 없음
        // sendMessage는 user 메시지 추가 + API 호출을 자동으로 처리
        // 🎯 AI SDK v6: sendMessage는 { text: string } 또는 { parts: [...] } 형식
        // @see node_modules/ai/dist/index.d.ts line 3260-3275
        Promise.resolve(
          sendMessage({ text: trimmedQuery } as Parameters<
            typeof sendMessage
          >[0])
        ).catch((error) => {
          logger.error('[HybridAI] Streaming send failed:', error);
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error:
              error instanceof Error ? error.message : '스트리밍 전송 실패',
          }));
        });
      }
    },
    [complexityThreshold, asyncQuery, sendMessage, setMessages]
  );

  const sendQuery = useCallback(
    async (query: string) => {
      if (!query.trim()) return;

      // 원본 쿼리 저장
      pendingQueryRef.current = query;

      // 0. 초기화
      setState((prev) => ({ ...prev, error: null }));

      try {
        // 1. 쿼리 분류 (Groq LLM 사용)
        const classification = await classifyQuery(query);

        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          logger.info(
            `[HybridAI] Classification: intent=${classification.intent}, complexity=${classification.complexity}, confidence=${classification.confidence}%`
          );
        }

        // 2. 명확화 필요 여부 체크
        const clarificationRequest = generateClarification(
          query,
          classification
        );

        if (clarificationRequest) {
          setState((prev) => ({
            ...prev,
            clarification: clarificationRequest,
          }));
          return;
        }

        // 3. 명확화 불필요: 바로 실행
        executeQuery(query);
      } catch (error) {
        logger.error('[HybridAI] sendQuery error:', error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error:
            error instanceof Error
              ? error.message
              : '쿼리 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        }));
      }
    },
    [executeQuery]
  );

  // ============================================================================
  // Clarification Functions
  // ============================================================================

  /**
   * 명확화 옵션 선택
   */
  const selectClarification = useCallback(
    (option: ClarificationOption) => {
      const clarifiedQuery = applyClarification(option);
      setState((prev) => ({ ...prev, clarification: null }));
      executeQuery(clarifiedQuery);
    },
    [executeQuery]
  );

  /**
   * 커스텀 명확화 입력
   */
  const submitCustomClarification = useCallback(
    (customInput: string) => {
      if (!pendingQueryRef.current) return;

      const clarifiedQuery = applyCustomClarification(
        pendingQueryRef.current,
        customInput
      );

      // 명확화 상태 초기화 후 쿼리 실행
      setState((prev) => ({ ...prev, clarification: null }));
      executeQuery(clarifiedQuery);
    },
    [executeQuery]
  );

  /**
   * 명확화 건너뛰기 (원본 쿼리 그대로 전송)
   */
  const skipClarification = useCallback(() => {
    const query = pendingQueryRef.current;

    // 빈 쿼리 방어
    if (!query || !query.trim()) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        logger.warn('[HybridAI] skipClarification: No pending query to send');
      }
      setState((prev) => ({ ...prev, clarification: null }));
      return;
    }

    // 명확화 상태 초기화 후 원본 쿼리 실행
    setState((prev) => ({ ...prev, clarification: null }));
    executeQuery(query);
  }, [executeQuery]);

  // ============================================================================
  // Control Functions
  // ============================================================================
  const stop = useCallback(() => {
    // 🎯 Phase 2: AbortController cleanup on stop
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;

    if (state.mode === 'streaming') {
      stopChat();
    }
    setState((prev) => ({ ...prev, isLoading: false }));
  }, [state.mode, stopChat]);

  const cancel = useCallback(async () => {
    if (state.mode === 'job-queue') {
      await asyncQuery.cancel();
    } else {
      stopChat();
    }
    setState((prev) => ({ ...prev, isLoading: false }));
  }, [state.mode, asyncQuery, stopChat]);

  const reset = useCallback(() => {
    // 🎯 Phase 2: AbortController cleanup on reset
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;

    asyncQuery.reset();
    setMessages([]);
    pendingQueryRef.current = null;
    currentQueryRef.current = null;
    setState({
      mode: 'streaming',
      complexity: null,
      progress: null,
      jobId: null,
      isLoading: false,
      error: null,
      clarification: null,
      warning: null,
      processingTime: 0,
    });
  }, [asyncQuery, setMessages]);

  // ============================================================================
  // Utility: Preview Complexity
  // ============================================================================
  const previewComplexity = useCallback((query: string): QueryComplexity => {
    return analyzeQueryComplexity(query).level;
  }, []);

  // ============================================================================
  // Cleanup on Unmount (Phase 2 개선)
  // ============================================================================
  useEffect(() => {
    return () => {
      // 🎯 AbortController cleanup on unmount
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
    };
  }, []);

  // ============================================================================
  // Return
  // ============================================================================
  return {
    sendQuery,
    state,
    messages,
    setMessages,
    progressPercent: state.progress?.progress ?? asyncQuery.progressPercent,
    progressMessage: state.progress?.message ?? asyncQuery.progressMessage,
    isLoading,
    stop,
    cancel,
    reset,
    currentMode: state.mode,
    previewComplexity,
    // Clarification functions
    selectClarification,
    submitCustomClarification,
    skipClarification,
  };
}

export default useHybridAIQuery;
