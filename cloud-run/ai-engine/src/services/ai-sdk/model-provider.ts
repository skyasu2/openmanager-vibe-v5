/**
 * AI SDK Model Provider
 *
 * Vercel AI SDK 6 based model provider with quad-provider fallback:
 * - Primary: Cerebras (llama-3.3-70b, 24M tokens/day)
 * - Fallback: Groq (llama-3.3-70b-versatile, 100K tokens/day)
 * - Verifier: Mistral (mistral-small-2506, 24B params)
 * - OpenRouter: Fallback for Advisor/Verifier (free tier models)
 *
 * @version 1.3.0
 * @updated 2026-01-01 - Added OpenRouter fallback for Advisor/Verifier
 */

import { createCerebras } from '@ai-sdk/cerebras';
import { createMistral } from '@ai-sdk/mistral';
import { createGroq } from '@ai-sdk/groq';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import type { LanguageModel } from 'ai';

// Use centralized config getters (supports AI_PROVIDERS_CONFIG JSON format)
import {
  getCerebrasApiKey,
  getMistralApiKey,
  getGroqApiKey,
  getOpenRouterApiKey,
} from '../../lib/config-parser';

// ============================================================================
// 1. Types
// ============================================================================

export type ProviderName = 'cerebras' | 'groq' | 'mistral' | 'openrouter';

export interface ProviderStatus {
  cerebras: boolean;
  groq: boolean;
  mistral: boolean;
  openrouter: boolean;
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
  openrouter: true,
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
    openrouter: !!getOpenRouterApiKey() && isProviderEnabled('openrouter'),
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

/**
 * Create OpenRouter provider instance
 * Used as fallback for Advisor and Verifier agents
 * Free models: llama-3.1-8b-instruct:free, gemma-2-9b-it:free
 */
function createOpenRouterProvider() {
  const apiKey = getOpenRouterApiKey();
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }

  return createOpenRouter({
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
 * @see https://github.com/vercel/ai/issues - AI SDK 버전 호환성 이슈
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function asLanguageModel(model: any): LanguageModel {
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

/**
 * Get OpenRouter model (fallback for Advisor/Verifier)
 * @param modelId - 'meta-llama/llama-3.1-8b-instruct:free' (default)
 *
 * Free models available:
 * - meta-llama/llama-3.1-8b-instruct:free (Advisor fallback)
 * - google/gemma-2-9b-it:free (Verifier fallback)
 */
export function getOpenRouterModel(
  modelId: string = 'meta-llama/llama-3.1-8b-instruct:free'
): LanguageModel {
  const openrouter = createOpenRouterProvider();
  return asLanguageModel(openrouter(modelId));
}

// ============================================================================
// 5. Supervisor Model with Fallback Chain
// ============================================================================

/**
 * Get primary model for Supervisor (Single-Agent Mode)
 * Fallback chain: Cerebras → Mistral → OpenRouter (Groq reserved for NLQ Agent)
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

  // Try Cerebras first (1M tokens/day, fastest)
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

  // Fallback 1: Mistral (Groq is reserved for NLQ Agent tool calling)
  if (status.mistral && !excluded.has('mistral')) {
    return {
      model: getMistralModel('mistral-small-2506'),
      provider: 'mistral',
      modelId: 'mistral-small-2506',
    };
  }

  // Fallback 2: OpenRouter (free tier - fast model)
  if (status.openrouter && !excluded.has('openrouter')) {
    console.log('🔄 [Supervisor] Using OpenRouter fallback (nvidia/nemotron-3-nano-30b-a3b:free)');
    return {
      model: getOpenRouterModel('nvidia/nemotron-3-nano-30b-a3b:free'),
      provider: 'openrouter',
      modelId: 'nvidia/nemotron-3-nano-30b-a3b:free',
    };
  }

  throw new Error('No LLM provider configured. Set CEREBRAS_API_KEY, MISTRAL_API_KEY, or OPENROUTER_API_KEY.');
}

/**
 * Get verifier model with OpenRouter fallback
 * Primary: Mistral mistral-small-2506
 * Fallback: OpenRouter google/gemma-2-9b-it:free
 */
export function getVerifierModel(): {
  model: LanguageModel;
  provider: ProviderName;
  modelId: string;
} {
  const status = checkProviderStatus();

  // Try Mistral first (primary)
  if (status.mistral) {
    try {
      return {
        model: getMistralModel('mistral-small-2506'),
        provider: 'mistral',
        modelId: 'mistral-small-2506',
      };
    } catch (error) {
      console.warn('⚠️ [Verifier] Mistral initialization failed:', error);
    }
  }

  // Fallback: OpenRouter gemma-2-9b-it:free
  if (status.openrouter) {
    console.log('🔄 [Verifier] Using OpenRouter fallback (gemma-2-9b-it:free)');
    return {
      model: getOpenRouterModel('google/gemma-2-9b-it:free'),
      provider: 'openrouter',
      modelId: 'google/gemma-2-9b-it:free',
    };
  }

  throw new Error('No provider available for verifier model. Set MISTRAL_API_KEY or OPENROUTER_API_KEY.');
}

/**
 * Get advisor model with OpenRouter fallback
 * Primary: Mistral mistral-small-2506
 * Fallback: OpenRouter meta-llama/llama-3.1-8b-instruct:free
 */
export function getAdvisorModel(): {
  model: LanguageModel;
  provider: ProviderName;
  modelId: string;
} {
  const status = checkProviderStatus();

  // Try Mistral first (primary)
  if (status.mistral) {
    try {
      return {
        model: getMistralModel('mistral-small-2506'),
        provider: 'mistral',
        modelId: 'mistral-small-2506',
      };
    } catch (error) {
      console.warn('⚠️ [Advisor] Mistral initialization failed:', error);
    }
  }

  // Fallback: OpenRouter llama-3.1-8b-instruct:free
  if (status.openrouter) {
    console.log('🔄 [Advisor] Using OpenRouter fallback (llama-3.1-8b-instruct:free)');
    return {
      model: getOpenRouterModel('meta-llama/llama-3.1-8b-instruct:free'),
      provider: 'openrouter',
      modelId: 'meta-llama/llama-3.1-8b-instruct:free',
    };
  }

  throw new Error('No provider available for advisor model. Set MISTRAL_API_KEY or OPENROUTER_API_KEY.');
}

/**
 * Get summarizer model (OpenRouter primary - 100% free tier)
 *
 * Free Model Availability (2026-01-06 checked via API):
 * - nvidia/nemotron-nano-9b-v2:free (128K context)
 * - mistralai/devstral-2512:free (262K context)
 * - openai/gpt-oss-20b:free (131K context)
 *
 * ⚠️ 다음 모델은 더 이상 사용 불가:
 * - qwen/qwen-2.5-7b-instruct:free (제거됨)
 * - meta-llama/llama-3.1-8b-instruct:free (제거됨)
 *
 * @description Summarizer Agent 전용 - 빠른 요약 및 핵심 정보 추출
 *
 * 📌 Fallback 전략 설명:
 * - 의도적으로 OpenRouter 내에서만 폴백 (100% 무료 유지)
 * - OpenRouter 자체 장애 시에만 Summarizer 사용 불가 (graceful degradation)
 *
 * @updated 2026-01-06 - nemotron-nano-9b-v2:free로 변경
 */
export function getSummarizerModel(): {
  model: LanguageModel;
  provider: ProviderName;
  modelId: string;
} {
  const status = checkProviderStatus();

  if (!status.openrouter) {
    throw new Error('OpenRouter not configured. Set OPENROUTER_API_KEY for Summarizer Agent.');
  }

  // Primary: Nvidia Nemotron Nano 9B v2 (fast, 128K context)
  const primaryModel = 'nvidia/nemotron-nano-9b-v2:free';
  console.log(`📝 [Summarizer] Using model: ${primaryModel}`);

  return {
    model: getOpenRouterModel(primaryModel),
    provider: 'openrouter',
    modelId: primaryModel,
  };
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
      case 'openrouter':
        getOpenRouterModel();
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
  if (status.openrouter) {
    results.push(await testProviderHealth('openrouter'));
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
    OpenRouter: status.openrouter ? '✅' : '❌',
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

  // Provider 우선순위 (Groq은 NLQ Agent 전용)
  const preferredOrder: QuotaProviderName[] = ['cerebras', 'mistral', 'openrouter'];
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
      case 'openrouter':
        return {
          model: getOpenRouterModel('nvidia/nemotron-3-nano-30b-a3b:free'),
          provider: 'openrouter',
          modelId: 'nvidia/nemotron-3-nano-30b-a3b:free',
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
 */
export async function recordModelUsage(
  provider: ProviderName,
  tokensUsed: number
): Promise<void> {
  if (provider === 'groq') {
    // Groq은 NLQ Agent 전용이므로 별도 추적
    console.log(`[QuotaTracker] Groq (NLQ): ${tokensUsed} tokens`);
    return;
  }
  await recordProviderUsage(provider as QuotaProviderName, tokensUsed);
}

/**
 * Get quota summary for all providers
 */
export { getQuotaSummary };
