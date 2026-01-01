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
 * Toggle a provider on/off at runtime
 */
export function toggleProvider(provider: ProviderName, enabled: boolean): void {
  providerToggleState[provider] = enabled;
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
 * Get Cerebras model via OpenAI-compatible API
 * @param modelId - 'llama-3.3-70b' (default) or 'llama-3.1-8b'
 *
 * Note: Type casting required because providers return LanguageModelV3
 * but generateText expects LanguageModelV2. This is a known AI SDK issue.
 */
export function getCerebrasModel(
  modelId: string = 'llama-3.3-70b'
): LanguageModel {
  const cerebras = createCerebrasProvider();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return cerebras(modelId) as any;
}

/**
 * Get Groq model
 * @param modelId - 'llama-3.3-70b-versatile' (default) or 'llama-3.1-8b-instant'
 */
export function getGroqModel(
  modelId: string = 'llama-3.3-70b-versatile'
): LanguageModel {
  const groq = createGroqProvider();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return groq(modelId) as any;
}

/**
 * Get Mistral model
 * @param modelId - 'mistral-small-2506' (default)
 */
export function getMistralModel(
  modelId: string = 'mistral-small-2506'
): LanguageModel {
  const mistral = createMistralProvider();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return mistral(modelId) as any;
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return openrouter(modelId) as any;
}

// ============================================================================
// 5. Supervisor Model with Fallback Chain
// ============================================================================

export interface ProviderStatus {
  cerebras: boolean;
  groq: boolean;
  mistral: boolean;
  openrouter: boolean;
}

/**
 * Check which providers are available (API key exists AND toggle enabled)
 */
export function checkProviderStatus(): ProviderStatus {
  return {
    cerebras: !!getCerebrasApiKey() && isProviderEnabled('cerebras'),
    groq: !!getGroqApiKey() && isProviderEnabled('groq'),
    mistral: !!getMistralApiKey() && isProviderEnabled('mistral'),
    openrouter: !!getOpenRouterApiKey() && isProviderEnabled('openrouter'),
  };
}

/**
 * Get primary model for Supervisor (Single-Agent Mode)
 * Fallback chain: Cerebras → Mistral → OpenRouter (Groq reserved for NLQ Agent)
 */
export function getSupervisorModel(): {
  model: LanguageModel;
  provider: ProviderName;
  modelId: string;
} {
  const status = checkProviderStatus();

  // Try Cerebras first (24M tokens/day, fastest)
  if (status.cerebras) {
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
  if (status.mistral) {
    return {
      model: getMistralModel('mistral-small-2506'),
      provider: 'mistral',
      modelId: 'mistral-small-2506',
    };
  }

  // Fallback 2: OpenRouter (free tier - fast model)
  if (status.openrouter) {
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
 * Primary: OpenRouter qwen/qwen-2.5-7b-instruct:free (한국어 우수)
 * Fallback: OpenRouter meta-llama/llama-3.1-8b-instruct:free
 *
 * @description Summarizer Agent 전용 - 빠른 요약 및 핵심 정보 추출
 *
 * 📌 Fallback 전략 설명:
 * - 의도적으로 OpenRouter 내에서만 폴백 (Qwen → Llama)
 * - Mistral 등 유료 프로바이더로 폴백하지 않음
 * - 이유: 100% 무료 운영 유지가 목표
 * - OpenRouter 자체 장애 시에만 Summarizer 사용 불가 (graceful degradation)
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

  // Primary: Qwen 2.5 7B (한국어 품질 우수)
  try {
    return {
      model: getOpenRouterModel('qwen/qwen-2.5-7b-instruct:free'),
      provider: 'openrouter',
      modelId: 'qwen/qwen-2.5-7b-instruct:free',
    };
  } catch (error) {
    console.warn('⚠️ [Summarizer] Qwen model failed, falling back to Llama:', error);
  }

  // Fallback: Llama 3.1 8B
  return {
    model: getOpenRouterModel('meta-llama/llama-3.1-8b-instruct:free'),
    provider: 'openrouter',
    modelId: 'meta-llama/llama-3.1-8b-instruct:free',
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
