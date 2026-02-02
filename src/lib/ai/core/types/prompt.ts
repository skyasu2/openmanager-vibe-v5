/**
 * Prompt Types
 *
 * AI 프롬프트 및 템플릿 타입
 */

import type { AIScenario, ContextPriority } from './enums';
import type { ProviderContexts } from './provider';
import type { UnifiedQueryOptions } from './request';

/**
 * AI 프롬프트 (Cloud Run AI Engine)
 * @since v5.84.0 - Renamed from GoogleAIPrompt
 */
export interface AIPrompt {
  /** 시스템 instruction */
  systemInstruction: string;

  /** 사용자 메시지 */
  userMessage: string;

  /** 예상 토큰 수 */
  estimatedTokens: number;
}

/**
 * 프롬프트 템플릿
 */
export interface PromptTemplate {
  /** 시나리오 */
  scenario: AIScenario;

  /** 시스템 instruction 템플릿 */
  systemTemplate: string;

  /** 사용자 메시지 템플릿 */
  userTemplate: string;

  /** 컨텍스트 우선순위 */
  priority: ContextPriority[];

  /** 최대 토큰 제한 */
  maxTokens?: number;
}

/**
 * 프롬프트 파라미터
 */
export interface PromptParams {
  /** 사용자 쿼리 */
  query: string;

  /** Provider 컨텍스트 */
  contexts: ProviderContexts;

  /** 옵션 */
  options?: UnifiedQueryOptions;
}
