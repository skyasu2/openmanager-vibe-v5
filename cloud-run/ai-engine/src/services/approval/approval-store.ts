/**
 * Human-in-the-Loop Approval Store (Hybrid: Memory + Redis + PostgreSQL)
 * 세션별 승인 대기 상태 관리
 *
 * Architecture:
 * - L1: In-memory for callback resolution (process-local)
 * - L2: Redis for distributed state (multi-instance sync, 5 min TTL)
 * - L3: PostgreSQL for permanent audit trail
 *
 * Flow:
 * - registerPending: Store in L1 + L2 + L3 (pending status)
 * - getPending: L1 first, then L2 fallback
 * - submitDecision: Update all layers, resolve callback
 *
 * ## PostgreSQL Persistence (2025-12-26)
 * All approval requests and decisions are persisted to approval_history table
 * for audit trail and analytics.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from '../../lib/config-parser';
import {
  redisGet,
  redisSet,
  redisDel,
  isRedisAvailable,
} from '../../lib/redis-client';
import { syncIncidentsToRAG } from '../../lib/incident-rag-injector';
import { logger } from '../../lib/logger';

export type ApprovalActionType =
  | 'incident_report'
  | 'system_command'
  | 'critical_alert';

export interface PendingApproval {
  sessionId: string;
  actionType: ApprovalActionType;
  description: string;
  payload: Record<string, unknown>;
  requestedAt: Date;
  requestedBy: string;
  expiresAt: Date;
}

export interface ApprovalDecision {
  approved: boolean;
  decidedAt: Date;
  decidedBy?: string;
  reason?: string;
}

interface ApprovalEntry {
  pending: PendingApproval;
  decision: ApprovalDecision | null;
  resolveCallback?: (decision: ApprovalDecision) => void;
}

// Redis key prefix
const REDIS_PREFIX = 'approval:';
const REDIS_TTL_SECONDS = 5 * 60; // 5 minutes

// ============================================================================
// Supabase Client Singleton (for PostgreSQL persistence)
// ============================================================================

let supabaseClient: SupabaseClient | null = null;
let supabaseInitFailed = false;

function getSupabaseClient(): SupabaseClient | null {
  if (supabaseInitFailed) return null;
  if (supabaseClient) return supabaseClient;

  const config = getSupabaseConfig();
  if (!config) {
    supabaseInitFailed = true;
    logger.warn('⚠️ [Approval] Supabase config missing, history persistence disabled');
    return null;
  }

  try {
    supabaseClient = createClient(config.url, config.serviceRoleKey);
    console.log('✅ [Approval] PostgreSQL persistence enabled');
    return supabaseClient;
  } catch (e) {
    supabaseInitFailed = true;
    logger.error('❌ [Approval] Supabase init failed:', e);
    return null;
  }
}

// Serializable entry for Redis (no callback)
interface RedisApprovalEntry {
  pending: {
    sessionId: string;
    actionType: ApprovalActionType;
    description: string;
    payload: Record<string, unknown>;
    requestedAt: string; // ISO string
    requestedBy: string;
    expiresAt: string; // ISO string
  };
  decision: {
    approved: boolean;
    decidedAt: string;
    decidedBy?: string;
    reason?: string;
  } | null;
}

// ============================================================================
// Hybrid Store (L1: Memory + L2: Redis)
// ============================================================================

class ApprovalStore {
  private store = new Map<string, ApprovalEntry>(); // L1: Memory (with callbacks)
  private readonly TTL_MS = 5 * 60 * 1000; // 5 minutes expiry

  /**
   * Register a pending approval request (L1 + L2 + L3)
   */
  async registerPending(approval: Omit<PendingApproval, 'expiresAt'>): Promise<void> {
    const expiresAt = new Date(Date.now() + this.TTL_MS);
    const entry: ApprovalEntry = {
      pending: {
        ...approval,
        expiresAt,
      },
      decision: null,
    };

    // L1: Store in memory (with callback support)
    this.store.set(approval.sessionId, entry);
    console.log(`🔔 [Approval] Registered pending: ${approval.sessionId}`);

    // L2: Store in Redis (serialized, no callback)
    if (isRedisAvailable()) {
      const redisEntry: RedisApprovalEntry = {
        pending: {
          ...approval,
          requestedAt: approval.requestedAt.toISOString(),
          expiresAt: expiresAt.toISOString(),
        },
        decision: null,
      };
      await redisSet(
        `${REDIS_PREFIX}${approval.sessionId}`,
        redisEntry,
        REDIS_TTL_SECONDS
      );
    }

    // L3: Persist to PostgreSQL (audit trail)
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('approval_history').insert({
          session_id: approval.sessionId,
          action_type: approval.actionType,
          description: approval.description,
          payload: approval.payload,
          requested_by: approval.requestedBy,
          requested_at: approval.requestedAt.toISOString(),
          expires_at: expiresAt.toISOString(),
          status: 'pending',
        });
        console.log(`💾 [Approval] Persisted to PostgreSQL: ${approval.sessionId}`);
      } catch (e) {
        logger.error('⚠️ [Approval] PostgreSQL persist failed:', e);
        // Don't fail the operation - Redis/Memory still work
      }
    }

    // Auto-cleanup after TTL
    setTimeout(() => {
      this.cleanup(approval.sessionId);
    }, this.TTL_MS);
  }

  /**
   * Get pending approval for a session (L1 -> L2 fallback)
   */
  async getPending(sessionId: string): Promise<PendingApproval | null> {
    // L1: Check memory first
    const entry = this.store.get(sessionId);
    if (entry) {
      // Check if expired
      if (entry.pending.expiresAt < new Date()) {
        this.cleanup(sessionId);
        return null;
      }
      // Return null if already decided
      if (entry.decision) return null;
      return entry.pending;
    }

    // L2: Fallback to Redis (for multi-instance scenarios)
    if (isRedisAvailable()) {
      const redisEntry = await redisGet<RedisApprovalEntry>(
        `${REDIS_PREFIX}${sessionId}`
      );

      if (redisEntry && !redisEntry.decision) {
        const expiresAt = new Date(redisEntry.pending.expiresAt);
        if (expiresAt > new Date()) {
          // Backfill L1 for future access
          const pending: PendingApproval = {
            ...redisEntry.pending,
            requestedAt: new Date(redisEntry.pending.requestedAt),
            expiresAt,
          };
          this.store.set(sessionId, { pending, decision: null });
          return pending;
        }
      }
    }

    return null;
  }

  /**
   * Check if session has pending approval
   */
  async hasPending(sessionId: string): Promise<boolean> {
    return (await this.getPending(sessionId)) !== null;
  }

  /**
   * Submit approval decision (L1 + L2)
   */
  async submitDecision(
    sessionId: string,
    approved: boolean,
    options?: { reason?: string; decidedBy?: string }
  ): Promise<boolean> {
    // L1: Get from memory
    let entry = this.store.get(sessionId);

    // L2: If not in memory, try to load from Redis
    if (!entry && isRedisAvailable()) {
      const redisEntry = await redisGet<RedisApprovalEntry>(
        `${REDIS_PREFIX}${sessionId}`
      );
      if (redisEntry && !redisEntry.decision) {
        // Restore to L1
        const pending: PendingApproval = {
          ...redisEntry.pending,
          requestedAt: new Date(redisEntry.pending.requestedAt),
          expiresAt: new Date(redisEntry.pending.expiresAt),
        };
        entry = { pending, decision: null };
        this.store.set(sessionId, entry);
      }
    }

    if (!entry || entry.decision) {
      logger.warn(`⚠️ [Approval] No pending request for: ${sessionId}`);
      return false;
    }

    const decision: ApprovalDecision = {
      approved,
      decidedAt: new Date(),
      decidedBy: options?.decidedBy,
      reason: options?.reason,
    };

    // L1: Update memory
    entry.decision = decision;

    // L2: Update Redis
    if (isRedisAvailable()) {
      const redisEntry: RedisApprovalEntry = {
        pending: {
          ...entry.pending,
          requestedAt: entry.pending.requestedAt.toISOString(),
          expiresAt: entry.pending.expiresAt.toISOString(),
        },
        decision: {
          approved,
          decidedAt: decision.decidedAt.toISOString(),
          decidedBy: decision.decidedBy,
          reason: decision.reason,
        },
      };
      await redisSet(
        `${REDIS_PREFIX}${sessionId}`,
        redisEntry,
        REDIS_TTL_SECONDS
      );
    }

    // L3: Update PostgreSQL (audit trail)
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase
          .from('approval_history')
          .update({
            status: approved ? 'approved' : 'rejected',
            decided_by: decision.decidedBy,
            decided_at: decision.decidedAt.toISOString(),
            reason: decision.reason,
          })
          .eq('session_id', sessionId)
          .eq('status', 'pending'); // Only update if still pending
        console.log(`💾 [Approval] Decision persisted: ${sessionId}`);
      } catch (e) {
        logger.error('⚠️ [Approval] PostgreSQL decision update failed:', e);
      }
    }

    // Resolve waiting promise if exists
    if (entry.resolveCallback) {
      entry.resolveCallback(decision);
    }

    console.log(
      `✅ [Approval] Decision submitted: ${sessionId} -> ${approved ? 'APPROVED' : 'REJECTED'}`
    );

    // Auto-sync to RAG when incident_report is approved
    if (approved && entry.pending.actionType === 'incident_report') {
      // Fire-and-forget: don't block the approval response
      syncIncidentsToRAG({ limit: 1, daysBack: 1 }).then((result) => {
        if (result.synced > 0) {
          console.log(`📚 [Approval] Auto-synced incident to RAG: ${sessionId}`);
        }
      }).catch((e) => {
        logger.warn(`⚠️ [Approval] RAG auto-sync failed for ${sessionId}:`, e);
      });
    }

    return true;
  }

  /**
   * Get decision for a session (L1 -> L2 fallback)
   */
  async getDecision(sessionId: string): Promise<ApprovalDecision | null> {
    // L1: Check memory first
    const memoryEntry = this.store.get(sessionId);
    if (memoryEntry?.decision) {
      return memoryEntry.decision;
    }

    // L2: Fallback to Redis
    if (isRedisAvailable()) {
      const redisEntry = await redisGet<RedisApprovalEntry>(
        `${REDIS_PREFIX}${sessionId}`
      );
      if (redisEntry?.decision) {
        return {
          approved: redisEntry.decision.approved,
          decidedAt: new Date(redisEntry.decision.decidedAt),
          decidedBy: redisEntry.decision.decidedBy,
          reason: redisEntry.decision.reason,
        };
      }
    }

    return null;
  }

  /**
   * Wait for approval decision (for LangGraph interrupt integration)
   * Returns a promise that resolves when user makes a decision
   */
  waitForDecision(
    sessionId: string,
    timeoutMs = 300000 // 5 minutes default
  ): Promise<ApprovalDecision> {
    return new Promise((resolve, reject) => {
      const entry = this.store.get(sessionId);

      if (!entry) {
        reject(new Error(`No pending approval for session: ${sessionId}`));
        return;
      }

      // If already decided
      if (entry.decision) {
        resolve(entry.decision);
        return;
      }

      // Set callback for when decision arrives
      entry.resolveCallback = resolve;

      // Timeout handling
      const timeoutId = setTimeout(() => {
        const currentEntry = this.store.get(sessionId);
        if (currentEntry && !currentEntry.decision) {
          reject(new Error('Approval timeout'));
          this.cleanup(sessionId);
        }
      }, timeoutMs);

      // Cleanup timeout on resolution
      const originalResolve = entry.resolveCallback;
      entry.resolveCallback = (decision: ApprovalDecision) => {
        clearTimeout(timeoutId);
        originalResolve(decision);
      };
    });
  }

  /**
   * Cleanup expired or resolved entries (L1 + L2 + L3)
   */
  private async cleanup(sessionId: string): Promise<void> {
    // L1: Delete from memory
    this.store.delete(sessionId);

    // L2: Delete from Redis
    if (isRedisAvailable()) {
      await redisDel(`${REDIS_PREFIX}${sessionId}`).catch((e) => {
        logger.warn(`⚠️ [Approval] Redis cleanup failed for ${sessionId}:`, e);
      });
    }

    // L3: Mark as expired in PostgreSQL (don't delete - keep for audit)
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase
          .from('approval_history')
          .update({ status: 'expired' })
          .eq('session_id', sessionId)
          .eq('status', 'pending'); // Only update if still pending
      } catch (e) {
        logger.warn(`⚠️ [Approval] PostgreSQL expiry update failed for ${sessionId}:`, e);
      }
    }

    console.log(`🧹 [Approval] Cleaned up: ${sessionId}`);
  }

  /**
   * Get store stats (for monitoring)
   */
  getStats(): { pending: number; total: number; redisEnabled: boolean; postgresEnabled: boolean } {
    let pending = 0;
    const now = new Date();

    for (const [, entry] of this.store) {
      if (!entry.decision && entry.pending.expiresAt > now) {
        pending++;
      }
    }

    return {
      pending,
      total: this.store.size,
      redisEnabled: isRedisAvailable(),
      postgresEnabled: getSupabaseClient() !== null,
    };
  }

  /**
   * Get approval history from PostgreSQL (for audit/analytics)
   */
  async getHistory(options: {
    status?: 'pending' | 'approved' | 'rejected' | 'expired';
    actionType?: ApprovalActionType;
    limit?: number;
    offset?: number;
    fromDate?: Date;
    toDate?: Date;
  } = {}): Promise<Array<{
    id: string;
    sessionId: string;
    actionType: string;
    description: string;
    status: string;
    requestedBy: string;
    requestedAt: Date;
    decidedBy: string | null;
    decidedAt: Date | null;
    reason: string | null;
  }> | null> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      logger.warn('⚠️ [Approval] PostgreSQL not available for history query');
      return null;
    }

    try {
      const { data, error } = await supabase.rpc('get_approval_history', {
        p_status: options.status || null,
        p_action_type: options.actionType || null,
        p_limit: options.limit || 50,
        p_offset: options.offset || 0,
        p_from_date: options.fromDate?.toISOString() || null,
        p_to_date: options.toDate?.toISOString() || null,
      });

      if (error) {
        logger.error('❌ [Approval] History query failed:', error);
        return null;
      }

      return (data || []).map((row: Record<string, unknown>) => ({
        id: String(row.id),
        sessionId: String(row.session_id),
        actionType: String(row.action_type),
        description: String(row.description),
        status: String(row.status),
        requestedBy: String(row.requested_by),
        requestedAt: new Date(row.requested_at as string),
        decidedBy: row.decided_by ? String(row.decided_by) : null,
        decidedAt: row.decided_at ? new Date(row.decided_at as string) : null,
        reason: row.reason ? String(row.reason) : null,
      }));
    } catch (e) {
      logger.error('❌ [Approval] History query error:', e);
      return null;
    }
  }

  /**
   * Get approval statistics from PostgreSQL
   */
  async getHistoryStats(days = 7): Promise<{
    totalRequests: number;
    approvedCount: number;
    rejectedCount: number;
    expiredCount: number;
    pendingCount: number;
    approvalRate: number;
    avgDecisionTimeSeconds: number;
  } | null> {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase.rpc('get_approval_stats', {
        p_days: days,
      });

      if (error || !data || data.length === 0) {
        logger.error('❌ [Approval] Stats query failed:', error);
        return null;
      }

      const stats = data[0];
      return {
        totalRequests: Number(stats.total_requests || 0),
        approvedCount: Number(stats.approved_count || 0),
        rejectedCount: Number(stats.rejected_count || 0),
        expiredCount: Number(stats.expired_count || 0),
        pendingCount: Number(stats.pending_count || 0),
        approvalRate: Number(stats.approval_rate || 0),
        avgDecisionTimeSeconds: Number(stats.avg_decision_time_seconds || 0),
      };
    } catch (e) {
      logger.error('❌ [Approval] Stats query error:', e);
      return null;
    }
  }

  /**
   * Reset store (for testing purposes only)
   * @internal
   */
  _resetForTesting(): void {
    if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
      this.store.clear();
    }
  }
}

// Singleton export
export const approvalStore = new ApprovalStore();
