/**
 * 🔑 Smart Fallback Engine 관리자 API
 * POST /api/ai/smart-fallback/admin (할당량 리셋, 설정 변경)
 * GET /api/ai/smart-fallback/admin (관리자 대시보드 데이터)
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
 * 🛠️ 관리자 작업 처리
 */
export async function POST(request: NextRequest) {
  try {
    // 관리자 인증
    if (!checkAdminAuth(request)) {
      return NextResponse.json(
        { success: false, error: '관리자 권한이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
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
  } catch (error) {
    console.error('❌ 관리자 API 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '관리자 작업 실패',
      },
      { status: 500 }
    );
  }
}

/**
 * 📊 관리자 대시보드 데이터
 */
export async function GET(request: NextRequest) {
  try {
    // 관리자 인증
    if (!checkAdminAuth(request)) {
      return NextResponse.json(
        { success: false, error: '관리자 권한이 필요합니다.' },
        { status: 401 }
      );
    }

    const smartEngine = SmartFallbackEngine.getInstance();
    const status = smartEngine.getSystemStatus();
    const recentLogs = smartEngine.getFailureLogs(50);

    // 통계 계산
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

    // 시간대별 사용량 분석
    const hourlyUsage = Array.from({ length: 24 }, (_, hour) => {
      const hourLogs = todayLogs.filter(log => {
        const logHour = new Date(log.timestamp).getHours();
        return logHour === hour;
      });

      return {
        hour,
        failures: hourLogs.length,
        mcpFailures: hourLogs.filter(log => log.stage === 'mcp').length,
        ragFailures: hourLogs.filter(log => log.stage === 'rag').length,
        googleAIFailures: hourLogs.filter(log => log.stage === 'google_ai')
          .length,
      };
    });

    return NextResponse.json({
      success: true,
      adminData: {
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
          hourlyUsage,
        },
        recentFailures: recentLogs.slice(0, 20).map(log => ({
          timestamp: log.timestamp,
          stage: log.stage,
          query: log.query.slice(0, 80) + (log.query.length > 80 ? '...' : ''),
          error: log.error,
          responseTime: log.responseTime,
        })),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ 관리자 대시보드 데이터 조회 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : '대시보드 데이터 조회 실패',
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
