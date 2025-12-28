/**
 * Shared Context Store
 * 에이전트 간 결과 공유를 위한 Redis 기반 컨텍스트 저장소
 *
 * ## Phase 2: 역할 분리 (2025-12-27)
 * - 에이전트 간 중복 분석 방지
 * - Reporter가 NLQ/Analyst 결과를 직접 참조
 * - TTL 10분으로 세션 범위 내 유효
 */

import { getRedisClient } from './redis-client';

// ============================================================================
// 1. Types
// ============================================================================

export type AgentName = 'nlq' | 'analyst' | 'rca' | 'capacity' | 'reporter' | 'supervisor';

export interface AgentResult {
  agentName: AgentName;
  timestamp: string;
  success: boolean;
  data: unknown;
  compressed?: unknown; // 압축된 요약 (Phase 1에서 추가)
}

export interface SharedContext {
  sessionId: string;
  query: string;
  results: Map<AgentName, AgentResult>;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// 2. Constants
// ============================================================================

const CONTEXT_TTL = 600; // 10분
const KEY_PREFIX = 'agent:context';
const RESULT_PREFIX = 'agent:result';

// ============================================================================
// 3. Context Store Functions
// ============================================================================

/**
 * 에이전트 결과 저장
 * @param sessionId 세션 ID
 * @param agentName 에이전트 이름
 * @param result 결과 데이터
 */
export async function saveAgentResult(
  sessionId: string,
  agentName: AgentName,
  result: unknown,
  compressed?: unknown
): Promise<void> {
  const redis = getRedisClient();
  if (!redis) {
    console.warn('⚠️ [SharedContext] Redis not available, skipping save');
    return;
  }

  const key = `${RESULT_PREFIX}:${sessionId}:${agentName}`;
  const agentResult: AgentResult = {
    agentName,
    timestamp: new Date().toISOString(),
    success: true,
    data: result,
    compressed,
  };

  try {
    await redis.set(key, JSON.stringify(agentResult), { ex: CONTEXT_TTL });
    console.log(`📝 [SharedContext] Saved result for ${agentName} (session: ${sessionId.slice(0, 8)}...)`);
  } catch (error) {
    console.error(`❌ [SharedContext] Failed to save result:`, error);
  }
}

/**
 * 에이전트 결과 조회
 * @param sessionId 세션 ID
 * @param agentName 에이전트 이름
 */
export async function getAgentResult(
  sessionId: string,
  agentName: AgentName
): Promise<AgentResult | null> {
  const redis = getRedisClient();
  if (!redis) {
    console.warn('⚠️ [SharedContext] Redis not available');
    return null;
  }

  const key = `${RESULT_PREFIX}:${sessionId}:${agentName}`;

  try {
    const data = await redis.get(key);
    if (!data) {
      return null;
    }
    return JSON.parse(data as string) as AgentResult;
  } catch (error) {
    console.error(`❌ [SharedContext] Failed to get result:`, error);
    return null;
  }
}

/**
 * 여러 에이전트 결과 일괄 조회
 * @param sessionId 세션 ID
 * @param agentNames 조회할 에이전트 목록
 */
export async function getMultipleAgentResults(
  sessionId: string,
  agentNames: AgentName[]
): Promise<Map<AgentName, AgentResult>> {
  const results = new Map<AgentName, AgentResult>();

  for (const agentName of agentNames) {
    const result = await getAgentResult(sessionId, agentName);
    if (result) {
      results.set(agentName, result);
    }
  }

  return results;
}

/**
 * 세션의 모든 컨텍스트 삭제
 * @param sessionId 세션 ID
 */
export async function clearSessionContext(sessionId: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) {
    return;
  }

  const agents: AgentName[] = ['nlq', 'analyst', 'rca', 'capacity', 'reporter', 'supervisor'];

  for (const agent of agents) {
    const key = `${RESULT_PREFIX}:${sessionId}:${agent}`;
    await redis.del(key);
  }

  console.log(`🗑️ [SharedContext] Cleared context for session: ${sessionId.slice(0, 8)}...`);
}

// ============================================================================
// 4. Context Builder (Reporter용)
// ============================================================================

export interface ReporterContext {
  nlqResult?: {
    summary: string;
    servers?: unknown[];
    metrics?: unknown;
  };
  analystResult?: {
    anomalies: unknown[];
    trends: unknown[];
    confidence: number;
    summary: string;
  };
  // NEW: RCA Agent 결과
  rcaResult?: {
    rootCause: string;
    confidence: number;
    evidence: string[];
    timelineSummary?: string;
    correlationSummary?: string;
    suggestedFix?: string;
  };
  // NEW: Capacity Agent 결과
  capacityResult?: {
    predictionSummary: string;
    urgentMetrics: string[];
    recommendations: Array<{
      type: string;
      resource: string;
      priority: string;
      summary: string;
    }>;
    growthTrends?: Record<string, unknown>;
  };
}

/**
 * Reporter Agent용 컨텍스트 빌드
 * NLQ, Analyst, RCA, Capacity 결과를 압축된 형태로 반환
 */
export async function buildReporterContext(
  sessionId: string
): Promise<ReporterContext> {
  const context: ReporterContext = {};

  // NLQ 결과 조회
  const nlqResult = await getAgentResult(sessionId, 'nlq');
  if (nlqResult?.compressed) {
    context.nlqResult = nlqResult.compressed as ReporterContext['nlqResult'];
  } else if (nlqResult?.data) {
    // 압축된 결과가 없으면 원본에서 추출
    const data = nlqResult.data as Record<string, unknown>;
    context.nlqResult = {
      summary: String(data.response || data.summary || ''),
      servers: data.servers as unknown[],
      metrics: data.metrics,
    };
  }

  // Analyst 결과 조회
  const analystResult = await getAgentResult(sessionId, 'analyst');
  if (analystResult?.compressed) {
    context.analystResult = analystResult.compressed as ReporterContext['analystResult'];
  } else if (analystResult?.data) {
    // 압축된 결과가 없으면 원본에서 추출
    const data = analystResult.data as Record<string, unknown>;
    context.analystResult = {
      anomalies: (data.anomalies || []) as unknown[],
      trends: (data.trends || []) as unknown[],
      confidence: (data.confidence || 0) as number,
      summary: String(data.summary || ''),
    };
  }

  // RCA 결과 조회 (NEW)
  const rcaResult = await getAgentResult(sessionId, 'rca');
  if (rcaResult?.compressed) {
    context.rcaResult = rcaResult.compressed as ReporterContext['rcaResult'];
  } else if (rcaResult?.data) {
    const data = rcaResult.data as Record<string, unknown>;
    context.rcaResult = {
      rootCause: String(data.rootCause || ''),
      confidence: (data.confidence || 0) as number,
      evidence: (data.evidence || []) as string[],
      timelineSummary: String(data.timelineSummary || ''),
      correlationSummary: String(data.correlationSummary || ''),
      suggestedFix: String(data.suggestedFix || ''),
    };
  }

  // Capacity 결과 조회 (NEW)
  const capacityResult = await getAgentResult(sessionId, 'capacity');
  if (capacityResult?.compressed) {
    context.capacityResult = capacityResult.compressed as ReporterContext['capacityResult'];
  } else if (capacityResult?.data) {
    const data = capacityResult.data as Record<string, unknown>;
    context.capacityResult = {
      predictionSummary: String(data.predictionSummary || ''),
      urgentMetrics: (data.urgentMetrics || []) as string[],
      recommendations: (data.recommendations || []) as Array<{
        type: string;
        resource: string;
        priority: string;
        summary: string;
      }>,
      growthTrends: data.growthTrends as Record<string, unknown>,
    };
  }

  return context;
}

/**
 * 컨텍스트를 프롬프트 문자열로 변환
 */
export function formatContextForPrompt(context: ReporterContext): string {
  const parts: string[] = [];

  if (context.nlqResult) {
    parts.push(`## NLQ 분석 결과\n${context.nlqResult.summary || '분석 결과 없음'}`);
  }

  if (context.analystResult) {
    const { anomalies, trends, confidence, summary } = context.analystResult;
    const anomalyCount = Array.isArray(anomalies) ? anomalies.length : 0;
    const trendCount = Array.isArray(trends) ? trends.length : 0;

    parts.push(`## Analyst 분석 결과
- 이상 감지: ${anomalyCount}건
- 트렌드: ${trendCount}건
- 신뢰도: ${(confidence * 100).toFixed(1)}%
- 요약: ${summary || '분석 결과 없음'}`);
  }

  // RCA 분석 결과 (NEW)
  if (context.rcaResult) {
    const { rootCause, confidence, evidence, timelineSummary, suggestedFix } = context.rcaResult;
    parts.push(`## RCA 분석 결과
- **근본 원인**: ${rootCause || '알 수 없음'}
- **신뢰도**: ${(confidence * 100).toFixed(1)}%
- **증거**: ${evidence?.join(', ') || '없음'}
- **타임라인**: ${timelineSummary || '없음'}
- **권장 조치**: ${suggestedFix || '없음'}`);
  }

  // Capacity 분석 결과 (NEW)
  if (context.capacityResult) {
    const { predictionSummary, urgentMetrics, recommendations } = context.capacityResult;
    const recSummary = recommendations?.map(r => `${r.resource}: ${r.summary}`).join(', ') || '없음';
    parts.push(`## Capacity 분석 결과
- **예측 요약**: ${predictionSummary || '없음'}
- **긴급 메트릭**: ${urgentMetrics?.join(', ') || '없음'}
- **권장사항**: ${recSummary}`);
  }

  return parts.length > 0
    ? parts.join('\n\n')
    : '이전 분석 결과 없음 (독립 실행 모드)';
}

// ============================================================================
// 5. Generic Agent Context Builder (Phase 5.2)
// ============================================================================

/**
 * Agent 의존성 맵
 * RCA, Capacity는 NLQ + Analyst 결과 필요
 */
const AGENT_DEPENDENCIES: Record<AgentName, AgentName[]> = {
  nlq: [],
  analyst: ['nlq'],
  rca: ['nlq', 'analyst'],
  capacity: ['nlq', 'analyst'],
  reporter: [], // Reporter uses buildReporterContext() instead
  supervisor: [],
};

/**
 * RCA/Capacity Agent용 의존성 컨텍스트
 */
export interface AdvancedAgentContext {
  nlqResult?: {
    summary: string;
    servers?: unknown[];
    metrics?: unknown;
  };
  analystResult?: {
    anomalies: unknown[];
    trends: unknown[];
    confidence: number;
    summary: string;
  };
}

/**
 * 범용 에이전트 컨텍스트 빌더
 * 의존성 기반으로 필요한 결과만 조회
 *
 * @param sessionId 세션 ID
 * @param agentName 컨텍스트를 요청하는 에이전트
 * @returns 의존성 에이전트 결과 맵
 */
export async function buildAgentContext(
  sessionId: string,
  agentName: AgentName
): Promise<AdvancedAgentContext> {
  const dependencies = AGENT_DEPENDENCIES[agentName] || [];
  const context: AdvancedAgentContext = {};

  if (dependencies.length === 0) {
    return context; // 의존성 없음
  }

  // NLQ 결과 조회
  if (dependencies.includes('nlq')) {
    const nlqResult = await getAgentResult(sessionId, 'nlq');
    if (nlqResult?.compressed) {
      context.nlqResult = nlqResult.compressed as AdvancedAgentContext['nlqResult'];
    } else if (nlqResult?.data) {
      const data = nlqResult.data as Record<string, unknown>;
      context.nlqResult = {
        summary: String(data.response || data.summary || ''),
        servers: data.servers as unknown[],
        metrics: data.metrics,
      };
    }
  }

  // Analyst 결과 조회
  if (dependencies.includes('analyst')) {
    const analystResult = await getAgentResult(sessionId, 'analyst');
    if (analystResult?.compressed) {
      context.analystResult = analystResult.compressed as AdvancedAgentContext['analystResult'];
    } else if (analystResult?.data) {
      const data = analystResult.data as Record<string, unknown>;
      context.analystResult = {
        anomalies: (data.anomalies || []) as unknown[],
        trends: (data.trends || []) as unknown[],
        confidence: (data.confidence || 0) as number,
        summary: String(data.summary || ''),
      };
    }
  }

  return context;
}

/**
 * 컨텍스트 유효성 검사
 * RCA/Capacity 실행 전 의존성 충족 확인
 */
export async function hasRequiredDependencies(
  sessionId: string,
  agentName: AgentName
): Promise<{ valid: boolean; missing: AgentName[] }> {
  const dependencies = AGENT_DEPENDENCIES[agentName] || [];
  const missing: AgentName[] = [];

  for (const dep of dependencies) {
    const result = await getAgentResult(sessionId, dep);
    if (!result) {
      missing.push(dep);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}
