/**
 * System Health Check API
 * 
 * 🏥 시스템 전체 상태 진단 및 자동 복구
 * GET: 현재 시스템 상태 조회
 * POST: 자동 복구 실행
 */

import { NextRequest, NextResponse } from 'next/server';

// GET: 시스템 헬스체크 실행
export async function GET() {
  try {
    const { systemHealthChecker } = await import('@/services/SystemHealthChecker');
    
    const healthResult = await systemHealthChecker.performHealthCheck();
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      health: healthResult,
      summary: {
        status: healthResult.isHealthy ? 'healthy' : 'issues',
        serverCount: healthResult.serverCount,
        dataSource: healthResult.dataSource,
        issueCount: healthResult.issues.length
      }
    });
    
  } catch (error) {
    console.error('Health check API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// POST: 자동 복구 실행
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      maxRetries = 3,
      retryDelayMs = 2000,
      forceInit = true,
      generateFallback = true
    } = body;
    
    const { systemHealthChecker } = await import('@/services/SystemHealthChecker');
    
    console.log('🔧 Starting auto recovery via API...');
    const recoveryResult = await systemHealthChecker.performAutoRecovery({
      maxRetries,
      retryDelayMs,
      forceInit,
      generateFallback
    });
    
    return NextResponse.json({
      success: recoveryResult.isHealthy,
      timestamp: new Date().toISOString(),
      recovery: recoveryResult,
      summary: {
        finalStatus: recoveryResult.isHealthy ? 'recovered' : 'failed',
        serverCount: recoveryResult.serverCount,
        dataSource: recoveryResult.dataSource,
        remainingIssues: recoveryResult.issues.length
      },
      recommendations: recoveryResult.isHealthy ? 
        ['System recovered successfully', 'Monitor system stability'] :
        ['Manual intervention required', 'Check system logs', 'Contact administrator']
    });
    
  } catch (error) {
    console.error('Auto recovery API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      recommendations: ['Check API logs', 'Verify system dependencies', 'Try manual recovery']
    }, { status: 500 });
  }
} 