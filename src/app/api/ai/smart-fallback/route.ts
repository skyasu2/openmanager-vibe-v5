/**
 * 🧠 Smart Fallback Engine API
 * POST /api/ai/smart-fallback
 * GET /api/ai/smart-fallback (상태 조회)
 */

import { NextRequest, NextResponse } from 'next/server';
import SmartFallbackEngine from '@/services/ai/SmartFallbackEngine';

/**
 * 🔑 관리자 인증 체크
 */
function checkAdminAuth(request: NextRequest): boolean {
  const adminKey =
    request.headers.get('X-Admin-Key') ||
    request.headers.get('Authorization')?.replace('Bearer ', '');

  return adminKey === process.env.ADMIN_SECRET_KEY;
}

/**
 * 🎯 스마트 AI 쿼리 처리 + 관리자 작업
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();

    // 관리자 작업 처리 (action 필드가 있으면 관리자 요청)
    if (body.action) {
      // 관리자 인증
      if (!checkAdminAuth(request)) {
        return NextResponse.json(
          { success: false, error: '관리자 권한이 필요합니다.' },
          { status: 401 }
        );
      }

      const { action, adminKey } = body;
      const smartEngine = SmartFallbackEngine.getInstance();

      switch (action) {
        case 'reset_quota':
          console.log('🔑 관리자 요청: 할당량 리셋');
          const resetResult = await smartEngine.resetDailyQuota(adminKey);

          if (resetResult) {
            return NextResponse.json({
              success: true,
              message: '일일 할당량이 성공적으로 리셋되었습니다.',
              timestamp: new Date().toISOString(),
            });
          } else {
            return NextResponse.json(
              { success: false, error: '할당량 리셋 실패' },
              { status: 403 }
            );
          }

        case 'get_detailed_logs':
          const logs = smartEngine.getFailureLogs(100);
          return NextResponse.json({
            success: true,
            logs,
            count: logs.length,
            timestamp: new Date().toISOString(),
          });

        case 'force_test':
          // 각 엔진 강제 테스트
          const testQuery = body.testQuery || '시스템 상태를 확인해주세요';
          const testResults = {
            mcp: await testEngine('mcp', testQuery),
            rag: await testEngine('rag', testQuery),
            googleAI: await testEngine('google_ai', testQuery),
          };

          return NextResponse.json({
            success: true,
            testResults,
            timestamp: new Date().toISOString(),
          });

        default:
          return NextResponse.json(
            { success: false, error: '알 수 없는 작업입니다.' },
            { status: 400 }
          );
      }
    }

    // 일반 AI 쿼리 처리
    const { query, context, options } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { success: false, error: '쿼리가 필요합니다.' },
        { status: 400 }
      );
    }

    console.log('🧠 Smart Fallback 쿼리 처리:', query.slice(0, 50));

    const smartEngine = SmartFallbackEngine.getInstance();
    const result = await smartEngine.processQuery(query, context, options);

    return NextResponse.json({
      success: result.success,
      response: result.response,
      metadata: {
        stage: result.stage,
        confidence: result.confidence,
        responseTime: result.responseTime,
        fallbackPath: result.fallbackPath,
        quota: result.quota,
        processedAt: new Date().toISOString(),
        totalTime: Date.now() - startTime,
      },
    });
  } catch (error) {
    console.error('❌ Smart Fallback API 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
        metadata: {
          stage: 'error',
          confidence: 0,
          responseTime: Date.now() - startTime,
          fallbackPath: ['API 오류'],
          quota: {
            googleAIUsed: 0,
            googleAIRemaining: 300,
            isNearLimit: false,
          },
        },
      },
      { status: 500 }
    );
  }
}

/**
 * 📊 Smart Fallback 상태 조회 + 관리자 대시보드
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const include = url.searchParams.get('include');
    const isAdmin = checkAdminAuth(request);

    const smartEngine = SmartFallbackEngine.getInstance();
    const status = smartEngine.getSystemStatus();

    let response: any = {
      success: true,
      status: status.initialized ? 'initialized' : 'not_initialized',
      engines: status.engines,
      quota: status.quota,
      dailyStats: status.dailyStats,
      timestamp: new Date().toISOString(),
    };

    // 관리자 전용 상세 데이터
    if (isAdmin && include === 'admin') {
      const recentLogs = smartEngine.getFailureLogs(50);
      const today = new Date().toISOString().split('T')[0];
      const todayLogs = recentLogs.filter(
        log => log.timestamp.toISOString().split('T')[0] === today
      );

      const engineStats = {
        mcp: {
          available: status.engines.mcp.available,
          successRate: Math.round(status.engines.mcp.successRate * 100),
          todayFailures: todayLogs.filter(log => log.stage === 'mcp').length,
        },
        rag: {
          available: status.engines.rag.available,
          successRate: Math.round(status.engines.rag.successRate * 100),
          todayFailures: todayLogs.filter(log => log.stage === 'rag').length,
        },
        googleAI: {
          available: status.engines.googleAI.available,
          successRate: Math.round(status.engines.googleAI.successRate * 100),
          todayFailures: todayLogs.filter(log => log.stage === 'google_ai')
            .length,
          quotaUsed: status.quota.googleAIUsed,
          quotaRemaining: status.quota.googleAIRemaining,
          quotaPercentage: Math.round((status.quota.googleAIUsed / 300) * 100),
        },
      };

      response.adminData = {
        systemStatus: status.initialized ? 'healthy' : 'initializing',
        engines: engineStats,
        quota: {
          googleAI: {
            used: status.quota.googleAIUsed,
            limit: 300,
            remaining: status.quota.googleAIRemaining,
            percentage: Math.round((status.quota.googleAIUsed / 300) * 100),
            isNearLimit: status.quota.isNearLimit,
            resetTime: status.dailyStats.lastReset,
          },
        },
        analytics: {
          totalQueries: status.dailyStats.totalQueries,
          todayFailures: todayLogs.length,
          averageResponseTime:
            recentLogs.length > 0
              ? Math.round(
                  recentLogs.reduce((sum, log) => sum + log.responseTime, 0) /
                    recentLogs.length
                )
              : 0,
        },
        recentFailures: recentLogs.slice(0, 20).map(log => ({
          timestamp: log.timestamp,
          stage: log.stage,
          query: log.query.slice(0, 80) + (log.query.length > 80 ? '...' : ''),
          error: log.error,
          responseTime: log.responseTime,
        })),
      };
    }

    // 실패 로그 포함 요청
    if (include === 'failures') {
      const limit = parseInt(url.searchParams.get('limit') || '10');
      response.recentFailures = smartEngine.getFailureLogs(limit);
    }

    // 상세 정보 포함 요청
    if (include === 'detailed') {
      response.recentFailures = status.recentFailures;
      response.performance = {
        engineSuccessRates: {
          mcp: Math.round(status.engines.mcp.successRate * 100) + '%',
          rag: Math.round(status.engines.rag.successRate * 100) + '%',
          googleAI: Math.round(status.engines.googleAI.successRate * 100) + '%',
        },
        quotaUsage: {
          used: status.quota.googleAIUsed,
          remaining: status.quota.googleAIRemaining,
          percentage: Math.round((status.quota.googleAIUsed / 300) * 100) + '%',
          isNearLimit: status.quota.isNearLimit,
        },
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ Smart Fallback 상태 조회 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '상태 조회 실패',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * 🧪 개별 엔진 테스트 함수
 */
async function testEngine(engine: 'mcp' | 'rag' | 'google_ai', query: string) {
  const smartEngine = SmartFallbackEngine.getInstance();
  const startTime = Date.now();

  try {
    const options = {
      enableMCP: engine === 'mcp',
      enableRAG: engine === 'rag',
      enableGoogleAI: engine === 'google_ai',
      timeout: 10000,
      adminOverride: true, // 관리자 테스트이므로 할당량 무시
    };

    const result = await smartEngine.processQuery(query, null, options);

    return {
      success: result.success,
      responseTime: Date.now() - startTime,
      confidence: result.confidence,
      response:
        result.response.slice(0, 200) +
        (result.response.length > 200 ? '...' : ''),
      error: result.success ? null : '응답 생성 실패',
    };
  } catch (error) {
    return {
      success: false,
      responseTime: Date.now() - startTime,
      confidence: 0,
      response: null,
      error: error instanceof Error ? error.message : '테스트 실패',
    };
  }
}
