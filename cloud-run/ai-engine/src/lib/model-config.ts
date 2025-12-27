/**
 * LangGraph Model Configuration
 *
 * ## Architecture (2025-12-27)
 * Triple-provider strategy for rate limit distribution and reliability:
 *
 * ### Groq (Supervisor Only - llama-3.3-70b-versatile)
 * - Supervisor: LangGraph handoff requires Groq (Mistral incompatible)
 * - Daily Limit: 100K tokens, 1,000 requests
 * - Reserved for routing decisions only
 *
 * ### Cerebras (Primary Workers - llama-3.3-70b)
 * - NLQ Agent: Server metrics queries (fast inference, 2100 tok/s)
 * - Analyst Agent: Pattern analysis, anomaly detection
 * - Reporter Agent: Incident reports, RAG search
 * - Daily Limit: 24M tokens (240x more than Groq!)
 *
 * ### Mistral (Tertiary - mistral-small-2506)
 * - Verifier Agent: Response quality verification (24B params)
 * - Last Keeper: Fallback when other providers fail
 *
 * ## Migration History
 * - Gemini → Mistral (Google API quota exhaustion)
 * - Supervisor: Mistral → Groq (LangGraph handoff compatibility)
 * - Verifier: Groq 8B → Mistral 24B (quality upgrade)
 * - NLQ: Groq → Cerebras (rate limit distribution)
 * - Analyst/Reporter: Groq → Cerebras (rate limit optimization, 2025-12-27)
 */

import { ChatMistralAI } from '@langchain/mistralai';
import { ChatGroq } from '@langchain/groq';
import { ChatCerebras } from '@langchain/cerebras';
import { getGroqApiKey, getCerebrasApiKey } from './config-parser';
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

export type CerebrasModel = 'llama-3.3-70b' | 'llama-3.1-8b';

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

export const CEREBRAS_MODELS = {
  LLAMA_70B: 'llama-3.3-70b' as CerebrasModel,  // Fast inference, same as Groq
  LLAMA_8B: 'llama-3.1-8b' as CerebrasModel,    // Faster, smaller
} as const;

export const AGENT_MODEL_CONFIG = {
  supervisor: {
    provider: 'groq' as const, // Groq for reliable LangGraph handoff support
    model: 'llama-3.3-70b-versatile' as GroqModel,
    temperature: 0.1, // Lower for more deterministic routing
    maxOutputTokens: 512,
  },
  nlq: {
    provider: 'cerebras' as const, // Cerebras for fast inference & rate limit distribution
    model: CEREBRAS_MODELS.LLAMA_70B,
    temperature: 0.3,
    maxOutputTokens: 1024,
  },
  analyst: {
    provider: 'cerebras' as const, // 🔄 Groq → Cerebras (rate limit optimization)
    model: CEREBRAS_MODELS.LLAMA_70B,
    temperature: 0.2,
    maxOutputTokens: 2048,
  },
  reporter: {
    provider: 'cerebras' as const, // 🔄 Groq → Cerebras (rate limit optimization)
    model: CEREBRAS_MODELS.LLAMA_70B,
    temperature: 0.3,
    maxOutputTokens: 4096,
  },
  verifier: {
    provider: 'mistral' as const, // Mistral 24B for better verification quality
    model: MISTRAL_MODELS.SMALL,
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

export function createCerebrasModel(
  model: CerebrasModel = CEREBRAS_MODELS.LLAMA_70B,
  options?: ModelOptions
): ChatCerebras {
  const apiKey = getCerebrasApiKey();
  if (!apiKey) {
    console.warn('⚠️ [Cerebras] API key not configured, falling back to Groq');
    throw new Error(
      'Cerebras API key not configured. Set CEREBRAS_API_KEY environment variable.'
    );
  }

  return new ChatCerebras({
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
): ChatMistralAI | ChatGroq | ChatCerebras {
  const config = AGENT_MODEL_CONFIG[agentType];
  const provider = config.provider as string;

  if (provider === 'mistral') {
    return createMistralModel(config.model as MistralModel, {
      temperature: config.temperature,
      maxOutputTokens: config.maxOutputTokens,
    });
  }

  if (provider === 'cerebras') {
    try {
      return createCerebrasModel(config.model as CerebrasModel, {
        temperature: config.temperature,
        maxOutputTokens: config.maxOutputTokens,
      });
    } catch {
      // Fallback to Groq if Cerebras not configured
      console.warn(`⚠️ [${agentType}] Cerebras unavailable, falling back to Groq`);
      return createGroqModel('llama-3.3-70b-versatile', {
        temperature: config.temperature,
        maxOutputTokens: config.maxOutputTokens,
      });
    }
  }

  return createGroqModel(config.model as GroqModel, {
    temperature: config.temperature,
    maxOutputTokens: config.maxOutputTokens,
  });
}

/**
 * Get Supervisor model with Cerebras fallback
 * Primary: Groq llama-3.3-70b-versatile (LangGraph handoff tested)
 * Fallback: Cerebras llama-3.3-70b (same base model, rate limit distribution)
 */
export function getSupervisorModel(): ChatGroq | ChatCerebras {
  const config = AGENT_MODEL_CONFIG.supervisor;

  try {
    return createGroqModel(config.model as GroqModel, {
      temperature: config.temperature,
      maxOutputTokens: config.maxOutputTokens,
    });
  } catch {
    // Fallback to Cerebras if Groq unavailable
    console.warn('⚠️ [Supervisor] Groq unavailable, trying Cerebras fallback');
    try {
      return createCerebrasModel(CEREBRAS_MODELS.LLAMA_70B, {
        temperature: config.temperature,
        maxOutputTokens: config.maxOutputTokens,
      });
    } catch {
      // Last resort: throw to trigger Last Keeper
      throw new Error('Both Groq and Cerebras unavailable for Supervisor');
    }
  }
}

export function getNLQModel(): ChatCerebras | ChatGroq {
  const config = AGENT_MODEL_CONFIG.nlq;
  try {
    return createCerebrasModel(config.model as CerebrasModel, {
      temperature: config.temperature,
      maxOutputTokens: config.maxOutputTokens,
    });
  } catch {
    // Fallback to Groq if Cerebras not configured
    console.warn('⚠️ [NLQ] Cerebras unavailable, falling back to Groq');
    return createGroqModel('llama-3.3-70b-versatile', {
      temperature: config.temperature,
      maxOutputTokens: config.maxOutputTokens,
    });
  }
}

export function getAnalystModel(): ChatCerebras | ChatGroq {
  const config = AGENT_MODEL_CONFIG.analyst;
  try {
    return createCerebrasModel(config.model as CerebrasModel, {
      temperature: config.temperature,
      maxOutputTokens: config.maxOutputTokens,
    });
  } catch {
    // Fallback to Groq if Cerebras not configured
    console.warn('⚠️ [Analyst] Cerebras unavailable, falling back to Groq');
    return createGroqModel('llama-3.3-70b-versatile', {
      temperature: config.temperature,
      maxOutputTokens: config.maxOutputTokens,
    });
  }
}

export function getReporterModel(): ChatCerebras | ChatGroq {
  const config = AGENT_MODEL_CONFIG.reporter;
  try {
    return createCerebrasModel(config.model as CerebrasModel, {
      temperature: config.temperature,
      maxOutputTokens: config.maxOutputTokens,
    });
  } catch {
    // Fallback to Groq if Cerebras not configured
    console.warn('⚠️ [Reporter] Cerebras unavailable, falling back to Groq');
    return createGroqModel('llama-3.3-70b-versatile', {
      temperature: config.temperature,
      maxOutputTokens: config.maxOutputTokens,
    });
  }
}

export function getVerifierModel(): ChatMistralAI {
  const config = AGENT_MODEL_CONFIG.verifier;
  return createMistralModel(config.model as MistralModel, {
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
  cerebras: boolean;
  all: boolean;
} {
  const mistralKey = process.env.MISTRAL_API_KEY;
  const groqKey = getGroqApiKey();
  const cerebrasKey = getCerebrasApiKey();

  return {
    mistral: !!mistralKey,
    groq: !!groqKey,
    cerebras: !!cerebrasKey,
    all: !!mistralKey && !!groqKey && !!cerebrasKey,
  };
}

export function logAPIKeyStatus(): void {
  const status = validateAPIKeys();
  console.log('🔑 API Key Status:', {
    'Mistral AI': status.mistral ? '✅' : '❌',
    Groq: status.groq ? '✅' : '❌',
    Cerebras: status.cerebras ? '✅' : '❌',
  });
}

// ============================================================================
// 6. Circuit Breaker Integration
// ============================================================================

export const MODEL_FALLBACK_CHAIN: Record<string, string[]> = {
  // Mistral models
  'mistral-small-2506': ['mistral-small-2503', 'mistral-small-latest', 'llama-3.3-70b-versatile'],
  'mistral-small-2503': ['mistral-small-2506', 'mistral-small-latest', 'llama-3.3-70b-versatile'],
  'mistral-small-latest': ['mistral-small-2506', 'mistral-small-2503', 'llama-3.3-70b-versatile'],
  'mistral-medium-latest': ['mistral-small-2506', 'mistral-small-latest', 'llama-3.3-70b-versatile'],
  'mistral-large-latest': ['mistral-medium-latest', 'mistral-small-2506'],
  // Groq models
  'llama-3.1-8b-instant': ['llama-3.3-70b-versatile', 'llama-3.3-70b', 'mistral-small-2506'],
  'llama-3.3-70b-versatile': ['llama-3.3-70b', 'mistral-small-2506', 'llama-3.1-8b-instant'],
  // Cerebras models (fallback to Groq equivalents)
  'llama-3.3-70b': ['llama-3.3-70b-versatile', 'mistral-small-2506'],
  'llama-3.1-8b': ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile'],
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
  invoker: (model: ChatMistralAI | ChatGroq | ChatCerebras) => Promise<T>
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

function createModelByName(modelName: string): ChatMistralAI | ChatGroq | ChatCerebras {
  if (modelName.startsWith('mistral') || modelName.startsWith('open-mistral') || modelName.startsWith('open-mixtral')) {
    return createMistralModel(modelName as MistralModel);
  }
  // Cerebras uses 'llama-X.X-XXb' format (without -versatile or -instant suffix)
  if (modelName === 'llama-3.3-70b' || modelName === 'llama-3.1-8b') {
    try {
      return createCerebrasModel(modelName as CerebrasModel);
    } catch {
      // Fallback to Groq equivalent
      const groqEquivalent = modelName === 'llama-3.3-70b'
        ? 'llama-3.3-70b-versatile'
        : 'llama-3.1-8b-instant';
      return createGroqModel(groqEquivalent as GroqModel);
    }
  }
  // Groq uses 'llama-X.X-XXb-versatile' or 'llama-X.X-XXb-instant' format
  if (modelName.startsWith('llama')) {
    return createGroqModel(modelName as GroqModel);
  }
  throw new Error(`Unknown model: ${modelName}`);
}
