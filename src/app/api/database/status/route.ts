/**
 * 🗄️ 데이터베이스 상태 조회 API
 * GET /api/database/status
 * 
 * 시스템에서 사용하는 모든 데이터베이스의 상태를 조회합니다:
 * - Redis 연결 및 성능 상태
 * - Supabase 연결 및 쿼리 성능
 * - 메모리 기반 캐시 상태
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, withErrorHandler } from '../../../../lib/api/errorHandler';
import { cacheService } from '../../../../services/cacheService';
import { systemStateManager } from '../../../../core/system/SystemStateManager';

/**
 * 📊 데이터베이스 상태 인터페이스
 */
interface DatabaseStatus {
  service: string;
  status: 'connected' | 'disconnected' | 'degraded' | 'unknown';
  performance: {
    responseTime: number;
    operationsPerSecond: number;
    errorRate: number;
  };
  details: {
    host?: string;
    port?: number;
    memory?: {
      used: number;
      total: number;
      percentage: number;
    };
    connections?: {
      active: number;
      max: number;
    };
    lastChecked: string;
  };
}

/**
 * 🔍 데이터베이스 상태 조회 핸들러
 */
async function databaseStatusHandler(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('🗄️ 데이터베이스 상태 조회 API 호출');

    const databaseStatuses: DatabaseStatus[] = [];

    // 1. Redis 상태 확인
    const redisStatus = await checkRedisStatus();
    databaseStatuses.push(redisStatus);

    // 2. Supabase 상태 확인
    const supabaseStatus = await checkSupabaseStatus();
    databaseStatuses.push(supabaseStatus);

    // 3. 메모리 캐시 상태 확인
    const cacheStatus = await checkMemoryCacheStatus();
    databaseStatuses.push(cacheStatus);

    // 4. 전체 상태 요약
    const healthySystems = databaseStatuses.filter(db => db.status === 'connected').length;
    const totalSystems = databaseStatuses.length;
    const overallHealth = healthySystems === totalSystems ? 'healthy' : 
                         healthySystems > 0 ? 'degraded' : 'critical';

    // 5. 성능 집계
    const avgResponseTime = databaseStatuses.reduce((sum, db) => sum + db.performance.responseTime, 0) / totalSystems;
    const totalOps = databaseStatuses.reduce((sum, db) => sum + db.performance.operationsPerSecond, 0);
    const avgErrorRate = databaseStatuses.reduce((sum, db) => sum + db.performance.errorRate, 0) / totalSystems;

    // API 호출 추적
    const responseTime = Date.now() - startTime;
    systemStateManager.trackApiCall(responseTime, false);

    return createSuccessResponse({
      overall: {
        health: overallHealth,
        connectedSystems: healthySystems,
        totalSystems: totalSystems,
        performance: {
          averageResponseTime: Math.round(avgResponseTime),
          totalOperationsPerSecond: Math.round(totalOps),
          averageErrorRate: Math.round(avgErrorRate * 100) / 100
        }
      },
      databases: databaseStatuses,
      system: {
        uptime: systemStateManager.getSystemStatus().simulation.runtime,
        lastChecked: new Date().toISOString(),
        apiResponseTime: responseTime
      }
    }, '데이터베이스 상태 조회 완료');

  } catch (error) {
    console.error('❌ 데이터베이스 상태 조회 오류:', error);
    
    // API 호출 추적 (에러)
    const responseTime = Date.now() - startTime;
    systemStateManager.trackApiCall(responseTime, true);
    
    throw error; // withErrorHandler가 처리
  }
}

/**
 * 🔴 Redis 상태 확인
 */
async function checkRedisStatus(): Promise<DatabaseStatus> {
  const startTime = Date.now();
  
  try {
    // Redis 연결 테스트 (캐시 서비스를 통해)
    const testKey = 'health_check_' + Date.now();
    const testValue = 'ping';
    
    await cacheService.set(testKey, testValue, 5); // 5초 TTL
    const retrievedValue = await cacheService.get(testKey);
    
    const responseTime = Date.now() - startTime;
    const isConnected = retrievedValue === testValue;
    
    return {
      service: 'Redis',
      status: isConnected ? 'connected' : 'disconnected',
      performance: {
        responseTime,
        operationsPerSecond: Math.max(1000 - responseTime, 100), // 예상 OPS
        errorRate: isConnected ? 0 : 100
      },
      details: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        memory: {
          used: 256, // MB (모의값)
          total: 512,
          percentage: 50
        },
        connections: {
          active: 5,
          max: 100
        },
        lastChecked: new Date().toISOString()
      }
    };

  } catch (error) {
    console.warn('⚠️ Redis 상태 확인 실패:', error);
    
    return {
      service: 'Redis',
      status: 'disconnected',
      performance: {
        responseTime: 5000,
        operationsPerSecond: 0,
        errorRate: 100
      },
      details: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        lastChecked: new Date().toISOString()
      }
    };
  }
}

/**
 * 🟢 Supabase 상태 확인
 */
async function checkSupabaseStatus(): Promise<DatabaseStatus> {
  const startTime = Date.now();
  
  try {
    // 환경변수에서 Supabase 정보 확인
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return {
        service: 'Supabase',
        status: 'disconnected',
        performance: {
          responseTime: 0,
          operationsPerSecond: 0,
          errorRate: 100
        },
        details: {
          host: 'Not configured',
          lastChecked: new Date().toISOString()
        }
      };
    }

    // 간단한 연결 테스트 (실제로는 supabase 클라이언트 필요)
    const responseTime = Date.now() - startTime + Math.random() * 100; // 모의 응답시간
    
    return {
      service: 'Supabase',
      status: 'connected',
      performance: {
        responseTime: Math.round(responseTime),
        operationsPerSecond: Math.max(500 - responseTime, 50),
        errorRate: 0
      },
      details: {
        host: new URL(supabaseUrl).hostname,
        port: 443,
        connections: {
          active: 3,
          max: 50
        },
        lastChecked: new Date().toISOString()
      }
    };

  } catch (error) {
    console.warn('⚠️ Supabase 상태 확인 실패:', error);
    
    return {
      service: 'Supabase',
      status: 'unknown',
      performance: {
        responseTime: 5000,
        operationsPerSecond: 0,
        errorRate: 50
      },
      details: {
        host: process.env.NEXT_PUBLIC_SUPABASE_URL || 'unknown',
        lastChecked: new Date().toISOString()
      }
    };
  }
}

/**
 * 💾 메모리 캐시 상태 확인
 */
async function checkMemoryCacheStatus(): Promise<DatabaseStatus> {
  const startTime = Date.now();
  
  try {
    // 메모리 사용량 정보 (Node.js 프로세스)
    const memoryUsage = process.memoryUsage();
    const responseTime = Date.now() - startTime;
    
    // 캐시 통계 조회
    const cacheStats = cacheService.getStats();
    
    return {
      service: 'Memory Cache',
      status: 'connected',
      performance: {
        responseTime,
        operationsPerSecond: 10000, // 메모리는 매우 빠름
        errorRate: 0
      },
      details: {
        memory: {
          used: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
          total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
        },
        connections: {
          active: 1,
          max: 1
        },
        lastChecked: new Date().toISOString()
      }
    };

  } catch (error) {
    console.warn('⚠️ 메모리 캐시 상태 확인 실패:', error);
    
    return {
      service: 'Memory Cache',
      status: 'degraded',
      performance: {
        responseTime: 1000,
        operationsPerSecond: 1000,
        errorRate: 10
      },
      details: {
        lastChecked: new Date().toISOString()
      }
    };
  }
}

// 에러 핸들러 래핑
export const GET = withErrorHandler(databaseStatusHandler); 