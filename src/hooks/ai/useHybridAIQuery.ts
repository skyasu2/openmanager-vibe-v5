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
 * @updated 2026-01-01 - AI SDK v5 베스트 프랙티스 적용
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
}

/**
 * 스트리밍 데이터 파트 타입
 * AI SDK v5 onData 콜백으로 받는 데이터
 */
export interface StreamDataPart {
  type: string;
  data?: unknown;
  /** 텍스트 청크 (type: 'text') */
  text?: string;
  /** 도구 호출 (type: 'tool-call') */
  toolName?: string;
  toolArgs?: Record<string, unknown>;
  /** 사용자 정의 데이터 알림 (type: 'data-notification') */
  message?: string;
  level?: 'info' | 'warning' | 'error';
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
   * 스트리밍 데이터 콜백 (AI SDK v5 베스트 프랙티스)
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
    apiEndpoint = '/api/ai/supervisor',
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
  });

  // 명확화 건너뛰기 시 원본 쿼리 저장
  const pendingQueryRef = useRef<string | null>(null);

  // ============================================================================
  // useChat Hook (Streaming Mode) - AI SDK v5 베스트 프랙티스 적용
  // ============================================================================
  // TextStreamChatTransport for plain text streaming (non-chunked responses)
  // 우리 API는 Cloud Run에서 전체 응답을 받은 후 반환하므로 TextStream 사용
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
    // AI SDK v5: 실시간 데이터 파트 처리 콜백
    onData: onData
      ? (dataPart) => {
          onData(dataPart as StreamDataPart);
        }
      : undefined,
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
      // 1. 복잡도 분석
      const analysis = analyzeQueryComplexity(query);
      const isComplex = analysis.score > complexityThreshold;

      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log(
          `[HybridAI] Query complexity: ${analysis.level} (score: ${analysis.score}), Mode: ${isComplex ? 'job-queue' : 'streaming'}`
        );
      }

      // 2. 모드별 처리
      if (isComplex) {
        // Job Queue 모드: 긴 작업, 진행률 표시
        setMessages((prev) => [
          ...prev,
          {
            id: generateMessageId('user'),
            role: 'user' as const,
            content: query,
            parts: [{ type: 'text' as const, text: query }],
          } as UIMessage,
        ]);

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

        void asyncQuery.sendQuery(query).then((_result) => {
          setState((prev) => ({ ...prev, jobId: asyncQuery.jobId }));
        });
      } else {
        // Streaming 모드: 빠른 응답
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

        void sendMessage({ text: query });
      }
    },
    [complexityThreshold, asyncQuery, sendMessage, setMessages]
  );

  const sendQuery = useCallback(
    async (query: string) => {
      if (!query.trim()) return;

      // 원본 쿼리 저장
      pendingQueryRef.current = query;

      // 1. 쿼리 분류 (Groq LLM 사용)
      const classification = await classifyQuery(query);

      // eslint-disable-next-line no-console
      console.log(
        `[HybridAI] Classification: intent=${classification.intent}, complexity=${classification.complexity}, confidence=${classification.confidence}%`
      );

      // 2. 명확화 필요 여부 체크
      const clarificationRequest = generateClarification(query, classification);

      // eslint-disable-next-line no-console
      console.log(
        `[HybridAI] Clarification request:`,
        clarificationRequest
          ? `${clarificationRequest.options.length} options`
          : 'null (no clarification needed)'
      );

      if (clarificationRequest) {
        // eslint-disable-next-line no-console
        console.log(
          `[HybridAI] Setting clarification state with options:`,
          clarificationRequest.options.map((o) => o.text)
        );
        setState((prev) => ({
          ...prev,
          clarification: clarificationRequest,
        }));
        return;
      }

      // 3. 명확화 불필요: 바로 실행
      executeQuery(query);
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
    if (!pendingQueryRef.current) return;

    // 명확화 상태 초기화 후 원본 쿼리 실행
    setState((prev) => ({ ...prev, clarification: null }));
    executeQuery(pendingQueryRef.current);
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
    setState({
      mode: 'streaming',
      complexity: null,
      progress: null,
      jobId: null,
      isLoading: false,
      error: null,
      clarification: null,
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
