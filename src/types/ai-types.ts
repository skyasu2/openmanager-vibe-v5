/**
 * 🤖 AI 관련 공통 타입 정의 v2.0
 *
 * ✅ 중앙 집중화된 타입 시스템
 * ✅ 모드 타입 통합 관리
 * ✅ 유지보수성 향상
 */

// ==============================================
// 🎯 AI 모드 타입 정의 (통합)
// ==============================================

/**
 * AI 모드 정의 v3.0 (단일 파이프라인)
 * - UNIFIED: Supabase RAG + Google Cloud Functions + Gemini (기본값)
 * - 나머지 값은 하위 호환성만 유지
 */
export type AIMode = 'UNIFIED' | 'LOCAL' | 'GOOGLE_AI' | 'AUTO';

/**
 * AI 엔진 타입 정의
 */
export type AIEngineType =
  | 'google-ai'
  | 'supabase-rag'
  | 'korean-ai'
  | 'mcp-client'
  | 'gcp-mcp'
  | 'transformers'
  | 'mcp-context';

/**
 * AI 어시스턴트 모드 (응답 깊이)
 * - basic: 빠른 응답, 기본 분석
 * - advanced: 심화 분석, 예측 기능
 */
export type AIAssistantMode = 'basic' | 'advanced';

/**
 * 전원 관리 모드
 * - active: 활성 상태
 * - idle: 유휴 상태
 * - sleep: 절전 모드
 */
export type PowerMode = 'active' | 'idle' | 'sleep';

/**
 * 응답 깊이 레벨
 */
export type ResponseDepth = 'mini' | 'standard' | 'deep' | 'comprehensive';

/**
 * 우선순위 레벨
 */
export type Priority = 'low' | 'medium' | 'high' | 'critical';

// ==============================================
// 🔧 AI 요청/응답 인터페이스
// ==============================================

export interface AIRequest {
  query: string;
  type?: string; // 요청 타입 (자연어, 명령어, 분석 등)
  mode?: AIMode;
  agentMode?: AIAssistantMode;
  category?: string;
  context?: unknown;
  priority?: Priority;
  timeout?: number;
  enableFallback?: boolean;
  // 추가 프로퍼티
  engineType?: string;
  sessionId?: string;
  data?: unknown;
}

export interface AIResponse {
  success: boolean;
  response: string;
  data?: unknown;
  confidence: number;
  mode: AIMode;
  agentMode?: AIAssistantMode;
  enginePath: string[];
  processingTime: number;
  fallbacksUsed: number;
  metadata: AIResponseMetadata;
  performance?: PerformanceMetrics;
  error?: string;
  warnings?: string[];
  // 추가 프로퍼티
  engine?: string;
  sources?: string[];
  suggestions?: string[];
}

export interface AIResponseMetadata {
  mainEngine?: string;
  supportEngines?: string[];
  ragUsed?: boolean;
  googleAIUsed?: boolean;
  mcpContextUsed?: boolean;
  subEnginesUsed?: string[];
  cacheUsed?: boolean;
  fallbackReason?: string;
  processingTime?: number;
  enginePath?: string[];
  error?: string;
  allEnginesFailed?: boolean;
  requestId?: string;
  duration?: number;
  timestamp?: string;
  confidence?: number;
  combinedResponses?: number;
  vercelPlan?: string;
  nlpUsed?: boolean;
  mcpUsed?: boolean;
  // ThreeTierAIRouter 관련 프로퍼티
  tier?: 'local' | 'gcp' | 'google';
  fallbackUsed?: boolean;
  threeTierRouter?: boolean;
  totalProcessingTime?: number;
  engine?: string;
  // 추가 프로퍼티들
  architecture?: string;
  gcpProcessingTime?: number;
  vercelProcessingTime?: number;
  tierProcessingTime?: number;
}

export interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  engineSuccessRates: Record<string, number>;
  cacheHitRate?: number;
  memoryUsage?: number;
}

// ==============================================
// 🎛️ 모드 설정 인터페이스
// ==============================================

export interface AIEngineConfig {
  mode: AIMode;
  fallbackTimeout: number;
  confidenceThreshold: number;
  maxRetries: number;
  enableCaching: boolean;
}

export interface AIAssistantConfig {
  responseMode: AIAssistantMode;
  enableMCP: boolean;
  enableInference: boolean;
  maxContextLength: number;
  responseTimeout: number;
  debugMode: boolean;
  enableThinking: boolean;
  enableAdminLogging: boolean;

  // 모드별 세부 설정
  basic: {
    maxContextLength: number;
    responseDepth: ResponseDepth;
    enableAdvancedAnalysis: boolean;
    maxProcessingTime: number;
  };

  advanced: {
    maxContextLength: number;
    responseDepth: ResponseDepth;
    enableAdvancedAnalysis: boolean;
    enablePredictiveAnalysis: boolean;
    enableMultiServerCorrelation: boolean;
    maxProcessingTime: number;
  };

  // 절전 모드 설정
  powerManagement: {
    idleTimeout: number;
    sleepTimeout: number;
    wakeupTriggers: string[];
  };
}

// ==============================================
// 🔍 분석 및 감지 관련 타입
// ==============================================

export interface QueryAnalysis {
  intent: string;
  complexity: 'simple' | 'moderate' | 'complex';
  category: 'monitoring' | 'troubleshooting' | 'analysis' | 'reporting';
  urgency: Priority;
  requiresAdvancedMode: boolean;
  estimatedProcessingTime: number;
  keywords: string[];
}

export interface IncidentAnalysis {
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  affectedSystems: string[];
  rootCause?: string;
  recommendations: string[];
  confidence: number;
}

// ==============================================
// 📊 활동 및 성능 메트릭
// ==============================================

export interface ActivityMetrics {
  lastQueryTime: number;
  lastDataUpdate: number;
  lastAlertTime: number;
  queryCount: number;
  dataUpdateCount: number;
  alertCount: number;
  powerMode: PowerMode;
  responseMode: AIAssistantMode;
}

export interface AIEngineStats {
  totalQueries: number;
  modeUsage: Record<AIMode, number>;
  averageResponseTime: number;
  successRate: number;
  enginePerformance: Record<
    string,
    {
      queries: number;
      successRate: number;
      averageTime: number;
    }
  >;
}

// ==============================================
// 🚨 장애 및 보고서 관련 타입
// ==============================================

export interface Incident {
  id: string;
  type: string;
  severity: Priority;
  description: string;
  affectedServer: string;
  detectedAt: Date;
  status: 'active' | 'investigating' | 'resolved';
  timeline?: Array<{
    timestamp: Date;
    event: string;
    details?: string;
  }>;
  solutions?: string[];
  impact?: {
    users: number;
    services: string[];
    estimatedDowntime: number;
  };
  rootCause?: string;
  preventiveActions?: string[];
}

export interface IncidentReport {
  incident: Incident;
  analysis: IncidentAnalysis;
  recommendations: string[];
  generatedAt: Date;
  confidence: number;
  aiMode: AIMode;
}

// ==============================================
// 🔄 유틸리티 타입
// ==============================================

/**
 * 부분적 설정 업데이트를 위한 타입
 */
export type PartialAIConfig<T> = {
  [P in keyof T]?: T[P] extends object ? PartialAIConfig<T[P]> : T[P];
};

/**
 * 모드 전환 이벤트
 */
export interface ModeChangeEvent {
  from: AIMode | AIAssistantMode | PowerMode;
  to: AIMode | AIAssistantMode | PowerMode;
  timestamp: number;
  reason?: string;
}

/**
 * AI 엔진 결과
 */
export interface AIEngineResult {
  success: boolean;
  mode: AIMode;
  response: string;
  confidence: number;
  sources: string[];
  suggestions: string[];
  processingTime: number;
  fallbackUsed: boolean;
  engineDetails: unknown;
}
