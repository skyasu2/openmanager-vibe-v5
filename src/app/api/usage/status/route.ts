import { NextResponse } from 'next/server';
import { usageMonitor } from '@/lib/usage-monitor';

export async function GET() {
  try {
    const status = usageMonitor.getUsageStatus();

    return NextResponse.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Usage status error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get usage status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, service } = body;

    if (!action || !service) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: action and service',
        },
        { status: 400 }
      );
    }

    if (!['supabase', 'redis'].includes(service)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid service. Must be "supabase" or "redis"',
        },
        { status: 400 }
      );
    }

    switch (action) {
      case 'enable':
        usageMonitor.forceEnable(service);
        break;
      case 'disable':
        usageMonitor.disable(service);
        break;
      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action. Must be "enable" or "disable"',
          },
          { status: 400 }
        );
    }

    const updatedStatus = usageMonitor.getUsageStatus();

    return NextResponse.json({
      success: true,
      message: `${service} ${action}d successfully`,
      data: updatedStatus,
    });
  } catch (error) {
    console.error('Usage control error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to control usage',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
