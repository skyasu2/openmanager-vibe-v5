/**
 * LangGraph Model Configuration
 */

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatGroq } from '@langchain/groq';
import { AI_MODELS } from '../../config/models';
import { requireAPIKey } from './errors';
import {
  type CircuitBreakerState,
  isModelHealthy,
  recordFailure,
  recordSuccess,
} from './state-definition';

// ============================================================================
// 1. Model Types
// ============================================================================

export type GeminiModel =
  | 'gemini-2.5-flash'
  | 'gemini-2.5-flash-lite'
  | 'gemini-2.5-pro';
export type GroqModel = 'llama-3.1-8b-instant' | 'llama-3.3-70b-versatile';

export interface ModelOptions {
  temperature?: number;
  maxOutputTokens?: number;
}

// ============================================================================
// 2. Model Registry
// ============================================================================

export const AGENT_MODEL_CONFIG = {
  supervisor: {
    provider: 'groq' as const,
    model: 'llama-3.1-8b-instant' as GroqModel,
    temperature: 0.2,
    maxOutputTokens: 512,
  },
  nlq: {
    provider: 'google' as const,
    model: AI_MODELS.FLASH as GeminiModel,
    temperature: 0.3,
    maxOutputTokens: 1024,
  },
  analyst: {
    provider: 'google' as const,
    model: AI_MODELS.PRO as GeminiModel,
    temperature: 0.2,
    maxOutputTokens: 2048,
  },
  reporter: {
    provider: 'groq' as const,
    model: 'llama-3.3-70b-versatile' as GroqModel,
    temperature: 0.3,
    maxOutputTokens: 4096,
  },
} as const;

export type AgentType = keyof typeof AGENT_MODEL_CONFIG;

// ============================================================================
// 3. Model Factory Functions
// ============================================================================

export function createGeminiModel(
  model: GeminiModel = AI_MODELS.FLASH,
  options?: ModelOptions
): ChatGoogleGenerativeAI {
  const apiKey = requireAPIKey(
    'Google AI',
    'GEMINI_API_KEY_PRIMARY',
    'GOOGLE_API_KEY'
  );

  return new ChatGoogleGenerativeAI({
    apiKey,
    model,
    temperature: options?.temperature ?? 0.3,
    maxOutputTokens: options?.maxOutputTokens ?? 1024,
  });
}

export function createGroqModel(
  model: GroqModel = 'llama-3.1-8b-instant',
  options?: ModelOptions
): ChatGroq {
  const apiKey = requireAPIKey('Groq', 'GROQ_API_KEY');

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
): ChatGoogleGenerativeAI | ChatGroq {
  const config = AGENT_MODEL_CONFIG[agentType];

  if (config.provider === 'google') {
    return createGeminiModel(config.model as GeminiModel, {
      temperature: config.temperature,
      maxOutputTokens: config.maxOutputTokens,
    });
  }

  return createGroqModel(config.model as GroqModel, {
    temperature: config.temperature,
    maxOutputTokens: config.maxOutputTokens,
  });
}

export function getSupervisorModel(): ChatGroq {
  const config = AGENT_MODEL_CONFIG.supervisor;
  return createGroqModel(config.model, {
    temperature: config.temperature,
    maxOutputTokens: config.maxOutputTokens,
  });
}

export function getNLQModel(): ChatGoogleGenerativeAI {
  const config = AGENT_MODEL_CONFIG.nlq;
  return createGeminiModel(config.model as GeminiModel, {
    temperature: config.temperature,
    maxOutputTokens: config.maxOutputTokens,
  });
}

export function getAnalystModel(): ChatGoogleGenerativeAI {
  const config = AGENT_MODEL_CONFIG.analyst;
  return createGeminiModel(config.model as GeminiModel, {
    temperature: config.temperature,
    maxOutputTokens: config.maxOutputTokens,
  });
}

export function getReporterModel(): ChatGroq {
  const config = AGENT_MODEL_CONFIG.reporter;
  return createGroqModel(config.model, {
    temperature: config.temperature,
    maxOutputTokens: config.maxOutputTokens,
  });
}

// ============================================================================
// 5. API Key Validation
// ============================================================================

export function validateAPIKeys(): {
  google: boolean;
  groq: boolean;
  all: boolean;
} {
  const googleKey =
    process.env.GEMINI_API_KEY_PRIMARY || process.env.GOOGLE_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  return {
    google: !!googleKey,
    groq: !!groqKey,
    all: !!googleKey && !!groqKey,
  };
}

export function logAPIKeyStatus(): void {
  const status = validateAPIKeys();
  console.log('🔑 API Key Status:', {
    'Google AI': status.google ? '✅' : '❌',
    Groq: status.groq ? '✅' : '❌',
  });
}

// ============================================================================
// 6. Circuit Breaker Integration
// ============================================================================

export const MODEL_FALLBACK_CHAIN: Record<string, string[]> = {
  'gemini-2.5-flash': ['gemini-2.5-pro', 'llama-3.3-70b-versatile'],
  'gemini-2.5-flash-lite': ['gemini-2.5-flash', 'llama-3.3-70b-versatile'],
  'gemini-2.5-pro': ['gemini-2.5-flash', 'llama-3.3-70b-versatile'],
  'llama-3.1-8b-instant': ['llama-3.3-70b-versatile', 'gemini-2.5-flash'],
  'llama-3.3-70b-versatile': ['gemini-2.5-pro', 'gemini-2.5-flash'],
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
  invoker: (model: ChatGoogleGenerativeAI | ChatGroq) => Promise<T>
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
      // console.error(
      //   `❌ [Circuit Breaker] ${tryModel} failed:`,
      //   lastError.message
      // );
    }
  }

  throw lastError || new Error('All models in fallback chain failed');
}

function createModelByName(
  modelName: string
): ChatGoogleGenerativeAI | ChatGroq {
  if (modelName.startsWith('gemini')) {
    return createGeminiModel(modelName as GeminiModel);
  }
  if (modelName.startsWith('llama')) {
    return createGroqModel(modelName as GroqModel);
  }
  throw new Error(`Unknown model: ${modelName}`);
}
