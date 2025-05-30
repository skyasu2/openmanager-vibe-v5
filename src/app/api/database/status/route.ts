import { NextRequest, NextResponse } from 'next/server';
import { checkRedisConnection } from '../../../../lib/redis';
import { checkSupabaseConnection } from '../../../../lib/supabase';

/**
 * 🔍 데이터베이스 연결 상태 확인 API
 * GET /api/database/status
 * 
 * Redis와 Supabase 연결 상태를 실시간으로 확인합니다.
 */

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // 병렬로 연결 상태 확인
    const [redisStatus, supabaseStatus] = await Promise.allSettled([
      checkRedisConnection(),
      checkSupabaseConnection()
    ]);

    // 응답 시간 계산
    const responseTime = Date.now() - startTime;

    // Redis 상태 처리
    const redisResult = redisStatus.status === 'fulfilled' 
      ? redisStatus.value 
      : { status: 'error', message: 'Connection check failed' };

    // Supabase 상태 처리
    const supabaseResult = supabaseStatus.status === 'fulfilled' 
      ? supabaseStatus.value 
      : { status: 'error', message: 'Connection check failed' };

    // 전체 상태 결정
    const allHealthy = redisResult.status === 'connected' && supabaseResult.status === 'connected';
    const anySimulated = redisResult.status === 'simulated' || supabaseResult.status === 'simulated';

    let overallStatus = 'error';
    if (allHealthy) {
      overallStatus = 'connected';
    } else if (anySimulated) {
      overallStatus = 'simulated';
    }

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      status: overallStatus,
      environment: process.env.NODE_ENV || 'development',
      databases: {
        redis: {
          ...redisResult,
          type: 'cache',
          provider: 'upstash',
          features: ['caching', 'session_storage', 'rate_limiting']
        },
        supabase: {
          ...supabaseResult,
          type: 'postgresql',
          provider: 'supabase',
          features: ['relational_database', 'real_time', 'auth', 'storage']
        }
      },
      summary: {
        totalDatabases: 2,
        connected: [redisResult, supabaseResult].filter(r => r.status === 'connected').length,
        simulated: [redisResult, supabaseResult].filter(r => r.status === 'simulated').length,
        failed: [redisResult, supabaseResult].filter(r => r.status === 'error').length
      },
      recommendations: generateRecommendations(redisResult, supabaseResult)
    };

    // 상태에 따른 HTTP 상태 코드 결정
    const httpStatus = overallStatus === 'error' ? 503 : 200;

    return NextResponse.json(response, { status: httpStatus });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      success: false,
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      status: 'error',
      error: {
        message: error instanceof Error ? error.message : 'Database status check failed',
        type: 'system_error'
      },
      databases: {
        redis: { status: 'error', message: 'Check failed' },
        supabase: { status: 'error', message: 'Check failed' }
      }
    }, { status: 500 });
  }
}

/**
 * 🔧 연결 상태에 따른 권장사항 생성
 */
function generateRecommendations(
  redisResult: { status: string; message: string },
  supabaseResult: { status: string; message: string }
): string[] {
  const recommendations: string[] = [];

  // Redis 권장사항
  if (redisResult.status === 'error') {
    recommendations.push('Redis 연결 실패: Upstash Redis 인스턴스 상태를 확인해주세요');
    recommendations.push('환경변수 UPSTASH_REDIS_REST_URL과 UPSTASH_REDIS_REST_TOKEN을 확인해주세요');
  } else if (redisResult.status === 'simulated') {
    recommendations.push('현재 Redis 시뮬레이션 모드입니다. 프로덕션 환경에서는 실제 Redis 인스턴스를 설정해주세요');
  }

  // Supabase 권장사항
  if (supabaseResult.status === 'error') {
    recommendations.push('Supabase 연결 실패: 프로젝트 상태와 네트워크 연결을 확인해주세요');
    recommendations.push('환경변수 NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 확인해주세요');
  } else if (supabaseResult.status === 'simulated') {
    recommendations.push('현재 Supabase 시뮬레이션 모드입니다. 프로덕션 환경에서는 실제 Supabase 프로젝트를 설정해주세요');
  }

  // 성능 권장사항
  if (redisResult.status === 'connected' && supabaseResult.status === 'connected') {
    recommendations.push('모든 데이터베이스가 정상 연결되었습니다. 성능 모니터링을 계속 진행해주세요');
    recommendations.push('캐시 적중률과 데이터베이스 응답 시간을 모니터링하는 것을 권장합니다');
  }

  return recommendations;
} 