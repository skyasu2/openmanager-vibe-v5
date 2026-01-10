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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  type ClarificationOption,
  type ClarificationRequest,
  useHybridAIQuery,
} from '@/hooks/ai/useHybridAIQuery';
import { extractTextFromUIMessage } from '@/lib/ai/utils/message-normalizer';
import { logger } from '@/lib/logging';
import type {
  AnalysisBasis,
  EnhancedChatMessage,
} from '@/stores/useAISidebarStore';
import type { AIThinkingStep } from '@/types/ai-sidebar/ai-sidebar-types';
import { SESSION_LIMITS } from '@/types/session';

// ============================================================================
// 로컬 스토리지 유틸리티
// ============================================================================

const CHAT_HISTORY_KEY = 'openmanager-chat-history';
const MAX_STORED_MESSAGES = 50;

interface StoredChatHistory {
  sessionId: string;
  messages: Array<{
    id: string;
    role: string;
    content: string;
    timestamp: string;
  }>;
  lastUpdated: string;
}

/**
 * 로컬 스토리지에서 채팅 히스토리 로드
 */
function loadChatHistory(): StoredChatHistory | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(CHAT_HISTORY_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored) as StoredChatHistory;

    // 24시간 이상 된 데이터는 무효화
    const lastUpdated = new Date(parsed.lastUpdated);
    const hoursSinceUpdate =
      (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60);
    if (hoursSinceUpdate > 24) {
      localStorage.removeItem(CHAT_HISTORY_KEY);
      return null;
    }

    return parsed;
  } catch (error) {
    logger.warn('[ChatHistory] Failed to load:', error);
    return null;
  }
}

/**
 * 로컬 스토리지에 채팅 히스토리 저장
 */
function saveChatHistory(
  sessionId: string,
  messages: EnhancedChatMessage[]
): void {
  if (typeof window === 'undefined') return;

  try {
    // 저장할 메시지 필터링 (user/assistant만, 최대 50개)
    const messagesToStore = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .slice(-MAX_STORED_MESSAGES)
      .map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp:
          m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp,
      }));

    const history: StoredChatHistory = {
      sessionId,
      messages: messagesToStore,
      lastUpdated: new Date().toISOString(),
    };

    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    logger.warn('[ChatHistory] Failed to save:', error);
  }
}

/**
 * 로컬 스토리지에서 채팅 히스토리 삭제
 */
function clearChatHistory(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(CHAT_HISTORY_KEY);
  } catch (error) {
    logger.warn('[ChatHistory] Failed to clear:', error);
  }
}

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

  // 에러 상태 (인라인 에러 표시용)
  const [error, setError] = useState<string | null>(null);

  // 마지막 쿼리 저장 (재시도용)
  const lastQueryRef = useRef<string>('');

  // 현재 전송 중인 쿼리 저장 (입력 유실 방지)
  const pendingQueryRef = useRef<string>('');

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
    reset: resetHybridQuery,
    currentMode,
    // Clarification functions
    selectClarification,
    submitCustomClarification,
    skipClarification,
  } = useHybridAIQuery({
    sessionId: chatSessionIdRef.current,
    onStreamFinish: () => {
      // 전송된 쿼리로 콜백 호출 (현재 입력값이 아닌)
      onMessageSend?.(pendingQueryRef.current);
      // 입력은 handleSendInput에서 이미 클리어됨
      setError(null);
      pendingQueryRef.current = '';
    },
    onJobResult: (result) => {
      onMessageSend?.(pendingQueryRef.current);
      // 입력은 handleSendInput에서 이미 클리어됨
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
  });

  // ============================================================================
  // 에러 동기화 (hybridState.error → 로컬 error 상태)
  // ============================================================================

  useEffect(() => {
    if (hybridState.error && !error) {
      setError(hybridState.error);
    }
  }, [hybridState.error, error]);

  // ============================================================================
  // 로컬 스토리지에서 히스토리 복원 (마운트 시 1회)
  // ============================================================================

  const isHistoryLoaded = useRef(false);

  useEffect(() => {
    // 이미 로드했거나 메시지가 있으면 스킵
    if (isHistoryLoaded.current || messages.length > 0) return;

    const history = loadChatHistory();
    if (history && history.messages.length > 0) {
      // 저장된 메시지를 UIMessage 형식으로 변환
      const restoredMessages = history.messages.map((m) => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        parts: [{ type: 'text' as const, text: m.content }],
      }));

      setMessages(restoredMessages);
      chatSessionIdRef.current = history.sessionId;

      if (process.env.NODE_ENV === 'development') {
        logger.info(
          `📂 [ChatHistory] Restored ${restoredMessages.length} messages`
        );
      }
    }

    isHistoryLoaded.current = true;
  }, [messages.length, setMessages]);

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
    // 하이브리드 쿼리 상태 완전 초기화 (메시지, 에러, 진행 상태 등)
    resetHybridQuery();
    // 새 세션 ID 생성
    chatSessionIdRef.current = generateSessionId();
    // 입력 및 에러 상태 초기화
    setInput('');
    setError(null);
    pendingQueryRef.current = '';
    // 로컬 스토리지 히스토리 삭제
    clearChatHistory();
  }, [resetHybridQuery]);

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
          logger.error('[AIChatCore] Feedback API error:', response.status);
        }
      } catch (error) {
        logger.error('[AIChatCore] Feedback error:', error);
      }
    },
    []
  );

  // ============================================================================
  // 에러 관리
  // ============================================================================

  const clearError = useCallback(() => {
    setError(null);
  }, []);

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
      setError(null); // 재생성 시 에러 초기화
      sendQuery(textContent);
    }
  }, [messages, setMessages, sendQuery]);

  // ============================================================================
  // 재시도 함수 (마지막 쿼리 재실행)
  // ============================================================================

  const retryLastQuery = useCallback(() => {
    if (!lastQueryRef.current) return;
    setError(null);
    sendQuery(lastQueryRef.current);
  }, [sendQuery]);

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

        // 📊 분석 근거 생성 (assistant 메시지에만)
        let analysisBasis: AnalysisBasis | undefined;
        if (m.role === 'assistant') {
          const isJobQueue = currentMode === 'job-queue';
          const hasTools = toolParts.length > 0;

          analysisBasis = {
            dataSource: hasTools ? '서버 실시간 데이터 분석' : '일반 대화 응답',
            engine: isJobQueue ? 'Cloud Run AI' : 'Streaming AI',
            ragUsed: hasTools,
            // TODO: 백엔드에서 실제 서버 수 및 신뢰도 제공 시 확장
            confidence: hasTools ? 85 : undefined,
            timeRange: hasTools ? '최근 1시간' : undefined,
          };
        }

        return {
          id: m.id,
          role: m.role as 'user' | 'assistant' | 'system' | 'thinking',
          content: textContent,
          timestamp: new Date(),
          isStreaming:
            hybridIsLoading && m.id === messages[messages.length - 1]?.id,
          thinkingSteps: thinkingSteps.length > 0 ? thinkingSteps : undefined,
          metadata: analysisBasis ? { analysisBasis } : undefined,
        };
      });
  }, [messages, hybridIsLoading, currentMode]);

  // ============================================================================
  // 로컬 스토리지 동기화
  // ============================================================================

  // 메시지 변경 시 자동 저장 (스트리밍 중이 아닐 때만)
  useEffect(() => {
    if (!hybridIsLoading && enhancedMessages.length > 0) {
      saveChatHistory(chatSessionIdRef.current, enhancedMessages);
    }
  }, [enhancedMessages, hybridIsLoading]);

  // ============================================================================
  // 입력 핸들러
  // ============================================================================

  const handleSendInput = useCallback(() => {
    if (!input.trim()) return;

    // 세션 제한 체크
    if (!disableSessionLimit && sessionState.isLimitReached) {
      logger.warn(
        `⚠️ [Session] Limit reached (${SESSION_MESSAGE_LIMIT} messages)`
      );
      return;
    }

    // 에러 초기화
    setError(null);

    // 쿼리 저장 (재시도용)
    lastQueryRef.current = input;
    pendingQueryRef.current = input;

    // 🎯 Best Practice: 전송 즉시 입력 클리어 (ChatGPT/Claude 스타일)
    // 사용자가 전송 버튼을 누르면 입력창이 즉시 비워짐
    setInput('');

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
      error: hybridState.error ?? undefined,
    },
    currentMode: currentMode ?? undefined,

    // 에러 상태 (로컬 상태만 사용 - useEffect로 hybridState.error 동기화됨)
    error,
    clearError,

    // 세션 관리
    sessionId: chatSessionIdRef.current,
    sessionState,
    handleNewSession,

    // 액션
    handleFeedback,
    regenerateLastResponse,
    retryLastQuery,
    stop,
    cancel,

    // 입력 핸들러
    handleSendInput,

    // 명확화 기능
    clarification: hybridState.clarification ?? null,
    selectClarification,
    submitCustomClarification,
    skipClarification,
  };
}

export default useAIChatCore;
