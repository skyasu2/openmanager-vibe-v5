/**
 * AI Sidebar Utils
 * 
 * 🔧 AI 사이드바 모듈의 유틸리티 함수들
 */

import { AISidebarConfig, ChatMessage, AIResponse, SidebarTheme } from '../types';
import { createSafeError } from '../../../lib/error-handler';

/**
 * 기본 사이드바 설정 반환
 */
export const getDefaultSidebarConfig = (): AISidebarConfig => ({
  // API 설정
  apiEndpoint: '/api/ai-agent',
  
  // UI 설정
  theme: 'auto',
  position: 'right',
  width: 500,
  height: '100vh',
  
  // 기능 설정
  enableVoice: false,
  enableFileUpload: false,
  enableHistory: true,
  maxHistoryLength: 50,
  
  // 커스터마이징
  title: 'AI Assistant',
  placeholder: '메시지를 입력하세요...',
  welcomeMessage: '안녕하세요! 무엇을 도와드릴까요?'
});

/**
 * AI 사이드바 인스턴스 생성
 */
export const createAISidebarInstance = (config: Partial<AISidebarConfig> = {}) => {
  const defaultConfig = getDefaultSidebarConfig();
  const mergedConfig = { ...defaultConfig, ...config };
  
  return {
    config: mergedConfig,
    version: '1.0.0',
    isValid: validateSidebarConfig(mergedConfig)
  };
};

/**
 * 사이드바 설정 유효성 검사
 */
export const validateSidebarConfig = (config: AISidebarConfig): boolean => {
  // API 엔드포인트 필수
  if (!config.apiEndpoint || typeof config.apiEndpoint !== 'string') {
    console.error('AI Sidebar: apiEndpoint is required');
    return false;
  }
  
  // 너비 유효성 검사
  if (config.width < 300 || config.width > 800) {
    console.warn('AI Sidebar: width should be between 300-800px');
  }
  
  // 테마 유효성 검사
  if (!['light', 'dark', 'auto'].includes(config.theme)) {
    console.error('AI Sidebar: invalid theme');
    return false;
  }
  
  return true;
};

/**
 * AI 응답 포맷팅
 */
export const formatAIResponse = (response: AIResponse): ChatMessage => {
  return {
    id: generateMessageId(),
    type: 'ai',
    content: response.response,
    timestamp: new Date().toISOString(),
    metadata: {
      intent: response.intent,
      processingTime: response.metadata.processingTime,
      confidence: response.intent.confidence
    },
    actions: response.actions
  };
};

/**
 * 사용자 메시지 생성
 */
export const createUserMessage = (content: string): ChatMessage => {
  return {
    id: generateMessageId(),
    type: 'user',
    content,
    timestamp: new Date().toISOString()
  };
};

/**
 * 시스템 메시지 생성
 */
export const createSystemMessage = (content: string): ChatMessage => {
  return {
    id: generateMessageId(),
    type: 'system',
    content,
    timestamp: new Date().toISOString()
  };
};

/**
 * 메시지 ID 생성
 */
export const generateMessageId = (): string => {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * 세션 ID 생성
 */
export const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * 테마 감지
 */
export const detectTheme = (): SidebarTheme => {
  if (typeof window === 'undefined') return 'light';
  
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
};

/**
 * 로컬 스토리지에서 채팅 히스토리 로드
 */
export const loadChatHistory = (sessionId: string): ChatMessage[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(`ai-sidebar-history-${sessionId}`);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load chat history:', error);
    return [];
  }
};

/**
 * 로컬 스토리지에 채팅 히스토리 저장
 */
export const saveChatHistory = (sessionId: string, messages: ChatMessage[]): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(`ai-sidebar-history-${sessionId}`, JSON.stringify(messages));
  } catch (error) {
    console.error('Failed to save chat history:', error);
  }
};

/**
 * 메시지 내용 정리 (HTML 태그 제거 등)
 */
export const sanitizeMessage = (content: string): string => {
  // 기본적인 HTML 태그 제거
  return content.replace(/<[^>]*>/g, '').trim();
};

/**
 * 응답 시간 포맷팅
 */
export const formatProcessingTime = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
};

/**
 * 신뢰도 레벨 계산
 */
export const getConfidenceLevel = (confidence: number): 'low' | 'medium' | 'high' => {
  if (confidence < 0.5) return 'low';
  if (confidence < 0.8) return 'medium';
  return 'high';
};

/**
 * 에러 메시지 포맷팅 (안전한 버전)
 */
export const formatErrorMessage = (error: Error | string | unknown): string => {
  if (typeof error === 'string') return error;
  
  const safeError = createSafeError(error);
  return safeError.message || '알 수 없는 오류가 발생했습니다.';
}; 