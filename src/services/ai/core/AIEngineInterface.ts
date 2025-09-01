﻿/**
 * 🤖 AI 엔진 핵심 인터페이스 - 개선된 버전
 *
 * 중앙 집중식 타입 시스템으로 마이그레이션:
 * - 중복 타입 정의 제거
 * - core-types.ts에서 타입 import
 */

// 중앙 집중식 타입에서 import
import type {
  AIEngineType,
  ComplexityScore,
  AIMetadata,
} from '@/types/core-types';

// Re-export for external use
export type { ComplexityScore };

// 기존 ComplexityScore와 호환성을 위한 확장 (임시)
export interface LegacyComplexityScore extends ComplexityScore {
  score: number;
  factors: string[];
  category: 'simple' | 'moderate' | 'complex';
}

// AI 응답 기본 인터페이스
export interface AIResponse<T = unknown> {
  response: string;
  metadata: AIMetadata & {
    complexity?: ComplexityScore;
    cacheHit?: boolean;
  };
  data?: T;
  source: AIEngineType;
  cached?: boolean;
  processingTime?: number;
  error?: Error | null;
}

// AI 쿼리 옵션
export interface AIQueryOptions {
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
  useCache?: boolean;
  cacheTTL?: number;
  forceEngine?: AIEngineType;

  // 성능 관련 옵션들
  priorityLevel?: 'low' | 'medium' | 'high';
  requiresRealtime?: boolean;
  allowFallback?: boolean;
  targetResponseTime?: number;
}

// AI 엔진 상태 인터페이스
export interface AIEngineStatus {
  name: string;
  type: AIEngineType;
  available: boolean;
  responseTime: number;
  successRate: number;
  lastError?: string;
  capabilities: string[];
  metadata?: AIMetadata;
}

// 성능 메트릭 인터페이스
export interface AIPerformanceMetrics {
  engineType: AIEngineType;
  totalRequests: number;
  avgResponseTime: number;
  successRate: number;
  cacheHitRate: number;
  complexity: ComplexityScore;
  timestamp: Date;
}

// AI 엔진 인터페이스 (공통 계약)
export interface IAIEngine {
  name: string;
  type: AIEngineType;

  // 핵심 메서드
  query(prompt: string, options?: AIQueryOptions): Promise<AIResponse>;
  getStatus(): Promise<AIEngineStatus>;
  calculateComplexity(query: string): ComplexityScore;

  // 성능 메서드
  warmup?(): Promise<void>;
  cleanup?(): Promise<void>;
}
