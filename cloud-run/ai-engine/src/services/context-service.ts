/**
 * Agent Context Service
 *
 * Provides PostgreSQL-based persistence for agent context sharing.
 * Allows agents to store and retrieve results from previous agents in the same session.
 *
 * Task 4: PostgreSQL Context Table Implementation
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  type AgentType,
  type NLQResult,
  type AnalystResult,
  type ReporterResult,
  type VerificationResult,
  type SharedContext,
  createInitialSharedContext,
} from '../lib/state-definition';

// ============================================================================
// 1. Types
// ============================================================================

export type ContextType = 'agent_result' | 'tool_output' | 'verification' | 'shared_context';

export interface AgentContextRow {
  id: string;
  session_id: string;
  agent_type: AgentType;
  result: Record<string, unknown>;
  context_type: ContextType;
  created_at: string;
  expires_at: string;
}

export interface SaveContextOptions {
  contextType?: ContextType;
  ttlHours?: number;
}

// ============================================================================
// 2. Agent Context Service
// ============================================================================

export class AgentContextService {
  private supabase: SupabaseClient | null = null;
  private initialized = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize Supabase client
   */
  private initialize(): void {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn('⚠️ [ContextService] Supabase credentials not configured, using in-memory fallback');
      return;
    }

    try {
      this.supabase = createClient(supabaseUrl, supabaseKey);
      this.initialized = true;
      console.log('✅ [ContextService] Initialized with Supabase');
    } catch (error) {
      console.error('❌ [ContextService] Failed to initialize Supabase:', error);
    }
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.initialized && this.supabase !== null;
  }

  // ============================================================================
  // 3. Core Context Operations
  // ============================================================================

  /**
   * Save agent context to PostgreSQL
   */
  async saveContext(
    sessionId: string,
    agentType: AgentType,
    result: Record<string, unknown>,
    options: SaveContextOptions = {}
  ): Promise<string | null> {
    if (!this.isReady() || !this.supabase) {
      console.warn('⚠️ [ContextService] Not ready, skipping save');
      return null;
    }

    const { contextType = 'agent_result', ttlHours = 1 } = options;

    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + ttlHours);

      const { data, error } = await this.supabase
        .from('agent_context')
        .insert({
          session_id: sessionId,
          agent_type: agentType,
          result,
          context_type: contextType,
          expires_at: expiresAt.toISOString(),
        })
        .select('id')
        .single();

      if (error) {
        console.error('❌ [ContextService] Save failed:', error.message);
        return null;
      }

      console.log(`✅ [ContextService] Saved ${agentType} context for session ${sessionId.slice(0, 8)}...`);
      return data?.id ?? null;
    } catch (error) {
      console.error('❌ [ContextService] Save error:', error);
      return null;
    }
  }

  /**
   * Get all context for a session
   */
  async getContext(
    sessionId: string,
    agentType?: AgentType
  ): Promise<SharedContext> {
    if (!this.isReady() || !this.supabase) {
      return createInitialSharedContext();
    }

    try {
      let query = this.supabase
        .from('agent_context')
        .select('*')
        .eq('session_id', sessionId)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (agentType) {
        query = query.eq('agent_type', agentType);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ [ContextService] Get failed:', error.message);
        return createInitialSharedContext();
      }

      return this.buildSharedContext(data as AgentContextRow[] | null);
    } catch (error) {
      console.error('❌ [ContextService] Get error:', error);
      return createInitialSharedContext();
    }
  }

  /**
   * Get latest result for a specific agent
   */
  async getAgentResult<T>(
    sessionId: string,
    agentType: AgentType
  ): Promise<T | null> {
    if (!this.isReady() || !this.supabase) {
      return null;
    }

    try {
      const { data, error } = await this.supabase
        .from('agent_context')
        .select('result')
        .eq('session_id', sessionId)
        .eq('agent_type', agentType)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') { // Not found is ok
          console.error('❌ [ContextService] GetAgentResult failed:', error.message);
        }
        return null;
      }

      return data?.result as T ?? null;
    } catch (error) {
      console.error('❌ [ContextService] GetAgentResult error:', error);
      return null;
    }
  }

  /**
   * Cleanup expired context entries
   */
  async cleanupExpired(): Promise<number> {
    if (!this.isReady() || !this.supabase) {
      return 0;
    }

    try {
      const { data, error } = await this.supabase
        .from('agent_context')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select('id');

      if (error) {
        console.error('❌ [ContextService] Cleanup failed:', error.message);
        return 0;
      }

      const count = data?.length ?? 0;
      if (count > 0) {
        console.log(`🧹 [ContextService] Cleaned up ${count} expired entries`);
      }
      return count;
    } catch (error) {
      console.error('❌ [ContextService] Cleanup error:', error);
      return 0;
    }
  }

  /**
   * Delete all context for a session
   */
  async deleteSessionContext(sessionId: string): Promise<boolean> {
    if (!this.isReady() || !this.supabase) {
      return false;
    }

    try {
      const { error } = await this.supabase
        .from('agent_context')
        .delete()
        .eq('session_id', sessionId);

      if (error) {
        console.error('❌ [ContextService] Delete failed:', error.message);
        return false;
      }

      console.log(`🗑️ [ContextService] Deleted context for session ${sessionId.slice(0, 8)}...`);
      return true;
    } catch (error) {
      console.error('❌ [ContextService] Delete error:', error);
      return false;
    }
  }

  // ============================================================================
  // 4. High-Level Context Methods
  // ============================================================================

  /**
   * Save NLQ agent result
   */
  async saveNLQResult(sessionId: string, result: NLQResult): Promise<string | null> {
    return this.saveContext(sessionId, 'nlq', result as unknown as Record<string, unknown>);
  }

  /**
   * Save Analyst agent result
   */
  async saveAnalystResult(sessionId: string, result: AnalystResult): Promise<string | null> {
    return this.saveContext(sessionId, 'analyst', result as unknown as Record<string, unknown>);
  }

  /**
   * Save Reporter agent result
   */
  async saveReporterResult(sessionId: string, result: ReporterResult): Promise<string | null> {
    return this.saveContext(sessionId, 'reporter', result as unknown as Record<string, unknown>);
  }

  /**
   * Save Verifier result
   */
  async saveVerifierResult(sessionId: string, result: VerificationResult): Promise<string | null> {
    return this.saveContext(sessionId, 'verifier', result as unknown as Record<string, unknown>, {
      contextType: 'verification',
    });
  }

  /**
   * Get NLQ result for session
   */
  async getNLQResult(sessionId: string): Promise<NLQResult | null> {
    return this.getAgentResult<NLQResult>(sessionId, 'nlq');
  }

  /**
   * Get Analyst result for session
   */
  async getAnalystResult(sessionId: string): Promise<AnalystResult | null> {
    return this.getAgentResult<AnalystResult>(sessionId, 'analyst');
  }

  /**
   * Get Reporter result for session
   */
  async getReporterResult(sessionId: string): Promise<ReporterResult | null> {
    return this.getAgentResult<ReporterResult>(sessionId, 'reporter');
  }

  /**
   * Get Verifier result for session
   */
  async getVerifierResult(sessionId: string): Promise<VerificationResult | null> {
    return this.getAgentResult<VerificationResult>(sessionId, 'verifier');
  }

  // ============================================================================
  // 5. Helper Methods
  // ============================================================================

  /**
   * Build SharedContext from database rows
   */
  private buildSharedContext(rows: AgentContextRow[] | null): SharedContext {
    const context = createInitialSharedContext();

    if (!rows || rows.length === 0) {
      return context;
    }

    // Get the latest result for each agent type
    const latestByAgent = new Map<AgentType, AgentContextRow>();
    for (const row of rows) {
      const existing = latestByAgent.get(row.agent_type);
      if (!existing || new Date(row.created_at) > new Date(existing.created_at)) {
        latestByAgent.set(row.agent_type, row);
      }
    }

    // Build context
    const nlqRow = latestByAgent.get('nlq');
    if (nlqRow) {
      context.nlqResults = nlqRow.result as unknown as NLQResult;
      context.lastUpdatedBy = 'nlq';
      context.lastUpdatedAt = nlqRow.created_at;
    }

    const analystRow = latestByAgent.get('analyst');
    if (analystRow) {
      context.analystResults = analystRow.result as unknown as AnalystResult;
      if (!nlqRow || new Date(analystRow.created_at) > new Date(nlqRow.created_at)) {
        context.lastUpdatedBy = 'analyst';
        context.lastUpdatedAt = analystRow.created_at;
      }
    }

    const reporterRow = latestByAgent.get('reporter');
    if (reporterRow) {
      context.reporterResults = reporterRow.result as unknown as ReporterResult;
      const prevTime = context.lastUpdatedAt;
      if (!prevTime || new Date(reporterRow.created_at) > new Date(prevTime)) {
        context.lastUpdatedBy = 'reporter';
        context.lastUpdatedAt = reporterRow.created_at;
      }
    }

    const verifierRow = latestByAgent.get('verifier');
    if (verifierRow) {
      context.verifierResults = verifierRow.result as unknown as VerificationResult;
      const prevTime = context.lastUpdatedAt;
      if (!prevTime || new Date(verifierRow.created_at) > new Date(prevTime)) {
        context.lastUpdatedBy = 'verifier';
        context.lastUpdatedAt = verifierRow.created_at;
      }
    }

    return context;
  }

  /**
   * Get service stats
   */
  async getStats(sessionId?: string): Promise<{
    isReady: boolean;
    totalEntries?: number;
    entriesByAgent?: Record<string, number>;
    oldestEntry?: string;
    newestEntry?: string;
  }> {
    if (!this.isReady() || !this.supabase) {
      return { isReady: false };
    }

    try {
      let query = this.supabase
        .from('agent_context')
        .select('agent_type, created_at')
        .gt('expires_at', new Date().toISOString());

      if (sessionId) {
        query = query.eq('session_id', sessionId);
      }

      const { data, error } = await query;

      if (error) {
        return { isReady: true };
      }

      const entriesByAgent: Record<string, number> = {};
      let oldest: Date | null = null;
      let newest: Date | null = null;

      for (const row of data ?? []) {
        const agentType = row.agent_type as string;
        entriesByAgent[agentType] = (entriesByAgent[agentType] || 0) + 1;

        const createdAt = new Date(row.created_at);
        if (!oldest || createdAt < oldest) oldest = createdAt;
        if (!newest || createdAt > newest) newest = createdAt;
      }

      return {
        isReady: true,
        totalEntries: data?.length ?? 0,
        entriesByAgent,
        oldestEntry: oldest?.toISOString(),
        newestEntry: newest?.toISOString(),
      };
    } catch {
      return { isReady: true };
    }
  }
}

// ============================================================================
// 6. Singleton Instance
// ============================================================================

let contextServiceInstance: AgentContextService | null = null;

/**
 * Get the global context service instance
 */
export function getContextService(): AgentContextService {
  if (!contextServiceInstance) {
    contextServiceInstance = new AgentContextService();
  }
  return contextServiceInstance;
}

/**
 * Reset the global context service instance (for testing)
 */
export function resetContextService(): void {
  contextServiceInstance = null;
}
