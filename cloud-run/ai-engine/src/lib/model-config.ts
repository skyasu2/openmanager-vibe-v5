/**
 * LangGraph Model Configuration
 *
 * ## Secret Consolidation (2025-12-25)
 * Updated to use consolidated JSON secrets with fallback to legacy env vars
 */

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatGroq } from '@langchain/groq';
import { AI_MODELS } from '../config/models';
import { RateLimitError } from './errors';
import { getGoogleAIConfig, getGroqApiKey } from './config-parser';
import {
  type CircuitBreakerState,
  isModelHealthy,
  recordFailure,
  recordSuccess,
} from './state-definition';

// ============================================================================
// 0. Gemini API Key Failover Manager
// ============================================================================

interface GeminiKeyState {
  primaryExhausted: boolean;
  primaryExhaustedAt?: number;
  recoveryTimeMs: number; // Time to wait before retrying primary key
}

const geminiKeyState: GeminiKeyState = {
  primaryExhausted: false,
  recoveryTimeMs: 60_000, // 1 minute default recovery time
};

/**
 * Get all available Gemini API keys in failover order
 * Uses consolidated JSON secret with fallback to legacy env vars
 */
function getGeminiAPIKeys(): string[] {
  const keys: string[] = [];

  // Try consolidated JSON secret first
  const config = getGoogleAIConfig();
  if (config) {
    if (config.primaryKey) keys.push(config.primaryKey);
    if (config.secondaryKey && config.secondaryKey !== config.primaryKey) {
      keys.push(config.secondaryKey);
    }
    return keys;
  }

  // Fallback to legacy env vars
  const primary =
    process.env.GEMINI_API_KEY_PRIMARY || process.env.GOOGLE_API_KEY;
  if (primary) keys.push(primary);

  const secondary =
    process.env.GEMINI_API_KEY_SECONDARY ||
    process.env.GOOGLE_AI_API_KEY_SECONDARY;
  if (secondary) keys.push(secondary);

  return keys;
}

/**
 * Get the current active Gemini API key with failover logic
 */
export function getActiveGeminiKey(): string {
  const keys = getGeminiAPIKeys();

  if (keys.length === 0) {
    throw new Error(
      'No Gemini API keys configured. Set GEMINI_API_KEY_PRIMARY or GOOGLE_API_KEY'
    );
  }

  // Check if primary key has recovered
  if (geminiKeyState.primaryExhausted && geminiKeyState.primaryExhaustedAt) {
    const elapsed = Date.now() - geminiKeyState.primaryExhaustedAt;
    if (elapsed > geminiKeyState.recoveryTimeMs) {
      console.log(
        '🔄 [Gemini Key] Primary key recovery period elapsed, retrying primary'
      );
      geminiKeyState.primaryExhausted = false;
      geminiKeyState.primaryExhaustedAt = undefined;
    }
  }

  // Use secondary if primary is exhausted and secondary exists
  if (geminiKeyState.primaryExhausted && keys.length > 1) {
    console.log('🔄 [Gemini Key] Using secondary key (primary exhausted)');
    return keys[1];
  }

  return keys[0];
}

/**
 * Mark primary key as exhausted (rate limited)
 */
export function markGeminiKeyExhausted(): void {
  const keys = getGeminiAPIKeys();
  if (keys.length > 1) {
    console.log(
      '⚠️ [Gemini Key] Primary key exhausted, failing over to secondary'
    );
    geminiKeyState.primaryExhausted = true;
    geminiKeyState.primaryExhaustedAt = Date.now();
  } else {
    console.warn(
      '⚠️ [Gemini Key] Primary key exhausted but no secondary key available'
    );
  }
}

/**
 * Reset Gemini key state (for testing or manual recovery)
 */
export function resetGeminiKeyState(): void {
  geminiKeyState.primaryExhausted = false;
  geminiKeyState.primaryExhaustedAt = undefined;
}

/**
 * Get current Gemini key status
 */
export function getGeminiKeyStatus(): {
  totalKeys: number;
  primaryExhausted: boolean;
  usingSecondary: boolean;
  recoveryInMs?: number;
} {
  const keys = getGeminiAPIKeys();
  const usingSecondary = geminiKeyState.primaryExhausted && keys.length > 1;

  let recoveryInMs: number | undefined;
  if (geminiKeyState.primaryExhausted && geminiKeyState.primaryExhaustedAt) {
    const elapsed = Date.now() - geminiKeyState.primaryExhaustedAt;
    recoveryInMs = Math.max(0, geminiKeyState.recoveryTimeMs - elapsed);
  }

  return {
    totalKeys: keys.length,
    primaryExhausted: geminiKeyState.primaryExhausted,
    usingSecondary,
    recoveryInMs,
  };
}

// ============================================================================
// 1. Model Types
// ============================================================================

export type GeminiModel =
  | 'gemini-2.5-flash'
  | 'gemini-2.5-flash-lite'
  | 'gemini-3.0-flash-preview'
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
    provider: 'google' as const, // Gemini for tool calling support
    model: AI_MODELS.FLASH_LITE as GeminiModel, // High Quota (1500 RPD) for Routing
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
  // Task 1: Verifier Agent (Groq 기반 출력 검증)
  verifier: {
    provider: 'groq' as const,
    model: 'llama-3.1-8b-instant' as GroqModel, // 빠른 검증을 위해 8B 모델 사용
    temperature: 0.1, // 결정적 검증을 위해 낮은 온도
    maxOutputTokens: 1024,
  },
} as const;

export type AgentType = keyof typeof AGENT_MODEL_CONFIG;

// ============================================================================
// 3. Model Factory Functions
// ============================================================================

export function createGeminiModel(
  model: GeminiModel = AI_MODELS.FLASH_LITE, // Default to Flash Lite (1,500 RPD) for high availability
  options?: ModelOptions
): ChatGoogleGenerativeAI {
  // Use failover-aware key selection
  const apiKey = getActiveGeminiKey();

  return new ChatGoogleGenerativeAI({
    apiKey,
    model,
    temperature: options?.temperature ?? 0.3,
    maxOutputTokens: options?.maxOutputTokens ?? 1024,
  });
}

/**
 * Invoke Gemini model with automatic failover on rate limit
 * Catches 429 errors and retries with secondary key if available
 */
export async function invokeGeminiWithFailover<T>(
  model: GeminiModel,
  invoker: (geminiModel: ChatGoogleGenerativeAI) => Promise<T>,
  options?: ModelOptions
): Promise<T> {
  const keys = getGeminiAPIKeys();

  for (let attempt = 0; attempt < keys.length; attempt++) {
    try {
      const geminiModel = createGeminiModel(model, options);
      return await invoker(geminiModel);
    } catch (error) {
      if (RateLimitError.isRateLimitError(error)) {
        console.error(`❌ [Gemini] Rate limit hit on attempt ${attempt + 1}`);
        markGeminiKeyExhausted();

        // If we have more keys, continue to next attempt
        if (attempt < keys.length - 1) {
          console.log(`🔄 [Gemini] Retrying with next key...`);
          continue;
        }
      }
      throw error;
    }
  }

  throw new Error('All Gemini API keys exhausted');
}

export function createGroqModel(
  model: GroqModel = 'llama-3.1-8b-instant',
  options?: ModelOptions
): ChatGroq {
  const apiKey = getGroqApiKey();
  if (!apiKey) {
    throw new Error('Groq API key not configured. Set GROQ_API_KEY environment variable.');
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

export function getSupervisorModel(): ChatGoogleGenerativeAI {
  const config = AGENT_MODEL_CONFIG.supervisor;
  return createGeminiModel(config.model as GeminiModel, {
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

export function getReporterModel(): ChatGroq | ChatGoogleGenerativeAI {
  const config = AGENT_MODEL_CONFIG.reporter;
  const isDev = process.env.NODE_ENV === 'development';
  const useGeminiSearch = process.env.REPORTER_USE_GEMINI_SEARCH === 'true';

  // Feature flag: Only use Gemini Search Grounding when explicitly enabled in production
  if (!isDev && useGeminiSearch) {
    try {
      const gemini = new ChatGoogleGenerativeAI({
        apiKey: getActiveGeminiKey(),
        model: 'gemini-2.5-flash',
        temperature: config.temperature,
        maxOutputTokens: config.maxOutputTokens,
      });

      // Note: bindTools with googleSearchRetrieval returns a RunnableBinding
      // but the multi-agent supervisor handles this correctly
      return gemini.bindTools([
        {
          googleSearchRetrieval: {
            dynamicRetrievalConfig: {
              mode: 'MODE_DYNAMIC',
              dynamicThreshold: 0.3,
            },
          },
        },
      ]) as unknown as ChatGoogleGenerativeAI;
    } catch (error) {
      console.warn(
        '⚠️ [getReporterModel] Gemini Search Grounding failed, falling back to Groq:',
        error
      );
      // Fallback to Groq if Gemini fails
    }
  }

  // Default: Use Groq (development or fallback)
  return createGroqModel(config.model, {
    temperature: config.temperature,
    maxOutputTokens: config.maxOutputTokens,
  });
}

// Task 1: Verifier Agent Model (Groq llama-3.1-8b-instant for fast verification)
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
  google: boolean;
  googleSecondary: boolean;
  groq: boolean;
  all: boolean;
} {
  // Use config-parser which supports both JSON secrets and legacy env vars
  const googleConfig = getGoogleAIConfig();
  const groqKey = getGroqApiKey();

  return {
    google: !!googleConfig?.primaryKey,
    googleSecondary: !!googleConfig?.secondaryKey,
    groq: !!groqKey,
    all: !!googleConfig?.primaryKey && !!groqKey,
  };
}

export function logAPIKeyStatus(): void {
  const status = validateAPIKeys();
  const keyStatus = getGeminiKeyStatus();
  console.log('🔑 API Key Status:', {
    'Google AI (Primary)': status.google ? '✅' : '❌',
    'Google AI (Secondary)': status.googleSecondary
      ? '✅ (Failover Ready)'
      : '⚠️ (No Failover)',
    Groq: status.groq ? '✅' : '❌',
  });
  if (keyStatus.usingSecondary) {
    console.log(
      '⚠️ [Gemini Key] Currently using secondary key due to primary rate limit'
    );
  }
}

// ============================================================================
// 6. Circuit Breaker Integration
// ============================================================================

export const MODEL_FALLBACK_CHAIN: Record<string, string[]> = {
  'gemini-2.5-flash-lite': ['gemini-3.0-flash-preview', 'gemini-2.5-flash', 'llama-3.3-70b-versatile'],
  'gemini-2.5-flash': ['gemini-2.5-flash-lite', 'gemini-3.0-flash-preview'],
  'gemini-3.0-flash-preview': ['gemini-2.5-flash-lite', 'llama-3.3-70b-versatile'],
  'gemini-2.5-pro': ['gemini-2.5-flash-lite', 'gemini-2.5-flash'],
  'llama-3.1-8b-instant': ['llama-3.3-70b-versatile', 'gemini-2.5-flash-lite'],
  'llama-3.3-70b-versatile': ['gemini-2.5-flash-lite', 'gemini-3.0-flash-preview'],
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
