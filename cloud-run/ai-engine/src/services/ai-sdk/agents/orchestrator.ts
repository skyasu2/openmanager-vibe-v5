/**
 * Multi-Agent Orchestrator
 *
 * Routes user queries to specialized agents using pattern matching and LLM.
 * Uses Cerebras for ultra-fast routing decisions (~200ms).
 *
 * Architecture:
 * Orchestrator (Cerebras) → NLQ/Analyst/Reporter/Advisor (Cerebras/Groq/Mistral)
 *
 * @version 2.1.0 - Removed Summarizer Agent (merged into NLQ)
 * @updated 2026-01-12 - OpenRouter and Summarizer Agent removed
 */

import { Agent } from '@ai-sdk-tools/agents';
import { generateText, stepCountIs } from 'ai';
import { getCerebrasModel, getGroqModel, getMistralModel, checkProviderStatus, type ProviderName } from '../model-provider';
import { generateTextWithRetry } from '../../resilience/retry-with-fallback';
import { sanitizeChineseCharacters } from '../../../lib/text-sanitizer';
import type { StreamEvent } from '../supervisor';
import { logTimeoutEvent, createTimeoutSpan } from '../../observability/langfuse';
import { nlqAgent } from './nlq-agent';
import { analystAgent } from './analyst-agent';
import { reporterAgent } from './reporter-agent';
import { advisorAgent } from './advisor-agent';

// Import SSOT config
import { AGENT_CONFIGS } from './config';

// ============================================================================
// Configuration
// ============================================================================

/**
 * Orchestrator timeout configuration
 * - Multi-agent queries can take 20-60s with multiple handoffs
 * - Set generous timeout but prevent infinite hangs
 */
const ORCHESTRATOR_CONFIG = {
  /** Maximum execution time (ms) - 50s for Vercel 60s limit compliance */
  timeout: 50_000,
  /** Warning threshold (ms) - log warning if execution exceeds this */
  warnThreshold: 25_000,
};

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

const ORCHESTRATOR_INSTRUCTIONS = `당신은 **서버 모니터링 플랫폼 (OpenManager)** 의 AI 오케스트레이터입니다.

## ⚠️ 중요 컨텍스트
- 이 시스템은 **IT 인프라/서버 모니터링** 전용입니다
- "장애"는 **서버 장애/시스템 장애**를 의미합니다 (역사적 재앙/질병 아님)
- "사례"는 **과거 서버 인시던트 기록**을 의미합니다
  - 예: "2024-01 DB 서버 OOM 장애", "CPU 스파이크로 인한 서비스 다운타임"
  - Knowledge Base에 저장된 트러블슈팅 이력 참조
- 모든 질문은 서버/인프라 관점에서 해석하세요

## 핵심 역할 (듀얼 모드)
1. **일반 질문**: 직접 빠르게 답변
2. **서버/모니터링 관련**: 전문 에이전트에게 핸드오프

## 1단계: 질문 분류

### 직접 답변 (핸드오프 없이 바로 응답)
다음 유형의 질문은 **직접 답변**하세요:
- 인사말: "안녕", "하이", "헬로", "반가워"
- 날씨: "오늘 날씨", "날씨 어때"
- 날짜/시간: "오늘 몇일", "지금 몇시", "오늘 요일"
- 일반 대화: "고마워", "잘가", "수고해"
- 시스템 소개: "넌 뭐야", "뭘 할 수 있어", "도움말"

**직접 답변 예시**:
- "안녕" → "안녕하세요! 서버 모니터링 AI입니다. 서버 상태, 이상 탐지, 장애 분석 등을 도와드립니다."
- "오늘 몇일이야" → "오늘은 [날짜]입니다."
- "넌 뭐야" → "저는 OpenManager 서버 모니터링 AI입니다. 서버 상태 조회, 이상 탐지, 장애 보고서 생성 등을 지원합니다."

### 핸드오프 대상 (전문 에이전트 위임)
다음 키워드가 포함된 **서버/모니터링 관련** 질문만 핸드오프:

#### NLQ Agent - 서버 데이터 질의
**키워드**: 서버, 상태, CPU, 메모리, 디스크, 목록, 조회, 몇 대, 어떤 서버, 평균, 최대, 최소, 지난, 시간
- "서버 상태 알려줘" → NLQ Agent
- "CPU 높은 서버" → NLQ Agent
- "지난 6시간 CPU 평균" → NLQ Agent (시간 범위 집계)
- "전체 서버 메모리 최대값" → NLQ Agent

#### Analyst Agent - 이상 탐지/분석
**키워드**: 이상, 분석, 예측, 트렌드, 패턴, 원인, 왜 (서버/시스템 관련)
- "이상 있어?" → Analyst Agent
- "왜 느려졌어?" → Analyst Agent

#### Reporter Agent - 보고서 생성
**키워드**: 보고서, 리포트, 타임라인, 장애 요약, 인시던트
- "장애 보고서 만들어줘" → Reporter Agent

#### Advisor Agent - 해결 방법 안내
**키워드**: 해결, 방법, 명령어, 가이드, 과거 사례 (서버 관련)
- "메모리 부족 해결 방법" → Advisor Agent

## 2단계: 판단 기준

**핸드오프 여부 결정 플로우**:
1. 서버/CPU/메모리/디스크/장애/모니터링 키워드가 있는가?
   - 없음 → 직접 답변
   - 있음 → 2번으로
2. 어떤 전문 에이전트가 적합한가?
   - 데이터 조회/요약 → NLQ Agent (요약 포함)
   - 이상/분석 → Analyst Agent
   - 보고서 → Reporter Agent
   - 해결법 → Advisor Agent

## 중요 규칙
1. **일반 대화는 빠르게 직접 답변** (핸드오프 금지)
2. **서버 관련 질문만 핸드오프**
3. 불명확하지만 서버 관련인 것 같으면 → NLQ Agent
4. 핸드오프 시 reason 명시
5. **한국어로 응답 / Respond in Korean** (한자 절대 금지 / No Chinese characters, 러시아어/독일어/일본어/베트남어 등 다른 언어 금지, 기술용어는 영어 허용)
`;

// ============================================================================
// Rule-based Pre-filter (Fast Path)
// ============================================================================

/**
 * Intent classification for fast routing
 * Returns direct response if applicable, otherwise null for LLM routing
 */
interface PreFilterResult {
  shouldHandoff: boolean;
  directResponse?: string;
  suggestedAgent?: string;
  confidence: number;
}

const GREETING_PATTERNS = [
  /^(안녕하세요|안녕|하이|헬로|hi|hello|hey|반가워|좋은\s*(아침|오후|저녁))[\s!?.]*$/i,
  /^(고마워|감사합니다|감사|ㄱㅅ|수고|잘가|바이|bye|thanks)[\s!?.]*$/i,
];

const GENERAL_PATTERNS = [
  /^(오늘|지금)\s*(날씨|몇\s*일|몇\s*시|요일|며칠)[\s?]*$/i,
  /^(넌|너는?|뭐야|누구|뭘\s*할\s*수|도움말|help|도와줘)[\s?]*$/i,
  /^(테스트|ping|echo)[\s?]*$/i,
];

const SERVER_KEYWORDS = [
  '서버', 'cpu', '메모리', '디스크', 'memory', 'disk', '상태',
  '이상', '분석', '예측', '트렌드', '장애', '보고서', '리포트',
  '해결', '명령어', '요약', '모니터링', 'server', '알람', '경고',
  '평균', '최대', '최소', '지난', '시간', '전체',
  // 추가: 장애 사례, 이력 관련 키워드
  '사례', '이력', '과거', '유사', '인시던트', 'incident',
];

/**
 * Fast pre-filter before LLM routing
 * Handles simple queries without LLM call
 */
export function preFilterQuery(query: string): PreFilterResult {
  const normalized = query.trim().toLowerCase();

  // 1. Check greeting patterns - direct response
  for (const pattern of GREETING_PATTERNS) {
    if (pattern.test(query)) {
      return {
        shouldHandoff: false,
        directResponse: '안녕하세요! 서버 모니터링 AI입니다. 서버 상태, 이상 탐지, 장애 분석 등을 도와드립니다. 무엇을 도와드릴까요?',
        confidence: 0.95,
      };
    }
  }

  // 2. Check general patterns - direct response
  for (const pattern of GENERAL_PATTERNS) {
    if (pattern.test(query)) {
      // Date query
      if (/날짜|몇\s*일|며칠/.test(query)) {
        const today = new Date().toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          weekday: 'long',
        });
        return {
          shouldHandoff: false,
          directResponse: `오늘은 ${today}입니다.`,
          confidence: 0.95,
        };
      }
      // Time query
      if (/몇\s*시/.test(query)) {
        const now = new Date().toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
        });
        return {
          shouldHandoff: false,
          directResponse: `현재 시간은 ${now}입니다.`,
          confidence: 0.95,
        };
      }
      // Identity query
      if (/넌|너는?|뭐야|누구/.test(query)) {
        return {
          shouldHandoff: false,
          directResponse: '저는 OpenManager 서버 모니터링 AI입니다. 서버 상태 조회, 이상 탐지, 트렌드 예측, 장애 보고서 생성 등을 지원합니다.',
          confidence: 0.95,
        };
      }
      // Help query
      if (/도움말|help|뭘\s*할\s*수/.test(query)) {
        return {
          shouldHandoff: false,
          directResponse: `다음과 같은 기능을 제공합니다:
• **서버 상태 조회**: "서버 상태 알려줘", "CPU 높은 서버"
• **이상 탐지**: "이상 있어?", "문제 서버 찾아줘"
• **트렌드 분석**: "트렌드 예측해줘"
• **장애 보고서**: "장애 보고서 만들어줘"
• **해결 방법**: "메모리 부족 해결 방법"`,
          confidence: 0.95,
        };
      }
      // Test/ping
      if (/테스트|ping|echo/.test(query)) {
        return {
          shouldHandoff: false,
          directResponse: 'Pong! 서버 모니터링 AI가 정상 동작 중입니다.',
          confidence: 0.95,
        };
      }
    }
  }

  // 3. Check for server-related keywords - needs handoff
  const hasServerKeyword = SERVER_KEYWORDS.some(kw => normalized.includes(kw));

  if (hasServerKeyword) {
    // Suggest agent based on keywords
    let suggestedAgent = 'NLQ Agent';
    if (/이상|분석|예측|트렌드|패턴|원인|왜/.test(query)) {
      suggestedAgent = 'Analyst Agent';
    } else if (/보고서|리포트|타임라인|인시던트/.test(query)) {
      suggestedAgent = 'Reporter Agent';
    } else if (/해결|방법|명령어|가이드|어떻게|과거.*사례|사례.*찾|이력|유사/.test(query)) {
      suggestedAgent = 'Advisor Agent';
    }
    // Note: Summary requests (요약, 간단히, 핵심, TL;DR) now handled by NLQ Agent (default)

    return {
      shouldHandoff: true,
      suggestedAgent,
      confidence: 0.8,
    };
  }

  // 4. Unknown - let LLM decide
  return {
    shouldHandoff: true, // Let orchestrator LLM decide
    confidence: 0.5,
  };
}

// ============================================================================
// Orchestrator Instance
// ============================================================================

/**
 * Get orchestrator model with 3-way fallback
 * Cerebras → Groq → Mistral
 * Ensures operation even if 2 of 3 providers are down
 */
function getOrchestratorModel(): { model: ReturnType<typeof getCerebrasModel>; provider: string; modelId: string } | null {
  const status = checkProviderStatus();

  // Primary: Cerebras (fastest routing ~200ms)
  if (status.cerebras) {
    try {
      return {
        model: getCerebrasModel('llama-3.3-70b'),
        provider: 'cerebras',
        modelId: 'llama-3.3-70b',
      };
    } catch {
      console.warn('⚠️ [Orchestrator] Cerebras unavailable, trying Groq');
    }
  }

  // Fallback 1: Groq (stable)
  if (status.groq) {
    try {
      return {
        model: getGroqModel('llama-3.3-70b-versatile'),
        provider: 'groq',
        modelId: 'llama-3.3-70b-versatile',
      };
    } catch {
      console.warn('⚠️ [Orchestrator] Groq unavailable, trying Mistral');
    }
  }

  // Fallback 2: Mistral (last resort)
  if (status.mistral) {
    try {
      return {
        model: getMistralModel('mistral-small-2506'),
        provider: 'mistral',
        modelId: 'mistral-small-2506',
      };
    } catch {
      console.warn('⚠️ [Orchestrator] Mistral unavailable');
    }
  }

  console.warn('⚠️ [Orchestrator] No model available (all 3 providers down)');
  return null;
}

// Get model config at startup
const orchestratorModelConfig = getOrchestratorModel();

// Filter out null agents for handoffs
const availableAgents = [nlqAgent, analystAgent, reporterAgent, advisorAgent].filter(
  (agent): agent is NonNullable<typeof agent> => agent !== null
);

// ⚠️ Critical validation: Ensure at least one agent is available
if (availableAgents.length === 0) {
  console.error('❌ [CRITICAL] No agents available! Check API keys: CEREBRAS_API_KEY, GROQ_API_KEY, MISTRAL_API_KEY');
}

// Track handoff events for debugging
const handoffEvents: Array<{ from: string; to: string; reason?: string; timestamp: Date }> = [];

/**
 * Main Orchestrator Agent (null if no model available)
 */
export const orchestrator = orchestratorModelConfig
  ? (() => {
      console.log(`🎯 [Orchestrator] Initialized with ${orchestratorModelConfig.provider}/${orchestratorModelConfig.modelId}`);
      console.log(`📋 [Orchestrator] Available agents: ${availableAgents.length} - [${availableAgents.map(a => a.name).join(', ')}]`);
      return new Agent({
        name: 'OpenManager Orchestrator',
        model: orchestratorModelConfig.model,
        instructions: ORCHESTRATOR_INSTRUCTIONS,
        handoffs: availableAgents,
        maxTurns: 10,
        // Track agent lifecycle events
        onEvent: async (event) => {
          switch (event.type) {
            case 'agent-handoff':
              console.log(`🔀 [Handoff] ${event.from} → ${event.to} (${event.reason || 'no reason'})`);
              handoffEvents.push({
                from: event.from,
                to: event.to,
                reason: event.reason,
                timestamp: new Date(),
              });
              break;
            case 'agent-start':
              console.log(`▶️ [Agent Start] ${event.agent} (round ${event.round})`);
              break;
            case 'agent-finish':
              console.log(`✅ [Agent Finish] ${event.agent} (round ${event.round})`);
              break;
          }
        },
      });
    })()
  : null;

/**
 * Get recent handoff events (for debugging)
 */
export function getRecentHandoffs() {
  return handoffEvents.slice(-10);
}

// ============================================================================
// Forced Routing (Bypass LLM for high-confidence pre-filter)
// ============================================================================

// NOTE: AGENT_CONFIGS is now imported from './config' (SSOT)
// This eliminates DRY violation where configs were duplicated here and in agent files

/**
 * Get agent instance by name (dynamic lookup for lazy initialization)
 * This ensures agents are available even if initialized after module load
 */
function getAgentByName(name: string): typeof nlqAgent | null {
  const agents: Record<string, typeof nlqAgent | null> = {
    'NLQ Agent': nlqAgent,
    'Analyst Agent': analystAgent,
    'Reporter Agent': reporterAgent,
    'Advisor Agent': advisorAgent,
  };
  return agents[name] ?? null;
}

/**
 * Get preferred provider order for an agent
 * Different agents have different optimal provider orders
 */
function getAgentProviderOrder(agentName: string): ProviderName[] {
  switch (agentName) {
    case 'NLQ Agent':
      return ['cerebras', 'groq', 'mistral'];
    case 'Analyst Agent':
    case 'Reporter Agent':
      return ['groq', 'cerebras', 'mistral'];
    case 'Advisor Agent':
      return ['mistral', 'groq', 'cerebras'];
    default:
      return ['cerebras', 'groq', 'mistral'];
  }
}

/**
 * Execute forced routing to a specific agent with retry and fallback
 *
 * Uses generateTextWithRetry for automatic 429 handling and provider fallback.
 * If primary provider hits rate limit, automatically switches to fallback.
 *
 * @returns MultiAgentResponse if successful, null if all providers exhausted
 */
async function executeForcedRouting(
  query: string,
  suggestedAgentName: string,
  startTime: number
): Promise<MultiAgentResponse | null> {
  console.log(`🔍 [Forced Routing] Looking up agent config: "${suggestedAgentName}"`);

  // Get agent configuration
  const agentConfig = AGENT_CONFIGS[suggestedAgentName];

  if (!agentConfig) {
    console.warn(`⚠️ [Forced Routing] No config for "${suggestedAgentName}"`);
    return null;
  }

  // Get preferred provider order for this agent
  const providerOrder = getAgentProviderOrder(suggestedAgentName);
  console.log(`🎯 [Forced Routing] Using retry with fallback: [${providerOrder.join(' → ')}]`);

  try {
    // Use generateTextWithRetry for automatic 429 handling
    const retryResult = await generateTextWithRetry(
      {
        messages: [
          { role: 'system', content: agentConfig.instructions },
          { role: 'user', content: query },
        ],
        tools: agentConfig.tools as Parameters<typeof generateText>[0]['tools'],
        stopWhen: stepCountIs(5),
        temperature: 0.2,
        maxOutputTokens: 2048,
      },
      providerOrder,
      { timeoutMs: 60000 }
    );

    if (!retryResult.success || !retryResult.result) {
      console.warn(`⚠️ [Forced Routing] All providers failed for ${suggestedAgentName}`);
      // Log attempt details
      for (const attempt of retryResult.attempts) {
        console.log(`   - ${attempt.provider}: ${attempt.error || 'unknown error'}`);
      }
      return null;
    }

    const { result, provider, modelId, usedFallback, attempts } = retryResult;
    const durationMs = Date.now() - startTime;

    // Extract tool calls from steps
    const toolsCalled: string[] = [];
    for (const step of result.steps) {
      for (const toolCall of step.toolCalls) {
        toolsCalled.push(toolCall.toolName);
      }
    }

    // Sanitize response
    const sanitizedResponse = sanitizeChineseCharacters(result.text);

    // Log fallback info if used
    if (usedFallback) {
      console.log(`🔀 [Forced Routing] Used fallback: ${attempts.map(a => a.provider).join(' → ')}`);
    }

    console.log(
      `✅ [Forced Routing] ${suggestedAgentName} completed in ${durationMs}ms via ${provider}, tools: [${toolsCalled.join(', ')}]`
    );

    return {
      success: true,
      response: sanitizedResponse,
      handoffs: [{
        from: 'Orchestrator',
        to: suggestedAgentName,
        reason: usedFallback
          ? `Forced routing with fallback (${attempts.length} attempts)`
          : 'Forced routing (high confidence pre-filter)',
      }],
      finalAgent: suggestedAgentName,
      toolsCalled,
      usage: {
        promptTokens: result.usage?.inputTokens ?? 0,
        completionTokens: result.usage?.outputTokens ?? 0,
        totalTokens: result.usage?.totalTokens ?? 0,
      },
      metadata: {
        provider,
        modelId,
        totalRounds: attempts.length,
        durationMs,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ [Forced Routing] ${suggestedAgentName} failed:`, errorMessage);
    return null;
  }
}

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

  const query = lastUserMessage.content;

  // =========================================================================
  // Fast Path: Rule-based pre-filter for simple queries
  // =========================================================================
  const preFilterResult = preFilterQuery(query);

  // Debug logging for routing decisions
  console.log(`📋 [PreFilter] Query: "${query.substring(0, 50)}..." → Suggested: ${preFilterResult.suggestedAgent || 'none'} (confidence: ${preFilterResult.confidence})`);

  if (!preFilterResult.shouldHandoff && preFilterResult.directResponse) {
    const durationMs = Date.now() - startTime;
    console.log(`⚡ [Fast Path] Direct response in ${durationMs}ms (confidence: ${preFilterResult.confidence})`);

    return {
      success: true,
      response: preFilterResult.directResponse,
      handoffs: [],
      finalAgent: 'Orchestrator (Fast Path)',
      toolsCalled: [],
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      },
      metadata: {
        provider: 'rule-based',
        modelId: 'prefilter',
        totalRounds: 1,
        durationMs,
      },
    };
  }

  // =========================================================================
  // Forced Routing: Bypass LLM when pre-filter confidence is high
  // =========================================================================
  console.log(`🔍 [Orchestrator] Forced routing check: suggestedAgent=${preFilterResult.suggestedAgent}, confidence=${preFilterResult.confidence}`);

  if (preFilterResult.suggestedAgent && preFilterResult.confidence >= 0.8) {
    console.log(`🚀 [Orchestrator] Triggering forced routing to ${preFilterResult.suggestedAgent}`);
    const forcedResult = await executeForcedRouting(
      query,
      preFilterResult.suggestedAgent,
      startTime
    );
    if (forcedResult) {
      console.log(`✅ [Orchestrator] Forced routing succeeded`);
      return forcedResult;
    }
    // If forced routing fails, fall through to LLM routing
    console.log('🔄 [Orchestrator] Forced routing failed, falling back to LLM routing');
  } else {
    console.log(`⏭️ [Orchestrator] Skipping forced routing (conditions not met)`);
  }

  // =========================================================================
  // Slow Path: LLM-based routing for complex queries
  // =========================================================================

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

    console.log(`🎯 [Orchestrator] LLM routing with ${provider}/${modelId} (suggested: ${preFilterResult.suggestedAgent || 'none'})`);

    // Enhance prompt with suggested agent hint when confidence is high
    let enhancedPrompt = query;
    if (preFilterResult.suggestedAgent && preFilterResult.confidence >= 0.7) {
      enhancedPrompt = `[시스템 힌트: 이 질문은 "${preFilterResult.suggestedAgent}"에게 핸드오프하는 것이 적합합니다. 서버/인프라 관점에서 해석하세요.]\n\n사용자 질문: ${query}`;
      console.log(`💡 [Orchestrator] Enhanced prompt with handoff hint → ${preFilterResult.suggestedAgent}`);
    }

    // Execute orchestrator with timeout protection
    let timeoutId: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`Orchestrator timeout after ${ORCHESTRATOR_CONFIG.timeout}ms`));
      }, ORCHESTRATOR_CONFIG.timeout);
    });

    // Warn if execution is taking too long
    const warnTimer = setTimeout(() => {
      console.warn(`⚠️ [Orchestrator] Execution exceeding ${ORCHESTRATOR_CONFIG.warnThreshold}ms threshold`);
    }, ORCHESTRATOR_CONFIG.warnThreshold);

    let result;
    try {
      result = await Promise.race([
        orchestrator.generate({ prompt: enhancedPrompt }),
        timeoutPromise,
      ]);
    } finally {
      // Always cleanup timers (success, error, or timeout)
      clearTimeout(timeoutId!);
      clearTimeout(warnTimer);
    }

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

    // Sanitize Chinese/other foreign characters from LLM output
    const sanitizedResponse = sanitizeChineseCharacters(result.text);

    console.log(
      `✅ [Orchestrator] Completed in ${durationMs}ms, final agent: ${result.finalAgent}, tools: [${toolsCalled.join(', ')}]`
    );

    // =========================================================================
    // Handoff Fallback: If LLM didn't handoff and no tools called,
    // try the pre-filter suggested agent as fallback
    // =========================================================================
    const noHandoffOccurred = handoffs.length === 0 || result.finalAgent === 'Orchestrator';
    const noToolsCalled = toolsCalled.length === 0;
    const suggestedAgent = preFilterResult.suggestedAgent;
    const hasSuggestedAgent = suggestedAgent !== undefined && preFilterResult.confidence >= 0.6;

    if (noHandoffOccurred && noToolsCalled && hasSuggestedAgent) {
      console.log(
        `🔄 [Handoff Fallback] No handoff/tools detected, trying ${suggestedAgent} as fallback`
      );

      const fallbackResult = await executeForcedRouting(
        query,
        suggestedAgent,
        startTime
      );

      if (fallbackResult && fallbackResult.toolsCalled.length > 0) {
        console.log(
          `✅ [Handoff Fallback] ${suggestedAgent} succeeded with tools: [${fallbackResult.toolsCalled.join(', ')}]`
        );
        return {
          ...fallbackResult,
          handoffs: [{
            from: 'Orchestrator',
            to: suggestedAgent,
            reason: 'Handoff fallback (LLM failed to delegate)',
          }],
        };
      }

      // If fallback also didn't call tools, return original LLM response
      console.log('⚠️ [Handoff Fallback] Fallback also failed, returning original response');
    }

    return {
      success: true,
      response: sanitizedResponse,
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

// ============================================================================
// Multi-Agent Streaming Execution
// ============================================================================

/**
 * Execute multi-agent mode with real-time streaming
 * 
 * Unlike executeMultiAgent which returns a complete response,
 * this function yields StreamEvent chunks in real-time.
 * 
 * @param request - Multi-agent request with messages and session info
 * @yields StreamEvent - Real-time streaming events (text_delta, tool_call, handoff, done, error)
 */
export async function* executeMultiAgentStream(
  request: MultiAgentRequest
): AsyncGenerator<StreamEvent> {
  const startTime = Date.now();

  // Build prompt from messages
  const lastUserMessage = request.messages
    .filter((m) => m.role === 'user')
    .pop();

  if (!lastUserMessage) {
    yield { type: 'error', data: { code: 'INVALID_REQUEST', error: 'No user message found' } };
    return;
  }

  const query = lastUserMessage.content;

  // =========================================================================
  // Fast Path: Rule-based pre-filter for simple queries
  // =========================================================================
  const preFilterResult = preFilterQuery(query);

  console.log(`📋 [Stream PreFilter] Query: "${query.substring(0, 50)}..." → Suggested: ${preFilterResult.suggestedAgent || 'none'} (confidence: ${preFilterResult.confidence})`);

  if (!preFilterResult.shouldHandoff && preFilterResult.directResponse) {
    const durationMs = Date.now() - startTime;
    console.log(`⚡ [Stream Fast Path] Direct response in ${durationMs}ms`);

    yield { type: 'text_delta', data: preFilterResult.directResponse };
    yield {
      type: 'done',
      data: {
        success: true,
        finalAgent: 'Orchestrator (Fast Path)',
        toolsCalled: [],
        usage: { promptTokens: 0, completionTokens: 0 },
        metadata: { durationMs, provider: 'rule-based' }
      }
    };
    return;
  }

  // =========================================================================
  // Check orchestrator availability
  // =========================================================================
  if (!orchestrator || !orchestratorModelConfig) {
    yield { type: 'error', data: { code: 'MODEL_UNAVAILABLE', error: 'Orchestrator not available' } };
    return;
  }

  try {
    const { provider, modelId } = orchestratorModelConfig;

    console.log(`🎯 [Stream Orchestrator] Starting with ${provider}/${modelId}`);

    // Langfuse timeout span for tracking
    const timeoutSpan = createTimeoutSpan(
      request.sessionId,
      'orchestrator_stream',
      ORCHESTRATOR_CONFIG.timeout
    );

    // Enhance prompt with suggested agent hint when confidence is high
    let enhancedPrompt = query;
    if (preFilterResult.suggestedAgent && preFilterResult.confidence >= 0.7) {
      enhancedPrompt = `[시스템 힌트: 이 질문은 "${preFilterResult.suggestedAgent}"에게 핸드오프하는 것이 적합합니다. 서버/인프라 관점에서 해석하세요.]\n\n사용자 질문: ${query}`;
    }

    // =========================================================================
    // Stream from orchestrator with warning tracking
    // =========================================================================
    const streamResult = orchestrator.stream({
      prompt: enhancedPrompt,
    });

    // Warning state (only emit once)
    let warningEmitted = false;

    // Yield text chunks as they arrive with elapsed time check
    for await (const textChunk of streamResult.textStream) {
      const elapsed = Date.now() - startTime;

      // Emit warning once when threshold exceeded (25s)
      if (!warningEmitted && elapsed >= ORCHESTRATOR_CONFIG.warnThreshold) {
        warningEmitted = true;

        console.warn(
          `⚠️ [Stream Orchestrator] Execution exceeding ${ORCHESTRATOR_CONFIG.warnThreshold}ms threshold`
        );

        // Yield warning event to frontend
        yield {
          type: 'warning',
          data: {
            code: 'SLOW_PROCESSING',
            message: '처리 시간이 25초를 초과했습니다. 복잡한 분석이 진행 중입니다.',
            elapsed,
            threshold: ORCHESTRATOR_CONFIG.warnThreshold,
          },
        };

        // Log to Langfuse
        logTimeoutEvent('warning', {
          operation: 'orchestrator_stream',
          elapsed,
          threshold: ORCHESTRATOR_CONFIG.warnThreshold,
          sessionId: request.sessionId,
        });
      }

      const sanitized = sanitizeChineseCharacters(textChunk);
      if (sanitized) {
        yield { type: 'text_delta', data: sanitized };
      }
    }

    // Complete timeout span
    const finalElapsed = Date.now() - startTime;
    timeoutSpan.complete(true, finalElapsed);

    // =========================================================================
    // After streaming completes, gather metadata
    // =========================================================================
    const [steps, usage] = await Promise.all([
      streamResult.steps,
      streamResult.usage,
    ]);

    // Extract tool calls and handoff information from steps
    const toolsCalled: string[] = [];
    const handoffList: Array<{ from: string; to: string; reason?: string }> = [];
    let detectedFinalAgent = 'Orchestrator';

    if (steps) {
      for (const step of steps) {
        // Extract tool calls
        if (step.toolCalls) {
          for (const tc of step.toolCalls) {
            toolsCalled.push(tc.toolName);
            yield { type: 'tool_call', data: { name: tc.toolName } };
          }
        }

        // Check for agent info in step (if available)
        const stepAny = step as Record<string, unknown>;
        if (stepAny.agent && typeof stepAny.agent === 'string') {
          detectedFinalAgent = stepAny.agent;
        }
      }
    }

    // Yield handoff events from tracked handoffs
    const recentHandoffs = getRecentHandoffs();
    for (const h of recentHandoffs) {
      yield {
        type: 'handoff',
        data: {
          from: h.from,
          to: h.to,
          reason: h.reason,
        }
      };
      handoffList.push({ from: h.from, to: h.to, reason: h.reason });
    }

    const durationMs = Date.now() - startTime;

    console.log(`✅ [Stream Orchestrator] Completed in ${durationMs}ms, final agent: ${detectedFinalAgent}, tools: [${toolsCalled.join(', ')}]`);

    yield {
      type: 'done',
      data: {
        success: true,
        finalAgent: detectedFinalAgent,
        toolsCalled,
        handoffs: handoffList,
        usage: {
          promptTokens: usage?.inputTokens ?? 0,
          completionTokens: usage?.outputTokens ?? 0,
        },
        metadata: {
          provider,
          modelId,
          durationMs,
        }
      }
    };

  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error(`❌ [Stream Orchestrator] Error after ${durationMs}ms:`, errorMessage);

    // Classify error
    let code = 'UNKNOWN_ERROR';
    if (errorMessage.includes('API key')) {
      code = 'AUTH_ERROR';
    } else if (errorMessage.includes('rate limit')) {
      code = 'RATE_LIMIT';
    } else if (errorMessage.includes('timeout')) {
      code = 'TIMEOUT';

      // Log timeout error to Langfuse
      logTimeoutEvent('error', {
        operation: 'orchestrator_stream',
        elapsed: durationMs,
        threshold: ORCHESTRATOR_CONFIG.timeout,
        sessionId: request.sessionId,
      });
    } else if (errorMessage.includes('model')) {
      code = 'MODEL_ERROR';
    }

    yield { type: 'error', data: { code, error: errorMessage } };
  }
}

export default orchestrator;
