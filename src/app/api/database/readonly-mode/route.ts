/**
 * @deprecated Use /api/database instead
 *
 * 🔒 Database Readonly Mode API - DEPRECATED
 * 이 엔드포인트는 /api/database 로 통합되었습니다.
 *
 * Migration:
 * - GET /api/database/readonly-mode → GET /api/database?view=readonly
 * - POST /api/database/readonly-mode { enabled, reason } → POST /api/database { action: 'set_readonly', enabled, reason }
 * - PUT /api/database/readonly-mode { action: 'emergency_readonly' } → POST /api/database { action: 'emergency_readonly' }
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import debug from '@/utils/debug';

// Log deprecation warning
console.warn(
  '[DEPRECATED] /api/database/readonly-mode is deprecated. Use /api/database instead.'
);

// 읽기 전용 모드 상태 관리
let readOnlyMode = false;
let readOnlyReason = '';
let readOnlyStartTime: string | null = null;

// 읽기 전용 모드 설정/해제
async function setReadOnlyMode(enabled: boolean, reason?: string) {
  debug.log(
    `🔒 Setting database readonly mode: ${enabled ? 'ON' : 'OFF'}`,
    reason
  );

  // 시뮬레이션 지연
  await new Promise((resolve) => setTimeout(resolve, 500));

  readOnlyMode = enabled;

  if (enabled) {
    readOnlyReason = reason || 'Manual activation';
    readOnlyStartTime = new Date().toISOString();
  } else {
    readOnlyReason = '';
    readOnlyStartTime = null;
  }

  return {
    mode: enabled ? 'readonly' : 'readwrite',
    enabled,
    reason: readOnlyReason,
    startTime: readOnlyStartTime,
    timestamp: new Date().toISOString(),
    autoDisableIn: undefined as number | undefined,
  };
}

export function GET(_request: NextRequest) {
  try {
    const status = {
      mode: readOnlyMode ? 'readonly' : 'readwrite',
      enabled: readOnlyMode,
      reason: readOnlyReason,
      startTime: readOnlyStartTime,
      duration: readOnlyStartTime
        ? Date.now() - new Date(readOnlyStartTime).getTime()
        : 0,
      affectedOperations: [
        'INSERT',
        'UPDATE',
        'DELETE',
        'CREATE',
        'DROP',
        'ALTER',
      ],
      allowedOperations: ['SELECT', 'SHOW', 'DESCRIBE', 'EXPLAIN'],
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    debug.error('❌ Database readonly-mode GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get readonly mode status',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { enabled, reason, duration } = await request.json();

    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        {
          success: false,
          error: 'enabled parameter must be boolean',
        },
        { status: 400 }
      );
    }

    debug.log('🔧 Database readonly mode change requested:', {
      enabled,
      reason,
      duration,
    });

    const result = await setReadOnlyMode(enabled, reason);

    // 지정된 시간 후 자동으로 해제하는 경우
    if (enabled && duration && duration > 0) {
      setTimeout(() => {
        void setReadOnlyMode(false, 'Auto-disable after duration')
          .then(() => {
            debug.log('⏰ ReadOnly mode auto-disabled after', duration, 'ms');
          })
          .catch((error) => {
            debug.error('❌ Failed to auto-disable readonly mode:', error);
          });
        return; // Explicit void return for setTimeout callback
      }, duration);

      result.autoDisableIn = duration;
    }

    return NextResponse.json({
      success: true,
      message: `Database ${enabled ? 'switched to readonly' : 'switched to read-write'} mode`,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    debug.error('❌ Database readonly-mode POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to set readonly mode',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { action } = await request.json();

    debug.log('🔧 Database readonly mode action requested:', action);

    switch (action) {
      case 'emergency_readonly': {
        const result = await setReadOnlyMode(true, 'Emergency activation');
        return NextResponse.json({
          success: true,
          action: 'emergency_readonly',
          message: 'Database switched to emergency readonly mode',
          data: result,
          timestamp: new Date().toISOString(),
        });
      }

      case 'maintenance_readonly': {
        const maintenanceResult = await setReadOnlyMode(
          true,
          'Maintenance mode'
        );
        return NextResponse.json({
          success: true,
          action: 'maintenance_readonly',
          message: 'Database switched to maintenance readonly mode',
          data: maintenanceResult,
          timestamp: new Date().toISOString(),
        });
      }

      case 'restore_readwrite': {
        const restoreResult = await setReadOnlyMode(false, 'Manual restore');
        return NextResponse.json({
          success: true,
          action: 'restore_readwrite',
          message: 'Database restored to read-write mode',
          data: restoreResult,
          timestamp: new Date().toISOString(),
        });
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Unknown readonly action: ${action}`,
          },
          { status: 400 }
        );
    }
  } catch (error) {
    debug.error('❌ Database readonly-mode PUT error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to execute readonly mode action',
      },
      { status: 500 }
    );
  }
}
