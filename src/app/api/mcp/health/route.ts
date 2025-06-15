import { NextRequest, NextResponse } from 'next/server';
import { MCPWarmupService } from '@/services/mcp/mcp-warmup-service';

/**
 * 🤖 MCP 서버 헬스체크 API
 * 
 * 기능:
 * - MCP 서버 연결 상태 확인
 * - 워밍업 상태 조회
 * - 주기적 핑 테스트
 */

export async function GET(request: NextRequest) {
  const start = Date.now();
  
  try {
    const mcpWarmupService = MCPWarmupService.getInstance();
    
    // 워밍업 상태 조회
    const warmupStatus = mcpWarmupService.getWarmupStatus();
    
    // 간단한 핑 테스트 (워밍업보다 가벼움)
    const pingResults = await Promise.allSettled([
      fetch('https://openmanager-render-ai.onrender.com/health', { 
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      }),
      fetch('https://openmanager-docs-server.onrender.com/ping', { 
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      }),
      fetch('https://openmanager-filesystem-mcp.onrender.com/status', { 
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      })
    ]);

    const healthResults = pingResults.map((result, index) => {
      const serverName = ['openmanager-render-ai', 'openmanager-docs-server', 'openmanager-filesystem-mcp'][index];
      
      if (result.status === 'fulfilled') {
        return {
          server: serverName,
          status: result.value.ok ? 'healthy' : 'unhealthy',
          responseCode: result.value.status
        };
      } else {
        return {
          server: serverName,
          status: 'unreachable',
          error: result.reason?.message || 'Connection failed'
        };
      }
    });

    const responseTime = Date.now() - start;
    const healthyCount = healthResults.filter(r => r.status === 'healthy').length;
    
    return NextResponse.json({
      status: healthyCount > 0 ? 'operational' : 'degraded',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      servers: healthResults,
      warmupStatus: warmupStatus,
      summary: {
        healthy: healthyCount,
        total: healthResults.length,
        percentage: Math.round((healthyCount / healthResults.length) * 100)
      }
    });
    
  } catch (error: any) {
    const responseTime = Date.now() - start;
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      error: error.message,
      servers: [],
      warmupStatus: []
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    const mcpWarmupService = MCPWarmupService.getInstance();
    
    if (action === 'warmup') {
      // 즉시 워밍업 실행
      const results = await mcpWarmupService.warmupAllServers();
      
      return NextResponse.json({
        success: true,
        action: 'warmup',
        timestamp: new Date().toISOString(),
        results: results
      });
      
    } else if (action === 'start-periodic') {
      // 주기적 워밍업 시작 (1분 간격)
      mcpWarmupService.startPeriodicWarmup(1);
      
      return NextResponse.json({
        success: true,
        action: 'start-periodic',
        interval: '1 minute',
        timestamp: new Date().toISOString()
      });
      
    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid action. Use "warmup" or "start-periodic"'
      }, { status: 400 });
    }
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 