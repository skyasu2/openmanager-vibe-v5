/**
 * 📊 AI 시스템 모니터링 API
 *
 * 실시간 AI 성능, 캐시 통계, 에러 분석 제공
 * GET /api/ai/monitoring
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { supabase } from '@/lib/supabase/supabase-client';
import debug from '@/utils/debug';

// 동적 import로 빌드 시점 초기화 방지
async function getQueryEngine() {
  const { getSimplifiedQueryEngine } = await import(
    '@/services/ai/SimplifiedQueryEngine'
  );
  return getSimplifiedQueryEngine();
}

export const runtime = 'nodejs';

// 📊 모니터링 데이터 타입
interface MonitoringData {
  timestamp: string;
  system: {
    uptime: number;
    version: string;
    environment: string;
  };
  performance: {
    totalRequests: number;
    avgResponseTime: number;
    successRate: number;
    errorRate: number;
  };
  cache: {
    hitRate: number;
    hitRateImprovement: string;
    totalEntries: number;
    memoryUsage: {
      entriesCount: number;
      maxEntries: number;
      utilizationRate: number;
    };
  };
  errors: {
    recentErrors: Array<{
      type: string;
      count: number;
      lastOccurred: string;
    }>;
    errorDistribution: {
      timeout: number;
      network: number;
      api: number;
      memory: number;
      validation: number;
      unknown: number;
    };
  };
  engines: {
    local: {
      status: 'active' | 'inactive';
      requestCount: number;
      avgResponseTime: number;
    };
    googleAI: {
      status: 'active' | 'inactive';
      requestCount: number;
      avgResponseTime: number;
      apiUsage: {
        dailyRequests: number;
        dailyLimit: number;
        utilizationRate: number;
      };
    };
  };
}

async function getHandler() {
  try {
    const startTime = Date.now();

    // AI 엔진 인스턴스 가져오기
    const engine = await getQueryEngine();

    // 🔍 캐시 통계 수집
    const cacheStats = engine.utils?.getCacheStats() || {
      hitRate: 0,
      hitRateImprovement: '데이터 없음',
      totalEntries: 0,
      totalRequests: 0,
      hits: 0,
      misses: 0,
      memoryUsage: {
        entriesCount: 0,
        maxEntries: 100,
        utilizationRate: 0,
      },
    };

    // 📊 최근 쿼리 로그 분석 (지난 24시간)
    const twentyFourHoursAgo = new Date(
      Date.now() - 24 * 60 * 60 * 1000
    ).toISOString();

    const { data: recentQueries, error: queryError } = await supabase
      .from('query_logs')
      .select('*')
      .gte('created_at', twentyFourHoursAgo)
      .order('created_at', { ascending: false });

    if (queryError) {
      debug.warn('쿼리 로그 조회 실패:', queryError);
    }

    // 🔄 성능 메트릭 계산
    const totalRequests = recentQueries?.length || 0;
    const avgResponseTime =
      totalRequests > 0
        ? recentQueries!.reduce((sum, q) => sum + (q.response_time || 0), 0) /
          totalRequests
        : 0;

    // 🚨 에러 분석
    const errorQueries =
      recentQueries?.filter((q) => q.intent?.includes('error:')) || [];
    const errorRate =
      totalRequests > 0 ? (errorQueries.length / totalRequests) * 100 : 0;
    const successRate = 100 - errorRate;

    // 에러 타입별 분포
    const errorDistribution = {
      timeout: 0,
      network: 0,
      api: 0,
      memory: 0,
      validation: 0,
      unknown: 0,
    };

    errorQueries.forEach((error) => {
      const errorType = error.intent?.split(
        ':'
      )[1] as keyof typeof errorDistribution;
      if (errorType && errorType in errorDistribution) {
        errorDistribution[errorType]++;
      } else {
        errorDistribution.unknown++;
      }
    });

    // 📈 Google AI API 사용량 추정 (google-ai 모드 쿼리 카운트)
    const googleAIQueries =
      recentQueries?.filter(
        (q) => q.intent?.includes('google-ai') || q.response_time > 1000
      ) || [];
    const dailyGoogleAIRequests = googleAIQueries.length;
    const dailyLimit = 1500; // ✅ Google AI 무료 티어 gemini-1.5-flash 한도: 1500회/일 (2025년 최신 정보)

    // 🎯 모니터링 데이터 구성
    const monitoringData: MonitoringData = {
      timestamp: new Date().toISOString(),
      system: {
        uptime: process.uptime() * 1000, // milliseconds
        version: process.env.npm_package_version || '5.77.0',
        environment: process.env.NODE_ENV || 'development',
      },
      performance: {
        totalRequests,
        avgResponseTime: Math.round(avgResponseTime * 100) / 100,
        successRate: Math.round(successRate * 100) / 100,
        errorRate: Math.round(errorRate * 100) / 100,
      },
      cache: {
        hitRate: cacheStats.hitRate,
        hitRateImprovement: cacheStats.hitRateImprovement,
        totalEntries: cacheStats.totalEntries,
        memoryUsage: cacheStats.memoryUsage,
      },
      errors: {
        recentErrors: Object.entries(errorDistribution)
          .filter(([_, count]) => count > 0)
          .map(([type, count]) => ({
            type,
            count,
            lastOccurred:
              errorQueries.find((e) => e.intent?.includes(type))?.created_at ||
              'N/A',
          })),
        errorDistribution,
      },
      engines: {
        local: {
          status: 'active',
          requestCount: totalRequests - dailyGoogleAIRequests,
          avgResponseTime: avgResponseTime < 500 ? avgResponseTime : 500,
        },
        googleAI: {
          status: dailyGoogleAIRequests > 0 ? 'active' : 'inactive',
          requestCount: dailyGoogleAIRequests,
          avgResponseTime: avgResponseTime > 500 ? avgResponseTime : 800,
          apiUsage: {
            dailyRequests: dailyGoogleAIRequests,
            dailyLimit,
            utilizationRate: Math.round(
              (dailyGoogleAIRequests / dailyLimit) * 100
            ),
          },
        },
      },
    };

    const responseTime = Date.now() - startTime;

    // 📊 성능 헤더 추가
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store', // 실시간 데이터
      'X-Response-Time': responseTime.toString(),
      'X-Data-Freshness': twentyFourHoursAgo,
      'X-Monitoring-Version': '1.0',
    });

    return NextResponse.json(
      {
        success: true,
        data: monitoringData,
        meta: {
          responseTime,
          dataRange: '24h',
          lastUpdated: new Date().toISOString(),
        },
      },
      { headers }
    );
  } catch (error) {
    debug.error('❌ AI 모니터링 데이터 수집 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to collect monitoring data',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'X-Error-Type': 'monitoring-failure',
        },
      }
    );
  }
}

// 🔐 인증된 사용자만 접근 가능
export const GET = withAuth(getHandler);
