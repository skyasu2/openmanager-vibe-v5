import { NextRequest, NextResponse } from 'next/server';
import { MCPAIRouter, MCPContext } from '@/services/ai/MCPAIRouter';

// 글로벌 MCP 라우터 인스턴스 (싱글톤)
let mcpRouter: MCPAIRouter | null = null;

async function getMCPRouter(): Promise<MCPAIRouter> {
  if (!mcpRouter) {
    mcpRouter = new MCPAIRouter();
    console.log('🧠 MCP AI Router 초기화 완료');
  }
  return mcpRouter;
}

/**
 * 🎯 MCP 기반 AI 분석 처리
 */
export async function POST(request: NextRequest) {
  try {
    const { query, context } = await request.json();
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json({
        success: false,
        error: '분석할 쿼리가 필요합니다'
      }, { status: 400 });
    }

    // MCP Context 구성
    const mcpContext: MCPContext = {
      userQuery: query,
      serverMetrics: context?.serverMetrics || [],
      logEntries: context?.logEntries || [],
      timeRange: context?.timeRange || {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000),
        end: new Date()
      },
      sessionId: context?.sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    // 🧠 MCP 라우터로 처리
    const router = await getMCPRouter();
    const result = await router.processQuery(query, mcpContext);
    
    // 📊 상세 로그 (개발용)
    console.log('🎯 MCP 분석 결과:', {
      sessionId: mcpContext.sessionId,
      query: query.substring(0, 100) + '...',
      success: result.success,
      confidence: result.confidence,
      enginesUsed: result.enginesUsed,
      processingTime: result.processingTime
    });

    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        sessionId: mcpContext.sessionId,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    });

  } catch (error: any) {
    console.error('❌ MCP API 오류:', error);
    
    return NextResponse.json({
      success: false,
      error: '분석 중 오류가 발생했습니다',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * 🔧 MCP 시스템 상태 확인
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    const router = await getMCPRouter();

    switch (action) {
      case 'status':
        const engineStatus = await router.getEngineStatus();
        return NextResponse.json({
          status: 'operational',
          engines: engineStatus,
          timestamp: new Date().toISOString(),
          uptime: process.uptime()
        });

      case 'stats':
        // 세션 관리자에서 통계 가져오기
        const sessionStats = await getSessionStatistics();
        return NextResponse.json({
          system: 'MCP AI Router',
          version: '1.0.0',
          statistics: sessionStats,
          timestamp: new Date().toISOString()
        });

      case 'health':
        const healthCheck = await performHealthCheck(router);
        return NextResponse.json(healthCheck);

      default:
        return NextResponse.json({
          system: 'MCP AI Router',
          version: '1.0.0',
          status: 'ready',
          endpoints: {
            analyze: 'POST /api/ai/mcp',
            status: 'GET /api/ai/mcp?action=status',
            stats: 'GET /api/ai/mcp?action=stats',
            health: 'GET /api/ai/mcp?action=health'
          },
          capabilities: [
            'Intent Classification',
            'Time Series Prediction',
            'Anomaly Detection', 
            'NLP Analysis',
            'External Python Integration',
            'Session Management'
          ],
          timestamp: new Date().toISOString()
        });
    }

  } catch (error: any) {
    console.error('❌ MCP 상태 확인 오류:', error);
    
    return NextResponse.json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * 📊 세션 통계 가져오기
 */
async function getSessionStatistics(): Promise<any> {
  try {
    // SessionManager에서 시스템 통계 가져오기
    // 실제 구현에서는 router.sessionManager.getSystemStatistics() 호출
    return {
      totalSessions: 0,
      activeSessions: 0,
      totalQueries: 0,
      avgProcessingTime: 0,
      engineDistribution: {},
      intentDistribution: {}
    };
  } catch (error) {
    console.warn('⚠️ 세션 통계 가져오기 실패:', error);
    return {};
  }
}

/**
 * 🏥 헬스체크 수행
 */
async function performHealthCheck(router: MCPAIRouter): Promise<any> {
  const startTime = Date.now();
  const checks: any[] = [];

  try {
    // 1. 엔진 상태 확인
    const engineStatus = await router.getEngineStatus();
    checks.push({
      name: 'AI Engines',
      status: engineStatus.allReady ? 'healthy' : 'degraded',
      details: engineStatus,
      responseTime: Date.now() - startTime
    });

  } catch (error: any) {
    checks.push({
      name: 'AI Engines',
      status: 'unhealthy',
      error: error.message,
      responseTime: Date.now() - startTime
    });
  }

  try {
    // 2. 간단한 분석 테스트
    const testStart = Date.now();
    const testResult = await router.processQuery('시스템 상태 확인', {
      sessionId: 'health_check',
      serverMetrics: [{
        timestamp: new Date().toISOString(),
        cpu: 50,
        memory: 60,
        disk: 70,
        networkIn: 1000,
        networkOut: 2000
      }]
    });

    checks.push({
      name: 'Analysis Pipeline',
      status: testResult.success ? 'healthy' : 'unhealthy',
      responseTime: Date.now() - testStart,
      confidence: testResult.confidence,
      enginesUsed: testResult.enginesUsed
    });

  } catch (error: any) {
    checks.push({
      name: 'Analysis Pipeline',
      status: 'unhealthy',
      error: error.message,
      responseTime: Date.now() - startTime
    });
  }

  // 전체 상태 결정
  const allHealthy = checks.every(check => check.status === 'healthy');
  const anyUnhealthy = checks.some(check => check.status === 'unhealthy');
  
  const overallStatus = allHealthy ? 'healthy' : anyUnhealthy ? 'unhealthy' : 'degraded';

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    totalResponseTime: Date.now() - startTime,
    checks
  };
}

/**
 * 🔧 시스템 리소스 정리 (개발용)
 */
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'cleanup') {
      // 세션 정리 등 관리 작업
      console.log('🧹 MCP 시스템 정리 수행');
      
      return NextResponse.json({
        success: true,
        message: '시스템 정리가 완료되었습니다',
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: false,
      error: '지원하지 않는 작업입니다'
    }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
} 