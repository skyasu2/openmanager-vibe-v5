/**
 * 🗂️ 데이터 보존 스케줄러 API
 *
 * OpenManager v5.44.3 - 데이터 정리 관리 API (2025-07-02 18:15 KST)
 * - DataRetentionScheduler 서버 사이드 관리
 * - 통계 조회, 수동 정리, 정책 관리
 * - Phase 3 SSE 최적화 통합
 */

import { getDataRetentionScheduler } from '@/lib/DataRetentionScheduler';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'stats';

    const scheduler = getDataRetentionScheduler();

    switch (action) {
      case 'stats':
        const stats = scheduler.getStats();
        return NextResponse.json({
          success: true,
          data: stats,
          timestamp: new Date().toISOString(),
        });

      case 'policies':
        const policies = scheduler.getPolicies();
        return NextResponse.json({
          success: true,
          data: policies,
          timestamp: new Date().toISOString(),
        });

      case 'history':
        const limit = parseInt(searchParams.get('limit') || '20');
        const history = scheduler.getCleanupHistory(limit);
        return NextResponse.json({
          success: true,
          data: history,
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ 데이터 보존 API 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    const scheduler = getDataRetentionScheduler();

    switch (action) {
      case 'cleanup':
        const { dataType } = params;
        const results = await scheduler.manualCleanup(dataType);
        return NextResponse.json({
          success: true,
          data: results,
          message: `정리 완료: ${results.length}개 작업 수행`,
          timestamp: new Date().toISOString(),
        });

      case 'add-policy':
        const { policyData } = params;
        const policyId = scheduler.addPolicy(policyData);
        return NextResponse.json({
          success: true,
          data: { policyId },
          message: '새 정책 추가 완료',
          timestamp: new Date().toISOString(),
        });

      case 'update-policy':
        const { policyId: updateId, updates } = params;
        const updateSuccess = scheduler.updatePolicy(updateId, updates);
        return NextResponse.json({
          success: updateSuccess,
          message: updateSuccess ? '정책 업데이트 완료' : '정책 업데이트 실패',
          timestamp: new Date().toISOString(),
        });

      case 'delete-policy':
        const { policyId: deleteId } = params;
        const deleteSuccess = scheduler.deletePolicy(deleteId);
        return NextResponse.json({
          success: deleteSuccess,
          message: deleteSuccess ? '정책 삭제 완료' : '정책 삭제 실패',
          timestamp: new Date().toISOString(),
        });

      // Phase 3 SSE 특화 정리
      case 'cleanup-sse':
        const sseResults = await scheduler.manualCleanup('sse');
        return NextResponse.json({
          success: true,
          data: sseResults,
          message: 'SSE 데이터 정리 완료',
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ 데이터 보존 POST API 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PATCH: 정책 토글 (활성화/비활성화)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { policyId, enabled } = body;

    if (!policyId) {
      return NextResponse.json(
        { success: false, error: 'Policy ID required' },
        { status: 400 }
      );
    }

    const scheduler = getDataRetentionScheduler();
    const success = scheduler.updatePolicy(policyId, { enabled });

    return NextResponse.json({
      success,
      message: success
        ? `정책 ${enabled ? '활성화' : '비활성화'} 완료`
        : '정책 상태 변경 실패',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ 데이터 보존 PATCH API 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
