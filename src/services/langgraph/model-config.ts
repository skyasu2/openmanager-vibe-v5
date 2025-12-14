/**
 * LangGraph Model Configuration
 * 중앙 집중식 모델 설정 관리
 *
 * LangChain 패키지를 사용 (LangGraph StateGraph 호환)
 * - @langchain/google-genai: Gemini 모델
 * - @langchain/groq: Groq (Llama) 모델
 */

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatGroq } from '@langchain/groq';
import { AI_MODELS } from '@/config/ai-engine';
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

/**
 * Agent별 기본 모델 설정
 */
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

/**
 * Google Gemini 모델 생성
 * @throws {APIKeyMissingError} API 키가 없을 경우
 */
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

/**
 * Groq (Llama) 모델 생성
 * @throws {APIKeyMissingError} API 키가 없을 경우
 */
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

/**
 * 에이전트 타입에 맞는 모델 생성
 */
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

/**
 * Supervisor Agent용 모델
 */
export function getSupervisorModel(): ChatGroq {
  const config = AGENT_MODEL_CONFIG.supervisor;
  return createGroqModel(config.model, {
    temperature: config.temperature,
    maxOutputTokens: config.maxOutputTokens,
  });
}

/**
 * NLQ Agent용 모델
 */
export function getNLQModel(): ChatGoogleGenerativeAI {
  const config = AGENT_MODEL_CONFIG.nlq;
  return createGeminiModel(config.model as GeminiModel, {
    temperature: config.temperature,
    maxOutputTokens: config.maxOutputTokens,
  });
}

/**
 * Analyst Agent용 모델
 */
export function getAnalystModel(): ChatGoogleGenerativeAI {
  const config = AGENT_MODEL_CONFIG.analyst;
  return createGeminiModel(config.model as GeminiModel, {
    temperature: config.temperature,
    maxOutputTokens: config.maxOutputTokens,
  });
}

/**
 * Reporter Agent용 모델
 */
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

/**
 * 모든 필수 API 키 존재 여부 확인
 * 시작 시점에 호출하여 설정 검증
 */
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

/**
 * API 키 상태 로깅 (개발용)
 */
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

/**
 * 폴백 체인 정의
 * 각 모델이 실패할 경우 다음 모델로 전환
 */
export const MODEL_FALLBACK_CHAIN: Record<string, string[]> = {
  // Gemini Flash → Pro → Groq Llama
  'gemini-2.5-flash': ['gemini-2.5-pro', 'llama-3.3-70b-versatile'],
  'gemini-2.5-flash-lite': ['gemini-2.5-flash', 'llama-3.3-70b-versatile'],
  'gemini-2.5-pro': ['gemini-2.5-flash', 'llama-3.3-70b-versatile'],
  // Groq Llama → Gemini
  'llama-3.1-8b-instant': ['llama-3.3-70b-versatile', 'gemini-2.5-flash'],
  'llama-3.3-70b-versatile': ['gemini-2.5-pro', 'gemini-2.5-flash'],
};

/**
 * 건강한 모델 선택 (Circuit Breaker 적용)
 * @param preferredModel 선호 모델
 * @param circuitState Circuit Breaker 상태
 * @returns 사용 가능한 모델 ID
 */
export function selectHealthyModel(
  preferredModel: string,
  circuitState: CircuitBreakerState
): string {
  // 선호 모델이 건강하면 그대로 사용
  if (isModelHealthy(circuitState, preferredModel)) {
    return preferredModel;
  }

  console.log(
    `⚠️ [Circuit Breaker] ${preferredModel} is unhealthy, trying fallback`
  );

  // 폴백 체인에서 건강한 모델 찾기
  const fallbackChain = MODEL_FALLBACK_CHAIN[preferredModel] || [];
  for (const fallbackModel of fallbackChain) {
    if (isModelHealthy(circuitState, fallbackModel)) {
      console.log(`✅ [Circuit Breaker] Using fallback: ${fallbackModel}`);
      return fallbackModel;
    }
  }

  // 모든 모델이 unhealthy면 선호 모델로 다시 시도 (half-open)
  console.log(
    `⚠️ [Circuit Breaker] All fallbacks unhealthy, retrying ${preferredModel}`
  );
  return preferredModel;
}

/**
 * Circuit Breaker 래퍼로 모델 호출
 * 실패 시 자동으로 폴백 모델 시도
 */
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

  // 선택된 모델과 폴백 체인 시도
  const modelsToTry = [
    healthyModel,
    ...(MODEL_FALLBACK_CHAIN[healthyModel] || []),
  ];

  for (const tryModel of modelsToTry) {
    if (
      !isModelHealthy(currentCircuitState, tryModel) &&
      tryModel !== modelsToTry[0]
    ) {
      continue; // 이미 unhealthy한 폴백은 건너뛰기
    }

    try {
      const model = createModelByName(tryModel);
      const result = await invoker(model);

      // 성공 시 Circuit Breaker 상태 업데이트
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
      console.error(
        `❌ [Circuit Breaker] ${tryModel} failed:`,
        lastError.message
      );
    }
  }

  // 모든 모델 실패
  throw lastError || new Error('All models in fallback chain failed');
}

/**
 * 모델 이름으로 인스턴스 생성
 */
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
