'use client';

/**
 * 🤖 useAIChatCore - AI 채팅 공통 로직 훅
 *
 * AISidebarV4와 AIWorkspace에서 공유하는 핵심 로직:
 * - Hybrid AI Query (Streaming + Job Queue)
 * - HITL 승인/거부
 * - 세션 제한
 * - 피드백
 * - 메시지 변환
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AIThinkingStep } from '@/domains/ai-sidebar/types/ai-sidebar-types';
import { useHybridAIQuery } from '@/hooks/ai/useHybridAIQuery';
import { extractTextFromUIMessage } from '@/lib/ai/utils/message-normalizer';
import type { EnhancedChatMessage } from '@/stores/useAISidebarStore';
import {
  type ApprovalRequest as HITLApprovalRequest,
  type ApprovalRequestType as HITLApprovalRequestType,
  SESSION_LIMITS,
} from '@/types/hitl';

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

  // HITL 승인
  pendingApproval: HITLApprovalRequest | null;
  isProcessingApproval: boolean;
  handleApprove: (requestId: string) => Promise<void>;
  handleReject: (requestId: string) => Promise<void>;
  detectApprovalIntent: (input: string) => 'approve' | 'reject' | null;

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

  // 입력 처리 (승인 감지 + 세션 제한 통합)
  handleSendInput: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const SESSION_MESSAGE_LIMIT = SESSION_LIMITS.MESSAGE_LIMIT;
const SESSION_WARNING_THRESHOLD = SESSION_LIMITS.WARNING_THRESHOLD;

// ============================================================================
// Helpers
// ============================================================================

/**
 * 자연어 승인 응답 감지
 */
export function detectApprovalIntent(
  input: string
): 'approve' | 'reject' | null {
  const trimmed = input.trim().toLowerCase();

  const approvalPatterns = [
    '네',
    '예',
    'yes',
    '확인',
    '진행',
    '승인',
    'ok',
    '좋아',
    '그래',
    '맞아',
  ];
  const rejectPatterns = [
    '아니',
    '아니오',
    'no',
    '취소',
    '거부',
    '중지',
    'cancel',
    '그만',
    '안해',
    '싫어',
  ];

  const isApproval = approvalPatterns.some((p) => trimmed.includes(p));
  const isRejection = rejectPatterns.some((p) => trimmed.includes(p));

  if (isApproval && !isRejection) return 'approve';
  if (isRejection) return 'reject';

  return null;
}

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

  // 세션 ID 관리
  const chatSessionIdRef = useRef<string>(
    propSessionId || `session_${Date.now()}`
  );

  // HITL 승인 상태
  const [pendingApproval, setPendingApproval] =
    useState<HITLApprovalRequest | null>(null);
  const [isProcessingApproval, setIsProcessingApproval] = useState(false);

  // ============================================================================
  // HITL 승인/거부 핸들러
  // ============================================================================

  const handleApprove = useCallback(
    async (requestId: string) => {
      if (isProcessingApproval) return;
      setIsProcessingApproval(true);

      try {
        const response = await fetch('/api/ai/approval', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: requestId,
            approved: true,
          }),
        });

        if (response.ok) {
          console.log('✅ [HITL] Approval accepted');
          setPendingApproval(null);
        } else {
          console.error('❌ [HITL] Approval failed:', await response.text());
        }
      } catch (error) {
        console.error('❌ [HITL] Approval error:', error);
      } finally {
        setIsProcessingApproval(false);
      }
    },
    [isProcessingApproval]
  );

  const handleReject = useCallback(
    async (requestId: string) => {
      if (isProcessingApproval) return;
      setIsProcessingApproval(true);

      try {
        const response = await fetch('/api/ai/approval', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: requestId,
            approved: false,
            reason: 'User rejected the action',
          }),
        });

        if (response.ok) {
          console.log('🚫 [HITL] Action rejected');
          setPendingApproval(null);
        } else {
          console.error('❌ [HITL] Rejection failed:', await response.text());
        }
      } catch (error) {
        console.error('❌ [HITL] Rejection error:', error);
      } finally {
        setIsProcessingApproval(false);
      }
    },
    [isProcessingApproval]
  );

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
    onStreamFinish: async () => {
      onMessageSend?.(input);
      setInput('');

      // HITL: 스트리밍 완료 후 승인 상태 확인
      try {
        const sessionId = chatSessionIdRef.current;
        const response = await fetch(
          `/api/ai/approval?sessionId=${encodeURIComponent(sessionId)}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.hasPending && data.action) {
            // ApprovalRequestType으로 안전하게 변환
            const actionType = (data.action.type ||
              'tool_execution') as HITLApprovalRequestType;
            const detailsString =
              typeof data.action.details === 'string'
                ? data.action.details
                : data.action.details
                  ? JSON.stringify(data.action.details)
                  : undefined;

            setPendingApproval({
              id: sessionId,
              type: actionType,
              description: data.action.description || '이 작업을 실행할까요?',
              details: detailsString,
            });
            console.log('🔔 [HITL] Approval request detected:', actionType);
          }
        }
      } catch (error) {
        console.error('❌ [HITL] Approval check failed:', error);
      }
    },
    onJobResult: (result) => {
      onMessageSend?.(input);
      setInput('');
      console.log('📦 [Job Queue] Result received:', result.success);
    },
    onProgress: (progress) => {
      console.log(
        `📊 [Job Queue] Progress: ${progress.progress}% - ${progress.stage}`
      );
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
    chatSessionIdRef.current = `session_${Date.now()}`;
    setPendingApproval(null);
    setInput('');
    console.log('🔄 [Session] New session started:', chatSessionIdRef.current);
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
  // 승인 상태 초기화
  // ============================================================================

  useEffect(() => {
    if (!hybridIsLoading) return;
    setPendingApproval(null);
  }, [hybridIsLoading]);

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
  // 통합 입력 핸들러 (승인 감지 + 세션 제한)
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

    // 승인 대기 중이면 자연어 의도 감지
    if (pendingApproval) {
      const intent = detectApprovalIntent(input);
      if (intent === 'approve') {
        void handleApprove(pendingApproval.id);
        setInput('');
        return;
      } else if (intent === 'reject') {
        void handleReject(pendingApproval.id);
        setInput('');
        return;
      }
    }

    // 일반 쿼리 전송
    sendQuery(input);
  }, [
    input,
    disableSessionLimit,
    sessionState.isLimitReached,
    pendingApproval,
    handleApprove,
    handleReject,
    sendQuery,
  ]);

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

    // HITL 승인
    pendingApproval: pendingApproval as HITLApprovalRequest | null,
    isProcessingApproval,
    handleApprove,
    handleReject,
    detectApprovalIntent,

    // 세션 관리
    sessionId: chatSessionIdRef.current,
    sessionState,
    handleNewSession,

    // 액션
    handleFeedback,
    regenerateLastResponse,
    stop,
    cancel,

    // 통합 입력 핸들러
    handleSendInput,
  };
}

export default useAIChatCore;
