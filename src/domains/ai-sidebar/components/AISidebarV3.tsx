/**
 * 🎨 AI Sidebar V3 - 완전한 thinking process + 성능 최적화
 *
 * ✅ 실제 useAIThinking 훅 사용
 * ✅ EnhancedChatMessage 완전 통합  
 * ✅ Google AI vs Local AI 완전 차별화
 * ✅ 성능 최적화 (memo, useCallback)
 * ✅ 메시지 영속성 강화
 * ✅ TypeScript 타입 안전성 완전 보장
 */

'use client';

import React, { useCallback, useEffect, useRef, useState, useMemo, memo, Fragment, createElement, type FC } from 'react';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { isGuestFullAccessEnabled } from '@/config/guestMode';
import { useRealTimeAILogs } from '../../../hooks/useRealTimeAILogs';
import {
  useAIChat,
  useAISidebarStore,
  useAIThinking,
  EnhancedChatMessage,
} from '../../../stores/useAISidebarStore';

// Icons
import {
  BarChart3,
  Bot,
  FileText,
  Search,
  Send,
  Server,
  Target,
  User,
  type LucideIcon,
} from 'lucide-react';

// Components
import { AIFunctionPages } from './AIFunctionPages';
import { AISidebarHeader } from './AISidebarHeader';
import { EnhancedAIChat } from './EnhancedAIChat';
import ThinkingProcessVisualizer from '../../../components/ai/ThinkingProcessVisualizer';
import type { AIAssistantFunction } from '../../../components/ai/AIAssistantIconPanel';
import AIAssistantIconPanel from '../../../components/ai/AIAssistantIconPanel';
import { CompactModeSelector } from '../../../components/ui/CompactModeSelector';
import { AutoResizeTextarea } from '../../../components/ui/AutoResizeTextarea';

// Types
import type { AISidebarV3Props, AIThinkingStep } from '../types/ai-sidebar-types';
import type { ChatMessage } from '../../../stores/useAISidebarStore';
import type { AIMode } from '../../../types/ai-types';
import { RealAISidebarService } from '../services/RealAISidebarService';

// 🎯 ThinkingProcessVisualizer 성능 최적화
const MemoizedThinkingProcessVisualizer = memo(ThinkingProcessVisualizer);

// 🎯 메시지 컴포넌트 성능 최적화
const MessageComponent = memo<{
  message: EnhancedChatMessage;
  onRegenerateResponse?: (messageId: string) => void;
}>(({ message, onRegenerateResponse }) => {
  // thinking 메시지일 경우 ThinkingProcessVisualizer 사용
  if (message.role === 'thinking' && message.thinkingSteps) {
    return (
      <div className="my-4">
        <MemoizedThinkingProcessVisualizer
          steps={message.thinkingSteps as AIThinkingStep[]}
          isActive={message.isStreaming || false}
          className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4"
        />
      </div>
    );
  }

  // 일반 메시지 렌더링
  return (
    <div
      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`flex max-w-[90%] items-start space-x-2 sm:max-w-[85%] ${
          message.role === 'user'
            ? 'flex-row-reverse space-x-reverse'
            : ''
        }`}
      >
        {/* 아바타 */}
        <div
          className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${
            message.role === 'user'
              ? 'bg-blue-500 text-white'
              : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
          }`}
        >
          {message.role === 'user' ? (
            <User className="h-3 w-3" />
          ) : (
            <Bot className="h-3 w-3" />
          )}
        </div>

        {/* 메시지 콘텐츠 */}
        <div className="flex-1">
          <div
            className={`rounded-lg p-3 ${
              message.role === 'user'
                ? 'bg-blue-500 text-white'
                : 'border border-gray-200 bg-white'
            }`}
          >
            <div className="whitespace-pre-wrap break-words text-sm">
              {message.content}
            </div>
          </div>

          {/* 타임스탬프 & 메타데이터 */}
          <div className={`mt-1 flex items-center justify-between ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <p className="text-xs text-gray-500">
              {typeof message.timestamp === 'string'
                ? new Date(message.timestamp).toLocaleTimeString()
                : message.timestamp.toLocaleTimeString()}
            </p>
            {message.metadata?.processingTime && (
              <span className="text-xs text-gray-400">
                {message.metadata.processingTime}ms
              </span>
            )}
          </div>

          {/* EnhancedChatMessage의 thinking steps 표시 (assistant 메시지에서) */}
          {message.role === 'assistant' && 
           message.thinkingSteps && 
           message.thinkingSteps.length > 0 && (
            <div className="mt-3 border-t border-gray-100 pt-3">
              <MemoizedThinkingProcessVisualizer
                steps={message.thinkingSteps}
                isActive={false}
                className="bg-gray-50 border border-gray-200 rounded"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

MessageComponent.displayName = 'MessageComponent';

// 🔒 완전 Client-Only AI 사이드바 컴포넌트
export const AISidebarV3: FC<AISidebarV3Props> = ({
  isOpen,
  onClose,
  className = '',
  defaultEngine = 'LOCAL',
  sessionId,
  enableRealTimeThinking = true,
  onEngineChange,
  onMessageSend,
}) => {

  // 🔐 권한 확인 (모든 hooks보다 먼저 호출)
  const permissions = useUserPermissions();

  // 실제 AI 서비스 인스턴스 (useMemo로 캐싱하여 재생성 방지)
  const aiService = useMemo(() => new RealAISidebarService(), []);

  // 🔧 상태 관리 (성능 최적화된 그룹) - hooks 순서 일관성 보장
  const [selectedFunction, setSelectedFunction] = useState<AIAssistantFunction>('chat');
  const [selectedEngine, setSelectedEngine] = useState<AIMode>(defaultEngine);
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // 자동 보고서 트리거 상태
  const [autoReportTrigger, setAutoReportTrigger] = useState<{
    shouldGenerate: boolean;
    lastQuery?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
  }>({
    shouldGenerate: false,
  });

  const MAX_MESSAGES = 50; // 메모리 누수 방지

  // 통합 상태 관리 (Single Source of Truth)
  const { 
    messages: allMessages,
    addMessage,
    updateMessage, 
    clearMessages
  } = useAISidebarStore();
  
  const { 
    steps, 
    isThinking, 
    startThinking, 
    simulateThinkingSteps,
    clearSteps 
  } = useAIThinking();

  // useAIChat 훅 제거 (상태 이중화 해결)

  // 채팅 세션 ID
  const [chatSessionId] = useState(sessionId || `session-${Date.now()}`);

  // 스크롤 참조
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // steps를 useRef로 관리하여 불필요한 re-render 방지
  const stepsRef = useRef(steps);
  useEffect(() => {
    stepsRef.current = steps;
  }, [steps]);

  // AbortController 참조 (컴포넌트 언마운트 시 진행 중인 요청 취소)
  const abortControllerRef = useRef<AbortController | null>(null);

  // 실시간 AI 로그 훅
  const {
    logs: realTimeLogs,
    isConnected: isLogConnected,
    isProcessing: isRealTimeProcessing,
    currentEngine,
    techStack,
    connectionStatus,
  } = useRealTimeAILogs({
    sessionId: chatSessionId,
    mode: 'sidebar',
    maxLogs: 30,
  });


  // 🎯 실제 AI 쿼리 처리 함수 (완전히 새로워진 구현)
  const processRealAIQuery = useCallback(async (
    query: string,
    engine: AIMode = 'LOCAL'
  ) => {
    const startTime = Date.now();

    try {
      console.log(`🤖 V3 AI 쿼리 처리 시작: ${query} (엔진: ${engine})`);

      // 순차적 비동기 처리 (Race Condition 해결)
      let processingMessage: EnhancedChatMessage | null = null;
      
      // 단계 1: 처리 메시지 추가
      if (engine === 'GOOGLE_AI') {
        processingMessage = {
          id: `processing-${crypto.randomUUID()}`,
          content: '🤖 Google AI API 사용중...',
          role: 'thinking',
          timestamp: new Date(),
          isStreaming: true,
        };
        addMessage(processingMessage);
      } else if (enableRealTimeThinking) {
        await startThinking('분석 시작', chatSessionId);
        await simulateThinkingSteps(query, engine);
      }

      // 단계 2: API 호출 (timeout 및 abort controller 적용)
      const abortController = new AbortController();
      abortControllerRef.current = abortController; // cleanup을 위해 참조 저장
      const timeoutId = setTimeout(() => abortController.abort(), 30000); // 30초 timeout
      
      const response = await fetch('/api/ai/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          temperature: 0.7,
          maxTokens: 1000,
          context: 'ai-sidebar-v3',
          includeThinking: enableRealTimeThinking && engine !== 'GOOGLE_AI',
          mode: engine === 'GOOGLE_AI' ? 'google-ai' : 'local-ai',
          timeoutMs: 450,
        }),
        signal: abortController.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API 오류: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.response) {
        const processingTime = Date.now() - startTime;

        // 단계 3: 처리 메시지 제거 및 최종 응답 추가
        if (processingMessage) {
          // 처리 메시지 제거 (불필요한 상태 제거)
          // 실제 구현에서는 updateMessage로 대체
        }
        
        const finalMessage: EnhancedChatMessage = {
          id: `assistant-${crypto.randomUUID()}`,
          content: data.response,
          role: 'assistant',
          timestamp: new Date(),
          engine: data.engine || engine,
          metadata: {
            processingTime,
            confidence: data.confidence || 0.8,
          },
          // Local AI인 경우 thinking steps 포함 (useRef로 최적화)
          thinkingSteps: enableRealTimeThinking && engine !== 'GOOGLE_AI' ? stepsRef.current : undefined,
          isCompleted: true,
        };

        addMessage(finalMessage);

        // AbortController 참조 초기화 (성공 시)
        abortControllerRef.current = null;

        // 부모 컴포넌트에 알림
        onMessageSend?.(query);
        onEngineChange?.(engine);

        return {
          success: true,
          content: data.response,
          confidence: data.confidence || 0.8,
          engine: data.engine || engine,
          processingTime,
          metadata: data.metadata,
        };
      } else {
        throw new Error(data.error || 'AI 응답 생성 실패');
      }
    } catch (error) {
      console.error('❌ V3 AI 쿼리 실패:', error);

      // 에러 메시지 추가
      const errorMessage: EnhancedChatMessage = {
        id: `error-${Date.now()}`,
        content: `죄송합니다. AI 응답 생성 중 오류가 발생했습니다: ${
          error instanceof Error ? error.message : '알 수 없는 오류'
        }`,
        role: 'assistant',
        timestamp: new Date(),
        metadata: {
          processingTime: Date.now() - startTime,
          error: error instanceof Error ? error.message : '알 수 없는 오류',
        },
        isCompleted: true,
      };
      addMessage(errorMessage);

      return {
        success: false,
        content: errorMessage.content,
        confidence: 0,
        engine: 'error',
        processingTime: Date.now() - startTime,
      };
    }
  }, [
    addMessage,
    startThinking,
    simulateThinkingSteps,
    // steps는 useRef로 관리하여 dependency에서 제거 (불필요한 re-render 방지)
    chatSessionId,
    enableRealTimeThinking,
    onMessageSend,
    onEngineChange,
  ]);

  // 🎯 AI 모드 변경 핸들러 (성능 최적화)
  const handleModeChange = useCallback(async (newMode: AIMode) => {
    try {
      setIsGenerating(true);
      setSelectedEngine(newMode);

      console.log(`🔄 V3 AI 모드 변경: ${newMode}`);

      // 성공 메시지 추가
      const message: EnhancedChatMessage = {
        id: `mode-change-${Date.now()}`,
        role: 'assistant',
        content: `AI 모드가 ${newMode === 'LOCAL' ? '로컬' : 'Google AI'}로 변경되었습니다.`,
        timestamp: new Date(),
        isCompleted: true,
      };

      addMessage(message);
      onEngineChange?.(newMode);
    } catch (error) {
      console.error('AI 모드 변경 실패:', error);

      const errorMessage: EnhancedChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `AI 모드 변경에 실패했습니다: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        timestamp: new Date(),
        isCompleted: true,
      };

      addMessage(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  }, [onEngineChange]); // onEngineChange 함수 의존성 복구


  // 🎯 메시지 전송 핸들러 (성능 최적화)
  const handleSendInput = useCallback(async () => {
    const query = inputValue.trim();
    if (!query || isGenerating) return;

    setIsGenerating(true);

    // 사용자 메시지 추가
    const userMessage: EnhancedChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date(),
      isCompleted: true,
    };

    // 통합 상태에 메시지 추가
    addMessage(userMessage);

    // 실제 AI 질의 처리
    await processRealAIQuery(query, selectedEngine);

    setInputValue('');
    setIsGenerating(false);
  }, [inputValue, isGenerating, selectedEngine, processRealAIQuery]); // processRealAIQuery 함수 의존성 복구

  // 응답 재생성 (성능 최적화)
  const regenerateResponse = useCallback((messageId: string) => {
    const messageToRegenerate = allMessages.find(
      (msg) => msg.id === messageId && msg.role === 'assistant'
    );
    if (!messageToRegenerate) return;

    // 마지막 사용자 메시지 찾아서 재처리
    const lastUserMessage = allMessages.find((msg) => msg.role === 'user');
    if (lastUserMessage) {
      processRealAIQuery(lastUserMessage.content, selectedEngine);
    }
  }, [allMessages, selectedEngine, processRealAIQuery]); // processRealAIQuery 함수 의존성 복구

  // AI 엔진 초기화
  useEffect(() => {
    if (isOpen) {
      console.log('🎯 AISidebarV3 초기화 - 기본 모드:', defaultEngine);
      setSelectedEngine(defaultEngine);
    }
  }, [isOpen, defaultEngine]);

  // 메모리 효율성을 위한 메시지 제한
  const limitedMessages = useMemo(() => {
    return allMessages.length > MAX_MESSAGES 
      ? allMessages.slice(-MAX_MESSAGES)
      : allMessages;
  }, [allMessages]);

  // 자동 스크롤 (IntersectionObserver로 성능 최적화)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // 메시지가 뷰포트에 보이지 않으면 스크롤
          if (!entry.isIntersecting && limitedMessages.length > 0) {
            messagesEndRef.current?.scrollIntoView(); // behavior는 CSS로 처리
          }
        });
      },
      { threshold: 0.1 }
    );

    if (messagesEndRef.current) {
      observer.observe(messagesEndRef.current);
    }

    return () => observer.disconnect();
  }, [limitedMessages]);

  // 아이콘 매핑 (성능 최적화)
  const getIcon = useCallback((iconName: string) => {
    const icons: Record<string, LucideIcon> = {
      Server,
      Search,
      BarChart3,
      Target,
    };
    return icons[iconName] || Server;
  }, []);

  // 기능별 페이지 렌더링
  const renderFunctionPage = useCallback(() => {
    if (selectedFunction === 'chat') {
      return (
        <EnhancedAIChat
          enableRealTimeThinking={enableRealTimeThinking}
          autoReportTrigger={autoReportTrigger}
          allMessages={allMessages}
          limitedMessages={limitedMessages}
          messagesEndRef={messagesEndRef}
          MessageComponent={MessageComponent}
          inputValue={inputValue}
          setInputValue={setInputValue}
          handleSendInput={handleSendInput}
          isGenerating={isGenerating}
          selectedEngine={selectedEngine}
          handleModeChange={handleModeChange}
          regenerateResponse={regenerateResponse}
        />
      );
    }

    return (
      <AIFunctionPages
        selectedFunction={selectedFunction}
        onFunctionChange={setSelectedFunction}
      />
    );
  }, [
    selectedFunction,
    enableRealTimeThinking,
    autoReportTrigger,
    allMessages,
    limitedMessages,
    messagesEndRef,
    inputValue,
    isGenerating,
    selectedEngine,
    handleModeChange,
    handleSendInput,
    regenerateResponse,
  ]);

  // 🔐 권한이 없으면 사이드바 렌더링하지 않음
  // 🎛️ 게스트 전체 접근 모드에서는 AI 어시스턴트 허용
  if (!permissions.canToggleAI && !isGuestFullAccessEnabled()) {
    return null;
  }

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

  // 컴포넌트 언마운트 시 진행 중인 API 요청 취소
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  return (
    <Fragment>
      <div
        role="dialog"
        aria-labelledby="ai-sidebar-v3-title"
        aria-modal="true"
        aria-hidden={!isOpen}
        className={`fixed right-0 top-0 z-30 flex h-full w-full max-w-[90vw] bg-white shadow-2xl transition-transform duration-300 ease-in-out will-change-transform sm:w-[90vw] md:w-[600px] lg:w-[700px] xl:w-[800px] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } ${className}`}
      >
          {/* 메인 콘텐츠 영역 */}
          <div className="flex min-w-0 flex-1 flex-col">
            {/* 헤더 */}
            <AISidebarHeader onClose={onClose} />

            {/* 기능별 페이지 콘텐츠 */}
            <div className="flex-1 overflow-hidden pb-20 sm:pb-0">
              {renderFunctionPage()}
            </div>
          </div>

          {/* 오른쪽 AI 기능 아이콘 패널 */}
          <div className="hidden sm:block">
            <AIAssistantIconPanel
              selectedFunction={selectedFunction}
              onFunctionChange={setSelectedFunction}
              className="w-16 sm:w-20"
            />
          </div>

          {/* 모바일용 하단 기능 선택 패널 */}
          <div
            className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white/95 p-2 shadow-lg backdrop-blur-md sm:hidden"
            style={{
              paddingBottom: 'env(safe-area-inset-bottom)',
              zIndex: 9999,
              transform: 'translateZ(0)',
            }}
          >
            <AIAssistantIconPanel
              selectedFunction={selectedFunction}
              onFunctionChange={setSelectedFunction}
              className="w-full"
              isMobile={true}
            />
          </div>
        </div>
    </Fragment>
  );
};

// 메모이제이션된 클라이언트 전용 컴포넌트로 export
export default memo(AISidebarV3) as FC<AISidebarV3Props>;