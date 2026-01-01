/**
 * Approval Routes
 *
 * Human-in-the-Loop approval endpoints.
 *
 * @version 1.1.0
 * @created 2025-12-28
 * @updated 2026-01-01
 *
 * @deprecated HITL workflow removed in v4.1 (user-triggered design)
 * - `/status`, `/decide`, `/stats` endpoints are deprecated (no longer called from frontend)
 * - `/history`, `/history/stats` endpoints kept for RAG context injection
 *   (used by incident-rag-injector.ts for approval_history table queries)
 */

import { Hono } from 'hono';
import type { Context } from 'hono';
import { approvalStore } from '../services/approval/approval-store';
import { handleApiError, handleValidationError, handleNotFoundError, jsonSuccess } from '../lib/error-handler';

export const approvalRouter = new Hono();

/**
 * GET /approval/status - Check pending approval status
 */
approvalRouter.get('/status', async (c: Context) => {
  try {
    const sessionId = c.req.query('sessionId');

    if (!sessionId) {
      return handleValidationError(c, 'sessionId is required');
    }

    const pending = await approvalStore.getPending(sessionId);

    if (!pending) {
      return jsonSuccess(c, {
        hasPending: false,
        action: null,
        sessionId,
      });
    }

    return jsonSuccess(c, {
      hasPending: true,
      action: {
        type: pending.actionType,
        description: pending.description,
        details: pending.payload,
        requestedAt: pending.requestedAt.toISOString(),
        requestedBy: pending.requestedBy,
        expiresAt: pending.expiresAt.toISOString(),
      },
      sessionId,
    });
  } catch (error) {
    return handleApiError(c, error, 'Approval Status');
  }
});

/**
 * POST /approval/decide - Submit approval decision
 */
approvalRouter.post('/decide', async (c: Context) => {
  try {
    const { sessionId, approved, reason, approvedBy } = await c.req.json();

    if (!sessionId || typeof approved !== 'boolean') {
      return handleValidationError(c, 'sessionId and approved are required');
    }

    const success = await approvalStore.submitDecision(sessionId, approved, {
      reason,
      decidedBy: approvedBy,
    });

    if (!success) {
      return handleNotFoundError(c, 'Pending approval for this session');
    }

    return jsonSuccess(c, {
      sessionId,
      decision: approved ? 'approved' : 'rejected',
      decidedAt: new Date().toISOString(),
    });
  } catch (error) {
    return handleApiError(c, error, 'Approval Decision');
  }
});

/**
 * GET /approval/stats - Monitor approval store status
 */
approvalRouter.get('/stats', (c: Context) => {
  const stats = approvalStore.getStats();
  return jsonSuccess(c, stats);
});

/**
 * GET /approval/history - Get approval history from PostgreSQL
 */
approvalRouter.get('/history', async (c: Context) => {
  try {
    const status = c.req.query('status') as 'pending' | 'approved' | 'rejected' | 'expired' | undefined;
    const actionType = c.req.query('actionType') as 'incident_report' | 'system_command' | 'critical_alert' | undefined;
    const limit = parseInt(c.req.query('limit') || '50', 10);
    const offset = parseInt(c.req.query('offset') || '0', 10);

    const history = await approvalStore.getHistory({
      status,
      actionType,
      limit,
      offset,
    });

    if (history === null) {
      return c.json({
        success: false,
        error: 'PostgreSQL not available for history query',
        timestamp: new Date().toISOString(),
      }, 503);
    }

    return jsonSuccess(c, {
      count: history.length,
      history,
      pagination: { limit, offset },
    });
  } catch (error) {
    return handleApiError(c, error, 'Approval History');
  }
});

/**
 * GET /approval/history/stats - Get approval statistics
 */
approvalRouter.get('/history/stats', async (c: Context) => {
  try {
    const days = parseInt(c.req.query('days') || '7', 10);
    const stats = await approvalStore.getHistoryStats(days);

    if (stats === null) {
      return c.json({
        success: false,
        error: 'PostgreSQL not available for stats query',
        timestamp: new Date().toISOString(),
      }, 503);
    }

    return jsonSuccess(c, { days, ...stats });
  } catch (error) {
    return handleApiError(c, error, 'Approval History Stats');
  }
});
