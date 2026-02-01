/**
 * Agent Context Store
 *
 * Redis-based session context storage for multi-agent communication.
 * Enables agents to share findings, handoff state, and accumulated context.
 *
 * Architecture:
 * - Redis key: ai:context:{sessionId}
 * - TTL: 10 minutes (short sessions optimization)
 * - Fallback: In-memory store for Redis unavailability
 *
 * @version 1.0.0
 * @created 2026-01-25
 */

import { getRedisClient } from '../../../lib/redis-client';
import { logger } from '../../../lib/logger';

// ============================================================================
// Types
// ============================================================================

/**
 * Anomaly data structure from Analyst Agent
 */
export interface AnomalyData {
  serverId: string;
  serverName: string;
  metric: 'cpu' | 'memory' | 'disk' | 'network';
  value: number;
  threshold: number;
  severity: 'warning' | 'critical';
  detectedAt: string;
  description?: string;
}

/**
 * Root cause analysis result from Reporter/Analyst Agent
 */
export interface RootCauseData {
  cause: string;
  confidence: number;
  evidence: string[];
  suggestedFix: string;
  analyzedAt: string;
}

/**
 * Metric snapshot for context sharing
 */
export interface MetricSnapshot {
  serverId: string;
  serverName: string;
  cpu: number;
  memory: number;
  disk: number;
  status: 'normal' | 'warning' | 'critical';
  timestamp: string;
}

/**
 * Handoff event tracking
 */
export interface HandoffEvent {
  from: string;
  to: string;
  reason?: string;
  timestamp: string;
  context?: string;
}

/**
 * Structured findings from all agents
 */
export interface AgentFindings {
  /** Anomalies detected by Analyst Agent */
  anomalies: AnomalyData[];
  /** Root cause analysis from Reporter/Analyst */
  rootCause: RootCauseData | null;
  /** Affected servers from NLQ Agent queries */
  affectedServers: string[];
  /** Metric snapshots from NLQ Agent */
  metrics: MetricSnapshot[];
  /** Knowledge base search results from Advisor */
  knowledgeResults: string[];
  /** Recommended commands from Advisor */
  recommendedCommands: string[];
}

/**
 * Complete session context
 */
export interface AgentContext {
  sessionId: string;
  findings: AgentFindings;
  lastAgent: string;
  handoffs: HandoffEvent[];
  query: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Configuration
// ============================================================================

const CONTEXT_CONFIG = {
  /** Redis key prefix */
  keyPrefix: 'ai:context:',
  /** TTL in seconds (10 minutes) */
  ttlSeconds: 600,
  /** Maximum handoff history */
  maxHandoffs: 20,
  /** Maximum anomalies to store */
  maxAnomalies: 50,
  /** Maximum metrics to store */
  maxMetrics: 100,
} as const;

// ============================================================================
// In-Memory Fallback Store
// ============================================================================

const inMemoryStore = new Map<string, { context: AgentContext; expiresAt: number }>();

/**
 * Clean expired entries from in-memory store
 */
function cleanExpiredEntries(): void {
  const now = Date.now();
  for (const [key, value] of inMemoryStore) {
    if (value.expiresAt < now) {
      inMemoryStore.delete(key);
    }
  }
}

// ============================================================================
// Redis Key Helpers
// ============================================================================

function getRedisKey(sessionId: string): string {
  return `${CONTEXT_CONFIG.keyPrefix}${sessionId}`;
}

// ============================================================================
// Default Context Factory
// ============================================================================

function createDefaultContext(sessionId: string, query: string = ''): AgentContext {
  const now = new Date().toISOString();
  return {
    sessionId,
    findings: {
      anomalies: [],
      rootCause: null,
      affectedServers: [],
      metrics: [],
      knowledgeResults: [],
      recommendedCommands: [],
    },
    lastAgent: 'Orchestrator',
    handoffs: [],
    query,
    createdAt: now,
    updatedAt: now,
  };
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Get session context from Redis or memory
 *
 * @param sessionId - Unique session identifier
 * @returns AgentContext or null if not found
 */
export async function getSessionContext(sessionId: string): Promise<AgentContext | null> {
  const redis = getRedisClient();
  const key = getRedisKey(sessionId);

  // Try Redis first
  if (redis) {
    try {
      const data = await redis.get(key);
      if (data) {
        const context = typeof data === 'string' ? JSON.parse(data) : data;
        return context as AgentContext;
      }
    } catch (error) {
      logger.warn(`[ContextStore] Redis get error for ${sessionId}:`, error);
    }
  }

  // Fallback to in-memory
  cleanExpiredEntries();
  const cached = inMemoryStore.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.context;
  }

  return null;
}

/**
 * Save or update session context
 *
 * @param context - Full context to save
 */
export async function saveSessionContext(context: AgentContext): Promise<void> {
  const redis = getRedisClient();
  const key = getRedisKey(context.sessionId);

  // Update timestamp
  context.updatedAt = new Date().toISOString();

  // Save to Redis
  if (redis) {
    try {
      await redis.set(key, JSON.stringify(context));
      await redis.expire(key, CONTEXT_CONFIG.ttlSeconds);
    } catch (error) {
      logger.warn(`[ContextStore] Redis save error for ${context.sessionId}:`, error);
    }
  }

  // Also save to in-memory as backup
  inMemoryStore.set(key, {
    context,
    expiresAt: Date.now() + CONTEXT_CONFIG.ttlSeconds * 1000,
  });
}

/**
 * Get or create session context
 *
 * @param sessionId - Unique session identifier
 * @param query - Optional initial query
 * @returns Existing or new AgentContext
 */
export async function getOrCreateSessionContext(
  sessionId: string,
  query: string = ''
): Promise<AgentContext> {
  const existing = await getSessionContext(sessionId);
  if (existing) {
    // Update query if provided and different
    if (query && query !== existing.query) {
      existing.query = query;
      existing.updatedAt = new Date().toISOString();
      await saveSessionContext(existing);
    }
    return existing;
  }

  const newContext = createDefaultContext(sessionId, query);
  await saveSessionContext(newContext);
  return newContext;
}

/**
 * Update session context with partial data
 *
 * @param sessionId - Unique session identifier
 * @param update - Partial context update
 */
export async function updateSessionContext(
  sessionId: string,
  update: Partial<Omit<AgentContext, 'sessionId' | 'createdAt'>>
): Promise<AgentContext> {
  const context = await getOrCreateSessionContext(sessionId);

  // Merge updates
  if (update.findings) {
    Object.assign(context.findings, update.findings);
  }
  if (update.lastAgent) {
    context.lastAgent = update.lastAgent;
  }
  if (update.handoffs) {
    context.handoffs = [...context.handoffs, ...update.handoffs].slice(-CONTEXT_CONFIG.maxHandoffs);
  }
  if (update.query) {
    context.query = update.query;
  }

  await saveSessionContext(context);
  return context;
}

// ============================================================================
// Specialized Update Functions
// ============================================================================

/**
 * Record a handoff event
 */
export async function recordHandoffEvent(
  sessionId: string,
  from: string,
  to: string,
  reason?: string,
  additionalContext?: string
): Promise<void> {
  const context = await getOrCreateSessionContext(sessionId);

  const handoff: HandoffEvent = {
    from,
    to,
    reason,
    context: additionalContext,
    timestamp: new Date().toISOString(),
  };

  context.handoffs = [...context.handoffs, handoff].slice(-CONTEXT_CONFIG.maxHandoffs);
  context.lastAgent = to;
  context.updatedAt = new Date().toISOString();

  await saveSessionContext(context);
  console.log(`[ContextStore] Handoff: ${from} → ${to} (${reason || 'no reason'})`);
}

/**
 * Append anomalies from Analyst Agent
 */
export async function appendAnomalies(
  sessionId: string,
  anomalies: AnomalyData[]
): Promise<void> {
  if (anomalies.length === 0) return;

  const context = await getOrCreateSessionContext(sessionId);

  // Deduplicate by serverId + metric
  const existingKeys = new Set(
    context.findings.anomalies.map(a => `${a.serverId}:${a.metric}`)
  );

  const newAnomalies = anomalies.filter(
    a => !existingKeys.has(`${a.serverId}:${a.metric}`)
  );

  context.findings.anomalies = [
    ...context.findings.anomalies,
    ...newAnomalies,
  ].slice(-CONTEXT_CONFIG.maxAnomalies);

  context.updatedAt = new Date().toISOString();
  await saveSessionContext(context);

  console.log(`[ContextStore] Added ${newAnomalies.length} anomalies (total: ${context.findings.anomalies.length})`);
}

/**
 * Set root cause analysis result
 */
export async function setRootCause(
  sessionId: string,
  rootCause: RootCauseData
): Promise<void> {
  const context = await getOrCreateSessionContext(sessionId);
  context.findings.rootCause = rootCause;
  context.updatedAt = new Date().toISOString();
  await saveSessionContext(context);

  console.log(`[ContextStore] Root cause set: ${rootCause.cause} (${(rootCause.confidence * 100).toFixed(0)}%)`);
}

/**
 * Append affected servers from NLQ Agent
 */
export async function appendAffectedServers(
  sessionId: string,
  serverIds: string[]
): Promise<void> {
  if (serverIds.length === 0) return;

  const context = await getOrCreateSessionContext(sessionId);

  // Deduplicate
  const existingSet = new Set(context.findings.affectedServers);
  const newServers = serverIds.filter(id => !existingSet.has(id));

  context.findings.affectedServers = [
    ...context.findings.affectedServers,
    ...newServers,
  ];

  context.updatedAt = new Date().toISOString();
  await saveSessionContext(context);

  console.log(`[ContextStore] Added ${newServers.length} affected servers (total: ${context.findings.affectedServers.length})`);
}

/**
 * Append metric snapshots from NLQ Agent
 */
export async function appendMetrics(
  sessionId: string,
  metrics: MetricSnapshot[]
): Promise<void> {
  if (metrics.length === 0) return;

  const context = await getOrCreateSessionContext(sessionId);

  // Keep latest metrics per server (replace old ones)
  const metricsMap = new Map<string, MetricSnapshot>();
  for (const m of context.findings.metrics) {
    metricsMap.set(m.serverId, m);
  }
  for (const m of metrics) {
    metricsMap.set(m.serverId, m);
  }

  context.findings.metrics = Array.from(metricsMap.values()).slice(-CONTEXT_CONFIG.maxMetrics);
  context.updatedAt = new Date().toISOString();
  await saveSessionContext(context);

  console.log(`[ContextStore] Updated metrics for ${metrics.length} servers (total: ${context.findings.metrics.length})`);
}

/**
 * Append knowledge base results from Advisor Agent
 */
export async function appendKnowledgeResults(
  sessionId: string,
  results: string[]
): Promise<void> {
  if (results.length === 0) return;

  const context = await getOrCreateSessionContext(sessionId);

  // Deduplicate
  const existingSet = new Set(context.findings.knowledgeResults);
  const newResults = results.filter(r => !existingSet.has(r));

  context.findings.knowledgeResults = [
    ...context.findings.knowledgeResults,
    ...newResults,
  ].slice(-20); // Keep last 20 results

  context.updatedAt = new Date().toISOString();
  await saveSessionContext(context);

  console.log(`[ContextStore] Added ${newResults.length} knowledge results`);
}

/**
 * Append recommended commands from Advisor Agent
 */
export async function appendRecommendedCommands(
  sessionId: string,
  commands: string[]
): Promise<void> {
  if (commands.length === 0) return;

  const context = await getOrCreateSessionContext(sessionId);

  // Deduplicate
  const existingSet = new Set(context.findings.recommendedCommands);
  const newCommands = commands.filter(c => !existingSet.has(c));

  context.findings.recommendedCommands = [
    ...context.findings.recommendedCommands,
    ...newCommands,
  ].slice(-20); // Keep last 20 commands

  context.updatedAt = new Date().toISOString();
  await saveSessionContext(context);

  console.log(`[ContextStore] Added ${newCommands.length} recommended commands`);
}

// ============================================================================
// Context Summary for Agent Prompts
// ============================================================================

/**
 * Generate a text summary of the current context for injection into agent prompts
 *
 * @param sessionId - Session to summarize
 * @returns Markdown-formatted context summary
 */
export async function getContextSummary(sessionId: string): Promise<string | null> {
  const context = await getSessionContext(sessionId);
  if (!context) return null;

  const parts: string[] = [];

  // Previous agent handoffs
  if (context.handoffs.length > 0) {
    const lastHandoffs = context.handoffs.slice(-3);
    parts.push('## 이전 에이전트 핸드오프');
    for (const h of lastHandoffs) {
      parts.push(`- ${h.from} → ${h.to}: ${h.reason || '(no reason)'}`);
    }
  }

  // Anomalies found
  if (context.findings.anomalies.length > 0) {
    parts.push('\n## 발견된 이상');
    const topAnomalies = context.findings.anomalies.slice(-5);
    for (const a of topAnomalies) {
      parts.push(`- **${a.serverName}** (${a.metric}): ${a.value}% (임계: ${a.threshold}%) - ${a.severity}`);
    }
  }

  // Root cause if analyzed
  if (context.findings.rootCause) {
    const rc = context.findings.rootCause;
    parts.push('\n## 근본 원인 분석');
    parts.push(`- **원인**: ${rc.cause}`);
    parts.push(`- **신뢰도**: ${(rc.confidence * 100).toFixed(0)}%`);
    parts.push(`- **제안**: ${rc.suggestedFix}`);
  }

  // Affected servers
  if (context.findings.affectedServers.length > 0) {
    parts.push('\n## 영향받은 서버');
    parts.push(`총 ${context.findings.affectedServers.length}대: ${context.findings.affectedServers.slice(0, 5).join(', ')}${context.findings.affectedServers.length > 5 ? '...' : ''}`);
  }

  if (parts.length === 0) {
    return null;
  }

  return parts.join('\n');
}

// ============================================================================
// Cleanup Functions
// ============================================================================

/**
 * Delete session context (for cleanup)
 */
export async function deleteSessionContext(sessionId: string): Promise<void> {
  const redis = getRedisClient();
  const key = getRedisKey(sessionId);

  if (redis) {
    try {
      await redis.del(key);
    } catch (error) {
      logger.warn(`[ContextStore] Redis delete error for ${sessionId}:`, error);
    }
  }

  inMemoryStore.delete(key);
  console.log(`[ContextStore] Deleted context for ${sessionId}`);
}

/**
 * Get context store stats (for debugging)
 */
export function getContextStoreStats(): {
  inMemoryCount: number;
  oldestEntry: string | null;
} {
  cleanExpiredEntries();
  const entries = Array.from(inMemoryStore.entries());

  let oldestEntry: string | null = null;
  let oldestTime = Infinity;

  for (const [key, value] of entries) {
    const context = value.context;
    const createdTime = new Date(context.createdAt).getTime();
    if (createdTime < oldestTime) {
      oldestTime = createdTime;
      oldestEntry = key;
    }
  }

  return {
    inMemoryCount: inMemoryStore.size,
    oldestEntry,
  };
}
