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
import { TextStreamChatTransport } from 'ai';
import { useCallback, useMemo, useRef, useState } from 'react';
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
 * Warning 이벤트 데이터 (처리 지연)
 */
export interface WarningEventData {
  code: 'SLOW_PROCESSING';
  message: string;
  elapsed: number;
  threshold: number;
}

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

/** 복잡도 임계값: 이 점수 초과시 Job Queue 사용 */
const DEFAULT_COMPLEXITY_THRESHOLD = 45;

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
    apiEndpoint = '/api/ai/supervisor/stream',
    complexityThreshold = DEFAULT_COMPLEXITY_THRESHOLD,
    onStreamFinish,
    onJobResult,
    onProgress,
    onData,
  } = options;

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

  // Stream Recovery: 마지막으로 알려진 시퀀스 번호 (데이터 중복 방지)
  const lastKnownSequenceRef = useRef<number>(0);

  // ============================================================================
  // useChat Hook (Streaming Mode) - AI SDK v6 베스트 프랙티스 적용
  // ============================================================================
  // TextStreamChatTransport for plain text streaming
  // Cloud Run SSE → Vercel proxy → plain text → TextStreamChatTransport
  // 🎯 Real-time streaming enabled (2026-01-09)
  // Note: TextStreamChatTransport는 동적 body 함수를 지원하지 않음
  // @see https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol
  const transport = useMemo(
    () =>
      new TextStreamChatTransport({
        api: apiEndpoint,
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
    transport,
    onFinish: () => {
      setState((prev) => ({ ...prev, isLoading: false }));
      onStreamFinish?.();
    },
    // AI SDK v6: 실시간 데이터 파트 처리 콜백 + Redirect/Warning 이벤트 내부 처리
    onData: (dataPart) => {
      const part = dataPart as StreamDataPart;

      // Warning 이벤트 처리 (처리 지연 경고)
      if (part.type === 'warning' && part.data) {
        const warningData = part.data as WarningEventData;
        logger.warn(
          `⚠️ [HybridAI] Warning received: ${warningData.message} (${warningData.elapsed}ms)`
        );

        // 경고 상태 업데이트 (1회만)
        setState((prev) => {
          if (prev.warning) return prev; // 이미 경고 표시 중
          return {
            ...prev,
            warning: warningData.message,
            processingTime: warningData.elapsed,
          };
        });
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

        // Race condition 방지: stopChat 완료 후 Job Queue 순차 실행
        // stopChat은 내부적으로 비동기 처리가 있어 즉시 sendQuery 호출 시
        // 두 요청이 동시에 진행되어 상태 불일치 발생 가능
        const query = currentQueryRef.current;
        if (query) {
          setTimeout(() => {
            void asyncQuery.sendQuery(query).then(() => {
              setState((prev) => ({ ...prev, jobId: asyncQuery.jobId }));
            });
          }, 50);
        }
        return;
      }

      // 사용자 onData 콜백 호출
      onData?.(part);
    },
    onError: async (error) => {
      logger.error('[HybridAI] useChat error:', error);

      // Stream Recovery 시도 (네트워크 오류 시)
      if (sessionIdRef.current && error.message?.includes('network')) {
        try {
          logger.info('[HybridAI] Attempting stream recovery...');
          const response = await fetch(
            `/api/ai/supervisor/stream?sessionId=${sessionIdRef.current}`
          );

          if (response.ok) {
            const recoveredState = await response.json();
            const serverSequence = recoveredState.sequence ?? 0;

            // 시퀀스 기반 중복 방지: 이미 본 데이터는 무시
            if (serverSequence <= lastKnownSequenceRef.current) {
              logger.info(
                `[HybridAI] Skipping recovery - stale sequence (server: ${serverSequence}, local: ${lastKnownSequenceRef.current})`
              );
            } else if (
              recoveredState.content &&
              recoveredState.status !== 'error'
            ) {
              logger.info(
                `[HybridAI] Stream recovery successful (sequence: ${serverSequence})`
              );
              // 시퀀스 업데이트
              lastKnownSequenceRef.current = serverSequence;

              // 부분 결과 복구
              setState((prev) => ({
                ...prev,
                isLoading: false,
                error:
                  recoveredState.status === 'completed'
                    ? null
                    : '연결이 끊겼습니다. 부분 결과를 복구했습니다.',
                warning: null,
                processingTime: 0,
              }));
              return;
            }
          }
        } catch (recoveryError) {
          logger.warn('[HybridAI] Recovery failed:', recoveryError);
        }
      }

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

      // Redirect 이벤트 처리를 위해 현재 쿼리 저장
      currentQueryRef.current = trimmedQuery;

      // 1. 복잡도 분석
      const analysis = analyzeQueryComplexity(trimmedQuery);
      const isComplex = analysis.score > complexityThreshold;

      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        logger.info(
          `[HybridAI] Query complexity: ${analysis.level} (score: ${analysis.score}), Mode: ${isComplex ? 'job-queue' : 'streaming'}`
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

        void asyncQuery.sendQuery(trimmedQuery).then((_result) => {
          setState((prev) => ({ ...prev, jobId: asyncQuery.jobId }));
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

        // sendMessage는 user 메시지 추가 + API 호출을 자동으로 처리
        void sendMessage({ text: trimmedQuery });
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
    asyncQuery.reset();
    setMessages([]);
    pendingQueryRef.current = null;
    currentQueryRef.current = null;
    lastKnownSequenceRef.current = 0; // 시퀀스 리셋
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
