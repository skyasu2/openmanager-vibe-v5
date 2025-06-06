/**
 * 📊 MCP 기반 시스템 상태 모니터링 API
 * 
 * ✅ 통합 AI 시스템 헬스체크
 * ✅ Keep-Alive 시스템 상태
 * ✅ 3단계 컨텍스트 시스템 모니터링
 * ✅ FastAPI 연결 상태
 */

import { NextRequest, NextResponse } from 'next/server';
import { unifiedAISystem } from '../../../../core/ai/unified-ai-system';
import { keepAliveSystem } from '../../../../services/ai/keep-alive-system';

const fastApiClient = {
  async getConnectionStatus() {
    return { isConnected: false, healthStatus: 'removed', lastHealthCheck: Date.now() };
  },
  async checkHealth() {
    return { isConnected: false, healthStatus: 'removed', lastHealthCheck: Date.now() };
  },
  async warmup() {
    return false;
  }
};

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const section = url.searchParams.get('section') || 'overview';

    switch (section) {
      case 'overview':
        // 전체 시스템 개요
        const systemHealth = await unifiedAISystem.getSystemHealth();
        
        return NextResponse.json({
          success: true,
          data: {
            overview: {
              overall: systemHealth.overall,
              totalComponents: Object.keys(systemHealth.components).length,
              healthyComponents: [
                systemHealth.components.fastapi,
                systemHealth.components.mcp,
                systemHealth.components.keepAlive
              ].filter(comp => comp.status === 'healthy').length
            },
            version: '5.17.10-MCP',
            architecture: 'MCP + FastAPI Hybrid',
            components: {
              totalComponents: Object.keys(systemHealth.components).length,
              healthyComponents: [
                systemHealth.components.fastapi,
                systemHealth.components.mcp,
                systemHealth.components.keepAlive
              ].filter(comp => comp.status === 'healthy').length
            },
            performance: {
              totalQueries: systemHealth.stats.totalQueries,
              avgResponseTime: Math.round(systemHealth.stats.avgResponseTime),
              successRate: Math.round(systemHealth.stats.successRate * 100),
              cacheHitRate: Math.round(systemHealth.stats.cacheHitRate * 100)
            },
            lastUpdate: Date.now()
          },
          timestamp: Date.now()
        });

      case 'components':
        // 개별 컴포넌트 상세 상태
        const [
          systemHealthDetail,
          keepAliveStatus,
          fastApiStatus
        ] = await Promise.allSettled([
          unifiedAISystem.getSystemHealth(),
          keepAliveSystem.getStatus(),
          fastApiClient.getConnectionStatus()
        ]);

        return NextResponse.json({
          success: true,
          data: {
            unifiedAI: {
              status: systemHealthDetail.status === 'fulfilled' 
                ? systemHealthDetail.value.overall 
                : 'error',
              components: systemHealthDetail.status === 'fulfilled'
                ? systemHealthDetail.value.components
                : {},
              uptime: systemHealthDetail.status === 'fulfilled'
                ? systemHealthDetail.value.stats.totalQueries
                : 0
            },
            keepAlive: {
              status: keepAliveStatus.status === 'fulfilled' && keepAliveStatus.value.isActive
                ? 'healthy' 
                : 'inactive',
              details: keepAliveStatus.status === 'fulfilled'
                ? {
                    totalPings: keepAliveStatus.value.totalPings,
                    consecutiveSuccesses: keepAliveStatus.value.consecutiveSuccesses,
                    uptime: Math.round(keepAliveStatus.value.uptimeHours * 100) / 100,
                    lastPing: keepAliveStatus.value.lastPing,
                    averageResponseTime: Math.round(keepAliveStatus.value.averageResponseTime)
                  }
                : null
            },
            fastAPI: {
              status: fastApiStatus.status === 'fulfilled' && fastApiStatus.value.isConnected
                ? 'connected'
                : 'disconnected',
              details: fastApiStatus.status === 'fulfilled'
                ? {
                    lastHealthCheck: fastApiStatus.value.lastHealthCheck,
                    healthStatus: fastApiStatus.value.healthStatus
                  }
                : null
            }
          },
          timestamp: Date.now()
        });

      case 'performance':
        // 성능 메트릭
        const perfData = await unifiedAISystem.getSystemHealth();
        
        return NextResponse.json({
          success: true,
          data: {
            queries: {
              total: perfData.stats.totalQueries,
              successRate: Math.round(perfData.stats.successRate * 100),
              avgResponseTime: Math.round(perfData.stats.avgResponseTime),
              cacheHitRate: Math.round(perfData.stats.cacheHitRate * 100)
            },
            system: {
              overview: {
                overall: perfData.overall,
                totalComponents: Object.keys(perfData.components).length,
                healthyComponents: [
                  perfData.components.fastapi,
                  perfData.components.mcp,
                  perfData.components.keepAlive
                ].filter(comp => comp.status === 'healthy').length
              },
              componentsHealthy: [
                perfData.components.fastapi,
                perfData.components.mcp,
                perfData.components.keepAlive
              ].filter(comp => comp.status === 'healthy').length,
              totalComponents: Object.keys(perfData.components).length
            },
            contexts: {
              basic: {
                status: perfData.components.contexts.basic.status,
                lastUpdate: perfData.components.contexts.basic.lastUpdate
              },
              advanced: {
                status: perfData.components.contexts.advanced.status,
                documentsCount: perfData.components.contexts.advanced.documentsCount
              },
              custom: {
                status: perfData.components.contexts.custom.status,
                rulesCount: perfData.components.contexts.custom.rulesCount
              }
            }
          },
          timestamp: Date.now()
        });

      case 'diagnostic':
        // 진단 정보
        const keepAliveData = await keepAliveSystem.getStatus();
        const fastApiData = await fastApiClient.getConnectionStatus();
        
        const diagnostics = {
          mcp: {
            status: 'enabled',
            issues: [] as string[],
            recommendations: [] as string[]
          },
          fastapi: {
            status: fastApiData.isConnected ? 'connected' : 'disconnected',
            issues: [] as string[],
            recommendations: [] as string[]
          },
          keepAlive: {
            status: keepAliveData.isActive ? 'active' : 'inactive',
            issues: [] as string[],
            recommendations: [] as string[]
          }
        };

        // FastAPI 진단
        if (!fastApiData.isConnected) {
          diagnostics.fastapi.issues.push('AI 엔진 연결 실패');
          diagnostics.fastapi.recommendations.push('FastAPI 서버 상태를 확인하세요');
        }

        // Keep-Alive 진단
        if (!keepAliveData.isActive) {
          diagnostics.keepAlive.issues.push('Keep-Alive 시스템 비활성화');
          diagnostics.keepAlive.recommendations.push('Keep-Alive 시스템을 시작하세요');
        } else if (keepAliveData.consecutiveFailures > 3) {
          diagnostics.keepAlive.issues.push('연속 핑 실패 감지');
          diagnostics.keepAlive.recommendations.push('네트워크 연결을 확인하세요');
        }

        return NextResponse.json({
          success: true,
          data: diagnostics,
          timestamp: Date.now()
        });

      case 'actions':
        // 사용 가능한 액션 목록
        return NextResponse.json({
          success: true,
          data: {
            available: [
              {
                name: 'restart_system',
                description: '통합 AI 시스템 재시작',
                endpoint: 'PUT /api/ai/unified',
                payload: { action: 'restart' }
              },
              {
                name: 'trigger_keepalive',
                description: 'Keep-Alive 수동 트리거',
                endpoint: 'POST /api/system/mcp-status?action=ping',
                payload: {}
              },
              {
                name: 'clear_cache',
                description: '시스템 캐시 정리',
                endpoint: 'DELETE /api/ai/unified?target=cache',
                payload: {}
              },
              {
                name: 'health_check',
                description: 'FastAPI 헬스체크',
                endpoint: 'POST /api/system/mcp-status?action=health',
                payload: {}
              }
            ]
          },
          timestamp: Date.now()
        });

      default:
        return NextResponse.json({
          error: '알 수 없는 섹션',
          code: 'UNKNOWN_SECTION',
          available: ['overview', 'components', 'performance', 'diagnostic', 'actions'],
          timestamp: Date.now()
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ [API] MCP 상태 조회 실패:', error);
    
    return NextResponse.json({
      error: 'MCP 상태 조회 실패',
      code: 'MCP_STATUS_FAILED',
      details: error instanceof Error ? error.message : String(error),
      timestamp: Date.now()
    }, { status: 500 });
  }
}

/**
 * 🔧 시스템 액션 실행
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'ping':
        // Keep-Alive 수동 트리거
        const pingResult = await keepAliveSystem.triggerManualPing();
        
        return NextResponse.json({
          success: true,
          data: {
            triggered: true,
            result: pingResult ? 'success' : 'failed',
            timestamp: Date.now()
          },
          message: pingResult ? 'Keep-Alive 핑 성공' : 'Keep-Alive 핑 실패',
          timestamp: Date.now()
        });

      case 'health':
        // FastAPI 헬스체크 강제 실행
        const health = await fastApiClient.checkHealth();
        
        return NextResponse.json({
          success: true,
          data: health,
          message: 'FastAPI 헬스체크 완료',
          timestamp: Date.now()
        });

      case 'warmup':
        // FastAPI 웜업 실행
        const warmupResult = await fastApiClient.warmup();
        
        return NextResponse.json({
          success: true,
          data: {
            triggered: true,
            result: warmupResult ? 'success' : 'failed'
          },
          message: warmupResult ? 'AI 엔진 웜업 성공' : 'AI 엔진 웜업 실패',
          timestamp: Date.now()
        });

      case 'reset_stats':
        // Keep-Alive 통계 리셋
        keepAliveSystem.resetStatistics();
        
        return NextResponse.json({
          success: true,
          data: { reset: true },
          message: 'Keep-Alive 통계가 리셋되었습니다',
          timestamp: Date.now()
        });

      default:
        return NextResponse.json({
          error: '알 수 없는 액션',
          code: 'UNKNOWN_ACTION',
          available: ['ping', 'health', 'warmup', 'reset_stats'],
          timestamp: Date.now()
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ [API] MCP 액션 실행 실패:', error);
    
    return NextResponse.json({
      error: 'MCP 액션 실행 실패',
      code: 'MCP_ACTION_FAILED',
      details: error instanceof Error ? error.message : String(error),
      timestamp: Date.now()
    }, { status: 500 });
  }
} 