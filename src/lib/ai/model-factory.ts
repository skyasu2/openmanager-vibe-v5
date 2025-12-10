/**
 * Model Factory v1.0 - AI 모델 인스턴스 생성
 *
 * SmartRoutingEngine의 모델 이름(string)을 Vercel AI SDK 인스턴스로 변환
 * @see SmartRoutingEngine - 라우팅 결정
 * @see routing-adapter.ts - 레거시 형식 변환
 */

import { google } from '@ai-sdk/google';
import { groq } from '@ai-sdk/groq';
import type { AIModel, GoogleModel } from '@/types/ai/routing-types';
import type { GroqModel } from './groq-ai-manager';

// ============================================================================
// 타입 정의
// ============================================================================

/**
 * Vercel AI SDK 모델 인스턴스 타입
 */
export type GoogleModelInstance = ReturnType<typeof google>;
export type GroqModelInstance = ReturnType<typeof groq>;
export type ModelInstance = GoogleModelInstance | GroqModelInstance;

/**
 * Provider 타입
 */
export type ModelProvider = 'google' | 'groq';

/**
 * Groq 모델 목록 (타입 가드용)
 */
const GROQ_MODELS: readonly GroqModel[] = [
  'llama-3.1-8b-instant',
  'llama-3.3-70b-versatile',
  'qwen-qwq-32b',
] as const;

/**
 * Google 모델 목록 (타입 가드용)
 */
const GOOGLE_MODELS: readonly GoogleModel[] = [
  'gemini-2.5-flash',
  'gemini-2.5-pro',
] as const;

// ============================================================================
// 타입 가드
// ============================================================================

/**
 * Groq 모델인지 확인
 */
export function isGroqModel(model: AIModel): model is GroqModel {
  return GROQ_MODELS.includes(model as GroqModel);
}

/**
 * Google 모델인지 확인
 */
export function isGoogleModel(model: AIModel): model is GoogleModel {
  return GOOGLE_MODELS.includes(model as GoogleModel);
}

// ============================================================================
// Core Factory Functions
// ============================================================================

/**
 * 모델 이름을 Provider로 변환
 * @param modelName - AI 모델 이름
 * @returns 'google' | 'groq'
 */
export function getModelProvider(modelName: AIModel): ModelProvider {
  if (isGoogleModel(modelName)) {
    return 'google';
  }
  if (isGroqModel(modelName)) {
    return 'groq';
  }
  // 기본값: groq (타입 안전성을 위해 never 케이스는 없음)
  return 'groq';
}

/**
 * 모델 이름을 SDK 인스턴스로 변환
 * @param modelName - AI 모델 이름
 * @returns Vercel AI SDK 모델 인스턴스
 */
export function getModelInstance(modelName: AIModel): ModelInstance {
  if (isGoogleModel(modelName)) {
    return google(modelName);
  }
  if (isGroqModel(modelName)) {
    return groq(modelName);
  }
  // Fallback: 가장 빠른 모델
  console.warn(
    `⚠️ Unknown model: ${modelName}, falling back to llama-3.1-8b-instant`
  );
  return groq('llama-3.1-8b-instant');
}

/**
 * 모델 이름을 Google SDK 인스턴스로 변환 (타입 안전)
 * @throws Google 모델이 아닌 경우 에러
 */
export function getGoogleInstance(modelName: GoogleModel): GoogleModelInstance {
  return google(modelName);
}

/**
 * 모델 이름을 Groq SDK 인스턴스로 변환 (타입 안전)
 * @throws Groq 모델이 아닌 경우 에러
 */
export function getGroqInstance(modelName: GroqModel): GroqModelInstance {
  return groq(modelName);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * 모델 ID 목록을 SDK 인스턴스 목록으로 변환
 * @param models - AI 모델 이름 배열
 * @returns SDK 인스턴스 배열
 */
export function getModelInstances(models: AIModel[]): ModelInstance[] {
  return models.map(getModelInstance);
}

/**
 * Primary/Fallback 모델 페어를 SDK 인스턴스로 변환
 * @param primary - 주 모델
 * @param fallback - 폴백 모델 (선택)
 * @returns SDK 인스턴스 페어
 */
export function getModelPair(
  primary: AIModel,
  fallback: AIModel | null
): {
  primary: ModelInstance;
  fallback: ModelInstance | null;
  primaryProvider: ModelProvider;
  fallbackProvider: ModelProvider | null;
} {
  return {
    primary: getModelInstance(primary),
    fallback: fallback ? getModelInstance(fallback) : null,
    primaryProvider: getModelProvider(primary),
    fallbackProvider: fallback ? getModelProvider(fallback) : null,
  };
}

/**
 * 모델이 지원되는지 확인
 */
export function isSupportedModel(model: string): model is AIModel {
  return (
    GROQ_MODELS.includes(model as GroqModel) ||
    GOOGLE_MODELS.includes(model as GoogleModel)
  );
}
