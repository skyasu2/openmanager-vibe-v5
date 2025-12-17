/**
 * Human-in-the-Loop Approval Store
 * 세션별 승인 대기 상태 관리
 *
 * Note: In-memory store for simplicity.
 * For production at scale, consider Redis or PostgreSQL.
 */

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

// ============================================================================
// In-Memory Store
// ============================================================================

class ApprovalStore {
  private store = new Map<string, ApprovalEntry>();
  private readonly TTL_MS = 5 * 60 * 1000; // 5 minutes expiry

  /**
   * Register a pending approval request
   */
  registerPending(approval: Omit<PendingApproval, 'expiresAt'>): void {
    const entry: ApprovalEntry = {
      pending: {
        ...approval,
        expiresAt: new Date(Date.now() + this.TTL_MS),
      },
      decision: null,
    };
    this.store.set(approval.sessionId, entry);
    console.log(`🔔 [Approval] Registered pending: ${approval.sessionId}`);

    // Auto-cleanup after TTL
    setTimeout(() => {
      this.cleanup(approval.sessionId);
    }, this.TTL_MS);
  }

  /**
   * Get pending approval for a session
   */
  getPending(sessionId: string): PendingApproval | null {
    const entry = this.store.get(sessionId);
    if (!entry) return null;

    // Check if expired
    if (entry.pending.expiresAt < new Date()) {
      this.cleanup(sessionId);
      return null;
    }

    // Return null if already decided
    if (entry.decision) return null;

    return entry.pending;
  }

  /**
   * Check if session has pending approval
   */
  hasPending(sessionId: string): boolean {
    return this.getPending(sessionId) !== null;
  }

  /**
   * Submit approval decision
   */
  submitDecision(
    sessionId: string,
    approved: boolean,
    options?: { reason?: string; decidedBy?: string }
  ): boolean {
    const entry = this.store.get(sessionId);
    if (!entry || entry.decision) {
      console.warn(`⚠️ [Approval] No pending request for: ${sessionId}`);
      return false;
    }

    const decision: ApprovalDecision = {
      approved,
      decidedAt: new Date(),
      decidedBy: options?.decidedBy,
      reason: options?.reason,
    };

    entry.decision = decision;

    // Resolve waiting promise if exists
    if (entry.resolveCallback) {
      entry.resolveCallback(decision);
    }

    console.log(
      `✅ [Approval] Decision submitted: ${sessionId} -> ${approved ? 'APPROVED' : 'REJECTED'}`
    );

    return true;
  }

  /**
   * Get decision for a session
   */
  getDecision(sessionId: string): ApprovalDecision | null {
    return this.store.get(sessionId)?.decision ?? null;
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
   * Cleanup expired or resolved entries
   */
  private cleanup(sessionId: string): void {
    this.store.delete(sessionId);
    console.log(`🧹 [Approval] Cleaned up: ${sessionId}`);
  }

  /**
   * Get store stats (for monitoring)
   */
  getStats(): { pending: number; total: number } {
    let pending = 0;
    const now = new Date();

    for (const [, entry] of this.store) {
      if (!entry.decision && entry.pending.expiresAt > now) {
        pending++;
      }
    }

    return { pending, total: this.store.size };
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
