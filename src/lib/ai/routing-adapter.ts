/**
 * Routing Adapter v1.0 - SmartRoutingEngine ↔ Legacy 변환
 *
 * SmartRoutingEngine의 RoutingDecision을 레거시 ModelSelection 형식으로 변환
 * 점진적 마이그레이션을 위한 어댑터 레이어
 *
 * @see SmartRoutingEngine - 라우팅 결정
 * @see model-factory.ts - SDK 인스턴스 생성
 */

import type {
  AIModel,
  EnhancedRoutingDecision,
  RoutingDecision,
  RoutingLevel,
} from '@/types/ai/routing-types';
import { getModelInstance, type ModelInstance } from './model-factory';

// ============================================================================
// 레거시 타입 정의 (route.ts에서 사용)
// ============================================================================

/**
 * 레거시 ModelSelection 인터페이스
 * route.ts의 selectModels()가 반환하는 형식
 */
export interface LegacyModelSelection {
  primary: ModelInstance;
  fallback: ModelInstance | null;
  primaryName: string;
  fallbackName: string | null;
  level: 1 | 2 | 3 | 4 | 5 | 'thinking' | 'multimodal';
  useTools: boolean;
  maxTokens: number;
  temperature: number;
}

/**
 * 확장된 ModelSelection (SmartRoutingEngine 메타데이터 포함)
 */
export interface ExtendedModelSelection extends LegacyModelSelection {
  /** 라우팅 메타데이터 */
  routingMeta?: {
    /** 선택 근거 */
    reasoning: string[];
    /** 예상 응답 시간 (ms) */
    expectedLatencyMs: number;
    /** 품질 점수 (1-10) */
    qualityScore: number;
    /** 폴백 체인 (우선순위 순) */
    fallbackChain?: AIModel[];
    /** 선택 방법 */
    selectionMethod?: string;
  };
}

// ============================================================================
// Level 변환
// ============================================================================

/**
 * RoutingLevel을 레거시 level로 변환
 */
function convertLevel(
  level: RoutingLevel
): 1 | 2 | 3 | 4 | 5 | 'thinking' | 'multimodal' {
  if (level === 'fast') {
    return 1;
  }
  return level;
}

// ============================================================================
// Core Adapter Functions
// ============================================================================

/**
 * RoutingDecision을 LegacyModelSelection으로 변환
 * @param decision - SmartRoutingEngine의 라우팅 결정
 * @returns 레거시 ModelSelection 형식
 */
export function convertToLegacySelection(
  decision: RoutingDecision
): LegacyModelSelection {
  return {
    primary: getModelInstance(decision.primaryModel),
    fallback: decision.fallbackModel
      ? getModelInstance(decision.fallbackModel)
      : null,
    primaryName: decision.primaryModel,
    fallbackName: decision.fallbackModel,
    level: convertLevel(decision.level),
    useTools: decision.features.useTools,
    maxTokens: decision.tokens.maxOutputTokens,
    temperature: decision.tokens.temperature,
  };
}

/**
 * EnhancedRoutingDecision을 ExtendedModelSelection으로 변환
 * 추가 메타데이터 포함
 * @param decision - SmartRoutingEngine의 향상된 라우팅 결정
 * @returns 확장된 ModelSelection (메타데이터 포함)
 */
export function convertToExtendedSelection(
  decision: EnhancedRoutingDecision
): ExtendedModelSelection {
  const base = convertToLegacySelection(decision);

  return {
    ...base,
    routingMeta: {
      reasoning: decision.reasoning,
      expectedLatencyMs: decision.expectedPerformance.latencyMs,
      qualityScore: decision.expectedPerformance.qualityScore,
      fallbackChain: decision.fallbackChain,
      selectionMethod: decision.selectionMethod,
    },
  };
}

// ============================================================================
// Feature Flag Helper
// ============================================================================

/**
 * 스마트 라우팅 사용 여부 확인
 * 환경변수로 제어 가능
 */
export function isSmartRoutingEnabled(): boolean {
  // 환경변수로 비활성화 가능 (롤백용)
  if (process.env.DISABLE_SMART_ROUTING === 'true') {
    return false;
  }
  return true;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * 모델 가용성 기반 폴백 선택
 * @param fallbackChain - 폴백 모델 체인
 * @param unavailableModels - 사용 불가 모델 집합
 * @returns 사용 가능한 첫 번째 모델 또는 null
 */
export function selectAvailableFallback(
  fallbackChain: AIModel[],
  unavailableModels: Set<AIModel>
): AIModel | null {
  for (const model of fallbackChain) {
    if (!unavailableModels.has(model)) {
      return model;
    }
  }
  return null;
}

/**
 * 레거시 complexity를 RoutingLevel로 변환
 * (역방향 호환성)
 */
export function complexityToRoutingLevel(
  complexity: number,
  hasImages: boolean = false,
  thinking: boolean = false
): RoutingLevel {
  if (hasImages) return 'multimodal';
  if (thinking) return 'thinking';

  // 복잡도 범위 제한 (1-5)
  const clampedComplexity = Math.min(5, Math.max(1, complexity)) as
    | 1
    | 2
    | 3
    | 4
    | 5;
  return clampedComplexity;
}
