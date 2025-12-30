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
 */

import type { UIMessage } from '@ai-sdk/react';
import { useChat } from '@ai-sdk/react';
import { TextStreamChatTransport } from 'ai';
import { useCallback, useRef, useState } from 'react';
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
}

// ============================================================================
// Constants
// ============================================================================

/** 복잡도 임계값: 이 점수 초과시 Job Queue 사용 */
const DEFAULT_COMPLEXITY_THRESHOLD = 45;

// ============================================================================
// Hook Implementation
// ============================================================================

export function useHybridAIQuery(
  options: UseHybridAIQueryOptions = {}
): UseHybridAIQueryReturn {
  const {
    sessionId = `session_${Date.now()}`,
    apiEndpoint = '/api/ai/supervisor',
    complexityThreshold = DEFAULT_COMPLEXITY_THRESHOLD,
    onStreamFinish,
    onJobResult,
    onProgress,
  } = options;

  // Ref for session ID
  const sessionIdRef = useRef(sessionId);

  // State
  const [state, setState] = useState<HybridQueryState>({
    mode: 'streaming',
    complexity: null,
    progress: null,
    jobId: null,
    isLoading: false,
    error: null,
  });

  // ============================================================================
  // useChat Hook (Streaming Mode)
  // ============================================================================
  const {
    messages,
    sendMessage,
    status: chatStatus,
    setMessages,
    stop: stopChat,
  } = useChat({
    transport: new TextStreamChatTransport({
      api: `${apiEndpoint}?sessionId=${encodeURIComponent(sessionIdRef.current)}`,
    }),
    onFinish: () => {
      setState((prev) => ({ ...prev, isLoading: false }));
      onStreamFinish?.();
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
      if (result.success && result.response) {
        // 메시지에 추가 (assistant 메시지로)
        setMessages((prev) => [
          ...prev,
          {
            id: `job-result-${Date.now()}`,
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
  const sendQuery = useCallback(
    (query: string) => {
      if (!query.trim()) return;

      // 1. 복잡도 분석
      const analysis = analyzeQueryComplexity(query);
      const isComplex = analysis.score > complexityThreshold;

      console.log(
        `[HybridAI] Query complexity: ${analysis.level} (score: ${analysis.score}), Mode: ${isComplex ? 'job-queue' : 'streaming'}`
      );

      // 2. 모드별 처리
      if (isComplex) {
        // Job Queue 모드: 긴 작업, 진행률 표시
        // Job Queue에서는 sendMessage를 사용하지 않으므로 수동으로 메시지 추가
        setMessages((prev) => [
          ...prev,
          {
            id: `user-${Date.now()}`,
            role: 'user' as const,
            content: query,
            parts: [{ type: 'text' as const, text: query }],
          } as UIMessage,
        ]);

        setState({
          mode: 'job-queue',
          complexity: analysis.level,
          progress: null,
          jobId: null,
          isLoading: true,
          error: null,
        });

        void asyncQuery.sendQuery(query).then((_result) => {
          setState((prev) => ({ ...prev, jobId: asyncQuery.jobId }));
        });
      } else {
        // Streaming 모드: 빠른 응답
        // 주의: sendMessage()가 자동으로 사용자 메시지를 추가하므로 수동 추가 불필요
        setState({
          mode: 'streaming',
          complexity: analysis.level,
          progress: null,
          jobId: null,
          isLoading: true,
          error: null,
        });

        void sendMessage({ text: query });
      }
    },
    [complexityThreshold, asyncQuery, sendMessage, setMessages]
  );

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
    setState({
      mode: 'streaming',
      complexity: null,
      progress: null,
      jobId: null,
      isLoading: false,
      error: null,
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
  };
}

export default useHybridAIQuery;
