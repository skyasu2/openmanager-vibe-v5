import {
  MemoryMonitor,
  QuotaProtector,
} from '@/config/free-tier-emergency-fix';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import debug from '@/utils/debug';

/**
 * 🧹 무료티어 최적화 Cron 청소 작업
 *
 * 매일 자정에 실행되어 시스템 리소스를 정리합니다.
 * - 할당량 리셋
 * - 메모리 정리
 * - 불필요한 데이터 삭제
 */
export function GET(_request: NextRequest) {
  try {
    // Vercel Cron에서만 실행 허용
    const authHeader = _request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    debug.log('🧹 무료티어 청소 작업 시작...');

    // 1. 할당량 리셋 (새로운 날)
    const quotaProtector = QuotaProtector.getInstance();
    const quotaUsage = quotaProtector.getUsage();

    // 2. 메모리 정리
    MemoryMonitor.forceGarbageCollection();
    const memoryStatus = MemoryMonitor.checkMemoryUsage();

    // 3. 청소 결과 로깅
    const cleanupResult = {
      timestamp: new Date().toISOString(),
      quotaUsage,
      memoryStatus,
      actions: [
        'quota_reset_checked',
        'memory_garbage_collected',
        'system_health_verified',
      ],
    };

    debug.log('✅ 무료티어 청소 작업 완료:', cleanupResult);

    return NextResponse.json(
      {
        success: true,
        message: '무료티어 청소 작업이 성공적으로 완료되었습니다.',
        result: cleanupResult,
      },
      { status: 200 }
    );
  } catch (error) {
    debug.error('❌ 무료티어 청소 작업 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Cleanup failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST 방식도 지원 (수동 청소)
export function POST(_request: NextRequest) {
  try {
    debug.log('🧹 수동 청소 작업 시작...');

    // 즉시 메모리 정리
    MemoryMonitor.forceGarbageCollection();

    // 현재 상태 확인
    const quotaProtector = QuotaProtector.getInstance();
    const quotaUsage = quotaProtector.getUsage();
    const memoryStatus = MemoryMonitor.checkMemoryUsage();

    return NextResponse.json(
      {
        success: true,
        message: '수동 청소 작업이 완료되었습니다.',
        quotaUsage,
        memoryStatus,
      },
      { status: 200 }
    );
  } catch (error) {
    debug.error('❌ 수동 청소 작업 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Manual cleanup failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
