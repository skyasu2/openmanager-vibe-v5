/**
 * AI Sidebar Types
 *
 * �� AI 사이드바 모듈의 타입 정의
 * 🧠 Smart Fallback Engine 호환성 추가
 */

export interface AISidebarConfig {
  // API 설정
  apiEndpoint: string;
  apiKey?: string;

  // UI 설정
  theme: SidebarTheme;
  position: 'left' | 'right';
  width: number;
  height: string;

  // 기능 설정
  enableVoice: boolean;
  enableFileUpload: boolean;
  enableHistory: boolean;
  maxHistoryLength: number;

  // 커스터마이징
  title: string;
  placeholder: string;
  welcomeMessage?: string;
  customActions?: ActionButton[];

  // 이벤트 핸들러
  onMessage?: (message: ChatMessage) => void;
  onResponse?: (response: AIResponse) => void;
  onError?: (error: Error) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

export type SidebarTheme = 'light' | 'dark' | 'auto';

export interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: string | Date;
  metadata?: Record<string, any>;
  actions?: string[];
  isLoading?: boolean;

  // AI 사이드바 V2 확장 속성들
  thinking?: Array<{
    id: string;
    step: string;
    title: string;
    content: string;
    description: string;
    duration: number;
    confidence?: number;
  }>;
  files?: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    url?: string;
  }>;
  engine?: string;
  confidence?: number;
}

export interface AIResponse {
  success: boolean;
  response?: string;
  content?: string; // Smart Fallback 호환성
  intent?: {
    name: string;
    confidence: number;
    entities: Record<string, any>;
  };
  actions?: string[];
  context?: Record<string, any>;
  metadata?: {
    processingTime?: number;
    timestamp?: string;
    engineVersion?: string;
    sessionId?: string;
    confidence?: number;
    stage?: string;
    fallbackPath?: string[];
    quota?: any;
    engine?: string;
    responseTime?: number;
    [key: string]: any;
  };
  confidence?: number;
  timestamp?: string;
  error?: string;
}

export interface ActionButton {
  id: string;
  label: string;
  icon?: string;
  action: () => void | Promise<void>;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export interface SidebarState {
  isOpen: boolean;
  isLoading: boolean;
  currentSession: ChatSession | null;
  sessions: ChatSession[];
  error: string | null;
}

export interface ChatHookOptions {
  apiEndpoint: string;
  sessionId?: string;
  onMessage?: (message: ChatMessage) => void;
  onResponse?: (response: AIResponse) => void;
  onError?: (error: Error) => void;
}

export interface SidebarHookOptions {
  defaultOpen?: boolean;
  position?: 'left' | 'right';
  width?: number;
  onOpen?: () => void;
  onClose?: () => void;
}
