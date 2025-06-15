/**
 * 🤖 AI 응답 컴포넌트 타입 정의
 * 
 * Single Responsibility: 모든 AI 응답 관련 인터페이스와 타입을 통합 관리
 */

import { RealTimeLogEntry } from '../../../ai-agent/core/RealTimeLogEngine';

export interface QAItem {
  id: string;
  question: string;
  answer: string;
  isProcessing: boolean;
  thinkingLogs: RealTimeLogEntry[];
  timestamp: number;
  sessionId: string;
  category: 'monitoring' | 'analysis' | 'prediction' | 'incident' | 'general';
}

export interface IntegratedAIResponseProps {
  question: string;
  isProcessing: boolean;
  onComplete: () => void;
  className?: string;
}

export interface AIResponseTemplate {
  intro: string;
  analysis: string;
  conclusion: string;
  recommendations?: string[];
}

export interface AIFunctionResponse {
  success: boolean;
  data?: any;
  answer: string;
  error?: string;
}

export interface NavigationState {
  currentIndex: number;
  canGoPrev: boolean;
  canGoNext: boolean;
}

export interface TypingState {
  text: string;
  isTyping: boolean;
}

export interface LogViewerProps {
  logs: RealTimeLogEntry[];
  isExpanded: boolean;
  onToggle: () => void;
  onVerifyLog: (log: RealTimeLogEntry) => Promise<void>;
}

export interface NavigationControlsProps {
  navigation: NavigationState;
  isTyping: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export interface QuestionDisplayProps {
  question: string;
}

export interface AnswerDisplayProps {
  answer: string;
  isProcessing: boolean;
  typingText: string;
}

export type AICategory = 'monitoring' | 'analysis' | 'prediction' | 'incident' | 'general';

export type LogLevel = 'INFO' | 'DEBUG' | 'PROCESSING' | 'SUCCESS' | 'ANALYSIS' | 'WARNING' | 'ERROR';

export interface CategoryKeywords {
  monitoring: string[];
  analysis: string[];
  prediction: string[];
  incident: string[];
}

export interface AIResponseHookReturn {
  qaItems: QAItem[];
  currentIndex: number;
  currentItem: QAItem | undefined;
  navigation: NavigationState;
  typing: TypingState;
  isThinkingExpanded: boolean;
  setIsThinkingExpanded: (expanded: boolean) => void;
  goToPrev: () => void;
  goToNext: () => void;
  handleVerifyLog: (log: RealTimeLogEntry) => Promise<void>;
} 