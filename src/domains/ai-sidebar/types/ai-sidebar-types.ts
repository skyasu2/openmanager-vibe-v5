/**
 * AI Sidebar 타입 정의
 * 모든 AI 사이드바 관련 타입 통합 관리
 */

import type { AIMode } from '@/types/ai-types';

/**
 * 사고 과정 단계
 */
export interface ThinkingStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'processing' | 'completed';
  duration?: number;
}

/**
 * 프리셋 질문
 */
export interface PresetQuestion {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  text: string;
  category: 'monitoring' | 'performance' | 'security' | 'troubleshooting';
  priority?: 'high' | 'medium' | 'low';
}

/**
 * AI 쿼리 응답
 */
export interface AIResponse {
  content: string;
  engine: string;
  processingTime: number;
  confidence?: number;
  metadata?: {
    sources?: string[];
    suggestions?: string[];
    relatedQuestions?: string[];
  };
}

/**
 * 세션 정보
 */
export interface SessionInfo {
  id: string;
  userId?: string;
  startTime: Date;
  lastActivity: Date;
  messageCount: number;
  engines: string[];
}

/**
 * AI 사이드바 상태
 */
export interface AISidebarState {
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  selectedEngine: AIMode;
  sessionId: string;
  messages: ChatMessage[];
}

/**
 * 채팅 메시지
 */
export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
  engine?: string;
  metadata?: {
    processingTime?: number;
    confidence?: number;
    error?: string;
  };
}

/**
 * 자동 보고서 트리거
 */
export interface AutoReportTrigger {
  type: 'critical' | 'performance' | 'security';
  message: string;
  data?: Record<string, any>;
}

/**
 * AI 엔진 정보
 */
export interface AIEngineInfo {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  features: string[];
  status: 'ready' | 'loading' | 'error' | 'unavailable';
  usage?: {
    used: number;
    limit: number;
  };
}

/**
 * AI 사이드바 Props
 */
export interface AISidebarProps {
  className?: string;
  defaultEngine?: AIMode;
  sessionId?: string;
  onClose?: () => void;
  onEngineChange?: (engine: AIMode) => void;
  onMessageSend?: (message: string) => void;
}

/**
 * AI 사이드바 핸들러
 */
export interface AISidebarHandlers {
  handleSendMessage: (message: string) => Promise<void>;
  handlePresetQuestion: (question: PresetQuestion) => Promise<void>;
  handleEngineChange: (engine: AIMode) => Promise<void>;
  handleClearChat: () => void;
  handleExportChat: () => void;
}

/**
 * AI 사이드바 상태 훅 반환값
 */
export interface UseAISidebarReturn {
  state: AISidebarState;
  handlers: AISidebarHandlers;
  refs: {
    messagesEndRef: React.RefObject<HTMLDivElement>;
    inputRef: React.RefObject<HTMLTextAreaElement>;
  };
}