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

export type AgentName = 'nlq' | 'analyst' | 'reporter' | 'supervisor';

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

  const agents: AgentName[] = ['nlq', 'analyst', 'reporter', 'supervisor'];

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
}

/**
 * Reporter Agent용 컨텍스트 빌드
 * NLQ와 Analyst 결과를 압축된 형태로 반환
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

  return parts.length > 0
    ? parts.join('\n\n')
    : '이전 분석 결과 없음 (독립 실행 모드)';
}
