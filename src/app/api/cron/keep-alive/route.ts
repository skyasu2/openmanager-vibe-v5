/**
 * 서버 기반 Keep-Alive Cron 작업
 * Vercel Cron Jobs 또는 외부 스케줄러 사용
 */

import { NextResponse } from 'next/server';
import { smartSupabase } from '@/lib/supabase';
import { smartRedis } from '@/lib/redis';
import { usageMonitor } from '@/lib/usage-monitor';

export async function GET(request: Request) {
  // 빌드 타임 체크 - 빌드 시에는 더미 응답 반환
  if (
    process.env.npm_lifecycle_event === 'build' ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL
  ) {
    return NextResponse.json({
      success: true,
      message: 'Build time - Keep-Alive skipped',
      results: {
        timestamp: new Date().toISOString(),
        supabase: { success: true, error: null },
        redis: { success: true, error: null },
        usage: null,
      },
    });
  }

  // 인증 확인 (Cron 요청만 허용)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || 'default-secret';

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const results = {
      timestamp: new Date().toISOString(),
      supabase: { success: false, error: null as string | null },
      redis: { success: false, error: null as string | null },
      usage: null as any,
    };

    // 사용량 체크
    const usageStatus = usageMonitor.getUsageStatus();
    results.usage = usageStatus;

    // Supabase Keep-Alive
    if (usageStatus.supabase.enabled) {
      try {
        console.log('🔔 서버 Supabase Keep-Alive 실행...');
        await smartSupabase.select('servers', 'count');

        // 사용량 기록
        usageMonitor.recordSupabaseUsage(0.01, 1);

        results.supabase.success = true;
        console.log('✅ 서버 Supabase Keep-Alive 성공');
      } catch (error) {
        results.supabase.error =
          error instanceof Error ? error.message : 'Unknown error';
        console.error('❌ 서버 Supabase Keep-Alive 실패:', error);
      }
    } else {
      results.supabase.error = 'Service disabled due to usage limits';
    }

    // Redis Keep-Alive
    if (usageStatus.redis.enabled) {
      try {
        console.log('🔔 서버 Redis Keep-Alive 실행...');

        const pingKey = 'server-keep-alive-ping';
        const pingValue = Date.now().toString();

        await smartRedis.set(pingKey, pingValue, { ex: 300 }); // 5분 TTL
        const result = await smartRedis.get(pingKey);

        if (result === pingValue) {
          // 사용량 기록
          usageMonitor.recordRedisUsage(2);

          results.redis.success = true;
          console.log('✅ 서버 Redis Keep-Alive 성공');
        } else {
          throw new Error('Redis ping 응답 불일치');
        }
      } catch (error) {
        results.redis.error =
          error instanceof Error ? error.message : 'Unknown error';
        console.error('❌ 서버 Redis Keep-Alive 실패:', error);
      }
    } else {
      results.redis.error = 'Service disabled due to usage limits';
    }

    return NextResponse.json({
      success: true,
      message: 'Keep-Alive cron job completed',
      results,
    });
  } catch (error) {
    console.error('Keep-Alive cron job failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Keep-Alive cron job failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST 메서드로 수동 실행 지원
export async function POST(request: Request) {
  // 개발 환경에서만 허용
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Only available in development' },
      { status: 403 }
    );
  }

  return GET(request);
}
