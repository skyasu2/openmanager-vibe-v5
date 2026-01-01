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
 * @note HITL(Human-in-the-Loop) 제거됨 - 현재 컨셉상 모든 기능이 사용자 요청 기반
 * @updated 2026-01-01 - crypto.randomUUID 기반 세션 ID 생성
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import type { AIThinkingStep } from '@/domains/ai-sidebar/types/ai-sidebar-types';
import { useHybridAIQuery } from '@/hooks/ai/useHybridAIQuery';
import { extractTextFromUIMessage } from '@/lib/ai/utils/message-normalizer';
import type { EnhancedChatMessage } from '@/stores/useAISidebarStore';
import { SESSION_LIMITS } from '@/types/session';

// ============================================================================
// Types
// ============================================================================

export interface SessionState {
  count: number;
  remaining: number;
  isWarning: boolean;
  isLimitReached: boolean;
}

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
  };
  currentMode?: 'streaming' | 'job-queue';

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
  stop: () => void;
  cancel: () => void;

  // 입력 처리
  handleSendInput: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const SESSION_MESSAGE_LIMIT = SESSION_LIMITS.MESSAGE_LIMIT;
const SESSION_WARNING_THRESHOLD = SESSION_LIMITS.WARNING_THRESHOLD;

/**
 * 고유 세션 ID 생성
 * @description crypto.randomUUID 사용 (Date.now() 대비 충돌 방지)
 */
function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `session-${crypto.randomUUID()}`;
  }
  // Fallback for environments without crypto.randomUUID
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * ThinkingSteps를 AgentStep 형식으로 변환 (외부 사용 가능)
 */
export function convertThinkingStepsToUI(thinkingSteps?: AIThinkingStep[]) {
  if (!thinkingSteps || thinkingSteps.length === 0) return [];

  const toolToAgent: Record<string, string> = {
    getServerMetrics: 'nlq',
    analyzePatterns: 'analyst',
    generateReport: 'reporter',
    classifyIntent: 'supervisor',
  };

  return thinkingSteps.map((step) => ({
    id: step.id,
    agent: toolToAgent[step.step || ''] || 'nlq',
    status:
      step.status === 'completed'
        ? 'completed'
        : step.status === 'failed'
          ? 'error'
          : step.status === 'processing'
            ? 'processing'
            : 'pending',
    message: step.description,
    startedAt: step.timestamp ? new Date(step.timestamp) : undefined,
  }));
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

  // 세션 ID 관리 (crypto.randomUUID 기반)
  const chatSessionIdRef = useRef<string>(propSessionId || generateSessionId());

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
    currentMode,
  } = useHybridAIQuery({
    sessionId: chatSessionIdRef.current,
    onStreamFinish: () => {
      onMessageSend?.(input);
      setInput('');
    },
    onJobResult: (result) => {
      onMessageSend?.(input);
      setInput('');
      if (process.env.NODE_ENV === 'development') {
        console.log('📦 [Job Queue] Result received:', result.success);
      }
    },
    onProgress: (progress) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(
          `📊 [Job Queue] Progress: ${progress.progress}% - ${progress.stage}`
        );
      }
    },
  });

  // ============================================================================
  // 세션 제한 관리
  // ============================================================================

  const sessionState = useMemo<SessionState>(() => {
    if (disableSessionLimit) {
      return {
        count: 0,
        remaining: Infinity,
        isWarning: false,
        isLimitReached: false,
      };
    }
    const count = messages.length;
    const remaining = SESSION_MESSAGE_LIMIT - count;
    const isWarning = count >= SESSION_WARNING_THRESHOLD;
    const isLimitReached = count >= SESSION_MESSAGE_LIMIT;

    return { count, remaining, isWarning, isLimitReached };
  }, [messages.length, disableSessionLimit]);

  const handleNewSession = useCallback(() => {
    setMessages([]);
    chatSessionIdRef.current = generateSessionId();
    setInput('');
  }, [setMessages]);

  // ============================================================================
  // 피드백 핸들러
  // ============================================================================

  const handleFeedback = useCallback(
    async (messageId: string, type: 'positive' | 'negative') => {
      try {
        const response = await fetch('/api/ai/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messageId,
            type,
            sessionId: chatSessionIdRef.current,
            timestamp: new Date().toISOString(),
          }),
        });
        if (!response.ok) {
          console.error('[AIChatCore] Feedback API error:', response.status);
        }
      } catch (error) {
        console.error('[AIChatCore] Feedback error:', error);
      }
    },
    []
  );

  // ============================================================================
  // 재생성 함수
  // ============================================================================

  const regenerateLastResponse = useCallback(() => {
    if (messages.length < 2) return;
    const lastUserMessageIndex = [...messages]
      .reverse()
      .findIndex((m) => m.role === 'user');
    if (lastUserMessageIndex === -1) return;
    const actualIndex = messages.length - 1 - lastUserMessageIndex;
    const lastUserMessage = messages[actualIndex];
    if (!lastUserMessage) return;
    const textContent = extractTextFromUIMessage(lastUserMessage);
    if (textContent) {
      setMessages(messages.slice(0, actualIndex));
      sendQuery(textContent);
    }
  }, [messages, setMessages, sendQuery]);

  // ============================================================================
  // 메시지 변환 (UIMessage -> EnhancedChatMessage)
  // ============================================================================

  const enhancedMessages = useMemo<EnhancedChatMessage[]>(() => {
    return messages
      .filter(
        (m) =>
          m.role === 'user' || m.role === 'assistant' || m.role === 'system'
      )
      .map((m): EnhancedChatMessage => {
        const textContent = extractTextFromUIMessage(m);

        const toolParts =
          m.parts?.filter(
            (part): part is typeof part & { toolCallId: string } =>
              part.type.startsWith('tool-') && 'toolCallId' in part
          ) ?? [];

        const thinkingSteps = toolParts.map((toolPart) => {
          const toolName = toolPart.type.slice(5);
          const state = (toolPart as { state?: string }).state;
          const output = (toolPart as { output?: unknown }).output;

          const isCompleted =
            state === 'output-available' || output !== undefined;
          const hasError = state === 'output-error';

          return {
            id: toolPart.toolCallId,
            step: toolName,
            status: hasError
              ? ('failed' as const)
              : isCompleted
                ? ('completed' as const)
                : ('processing' as const),
            description: hasError
              ? `Error: ${(toolPart as { errorText?: string }).errorText || 'Unknown error'}`
              : isCompleted
                ? `Completed: ${JSON.stringify(output)}`
                : `Executing ${toolName}...`,
            timestamp: new Date(),
          };
        });

        return {
          id: m.id,
          role: m.role as 'user' | 'assistant' | 'system' | 'thinking',
          content: textContent,
          timestamp: new Date(),
          isStreaming:
            hybridIsLoading && m.id === messages[messages.length - 1]?.id,
          thinkingSteps: thinkingSteps.length > 0 ? thinkingSteps : undefined,
        };
      });
  }, [messages, hybridIsLoading]);

  // ============================================================================
  // 입력 핸들러
  // ============================================================================

  const handleSendInput = useCallback(() => {
    if (!input.trim()) return;

    // 세션 제한 체크
    if (!disableSessionLimit && sessionState.isLimitReached) {
      console.warn(
        `⚠️ [Session] Limit reached (${SESSION_MESSAGE_LIMIT} messages)`
      );
      return;
    }

    // 쿼리 전송
    sendQuery(input);
  }, [input, disableSessionLimit, sessionState.isLimitReached, sendQuery]);

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // 입력 상태
    input,
    setInput,

    // 메시지
    messages: enhancedMessages,
    sendQuery,

    // 로딩/진행 상태
    isLoading: hybridIsLoading,
    hybridState: {
      progress: hybridState.progress ?? undefined,
      jobId: hybridState.jobId ?? undefined,
    },
    currentMode: currentMode ?? undefined,

    // 세션 관리
    sessionId: chatSessionIdRef.current,
    sessionState,
    handleNewSession,

    // 액션
    handleFeedback,
    regenerateLastResponse,
    stop,
    cancel,

    // 입력 핸들러
    handleSendInput,
  };
}

export default useAIChatCore;
