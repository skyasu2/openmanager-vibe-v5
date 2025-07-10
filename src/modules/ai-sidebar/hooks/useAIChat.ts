/**
 * useAIChat Hook
 *
 * 🤖 AI 채팅 기능을 위한 React 훅
 * 🧠 Smart Fallback Engine 통합 (MCP → RAG → Google AI)
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { ChatMessage, AIResponse, ChatHookOptions } from '../types';
import {
  createUserMessage,
  formatAIResponse,
  createSystemMessage,
  generateSessionId,
  formatErrorMessage,
} from '../utils';
import { ThinkingLogger } from '../../ai-agent/core/ThinkingLogger';
import {
  ThinkingFlow,
  LangGraphThinkingProcessor,
} from '../../ai-agent/core/LangGraphThinkingProcessor';

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
  const [responses, setResponses] = useState<AIResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId] = useState(() => options.sessionId || generateSessionId());
  const [thinkingState, setThinkingState] = useState<ThinkingFlow | null>(null); // 🧠 실시간 사고 과정 상태

  const abortControllerRef = useRef<AbortController | null>(null);
  const unsubscribeThinkingRef = useRef<(() => void) | null>(null); // 🧠 콜백 구독 해제 함수

  // 🔄 localStorage에서 메시지 로드 (초기화 시)
  useEffect(() => {
    if (typeof window !== 'undefined' && sessionId) {
      try {
        const stored = localStorage.getItem(`ai-chat-${sessionId}`);
        if (stored) {
          const parsedMessages = JSON.parse(stored);
          setMessages(parsedMessages);
          console.log(
            '💾 저장된 채팅 히스토리 로드:',
            parsedMessages.length + '개 메시지'
          );
        }
      } catch (error) {
        console.warn('⚠️ 채팅 히스토리 로드 실패:', error);
      }
    }
  }, [sessionId]);

  // 🔄 메시지 변경 시 localStorage에 저장
  useEffect(() => {
    if (typeof window !== 'undefined' && sessionId && messages.length > 0) {
      try {
        localStorage.setItem(`ai-chat-${sessionId}`, JSON.stringify(messages));
        console.log('💾 채팅 히스토리 저장:', messages.length + '개 메시지');
      } catch (error) {
        console.warn('⚠️ 채팅 히스토리 저장 실패:', error);
      }
    }
  }, [messages, sessionId]);

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
      setThinkingState(null); // 이전 상태 초기화

      // 이전 요청 취소
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (unsubscribeThinkingRef.current) {
        unsubscribeThinkingRef.current(); // 이전 콜백 구독 해제
      }

      abortControllerRef.current = new AbortController();

      try {
        // 사용자 메시지 콜백
        options.onMessage?.(userMessage);

        // 🧠 LangGraph 사고 과정 시작 및 실시간 구독
        const langGraphProcessor = LangGraphThinkingProcessor.getInstance();
        const thinkingLogger = ThinkingLogger.getInstance();
        unsubscribeThinkingRef.current = langGraphProcessor.onThinking(
          (flow, step) => {
            setThinkingState({ ...flow });
          }
        );

        const queryId = langGraphProcessor.startThinking(
          sessionId,
          content,
          'advanced'
        );

        langGraphProcessor.thought(`사용자 질문을 분석합니다: "${content}"`);
        langGraphProcessor.observation(
          'Smart Fallback Engine을 통해 처리를 시작합니다'
        );

        // 🧠 통합 AI 쿼리 엔진 사용
        const response = await fetch('/api/ai/unified-query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: content,
            options: {
              serverMetrics: await fetchCurrentServerMetrics(),
              logEntries: await fetchRecentLogEntries(),
              sessionId,
              language: 'ko',
            },
          }),
          signal: abortControllerRef.current.signal,
        });

        // 응답 상태 확인
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ 통합 AI 쿼리 API 오류: ${response.status} ${response.statusText}`, errorText);
          throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
        }

        // JSON 파싱 안전하게 처리
        let unifiedQueryResponse;
        try {
          const responseText = await response.text();
          if (!responseText.trim()) {
            throw new Error('서버에서 빈 응답을 반환했습니다');
          }
          unifiedQueryResponse = JSON.parse(responseText);
        } catch (parseError) {
          console.error('❌ JSON 파싱 오류:', parseError);
          throw new Error('서버 응답을 파싱할 수 없습니다');
        }

        if (!unifiedQueryResponse.success) {
          // 사고 과정 에러 로깅
          langGraphProcessor.errorThinking(
            unifiedQueryResponse.error || 'AI 응답 처리 실패'
          );
          throw new Error(unifiedQueryResponse.error || 'AI 응답 처리 실패');
        }

        // 🧠 사고 과정 완료 로깅
        langGraphProcessor.action(
          `${unifiedQueryResponse.environment || 'unified'} 엔진에서 응답 생성 완료`
        );
        langGraphProcessor.answer(
          `응답이 성공적으로 생성되었습니다`
        );
        langGraphProcessor.completeThinking({
          response: unifiedQueryResponse.response,
          engine: unifiedQueryResponse.environment || 'unified',
          confidence: 0.85,
        });

        // Unified Query 응답을 기존 AIResponse 형식으로 변환
        const aiResponse: AIResponse = {
          success: true,
          content: unifiedQueryResponse.response,
          confidence: 0.85,
          timestamp: unifiedQueryResponse.timestamp,
          metadata: {
            engine: unifiedQueryResponse.environment || 'unified',
            dataSource: unifiedQueryResponse.dataSource,
            serverCount: unifiedQueryResponse.serverCount,
            thinkingSession: thinkingLogger.getLiveSession(sessionId),
          },
        };

        // 🐞 AI 응답 내용 검증 로직 강화
        if (!aiResponse.content || aiResponse.content.trim() === '') {
          console.error('❌ AI 응답이 비어있습니다:', aiResponse);
          const errorMessage = createSystemMessage(
            '❌ AI가 비어있는 응답을 반환했습니다. 잠시 후 다시 시도해주세요.'
          );
          setMessages(prev => {
            const updated = [...prev, errorMessage];
            // localStorage에 즉시 저장
            if (typeof window !== 'undefined') {
              localStorage.setItem(
                `ai-chat-${sessionId}`,
                JSON.stringify(updated)
              );
            }
            return updated;
          });
          // 에러 콜백도 호출
          options.onError?.(new Error('AI returned an empty response.'));
          return; // 빈 응답이므로 여기서 처리 중단
        }

        const aiMessage = formatAIResponse(aiResponse);

        // Unified Query 메타데이터 추가
        if (aiMessage.metadata) {
          aiMessage.metadata.engine = unifiedQueryResponse.environment || 'unified';
          aiMessage.metadata.dataSource = unifiedQueryResponse.dataSource;
          aiMessage.metadata.serverCount = unifiedQueryResponse.serverCount;
        }

        // 🔄 메시지 추가 및 즉시 localStorage 저장
        setMessages(prev => {
          const updated = [...prev, aiMessage];
          // localStorage에 즉시 저장
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(
                `ai-chat-${sessionId}`,
                JSON.stringify(updated)
              );
              console.log(
                '💾 AI 응답 저장 완료:',
                aiMessage.content.slice(0, 50) + '...'
              );
            } catch (error) {
              console.warn('⚠️ AI 응답 저장 실패:', error);
            }
          }
          return updated;
        });

        // 할당량 경고는 포트폴리오 버전에서 제거 (Vercel 무료 티어 최적화)

        // 응답 콜백 (기존 호환성 유지)
        options.onResponse?.(aiResponse);

        console.log('🧠 통합 AI 쿼리 응답:', {
          environment: unifiedQueryResponse.environment,
          dataSource: unifiedQueryResponse.dataSource,
          serverCount: unifiedQueryResponse.serverCount,
          timestamp: unifiedQueryResponse.timestamp,
        });
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return; // 요청이 취소된 경우 무시
        }

        const langGraphProcessor = LangGraphThinkingProcessor.getInstance();
        langGraphProcessor.errorThinking(`처리 중 오류 발생: ${err.message}`);

        const errorMessage = formatErrorMessage(err);
        setError(errorMessage);

        const systemMessage = createSystemMessage(
          `❌ AI 시스템 오류: ${errorMessage}\n\n잠시 후 다시 시도해주세요.`
        );
        setMessages(prev => {
          const updated = [...prev, systemMessage];
          // localStorage에 즉시 저장
          if (typeof window !== 'undefined') {
            localStorage.setItem(
              `ai-chat-${sessionId}`,
              JSON.stringify(updated)
            );
          }
          return updated;
        });

        options.onError?.(err);
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
        if (unsubscribeThinkingRef.current) {
          unsubscribeThinkingRef.current(); // 콜백 구독 해제
          unsubscribeThinkingRef.current = null;
        }
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

    // localStorage에서도 삭제
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`ai-chat-${sessionId}`);
    }

    // 진행 중인 요청 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, [sessionId]);

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

  /**
   * AI 응답 추가
   */
  const addResponse = useCallback((response: Omit<AIResponse, 'timestamp'>) => {
    const newResponse: AIResponse = {
      ...response,
      timestamp: new Date().toISOString(),
    };
    setResponses(prev => [...prev, newResponse]);
  }, []);

  /**
   * 응답 목록 초기화
   */
  const clearResponses = useCallback(() => {
    setResponses([]);
  }, []);

  /**
   * 메시지 추가 (기존 호환성)
   */
  const addMessage = useCallback(
    (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
      const newMessage: ChatMessage = {
        ...message,
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, newMessage]);
    },
    []
  );

  /**
   * 메시지 목록 초기화
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);

    // localStorage에서도 삭제
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`ai-chat-${sessionId}`);
    }
  }, [sessionId]);

  return {
    // 상태
    messages,
    responses,
    isLoading,
    error,
    sessionId,
    thinkingState, // 🧠 실시간 사고 과정 노출

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

    // 추가된 메서드
    addResponse,
    clearResponses,
    addMessage,
    clearMessages,
  };
};
