/**
 * Human-in-the-Loop Approval API Route
 * Cloud Run AI Backend로 승인 요청 프록시
 *
 * @updated 2025-12-30 - Circuit Breaker + Fallback 적용
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { executeWithCircuitBreakerAndFallback } from '@/lib/ai/circuit-breaker';
import { createFallbackResponse } from '@/lib/ai/fallback/ai-fallback-handler';
import { isCloudRunEnabled, proxyToCloudRun } from '@/lib/ai-proxy/proxy';
import { withAuth } from '@/lib/auth/api-auth';

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
      return NextResponse.json(
        { success: false, error: 'sessionId is required' },
        { status: 400 }
      );
    }

    // Cloud Run 비활성화 시 폴백 응답
    if (!isCloudRunEnabled()) {
      const fallback = createFallbackResponse('approval');
      return NextResponse.json(fallback);
    }

    // Cloud Run 프록시 호출 (Circuit Breaker + Fallback)
    const result = await executeWithCircuitBreakerAndFallback<
      Record<string, unknown>
    >(
      'approval-status',
      // Primary: Cloud Run 호출
      async () => {
        const cloudRunResult = await proxyToCloudRun({
          path: `/api/ai/approval/status?sessionId=${encodeURIComponent(sessionId)}`,
          method: 'GET',
          timeout: 10000,
        });

        if (!cloudRunResult.success || !cloudRunResult.data) {
          throw new Error(cloudRunResult.error ?? 'Cloud Run request failed');
        }

        return cloudRunResult.data as Record<string, unknown>;
      },
      // Fallback: 로컬 폴백 응답
      () => createFallbackResponse('approval') as Record<string, unknown>
    );

    // 폴백 응답인 경우 헤더 추가
    if (result.source === 'fallback') {
      return NextResponse.json(result.data, {
        headers: {
          'X-Fallback-Response': 'true',
          'X-Retry-After': '30000',
        },
      });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('❌ [Approval] Status check failed:', error);

    // 예상치 못한 에러 시에도 폴백 반환
    const fallback = createFallbackResponse('approval');
    return NextResponse.json(fallback, {
      headers: {
        'X-Fallback-Response': 'true',
        'X-Error': error instanceof Error ? error.message : 'Unknown error',
      },
    });
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
      return NextResponse.json(
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

    // Cloud Run 비활성화 시 폴백 응답
    if (!isCloudRunEnabled()) {
      const fallback = createFallbackResponse('approval');
      return NextResponse.json({
        ...fallback,
        processingTime: `${Date.now() - startTime}ms`,
      });
    }

    // Cloud Run 프록시 호출 (Circuit Breaker + Fallback)
    const result = await executeWithCircuitBreakerAndFallback<
      Record<string, unknown>
    >(
      'approval-decide',
      // Primary: Cloud Run 호출
      async () => {
        const cloudRunResult = await proxyToCloudRun({
          path: '/api/ai/approval/decide',
          method: 'POST',
          body: { sessionId, approved, reason, approvedBy },
          timeout: 15000,
        });

        if (!cloudRunResult.success || !cloudRunResult.data) {
          throw new Error(cloudRunResult.error ?? 'Cloud Run request failed');
        }

        return {
          ...(cloudRunResult.data as Record<string, unknown>),
          processingTime: `${Date.now() - startTime}ms`,
        };
      },
      // Fallback: 로컬 폴백 응답
      () =>
        ({
          ...createFallbackResponse('approval'),
          processingTime: `${Date.now() - startTime}ms`,
        }) as Record<string, unknown>
    );

    // 폴백 응답인 경우 헤더 추가
    if (result.source === 'fallback') {
      return NextResponse.json(result.data, {
        headers: {
          'X-Fallback-Response': 'true',
          'X-Retry-After': '30000',
        },
      });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('❌ [Approval] Decision processing failed:', error);

    // 예상치 못한 에러 시에도 폴백 반환
    const fallback = createFallbackResponse('approval');
    return NextResponse.json(
      {
        ...fallback,
        processingTime: `${Date.now() - startTime}ms`,
      },
      {
        headers: {
          'X-Fallback-Response': 'true',
          'X-Error': error instanceof Error ? error.message : 'Unknown error',
        },
      }
    );
  }
});
