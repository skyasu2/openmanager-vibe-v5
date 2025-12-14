/**
 * Human-in-the-Loop Approval API Route
 * Cloud Run AI Backend로 승인 요청 프록시
 */

import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/auth/api-auth';
import { isCloudRunEnabled, proxyToCloudRun } from '@/lib/cloud-run/proxy';

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
// GET /api/ai/approval - 현재 승인 대기 상태 조회
// ============================================================================

export const GET = withAuth(async (req: NextRequest) => {
  try {
    const sessionId = req.nextUrl.searchParams.get('sessionId');

    if (!sessionId) {
      return Response.json(
        { success: false, error: 'sessionId is required' },
        { status: 400 }
      );
    }

    // Cloud Run이 활성화된 경우 프록시
    if (isCloudRunEnabled()) {
      const result = await proxyToCloudRun({
        path: `/api/ai/approval/status?sessionId=${encodeURIComponent(sessionId)}`,
        method: 'GET',
      });

      if (result.success) {
        return Response.json(result.data);
      }

      console.warn('⚠️ Cloud Run approval status check failed:', result.error);
    }

    // 로컬 모드: 승인 대기 없음 반환
    return Response.json({
      success: true,
      hasPending: false,
      action: null,
      sessionId,
      _backend: 'local',
    });
  } catch (error) {
    console.error('❌ [Approval] Status check failed:', error);
    return Response.json(
      {
        success: false,
        error: 'Failed to check approval status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});

// ============================================================================
// POST /api/ai/approval - 승인/거부 결정 처리
// ============================================================================

export const POST = withAuth(async (req: NextRequest) => {
  const startTime = Date.now();

  try {
    const body = await req.json();
    const parseResult = approvalDecisionSchema.safeParse(body);

    if (!parseResult.success) {
      return Response.json(
        {
          success: false,
          error: 'Invalid request payload',
          details: parseResult.error.issues.map((i) => i.message).join(', '),
        },
        { status: 400 }
      );
    }

    const { sessionId, approved, reason, approvedBy } = parseResult.data;

    console.log(
      `🔔 [Approval] Decision: ${approved ? '✅ Approved' : '❌ Rejected'}`
    );
    console.log(`   Session: ${sessionId}`);

    // Cloud Run이 활성화된 경우 프록시
    if (isCloudRunEnabled()) {
      const result = await proxyToCloudRun({
        path: '/api/ai/approval/decide',
        method: 'POST',
        body: { sessionId, approved, reason, approvedBy },
      });

      if (result.success) {
        return Response.json({
          ...(result.data as object),
          processingTime: `${Date.now() - startTime}ms`,
        });
      }

      console.warn('⚠️ Cloud Run approval decision failed:', result.error);
      return Response.json(
        {
          success: false,
          error: 'Cloud Run approval processing failed',
          message: result.error,
          processingTime: `${Date.now() - startTime}ms`,
        },
        { status: 502 }
      );
    }

    // 로컬 모드: 승인 처리 불가 (LangGraph 상태가 Cloud Run에만 있음)
    return Response.json(
      {
        success: false,
        error: 'Approval processing requires Cloud Run backend',
        message: 'Local mode does not support HITL approvals',
        processingTime: `${Date.now() - startTime}ms`,
      },
      { status: 501 }
    );
  } catch (error) {
    console.error('❌ [Approval] Decision processing failed:', error);
    return Response.json(
      {
        success: false,
        error: 'Failed to process approval decision',
        message: error instanceof Error ? error.message : 'Unknown error',
        processingTime: `${Date.now() - startTime}ms`,
      },
      { status: 500 }
    );
  }
});
