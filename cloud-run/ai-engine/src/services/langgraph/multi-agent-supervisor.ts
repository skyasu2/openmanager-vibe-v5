/**
 * Multi-Agent Supervisor using @langchain/langgraph-supervisor
 * Cloud Run Standalone Implementation
 */

import { AIMessage, BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { createSupervisor } from '@langchain/langgraph-supervisor';
import {
  analyzePatternTool,
  detectAnomaliesTool,
  predictTrendsTool,
} from '../../agents/analyst-agent';
// NEW: RCA and Capacity Agent imports
import { rcaTools } from '../../agents/rca-agent';
import { capacityTools } from '../../agents/capacity-agent';
// Import tools from Agents
import {
  getServerMetricsTool,
  getServerLogsTool,
  getServerMetricsAdvancedTool,
} from '../../agents/nlq-agent';
// NLQ SubGraph removed (v5.91.0) - was unused dead code (500+ lines)
// Complex NLQ queries are handled by NLQ Agent's getServerMetricsAdvancedTool
import {
  recommendCommandsTool,
  searchKnowledgeBaseTool,
} from '../../agents/reporter-agent';
import { searchWebTool } from '../../tools/web-search';
// Verifier Agent for post-processing validation
import {
  comprehensiveVerifyTool,
  buildRetryPrompt,
  determineVerificationStrategy,
  type VerificationStrategy,
} from '../../agents/verifier-agent';
import type { VerificationResult } from '../../lib/state-definition';

import {
  createSessionConfig,
  getAutoCheckpointer,
} from '../../lib/checkpointer';
// Context Compression Integration (Phase 3)
import {
  needsCompression,
  getCompressionStats,
  getSummarizer,
  isCompressionDisabled,
} from '../../lib/context-compression';
// Phase 2: Shared Context Store
import {
  saveAgentResult,
  getAgentResult,
  hasRequiredDependencies,
  type AgentName,
} from '../../lib/shared-context';
import { RateLimitError } from '../../lib/errors';
import { approvalStore } from '../approval/approval-store';
import {
  getAnalystModel,
  getNLQModel,
  getReporterModel,
  getRCAModel,       // NEW
  getCapacityModel,  // NEW
  getSupervisorModel,
  createMistralModel,
  createCerebrasModel,
  createGroqModel,
  MISTRAL_MODELS,
  CEREBRAS_MODELS,
} from '../../lib/model-config';
// LangFuse removed (v5.83.12) - createReactAgent doesn't propagate callbacks

// ============================================================================
// 0. Groq Message Compatibility Helper
// ============================================================================

/**
 * Creates a stateModifier function that:
 * 1. Adds a system prompt
 * 2. Filters out tool-call messages that Groq cannot process
 * 3. Ensures all message content is string-based
 *
 * This is necessary because the Supervisor generates tool-call messages
 * with array-based content that Groq's API rejects.
 */
function createGroqCompatibleStateModifier(systemPrompt: string) {
  return (state: { messages: BaseMessage[] }): BaseMessage[] => {
    const filteredMessages: BaseMessage[] = [];

    // Add system prompt first
    filteredMessages.push(new SystemMessage(systemPrompt));

    // Filter and transform messages for Groq compatibility
    for (const msg of state.messages) {
      // Skip tool-call messages (they have complex content structures)
      // Also skip internal handoff messages from supervisor
      const content = msg.content;

      // Check if content is a string (Groq-compatible)
      if (typeof content === 'string') {
        // Skip internal supervisor handoff messages
        if (content.includes('Successfully transferred') ||
            content.includes('Transferring back to')) {
          continue;
        }
        filteredMessages.push(msg);
      }
      // If content is an array, try to extract text parts only
      else if (Array.isArray(content)) {
        const textParts = content
          .filter((part): part is { type: 'text'; text: string } =>
            typeof part === 'object' && part !== null && part.type === 'text'
          )
          .map(part => part.text)
          .join('\n');

        if (textParts.length > 0) {
          // Create a new message with string content
          if (msg._getType() === 'human') {
            filteredMessages.push(new HumanMessage(textParts));
          } else if (msg._getType() === 'ai') {
            filteredMessages.push(new AIMessage(textParts));
          }
        }
      }
    }

    return filteredMessages;
  };
}

// ============================================================================
// 0.1 Phase 2: Agent Result Extraction & Context Saving
// ============================================================================

/**
 * Extract and save agent results from message history to Shared Context
 * This enables Reporter to access NLQ/Analyst results without direct tool calls
 */
async function saveAgentResultsFromHistory(
  messages: BaseMessage[],
  sessionId: string
): Promise<void> {
  const agentPatterns: Record<AgentName, RegExp[]> = {
    nlq: [/전체 서버 현황|서버 상태|메트릭|CPU|메모리|디스크/i],
    analyst: [/이상 감지|트렌드|패턴 분석|anomaly|trend/i],
    rca: [/근본 원인|타임라인|상관관계|root cause|correlation/i],
    capacity: [/용량 예측|소진 예측|스케일링|리소스 예측|exhaustion/i],
    reporter: [/인시던트|리포트|장애 보고서/i],
    supervisor: [],
  };

  for (const msg of messages) {
    if (msg._getType() !== 'ai') continue;

    const content = typeof msg.content === 'string' ? msg.content : '';
    if (!content) continue;

    // Identify which agent produced this message
    for (const [agentName, patterns] of Object.entries(agentPatterns)) {
      if (agentName === 'supervisor') continue; // Skip supervisor
      if (patterns.length === 0) continue;

      const isMatch = patterns.some(p => p.test(content));
      if (isMatch) {
        await saveAgentResult(
          sessionId,
          agentName as AgentName,
          { response: content.slice(0, 500) }, // Limit to 500 chars
          { summary: content.slice(0, 200) } // Compressed summary
        );
        console.log(`💾 [SharedContext] Saved ${agentName} result to session ${sessionId.slice(0, 8)}...`);
        break; // Only match first agent
      }
    }
  }
}

// ============================================================================
// 1. Worker Agent Creation
// ============================================================================

/**
 * Create NLQ Agent - Server metrics queries
 * Phase 2 Enhancement: Added getServerMetricsAdvancedTool for complex queries
 */
function createNLQAgent() {
  const systemPrompt = `NLQ Agent - 서버 메트릭/로그 조회 전문

## 도구 사용 규칙
1. **전체 서버 조회**: "서버 상태", "전체 현황" 등 → serverId 생략 (필수!)
2. **특정 서버 조회**: "WEB-01 상태" 등 → serverId 지정
3. 로그/에러 조회 → getServerLogs
4. 상태/메트릭 조회 → getServerMetrics
5. **고급 쿼리** (시간 범위/필터/집계) → getServerMetricsAdvanced
   - "지난 6시간 CPU 평균" → timeRange="last6h", aggregation="avg"
   - "CPU 80% 이상 서버들" → filters=[{field:"cpu", operator:">", value:80}]
   - "메모리 TOP 5" → sortBy="memory", limit=5
6. 시스템 용어/개념 확인 → searchKnowledgeBase (RAG)

## 전체 서버 응답 형식 (serverId 없이 조회 시)
📊 **전체 서버 현황** (총 N대)
- ✅ 정상: N대
- ⚠️ 주의: N대 (서버명 나열)
- 🔴 위험: N대 (서버명 나열)

**주요 이상 서버:**
• [서버명] CPU X% / Memory X% / Disk X% - 상태

## 고급 쿼리 응답 형식
📈 **[쿼리 설명]** (시간 범위/조건)
- 서버1: 메트릭값
- 서버2: 메트릭값
[요약: N대 중 N대 매칭]

## 특정 서버 응답 형식
• [서버명] CPU: X% | Memory: X% | Disk: X%
• 상태: 정상/주의/위험
• 특이사항: (있으면 1줄)

⚠️ 중요: 특정 서버를 명시하지 않으면 반드시 serverId를 생략하여 전체 조회!`;

  return createReactAgent({
    llm: getNLQModel(),
    tools: [
      getServerMetricsTool,
      getServerLogsTool,
      getServerMetricsAdvancedTool, // Phase 2: 고급 쿼리 도구
      searchKnowledgeBaseTool,
    ],
    name: 'nlq_agent',
    stateModifier: createGroqCompatibleStateModifier(systemPrompt),
  });
}

// executeComplexNlqQuery removed (v5.91.0) - SubGraph was unused
// NLQ Agent now handles complex queries via getServerMetricsAdvancedTool

/**
 * Create Analyst Agent - Pattern analysis & anomaly detection
 */
function createAnalystAgent() {
  const systemPrompt = `Analyst Agent - 패턴 분석/이상 탐지 전문

## 도구
- detectAnomalies: 이상치 감지
- predictTrends: 트렌드 예측
- analyzePattern: 패턴 분석
- searchKnowledgeBase: 과거 사례 및 해결 가이드 검색 (RAG)

## 응답 형식 (필수)
**현황**: (1줄 요약)
**패턴**: (발견된 패턴 해석)
**조치**: (필요시 권장사항)

⚠️ 통계 수치만 나열 금지. 의미 해석 중심으로 3섹션 이내.`;

  return createReactAgent({
    llm: getAnalystModel(),
    tools: [detectAnomaliesTool, predictTrendsTool, analyzePatternTool, searchKnowledgeBaseTool],
    name: 'analyst_agent',
    stateModifier: createGroqCompatibleStateModifier(systemPrompt),
  });
}

/**
 * Create Reporter Agent - Incident reports, RAG & Web Search
 */
function createReporterAgent() {
  const systemPrompt = `Reporter Agent - 인시던트 리포트 및 웹 검색 전문

## 도구
- searchKnowledgeBase: 내부 RAG 검색 (과거 장애 이력)
- searchWeb: 웹 검색 (Tavily) - 최신 기술 문서, 외부 솔루션 검색
- recommendCommands: CLI 명령어 추천

## 웹 검색 사용 가이드
- 내부 RAG에 정보가 부족하거나, 최신 오픈소스/기술 이슈인 경우 "searchWeb" 사용
- "구글링해줘", "웹에서 찾아줘" 등의 요청 시 사용

## 응답 형식 (엄격 준수)
### 📋 요약
(1-2줄 핵심만)

### 🔍 원인
- (원인 1줄씩, 최대 3개)

### 💡 조치
1. (단계별, 최대 3단계)

### ⌨️ 명령어
\`command\` - 설명

### 🌐 참고 자료 (웹 검색 시)
- [제목](URL) - 설명

⚠️ 서론/인사말 금지. 템플릿 형식만 출력.`;

  return createReactAgent({
    llm: getReporterModel(),
    tools: [searchKnowledgeBaseTool, recommendCommandsTool, searchWebTool],
    name: 'reporter_agent',
    stateModifier: createGroqCompatibleStateModifier(systemPrompt),
  });
}

/**
 * Create RCA Agent - Root Cause Analysis (NEW)
 * Analyzes incident timelines, correlates events, and finds root causes
 */
function createRCAAgent() {
  const systemPrompt = `RCA Agent - 근본 원인 분석 전문

## 역할
- 장애 타임라인 구축 (buildIncidentTimeline)
- 메트릭 상관관계 분석 (correlateEvents)
- 근본 원인 추론 (findRootCause)
- 유사 과거 장애 검색 (searchSimilarIncidents)
- 에러 로그 패턴 수집 (fetchLogPattern)
- 배포 이력 조회 (fetchDeploymentHistory)

## 도구 사용 순서 (권장)
1. buildIncidentTimeline → 장애 시간대 이벤트 수집
2. fetchLogPattern → 에러 로그 패턴 확인
3. fetchDeploymentHistory → 최근 배포 변경 확인
4. correlateEvents → 메트릭 간 상관관계 분석
5. findRootCause → 근본 원인 추론

## 응답 형식
### 🔍 타임라인
- [시간] 이벤트 (심각도)

### 🔗 상관관계
- 메트릭1 ↔ 메트릭2: 상관계수 (관계 유형)

### 💡 근본 원인
- **원인**: (가장 가능성 높은 원인)
- **신뢰도**: X%
- **근거**: (증거 나열)
- **조치**: (권장 해결책)

⚠️ 중요: NLQ/Analyst 결과가 필요합니다. Shared Context에서 참조하세요.`;

  return createReactAgent({
    llm: getRCAModel(),
    tools: rcaTools,
    name: 'rca_agent',
    stateModifier: createGroqCompatibleStateModifier(systemPrompt),
  });
}

/**
 * Create Capacity Agent - Resource Planning (NEW)
 * Predicts resource exhaustion and provides scaling recommendations
 */
function createCapacityAgent() {
  const systemPrompt = `Capacity Agent - 용량 계획 전문

## 역할
- 리소스 소진 시점 예측 (predictResourceExhaustion)
- 스케일링 권장사항 생성 (getScalingRecommendation)
- 성장 트렌드 분석 (analyzeGrowthTrend)
- 베이스라인 비교 (compareBaseline)

## 도구 사용 순서 (권장)
1. analyzeGrowthTrend → 성장률 확인
2. predictResourceExhaustion → 소진 시점 예측
3. compareBaseline → 베이스라인 대비 분석
4. getScalingRecommendation → 스케일링 권장

## 응답 형식
### 📈 성장 트렌드
- [메트릭]: 일간 X%, 주간 Y% 증가

### ⏰ 소진 예측
- **[메트릭]**: N일 후 임계값 도달 (신뢰도 X%)

### 💡 권장사항
| 우선순위 | 리소스 | 조치 | 이유 |
|---------|--------|------|------|
| 높음    | 디스크 | 스케일업 | X일 후 풀 |

⚠️ 중요: NLQ/Analyst 결과가 필요합니다. Shared Context에서 참조하세요.`;

  return createReactAgent({
    llm: getCapacityModel(),
    tools: capacityTools,
    name: 'capacity_agent',
    stateModifier: createGroqCompatibleStateModifier(systemPrompt),
  });
}

// ============================================================================
// 2. Supervisor Creation
// ============================================================================
// Agent Dependency Validation (Phase 5.1)
// ============================================================================

/**
 * Agent Dependency Validation (Phase 5.2)
 * Uses shared-context.ts for centralized dependency checking
 *
 * @see ../../lib/shared-context.ts - hasRequiredDependencies()
 */
export async function validateAgentDependencies(
  sessionId: string,
  targetAgent: AgentName
): Promise<{ valid: boolean; missing: AgentName[] }> {
  const result = await hasRequiredDependencies(sessionId, targetAgent);

  if (!result.valid) {
    console.warn(
      `⚠️ [Dependency] ${targetAgent} missing deps: [${result.missing.join(', ')}]`
    );
  }

  return result;
}

/**
 * Check if RCA or Capacity agent should be used
 * Returns false if dependencies are not met (will route to NLQ/Analyst first)
 */
export async function shouldUseAdvancedAgent(
  sessionId: string,
  agentName: 'rca' | 'capacity'
): Promise<boolean> {
  const { valid, missing } = await validateAgentDependencies(sessionId, agentName);

  if (!valid) {
    console.log(
      `📋 [Routing] ${agentName} deferred - waiting for: [${missing.join(', ')}]`
    );
    return false;
  }

  console.log(`✅ [Routing] ${agentName} dependencies satisfied`);
  return true;
}

// ============================================================================
// 5. Supervisor Prompt & Workflow
// ============================================================================

const SUPERVISOR_PROMPT = `당신은 OpenManager VIBE의 Multi-Agent Supervisor입니다.

## 사용 가능한 에이전트
1. **nlq_agent**: 서버 메트릭 조회 (CPU, Memory, Disk, 로그) - 독립 실행 가능
2. **analyst_agent**: 패턴 분석, 이상 탐지, 트렌드 예측 - nlq_agent 이후 실행
3. **rca_agent**: 근본 원인 분석 - ⚠️ 반드시 nlq_agent + analyst_agent 이후 실행
4. **capacity_agent**: 용량 예측 - ⚠️ 반드시 nlq_agent + analyst_agent 이후 실행
5. **reporter_agent**: 리포트 생성, RAG 검색, 웹 검색

## 🚨 에이전트 의존성 규칙 (필수 준수)

\`\`\`
의존성 체인:
nlq_agent (독립) → analyst_agent → rca_agent / capacity_agent → reporter_agent
\`\`\`

| Agent | 필수 선행 Agent | 설명 |
|-------|-----------------|------|
| nlq_agent | 없음 | 단독 실행 가능 |
| analyst_agent | nlq_agent | NLQ 데이터 필요 |
| rca_agent | nlq_agent + analyst_agent | 분석 데이터 필수 |
| capacity_agent | nlq_agent + analyst_agent | 분석 데이터 필수 |
| reporter_agent | 상황에 따라 | 독립 또는 결과 종합 |

**⛔ 금지**: rca_agent나 capacity_agent를 nlq_agent/analyst_agent 없이 직접 호출하면 안 됩니다!

## 라우팅 규칙 (키워드 기반)

### nlq_agent로 라우팅 (1순위)
- "서버 상태", "전체 현황", "메트릭", "CPU", "메모리", "디스크"
- 특정 서버명 언급 (예: "WEB-01 상태")

### analyst_agent로 라우팅 (nlq 이후)
- "분석", "패턴", "트렌드", "이상 탐지"

### rca_agent로 라우팅 (nlq + analyst 이후만!)
- "왜", "원인", "장애 원인", "근본 원인", "다운된 이유"
- 🔄 순서: nlq_agent → analyst_agent → rca_agent

### capacity_agent로 라우팅 (nlq + analyst 이후만!)
- "언제 가득", "용량", "스케일업", "스케일아웃", "리소스 예측"
- 🔄 순서: nlq_agent → analyst_agent → capacity_agent

### reporter_agent로 라우팅
- "리포트", "보고서", "요약", "검색", "구글링"

### 직접 응답 (에이전트 호출 없음)
- 인사말: "안녕하세요! 무엇을 도와드릴까요?"

## 복합 쿼리 실행 순서 (예시)

**장애 원인 분석** ("왜 다운됐어?"):
1️⃣ nlq_agent → 서버 메트릭 수집
2️⃣ analyst_agent → 이상 탐지
3️⃣ rca_agent → 근본 원인 추론

**용량 예측** ("디스크 언제 가득 차?"):
1️⃣ nlq_agent → 현재 사용량 조회
2️⃣ analyst_agent → 트렌드 분석
3️⃣ capacity_agent → 소진 시점 예측

**단순 조회** ("서버 상태"):
1️⃣ nlq_agent → 직접 응답 (단독)

## 응답 지침
- 에이전트 결과를 그대로 전달
- 서론/인사말 생략
- 핵심 정보만 출력`;

// ============================================================================
// Workflow Cache (v5.91.0) - Reduces initialization overhead
// ============================================================================

type CompiledWorkflow = Awaited<ReturnType<typeof createSupervisor>>['compile'] extends
  (config: infer C) => infer R ? Awaited<R> : never;

let cachedSupervisor: CompiledWorkflow | null = null;
let cachedGroqSupervisor: CompiledWorkflow | null = null;
let cacheInitTime: number = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes - refresh periodically for model health

/**
 * Check if cache is still valid
 */
function isCacheValid(): boolean {
  return cacheInitTime > 0 && (Date.now() - cacheInitTime) < CACHE_TTL_MS;
}

/**
 * Invalidate workflow cache (call on rate limit or model failure)
 */
export function invalidateWorkflowCache(): void {
  cachedSupervisor = null;
  cachedGroqSupervisor = null;
  cacheInitTime = 0;
  console.log('🔄 [Workflow Cache] Invalidated');
}

/**
 * Create Multi-Agent Supervisor Workflow (with caching)
 *
 * Note: Groq rate limit fallback is handled by executeLastKeeperMode(),
 * not by switching the supervisor model (workers also use Groq).
 *
 * v5.90.0: Added RCA and Capacity agents for root cause analysis and capacity planning
 * v5.91.0: Added workflow caching to reduce initialization overhead
 */
export async function createMultiAgentSupervisor() {
  // Return cached workflow if valid
  if (cachedSupervisor && isCacheValid()) {
    console.log('⚡ [Supervisor] Using cached workflow');
    return cachedSupervisor;
  }

  const checkpointer = await getAutoCheckpointer();

  // Create worker agents
  const nlqAgent = createNLQAgent();
  const analystAgent = createAnalystAgent();
  const rcaAgent = createRCAAgent();         // Root Cause Analysis
  const capacityAgent = createCapacityAgent(); // Capacity Planning
  const reporterAgent = createReporterAgent();

  // Supervisor uses Cerebras (primary) for fast inference
  const supervisorModel = getSupervisorModel();

  // Create supervisor with automatic handoffs
  // Agent order matters: NLQ/Analyst first, then RCA/Capacity, finally Reporter
  const workflow = createSupervisor({
    agents: [nlqAgent, analystAgent, rcaAgent, capacityAgent, reporterAgent],
    llm: supervisorModel,
    prompt: SUPERVISOR_PROMPT,
    outputMode: 'full_history',
  });

  // Compile with checkpointer for session persistence
  cachedSupervisor = workflow.compile({
    checkpointer,
  });
  cacheInitTime = Date.now();

  console.log('✅ [Supervisor] Workflow compiled and cached');
  return cachedSupervisor;
}

/**
 * Create Supervisor with Groq model (Cerebras rate limit fallback)
 * Uses llama-3.3-70b-versatile on Groq as fallback
 *
 * v5.90.0: Added RCA and Capacity agents
 * v5.91.0: Added workflow caching
 */
export async function createMultiAgentSupervisorWithGroq() {
  // Return cached Groq workflow if valid
  if (cachedGroqSupervisor && isCacheValid()) {
    console.log('⚡ [Supervisor] Using cached Groq fallback workflow');
    return cachedGroqSupervisor;
  }

  const checkpointer = await getAutoCheckpointer();

  // Create worker agents
  const nlqAgent = createNLQAgent();
  const analystAgent = createAnalystAgent();
  const rcaAgent = createRCAAgent();         // Root Cause Analysis
  const capacityAgent = createCapacityAgent(); // Capacity Planning
  const reporterAgent = createReporterAgent();

  // Supervisor uses Groq as Cerebras fallback
  const supervisorModel = createGroqModel('llama-3.3-70b-versatile', {
    temperature: 0.1,
    maxOutputTokens: 512,
  });

  console.log('🔄 [Supervisor] Using Groq fallback (llama-3.3-70b-versatile)');

  // Create supervisor with automatic handoffs
  const workflow = createSupervisor({
    agents: [nlqAgent, analystAgent, rcaAgent, capacityAgent, reporterAgent],
    llm: supervisorModel,
    prompt: SUPERVISOR_PROMPT,
    outputMode: 'full_history',
  });

  cachedGroqSupervisor = workflow.compile({
    checkpointer,
  });

  console.log('✅ [Supervisor] Groq workflow compiled and cached');
  return cachedGroqSupervisor;
}

// ============================================================================
// 3. Last Keeper Mode (Mistral Direct Response)
// ============================================================================

/**
 * Last Keeper Mode - Mistral 직접 응답
 * Groq rate limit으로 모든 에이전트가 막힐 때 최후의 보루로 동작
 *
 * - Worker 에이전트 스킵
 * - Mistral이 직접 간단한 응답 생성
 * - 기본적인 AI 대화 유지
 */
async function executeLastKeeperMode(
  query: string,
  sessionId: string
): Promise<{
  response: string;
  sessionId: string;
  verification: VerificationResult | null;
  compressionApplied: boolean;
  lastKeeperMode: boolean;
}> {
  console.log('🛡️ [Last Keeper] Activating Mistral direct response mode');

  const mistralModel = createMistralModel(MISTRAL_MODELS.SMALL, {
    temperature: 0.3,
    maxOutputTokens: 2048,
  });

  const systemPrompt = `당신은 OpenManager VIBE의 AI 어시스턴트입니다.
현재 시스템 부하로 인해 간소화 모드로 동작 중입니다.

역할:
- 서버 모니터링 관련 일반적인 질문에 답변
- 기술적 조언 제공
- 친절하고 도움이 되는 응답

제한사항 (솔직히 안내):
- 실시간 서버 데이터 조회 불가 (시스템 복구 중)
- 구체적인 메트릭 수치 제공 불가

응답 형식:
- 간결하고 명확하게
- 한국어로 응답
- 시스템 상태 안내 포함`;

  try {
    const response = await mistralModel.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(query),
    ]);

    const content = typeof response.content === 'string'
      ? response.content
      : '죄송합니다. 현재 시스템이 복구 중입니다. 잠시 후 다시 시도해주세요.';

    // 시스템 상태 안내 추가
    const finalResponse = `${content}\n\n---\n⚠️ *현재 간소화 모드로 동작 중입니다. 실시간 데이터 조회는 잠시 후 다시 시도해주세요.*`;

    console.log('✅ [Last Keeper] Response generated successfully');

    return {
      response: finalResponse,
      sessionId,
      verification: null,
      compressionApplied: false,
      lastKeeperMode: true,
    };
  } catch (error) {
    console.error('🔴 [Last Keeper] Mistral also failed:', error);
    return {
      response: '⚠️ 현재 모든 AI 서비스가 일시적으로 제한되어 있습니다. 잠시 후 다시 시도해주세요.\n\n(Groq 일일 할당량 초과 - UTC 00:00에 리셋됩니다)',
      sessionId,
      verification: null,
      compressionApplied: false,
      lastKeeperMode: true,
    };
  }
}

// ============================================================================
// 4. Verifier Integration (Post-Processing) - Phase 5.7: Hybrid Verification
// ============================================================================

interface VerificationOptions {
  enableVerification?: boolean;
  context?: string;
  retryCount?: number;
  originalQuery?: string;
}

interface HybridVerificationResult {
  response: string;
  verification: VerificationResult | null;
  strategy: VerificationStrategy;
  retryNeeded: boolean;
  retryPrompt?: string;
}

/**
 * Verify agent response using Verifier Agent (Hybrid Strategy)
 *
 * ## Phase 5.7: Hybrid Verification Strategy
 * - severity: low/medium → 직접 수정 (Mistral)
 * - severity: high (환각, 자기 모순) → 재생성 요청 (Retry to Original Agent)
 * - 재시도 후에도 실패 → Last Keeper Mode (Mistral 직접 응답)
 *
 * @param response - Agent의 원본 응답
 * @param options - 검증 옵션
 * @returns 검증 결과 및 처리 전략
 */
async function verifyAgentResponse(
  response: string,
  options: VerificationOptions = {}
): Promise<HybridVerificationResult> {
  const {
    enableVerification = true,
    context,
    retryCount = 0,
    originalQuery,
  } = options;

  // 검증 비활성화 시 패스
  if (!enableVerification) {
    return {
      response,
      verification: null,
      strategy: 'pass',
      retryNeeded: false,
    };
  }

  try {
    const startTime = Date.now();
    const result = await comprehensiveVerifyTool.invoke({
      response,
      context,
    });

    const verification: VerificationResult = {
      isValid: result.isValid,
      confidence: result.confidence,
      originalResponse: result.originalResponse,
      validatedResponse: result.validatedResponse,
      issues: result.issues || [],
      metadata: {
        verifiedAt: new Date().toISOString(),
        rulesApplied: result.metadata?.rulesApplied || [],
        corrections: result.metadata?.corrections || [],
        processingTimeMs: Date.now() - startTime,
      },
    };

    // 전략 결정 (severity 기반)
    const strategy = determineVerificationStrategy(
      verification.issues,
      retryCount,
      1 // maxRetries = 1
    );

    console.log(
      `🔍 [Verifier] Confidence: ${(verification.confidence * 100).toFixed(1)}%, ` +
      `Issues: ${verification.issues.length}, Strategy: ${strategy}`
    );

    // 전략별 처리
    switch (strategy) {
      case 'pass':
        // 문제 없음 - 원본 반환
        return {
          response,
          verification,
          strategy,
          retryNeeded: false,
        };

      case 'direct_fix':
        // 직접 수정 - validatedResponse 반환
        console.log('✏️ [Verifier] Applying direct fixes...');
        return {
          response: verification.validatedResponse || response,
          verification,
          strategy,
          retryNeeded: false,
        };

      case 'retry':
        // 재생성 요청 필요 - 재시도 프롬프트 생성
        console.log('🔄 [Verifier] High severity issues detected, requesting retry...');
        const retryPrompt = buildRetryPrompt(
          response,
          verification.issues,
          originalQuery
        );
        return {
          response, // 원본 유지 (호출자가 재시도 처리)
          verification,
          strategy,
          retryNeeded: true,
          retryPrompt,
        };

      case 'last_keeper':
        // Last Keeper 모드 - 검증된 응답 또는 원본 반환
        console.log('🛡️ [Verifier] Max retries reached, using best available response');
        return {
          response: verification.validatedResponse || response,
          verification,
          strategy,
          retryNeeded: false,
        };

      default:
        return {
          response,
          verification,
          strategy: 'pass',
          retryNeeded: false,
        };
    }
  } catch (error) {
    console.warn('⚠️ [Verifier] Verification failed, using original response:', error);
    return {
      response,
      verification: null,
      strategy: 'pass',
      retryNeeded: false,
    };
  }
}

// ============================================================================
// 4. Context Compression Helper
// ============================================================================

/**
 * Compress conversation history if needed
 * Pre-processing step before supervisor invocation
 *
 * @param messages - Current conversation messages
 * @returns Compressed messages or original if compression not needed
 */
async function compressIfNeeded(
  messages: BaseMessage[]
): Promise<{ messages: BaseMessage[]; wasCompressed: boolean; compressionInfo?: { originalCount: number; newCount: number; ratio: number } }> {
  // Check if compression is globally disabled via environment variable
  if (isCompressionDisabled()) {
    return { messages, wasCompressed: false };
  }

  // Check if compression is needed (threshold: 85% context usage, configurable via COMPRESSION_THRESHOLD)
  if (!needsCompression(messages)) {
    return { messages, wasCompressed: false };
  }

  console.log('[Compression] Context compression triggered', {
    messageCount: messages.length,
  });

  try {
    const summarizer = getSummarizer();
    const result = await summarizer.summarize(messages);

    if (!result.wasCompressed) {
      return { messages, wasCompressed: false };
    }

    // Build new message array: [summary, ...recentMessages]
    const compressedMessages: BaseMessage[] = [
      result.summaryMessage,
      ...result.compressedBuffer.recentMessages,
    ];

    console.log('[Compression] Completed', {
      originalCount: messages.length,
      newCount: compressedMessages.length,
      compressionRatio: result.compressedBuffer.metadata.compressionRatio,
      processingTimeMs: result.processingTimeMs,
    });

    return {
      messages: compressedMessages,
      wasCompressed: true,
      compressionInfo: {
        originalCount: messages.length,
        newCount: compressedMessages.length,
        ratio: result.compressedBuffer.metadata.compressionRatio,
      },
    };
  } catch (error) {
    console.warn('[Compression] Failed, using original messages:', error);
    return { messages, wasCompressed: false };
  }
}

// ============================================================================
// 5. Execution Functions
// ============================================================================

export interface SupervisorExecutionOptions {
  sessionId?: string;
  enableVerification?: boolean;
  verificationContext?: string;
  /** Enable context compression for long conversations (default: true) */
  enableCompression?: boolean;
}

/**
 * Execute supervisor workflow (single response)
 * Uses Mistral AI for Supervisor with automatic rate limit handling
 * v5.85.0: Added Verifier Agent post-processing for quality assurance
 * v5.86.0: Added Context Compression for long conversations
 * v5.88.0: Migrated from Gemini to Mistral AI
 * v5.83.12: Removed LangFuse (createReactAgent doesn't propagate callbacks)
 */
export async function executeSupervisor(
  query: string,
  options: SupervisorExecutionOptions = {}
): Promise<{
  response: string;
  sessionId: string;
  verification?: VerificationResult | null;
  compressionApplied?: boolean;
  lastKeeperMode?: boolean;
}> {
  const sessionId = options.sessionId || `session_${Date.now()}`;
  const {
    enableVerification = true,
    verificationContext,
    enableCompression = true,
  } = options;
  const MAX_RETRIES = 3; // Retry on transient errors
  let compressionApplied = false;

  // Create session config for checkpointing
  const config = createSessionConfig(sessionId);

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      // Create fresh supervisor (Groq primary, Last Keeper on rate limit)
      const app = await createMultiAgentSupervisor();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await app.invoke(
        {
          messages: [new HumanMessage(query)],
        },
        config as any // Type assertion for LangGraph config
      );

      // Extract final response from messages
      const messages = result.messages || [];

      // === Phase 2: Save Agent Results to Shared Context ===
      // This enables Reporter to access NLQ/Analyst results
      await saveAgentResultsFromHistory(messages, sessionId);

      // === Context Compression (v5.86.0) ===
      // Check if compression is needed after accumulating messages
      if (enableCompression && messages.length > 0) {
        const compressionResult = await compressIfNeeded(messages);
        if (compressionResult.wasCompressed) {
          compressionApplied = true;
          console.log(`🗜️ [Supervisor] Context compressed: ${compressionResult.compressionInfo?.originalCount} → ${compressionResult.compressionInfo?.newCount} messages`);
        }
      }

      const lastMessage = messages[messages.length - 1];
      let response =
        typeof lastMessage?.content === 'string'
          ? lastMessage.content
          : '응답을 생성할 수 없습니다.';

      // === Verifier Agent Post-Processing (Phase 5.7: Hybrid Strategy) ===
      let verification: VerificationResult | null = null;
      if (enableVerification && response && response !== '응답을 생성할 수 없습니다.') {
        const verifyResult = await verifyAgentResponse(response, {
          enableVerification: true,
          context: verificationContext || query,
          retryCount: 0,
          originalQuery: query,
        });

        // 재시도 필요 시 한 번 더 시도
        if (verifyResult.retryNeeded && verifyResult.retryPrompt) {
          console.log('🔄 [Verifier] Retry requested, attempting re-generation...');
          try {
            // 재시도: 원래 Agent에게 피드백과 함께 재요청
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const retryResult = await app.invoke(
              {
                messages: [
                  new HumanMessage(query),
                  new HumanMessage(verifyResult.retryPrompt),
                ],
              },
              config as any // Same type assertion as original invoke
            );

            const retryMessages = retryResult?.messages || [];
            const retryLastMsg = retryMessages[retryMessages.length - 1];
            const retryResponse =
              typeof retryLastMsg?.content === 'string'
                ? retryLastMsg.content
                : response; // 실패 시 원본 유지

            // 재시도 응답 재검증 (retryCount = 1)
            const secondVerify = await verifyAgentResponse(retryResponse, {
              enableVerification: true,
              context: verificationContext || query,
              retryCount: 1,
              originalQuery: query,
            });

            response = secondVerify.response;
            verification = secondVerify.verification;
            console.log(`✅ [Verifier] Retry completed. Strategy: ${secondVerify.strategy}`);
          } catch (retryError) {
            console.warn('⚠️ [Verifier] Retry failed, using validated original:', retryError);
            response = verifyResult.response;
            verification = verifyResult.verification;
          }
        } else {
          response = verifyResult.response;
          verification = verifyResult.verification;
        }
      }

      console.log(`✅ [Supervisor] Completed. Session: ${sessionId}, Compressed: ${compressionApplied}`);

      return { response, sessionId, verification, compressionApplied };
    } catch (error) {
      // Debug: Log caught error details
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`🔴 [Supervisor] Caught error on attempt ${attempt + 1}:`, {
        errorType: error?.constructor?.name,
        messagePreview: errorMessage.slice(0, 200),
      });

      // Check if this is a rate limit error
      const isRateLimit = RateLimitError.isRateLimitError(error);

      // Check if this is a tool calling error (Cerebras/Groq tool_calls format issue)
      const isToolCallingError = errorMessage.includes('Failed to generate tool_calls') ||
        errorMessage.includes('failed_generation') ||
        errorMessage.includes('tool_calls');

      console.log(`🔍 [Supervisor] Error check: isRateLimit=${isRateLimit}, isToolCallingError=${isToolCallingError}`);

      if (isRateLimit || isToolCallingError) {
        // 🔄 Try Groq fallback first before Last Keeper
        const errorReason = isToolCallingError ? 'tool_calls generation error' : 'rate limit';
        console.warn(
          `⚠️ [Supervisor] Cerebras ${errorReason} detected, trying Groq fallback...`
        );

        try {
          const groqApp = await createMultiAgentSupervisorWithGroq();
          const groqResult = await groqApp.invoke(
            { messages: [new HumanMessage(query)] },
            config as any
          );

          const groqMessages = groqResult.messages || [];
          const lastMsg = groqMessages[groqMessages.length - 1];
          const groqResponse =
            typeof lastMsg?.content === 'string'
              ? lastMsg.content
              : '응답을 생성할 수 없습니다.';

          console.log('✅ [Supervisor] Groq fallback succeeded');
          return {
            response: groqResponse,
            sessionId,
            verification: null,
            compressionApplied: false,
          };
        } catch (groqError) {
          console.warn('⚠️ [Supervisor] Groq fallback failed, activating Last Keeper...');
          return await executeLastKeeperMode(query, sessionId);
        }
      }

      // Re-throw if not a rate limit error or no more retries
      throw error;
    }
  }

  // Should not reach here, but TypeScript requires it
  throw new Error('Supervisor execution failed after max retries');
}

/**
 * Stream supervisor workflow (Alternative Implementation)
 * Uses app.stream() for native LangGraph streaming
 *
 * @note CURRENTLY UNUSED - Kept for future reference/optimization
 *
 * This function was replaced by `createSupervisorStreamResponse` which uses
 * `executeSupervisor()` + simulated SSE streaming for better Groq compatibility.
 * Native LangGraph streaming (streamEvents) doesn't emit text tokens properly for Groq models.
 *
 * Consider reactivating if:
 * 1. Switching to a model with native streaming support (e.g., Mistral, OpenAI)
 * 2. LangGraph improves Groq streaming support
 *
 * @see createSupervisorStreamResponse - Currently active implementation
 */
export async function* streamSupervisor(
  query: string,
  options: SupervisorExecutionOptions = {}
): AsyncGenerator<{
  type: 'token' | 'agent_start' | 'agent_end' | 'final' | 'error';
  content: string;
  metadata?: Record<string, unknown>;
}> {
  const app = await createMultiAgentSupervisor();
  const sessionId = options.sessionId || `session_${Date.now()}`;
  const config = createSessionConfig(sessionId);

  try {
    // Use default stream() instead of streamEvents for Groq compatibility
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stream = await app.stream(
      { messages: [new HumanMessage(query)] },
      config as any // Type assertion for LangGraph config
    );

    let finalContent = '';
    let lastAgentName = '';

    for await (const chunk of stream) {
      // Chunk has agent name as key: { supervisor: {...}, test_agent: {...} }
      for (const [agentName, agentOutput] of Object.entries(chunk)) {
        // Emit agent start
        if (agentName !== lastAgentName) {
          if (lastAgentName) {
            yield {
              type: 'agent_end',
              content: lastAgentName,
              metadata: {},
            };
          }
          yield {
            type: 'agent_start',
            content: agentName,
            metadata: {},
          };
          lastAgentName = agentName;
        }

        // Extract AI message content from agent output
        const output = agentOutput as {
          messages?: Array<{ content?: string; _getType?: () => string }>;
        };
        if (output?.messages) {
          for (const msg of output.messages) {
            // Check if it's an AI message with content
            const msgType = msg._getType?.();
            if (
              msgType === 'ai' &&
              msg.content &&
              typeof msg.content === 'string' &&
              msg.content.length > 0
            ) {
              // Skip system messages like "Successfully transferred..."
              if (
                !msg.content.includes('Successfully transferred') &&
                !msg.content.includes('Transferring back to')
              ) {
                finalContent = msg.content; // Keep the last meaningful AI response
                yield {
                  type: 'token',
                  content: msg.content,
                  metadata: { agent: agentName },
                };
              }
            }
          }
        }
      }
    }

    // Emit final agent end
    if (lastAgentName) {
      yield {
        type: 'agent_end',
        content: lastAgentName,
        metadata: {},
      };
    }

    // Final response
    yield {
      type: 'final',
      content: finalContent,
      metadata: { sessionId },
    };
  } catch (error) {
    yield {
      type: 'error',
      content: error instanceof Error ? error.message : String(error),
      metadata: { sessionId },
    };
  }
}

/**
 * Detect if response requires human approval
 * Returns approval metadata if needed
 */
function detectApprovalRequired(
  response: string,
  query: string
): {
  required: boolean;
  actionType?: 'incident_report' | 'system_command';
  description?: string;
} {
  // Check for command recommendations in response
  const hasCommands =
    response.includes('⌨️') ||
    response.includes('추천 명령어') ||
    response.includes('command') ||
    /`[a-z]+\s+[a-z]+`/i.test(response);

  // Check for incident report
  const isIncident =
    query.includes('장애') ||
    query.includes('인시던트') ||
    response.includes('📋 인시던트');

  if (isIncident) {
    return {
      required: true,
      actionType: 'incident_report',
      description: '인시던트 리포트가 생성되었습니다. 검토 후 승인해주세요.',
    };
  }

  if (hasCommands) {
    return {
      required: true,
      actionType: 'system_command',
      description: '시스템 명령어가 추천되었습니다. 실행 전 검토해주세요.',
    };
  }

  return { required: false };
}

/**
 * Create AI SDK compatible streaming response
 * Uses invoke() for reliability with Groq, then simulates streaming
 * Includes SSE approval events for Human-in-the-Loop
 *
 * v5.84.0: Added keep-alive pings to prevent Vercel/Cloud Run timeout
 */
export async function createSupervisorStreamResponse(
  query: string,
  sessionId?: string
): Promise<ReadableStream<Uint8Array>> {
  const encoder = new TextEncoder();
  const effectiveSessionId = sessionId || `session_${Date.now()}`;

  return new ReadableStream({
    async start(controller) {
      let isClosed = false;
      let keepAliveInterval: ReturnType<typeof setInterval> | null = null;

      const safeEnqueue = (data: Uint8Array): boolean => {
        // Check both our flag AND controller's internal state
        if (isClosed) return false;

        try {
          // Double-check controller state before enqueue
          if (controller.desiredSize === null) {
            isClosed = true;
            return false;
          }
          controller.enqueue(data);
          return true;
        } catch {
          // Controller may have been closed externally (client disconnect)
          isClosed = true;
          return false;
        }
      };

      const safeClose = () => {
        // Clear keep-alive interval first
        if (keepAliveInterval) {
          clearInterval(keepAliveInterval);
          keepAliveInterval = null;
        }

        if (!isClosed) {
          isClosed = true;
          try {
            controller.close();
          } catch {
            // Controller may have been closed externally
          }
        }
      };

      // Start keep-alive ping (every 10 seconds)
      // Uses AI SDK annotation format '8:' for progress updates
      const startKeepAlive = () => {
        let pingCount = 0;
        keepAliveInterval = setInterval(() => {
          pingCount++;
          if (isClosed) {
            if (keepAliveInterval) clearInterval(keepAliveInterval);
            return;
          }

          // Send progress annotation (AI SDK v5 format)
          const progressMessages = [
            '🔄 AI 에이전트가 분석 중입니다...',
            '📊 서버 데이터를 처리하고 있습니다...',
            '🧠 패턴을 분석하고 있습니다...',
            '⏳ 잠시만 기다려주세요...',
          ];
          const message = progressMessages[pingCount % progressMessages.length];

          // Use annotation format for keep-alive (doesn't affect main response)
          const keepAliveMessage = `8:${JSON.stringify([
            { type: 'progress', message, timestamp: Date.now() },
          ])}\n`;

          if (!safeEnqueue(encoder.encode(keepAliveMessage))) {
            // Stream was closed, stop keep-alive
            if (keepAliveInterval) clearInterval(keepAliveInterval);
          }
        }, 10000); // 10 second interval
      };

      try {
        // 🚀 Anti-Timeout: Immediate First Byte (Vercel 504 방지)
        const thinkingMessage = `0:${JSON.stringify('🔍 분석을 시작합니다...\n\n')}\n`;
        if (!safeEnqueue(encoder.encode(thinkingMessage))) {
          console.log('⚠️ Stream closed before processing started');
          return;
        }

        // Start keep-alive pings
        startKeepAlive();

        // Use invoke() for more reliable Groq integration
        // v5.85.0: Verification enabled by default
        // v5.86.0: Context Compression enabled by default
        // v5.87.1: Smart verification - skip for simple queries to reduce latency
        const isSimpleQuery = query.length < 30 ||
          /^(안녕|반가워|고마워|도움|뭐해|테스트)/i.test(query);

        const { response, verification, compressionApplied } = await executeSupervisor(query, {
          sessionId: effectiveSessionId,
          enableVerification: !isSimpleQuery, // Skip verifier for simple queries (~10-20s savings)
          verificationContext: query,
          enableCompression: true,
        });

        // Stop keep-alive before sending response
        if (keepAliveInterval) {
          clearInterval(keepAliveInterval);
          keepAliveInterval = null;
        }

        // Check if stream was closed during supervisor execution
        if (isClosed) {
          console.log(
            '⚠️ Stream closed during supervisor execution, skipping response'
          );
          return;
        }

        if (response) {
          // AI SDK v5 Data Stream Protocol: text part
          // Format: '0:"text"\n'
          const dataStreamText = `0:${JSON.stringify(response)}\n`;
          if (!safeEnqueue(encoder.encode(dataStreamText))) {
            console.log('⚠️ Stream closed, could not send response');
            return;
          }

          // Check if response requires human approval
          const approval = detectApprovalRequired(response, query);

          if (approval.required && approval.actionType) {
            // Register in approval store (async but fire-and-forget is acceptable here)
            await approvalStore.registerPending({
              sessionId: effectiveSessionId,
              actionType: approval.actionType,
              description: approval.description || '',
              payload: { response, query },
              requestedAt: new Date(),
              requestedBy: 'reporter_agent',
            });

            // AI SDK v5 Data Stream Protocol: custom data event
            // Format: '2:[{...}]\n' for data array, or use 'data-*' pattern
            // Using '8:' prefix for custom annotation/metadata
            const approvalEvent = `8:${JSON.stringify([
              {
                type: 'approval_request',
                id: effectiveSessionId,
                actionType: approval.actionType,
                description: approval.description,
              },
            ])}\n`;
            safeEnqueue(encoder.encode(approvalEvent));

            console.log(
              `🔔 [Supervisor] Approval required: ${approval.actionType}`
            );
          }

          // v5.85.0: Emit verification result as annotation
          if (verification) {
            const verificationEvent = `8:${JSON.stringify([
              {
                type: 'verification',
                isValid: verification.isValid,
                confidence: verification.confidence,
                issueCount: verification.issues.length,
                processingTimeMs: verification.metadata.processingTimeMs,
              },
            ])}\n`;
            safeEnqueue(encoder.encode(verificationEvent));

            if (verification.issues.length > 0) {
              console.log(
                `🔍 [Verifier] Detected ${verification.issues.length} issue(s), confidence: ${(verification.confidence * 100).toFixed(1)}%`
              );
            }
          }

          // v5.86.0: Emit compression result as annotation
          if (compressionApplied) {
            const compressionEvent = `8:${JSON.stringify([
              {
                type: 'compression',
                applied: true,
                timestamp: Date.now(),
              },
            ])}\n`;
            safeEnqueue(encoder.encode(compressionEvent));
            console.log('🗜️ [Compression] Context was compressed for this session');
          }
        }

        // AI SDK v5 Data Stream Protocol: finish message
        const finishMessage = `d:${JSON.stringify({
          finishReason: 'stop',
          sessionId: effectiveSessionId,
          verified: verification?.isValid ?? true,
          confidence: verification?.confidence ?? 1.0,
        })}\n`;
        safeEnqueue(encoder.encode(finishMessage));
        console.log(
          `📤 Supervisor completed (AI SDK v5 Protocol, Verified: ${verification?.isValid ?? 'N/A'})`
        );

        safeClose();
      } catch (error) {
        // Stop keep-alive on error
        if (keepAliveInterval) {
          clearInterval(keepAliveInterval);
          keepAliveInterval = null;
        }

        // Only log if stream is still open (avoid noise from closed streams)
        if (!isClosed) {
          console.error('❌ Supervisor error:', error);
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          const errorStream = `3:${JSON.stringify(errorMessage)}\n`;
          safeEnqueue(encoder.encode(errorStream));
        } else {
          console.log(
            '⚠️ Supervisor error occurred after stream closed:',
            error instanceof Error ? error.message : 'Unknown'
          );
        }
        safeClose();
      }
    },
  });
}
