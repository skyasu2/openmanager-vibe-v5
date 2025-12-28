/**
 * AI SDK Model Provider
 *
 * Vercel AI SDK 6 based model provider with triple-provider fallback:
 * - Primary: Cerebras (llama-3.3-70b, 24M tokens/day)
 * - Fallback: Groq (llama-3.3-70b-versatile, 100K tokens/day)
 * - Verifier: Mistral (mistral-small-2506, 24B params)
 *
 * @version 1.2.0
 * @updated 2025-12-28
 */

import { createCerebras } from '@ai-sdk/cerebras';
import { createMistral } from '@ai-sdk/mistral';
import { createGroq } from '@ai-sdk/groq';
import type { LanguageModel } from 'ai';

// ============================================================================
// 1. Types
// ============================================================================

export type ProviderName = 'cerebras' | 'groq' | 'mistral';

export interface ProviderConfig {
  apiKey: string | undefined;
  baseURL?: string;
}

export interface ModelConfig {
  temperature?: number;
  maxTokens?: number;
}

// ============================================================================
// 2. Environment Helpers
// ============================================================================

function getCerebrasApiKey(): string | undefined {
  return process.env.CEREBRAS_API_KEY;
}

function getGroqApiKey(): string | undefined {
  return process.env.GROQ_API_KEY;
}

function getMistralApiKey(): string | undefined {
  return process.env.MISTRAL_API_KEY;
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

// ============================================================================
// 5. Supervisor Model with Fallback Chain
// ============================================================================

export interface ProviderStatus {
  cerebras: boolean;
  groq: boolean;
  mistral: boolean;
}

/**
 * Check which providers are available
 */
export function checkProviderStatus(): ProviderStatus {
  return {
    cerebras: !!getCerebrasApiKey(),
    groq: !!getGroqApiKey(),
    mistral: !!getMistralApiKey(),
  };
}

/**
 * Get primary model for Supervisor (Single-Agent Mode)
 * Fallback chain: Cerebras → Mistral (Groq reserved for NLQ Agent)
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

  // Fallback: Mistral (Groq is reserved for NLQ Agent tool calling)
  if (status.mistral) {
    return {
      model: getMistralModel('mistral-small-2506'),
      provider: 'mistral',
      modelId: 'mistral-small-2506',
    };
  }

  throw new Error('No LLM provider configured. Set CEREBRAS_API_KEY or MISTRAL_API_KEY.');
}

/**
 * Get verifier model (always Mistral for quality)
 */
export function getVerifierModel(): {
  model: LanguageModel;
  provider: ProviderName;
  modelId: string;
} {
  const status = checkProviderStatus();

  if (!status.mistral) {
    throw new Error('MISTRAL_API_KEY required for verifier model');
  }

  return {
    model: getMistralModel('mistral-small-2506'),
    provider: 'mistral',
    modelId: 'mistral-small-2506',
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
