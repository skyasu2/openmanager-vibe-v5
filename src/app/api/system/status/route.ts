import { NextRequest, NextResponse } from 'next/server';

/**
 * 시스템 상태 확인 API
 * GET /api/system/status
 */
export async function GET(request: NextRequest) {
  try {
    const timestamp = new Date().toISOString();

    // 기본 시스템 상태
    const systemStatus = {
      status: 'running',
      timestamp,
      health: 'healthy',
      uptime: Math.floor(process.uptime()),
      memoryUsage: {
        used:
          Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) /
          100,
        total:
          Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) /
          100,
      },
      processes: {
        'system-logger': { status: 'running', pid: process.pid },
        'server-generator': { status: 'running', pid: process.pid },
        'ai-engine': { status: 'running', pid: process.pid },
        'simulation-engine': { status: 'running', pid: process.pid },
        'data-collector': { status: 'running', pid: process.pid },
      },
      version: '5.44.3',
      environment: process.env.NODE_ENV || 'development',
    };

    return NextResponse.json(systemStatus);
  } catch (error) {
    console.error('System Status Error:', error);

    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Failed to get system status',
        health: 'unhealthy',
      },
      { status: 500 }
    );
  }
}
