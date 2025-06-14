/**
 * 🤖 Unified AI Engine 타입 정의
 *
 * ⚠️ 중요: 이 파일은 UnifiedAIEngine 핵심 모듈입니다 - 삭제 금지!
 *
 * SOLID 원칙에 따른 타입 분리
 * - Single Responsibility: AI 엔진 타입 정의만 담당
 * - Open/Closed: 확장 가능한 인터페이스 구조
 *
 * 📍 사용처:
 * - src/core/ai/UnifiedAIEngine.ts (메인 엔진)
 * - src/core/ai/components/ (분리된 컴포넌트들)
 * - src/core/ai/services/ (분리된 서비스들)
 *
 * 🔄 의존성:
 * - ../../types/ai-thinking (사고과정 타입)
 *
 * 📅 생성일: 2025.06.14 (UnifiedAIEngine 1102줄 분리 작업)
 */

import { AIThinkingStep } from '../../../types/ai-thinking';

// 🎯 분석 요청 인터페이스
export interface UnifiedAnalysisRequest {
  query: string;
  context?: {
    serverMetrics?: ServerMetrics[];
    logEntries?: LogEntry[];
    timeRange?: { start: Date; end: Date };
    sessionId?: string;
    urgency?: 'low' | 'medium' | 'high' | 'critical';
  };
  options?: {
    enableMCP?: boolean;
    enableAnalysis?: boolean;
    maxResponseTime?: number;
    confidenceThreshold?: number;
    // MasterAIEngine 옵션 통합
    prefer_mcp?: boolean;
    fallback_enabled?: boolean;
    use_cache?: boolean;
    enable_thinking_log?: boolean;
    steps?: number;
    fuzzyThreshold?: number;
    exactWeight?: number;
    fields?: string[];
  };
}

// 🎯 분석 응답 인터페이스
export interface UnifiedAnalysisResponse {
  success: boolean;
  query: string;
  intent: {
    primary: string;
    confidence: number;
    category: string;
    urgency: string;
  };
  analysis: {
    summary: string;
    details: any[];
    confidence: number;
    processingTime: number;
  };
  recommendations: string[];
  engines: {
    used: string[];
    results: any[];
    fallbacks: number;
  };
  metadata: {
    sessionId: string;
    timestamp: string;
    version: string;
    contextsUsed?: number;
    contextIds?: string[];
  };
  systemStatus?: {
    tier: 'emergency' | 'core_only' | 'enhanced' | 'beta_enabled';
    availableComponents: string[];
    degradationLevel: 'none' | 'minimal' | 'moderate' | 'high' | 'critical';
    recommendation: string;
  };
  // MasterAIEngine 응답 형식 통합
  thinking_process?: AIThinkingStep[];
  reasoning_steps?: string[];
  performance?: {
    memoryUsage?: any;
    cacheHit?: boolean;
    memoryDelta?: number;
  };
  cache_hit?: boolean;
  fallback_used?: boolean;
  engine_used?: string;
  response_time?: number;
}

// 🎯 서버 메트릭 인터페이스
export interface ServerMetrics {
  timestamp: string;
  cpu: number;
  memory: number;
  disk: number;
  networkIn: number;
  networkOut: number;
  responseTime?: number;
  activeConnections?: number;
}

// 🎯 로그 엔트리 인터페이스
export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
  source: string;
  details?: any;
}

// 🎯 MCP 컨텍스트 인터페이스
export interface MCPContext {
  sessionId: string;
  serverMetrics?: ServerMetrics[];
  logEntries?: LogEntry[];
  timeRange?: { start: Date; end: Date };
  urgency?: string;
}

// 🎯 MCP 응답 인터페이스
export interface MCPResponse {
  success: boolean;
  content: string;
  confidence: number;
  sources: string[];
  metadata?: any;
}

// 🎯 엔진 상태 인터페이스
export interface EngineStatus {
  name: string;
  status: 'ready' | 'loading' | 'error' | 'disabled';
  last_used: number;
  success_rate: number;
  avg_response_time: number;
  memory_usage: string;
}

// 🎯 엔진 통계 인터페이스
export interface EngineStats {
  calls: number;
  successes: number;
  totalTime: number;
  lastUsed: number;
}

// 🎯 캐시 엔트리 인터페이스
export interface CacheEntry {
  result: any;
  timestamp: number;
  ttl: number;
}

// 🎯 리소스 관리자 인터페이스
export interface ResourceManager {
  dailyQuota: {
    googleAIUsed: number;
    googleAILimit: number;
  };
  quotaResetTime: Date;
}

// 🎯 성능 저하 통계 인터페이스
export interface DegradationStats {
  totalRequests: number;
  averageResponseTime: number;
  fallbacksUsed: number;
  emergencyModeActivations: number;
}

// 🎯 컴포넌트 상태 체크 결과
export interface ComponentHealthCheck {
  availableComponents: string[];
  overallHealth: 'healthy' | 'degraded' | 'critical' | 'emergency';
}

// 🎯 처리 전략 인터페이스
export interface ProcessingStrategy {
  tier: string;
  usageReason?: string;
}

// 🎯 시스템 상태 인터페이스
export interface SystemStatus {
  tier: 'emergency' | 'core_only' | 'enhanced' | 'beta_enabled';
  availableComponents: string[];
  degradationLevel: 'none' | 'minimal' | 'moderate' | 'high' | 'critical';
  recommendation: string;
  stats: DegradationStats;
  componentHealth: Record<string, boolean>;
}
