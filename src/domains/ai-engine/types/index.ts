/**
 * 🧠 AI Engine Domain Types
 *
 * AI 엔진 도메인의 핵심 타입 정의
 * - 비즈니스 로직과 독립적인 순수 타입
 * - 도메인 규칙과 제약사항 포함
 */

// 🔍 시스템 로그 엔트리
export interface SystemLogEntry {
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  source: string;
  message: string;
  metadata?: Record<string, any>;
}

// 💭 AI 사고 과정 단계
export interface ThinkingStep {
  id: string;
  title: string;
  content: string;
  logs: SystemLogEntry[];
  progress: number;
  completed: boolean;
  timestamp: number;
  duration?: number;
}

// 🎯 AI 응답 의도
export interface AIIntent {
  type: string;
  confidence: number;
  entities?: Record<string, any>;
}

// 📝 AI 응답 메타데이터
export interface AIResponseMetadata {
  processingTime?: number;
  engine?: string;
  stage?: string;
  confidence?: number;
  intent?: AIIntent;
}

// 🤖 AI 응답
export interface AIResponse {
  content?: string;
  response?: string;
  intent?: AIIntent;
  confidence?: number;
  metadata?: AIResponseMetadata;
  actions?: any[];
}

// 💬 대화 메시지
export interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: string;
  metadata?: AIResponseMetadata;
  actions?: any[];
}

// 🗣️ 대화 항목
export interface ConversationItem {
  id: string;
  question: string;
  thinkingSteps: ThinkingStep[];
  response: string;
  isComplete: boolean;
  timestamp: number;
  category: string;
  systemLogs: SystemLogEntry[];
}

// 🌊 스트림 이벤트
export interface StreamEvent {
  type: 'thinking' | 'response_start' | 'response_chunk' | 'complete' | 'error';
  step?: string;
  index?: number;
  chunk?: string;
  error?: string;
  logs?: SystemLogEntry[];
}

// 🎛️ 기능 메뉴 아이템
export interface FunctionMenuItem {
  id: string;
  icon: React.ElementType;
  label: string;
  description: string;
  color: string;
  bgGradient: string;
}

// 📊 AI 엔진 상태
export interface AIEngineStatus {
  isHealthy: boolean;
  engines: {
    id: string;
    name: string;
    status: 'active' | 'inactive' | 'error';
    responseTime: number;
  }[];
  lastUpdate: string;
}

// 🔧 AI 설정
export interface AIEngineConfig {
  primaryEngine: string;
  fallbackEngines: string[];
  timeout: number;
  retryAttempts: number;
  enableLogging: boolean;
  logLevel: 'debug' | 'info' | 'warning' | 'error';
}

// 📈 예측 결과
export interface PredictionResult {
  id: string;
  type: 'anomaly' | 'performance' | 'capacity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  description: string;
  recommendation: string;
  timestamp: string;
  affectedSystems: string[];
}

// 🚨 이상 징후
export interface AnomalyDetection {
  id: string;
  metric: string;
  currentValue: number;
  expectedValue: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  description: string;
}

// 📋 보고서 데이터
export interface ReportData {
  id: string;
  title: string;
  type: 'incident' | 'performance' | 'security' | 'maintenance';
  summary: string;
  details: string;
  recommendations: string[];
  timestamp: string;
  status: 'draft' | 'published' | 'archived';
}

// 🔔 알림 설정
export interface NotificationSettings {
  browser: {
    enabled: boolean;
    permission: 'granted' | 'denied' | 'default';
  };
  levels: {
    info: boolean;
    warning: boolean;
    error: boolean;
    critical: boolean;
  };
  filters: {
    sources: string[];
    keywords: string[];
  };
}
