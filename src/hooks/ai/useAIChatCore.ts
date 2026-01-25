'use client';

/**
 * 🤖 useAIChatCore - AI 채팅 공통 로직 훅
 *
 * AISidebarV4와 AIWorkspace에서 공유하는 핵심 로직:
 * - Hybrid AI Query (Streaming + Job Queue)
 * - 세션 제한
 * - 피드백
 * - 메시지 변환
 *
 * @note 유틸리티는 utils/ 폴더로 분리됨
 * @updated 2026-01-12 - 책임 분리 리팩토링
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  type AgentStatusEventData,
  type ClarificationOption,
  type ClarificationRequest,
  type HandoffEventData,
  type StreamDataPart,
  useHybridAIQuery,
} from '@/hooks/ai/useHybridAIQuery';
import { logger } from '@/lib/logging';
import type { EnhancedChatMessage } from '@/stores/useAISidebarStore';
import { useChatFeedback } from './core/useChatFeedback';
import { useChatHistory } from './core/useChatHistory';
import { useChatSession } from './core/useChatSession';
import {
  type SessionState,
  useChatSessionState,
} from './core/useChatSessionState';
import {
  convertThinkingStepsToUI,
  transformMessages,
} from './utils/message-helpers';

// Re-export for backwards compatibility
export { convertThinkingStepsToUI };
export type { SessionState };

// ============================================================================
// Types
// ============================================================================

export interface UseAIChatCoreOptions {
  /** 세션 ID (외부에서 전달 시 사용) */
  sessionId?: string;
  /** 메시지 전송 콜백 */
  onMessageSend?: (message: string) => void;
  /** 세션 제한 비활성화 (전체화면에서 필요시) */
  disableSessionLimit?: boolean;
}

export interface UseAIChatCoreReturn {
  // 입력 상태
  input: string;
  setInput: (value: string) => void;

  // 메시지
  messages: EnhancedChatMessage[];
  sendQuery: (query: string) => void;

  // 로딩/진행 상태
  isLoading: boolean;
  hybridState: {
    progress?: { progress: number; stage: string; message?: string };
    jobId?: string;
    error?: string | null;
  };
  currentMode?: 'streaming' | 'job-queue';

  // 에러 상태
  error: string | null;
  clearError: () => void;

  // 세션 관리
  sessionId: string;
  sessionState: SessionState;
  handleNewSession: () => void;

  // 액션
  handleFeedback: (
    messageId: string,
    type: 'positive' | 'negative'
  ) => Promise<void>;
  regenerateLastResponse: () => void;
  retryLastQuery: () => void;
  stop: () => void;
  cancel: () => void;

  // 입력 처리
  handleSendInput: () => void;

  // 명확화 기능
  clarification: ClarificationRequest | null;
  selectClarification: (option: ClarificationOption) => void;
  submitCustomClarification: (customInput: string) => void;
  skipClarification: () => void;

  // 🎯 실시간 Agent 상태 (스트리밍 중 표시)
  currentAgentStatus: AgentStatusEventData | null;
  currentHandoff: HandoffEventData | null;
}

// ============================================================================
// Hook
// ============================================================================

export function useAIChatCore(
  options: UseAIChatCoreOptions = {}
): UseAIChatCoreReturn {
  const {
    sessionId: propSessionId,
    onMessageSend,
    disableSessionLimit,
  } = options;

  // 입력 상태
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  // 🎯 실시간 Agent 상태 (스트리밍 중 표시)
  const [currentAgentStatus, setCurrentAgentStatus] =
    useState<AgentStatusEventData | null>(null);
  const [currentHandoff, setCurrentHandoff] = useState<HandoffEventData | null>(
    null
  );

  // Refs
  const lastQueryRef = useRef<string>('');
  const pendingQueryRef = useRef<string>('');

  // 🧩 Composed Hooks
  const { sessionId, sessionIdRef, refreshSessionId, setSessionId } =
    useChatSession(propSessionId);
  const { handleFeedback } = useChatFeedback(sessionIdRef);

  // ============================================================================
  // Hybrid AI Query Hook
  // ============================================================================

  const {
    sendQuery,
    messages,
    setMessages,
    state: hybridState,
    isLoading: hybridIsLoading,
    stop,
    cancel,
    reset: resetHybridQuery,
    currentMode,
    selectClarification,
    submitCustomClarification,
    skipClarification,
  } = useHybridAIQuery({
    sessionId: sessionId,
    onStreamFinish: () => {
      onMessageSend?.(pendingQueryRef.current);
      setError(null);
      pendingQueryRef.current = '';
      // 🎯 스트리밍 완료 시 상태 초기화
      setCurrentAgentStatus(null);
      setCurrentHandoff(null);
    },
    onJobResult: (result) => {
      onMessageSend?.(pendingQueryRef.current);
      if (result.success) {
        setError(null);
      } else if (result.error) {
        setError(result.error);
      }
      pendingQueryRef.current = '';
      if (process.env.NODE_ENV === 'development') {
        logger.info('📦 [Job Queue] Result received:', result.success);
      }
    },
    onProgress: (progress) => {
      if (process.env.NODE_ENV === 'development') {
        logger.info(
          `📊 [Job Queue] Progress: ${progress.progress}% - ${progress.stage}`
        );
      }
    },
    // 🎯 실시간 SSE 이벤트 처리 (agent_status, handoff)
    onData: (dataPart: StreamDataPart) => {
      if (dataPart.type === 'agent_status' && dataPart.agentStatus) {
        setCurrentAgentStatus(dataPart.agentStatus);
        if (process.env.NODE_ENV === 'development') {
          logger.info(
            `🤖 [Agent Status] ${dataPart.agentStatus.agent}: ${dataPart.agentStatus.status}`
          );
        }
      } else if (dataPart.type === 'handoff' && dataPart.handoff) {
        setCurrentHandoff(dataPart.handoff);
        if (process.env.NODE_ENV === 'development') {
          logger.info(
            `🔄 [Handoff] ${dataPart.handoff.from} → ${dataPart.handoff.to}`
          );
        }
      } else if (dataPart.type === 'done') {
        // 완료 시 상태 초기화
        setCurrentAgentStatus(null);
        setCurrentHandoff(null);
      }
    },
  });

  // ============================================================================
  // Message Transformation
  // ============================================================================

  const enhancedMessages = useMemo<EnhancedChatMessage[]>(() => {
    return transformMessages(messages, {
      isLoading: hybridIsLoading,
      currentMode: currentMode ?? undefined,
    });
  }, [messages, hybridIsLoading, currentMode]);

  // 🧩 History Hook (Needs messages from hybrid query)
  const { clearHistory } = useChatHistory({
    sessionId,
    isMessagesEmpty: messages.length === 0,
    enhancedMessages,
    setMessages,
    isLoading: hybridIsLoading,
    onSessionRestore: setSessionId,
  });

  // 🧩 Session State Hook
  const sessionState = useChatSessionState(
    messages.length,
    disableSessionLimit
  );

  // ============================================================================
  // Effects
  // ============================================================================

  // 에러 동기화
  useEffect(() => {
    if (hybridState.error && !error) {
      setError(hybridState.error);
    }
  }, [hybridState.error, error]);

  const handleNewSession = useCallback(() => {
    resetHybridQuery();
    refreshSessionId();
    setInput('');
    setError(null);
    pendingQueryRef.current = '';
    clearHistory();
  }, [resetHybridQuery, refreshSessionId, clearHistory]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const regenerateLastResponse = useCallback(() => {
    if (messages.length < 2) return;
    const lastUserMessageIndex = [...messages]
      .reverse()
      .findIndex((m) => m.role === 'user');
    if (lastUserMessageIndex === -1) return;
    const actualIndex = messages.length - 1 - lastUserMessageIndex;
    const lastUserMessage = messages[actualIndex];
    if (!lastUserMessage) return;

    // Extract text content from the message (null/undefined 방어 코드)
    const textPart = lastUserMessage.parts?.find(
      (p): p is { type: 'text'; text: string } => p != null && p.type === 'text'
    );
    const textContent = textPart?.text;

    if (textContent) {
      setMessages(messages.slice(0, actualIndex));
      setError(null);
      sendQuery(textContent);
    }
  }, [messages, setMessages, sendQuery]);

  const retryLastQuery = useCallback(() => {
    if (!lastQueryRef.current) return;
    setError(null);
    sendQuery(lastQueryRef.current);
  }, [sendQuery]);

  // ============================================================================
  // Input Handler
  // ============================================================================

  const handleSendInput = useCallback(() => {
    if (!input.trim()) return;

    if (!disableSessionLimit && sessionState.isLimitReached) {
      logger.warn(`⚠️ [Session] Limit reached (${sessionState.count} messages)`);
      return;
    }

    setError(null);
    lastQueryRef.current = input;
    pendingQueryRef.current = input;
    setInput('');
    sendQuery(input);
  }, [input, disableSessionLimit, sessionState, sendQuery]);

  // ============================================================================
  // Return
  // ============================================================================

  return {
    input,
    setInput,
    messages: enhancedMessages,
    sendQuery,
    isLoading: hybridIsLoading,
    hybridState: {
      progress: hybridState.progress ?? undefined,
      jobId: hybridState.jobId ?? undefined,
      error: hybridState.error ?? undefined,
    },
    currentMode: currentMode ?? undefined,
    error,
    clearError,
    sessionId: sessionId,
    sessionState,
    handleNewSession,
    handleFeedback,
    regenerateLastResponse,
    retryLastQuery,
    stop,
    cancel,
    handleSendInput,
    clarification: hybridState.clarification ?? null,
    selectClarification,
    submitCustomClarification,
    skipClarification,
    // 🎯 실시간 Agent 상태
    currentAgentStatus,
    currentHandoff,
  };
}

export default useAIChatCore;
