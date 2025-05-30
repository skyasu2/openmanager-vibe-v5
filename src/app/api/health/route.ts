/**
 * 🏥 시스템 헬스 체크 API
 * GET /api/health
 * 
 * 시스템 전체 상태를 빠르게 확인하는 헬스 체크 엔드포인트:
 * - 기본 시스템 상태 (uptime, memory, cpu)
 * - 서비스별 헬스 체크 (simulation, database, cache)
 * - 빠른 응답 시간 (500ms 이하 목표)
 * - Kubernetes liveness/readiness probe 호환
 */

import { NextRequest, NextResponse } from 'next/server';
import { simulationEngine } from '../../../services/simulationEngine';
import { systemStateManager } from '../../../core/system/SystemStateManager';
import { cacheService } from '../../../services/cacheService';

/**
 * 🎯 헬스 체크 타입 정의
 */
interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    [service: string]: {
      status: 'pass' | 'fail' | 'warn';
      responseTime: number;
      details?: any;
    };
  };
  summary: {
    passed: number;
    failed: number;
    warned: number;
    total: number;
  };
}

/**
 * 🔍 기본 헬스 체크 (GET)
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const { searchParams } = new URL(request.url);
  const detailed = searchParams.get('detailed') === 'true';
  
  try {
    console.log(`🏥 헬스 체크 시작 (detailed: ${detailed})`);

    // 기본 시스템 정보
    const uptime = process.uptime() * 1000; // milliseconds
    const memoryUsage = process.memoryUsage();
    
    const checks: { [service: string]: any } = {};

    // 1. 시뮬레이션 엔진 체크
    const simulationCheck = await checkSimulationEngine();
    checks.simulation = simulationCheck;

    // 2. 메모리 상태 체크
    const memoryCheck = checkMemoryUsage(memoryUsage);
    checks.memory = memoryCheck;

    // 3. 캐시 서비스 체크
    if (detailed) {
      const cacheCheck = await checkCacheService();
      checks.cache = cacheCheck;

      // 4. 데이터베이스 상태 체크 (간단)
      const dbCheck = await checkDatabaseConnection();
      checks.database = dbCheck;

      // 5. API 응답성 체크
      const apiCheck = checkApiResponsiveness(startTime);
      checks.api = apiCheck;
    }

    // 상태 요약 계산
    const summary = calculateSummary(checks);
    const overallStatus = determineOverallStatus(summary);

    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime,
      version: process.env.npm_package_version || '5.11.0',
      environment: process.env.NODE_ENV || 'development',
      checks,
      summary
    };

    // API 호출 추적
    const responseTime = Date.now() - startTime;
    systemStateManager.trackApiCall(responseTime, overallStatus === 'unhealthy');

    // HTTP 상태 코드 결정
    const httpStatus = overallStatus === 'unhealthy' ? 503 : 
                      overallStatus === 'degraded' ? 200 : 200;

    return NextResponse.json(healthStatus, { 
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Check': overallStatus,
        'X-Response-Time': responseTime.toString()
      }
    });

  } catch (error) {
    console.error('❌ 헬스 체크 실패:', error);
    
    // 에러 시 기본 응답
    const errorResponse: HealthStatus = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime() * 1000,
      version: process.env.npm_package_version || '5.11.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        system: {
          status: 'fail',
          responseTime: Date.now() - startTime,
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        }
      },
      summary: { passed: 0, failed: 1, warned: 0, total: 1 }
    };

    return NextResponse.json(errorResponse, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Check': 'unhealthy'
      }
    });
  }
}

/**
 * 🔧 시뮬레이션 엔진 상태 체크
 */
async function checkSimulationEngine(): Promise<{
  status: 'pass' | 'fail' | 'warn';
  responseTime: number;
  details?: any;
}> {
  const startTime = Date.now();
  
  try {
    const isRunning = simulationEngine.isRunning();
    const summary = simulationEngine.getSimulationSummary();
    const responseTime = Date.now() - startTime;

    if (!isRunning) {
      return {
        status: 'warn',
        responseTime,
        details: { 
          message: '시뮬레이션 엔진이 중지되어 있습니다',
          isRunning: false,
          totalServers: summary.totalServers
        }
      };
    }

    return {
      status: 'pass',
      responseTime,
      details: {
        isRunning: true,
        totalServers: summary.totalServers,
        totalMetrics: summary.totalMetrics,
        patternsEnabled: summary.patternsEnabled
      }
    };

  } catch (error) {
    return {
      status: 'fail',
      responseTime: Date.now() - startTime,
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    };
  }
}

/**
 * 🧠 메모리 사용량 체크
 */
function checkMemoryUsage(memoryUsage: NodeJS.MemoryUsage): {
  status: 'pass' | 'fail' | 'warn';
  responseTime: number;
  details: any;
} {
  const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
  const heapTotalMB = memoryUsage.heapTotal / 1024 / 1024;
  const memoryUsagePercent = (heapUsedMB / heapTotalMB) * 100;

  let status: 'pass' | 'fail' | 'warn' = 'pass';
  
  if (memoryUsagePercent > 90) {
    status = 'fail';
  } else if (memoryUsagePercent > 75) {
    status = 'warn';
  }

  return {
    status,
    responseTime: 1, // 메모리 체크는 즉시
    details: {
      heapUsed: Math.round(heapUsedMB),
      heapTotal: Math.round(heapTotalMB),
      usagePercent: Math.round(memoryUsagePercent),
      external: Math.round(memoryUsage.external / 1024 / 1024),
      rss: Math.round(memoryUsage.rss / 1024 / 1024)
    }
  };
}

/**
 * 💾 캐시 서비스 체크
 */
async function checkCacheService(): Promise<{
  status: 'pass' | 'fail' | 'warn';
  responseTime: number;
  details?: any;
}> {
  const startTime = Date.now();
  
  try {
    // Redis 상태 확인
    const redisStatus = await cacheService.checkRedisStatus();
    
    // 캐시된 서버 데이터 테스트
    const cachedServers = await cacheService.getCachedServers();
    
    const responseTime = Date.now() - startTime;

    if (!redisStatus.connected && !cachedServers) {
      return {
        status: 'fail',
        responseTime,
        details: { 
          redis: redisStatus,
          memoryCache: false,
          message: '모든 캐시 서비스 실패'
        }
      };
    }

    return {
      status: redisStatus.connected ? 'pass' : 'warn',
      responseTime,
      details: {
        redis: redisStatus,
        memoryCache: cachedServers !== null,
        message: redisStatus.connected ? 'Redis 정상' : '메모리 캐시로 동작 중'
      }
    };

  } catch (error) {
    return {
      status: 'fail',
      responseTime: Date.now() - startTime,
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    };
  }
}

/**
 * 🗄️ 데이터베이스 연결 체크 (간단)
 */
async function checkDatabaseConnection(): Promise<{
  status: 'pass' | 'fail' | 'warn';
  responseTime: number;
  details?: any;
}> {
  const startTime = Date.now();
  
  try {
    // 환경변수 확인
    const hasRedis = !!process.env.REDIS_URL;
    const hasSupabase = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    const responseTime = Date.now() - startTime;

    if (!hasRedis && !hasSupabase) {
      return {
        status: 'warn',
        responseTime,
        details: {
          message: '데이터베이스 미설정 (메모리 모드)',
          redis: false,
          supabase: false
        }
      };
    }

    return {
      status: 'pass',
      responseTime,
      details: {
        redis: hasRedis,
        supabase: hasSupabase,
        message: '데이터베이스 설정 완료'
      }
    };

  } catch (error) {
    return {
      status: 'fail',
      responseTime: Date.now() - startTime,
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    };
  }
}

/**
 * ⚡ API 응답성 체크
 */
function checkApiResponsiveness(startTime: number): {
  status: 'pass' | 'fail' | 'warn';
  responseTime: number;
  details: any;
} {
  const currentTime = Date.now();
  const responseTime = currentTime - startTime;

  let status: 'pass' | 'fail' | 'warn' = 'pass';
  
  if (responseTime > 1000) {
    status = 'fail';
  } else if (responseTime > 500) {
    status = 'warn';
  }

  return {
    status,
    responseTime,
    details: {
      target: '< 500ms',
      actual: `${responseTime}ms`,
      performance: responseTime < 500 ? 'excellent' : 
                  responseTime < 1000 ? 'acceptable' : 'poor'
    }
  };
}

/**
 * 📊 상태 요약 계산
 */
function calculateSummary(checks: { [service: string]: any }): {
  passed: number;
  failed: number;
  warned: number;
  total: number;
} {
  const statuses = Object.values(checks).map((check: any) => check.status);
  
  return {
    passed: statuses.filter(s => s === 'pass').length,
    failed: statuses.filter(s => s === 'fail').length,
    warned: statuses.filter(s => s === 'warn').length,
    total: statuses.length
  };
}

/**
 * 🎯 전체 상태 결정
 */
function determineOverallStatus(summary: { passed: number; failed: number; warned: number; total: number }): 'healthy' | 'degraded' | 'unhealthy' {
  if (summary.failed > 0) {
    return 'unhealthy';
  }
  
  if (summary.warned > 0) {
    return 'degraded';
  }
  
  return 'healthy';
}

/**
 * OPTIONS - CORS 지원
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
} 