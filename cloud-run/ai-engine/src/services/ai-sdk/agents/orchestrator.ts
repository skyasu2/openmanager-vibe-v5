/**
 * Multi-Agent Orchestrator
 *
 * Routes user queries to specialized agents using pattern matching and LLM.
 * Uses Cerebras for ultra-fast routing decisions (~200ms).
 *
 * Architecture:
 * Orchestrator (Cerebras) → NLQ/Analyst/Reporter/Advisor (Groq/Mistral)
 *
 * @version 1.0.0
 */

import { Agent } from '@ai-sdk-tools/agents';
import { getCerebrasModel, getGroqModel, checkProviderStatus } from '../model-provider';
import { nlqAgent } from './nlq-agent';
import { analystAgent } from './analyst-agent';
import { reporterAgent } from './reporter-agent';
import { advisorAgent } from './advisor-agent';

// ============================================================================
// Types
// ============================================================================

export interface MultiAgentRequest {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  sessionId: string;
  enableTracing?: boolean;
}

export interface MultiAgentResponse {
  success: boolean;
  response: string;
  handoffs: Array<{
    from: string;
    to: string;
    reason?: string;
  }>;
  finalAgent: string;
  toolsCalled: string[];
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata: {
    provider: string;
    modelId: string;
    totalRounds: number;
    durationMs: number;
  };
}

export interface MultiAgentError {
  success: false;
  error: string;
  code: string;
}

// ============================================================================
// Orchestrator Instructions
// ============================================================================

const ORCHESTRATOR_INSTRUCTIONS = `당신은 서버 모니터링 AI 시스템의 오케스트레이터입니다.

## 역할
사용자의 질문을 분석하여 가장 적합한 전문 에이전트에게 라우팅합니다.

## 전문 에이전트

### 1. NLQ Agent (자연어 질의)
- 서버 상태 조회, 메트릭 질의
- "서버 상태", "CPU 높은 서버", "메모리 사용률"
- 복잡한 조건 필터링, 집계, 비교

### 2. Analyst Agent (분석)
- 이상 탐지, 트렌드 예측, 패턴 분석
- "이상 있어?", "향후 예측", "원인 분석"
- 근본 원인 분석 (RCA)

### 3. Reporter Agent (보고서)
- 장애 보고서 생성, 타임라인 구성
- "보고서 만들어줘", "장애 요약", "인시던트 정리"

### 4. Advisor Agent (조언)
- 해결 방법 안내, 명령어 추천
- "어떻게 해결해?", "명령어 알려줘", "과거 사례"
- GraphRAG 기반 지식 검색

## 라우팅 규칙
1. 질문의 핵심 의도 파악
2. 가장 적합한 에이전트 선택
3. 불명확한 경우 NLQ Agent로 기본 라우팅
4. 복합 질문은 주요 의도 기준으로 라우팅

## 예시
- "서버 상태 알려줘" → NLQ Agent
- "이상 징후 분석해줘" → Analyst Agent
- "장애 보고서 작성해줘" → Reporter Agent
- "메모리 부족 해결 방법" → Advisor Agent
`;

// ============================================================================
// Orchestrator Instance
// ============================================================================

/**
 * Get orchestrator model with fallback
 * Primary: Cerebras (fastest)
 * Fallback: Groq (stable)
 * Returns null if no model available (graceful degradation)
 */
function getOrchestratorModel(): { model: ReturnType<typeof getCerebrasModel>; provider: string; modelId: string } | null {
  const status = checkProviderStatus();

  if (status.cerebras) {
    try {
      return {
        model: getCerebrasModel('llama-3.3-70b'),
        provider: 'cerebras',
        modelId: 'llama-3.3-70b',
      };
    } catch {
      console.warn('⚠️ [Orchestrator] Cerebras unavailable, falling back to Groq');
    }
  }

  if (status.groq) {
    return {
      model: getGroqModel('llama-3.3-70b-versatile'),
      provider: 'groq',
      modelId: 'llama-3.3-70b-versatile',
    };
  }

  console.warn('⚠️ [Orchestrator] No model available (need CEREBRAS_API_KEY or GROQ_API_KEY)');
  return null;
}

// Get model config at startup
const orchestratorModelConfig = getOrchestratorModel();

// Filter out null agents for handoffs
const availableAgents = [nlqAgent, analystAgent, reporterAgent, advisorAgent].filter(
  (agent): agent is NonNullable<typeof agent> => agent !== null
);

/**
 * Main Orchestrator Agent (null if no model available)
 */
export const orchestrator = orchestratorModelConfig
  ? (() => {
      console.log(`🎯 [Orchestrator] Initialized with ${orchestratorModelConfig.provider}/${orchestratorModelConfig.modelId}`);
      console.log(`📋 [Orchestrator] Available agents: ${availableAgents.length}`);
      return new Agent({
        name: 'OpenManager Orchestrator',
        model: orchestratorModelConfig.model,
        instructions: ORCHESTRATOR_INSTRUCTIONS,
        handoffs: availableAgents,
        maxTurns: 10,
      });
    })()
  : null;

// ============================================================================
// Execution Function
// ============================================================================

/**
 * Execute multi-agent system
 */
export async function executeMultiAgent(
  request: MultiAgentRequest
): Promise<MultiAgentResponse | MultiAgentError> {
  const startTime = Date.now();

  // Check if orchestrator is available
  if (!orchestrator || !orchestratorModelConfig) {
    return {
      success: false,
      error: 'Orchestrator not available (no AI provider configured)',
      code: 'MODEL_UNAVAILABLE',
    };
  }

  try {
    const { provider, modelId } = orchestratorModelConfig;

    console.log(`🎯 [Orchestrator] Starting with ${provider}/${modelId}`);

    // Build prompt from messages
    const lastUserMessage = request.messages
      .filter((m) => m.role === 'user')
      .pop();

    if (!lastUserMessage) {
      return {
        success: false,
        error: 'No user message found',
        code: 'INVALID_REQUEST',
      };
    }

    // Execute orchestrator with automatic handoffs
    const result = await orchestrator.generate({
      prompt: lastUserMessage.content,
    });

    const durationMs = Date.now() - startTime;

    // Extract handoff information
    const handoffs = result.handoffs?.map((h) => ({
      from: 'Orchestrator',
      to: h.targetAgent || 'Unknown',
      reason: h.reason,
    })) || [];

    // Extract tool calls from all steps
    const toolsCalled: string[] = [];
    if (result.steps) {
      for (const step of result.steps) {
        if (step.toolCalls) {
          for (const tc of step.toolCalls) {
            toolsCalled.push(tc.toolName);
          }
        }
      }
    }

    console.log(
      `✅ [Orchestrator] Completed in ${durationMs}ms, final agent: ${result.finalAgent}, tools: [${toolsCalled.join(', ')}]`
    );

    return {
      success: true,
      response: result.text,
      handoffs,
      finalAgent: result.finalAgent || 'Orchestrator',
      toolsCalled,
      usage: {
        promptTokens: result.usage?.inputTokens ?? 0,
        completionTokens: result.usage?.outputTokens ?? 0,
        totalTokens: result.usage?.totalTokens ?? 0,
      },
      metadata: {
        provider,
        modelId,
        totalRounds: (result.handoffs?.length ?? 0) + 1,
        durationMs,
      },
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error(`❌ [Orchestrator] Error after ${durationMs}ms:`, errorMessage);

    // Classify error
    let code = 'UNKNOWN_ERROR';
    if (errorMessage.includes('API key')) {
      code = 'AUTH_ERROR';
    } else if (errorMessage.includes('rate limit')) {
      code = 'RATE_LIMIT';
    } else if (errorMessage.includes('timeout')) {
      code = 'TIMEOUT';
    } else if (errorMessage.includes('model')) {
      code = 'MODEL_ERROR';
    }

    return {
      success: false,
      error: errorMessage,
      code,
    };
  }
}

export default orchestrator;
