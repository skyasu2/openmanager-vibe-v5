import { NextResponse } from 'next/server';
import { keepAliveScheduler } from '@/lib/keep-alive-scheduler';

export async function GET() {
  try {
    const status = keepAliveScheduler.getStatus();
    const dangerStatus = keepAliveScheduler.getDangerStatus();
    
    return NextResponse.json({
      success: true,
      data: {
        status,
        danger: dangerStatus,
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Keep-alive status error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get keep-alive status',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, service } = body;

    if (!action) {
      return NextResponse.json({
        success: false,
        error: 'Missing required field: action'
      }, { status: 400 });
    }

    switch (action) {
      case 'ping':
        if (!service || !['supabase', 'redis'].includes(service)) {
          return NextResponse.json({
            success: false,
            error: 'Invalid service for ping. Must be "supabase" or "redis"'
          }, { status: 400 });
        }
        
        const pingSuccess = await keepAliveScheduler.manualPing(service);
        
        return NextResponse.json({
          success: pingSuccess,
          message: pingSuccess 
            ? `${service} ping successful` 
            : `${service} ping failed`,
          data: keepAliveScheduler.getStatus()
        });

      case 'start':
        keepAliveScheduler.restartKeepAlive(service);
        return NextResponse.json({
          success: true,
          message: `Keep-alive started for ${service || 'all services'}`,
          data: keepAliveScheduler.getStatus()
        });

      case 'stop':
        keepAliveScheduler.stopKeepAlive(service);
        return NextResponse.json({
          success: true,
          message: `Keep-alive stopped for ${service || 'all services'}`,
          data: keepAliveScheduler.getStatus()
        });

      case 'status':
        const status = keepAliveScheduler.getStatus();
        const dangerStatus = keepAliveScheduler.getDangerStatus();
        
        return NextResponse.json({
          success: true,
          data: {
            status,
            danger: dangerStatus,
          }
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Must be "ping", "start", "stop", or "status"'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Keep-alive control error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to control keep-alive',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}