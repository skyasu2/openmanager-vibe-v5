/**
 * useAIChat Hook
 *
 * 🤖 AI 채팅 기능을 위한 React 훅
 * 🧠 Smart Fallback Engine 통합 (MCP → RAG → Google AI)
 */

import { useState, useCallback, useRef } from 'react';
import { ChatMessage, AIResponse, ChatHookOptions } from '../types';
import {
  createUserMessage,
  formatAIResponse,
  createSystemMessage,
  generateSessionId,
  formatErrorMessage,
} from '../utils';
import { ThinkingLogger } from '../../ai-agent/core/ThinkingLogger';
import { LangGraphThinkingProcessor } from '../../ai-agent/core/LangGraphThinkingProcessor';

// 🔧 실시간 데이터 수집 함수들
async function fetchCurrentServerMetrics() {
  try {
    const response = await fetch('/api/servers');
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.warn('⚠️ 서버 메트릭 수집 실패:', error);
  }
  return [];
}

async function fetchRecentLogEntries() {
  try {
    // 로컬 스토리지에서 최근 알림 로그 가져오기
    const logs = JSON.parse(localStorage.getItem('notification_logs') || '[]');

    // API에서도 시도
    try {
      const response = await fetch('/api/logs/recent?limit=50');
      if (response.ok) {
        const apiLogs = await response.json();
        return apiLogs.length > 0 ? apiLogs : logs.slice(0, 50);
      }
    } catch (apiError) {
      console.warn('⚠️ API 로그 수집 실패, 로컬 데이터 사용:', apiError);
    }

    return logs.slice(0, 50); // 최근 50개
  } catch (error) {
    console.warn('⚠️ 로그 데이터 수집 실패:', error);
    return [];
  }
}

export const useAIChat = (options: ChatHookOptions) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId] = useState(() => options.sessionId || generateSessionId());

  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * 메시지 전송 (Smart Fallback Engine 통합)
   */
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      const userMessage = createUserMessage(content);
      setMessages(prev => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      // 이전 요청 취소
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      try {
        // 사용자 메시지 콜백
        options.onMessage?.(userMessage);

        // 🧠 LangGraph 사고 과정 시작
        const langGraphProcessor = LangGraphThinkingProcessor.getInstance();
        const thinkingLogger = ThinkingLogger.getInstance();
        const queryId = langGraphProcessor.startThinking(
          sessionId,
          content,
          'advanced'
        );

        // 사고 과정 로깅 시작
        langGraphProcessor.thought(`사용자 질문을 분석합니다: "${content}"`);
        langGraphProcessor.observation(
          'Smart Fallback Engine을 통해 처리를 시작합니다'
        );

        // 🧠 Smart Fallback Engine 사용 (MCP → RAG → Google AI)
        const response = await fetch('/api/ai/smart-fallback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: content,
            context: {
              sessionId,
              serverMetrics: await fetchCurrentServerMetrics(),
              logEntries: await fetchRecentLogEntries(),
              timeRange: {
                start: new Date(Date.now() - 24 * 60 * 60 * 1000),
                end: new Date(),
              },
              userPreferences: {
                language: 'ko',
                responseStyle: 'detailed',
              },
            },
            options: {
              enableMCP: true,
              enableRAG: true,
              enableGoogleAI: true,
              timeout: 15000,
              maxRetries: 1,
            },
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const smartFallbackResponse = await response.json();

        if (!smartFallbackResponse.success) {
          // 사고 과정 에러 로깅
          langGraphProcessor.errorThinking(
            smartFallbackResponse.error || 'AI 응답 처리 실패'
          );
          throw new Error(smartFallbackResponse.error || 'AI 응답 처리 실패');
        }

        // 🧠 사고 과정 완료 로깅
        langGraphProcessor.action(
          `${smartFallbackResponse.metadata.stage} 엔진에서 응답 생성 완료`
        );
        langGraphProcessor.answer(
          `응답이 성공적으로 생성되었습니다 (신뢰도: ${smartFallbackResponse.metadata.confidence}%)`
        );
        langGraphProcessor.completeThinking({
          response: smartFallbackResponse.response,
          engine: smartFallbackResponse.metadata.stage,
          confidence: smartFallbackResponse.metadata.confidence,
        });

        // Smart Fallback 응답을 기존 AIResponse 형식으로 변환
        const aiResponse: AIResponse = {
          success: true,
          content: smartFallbackResponse.response,
          confidence: smartFallbackResponse.metadata.confidence,
          timestamp: smartFallbackResponse.metadata.processedAt,
          metadata: {
            ...smartFallbackResponse.metadata,
            engine: smartFallbackResponse.metadata.stage,
            fallbackPath: smartFallbackResponse.metadata.fallbackPath,
            quota: smartFallbackResponse.metadata.quota,
            thinkingSession: thinkingLogger.getLiveSession(sessionId), // 실시간 사고 과정 데이터 추가
          },
        };

        const aiMessage = formatAIResponse(aiResponse);

        // Smart Fallback 메타데이터 추가
        if (aiMessage.metadata) {
          aiMessage.metadata.engine = smartFallbackResponse.metadata.stage;
          aiMessage.metadata.fallbackPath =
            smartFallbackResponse.metadata.fallbackPath;
          aiMessage.metadata.quota = smartFallbackResponse.metadata.quota;
        }

        setMessages(prev => [...prev, aiMessage]);

        // 할당량 경고 표시
        if (smartFallbackResponse.metadata.quota?.isNearLimit) {
          const warningMessage = createSystemMessage(
            '⚠️ Google AI 일일 할당량이 80%를 초과했습니다. 남은 사용량을 확인해주세요.'
          );
          setMessages(prev => [...prev, warningMessage]);
        }

        // 응답 콜백 (기존 호환성 유지)
        options.onResponse?.(aiResponse);

        console.log('🧠 Smart Fallback 응답:', {
          stage: smartFallbackResponse.metadata.stage,
          confidence: smartFallbackResponse.metadata.confidence,
          responseTime: smartFallbackResponse.metadata.responseTime,
          fallbackPath: smartFallbackResponse.metadata.fallbackPath,
          quota: smartFallbackResponse.metadata.quota,
        });
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return; // 요청이 취소된 경우 무시
        }

        // 🧠 사고 과정 에러 로깅
        const langGraphProcessor = LangGraphThinkingProcessor.getInstance();
        langGraphProcessor.errorThinking(`처리 중 오류 발생: ${err.message}`);

        const errorMessage = formatErrorMessage(err);
        setError(errorMessage);

        // 에러 메시지 추가
        const systemMessage = createSystemMessage(
          `❌ AI 시스템 오류: ${errorMessage}\n\n잠시 후 다시 시도해주세요.`
        );
        setMessages(prev => [...prev, systemMessage]);

        // 에러 콜백
        options.onError?.(err);
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [options, sessionId, isLoading]
  );

  /**
   * 채팅 초기화
   */
  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);

    // 진행 중인 요청 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  /**
   * 메시지 삭제
   */
  const deleteMessage = useCallback((messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  }, []);

  /**
   * 메시지 재전송
   */
  const resendMessage = useCallback(
    (messageId: string) => {
      const message = messages.find(msg => msg.id === messageId);
      if (message && message.type === 'user') {
        // 해당 메시지 이후의 모든 메시지 삭제
        const messageIndex = messages.findIndex(msg => msg.id === messageId);
        setMessages(prev => prev.slice(0, messageIndex));

        // 메시지 재전송
        sendMessage(message.content);
      }
    },
    [messages, sendMessage]
  );

  /**
   * 로딩 상태 토글 (테스트용)
   */
  const toggleLoading = useCallback(() => {
    setIsLoading(prev => !prev);
  }, []);

  /**
   * 🧠 Smart Fallback 상태 조회
   */
  const getSmartFallbackStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/ai/smart-fallback?include=detailed');
      return await response.json();
    } catch (error) {
      console.warn('Smart Fallback 상태 조회 실패:', error);
      return null;
    }
  }, []);

  return {
    // 상태
    messages,
    isLoading,
    error,
    sessionId,

    // 액션
    sendMessage,
    clearChat,
    deleteMessage,
    resendMessage,
    toggleLoading,

    // Smart Fallback 기능
    getSmartFallbackStatus,

    // 유틸리티
    messageCount: messages.length,
    lastMessage: messages[messages.length - 1] || null,
    hasError: !!error,
  };
};
