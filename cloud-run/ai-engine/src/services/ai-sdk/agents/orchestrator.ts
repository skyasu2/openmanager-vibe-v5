/**
 * Multi-Agent Orchestrator
 *
 * Routes user queries to specialized agents using pattern matching.
 * Removed @ai-sdk-tools/agents dependency for AI SDK v6 compatibility.
 *
 * Architecture:
 * Orchestrator (Rule-based + LLM fallback) → NLQ/Analyst/Reporter/Advisor
 *
 * @version 3.1.0 - Added Context Store for agent communication
 * @updated 2026-01-25 - P1-2: Session context sharing, P2-1: Centralized timeouts
 */

import { generateText, generateObject, streamText, stepCountIs, hasToolCall, type ModelMessage } from 'ai';
import { getCerebrasModel, getGroqModel, getMistralModel, checkProviderStatus, type ProviderName } from '../model-provider';
import { generateTextWithRetry } from '../../resilience/retry-with-fallback';
import { sanitizeChineseCharacters } from '../../../lib/text-sanitizer';
import type { StreamEvent } from '../supervisor';
import { logTimeoutEvent, createTimeoutSpan } from '../../observability/langfuse';

// Import SSOT config (agents are now executed via generateText, not Agent instances)
import { AGENT_CONFIGS, type AgentConfig } from './config';

// Import Zod schemas for type-safe structured output
import { routingSchema, taskDecomposeSchema, getAgentFromRouting, type RoutingDecision, type TaskDecomposition, type Subtask } from './schemas';

// Import Reporter Pipeline for Evaluator-Optimizer pattern
import { executeReporterPipeline, type PipelineResult } from './reporter-pipeline';

// 🎯 P1-2: Import Context Store for agent communication
import {
  getOrCreateSessionContext,
  updateSessionContext,
  recordHandoffEvent,
  getContextSummary,
  appendAffectedServers,
  appendAnomalies,
  appendMetrics,
  type AgentContext,
} from './context-store';

// 🎯 P2-1: Import centralized timeout config
import { TIMEOUT_CONFIG, getHardTimeout, getWarningThreshold } from '../../../config/timeout-config';

// ============================================================================
// Configuration
// ============================================================================

/**
 * Orchestrator timeout configuration
 * - Multi-agent queries can take 20-60s with multiple handoffs
 * - Set generous timeout but prevent infinite hangs
 *
 * @updated 2026-01-20 - Added hardTimeout for stream abort (Best Practice)
 */
// 🎯 P2-1: Use centralized timeout configuration
const ORCHESTRATOR_CONFIG = {
  /** Maximum execution time (ms) - from TIMEOUT_CONFIG.orchestrator */
  timeout: TIMEOUT_CONFIG.orchestrator.hard,
  /** Hard timeout (ms) - same as timeout for consistency */
  hardTimeout: TIMEOUT_CONFIG.orchestrator.hard,
  /** Warning threshold (ms) - from TIMEOUT_CONFIG.orchestrator */
  warnThreshold: TIMEOUT_CONFIG.orchestrator.warning,
};

// ============================================================================
// Types
// ============================================================================

export interface MultiAgentRequest {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  sessionId: string;
  enableTracing?: boolean;
  /**
   * Web search control:
   * - true: Force enable web search tools
   * - false: Disable web search tools
   * - undefined/'auto': Auto-detect based on query content
   */
  enableWebSearch?: boolean | 'auto';
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
    /** Quality score from Reporter Pipeline (optional, 0-1) */
    qualityScore?: number;
  };
}

export interface MultiAgentError {
  success: false;
  error: string;
  code: string;
}

// ============================================================================
// Web Search Auto-Detection
// ============================================================================

/**
 * Keywords that indicate web search might be beneficial
 * These suggest the query needs external/up-to-date information
 */
const WEB_SEARCH_INDICATORS = {
  // External knowledge indicators
  external: [
    '최신', 'latest', '2024', '2025', '2026',
    '뉴스', 'news', '업데이트', 'update',
    'CVE', 'security advisory', '보안 취약점',
  ],
  // Technology/library specific
  technology: [
    'kubernetes', 'k8s', 'docker', 'aws', 'azure', 'gcp',
    'nginx', 'apache', 'redis', 'postgresql', 'mysql',
    'linux', 'ubuntu', 'centos', 'debian',
  ],
  // Problem solving that might need external docs
  problemSolving: [
    '공식 문서', 'documentation', 'docs',
    '버그', 'bug', '이슈', 'issue',
    '릴리스', 'release', '버전', 'version',
  ],
};

/**
 * Keywords that indicate internal data is sufficient (no web search needed)
 */
const INTERNAL_ONLY_INDICATORS = [
  '서버 상태', '서버 목록', 'CPU', '메모리', '디스크',
  '과거 장애', '인시던트', '보고서', '타임라인',
  '우리 서버', '내부', '현재 상태',
];

/**
 * Detect if web search would be beneficial for the query
 * Conservative approach to minimize Tavily API calls
 *
 * @param query User's query text
 * @returns true if web search is likely beneficial
 */
export function shouldEnableWebSearch(query: string): boolean {
  const q = query.toLowerCase();

  // Check if query is clearly internal-only
  const isInternalOnly = INTERNAL_ONLY_INDICATORS.some(keyword =>
    q.includes(keyword.toLowerCase())
  );
  if (isInternalOnly) {
    return false;
  }

  // Check for external knowledge indicators
  const hasExternalIndicator = WEB_SEARCH_INDICATORS.external.some(keyword =>
    q.includes(keyword.toLowerCase())
  );
  if (hasExternalIndicator) {
    return true;
  }

  // Check for technology-specific queries that might need docs
  const hasTechIndicator = WEB_SEARCH_INDICATORS.technology.some(keyword =>
    q.includes(keyword.toLowerCase())
  );
  const hasProblemSolving = WEB_SEARCH_INDICATORS.problemSolving.some(keyword =>
    q.includes(keyword.toLowerCase())
  );

  // Technology + problem solving = likely needs web search
  if (hasTechIndicator && hasProblemSolving) {
    return true;
  }

  // Default: don't enable web search (conservative)
  return false;
}

/**
 * Resolve web search setting based on request and query
 */
export function resolveWebSearchSetting(
  enableWebSearch: boolean | 'auto' | undefined,
  query: string
): boolean {
  // Explicit true/false takes precedence
  if (enableWebSearch === true) return true;
  if (enableWebSearch === false) return false;

  // Auto or undefined: detect based on query
  return shouldEnableWebSearch(query);
}

/**
 * Filter tools based on web search setting
 * Removes searchWeb tool when web search is disabled
 */
function filterToolsByWebSearch(
  tools: Record<string, unknown>,
  webSearchEnabled: boolean
): Record<string, unknown> {
  if (webSearchEnabled) {
    return tools;
  }

  // Remove searchWeb tool when disabled
  const filtered = { ...tools };
  if ('searchWeb' in filtered) {
    delete filtered.searchWeb;
    console.log('🚫 [Tools] searchWeb disabled by enableWebSearch setting');
  }
  return filtered;
}

// ============================================================================
// 🎯 P1-2: Context Store Integration - Parse and Save Agent Findings
// ============================================================================

/**
 * Server name extraction patterns
 * Matches common server naming conventions
 */
const SERVER_NAME_PATTERNS = [
  /(?:서버|server)[:\s]+([a-zA-Z0-9-_]+(?:-\d+)?)/gi,
  /\b(web-server-\d+)\b/gi,
  /\b(api-server-\d+)\b/gi,
  /\b(db-(?:master|slave)-\d+)\b/gi,
  /\b(cache-\d+)\b/gi,
  /\b([a-z]+-[a-z]+-\d{2})\b/gi, // Pattern like "web-server-01"
];

/**
 * Anomaly indicator keywords for detection
 */
const ANOMALY_INDICATORS = [
  '높은 CPU', 'CPU 사용률', 'CPU 과부하', 'CPU 급등',
  '메모리 부족', '메모리 사용률', 'OOM', 'OutOfMemory',
  '디스크 부족', '디스크 사용률', '스토리지',
  '네트워크 지연', '레이턴시', 'latency',
  '장애', '에러', '오류', 'error', 'failure',
  '임계값 초과', 'threshold', '알림', 'alert',
];

/**
 * Parse agent response and save findings to context store
 *
 * @param sessionId - Current session ID
 * @param agentName - Name of the agent that produced the response
 * @param response - Agent's text response
 */
async function saveAgentFindingsToContext(
  sessionId: string,
  agentName: string,
  response: string
): Promise<void> {
  try {
    const normalizedAgent = agentName.toLowerCase();

    // NLQ Agent: Extract affected servers
    if (normalizedAgent.includes('nlq')) {
      const servers = extractServerNames(response);
      if (servers.length > 0) {
        await appendAffectedServers(sessionId, servers);
        console.log(`💾 [Context] NLQ Agent saved ${servers.length} servers: [${servers.slice(0, 3).join(', ')}${servers.length > 3 ? '...' : ''}]`);
      }
    }

    // Analyst Agent: Extract anomalies
    if (normalizedAgent.includes('analyst')) {
      const anomalies = extractAnomalies(response);
      if (anomalies.length > 0) {
        await appendAnomalies(sessionId, anomalies);
        console.log(`💾 [Context] Analyst Agent saved ${anomalies.length} anomalies`);
      }
    }

    // Reporter Agent: Extract metrics and root cause
    if (normalizedAgent.includes('reporter')) {
      const metrics = extractMetrics(response);
      if (metrics.length > 0) {
        await appendMetrics(sessionId, metrics);
        console.log(`💾 [Context] Reporter Agent saved ${metrics.length} metrics`);
      }
    }

    // Advisor Agent: Save recommendations (via lastAgent update)
    if (normalizedAgent.includes('advisor')) {
      await updateSessionContext(sessionId, { lastAgent: agentName });
      console.log(`💾 [Context] Advisor Agent updated lastAgent`);
    }
  } catch (error) {
    // Non-critical: log but don't throw
    console.warn(`⚠️ [Context] Failed to save findings for ${agentName}:`, error);
  }
}

/**
 * Extract server names from response text
 */
function extractServerNames(text: string): string[] {
  const servers = new Set<string>();

  for (const pattern of SERVER_NAME_PATTERNS) {
    const matches = text.matchAll(new RegExp(pattern));
    for (const match of matches) {
      if (match[1]) {
        servers.add(match[1].toLowerCase());
      }
    }
  }

  return Array.from(servers);
}

/**
 * Extract anomaly information from response text
 * Returns data matching AnomalyData interface from context-store
 */
function extractAnomalies(text: string): Array<{
  serverId: string;
  serverName: string;
  metric: 'cpu' | 'memory' | 'disk' | 'network';
  value: number;
  threshold: number;
  severity: 'warning' | 'critical';
  detectedAt: string;
}> {
  const anomalies: Array<{
    serverId: string;
    serverName: string;
    metric: 'cpu' | 'memory' | 'disk' | 'network';
    value: number;
    threshold: number;
    severity: 'warning' | 'critical';
    detectedAt: string;
  }> = [];

  // Extract server names mentioned in anomaly context
  const servers = extractServerNames(text);
  const lines = text.split('\n');

  for (const line of lines) {
    const hasAnomalyIndicator = ANOMALY_INDICATORS.some(ind =>
      line.toLowerCase().includes(ind.toLowerCase())
    );

    if (hasAnomalyIndicator) {
      // Extract percentage values
      const percentMatch = line.match(/(\d+(?:\.\d+)?)\s*%/);
      const value = percentMatch ? parseFloat(percentMatch[1]) : 0;

      // Determine metric type
      let metric: 'cpu' | 'memory' | 'disk' | 'network' = 'cpu';
      if (/cpu/i.test(line)) metric = 'cpu';
      else if (/메모리|memory|mem/i.test(line)) metric = 'memory';
      else if (/디스크|disk|storage/i.test(line)) metric = 'disk';
      else if (/네트워크|network|latency/i.test(line)) metric = 'network';

      // Determine severity (warning or critical only)
      const severity: 'warning' | 'critical' =
        (value >= 90 || /critical|심각|긴급/i.test(line)) ? 'critical' : 'warning';

      // Create anomaly for each server mentioned
      const targetServers = servers.length > 0 ? servers : ['unknown'];
      for (const serverId of targetServers.slice(0, 3)) { // Limit to 3 servers
        anomalies.push({
          serverId,
          serverName: serverId, // Use serverId as serverName
          metric,
          value,
          threshold: metric === 'cpu' ? 80 : 85,
          severity,
          detectedAt: new Date().toISOString(),
        });
      }
    }
  }

  return anomalies.slice(0, 10); // Limit to 10 anomalies
}

/**
 * Extract metric snapshots from response text
 * Returns data matching MetricSnapshot interface from context-store
 */
function extractMetrics(text: string): Array<{
  serverId: string;
  serverName: string;
  cpu: number;
  memory: number;
  disk: number;
  status: 'normal' | 'warning' | 'critical';
  timestamp: string;
}> {
  const metrics: Array<{
    serverId: string;
    serverName: string;
    cpu: number;
    memory: number;
    disk: number;
    status: 'normal' | 'warning' | 'critical';
    timestamp: string;
  }> = [];

  const servers = extractServerNames(text);
  const timestamp = new Date().toISOString();

  // Look for metric patterns like "CPU: 85%" or "메모리 사용률 78%"
  const cpuMatch = text.match(/CPU[:\s]+(\d+(?:\.\d+)?)\s*%/i);
  const memMatch = text.match(/(?:메모리|Memory)[:\s]+(\d+(?:\.\d+)?)\s*%/i);
  const diskMatch = text.match(/(?:디스크|Disk)[:\s]+(\d+(?:\.\d+)?)\s*%/i);

  const cpu = cpuMatch ? parseFloat(cpuMatch[1]) : 0;
  const memory = memMatch ? parseFloat(memMatch[1]) : 0;
  const disk = diskMatch ? parseFloat(diskMatch[1]) : 0;

  // Determine status based on metric values
  const maxValue = Math.max(cpu, memory, disk);
  const status: 'normal' | 'warning' | 'critical' =
    maxValue >= 90 ? 'critical' : maxValue >= 70 ? 'warning' : 'normal';

  // Only save if we found some metrics
  if (cpu > 0 || memory > 0 || disk > 0) {
    const targetServers = servers.length > 0 ? servers : ['unknown'];
    for (const serverId of targetServers.slice(0, 5)) {
      metrics.push({
        serverId,
        serverName: serverId, // Use serverId as serverName
        cpu,
        memory,
        disk,
        status,
        timestamp,
      });
    }
  }

  return metrics;
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

// Note: Model config is now fetched per-request to avoid stale data
// Removed: const orchestratorModelConfig = getOrchestratorModel();

// Log available agents from AGENT_CONFIGS
const availableAgentNames = Object.keys(AGENT_CONFIGS).filter(name => {
  const config = AGENT_CONFIGS[name];
  return config && config.getModel() !== null;
});

if (availableAgentNames.length === 0) {
  console.error('❌ [CRITICAL] No agents available! Check API keys: CEREBRAS_API_KEY, GROQ_API_KEY, MISTRAL_API_KEY');
} else {
  console.log(`📋 [Orchestrator] Available agents: ${availableAgentNames.length} - [${availableAgentNames.join(', ')}]`);
}

// ============================================================================
// Handoff Event Tracking (Bounded for Cloud Run Memory Safety)
// ============================================================================

/**
 * Handoff events configuration
 * - maxSize: 50 entries (Cloud Run 256MB memory constraint)
 * - cleanupAge: 1 hour TTL for automatic cleanup
 */
const HANDOFF_EVENTS_CONFIG = {
  maxSize: 50,
  cleanupAge: 3600000, // 1 hour in ms
} as const;

// Track handoff events for debugging (bounded array)
const handoffEvents: Array<{ from: string; to: string; reason?: string; timestamp: Date }> = [];

/**
 * Record a handoff event for debugging/observability
 * Implements FIFO eviction + TTL cleanup for memory safety
 */
function recordHandoff(from: string, to: string, reason?: string) {
  const now = new Date();

  // TTL-based cleanup: Remove events older than cleanupAge
  const cutoff = now.getTime() - HANDOFF_EVENTS_CONFIG.cleanupAge;
  while (handoffEvents.length > 0 && handoffEvents[0].timestamp.getTime() < cutoff) {
    handoffEvents.shift();
  }

  // FIFO eviction: Remove oldest if at capacity
  if (handoffEvents.length >= HANDOFF_EVENTS_CONFIG.maxSize) {
    handoffEvents.shift();
  }

  handoffEvents.push({ from, to, reason, timestamp: now });
  console.log(`🔀 [Handoff] ${from} → ${to} (${reason || 'no reason'}) [${handoffEvents.length}/${HANDOFF_EVENTS_CONFIG.maxSize}]`);
}

/**
 * Get recent handoff events (for debugging)
 */
export function getRecentHandoffs() {
  return handoffEvents.slice(-10);
}

// ============================================================================
// Reporter Pipeline Execution (Evaluator-Optimizer Pattern)
// ============================================================================

/**
 * Execute Reporter Agent through the Pipeline for quality-controlled reports
 *
 * Uses Evaluator-Optimizer pattern:
 * 1. Generate initial report
 * 2. Evaluate quality (threshold: 0.75)
 * 3. Optimize if needed (max 2 iterations)
 *
 * @param query - User query for report generation
 * @param startTime - Execution start time for duration tracking
 * @returns MultiAgentResponse with quality metrics, or null on failure
 */
async function executeReporterWithPipeline(
  query: string,
  startTime: number
): Promise<MultiAgentResponse | null> {
  console.log(`📋 [ReporterPipeline] Starting pipeline for query: "${query.substring(0, 50)}..."`);

  try {
    const pipelineResult = await executeReporterPipeline(query, {
      qualityThreshold: 0.75,
      maxIterations: 2,
      timeout: 45_000,
    });

    if (!pipelineResult.success || !pipelineResult.report) {
      console.warn(`⚠️ [ReporterPipeline] Pipeline failed: ${pipelineResult.error || 'No report generated'}`);
      return null;
    }

    const durationMs = Date.now() - startTime;

    // Build response text from report
    let responseText = pipelineResult.report.markdown ?? '';

    // Fallback to structured report if no markdown
    if (!responseText) {
      responseText = `# ${pipelineResult.report.title}\n\n`;
      responseText += `## 요약\n${pipelineResult.report.summary}\n\n`;

      if (pipelineResult.report.affectedServers.length > 0) {
        responseText += `## 영향받은 서버 (${pipelineResult.report.affectedServers.length}대)\n`;
        for (const server of pipelineResult.report.affectedServers) {
          responseText += `- **${server.name}** (${server.status}): ${server.primaryIssue}\n`;
        }
        responseText += '\n';
      }

      if (pipelineResult.report.rootCause) {
        responseText += `## 근본 원인 분석\n`;
        responseText += `- **원인**: ${pipelineResult.report.rootCause.cause}\n`;
        responseText += `- **신뢰도**: ${(pipelineResult.report.rootCause.confidence * 100).toFixed(0)}%\n`;
        responseText += `- **제안**: ${pipelineResult.report.rootCause.suggestedFix}\n\n`;
      }

      if (pipelineResult.report.suggestedActions.length > 0) {
        responseText += `## 권장 조치\n`;
        for (const action of pipelineResult.report.suggestedActions) {
          responseText += `- ${action}\n`;
        }
      }
    }

    // Sanitize response
    const sanitizedResponse = sanitizeChineseCharacters(responseText);

    console.log(
      `✅ [ReporterPipeline] Completed in ${durationMs}ms, ` +
      `Quality: ${(pipelineResult.quality.initialScore * 100).toFixed(0)}% → ${(pipelineResult.quality.finalScore * 100).toFixed(0)}%, ` +
      `Iterations: ${pipelineResult.quality.iterations}`
    );

    return {
      success: true,
      response: sanitizedResponse,
      handoffs: [{
        from: 'Orchestrator',
        to: 'Reporter Agent',
        reason: `Pipeline execution (quality: ${(pipelineResult.quality.finalScore * 100).toFixed(0)}%)`,
      }],
      finalAgent: 'Reporter Agent',
      toolsCalled: ['executeReporterPipeline'],
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      },
      metadata: {
        provider: 'pipeline',
        modelId: 'reporter-pipeline',
        totalRounds: pipelineResult.quality.iterations,
        durationMs,
        qualityScore: pipelineResult.quality.finalScore,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ [ReporterPipeline] Error: ${errorMessage}`);
    return null;
  }
}

// ============================================================================
// Agent Execution (AI SDK v6 Native)
// ============================================================================

/**
 * Get agent config by name
 * Returns the AGENT_CONFIGS entry for direct generateText execution
 */
function getAgentConfig(name: string): AgentConfig | null {
  return AGENT_CONFIGS[name] ?? null;
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
  startTime: number,
  webSearchEnabled = true
): Promise<MultiAgentResponse | null> {
  console.log(`🔍 [Forced Routing] Looking up agent config: "${suggestedAgentName}"`);

  // Reporter Agent → Use Pipeline for quality-controlled reports
  if (suggestedAgentName === 'Reporter Agent') {
    console.log(`📋 [Forced Routing] Routing to Reporter Pipeline`);
    const pipelineResult = await executeReporterWithPipeline(query, startTime);
    if (pipelineResult) {
      return pipelineResult;
    }
    // Fallback to direct agent execution if pipeline fails
    console.log(`🔄 [Forced Routing] Pipeline failed, falling back to direct Reporter Agent`);
  }

  // Get agent configuration
  const agentConfig = AGENT_CONFIGS[suggestedAgentName];

  if (!agentConfig) {
    console.warn(`⚠️ [Forced Routing] No config for "${suggestedAgentName}"`);
    return null;
  }

  // Get preferred provider order for this agent
  const providerOrder = getAgentProviderOrder(suggestedAgentName);
  console.log(`🎯 [Forced Routing] Using retry with fallback: [${providerOrder.join(' → ')}]`);

  // Filter tools based on web search setting
  const filteredTools = filterToolsByWebSearch(agentConfig.tools, webSearchEnabled);

  try {
    // Use generateTextWithRetry for automatic 429 handling
    // AI SDK v6 Best Practice: Use hasToolCall('finalAnswer') + stepCountIs(N) for graceful termination
    const retryResult = await generateTextWithRetry(
      {
        messages: [
          { role: 'system', content: agentConfig.instructions },
          { role: 'user', content: query },
        ],
        tools: filteredTools as Parameters<typeof generateText>[0]['tools'],
        stopWhen: [hasToolCall('finalAnswer'), stepCountIs(5)], // Graceful termination + safety limit
        temperature: 0.4, // Increased from 0.2 for more creative analysis
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

    // Extract tool calls from steps and check for finalAnswer
    const toolsCalled: string[] = [];
    let finalAnswerResult: { answer: string } | null = null;

    for (const step of result.steps) {
      for (const toolCall of step.toolCalls) {
        toolsCalled.push(toolCall.toolName);
      }
      // AI SDK v6 Best Practice: Extract finalAnswer result if called
      if (step.toolResults) {
        for (const tr of step.toolResults) {
          if ('result' in tr && tr.toolName === 'finalAnswer' && tr.result && typeof tr.result === 'object') {
            finalAnswerResult = tr.result as { answer: string };
          }
        }
      }
    }

    // Use finalAnswer if called, otherwise fall back to result.text
    const response = finalAnswerResult?.answer ?? result.text;
    const sanitizedResponse = sanitizeChineseCharacters(response);

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
// Orchestrator-Worker Pattern (Priority 3)
// ============================================================================

/**
 * Complexity indicators for task decomposition decision
 */
const COMPLEXITY_INDICATORS = [
  /그리고|또한|동시에|함께/,  // Conjunction words
  /비교|차이|대비/,           // Comparison requests
  /분석.*보고서|보고서.*분석/, // Multiple agent types
  /전체.*상세|상세.*전체/,    // Breadth + depth requests
];

/**
 * Check if query is complex enough to benefit from decomposition
 */
function isComplexQuery(query: string): boolean {
  const matchCount = COMPLEXITY_INDICATORS.filter(pattern => pattern.test(query)).length;
  return matchCount >= 2 || query.length > 100;
}

/**
 * Decompose a complex query into subtasks using generateObject
 *
 * @param query - The user query to decompose
 * @returns TaskDecomposition with subtasks, or null if decomposition not needed
 */
async function decomposeTask(query: string): Promise<TaskDecomposition | null> {
  // Skip decomposition for simple queries
  if (!isComplexQuery(query)) {
    console.log('📋 [Decompose] Query is simple, skipping decomposition');
    return null;
  }

  const modelConfig = getOrchestratorModel();
  if (!modelConfig) {
    console.warn('⚠️ [Decompose] No model available');
    return null;
  }

  const { model } = modelConfig;

  try {
    console.log('🔀 [Decompose] Analyzing complex query for task decomposition...');

    const decomposePrompt = `다음 복합 질문을 서브태스크로 분해하세요.

## 사용 가능한 에이전트
- NLQ Agent: 서버 상태 조회, 메트릭 필터링/집계
- Analyst Agent: 이상 탐지, 트렌드 예측, 근본 원인 분석
- Reporter Agent: 장애 보고서, 인시던트 타임라인
- Advisor Agent: 해결 방법, CLI 명령어, 과거 사례

## 사용자 질문
${query}

## 분해 가이드라인
- 각 서브태스크는 하나의 에이전트가 독립적으로 처리할 수 있어야 함
- 의존성이 있으면 requiresSequential=true
- 최대 4개의 서브태스크로 제한`;

    const result = await generateObject({
      model,
      schema: taskDecomposeSchema,
      system: '복합 질문을 서브태스크로 분해하는 전문가입니다.',
      prompt: decomposePrompt,
      temperature: 0.2,
    });

    const decomposition = result.object;
    console.log(`🔀 [Decompose] Created ${decomposition.subtasks.length} subtasks (sequential: ${decomposition.requiresSequential})`);

    // 🎯 Phase 3: Task Decomposition 검증 로직 추가
    // 할당된 agent가 실제로 사용 가능한지 검증
    const validSubtasks = decomposition.subtasks.filter(subtask => {
      const agentConfig = getAgentConfig(subtask.agent);

      if (!agentConfig) {
        console.warn(`⚠️ [Decompose] Agent "${subtask.agent}" not found, removing subtask: "${subtask.task.substring(0, 40)}..."`);
        return false;
      }

      // Agent 모델 가용성 확인 (선택적 - 실행 시점에도 체크됨)
      const modelResult = agentConfig.getModel();
      if (!modelResult) {
        console.warn(`⚠️ [Decompose] Agent "${subtask.agent}" model unavailable, removing subtask: "${subtask.task.substring(0, 40)}..."`);
        return false;
      }

      return true;
    });

    // 유효한 subtask가 없으면 null 반환 (fallback to single-agent)
    if (validSubtasks.length === 0) {
      console.warn('⚠️ [Decompose] No valid subtasks after validation, falling back to single-agent');
      return null;
    }

    // 원래 subtask 수와 다르면 로그
    if (validSubtasks.length !== decomposition.subtasks.length) {
      console.log(`🔀 [Decompose] Validated: ${validSubtasks.length}/${decomposition.subtasks.length} subtasks kept`);
    }

    return {
      ...decomposition,
      subtasks: validSubtasks,
    };
  } catch (error) {
    console.error('❌ [Decompose] Task decomposition failed:', error);
    return null;
  }
}

/**
 * Execute subtasks in parallel and unify results
 *
 * 🎯 P1-6 Fix: Individual timeout per subtask to prevent infinite hang
 * Uses Promise.allSettled + race pattern for graceful degradation
 *
 * @param subtasks - Array of subtasks to execute
 * @param query - Original user query for context
 * @param startTime - Execution start time
 * @returns Unified response string
 */
async function executeParallelSubtasks(
  subtasks: Subtask[],
  query: string,
  startTime: number,
  webSearchEnabled = true,
  sessionId = ''
): Promise<MultiAgentResponse | null> {
  console.log(`🚀 [Parallel] Executing ${subtasks.length} subtasks in parallel...`);

  // 🎯 P2-1: Use centralized timeout configuration for subtasks
  const SUBTASK_TIMEOUT_MS = TIMEOUT_CONFIG.subtask.hard;

  // Execute all subtasks in parallel with individual timeouts
  const subtaskPromises = subtasks.map(async (subtask, index) => {
    console.log(`   [${index + 1}/${subtasks.length}] ${subtask.agent}: ${subtask.task.substring(0, 50)}...`);

    // 🎯 P1 Fix: Track timeout ID for proper cleanup
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let isTimedOut = false;

    // Wrap each subtask with its own timeout
    const timeoutPromise = new Promise<null>((resolve) => {
      timeoutId = setTimeout(() => {
        isTimedOut = true;
        // 🎯 P1 Fix: Enhanced timeout logging with agent name and task details
        console.warn(
          `⏱️ [Parallel] Subtask ${index + 1}/${subtasks.length} timeout after ${SUBTASK_TIMEOUT_MS}ms\n` +
          `   Agent: ${subtask.agent}\n` +
          `   Task: "${subtask.task.substring(0, 80)}${subtask.task.length > 80 ? '...' : ''}"`
        );
        resolve(null); // Resolve with null instead of reject for graceful degradation
      }, SUBTASK_TIMEOUT_MS);
    });

    const executionPromise = executeForcedRouting(
      subtask.task,
      subtask.agent,
      startTime,
      webSearchEnabled
    );

    try {
      const result = await Promise.race([executionPromise, timeoutPromise]);

      // 🎯 P1 Fix: Clear timeout if execution completed before timeout
      if (timeoutId !== null && !isTimedOut) {
        clearTimeout(timeoutId);
      }

      return {
        subtask,
        result,
        index,
      };
    } catch (error) {
      // 🎯 P1 Fix: Ensure cleanup even on error
      if (timeoutId !== null && !isTimedOut) {
        clearTimeout(timeoutId);
      }
      console.error(`❌ [Parallel] Subtask ${index + 1} error:`, error);
      return {
        subtask,
        result: null,
        index,
      };
    }
  });

  const results = await Promise.all(subtaskPromises);

  // 🎯 P1 Fix: Enhanced failure logging with details
  const successfulResults = results.filter(r => r.result !== null);
  const failedResults = results.filter(r => r.result === null);

  if (failedResults.length > 0) {
    console.warn(
      `⚠️ [Parallel] ${failedResults.length}/${results.length} subtasks failed:\n` +
      failedResults.map(r => `   - [${r.index + 1}] ${r.subtask.agent}: "${r.subtask.task.substring(0, 50)}..."`).join('\n')
    );
  }

  if (successfulResults.length === 0) {
    console.error('❌ [Parallel] All subtasks failed - no results to aggregate');
    return null;
  }

  // Unify results
  const unifiedResponse = unifyResults(
    successfulResults.map(r => ({
      agent: r.subtask.agent,
      response: r.result!.response,
    })),
    query
  );

  // Aggregate metadata
  const durationMs = Date.now() - startTime;
  const handoffs = successfulResults.flatMap(r => r.result!.handoffs);
  const toolsCalled = [...new Set(successfulResults.flatMap(r => r.result!.toolsCalled))];
  const totalTokens = successfulResults.reduce((sum, r) => sum + (r.result!.usage?.totalTokens ?? 0), 0);

  console.log(`✅ [Parallel] Completed ${successfulResults.length}/${subtasks.length} subtasks in ${durationMs}ms`);

  // 🎯 P1-2: Save findings from each agent to session context
  if (sessionId) {
    for (const result of successfulResults) {
      await saveAgentFindingsToContext(sessionId, result.subtask.agent, result.result!.response);
    }
  }

  return {
    success: true,
    response: unifiedResponse,
    handoffs,
    finalAgent: 'Orchestrator (Multi-Agent)',
    toolsCalled,
    usage: {
      promptTokens: successfulResults.reduce((sum, r) => sum + (r.result!.usage?.promptTokens ?? 0), 0),
      completionTokens: successfulResults.reduce((sum, r) => sum + (r.result!.usage?.completionTokens ?? 0), 0),
      totalTokens,
    },
    metadata: {
      provider: 'multi-agent',
      modelId: 'orchestrator-worker',
      totalRounds: successfulResults.length,
      durationMs,
    },
  };
}

/**
 * Unify results from multiple agents into a coherent response
 *
 * @param agentResults - Array of agent responses
 * @param originalQuery - Original user query for context
 * @returns Unified response string
 */
function unifyResults(
  agentResults: Array<{ agent: string; response: string }>,
  originalQuery: string
): string {
  if (agentResults.length === 0) {
    return '결과를 생성할 수 없습니다.';
  }

  if (agentResults.length === 1) {
    return agentResults[0].response;
  }

  // Build unified response with section headers
  const sections = agentResults.map(({ agent, response }) => {
    const agentLabel = agent.replace(' Agent', '');
    return `## ${agentLabel} 분석\n${response}`;
  });

  return `# 종합 분석 결과\n\n${sections.join('\n\n---\n\n')}`;
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

  // Resolve web search setting for this request
  const webSearchEnabled = resolveWebSearchSetting(request.enableWebSearch, query);
  console.log(`🔍 [WebSearch] Setting resolved: ${webSearchEnabled} (request: ${request.enableWebSearch})`);

  // 🎯 P1-2: Initialize session context for agent communication
  const sessionContext = await getOrCreateSessionContext(request.sessionId, query);
  console.log(`📋 [Context] Session ${request.sessionId}: ${sessionContext.handoffs.length} previous handoffs`);

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
  // Orchestrator-Worker: Try task decomposition for complex queries
  // =========================================================================
  const decomposition = await decomposeTask(query);

  if (decomposition && decomposition.subtasks.length > 1) {
    console.log(`🔀 [Orchestrator] Complex query detected, using Orchestrator-Worker pattern`);

    if (decomposition.requiresSequential) {
      // Sequential execution for dependent tasks
      console.log('📋 [Orchestrator] Executing subtasks sequentially (dependencies detected)');
      let lastResult: MultiAgentResponse | null = null;

      for (const subtask of decomposition.subtasks) {
        lastResult = await executeForcedRouting(subtask.task, subtask.agent, startTime, webSearchEnabled);
        if (!lastResult) {
          console.warn(`⚠️ [Orchestrator] Sequential subtask failed: ${subtask.agent}`);
          break;
        }
        // 🎯 P1-2: Save findings from each sequential subtask
        await saveAgentFindingsToContext(request.sessionId, subtask.agent, lastResult.response);
      }

      if (lastResult) {
        return lastResult;
      }
    } else {
      // Parallel execution for independent tasks
      // 🎯 P1-2: Pass sessionId for context saving
      const parallelResult = await executeParallelSubtasks(
        decomposition.subtasks,
        query,
        startTime,
        webSearchEnabled,
        request.sessionId
      );

      if (parallelResult) {
        return parallelResult;
      }
    }

    console.log('🔄 [Orchestrator] Task decomposition failed, falling back to single-agent routing');
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
      startTime,
      webSearchEnabled
    );
    if (forcedResult) {
      console.log(`✅ [Orchestrator] Forced routing succeeded`);
      // 🎯 P1-2: Save agent findings to session context
      await saveAgentFindingsToContext(request.sessionId, preFilterResult.suggestedAgent, forcedResult.response);
      return forcedResult;
    }
    // If forced routing fails, fall through to LLM routing
    console.log('🔄 [Orchestrator] Forced routing failed, falling back to LLM routing');
  } else {
    console.log(`⏭️ [Orchestrator] Skipping forced routing (conditions not met)`);
  }

  // =========================================================================
  // Slow Path: LLM-based routing for complex queries (AI SDK v6 Native)
  // =========================================================================

  // Fetch fresh model config per request (avoids stale data on provider failover)
  const orchestratorModelConfig = getOrchestratorModel();

  if (!orchestratorModelConfig) {
    return {
      success: false,
      error: 'Orchestrator not available (no AI provider configured)',
      code: 'MODEL_UNAVAILABLE',
    };
  }

  try {
    const { model, provider, modelId } = orchestratorModelConfig;

    console.log(`🎯 [Orchestrator] LLM routing with ${provider}/${modelId} (suggested: ${preFilterResult.suggestedAgent || 'none'})`);

    // Use generateObject for type-safe structured routing decision
    const routingPrompt = `사용자 질문을 분석하고 적절한 에이전트를 선택하세요.

## 사용 가능한 에이전트
- NLQ Agent: 서버 상태 조회, CPU/메모리/디스크 메트릭, 필터링, 요약
- Analyst Agent: 이상 탐지, 트렌드 예측, 패턴 분석, 근본 원인 분석
- Reporter Agent: 장애 보고서 생성, 인시던트 타임라인
- Advisor Agent: 문제 해결 방법, CLI 명령어 추천, 과거 사례 검색

## 사용자 질문
${query}

## 판단 기준
- 서버/모니터링 관련 질문 → 적절한 에이전트 선택
- 일반 대화(인사, 날씨, 시간 등) → NONE`;

    // 🎯 P2-5 Fix: Properly initialized timeout variables to avoid undefined issues
    // Execute routing decision with timeout protection
    let timeoutId: NodeJS.Timeout | null = null;
    let warnTimer: NodeJS.Timeout | null = null;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`Orchestrator timeout after ${ORCHESTRATOR_CONFIG.timeout}ms`));
      }, ORCHESTRATOR_CONFIG.timeout);
    });

    warnTimer = setTimeout(() => {
      console.warn(`⚠️ [Orchestrator] Execution exceeding ${ORCHESTRATOR_CONFIG.warnThreshold}ms threshold`);
    }, ORCHESTRATOR_CONFIG.warnThreshold);

    let routingDecision: RoutingDecision;
    try {
      // Use generateObject for type-safe structured output
      const routingResult = await Promise.race([
        generateObject({
          model,
          schema: routingSchema,
          system: ORCHESTRATOR_INSTRUCTIONS,
          prompt: routingPrompt,
          temperature: 0.1, // Low temperature for consistent routing
        }),
        timeoutPromise,
      ]);
      routingDecision = routingResult.object;
    } finally {
      // 🎯 P2-5: Safe cleanup with null checks (no non-null assertion)
      if (timeoutId) clearTimeout(timeoutId);
      if (warnTimer) clearTimeout(warnTimer);
    }

    console.log(`🎯 [Orchestrator] LLM routing decision: ${routingDecision.selectedAgent} (confidence: ${routingDecision.confidence.toFixed(2)}, reason: ${routingDecision.reasoning})`);

    // Get selected agent from structured response (type-safe, no regex)
    const selectedAgent = getAgentFromRouting(routingDecision);

    if (selectedAgent) {
      // Execute the selected agent
      recordHandoff('Orchestrator', selectedAgent, 'LLM routing');
      // 🎯 P1-2: Record handoff to session context for agent communication
      await recordHandoffEvent(request.sessionId, 'Orchestrator', selectedAgent, 'LLM routing');

      const agentResult = await executeForcedRouting(query, selectedAgent, startTime, webSearchEnabled);

      if (agentResult) {
        // 🎯 P1-2: Save agent findings to session context
        await saveAgentFindingsToContext(request.sessionId, selectedAgent, agentResult.response);

        return {
          ...agentResult,
          handoffs: [{
            from: 'Orchestrator',
            to: selectedAgent,
            reason: 'LLM routing decision',
          }],
        };
      }
    }

    // If routing failed or returned NONE, try pre-filter suggestion as fallback
    const suggestedAgent = preFilterResult.suggestedAgent;
    if (suggestedAgent && preFilterResult.confidence >= 0.5) {
      console.log(`🔄 [Orchestrator] LLM routing inconclusive, falling back to ${suggestedAgent}`);

      const fallbackResult = await executeForcedRouting(query, suggestedAgent, startTime, webSearchEnabled);

      if (fallbackResult) {
        // 🎯 P1-2: Save agent findings to session context
        await saveAgentFindingsToContext(request.sessionId, suggestedAgent, fallbackResult.response);

        return {
          ...fallbackResult,
          handoffs: [{
            from: 'Orchestrator',
            to: suggestedAgent,
            reason: 'Fallback routing (LLM inconclusive)',
          }],
        };
      }
    }

    // Last resort: Direct response from orchestrator (no suitable agent found)
    const durationMs = Date.now() - startTime;
    const fallbackResponse = routingDecision.reasoning || '죄송합니다. 질문을 처리할 적절한 에이전트를 찾지 못했습니다.';

    return {
      success: true,
      response: fallbackResponse,
      handoffs: [],
      finalAgent: 'Orchestrator',
      toolsCalled: [],
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      },
      metadata: {
        provider,
        modelId,
        totalRounds: 1,
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

  // Resolve web search setting for this request
  const webSearchEnabled = resolveWebSearchSetting(request.enableWebSearch, query);
  console.log(`🔍 [Stream WebSearch] Setting resolved: ${webSearchEnabled} (request: ${request.enableWebSearch})`);

  // 🎯 P1-2: Initialize session context for agent communication
  const sessionContext = await getOrCreateSessionContext(request.sessionId, query);
  console.log(`📋 [Stream Context] Session ${request.sessionId}: ${sessionContext.handoffs.length} previous handoffs`);

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
  // Forced Routing: Use pre-filter suggestion if confidence is high
  // =========================================================================
  if (preFilterResult.suggestedAgent && preFilterResult.confidence >= 0.8) {
    console.log(`🚀 [Stream] Forced routing to ${preFilterResult.suggestedAgent}`);
    yield* executeAgentStream(
      query,
      preFilterResult.suggestedAgent,
      startTime,
      request.sessionId,
      webSearchEnabled
    );
    return;
  }

  // =========================================================================
  // LLM-based routing for complex queries (AI SDK v6 Native)
  // =========================================================================

  // Fetch fresh model config per request (avoids stale data on provider failover)
  const orchestratorModelConfig = getOrchestratorModel();

  if (!orchestratorModelConfig) {
    yield { type: 'error', data: { code: 'MODEL_UNAVAILABLE', error: 'Orchestrator not available' } };
    return;
  }

  try {
    const { model, provider, modelId } = orchestratorModelConfig;

    console.log(`🎯 [Stream Orchestrator] Starting with ${provider}/${modelId}`);

    // Quick routing decision using generateObject for type-safe structured output
    const routingPrompt = `사용자 질문을 분석하고 적절한 에이전트를 선택하세요.

## 사용 가능한 에이전트
- NLQ Agent: 서버 상태 조회, CPU/메모리/디스크 메트릭, 필터링, 요약
- Analyst Agent: 이상 탐지, 트렌드 예측, 패턴 분석, 근본 원인 분석
- Reporter Agent: 장애 보고서 생성, 인시던트 타임라인
- Advisor Agent: 문제 해결 방법, CLI 명령어 추천, 과거 사례 검색

## 사용자 질문
${query}

## 판단 기준
- 서버/모니터링 관련 질문 → 적절한 에이전트 선택
- 일반 대화(인사, 날씨, 시간 등) → NONE`;

    const routingResult = await generateObject({
      model,
      schema: routingSchema,
      system: '에이전트 라우터입니다. 사용자 질문에 가장 적합한 에이전트를 선택하세요.',
      prompt: routingPrompt,
      temperature: 0.1,
    });

    const routingDecision = routingResult.object;
    console.log(`🎯 [Stream] LLM routing decision: ${routingDecision.selectedAgent} (confidence: ${routingDecision.confidence.toFixed(2)})`);

    // Get selected agent from structured response (type-safe, no regex)
    const selectedAgent = getAgentFromRouting(routingDecision);

    if (selectedAgent) {
      recordHandoff('Orchestrator', selectedAgent, 'LLM routing');
      // 🎯 P1-2: Record handoff to session context for agent communication
      await recordHandoffEvent(request.sessionId, 'Orchestrator', selectedAgent, 'LLM routing');
      yield { type: 'handoff', data: { from: 'Orchestrator', to: selectedAgent, reason: 'LLM routing' } };

      yield* executeAgentStream(query, selectedAgent, startTime, request.sessionId, webSearchEnabled);
      return;
    }

    // Fallback to pre-filter suggestion
    const suggestedAgent = preFilterResult.suggestedAgent;
    if (suggestedAgent && preFilterResult.confidence >= 0.5) {
      console.log(`🔄 [Stream] Fallback to ${suggestedAgent}`);
      recordHandoff('Orchestrator', suggestedAgent, 'Fallback routing');
      // 🎯 P1-2: Record handoff to session context for agent communication
      await recordHandoffEvent(request.sessionId, 'Orchestrator', suggestedAgent, 'Fallback routing');
      yield { type: 'handoff', data: { from: 'Orchestrator', to: suggestedAgent, reason: 'Fallback' } };

      yield* executeAgentStream(query, suggestedAgent, startTime, request.sessionId, webSearchEnabled);
      return;
    }

    // No suitable agent found
    const durationMs = Date.now() - startTime;
    yield { type: 'text_delta', data: '죄송합니다. 질문을 처리할 적절한 에이전트를 찾지 못했습니다. 서버 상태, 분석, 보고서, 해결 방법 등에 대해 질문해 주세요.' };
    yield {
      type: 'done',
      data: {
        success: true,
        finalAgent: 'Orchestrator',
        toolsCalled: [],
        handoffs: [],
        usage: {
          promptTokens: routingResult.usage?.inputTokens ?? 0,
          completionTokens: routingResult.usage?.outputTokens ?? 0,
        },
        metadata: { provider, modelId, durationMs },
      },
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error(`❌ [Stream Orchestrator] Error after ${durationMs}ms:`, errorMessage);

    let code = 'UNKNOWN_ERROR';
    if (errorMessage.includes('API key')) code = 'AUTH_ERROR';
    else if (errorMessage.includes('rate limit')) code = 'RATE_LIMIT';
    else if (errorMessage.includes('timeout')) code = 'TIMEOUT';
    else if (errorMessage.includes('model')) code = 'MODEL_ERROR';

    yield { type: 'error', data: { code, error: errorMessage } };
  }
}

/**
 * Stream agent response using AI SDK v6 streamText
 */
async function* executeAgentStream(
  query: string,
  agentName: string,
  startTime: number,
  sessionId: string,
  webSearchEnabled = true
): AsyncGenerator<StreamEvent> {
  const agentConfig = getAgentConfig(agentName);

  if (!agentConfig) {
    yield { type: 'error', data: { code: 'AGENT_NOT_FOUND', error: `Agent ${agentName} not found` } };
    return;
  }

  const modelResult = agentConfig.getModel();
  if (!modelResult) {
    yield { type: 'error', data: { code: 'MODEL_UNAVAILABLE', error: `No model available for ${agentName}` } };
    return;
  }

  const { model, provider, modelId } = modelResult;
  console.log(`🤖 [Stream ${agentName}] Using ${provider}/${modelId}`);

  // Filter tools based on web search setting
  const filteredTools = filterToolsByWebSearch(agentConfig.tools, webSearchEnabled);

  // Langfuse timeout span
  const timeoutSpan = createTimeoutSpan(sessionId, `${agentName}_stream`, ORCHESTRATOR_CONFIG.timeout);

  try {
    // AI SDK v6 Best Practice: Use hasToolCall('finalAnswer') + stepCountIs(N) for graceful termination
    const streamResult = streamText({
      model,
      messages: [
        { role: 'system', content: agentConfig.instructions },
        { role: 'user', content: query },
      ],
      tools: filteredTools as Parameters<typeof generateText>[0]['tools'],
      stopWhen: [hasToolCall('finalAnswer'), stepCountIs(3)], // Graceful termination + safety limit
      temperature: 0.4,
      maxOutputTokens: 1536,
    });

    let warningEmitted = false;
    let hardTimeoutReached = false;
    let textEmitted = false; // Track if any text was emitted
    const toolsCalled: string[] = [];

    // Stream text deltas
    for await (const textChunk of streamResult.textStream) {
      const elapsed = Date.now() - startTime;

      // Hard timeout check
      if (elapsed >= ORCHESTRATOR_CONFIG.hardTimeout) {
        hardTimeoutReached = true;
        console.error(`🛑 [Stream ${agentName}] Hard timeout at ${elapsed}ms`);

        logTimeoutEvent('error', {
          operation: `${agentName}_stream_hard_timeout`,
          elapsed,
          threshold: ORCHESTRATOR_CONFIG.hardTimeout,
          sessionId,
        });

        yield {
          type: 'error',
          data: {
            code: 'HARD_TIMEOUT',
            error: `처리 시간이 ${ORCHESTRATOR_CONFIG.hardTimeout / 1000}초를 초과했습니다.`,
            elapsed,
          },
        };

        // 🎯 P0 Fix: Graceful stream abort to prevent resource leak
        try {
          const iterator = streamResult.textStream[Symbol.asyncIterator]();
          await iterator.return?.();
        } catch {
          // Silent - best effort cleanup
        }

        return;
      }

      // Warning at threshold
      if (!warningEmitted && elapsed >= ORCHESTRATOR_CONFIG.warnThreshold) {
        warningEmitted = true;
        console.warn(`⚠️ [Stream ${agentName}] Exceeding ${ORCHESTRATOR_CONFIG.warnThreshold}ms`);

        yield {
          type: 'warning',
          data: {
            code: 'SLOW_PROCESSING',
            message: '처리 시간이 25초를 초과했습니다.',
            elapsed,
          },
        };

        logTimeoutEvent('warning', {
          operation: `${agentName}_stream`,
          elapsed,
          threshold: ORCHESTRATOR_CONFIG.warnThreshold,
          sessionId,
        });
      }

      const sanitized = sanitizeChineseCharacters(textChunk);
      if (sanitized) {
        textEmitted = true;
        yield { type: 'text_delta', data: sanitized };
      }
    }

    if (hardTimeoutReached) return;

    // Gather metadata
    const [steps, usage] = await Promise.all([streamResult.steps, streamResult.usage]);
    const finalElapsed = Date.now() - startTime;
    timeoutSpan.complete(true, finalElapsed);

    // Extract tool calls and check for finalAnswer
    let finalAnswerResult: { answer: string } | null = null;

    if (steps) {
      for (const step of steps) {
        if (step.toolCalls) {
          for (const tc of step.toolCalls) {
            toolsCalled.push(tc.toolName);
            yield { type: 'tool_call', data: { name: tc.toolName } };
          }
        }
        // AI SDK v6 Best Practice: Extract finalAnswer result if called
        if (step.toolResults) {
          for (const tr of step.toolResults) {
            if ('result' in tr && tr.toolName === 'finalAnswer' && tr.result && typeof tr.result === 'object') {
              finalAnswerResult = tr.result as { answer: string };
            }
          }
        }
      }
    }

    // If no text was emitted but finalAnswer exists, emit it
    if (!textEmitted && finalAnswerResult?.answer) {
      const sanitized = sanitizeChineseCharacters(finalAnswerResult.answer);
      if (sanitized) {
        yield { type: 'text_delta', data: sanitized };
      }
    }

    const durationMs = Date.now() - startTime;
    console.log(`✅ [Stream ${agentName}] Completed in ${durationMs}ms, tools: [${toolsCalled.join(', ')}]`);

    yield {
      type: 'done',
      data: {
        success: true,
        finalAgent: agentName,
        toolsCalled,
        handoffs: [{ from: 'Orchestrator', to: agentName, reason: 'Routing' }],
        usage: {
          promptTokens: usage?.inputTokens ?? 0,
          completionTokens: usage?.outputTokens ?? 0,
        },
        metadata: { provider, modelId, durationMs },
      },
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ [Stream ${agentName}] Error after ${durationMs}ms:`, errorMessage);

    yield { type: 'error', data: { code: 'STREAM_ERROR', error: errorMessage } };
  }
}
