'use client';

import { type UIMessage, useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
// Icons
import { Bot, User } from 'lucide-react';
import {
  type FC,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { SESSION_LIMITS } from '@/types/hitl';
import { RenderMarkdownContent } from '@/utils/markdown-parser';
import type { AIAssistantFunction } from '../../../components/ai/AIAssistantIconPanel';
import AIAssistantIconPanel from '../../../components/ai/AIAssistantIconPanel';
import { MessageActions } from '../../../components/ai/MessageActions';
import { isGuestFullAccessEnabled } from '../../../config/guestMode';
import { useUserPermissions } from '../../../hooks/useUserPermissions';
import type { EnhancedChatMessage } from '../../../stores/useAISidebarStore';
// Types
import type {
  AISidebarV3Props,
  AIThinkingStep,
} from '../types/ai-sidebar-types';
// Components
import { AIFunctionPages } from './AIFunctionPages';
import { AISidebarHeader } from './AISidebarHeader';
import { EnhancedAIChat } from './EnhancedAIChat';
import {
  type AgentStep,
  type ApprovalRequest,
  InlineAgentStatus,
} from './InlineAgentStatus';

// v2.x UIMessage에서 텍스트 콘텐츠 추출 헬퍼
function extractTextFromMessage(message: UIMessage): string {
  if (!message.parts || message.parts.length === 0) {
    return '';
  }
  return message.parts
    .filter(
      (part): part is { type: 'text'; text: string } => part.type === 'text'
    )
    .map((part) => part.text)
    .join('');
}

/**
 * ThinkingSteps를 AgentStep 형식으로 변환
 */
function convertToAgentSteps(thinkingSteps?: AIThinkingStep[]): AgentStep[] {
  if (!thinkingSteps || thinkingSteps.length === 0) return [];

  // Tool 이름을 Agent 타입으로 매핑
  const toolToAgent: Record<string, AgentStep['agent']> = {
    getServerMetrics: 'nlq',
    analyzePatterns: 'analyst',
    generateReport: 'reporter',
    classifyIntent: 'supervisor',
    // 기본값은 nlq
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

// 🔒 세션 제한 상수
const SESSION_MESSAGE_LIMIT = SESSION_LIMITS.MESSAGE_LIMIT;
const SESSION_WARNING_THRESHOLD = SESSION_LIMITS.WARNING_THRESHOLD;

// 🔍 자연어 승인 응답 감지 헬퍼
function detectApprovalIntent(input: string): 'approve' | 'reject' | null {
  const trimmed = input.trim().toLowerCase();

  // 승인 패턴 (우선순위 높음)
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
  // 거부 패턴
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

  // 둘 다 있으면 더 강한 신호 우선 (거부가 더 명시적이면 거부)
  if (isApproval && !isRejection) return 'approve';
  if (isRejection) return 'reject';

  return null;
}

// 🎯 메시지 컴포넌트 성능 최적화 (Cursor/Copilot 스타일)
const MessageComponent = memo<{
  message: EnhancedChatMessage;
  onRegenerateResponse?: (messageId: string) => void;
  onFeedback?: (messageId: string, type: 'positive' | 'negative') => void;
  isLastMessage?: boolean;
  approvalRequest?: ApprovalRequest;
}>(
  ({
    message,
    onRegenerateResponse,
    onFeedback,
    isLastMessage,
    approvalRequest,
  }) => {
    // thinking 메시지일 경우 간소화된 인라인 상태 표시
    if (message.role === 'thinking' && message.thinkingSteps) {
      const agentSteps = convertToAgentSteps(message.thinkingSteps);
      return (
        <InlineAgentStatus
          steps={agentSteps}
          isComplete={!message.isStreaming}
          approvalRequest={approvalRequest}
        />
      );
    }

    // 일반 메시지 렌더링
    return (
      <div
        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
      >
        <div
          className={`flex max-w-[90%] items-start space-x-2 sm:max-w-[85%] ${
            message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
          }`}
        >
          {/* 아바타 */}
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-xs ${
              message.role === 'user'
                ? 'bg-blue-100 text-blue-600'
                : 'bg-linear-to-br from-purple-500 to-pink-500 text-white'
            }`}
          >
            {message.role === 'user' ? (
              <User className="h-4 w-4" />
            ) : (
              <Bot className="h-4 w-4" />
            )}
          </div>

          {/* 메시지 콘텐츠 */}
          <div className="flex-1">
            {/* 스트리밍 중 인라인 Agent 상태 표시 (자연어 승인 대기 표시) */}
            {message.role === 'assistant' &&
              message.isStreaming &&
              message.thinkingSteps &&
              message.thinkingSteps.length > 0 && (
                <InlineAgentStatus
                  steps={convertToAgentSteps(message.thinkingSteps)}
                  isComplete={false}
                  approvalRequest={approvalRequest}
                />
              )}

            {/* 메시지 내용 (콘텐츠가 있을 때만 표시) */}
            {message.content && (
              <div
                className={`rounded-2xl p-4 shadow-xs ${
                  message.role === 'user'
                    ? 'rounded-tr-sm bg-linear-to-br from-blue-500 to-blue-600 text-white'
                    : 'rounded-tl-sm border border-gray-100 bg-white text-gray-800'
                }`}
              >
                {message.role === 'assistant' ? (
                  <RenderMarkdownContent
                    content={message.content}
                    className="text-[15px] leading-relaxed"
                  />
                ) : (
                  <div className="whitespace-pre-wrap wrap-break-word text-[15px] leading-relaxed">
                    {message.content}
                  </div>
                )}
              </div>
            )}

            {/* 타임스탬프 & 메타데이터 */}
            <div
              className={`mt-1 flex items-center justify-between ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <p className="text-xs text-gray-500">
                {typeof message.timestamp === 'string'
                  ? new Date(message.timestamp).toLocaleTimeString()
                  : message.timestamp.toLocaleTimeString()}
              </p>
              {/* 처리 시간 표시 (assistant 메시지만) */}
              {message.role === 'assistant' &&
                message.metadata?.processingTime && (
                  <p className="text-xs text-gray-400">
                    {message.metadata.processingTime}ms
                  </p>
                )}
            </div>

            {/* 메시지 액션 (복사, 피드백, 재생성) */}
            {message.content && (
              <MessageActions
                messageId={message.id}
                content={message.content}
                role={message.role}
                onRegenerate={onRegenerateResponse}
                onFeedback={onFeedback}
                showRegenerate={isLastMessage && message.role === 'assistant'}
                className="mt-2"
              />
            )}
          </div>
        </div>
      </div>
    );
  }
);

MessageComponent.displayName = 'MessageComponent';

// 🔒 완전 Client-Only AI 사이드바 컴포넌트 (V4 - Vercel AI SDK Integration)
export const AISidebarV4: FC<AISidebarV3Props> = ({
  isOpen,
  onClose,
  className = '',
  sessionId: propSessionId,
  onMessageSend,
}) => {
  // 🔐 권한 확인
  const permissions = useUserPermissions();

  // 🔧 상태 관리
  const [selectedFunction, setSelectedFunction] =
    useState<AIAssistantFunction>('chat');

  // 🔧 수동 입력 상태 관리 (@ai-sdk/react v2.x 마이그레이션)
  const [input, setInput] = useState('');

  // 🔔 HITL Session ID 관리 - Cloud Run과 동일한 ID 사용
  // prop으로 전달받거나, 없으면 컴포넌트 마운트 시 생성
  const chatSessionIdRef = useRef<string>(
    propSessionId || `session_${Date.now()}`
  );

  // 🔔 Human-in-the-Loop 승인 상태
  const [pendingApproval, setPendingApproval] =
    useState<ApprovalRequest | null>(null);
  const [isProcessingApproval, setIsProcessingApproval] = useState(false);

  // 🔔 승인/거부 핸들러
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

  // Vercel AI SDK useChat Hook (@ai-sdk/react v2.x)
  const { messages, sendMessage, status, setMessages, stop } = useChat({
    // v2.x: transport 옵션으로 API 엔드포인트 설정
    transport: new DefaultChatTransport({
      api: '/api/ai/supervisor', // LangGraph Multi-Agent Supervisor
      // 🔔 HITL: Cloud Run과 동일한 sessionId 전달
      body: { sessionId: chatSessionIdRef.current },
    }),
    onFinish: async () => {
      // Optional: Sync to global store if needed
      onMessageSend?.(input);
      setInput(''); // 입력 초기화

      // 🔔 SSE 기반 HITL: 스트리밍 완료 후 1회 approval 상태 확인
      // chatSessionIdRef.current 사용 - Cloud Run과 동일한 ID로 조회
      try {
        const sessionId = chatSessionIdRef.current;

        const response = await fetch(
          `/api/ai/approval?sessionId=${encodeURIComponent(sessionId)}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.hasPending && data.action) {
            setPendingApproval({
              id: sessionId,
              type: data.action.type || 'tool_execution',
              description: data.action.description || '이 작업을 실행할까요?',
              details: data.action.details,
            });
            console.log(
              '🔔 [HITL] Approval request detected:',
              data.action.type
            );
          }
        }
      } catch (error) {
        console.error('❌ [HITL] Approval check failed:', error);
      }
    },
  });

  // ============================================================================
  // 🔒 세션 제한 관리
  // ============================================================================

  // 📊 세션 상태 계산
  const sessionState = useMemo(() => {
    const count = messages.length;
    const remaining = SESSION_MESSAGE_LIMIT - count;
    const isWarning = count >= SESSION_WARNING_THRESHOLD;
    const isLimitReached = count >= SESSION_MESSAGE_LIMIT;

    return { count, remaining, isWarning, isLimitReached };
  }, [messages.length]);

  // 🔄 세션 리셋 함수 (새 대화 시작)
  const handleNewSession = useCallback(() => {
    setMessages([]);
    chatSessionIdRef.current = `session_${Date.now()}`;
    setPendingApproval(null);
    setInput('');
    console.log('🔄 [Session] New session started:', chatSessionIdRef.current);
  }, [setMessages]);

  // 👍👎 피드백 핸들러 (백엔드 API 연동)
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
          console.error('[AISidebarV4] Feedback API error:', response.status);
        }
      } catch (error) {
        console.error('[AISidebarV4] Feedback error:', error);
      }
    },
    []
  );

  // v2.x: 재생성 함수 (마지막 assistant 메시지 제거 후 재전송)
  const regenerateLastResponse = () => {
    if (messages.length < 2) return;
    // 마지막 assistant 메시지 찾아서 제거
    const lastUserMessageIndex = [...messages]
      .reverse()
      .findIndex((m) => m.role === 'user');
    if (lastUserMessageIndex === -1) return;
    const actualIndex = messages.length - 1 - lastUserMessageIndex;
    const lastUserMessage = messages[actualIndex];
    if (!lastUserMessage) return;
    // assistant 메시지들 제거하고 user 메시지 재전송
    const textContent = extractTextFromMessage(lastUserMessage);
    if (textContent) {
      setMessages(messages.slice(0, actualIndex));
      void sendMessage({ text: textContent });
    }
  };

  // isLoading 호환성 유지 (v2.x status values: 'ready' | 'submitted' | 'streaming' | 'error')
  const isLoading = status === 'streaming' || status === 'submitted';

  // 🔔 승인 상태 초기화 (스트리밍 완료 시)
  // Note: 기존 2초 폴링 제거 - onFinish에서 1회 체크로 대체 (SSE 기반)
  useEffect(() => {
    if (!isLoading) {
      // 스트리밍 완료 후 승인 대기 상태가 아니면 초기화하지 않음
      // pendingApproval은 사용자가 결정할 때까지 유지
      return;
    }
    // 새 스트리밍 시작 시 이전 승인 요청 초기화
    setPendingApproval(null);
  }, [isLoading]);

  // Map Vercel v2.x UIMessage to EnhancedChatMessage
  const enhancedMessages = useMemo(() => {
    return messages
      .filter(
        (m) =>
          m.role === 'user' || m.role === 'assistant' || m.role === 'system'
      )
      .map((m): EnhancedChatMessage => {
        // v2.x/v5.x: parts 배열에서 텍스트 추출
        const textContent = extractTextFromMessage(m);

        // v5.x: tool parts는 type이 'tool-${toolName}' 형태
        // state: 'input-streaming' | 'input-available' | 'output-available' | 'output-error'
        const toolParts =
          m.parts?.filter(
            (part): part is typeof part & { toolCallId: string } =>
              part.type.startsWith('tool-') && 'toolCallId' in part
          ) ?? [];

        // tool parts를 thinking steps로 변환
        const thinkingSteps = toolParts.map((toolPart) => {
          // type에서 tool name 추출 (예: 'tool-getServerMetrics' -> 'getServerMetrics')
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
          timestamp: new Date(), // v2.x: createdAt 직접 없음, 현재 시간 사용
          isStreaming: isLoading && m.id === messages[messages.length - 1]?.id,
          thinkingSteps: thinkingSteps.length > 0 ? thinkingSteps : undefined,
        };
      });
  }, [messages, isLoading]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // ESC 키로 사이드바 닫기
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const canRenderSidebar =
    permissions.canToggleAI || isGuestFullAccessEnabled();
  if (!canRenderSidebar) {
    return null;
  }

  const renderFunctionPage = () => {
    if (selectedFunction === 'chat') {
      return (
        <EnhancedAIChat
          autoReportTrigger={{ shouldGenerate: false }}
          allMessages={enhancedMessages}
          limitedMessages={enhancedMessages}
          messagesEndRef={messagesEndRef}
          MessageComponent={MessageComponent}
          pendingApproval={pendingApproval}
          inputValue={input}
          setInputValue={setInput}
          handleSendInput={() => {
            if (!input.trim()) return;

            // 🔒 세션 제한 체크 (무료 티어 보호)
            if (sessionState.isLimitReached) {
              console.warn(
                `⚠️ [Session] Limit reached (${SESSION_MESSAGE_LIMIT} messages)`
              );
              return; // 입력 차단 - UI에서 경고 표시됨
            }

            // 🔔 승인 대기 중이면 자연어 의도 감지
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
              // 의도가 불분명하면 일반 메시지로 처리
            }

            // @ai-sdk/react v2.x: sendMessage API
            void sendMessage({ text: input });
          }}
          // 🔒 세션 상태 전달
          sessionState={sessionState}
          onNewSession={handleNewSession}
          isGenerating={isLoading}
          regenerateResponse={() => {
            regenerateLastResponse();
          }}
          currentEngine="Vercel AI SDK"
          // 👍👎 피드백 핸들러
          onFeedback={handleFeedback}
          // ⏹️ 생성 중단 핸들러
          onStopGeneration={stop}
        />
      );
    }
    return (
      <AIFunctionPages
        selectedFunction={selectedFunction}
        onFunctionChange={setSelectedFunction}
      />
    );
  };

  return (
    <div
      data-testid="ai-sidebar"
      role="dialog"
      aria-labelledby="ai-sidebar-v4-title"
      aria-modal="true"
      aria-hidden={!isOpen}
      className={`gpu-sidebar-slide-in fixed right-0 top-0 z-30 flex h-full w-full max-w-[90vw] bg-white shadow-2xl sm:w-[90vw] md:w-[600px] lg:w-[700px] xl:w-[800px] ${
        isOpen ? '' : 'gpu-sidebar-slide-out'
      } ${className}`}
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <AISidebarHeader onClose={onClose} />
        <div className="flex-1 overflow-hidden pb-20 sm:pb-0">
          {renderFunctionPage()}
        </div>
      </div>

      <div className="hidden sm:block">
        <AIAssistantIconPanel
          selectedFunction={selectedFunction}
          onFunctionChange={setSelectedFunction}
          className="w-16 sm:w-20"
        />
      </div>
    </div>
  );
};

export default memo(AISidebarV4) as FC<AISidebarV3Props>;
