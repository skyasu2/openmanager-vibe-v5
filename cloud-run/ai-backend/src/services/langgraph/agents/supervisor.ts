/**
 * LangGraph Supervisor Agent
 * 멀티에이전트 시스템의 오케스트레이터 (Cloud Run Standalone)
 *
 * 역할:
 * 1. 사용자 쿼리 인텐트 분류 (Groq Llama-8b)
 * 2. Worker Agent 라우팅 결정
 * 3. 간단한 인사/확인은 직접 응답
 */

import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChatGroq } from '@langchain/groq';
import {
  type AgentStateType,
  type AgentType,
  MAX_ITERATIONS,
  type RouterDecision,
} from '../state-definition.js';

// ============================================================================
// 1. Model Configuration
// ============================================================================

const SUPERVISOR_MODEL = 'llama-3.1-8b-instant';

function getSupervisorModel(): ChatGroq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  return new ChatGroq({
    apiKey,
    model: SUPERVISOR_MODEL,
    temperature: 0.1, // 결정론적 라우팅
    maxTokens: 512,
  });
}

// ============================================================================
// 2. System Prompt
// ============================================================================

const SUPERVISOR_SYSTEM_PROMPT = `You are the "Master Router" for OpenManager VIBE (Server Monitoring System).
Your goal is to support "Server Monitoring & Incident Response".

AGENTS:
1. 'nlq': **Natural Language Query Agent**. Use for current status, metrics lookup, simple server queries. (Uses Tools: getServerMetrics)
2. 'analyst': **Deep Analysis Agent**. Use for pattern analysis, anomaly detection, trend prediction, complex reasoning. (Uses: analyzePattern)
3. 'reporter': **Incident Reporter Agent**. Use for Root Cause Analysis, incident reports, solution lookup from knowledge base. (Uses: searchKnowledgeBase, RAG)
4. 'parallel': **Parallel Analysis**. Use when BOTH metrics data AND pattern analysis are needed together for comprehensive reports.
5. 'reply': ONLY for simple greetings (e.g., "hi", "hello", "안녕") or very short confirmations.

OUTPUT FORMAT (JSON ONLY):
{
  "target": "nlq" | "analyst" | "reporter" | "parallel" | "reply",
  "reasoning": "Brief reason in Korean",
  "reply": "Text content" (Only if target is 'reply'),
  "suggested_model": "gemini-2.5-flash" | "gemini-2.5-pro" | "llama-3.3-70b-versatile"
}

EXAMPLES:
"서버 5번 왜 죽었어?" -> {"target": "reporter", "reasoning": "장애 원인 심층 분석 및 RAG 검색 필요", "suggested_model": "llama-3.3-70b-versatile"}
"지금 CPU 점유율 보여줘" -> {"target": "nlq", "reasoning": "단순 메트릭 조회", "suggested_model": "gemini-2.5-flash"}
"메모리 사용량 패턴 분석해줘" -> {"target": "analyst", "reasoning": "트렌드 분석 필요", "suggested_model": "gemini-2.5-pro"}
"전체 서버 상태와 트렌드 분석해줘" -> {"target": "parallel", "reasoning": "메트릭 조회와 분석이 동시에 필요", "suggested_model": "gemini-2.5-pro"}
"안녕" -> {"target": "reply", "reasoning": "인사", "reply": "안녕하세요! 서버 관리를 도와드리겠습니다.", "suggested_model": null}

IMPORTANT: Output JSON only, no markdown code blocks.`;

// ============================================================================
// 3. Supervisor Node Function
// ============================================================================

/**
 * Supervisor 노드 함수
 * StateGraph의 노드로 사용됨
 *
 * Supports:
 * - Initial routing: 사용자 쿼리 기반 Agent 선택
 * - Return-to-Supervisor: Agent가 다른 Agent로 위임 요청 시 재라우팅
 * - Command Pattern: 특정 Agent로 직접 라우팅 (delegationRequest.toAgent)
 */
export async function supervisorNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  // 반복 횟수 체크 (무한 루프 방지)
  if (state.iteration >= MAX_ITERATIONS) {
    console.warn(`⚠️ Max iterations (${MAX_ITERATIONS}) reached`);
    return {
      finalResponse: '처리 시간이 초과되었습니다. 다시 시도해주세요.',
      iteration: state.iteration + 1,
      returnToSupervisor: false,
      delegationRequest: null,
    };
  }

  // =========================================================================
  // Return-to-Supervisor 처리 (Agent 위임 요청)
  // =========================================================================
  if (state.returnToSupervisor && state.delegationRequest) {
    const { fromAgent, toAgent, reason, context } = state.delegationRequest;

    console.log(`🔄 [Supervisor] Delegation received from ${fromAgent}`);
    console.log(`   Reason: ${reason}`);
    console.log(`   Target: ${toAgent || 'auto-decide'}`);

    // Command Pattern: 명시적 대상 Agent가 지정된 경우
    if (toAgent) {
      console.log(`📌 [Supervisor] Command Pattern → ${toAgent}`);
      return {
        targetAgent: toAgent,
        taskType: mapAgentToTaskType(toAgent),
        currentAgent: toAgent,
        iteration: state.iteration + 1,
        returnToSupervisor: false,
        delegationRequest: null, // 처리 완료
      };
    }

    // Auto-delegation: Supervisor가 적절한 Agent 결정
    // context에서 힌트를 얻어 라우팅
    const contextHint = context?.suggestedAgent as AgentType | undefined;
    if (contextHint) {
      console.log(`💡 [Supervisor] Context-based routing → ${contextHint}`);
      return {
        targetAgent: contextHint,
        taskType: mapAgentToTaskType(contextHint),
        currentAgent: contextHint,
        iteration: state.iteration + 1,
        returnToSupervisor: false,
        delegationRequest: null,
      };
    }

    // 기본: reason 기반으로 재분석 (아래 일반 라우팅 로직 사용)
    console.log(`🔍 [Supervisor] Re-routing based on delegation reason...`);
  }

  // =========================================================================
  // 일반 라우팅 (Initial or Re-routing)
  // =========================================================================

  // 마지막 메시지에서 사용자 쿼리 추출
  const lastMessage = state.messages[state.messages.length - 1];
  const userQuery =
    typeof lastMessage?.content === 'string'
      ? lastMessage.content
      : 'System status check';

  try {
    const model = getSupervisorModel();

    const response = await model.invoke([
      new SystemMessage(SUPERVISOR_SYSTEM_PROMPT),
      new HumanMessage(userQuery),
    ]);

    // JSON 파싱
    const content =
      typeof response.content === 'string' ? response.content : '';
    const cleanJson = content
      .trim()
      .replace(/```json/g, '')
      .replace(/```/g, '');

    const decision = JSON.parse(cleanJson);

    // 라우팅 결정 생성
    const routerDecision: RouterDecision = {
      targetAgent: decision.target as AgentType,
      confidence: 0.9,
      reasoning: decision.reasoning || 'No reasoning provided',
      directReply: decision.reply,
      suggestedModel: decision.suggested_model,
    };

    console.log(
      `📡 [Supervisor] Target: ${routerDecision.targetAgent} | Reason: ${routerDecision.reasoning}`
    );

    // 직접 응답 (reply 타입)
    if (routerDecision.targetAgent === 'reply' && routerDecision.directReply) {
      return {
        targetAgent: 'reply' as AgentType,
        routerDecision,
        finalResponse: routerDecision.directReply,
        iteration: state.iteration + 1,
        returnToSupervisor: false,
        delegationRequest: null,
      };
    }

    // 병렬 분석 라우팅 (parallel 타입 → parallel_analysis taskType 설정)
    if (decision.target === 'parallel') {
      console.log(`🔀 [Supervisor] Routing to parallel analysis`);
      return {
        targetAgent: null, // parallel은 특정 agent가 아닌 병렬 실행
        routerDecision: {
          ...routerDecision,
          targetAgent: null,
        },
        taskType: 'parallel_analysis',
        iteration: state.iteration + 1,
        returnToSupervisor: false,
        delegationRequest: null,
      };
    }

    // Worker Agent로 라우팅
    return {
      targetAgent: routerDecision.targetAgent,
      routerDecision,
      taskType: mapAgentToTaskType(routerDecision.targetAgent),
      currentAgent: routerDecision.targetAgent,
      iteration: state.iteration + 1,
      returnToSupervisor: false,
      delegationRequest: null,
    };
  } catch (error) {
    console.error('❌ Supervisor Error:', error);

    // Fallback: NLQ Agent로 라우팅
    return {
      targetAgent: 'nlq',
      routerDecision: {
        targetAgent: 'nlq',
        confidence: 0.5,
        reasoning: 'Supervisor Error - Fallback to NLQ',
      },
      taskType: 'monitoring',
      currentAgent: 'nlq',
      iteration: state.iteration + 1,
      returnToSupervisor: false,
      delegationRequest: null,
    };
  }
}

// ============================================================================
// 4. Routing Logic
// ============================================================================

/**
 * Conditional Edge: Supervisor → Worker 라우팅
 */
export function routeFromSupervisor(
  state: AgentStateType
):
  | 'nlq_agent'
  | 'analyst_agent'
  | 'reporter_agent'
  | 'parallel_analysis'
  | '__end__' {
  // 최종 응답이 있으면 종료
  if (state.finalResponse) {
    return '__end__';
  }

  // 병렬 분석이 필요한 경우 (taskType으로 판단)
  if (state.taskType === 'parallel_analysis') {
    return 'parallel_analysis';
  }

  // targetAgent에 따라 라우팅
  switch (state.targetAgent) {
    case 'nlq':
      return 'nlq_agent';
    case 'analyst':
      return 'analyst_agent';
    case 'reporter':
      return 'reporter_agent';
    default:
      return '__end__';
  }
}

// ============================================================================
// 5. Helper Functions
// ============================================================================

function mapAgentToTaskType(
  agent: AgentType
): 'monitoring' | 'incident_ops' | 'analysis' | 'general' {
  switch (agent) {
    case 'nlq':
      return 'monitoring';
    case 'analyst':
      return 'analysis';
    case 'reporter':
      return 'incident_ops';
    default:
      return 'general';
  }
}
