/**
 * LangGraph Model Configuration
 *
 * ## Mistral AI Migration (2025-12-26)
 * Replaced Gemini with Mistral AI due to Google API quota exhaustion (20 RPD limit)
 * Mistral provides generous free tier with tool calling support (~500K TPM)
 *
 * ## Model Upgrade (2025-12-26)
 * Supervisor: mistral-small-latest → mistral-small-2506 (Small 3.2)
 * - 24B parameters, 128K context window
 * - Improved tool calling & structured output (vs 3.1)
 * - Reduced repetition errors, better instruction following
 * - Apache 2.0 license (free & open)
 */

import { ChatMistralAI } from '@langchain/mistralai';
import { ChatGroq } from '@langchain/groq';
import { getGroqApiKey } from './config-parser';
import {
  type CircuitBreakerState,
  isModelHealthy,
  recordFailure,
  recordSuccess,
} from './state-definition';

// ============================================================================
// 0. Mistral API Key Manager
// ============================================================================

/**
 * Get Mistral API key from environment
 */
export function getMistralApiKey(): string {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Mistral API key not configured. Set MISTRAL_API_KEY environment variable.'
    );
  }
  return apiKey;
}

// ============================================================================
// 1. Model Types
// ============================================================================

export type MistralModel =
  | 'mistral-small-latest'      // Alias for latest small model
  | 'mistral-small-2506'        // Small 3.2 (24B, 128K context, improved tool calling)
  | 'mistral-small-2503'        // Small 3.1 (24B, 128K context, multimodal)
  | 'mistral-medium-latest'     // Balanced
  | 'mistral-large-latest'      // Most capable
  | 'open-mistral-7b'           // Open source
  | 'open-mixtral-8x7b'         // Open source MoE
  | 'open-mixtral-8x22b';       // Open source large MoE

export type GroqModel = 'llama-3.1-8b-instant' | 'llama-3.3-70b-versatile';

export interface ModelOptions {
  temperature?: number;
  maxOutputTokens?: number;
}

// ============================================================================
// 2. Model Registry
// ============================================================================

export const MISTRAL_MODELS = {
  SMALL: 'mistral-small-2506' as MistralModel,  // Small 3.2 (24B, 128K, improved tool calling)
  SMALL_31: 'mistral-small-2503' as MistralModel,  // Small 3.1 (fallback)
  SMALL_LATEST: 'mistral-small-latest' as MistralModel,  // Alias (fallback)
  MEDIUM: 'mistral-medium-latest' as MistralModel,
  LARGE: 'mistral-large-latest' as MistralModel,
} as const;

export const AGENT_MODEL_CONFIG = {
  supervisor: {
    provider: 'mistral' as const,
    model: MISTRAL_MODELS.SMALL, // Fast/cheap for routing with tool calling
    temperature: 0.1, // Lower for more deterministic routing
    maxOutputTokens: 512,
  },
  nlq: {
    provider: 'groq' as const,
    model: 'llama-3.3-70b-versatile' as GroqModel,
    temperature: 0.3,
    maxOutputTokens: 1024,
  },
  analyst: {
    provider: 'groq' as const,
    model: 'llama-3.3-70b-versatile' as GroqModel,
    temperature: 0.2,
    maxOutputTokens: 2048,
  },
  reporter: {
    provider: 'groq' as const,
    model: 'llama-3.3-70b-versatile' as GroqModel,
    temperature: 0.3,
    maxOutputTokens: 4096,
  },
  verifier: {
    provider: 'groq' as const,
    model: 'llama-3.1-8b-instant' as GroqModel,
    temperature: 0.1,
    maxOutputTokens: 1024,
  },
} as const;

export type AgentType = keyof typeof AGENT_MODEL_CONFIG;

// ============================================================================
// 3. Model Factory Functions
// ============================================================================

export function createMistralModel(
  model: MistralModel = MISTRAL_MODELS.SMALL,
  options?: ModelOptions
): ChatMistralAI {
  const apiKey = getMistralApiKey();

  return new ChatMistralAI({
    apiKey,
    model,
    temperature: options?.temperature ?? 0.3,
    maxTokens: options?.maxOutputTokens ?? 1024,
  });
}

export function createGroqModel(
  model: GroqModel = 'llama-3.1-8b-instant',
  options?: ModelOptions
): ChatGroq {
  const apiKey = getGroqApiKey();
  if (!apiKey) {
    throw new Error(
      'Groq API key not configured. Set GROQ_API_KEY environment variable.'
    );
  }

  return new ChatGroq({
    apiKey,
    model,
    temperature: options?.temperature ?? 0.2,
    maxTokens: options?.maxOutputTokens ?? 1024,
  });
}

// ============================================================================
// 4. Agent-Specific Model Getters
// ============================================================================

export function getModelForAgent(
  agentType: AgentType
): ChatMistralAI | ChatGroq {
  const config = AGENT_MODEL_CONFIG[agentType];

  if (config.provider === 'mistral') {
    return createMistralModel(config.model as MistralModel, {
      temperature: config.temperature,
      maxOutputTokens: config.maxOutputTokens,
    });
  }

  return createGroqModel(config.model as GroqModel, {
    temperature: config.temperature,
    maxOutputTokens: config.maxOutputTokens,
  });
}

/**
 * Get Supervisor model (Mistral Small 3.2 - 24B params, 128K context, improved tool calling)
 */
export function getSupervisorModel(): ChatMistralAI {
  const config = AGENT_MODEL_CONFIG.supervisor;
  return createMistralModel(config.model as MistralModel, {
    temperature: config.temperature,
    maxOutputTokens: config.maxOutputTokens,
  });
}

export function getNLQModel(): ChatGroq {
  const config = AGENT_MODEL_CONFIG.nlq;
  return createGroqModel(config.model as GroqModel, {
    temperature: config.temperature,
    maxOutputTokens: config.maxOutputTokens,
  });
}

export function getAnalystModel(): ChatGroq {
  const config = AGENT_MODEL_CONFIG.analyst;
  return createGroqModel(config.model as GroqModel, {
    temperature: config.temperature,
    maxOutputTokens: config.maxOutputTokens,
  });
}

export function getReporterModel(): ChatGroq {
  const config = AGENT_MODEL_CONFIG.reporter;
  return createGroqModel(config.model as GroqModel, {
    temperature: config.temperature,
    maxOutputTokens: config.maxOutputTokens,
  });
}

export function getVerifierModel(): ChatGroq {
  const config = AGENT_MODEL_CONFIG.verifier;
  return createGroqModel(config.model as GroqModel, {
    temperature: config.temperature,
    maxOutputTokens: config.maxOutputTokens,
  });
}

// ============================================================================
// 5. API Key Validation
// ============================================================================

export function validateAPIKeys(): {
  mistral: boolean;
  groq: boolean;
  all: boolean;
} {
  const mistralKey = process.env.MISTRAL_API_KEY;
  const groqKey = getGroqApiKey();

  return {
    mistral: !!mistralKey,
    groq: !!groqKey,
    all: !!mistralKey && !!groqKey,
  };
}

export function logAPIKeyStatus(): void {
  const status = validateAPIKeys();
  console.log('🔑 API Key Status:', {
    'Mistral AI': status.mistral ? '✅' : '❌',
    Groq: status.groq ? '✅' : '❌',
  });
}

// ============================================================================
// 6. Circuit Breaker Integration
// ============================================================================

export const MODEL_FALLBACK_CHAIN: Record<string, string[]> = {
  'mistral-small-2506': ['mistral-small-2503', 'mistral-small-latest', 'llama-3.3-70b-versatile'],
  'mistral-small-2503': ['mistral-small-2506', 'mistral-small-latest', 'llama-3.3-70b-versatile'],
  'mistral-small-latest': ['mistral-small-2506', 'mistral-small-2503', 'llama-3.3-70b-versatile'],
  'mistral-medium-latest': ['mistral-small-2506', 'mistral-small-latest', 'llama-3.3-70b-versatile'],
  'mistral-large-latest': ['mistral-medium-latest', 'mistral-small-2506'],
  'llama-3.1-8b-instant': ['llama-3.3-70b-versatile', 'mistral-small-2506'],
  'llama-3.3-70b-versatile': ['mistral-small-2506', 'llama-3.1-8b-instant'],
};

export function selectHealthyModel(
  preferredModel: string,
  circuitState: CircuitBreakerState
): string {
  if (isModelHealthy(circuitState, preferredModel)) {
    return preferredModel;
  }

  console.log(
    `⚠️ [Circuit Breaker] ${preferredModel} is unhealthy, trying fallback`
  );

  const fallbackChain = MODEL_FALLBACK_CHAIN[preferredModel] || [];
  for (const fallbackModel of fallbackChain) {
    if (isModelHealthy(circuitState, fallbackModel)) {
      console.log(`✅ [Circuit Breaker] Using fallback: ${fallbackModel}`);
      return fallbackModel;
    }
  }

  console.log(
    `⚠️ [Circuit Breaker] All fallbacks unhealthy, retrying ${preferredModel}`
  );
  return preferredModel;
}

export async function invokeWithCircuitBreaker<T>(
  modelId: string,
  circuitState: CircuitBreakerState,
  invoker: (model: ChatMistralAI | ChatGroq) => Promise<T>
): Promise<{
  result: T;
  usedModel: string;
  newCircuitState: CircuitBreakerState;
}> {
  const healthyModel = selectHealthyModel(modelId, circuitState);
  let currentCircuitState = circuitState;
  let lastError: Error | null = null;

  const modelsToTry = [
    healthyModel,
    ...(MODEL_FALLBACK_CHAIN[healthyModel] || []),
  ];

  for (const tryModel of modelsToTry) {
    if (
      !isModelHealthy(currentCircuitState, tryModel) &&
      tryModel !== modelsToTry[0]
    ) {
      continue;
    }

    try {
      const model = createModelByName(tryModel);
      const result = await invoker(model);

      currentCircuitState = recordSuccess(currentCircuitState, tryModel);
      console.log(`✅ [Circuit Breaker] ${tryModel} succeeded`);

      return {
        result,
        usedModel: tryModel,
        newCircuitState: currentCircuitState,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      currentCircuitState = recordFailure(currentCircuitState, tryModel);
    }
  }

  throw lastError || new Error('All models in fallback chain failed');
}

function createModelByName(modelName: string): ChatMistralAI | ChatGroq {
  if (modelName.startsWith('mistral') || modelName.startsWith('open-mistral') || modelName.startsWith('open-mixtral')) {
    return createMistralModel(modelName as MistralModel);
  }
  if (modelName.startsWith('llama')) {
    return createGroqModel(modelName as GroqModel);
  }
  throw new Error(`Unknown model: ${modelName}`);
}
