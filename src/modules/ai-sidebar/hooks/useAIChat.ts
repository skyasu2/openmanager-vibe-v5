/**
 * useAIChat Hook
 * 
 * 🤖 AI 채팅 기능을 위한 React 훅
 */

import { useState, useCallback, useRef } from 'react';
import { ChatMessage, AIResponse, ChatHookOptions } from '../types';
import { 
  createUserMessage, 
  formatAIResponse, 
  createSystemMessage,
  generateSessionId,
  formatErrorMessage
} from '../utils';

export const useAIChat = (options: ChatHookOptions) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId] = useState(() => options.sessionId || generateSessionId());
  
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * 메시지 전송
   */
  const sendMessage = useCallback(async (content: string) => {
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

      const response = await fetch(options.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: content,
          sessionId,
          context: {},
          serverData: null
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const aiResponse: AIResponse = await response.json();
      
      if (!aiResponse.success) {
        throw new Error(aiResponse.error || 'AI 응답 처리 실패');
      }

      const aiMessage = formatAIResponse(aiResponse);
      setMessages(prev => [...prev, aiMessage]);

      // 응답 콜백
      options.onResponse?.(aiResponse);

    } catch (err: any) {
      if (err.name === 'AbortError') {
        return; // 요청이 취소된 경우 무시
      }

      const errorMessage = formatErrorMessage(err);
      setError(errorMessage);
      
      // 에러 메시지 추가
      const systemMessage = createSystemMessage(
        `오류가 발생했습니다: ${errorMessage}`
      );
      setMessages(prev => [...prev, systemMessage]);

      // 에러 콜백
      options.onError?.(err);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [options, sessionId, isLoading]);

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
  const resendMessage = useCallback((messageId: string) => {
    const message = messages.find(msg => msg.id === messageId);
    if (message && message.type === 'user') {
      // 해당 메시지 이후의 모든 메시지 삭제
      const messageIndex = messages.findIndex(msg => msg.id === messageId);
      setMessages(prev => prev.slice(0, messageIndex));
      
      // 메시지 재전송
      sendMessage(message.content);
    }
  }, [messages, sendMessage]);

  /**
   * 로딩 상태 토글 (테스트용)
   */
  const toggleLoading = useCallback(() => {
    setIsLoading(prev => !prev);
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
    
    // 유틸리티
    messageCount: messages.length,
    lastMessage: messages[messages.length - 1] || null,
    hasError: !!error
  };
}; 