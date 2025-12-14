/**
 * Human-in-the-Loop Approval Route
 * LangGraph 승인 대기 상태 관리 및 재개 API
 */

import { Hono } from 'hono';
import { z } from 'zod';
import {
  getPendingApproval,
  resumeWithApproval,
} from '../services/langgraph/graph-builder.js';

export const approvalRoute = new Hono();

// ============================================================================
// Request Schemas
// ============================================================================

const approvalDecisionSchema = z.object({
  sessionId: z.string().min(1),
  approved: z.boolean(),
  reason: z.string().optional(),
  approvedBy: z.string().optional(),
});

// ============================================================================
// GET /api/ai/approval/status - 현재 승인 대기 상태 조회
// ============================================================================

approvalRoute.get('/status', async (c) => {
  try {
    const sessionId = c.req.query('sessionId');

    if (!sessionId) {
      return c.json({ error: 'sessionId is required' }, 400);
    }

    const result = await getPendingApproval(sessionId);

    return c.json({
      success: true,
      hasPending: result.hasPending,
      action: result.action,
      sessionId,
    });
  } catch (error) {
    console.error('❌ [Approval] Status check failed:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to check approval status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// ============================================================================
// POST /api/ai/approval/decide - 승인/거부 결정 처리
// ============================================================================

approvalRoute.post('/decide', async (c) => {
  const startTime = Date.now();

  try {
    const body = await c.req.json();
    const parseResult = approvalDecisionSchema.safeParse(body);

    if (!parseResult.success) {
      return c.json(
        {
          success: false,
          error: 'Invalid request payload',
          details: parseResult.error.issues.map((i) => i.message).join(', '),
        },
        400
      );
    }

    const { sessionId, approved, reason, approvedBy } = parseResult.data;

    console.log(
      `🔔 [Approval] Decision: ${approved ? '✅ Approved' : '❌ Rejected'}`
    );
    console.log(`   Session: ${sessionId}`);
    console.log(`   By: ${approvedBy || 'anonymous'}`);
    if (reason) console.log(`   Reason: ${reason}`);

    const result = await resumeWithApproval(sessionId, {
      approved,
      reason,
      approvedBy,
    });

    return c.json({
      success: true,
      response: result.response,
      approved: result.approved,
      sessionId,
      processingTime: `${Date.now() - startTime}ms`,
    });
  } catch (error) {
    console.error('❌ [Approval] Decision processing failed:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to process approval decision',
        message: error instanceof Error ? error.message : 'Unknown error',
        processingTime: `${Date.now() - startTime}ms`,
      },
      500
    );
  }
});
