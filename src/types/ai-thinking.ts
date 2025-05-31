/**
 * AI Thinking Process & Six W Principle Types
 * 
 * 🧠 AI 사고 과정 시각화 및 육하원칙 기반 응답 시스템을 위한 타입 정의
 */

export interface AIThinkingStep {
  id: string;
  timestamp: string;
  type: 'analyzing' | 'processing' | 'reasoning' | 'generating' | 'completed' | 'error';
  title: string;
  description: string;
  progress: number; // 0-100
  duration?: number; // 밀리초
  metadata?: Record<string, any>;
  subSteps?: string[]; // 세부 단계 로그
  icon?: string; // 아이콘 이름
}

export interface SixWPrincipleResponse {
  who: string;    // 누가 (담당자/시스템)
  what: string;   // 무엇을 (작업 내용)
  when: string;   // 언제 (시점/기간)
  where: string;  // 어디서 (위치/환경)
  why: string;    // 왜 (이유/목적)
  how: string;    // 어떻게 (방법/과정)
  confidence: number; // 신뢰도 0-1
  sources?: string[]; // 데이터 출처
}

export interface AIManagerSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentMode: 'monitoring' | 'ai-admin';
  thinkingSteps: AIThinkingStep[];
  isProcessing: boolean;
  currentResponse?: SixWPrincipleResponse;
}

export interface ThinkingProcessState {
  steps: AIThinkingStep[];
  currentStepIndex: number;
  isActive: boolean;
  totalDuration: number;
  startTime?: Date;
  endTime?: Date;
}

export interface AIResponseFormat {
  raw: string;
  formatted: SixWPrincipleResponse;
  thinkingProcess: AIThinkingStep[];
  metadata: {
    processingTime: number;
    confidence: number;
    sources: string[];
    timestamp: string;
  };
}

export interface ErrorState {
  hasError: boolean;
  errorType: 'network' | 'parsing' | 'timeout' | 'validation' | 'processing' | 'unknown';
  message: string;
  timestamp: string;
  retryCount: number;
  maxRetries: number;
}

export interface ThinkingProcessConfig {
  maxSteps: number;
  stepTimeout: number; // 밀리초
  animationDuration: number;
  enableSubSteps: boolean;
  enableProgress: boolean;
  enableMetadata: boolean;
} 