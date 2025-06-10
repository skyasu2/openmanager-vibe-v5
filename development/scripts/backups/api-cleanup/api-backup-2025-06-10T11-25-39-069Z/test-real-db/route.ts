import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const results = {
    timestamp: new Date().toISOString(),
    tests: [] as any[],
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
    },
  };

  // 🔴 Redis 연결 테스트
  try {
    const redis = new Redis({
      url: 'https://charming-condor-46598.upstash.io',
      token: 'AbYGAAIjcDE5MjNmYjhiZDkwOGQ0MTUyOGFiZjUyMmQ0YTkyMzIwM3AxMA',
    });

    // 간단한 ping 테스트
    const pingResult = await redis.ping();

    // 데이터 쓰기/읽기 테스트
    const testKey = `test_${Date.now()}`;
    await redis.set(testKey, 'hello_redis');
    const data = await redis.get(testKey);

    // 정리
    await redis.del(testKey);

    results.tests.push({
      name: 'Upstash Redis 연결',
      status: 'passed',
      details: {
        ping: pingResult,
        writeRead: data === 'hello_redis' ? 'success' : 'failed',
        message: 'Redis 연결 및 읽기/쓰기 테스트 성공',
      },
    });
    results.summary.passed++;
  } catch (error) {
    results.tests.push({
      name: 'Upstash Redis 연결',
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
    });
    results.summary.failed++;
  }

  // 🟢 Supabase 연결 테스트
  try {
    const supabase = createClient(
      'https://vnswjnltnhpsueosfhmw.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MjMzMjcsImV4cCI6MjA2MzQ5OTMyN30.09ApSnuXNv_yYVJWQWGpOFWw3tkLbxSA21k5sroChGU'
    );

    // 간단한 연결 테스트 (public 스키마 확인)
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .limit(5);

    if (error) {
      throw error;
    }

    results.tests.push({
      name: 'Supabase PostgreSQL 연결',
      status: 'passed',
      details: {
        tablesCount: data?.length || 0,
        message: 'Supabase 연결 및 스키마 조회 성공',
        sampleTables: data?.slice(0, 3).map(t => t.table_name),
      },
    });
    results.summary.passed++;
  } catch (error) {
    results.tests.push({
      name: 'Supabase PostgreSQL 연결',
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
    });
    results.summary.failed++;
  }

  // 🔵 환경 변수 확인
  try {
    const envVars = {
      REDIS_URL: !!process.env.REDIS_URL,
      KV_URL: !!process.env.KV_URL,
      KV_REST_API_URL: !!process.env.KV_REST_API_URL,
      KV_REST_API_TOKEN: !!process.env.KV_REST_API_TOKEN,
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY:
        !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      POSTGRES_URL: !!process.env.POSTGRES_URL,
    };

    const missingVars = Object.entries(envVars)
      .filter(([key, exists]) => !exists)
      .map(([key]) => key);

    results.tests.push({
      name: '환경 변수 확인',
      status: missingVars.length === 0 ? 'passed' : 'warning',
      details: {
        totalVars: Object.keys(envVars).length,
        presentVars: Object.values(envVars).filter(Boolean).length,
        missingVars: missingVars.length > 0 ? missingVars : undefined,
        message:
          missingVars.length === 0
            ? '모든 환경 변수 설정됨'
            : `${missingVars.length}개 환경 변수 누락`,
      },
    });

    if (missingVars.length === 0) {
      results.summary.passed++;
    } else {
      results.summary.failed++;
    }
  } catch (error) {
    results.tests.push({
      name: '환경 변수 확인',
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
    });
    results.summary.failed++;
  }

  results.summary.total = results.tests.length;

  const overallStatus =
    results.summary.failed === 0
      ? 'healthy'
      : results.summary.passed > results.summary.failed
        ? 'degraded'
        : 'unhealthy';

  return NextResponse.json({
    status: overallStatus,
    message: `${results.summary.passed}/${results.summary.total} 테스트 통과`,
    ...results,
  });
}
