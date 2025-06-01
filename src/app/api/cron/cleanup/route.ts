/**
 * 🧹 Data Cleanup API v1.0
 * 
 * OpenManager v5.21.0 - 데이터 정리 스케줄러
 * GET: 정리 통계 및 히스토리 조회
 * POST: 수동 정리 실행
 * PUT: 정리 정책 관리
 * DELETE: 정책 삭제
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDataRetentionScheduler } from '@/schedulers/DataRetentionScheduler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 📊 정리 통계 및 히스토리 조회
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overview';
    const limit = parseInt(searchParams.get('limit') || '20');

    const scheduler = getDataRetentionScheduler();

    switch (type) {
      case 'stats':
        const statistics = scheduler.getStats();
        return NextResponse.json({
          success: true,
          data: {
            type: 'stats',
            stats: statistics,
            timestamp: Date.now()
          }
        });

      case 'policies':
        const policies = scheduler.getPolicies();
        return NextResponse.json({
          success: true,
          data: {
            type: 'policies',
            policies,
            count: policies.length
          }
        });

      case 'history':
        const history = scheduler.getCleanupHistory(limit);
        return NextResponse.json({
          success: true,
          data: {
            type: 'history',
            history,
            count: history.length,
            limit
          }
        });

      case 'overview':
      default:
        const overviewStats = scheduler.getStats();
        const recentHistory = scheduler.getCleanupHistory(5);
        const allPolicies = scheduler.getPolicies();
        const activePolicies = allPolicies.filter(p => p.enabled);

        return NextResponse.json({
          success: true,
          data: {
            type: 'overview',
            stats: overviewStats,
            recentHistory,
            activePolicies: activePolicies.length,
            totalPolicies: allPolicies.length,
            uptime: Date.now() - (overviewStats.lastCleanupTime || Date.now())
          }
        });
    }

  } catch (error) {
    console.error('❌ 정리 스케줄러 조회 오류:', error);
    return NextResponse.json({
      success: false,
      error: '정리 스케줄러 조회 중 오류가 발생했습니다'
    }, { status: 500 });
  }
}

/**
 * 🧹 수동 정리 실행
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, dataType, policyData } = body;

    const scheduler = getDataRetentionScheduler();

    switch (action) {
      case 'cleanup':
        console.log('🧹 수동 정리 시작...', dataType ? `(타입: ${dataType})` : '(전체)');
        
        const results = await scheduler.manualCleanup(dataType);
        const successfulResults = results.filter(r => r.success);
        const totalItemsRemoved = successfulResults.reduce((sum, r) => sum + r.itemsRemoved, 0);
        const totalSizeFreed = successfulResults.reduce((sum, r) => sum + r.sizeFreed, 0);

        return NextResponse.json({
          success: true,
          data: {
            action: 'cleanup',
            dataType: dataType || 'all',
            results,
            summary: {
              totalPolicies: results.length,
              successfulPolicies: successfulResults.length,
              itemsRemoved: totalItemsRemoved,
              sizeFreed: totalSizeFreed,
              sizeMB: Math.round(totalSizeFreed / 1024 / 1024 * 100) / 100
            },
            timestamp: Date.now()
          }
        });

      case 'add_policy':
        if (!policyData) {
          return NextResponse.json({
            success: false,
            error: '정책 데이터가 필요합니다'
          }, { status: 400 });
        }

        // 필수 필드 검증
        const requiredFields = ['name', 'dataType', 'maxAge', 'maxItems'];
        for (const field of requiredFields) {
          if (policyData[field] === undefined || policyData[field] === null) {
            return NextResponse.json({
              success: false,
              error: `${field}가 필요합니다`
            }, { status: 400 });
          }
        }

        const policyId = scheduler.addPolicy({
          name: policyData.name,
          dataType: policyData.dataType,
          maxAge: Number(policyData.maxAge),
          maxItems: Number(policyData.maxItems),
          enabled: policyData.enabled !== false,
          priority: Number(policyData.priority) || 5
        });

        return NextResponse.json({
          success: true,
          data: {
            action: 'add_policy',
            policyId,
            message: '새 정리 정책이 추가되었습니다'
          }
        });

      case 'test_cleanup':
        if (!dataType) {
          return NextResponse.json({
            success: false,
            error: '테스트할 데이터 타입이 필요합니다'
          }, { status: 400 });
        }

        console.log(`🧪 정리 테스트 시작: ${dataType}`);
        const testResults = await scheduler.manualCleanup(dataType);
        
        return NextResponse.json({
          success: true,
          data: {
            action: 'test_cleanup',
            dataType,
            results: testResults,
            message: `${dataType} 정리 테스트 완료`
          }
        });

      default:
        return NextResponse.json({
          success: false,
          error: '유효하지 않은 액션입니다'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ 수동 정리 실행 오류:', error);
    return NextResponse.json({
      success: false,
      error: '수동 정리 실행 중 오류가 발생했습니다'
    }, { status: 500 });
  }
}

/**
 * ✏️ 정리 정책 업데이트
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { policyId, updates } = body;

    if (!policyId || !updates) {
      return NextResponse.json({
        success: false,
        error: 'policyId와 updates가 필요합니다'
      }, { status: 400 });
    }

    const scheduler = getDataRetentionScheduler();
    const result = scheduler.updatePolicy(policyId, updates);

    return NextResponse.json({
      success: result,
      data: {
        action: 'update_policy',
        policyId,
        updates,
        message: result ? '정책이 업데이트되었습니다' : '정책을 찾을 수 없습니다'
      }
    });

  } catch (error) {
    console.error('❌ 정리 정책 업데이트 오류:', error);
    return NextResponse.json({
      success: false,
      error: '정리 정책 업데이트 중 오류가 발생했습니다'
    }, { status: 500 });
  }
}

/**
 * 🗑️ 정리 정책 삭제
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const policyId = searchParams.get('policyId');

    if (!policyId) {
      return NextResponse.json({
        success: false,
        error: 'policyId가 필요합니다'
      }, { status: 400 });
    }

    const scheduler = getDataRetentionScheduler();
    const result = scheduler.deletePolicy(policyId);

    return NextResponse.json({
      success: result,
      data: {
        action: 'delete_policy',
        policyId,
        message: result ? '정책이 삭제되었습니다' : '정책을 찾을 수 없습니다'
      }
    });

  } catch (error) {
    console.error('❌ 정리 정책 삭제 오류:', error);
    return NextResponse.json({
      success: false,
      error: '정리 정책 삭제 중 오류가 발생했습니다'
    }, { status: 500 });
  }
} 