/**
 * AI Engine Core Types - Re-export All
 *
 * 하위 호환성을 위해 기존 import 경로 유지
 * import { AIScenario, UnifiedQueryRequest } from '@/lib/ai/core/types';
 *
 * @since v5.84.0 - Cloud Run AI Engine (Vercel AI SDK + Cerebras/Groq/Mistral)
 */

// Cache types
export type { CachedResponse, CacheStats } from './cache';
// Config types
export type {
  CacheConfig,
  EngineConfig,
  MLProviderConfig,
  ProvidersConfig,
  RAGProviderConfig,
  RuleProviderConfig,
} from './config';
// Data types
export type { MLData, RAGData, RAGDocument, RuleData } from './data';
// Engine types
export type { EngineHealthStatus, IUnifiedEngine } from './engine';
// Enum types
export type { AIScenario, ContextPriority, ProviderType } from './enums';
// Error classes
export {
  CloudRunAIError,
  ProviderError,
  UnifiedEngineError,
} from './errors';
// Type guards
export { isMLData, isRAGData, isRuleData, isValidScenario } from './guards';

// Prompt types
export type {
  AIPrompt,
  PromptParams,
  PromptTemplate,
} from './prompt';
// Provider types
export type {
  IContextProvider,
  ProviderContext,
  ProviderContexts,
  ProviderHealthStatus,
  ProviderMetadata,
  ProviderOptions,
} from './provider';
// Request types
export type {
  RequestContext,
  UnifiedQueryOptions,
  UnifiedQueryRequest,
} from './request';
// Response types
export type {
  ResponseMetadata,
  ThinkingStep,
  UnifiedQueryResponse,
} from './response';
// Utility types
export type {
  DeepPartial,
  DeepRequired,
  OmitByValue,
  PickByValue,
} from './utils';
