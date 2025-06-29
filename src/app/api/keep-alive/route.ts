import { keepAliveScheduler } from '@/lib/keep-alive-scheduler';
import { validateSystemForOperation } from '@/utils/systemStateChecker';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 🛑 시스템 온오프 상태 확인 - "오프일 때는 무동작 원칙"
    const systemValidation =
      await validateSystemForOperation('Keep-alive Check');

    if (!systemValidation.canProceed) {
      return NextResponse.json({
        success: false,
        message: '시스템이 비활성화 상태입니다',
        reason: systemValidation.reason,
        data: {
          status: {
            isActive: false,
            services: {},
            lastPing: null,
          },
          danger: {
            hasIssues: false,
            issues: [],
            summary: '시스템 오프 상태',
          },
        },
        systemState: systemValidation.systemState,
        timestamp: new Date().toISOString(),
      });
    }

    const status = keepAliveScheduler.getStatus();
    const dangerStatus = keepAliveScheduler.getDangerStatus();

    return NextResponse.json({
      success: true,
      data: {
        status,
        danger: dangerStatus,
      },
      systemState: {
        isActive: true,
        reason: systemValidation.reason,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Keep-alive status error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get keep-alive status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // 🛑 시스템 온오프 상태 확인 - "오프일 때는 무동작 원칙"
    const systemValidation =
      await validateSystemForOperation('Keep-alive Control');

    if (!systemValidation.canProceed) {
      return NextResponse.json(
        {
          success: false,
          message: '시스템이 비활성화 상태로 Keep-alive 제어가 불가능합니다',
          reason: systemValidation.reason,
          systemState: systemValidation.systemState,
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { action, service } = body;

    if (!action) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required field: action',
        },
        { status: 400 }
      );
    }

    switch (action) {
      case 'ping':
        if (!service || !['supabase', 'redis'].includes(service)) {
          return NextResponse.json(
            {
              success: false,
              error: 'Invalid service for ping. Must be "supabase" or "redis"',
            },
            { status: 400 }
          );
        }

        const pingSuccess = await keepAliveScheduler.manualPing(service);

        return NextResponse.json({
          success: pingSuccess,
          message: pingSuccess
            ? `${service} ping successful`
            : `${service} ping failed`,
          data: keepAliveScheduler.getStatus(),
          systemState: {
            isActive: true,
            reason: systemValidation.reason,
          },
        });

      case 'start':
        keepAliveScheduler.restartKeepAlive(service);
        return NextResponse.json({
          success: true,
          message: `Keep-alive started for ${service || 'all services'}`,
          data: keepAliveScheduler.getStatus(),
          systemState: {
            isActive: true,
            reason: systemValidation.reason,
          },
        });

      case 'stop':
        keepAliveScheduler.stopKeepAlive(service);
        return NextResponse.json({
          success: true,
          message: `Keep-alive stopped for ${service || 'all services'}`,
          data: keepAliveScheduler.getStatus(),
          systemState: {
            isActive: true,
            reason: systemValidation.reason,
          },
        });

      case 'status':
        const status = keepAliveScheduler.getStatus();
        const dangerStatus = keepAliveScheduler.getDangerStatus();

        return NextResponse.json({
          success: true,
          data: {
            status,
            danger: dangerStatus,
          },
          systemState: {
            isActive: true,
            reason: systemValidation.reason,
          },
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error:
              'Invalid action. Must be "ping", "start", "stop", or "status"',
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Keep-alive control error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to control keep-alive',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
