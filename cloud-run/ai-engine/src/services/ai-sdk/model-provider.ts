/**
 * AI SDK Model Provider
 *
 * Vercel AI SDK 6 based model provider with tri-provider architecture:
 * - Primary: Cerebras (llama-3.3-70b, 24M tokens/day)
 * - Fallback: Groq (llama-3.3-70b-versatile, 100K tokens/day)
 * - Verifier: Mistral (mistral-small-2506, 24B params)
 *
 * @version 2.0.0
 * @updated 2026-01-12 - Removed OpenRouter (free tier tool calling unreliable)
 */

import { createCerebras } from '@ai-sdk/cerebras';
import { createMistral } from '@ai-sdk/mistral';
import { createGroq } from '@ai-sdk/groq';
import type { LanguageModel } from 'ai';

// Use centralized config getters (supports AI_PROVIDERS_CONFIG JSON format)
import {
  getCerebrasApiKey,
  getMistralApiKey,
  getGroqApiKey,
} from '../../lib/config-parser';

// ============================================================================
// 1. Types
// ============================================================================

export type ProviderName = 'cerebras' | 'groq' | 'mistral';

export interface ProviderStatus {
  cerebras: boolean;
  groq: boolean;
  mistral: boolean;
}

// ============================================================================
// 2. Runtime Provider Toggle (for testing)
// ============================================================================

/**
 * Runtime toggle state for providers (default: all enabled)
 * Use toggleProvider() to enable/disable at runtime for testing
 */
const providerToggleState: Record<ProviderName, boolean> = {
  cerebras: true,
  groq: true,
  mistral: true,
};

/**
 * Cached provider status (invalidated when toggling providers)
 * @optimization Reduces redundant API key checks during agent initialization
 */
let cachedProviderStatus: ProviderStatus | null = null;

/**
 * Toggle a provider on/off at runtime
 * @note Invalidates provider status cache to reflect changes
 */
export function toggleProvider(provider: ProviderName, enabled: boolean): void {
  providerToggleState[provider] = enabled;
  // Invalidate cache when provider toggle changes
  cachedProviderStatus = null;
  console.log(`🔧 [Provider] ${provider} ${enabled ? 'ENABLED' : 'DISABLED'}`);
}

/**
 * Get current toggle state for all providers
 */
export function getProviderToggleState(): Record<ProviderName, boolean> {
  return { ...providerToggleState };
}

/**
 * Check if provider is enabled (both has API key AND toggle is on)
 */
function isProviderEnabled(provider: ProviderName): boolean {
  return providerToggleState[provider];
}

/**
 * Check which providers are available (API key exists AND toggle enabled)
 * @optimization Caches result for startup performance (agent-configs.ts calls this 5+ times)
 */
export function checkProviderStatus(): ProviderStatus {
  if (cachedProviderStatus) {
    return cachedProviderStatus;
  }

  cachedProviderStatus = {
    cerebras: !!getCerebrasApiKey() && isProviderEnabled('cerebras'),
    groq: !!getGroqApiKey() && isProviderEnabled('groq'),
    mistral: !!getMistralApiKey() && isProviderEnabled('mistral'),
  };

  return cachedProviderStatus;
}

/**
 * Invalidate provider status cache (call when toggling providers)
 */
export function invalidateProviderStatusCache(): void {
  cachedProviderStatus = null;
}

export interface ProviderConfig {
  apiKey: string | undefined;
  baseURL?: string;
}

export interface ModelConfig {
  temperature?: number;
  maxTokens?: number;
}

// ============================================================================
// 3. Provider Factories
// ============================================================================

/**
 * Create Cerebras provider instance
 */
function createCerebrasProvider() {
  const apiKey = getCerebrasApiKey();
  if (!apiKey) {
    throw new Error('CEREBRAS_API_KEY not configured');
  }

  return createCerebras({
    apiKey,
  });
}

/**
 * Create Groq provider instance
 */
function createGroqProvider() {
  const apiKey = getGroqApiKey();
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not configured');
  }

  return createGroq({
    apiKey,
  });
}

/**
 * Create Mistral provider instance
 */
function createMistralProvider() {
  const apiKey = getMistralApiKey();
  if (!apiKey) {
    throw new Error('MISTRAL_API_KEY not configured');
  }

  return createMistral({
    apiKey,
  });
}

// ============================================================================
// 4. Model Factory Functions
// ============================================================================

/**
 * AI SDK 타입 호환성 헬퍼
 *
 * Provider SDK들이 LanguageModelV3를 반환하지만 generateText()는 LanguageModelV2를 기대함.
 * 런타임에서는 호환되므로 타입 캐스팅으로 해결.
 *
 * 🎯 P1 Fix: 런타임 검증 추가로 Provider SDK 변경 시 조기 에러 감지
 *
 * @see https://github.com/vercel/ai/issues - AI SDK 버전 호환성 이슈
 */
function asLanguageModel(model: unknown): LanguageModel {
  // 🎯 CODEX Review Fix: 함수형 모델도 허용 (callable + 속성 조합 가능)
  if (!model || (typeof model !== 'object' && typeof model !== 'function')) {
    throw new TypeError('[ModelProvider] Model must be an object or function');
  }

  // Check for essential LanguageModel interface methods
  const m = model as Record<string, unknown>;
  const hasDoGenerate = typeof m.doGenerate === 'function';
  const hasDoStream = typeof m.doStream === 'function';

  if (!hasDoGenerate && !hasDoStream) {
    throw new TypeError(
      '[ModelProvider] Model does not implement LanguageModel interface (missing doGenerate/doStream)'
    );
  }

  return model as LanguageModel;
}

/**
 * Get Cerebras model via OpenAI-compatible API
 * @param modelId - 'llama-3.3-70b' (default) or 'llama-3.1-8b'
 */
export function getCerebrasModel(
  modelId: string = 'llama-3.3-70b'
): LanguageModel {
  const cerebras = createCerebrasProvider();
  return asLanguageModel(cerebras(modelId));
}

/**
 * Get Groq model
 * @param modelId - 'llama-3.3-70b-versatile' (default) or 'llama-3.1-8b-instant'
 */
export function getGroqModel(
  modelId: string = 'llama-3.3-70b-versatile'
): LanguageModel {
  const groq = createGroqProvider();
  return asLanguageModel(groq(modelId));
}

/**
 * Get Mistral model
 * @param modelId - 'mistral-small-2506' (default)
 */
export function getMistralModel(
  modelId: string = 'mistral-small-2506'
): LanguageModel {
  const mistral = createMistralProvider();
  return asLanguageModel(mistral(modelId));
}

// ============================================================================
// 5. Supervisor Model with Fallback Chain
// ============================================================================

/**
 * Get primary model for Supervisor (Single-Agent Mode)
 * Fallback chain: Cerebras → Mistral → Groq
 *
 * @param excludeProviders - Providers to skip (e.g., recently failed providers on retry)
 */
export function getSupervisorModel(excludeProviders: ProviderName[] = []): {
  model: LanguageModel;
  provider: ProviderName;
  modelId: string;
} {
  const status = checkProviderStatus();
  const excluded = new Set(excludeProviders);

  if (excluded.size > 0) {
    console.log(`🔄 [Supervisor] Excluding providers: [${excludeProviders.join(', ')}]`);
  }

  // Try Cerebras first (24M tokens/day, fastest)
  if (status.cerebras && !excluded.has('cerebras')) {
    try {
      return {
        model: getCerebrasModel('llama-3.3-70b'),
        provider: 'cerebras',
        modelId: 'llama-3.3-70b',
      };
    } catch (error) {
      console.warn('⚠️ [Supervisor] Cerebras initialization failed:', error);
    }
  }

  // Fallback 1: Mistral
  if (status.mistral && !excluded.has('mistral')) {
    return {
      model: getMistralModel('mistral-small-2506'),
      provider: 'mistral',
      modelId: 'mistral-small-2506',
    };
  }

  // Fallback 2: Groq
  if (status.groq && !excluded.has('groq')) {
    console.log('🔄 [Supervisor] Using Groq fallback');
    return {
      model: getGroqModel('llama-3.3-70b-versatile'),
      provider: 'groq',
      modelId: 'llama-3.3-70b-versatile',
    };
  }

  throw new Error('No LLM provider configured. Set CEREBRAS_API_KEY, MISTRAL_API_KEY, or GROQ_API_KEY.');
}

/**
 * Get verifier model with 3-way fallback
 * Mistral → Cerebras → Groq
 * Ensures operation even if 2 of 3 providers are down
 */
export function getVerifierModel(): {
  model: LanguageModel;
  provider: ProviderName;
  modelId: string;
} {
  const status = checkProviderStatus();

  // Primary: Mistral (best for verification)
  if (status.mistral) {
    try {
      return {
        model: getMistralModel('mistral-small-2506'),
        provider: 'mistral',
        modelId: 'mistral-small-2506',
      };
    } catch (error) {
      console.warn('⚠️ [Verifier] Mistral initialization failed, trying Cerebras:', error);
    }
  }

  // Fallback 1: Cerebras
  if (status.cerebras) {
    try {
      console.log('🔄 [Verifier] Using Cerebras fallback');
      return {
        model: getCerebrasModel('llama-3.3-70b'),
        provider: 'cerebras',
        modelId: 'llama-3.3-70b',
      };
    } catch (error) {
      console.warn('⚠️ [Verifier] Cerebras initialization failed, trying Groq:', error);
    }
  }

  // Fallback 2: Groq (last resort)
  if (status.groq) {
    console.log('🔄 [Verifier] Using Groq fallback (last resort)');
    return {
      model: getGroqModel('llama-3.3-70b-versatile'),
      provider: 'groq',
      modelId: 'llama-3.3-70b-versatile',
    };
  }

  throw new Error('No provider available for verifier model (all 3 providers down).');
}

/**
 * Get advisor model with 3-way fallback
 * Mistral → Groq → Cerebras
 * Ensures operation even if 2 of 3 providers are down
 */
export function getAdvisorModel(): {
  model: LanguageModel;
  provider: ProviderName;
  modelId: string;
} {
  const status = checkProviderStatus();

  // Primary: Mistral (best for RAG + reasoning)
  if (status.mistral) {
    try {
      return {
        model: getMistralModel('mistral-small-2506'),
        provider: 'mistral',
        modelId: 'mistral-small-2506',
      };
    } catch (error) {
      console.warn('⚠️ [Advisor] Mistral initialization failed, trying Groq:', error);
    }
  }

  // Fallback 1: Groq
  if (status.groq) {
    try {
      console.log('🔄 [Advisor] Using Groq fallback');
      return {
        model: getGroqModel('llama-3.3-70b-versatile'),
        provider: 'groq',
        modelId: 'llama-3.3-70b-versatile',
      };
    } catch (error) {
      console.warn('⚠️ [Advisor] Groq initialization failed, trying Cerebras:', error);
    }
  }

  // Fallback 2: Cerebras (last resort)
  if (status.cerebras) {
    console.log('🔄 [Advisor] Using Cerebras fallback (last resort)');
    return {
      model: getCerebrasModel('llama-3.3-70b'),
      provider: 'cerebras',
      modelId: 'llama-3.3-70b',
    };
  }

  throw new Error('No provider available for advisor model (all 3 providers down).');
}

// ============================================================================
// 6. Health Check
// ============================================================================

export interface ProviderHealth {
  provider: ProviderName;
  status: 'ok' | 'error';
  latencyMs?: number;
  error?: string;
}

/**
 * Test provider connectivity (lightweight check)
 */
export async function testProviderHealth(
  provider: ProviderName
): Promise<ProviderHealth> {
  const startTime = Date.now();

  try {
    switch (provider) {
      case 'cerebras':
        getCerebrasModel(); // Just check if provider can be created
        break;
      case 'groq':
        getGroqModel();
        break;
      case 'mistral':
        getMistralModel();
        break;
    }

    return {
      provider,
      status: 'ok',
      latencyMs: Date.now() - startTime,
    };
  } catch (error) {
    return {
      provider,
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Check all providers health
 */
export async function checkAllProvidersHealth(): Promise<ProviderHealth[]> {
  const status = checkProviderStatus();
  const results: ProviderHealth[] = [];

  if (status.cerebras) {
    results.push(await testProviderHealth('cerebras'));
  }
  if (status.groq) {
    results.push(await testProviderHealth('groq'));
  }
  if (status.mistral) {
    results.push(await testProviderHealth('mistral'));
  }

  return results;
}

/**
 * Log provider status
 */
export function logProviderStatus(): void {
  const status = checkProviderStatus();
  console.log('🔑 AI SDK Provider Status:', {
    Cerebras: status.cerebras ? '✅' : '❌',
    Groq: status.groq ? '✅' : '❌',
    Mistral: status.mistral ? '✅' : '❌',
  });
}

// ============================================================================
// 7. Pre-emptive Fallback with Quota Tracking
// ============================================================================

import {
  selectAvailableProvider,
  recordProviderUsage,
  getQuotaSummary,
  type ProviderName as QuotaProviderName,
} from '../resilience/quota-tracker';

/**
 * Get Supervisor model with Pre-emptive Fallback (Quota-aware)
 *
 * 80% 임계값 도달 시 사전 전환하여 Rate Limit 에러 방지
 *
 * @param excludeProviders - 제외할 Provider 목록
 * @returns 모델 정보 + Pre-emptive Fallback 여부
 */
export async function getSupervisorModelWithQuota(
  excludeProviders: ProviderName[] = []
): Promise<{
  model: LanguageModel;
  provider: ProviderName;
  modelId: string;
  isPreemptiveFallback: boolean;
}> {
  const status = checkProviderStatus();
  const excluded = new Set(excludeProviders);

  // Provider 우선순위
  const preferredOrder: QuotaProviderName[] = ['cerebras', 'mistral', 'groq'];
  const availableOrder = preferredOrder.filter(
    (p) => status[p] && !excluded.has(p)
  );

  // Quota-aware Provider 선택
  const selection = await selectAvailableProvider(availableOrder);

  if (selection) {
    const { provider, isPreemptiveFallback } = selection;

    if (isPreemptiveFallback) {
      console.log(`⚠️ [Supervisor] Pre-emptive fallback to ${provider}`);
    }

    // Provider별 모델 반환
    switch (provider) {
      case 'cerebras':
        return {
          model: getCerebrasModel('llama-3.3-70b'),
          provider: 'cerebras',
          modelId: 'llama-3.3-70b',
          isPreemptiveFallback,
        };
      case 'mistral':
        return {
          model: getMistralModel('mistral-small-2506'),
          provider: 'mistral',
          modelId: 'mistral-small-2506',
          isPreemptiveFallback,
        };
      case 'groq':
        return {
          model: getGroqModel('llama-3.3-70b-versatile'),
          provider: 'groq',
          modelId: 'llama-3.3-70b-versatile',
          isPreemptiveFallback,
        };
    }
  }

  // Quota 초과 시 기존 로직으로 폴백
  console.warn('⚠️ [Supervisor] All providers at quota limit, using fallback logic');
  const fallback = getSupervisorModel(excludeProviders);
  return { ...fallback, isPreemptiveFallback: false };
}

/**
 * Record token usage after API call
 *
 * 🎯 AI SDK v6 Best Practice: Track all provider usage for pre-emptive fallback
 * All providers including Groq are tracked for accurate quota management
 *
 * @param provider - Provider name
 * @param tokensUsed - Number of tokens consumed
 * @param context - Optional context for logging (e.g., 'nlq', 'fallback', 'supervisor')
 */
export async function recordModelUsage(
  provider: ProviderName,
  tokensUsed: number,
  context: string = 'general'
): Promise<void> {
  // Track all providers for quota management
  // Groq has lower limits (100K/day) so tracking is especially important for fallback scenarios
  await recordProviderUsage(provider as QuotaProviderName, tokensUsed);

  // Enhanced logging with context
  if (provider === 'groq') {
    console.log(`[QuotaTracker] Groq (${context}): ${tokensUsed} tokens - low quota provider, monitor closely`);
  }
}

/**
 * Get quota summary for all providers
 */
export { getQuotaSummary };
