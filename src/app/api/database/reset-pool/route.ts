import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createApiRoute } from '@/lib/api/zod-middleware';
import {
  DatabasePoolResetRequestSchema,
  DatabasePoolResetResponseSchema,
  DatabasePoolStatusResponseSchema,

  type DatabasePoolResetResponse,
  type DatabasePoolStatusResponse,
  type DatabasePoolConfig,
} from '@/schemas/api.schema';
import { getErrorMessage } from '@/types/type-utils';
import debug from '@/utils/debug';

// 연결 풀 재설정 시뮬레이션
async function resetConnectionPool(config?: DatabasePoolConfig) {
  debug.log('🔄 Resetting database connection pool...');

  // 시뮬레이션 지연
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    action: 'reset_pool' as const,
    timestamp: new Date().toISOString(),
    previousPool: {
      total: 20,
      active: 15,
      idle: 3,
      waiting: 2,
    },
    newPool: {
      total: 20,
      active: 0,
      idle: 20,
      waiting: 0,
    },
    config: {
      maxConnections: config?.maxConnections || 20,
      minConnections: config?.minConnections || 5,
      acquireTimeout: config?.acquireTimeout || 30000,
      idleTimeout: config?.idleTimeout || 300000,
    },
    result: 'success' as const,
  };
}

// POST 핸들러
const postHandler = createApiRoute()
  .body(DatabasePoolResetRequestSchema)
  .response(DatabasePoolResetResponseSchema)
  .configure({
    showDetailedErrors: process.env.NODE_ENV === 'development',
    enableLogging: true,
  })
  .build(async (_request, context): Promise<DatabasePoolResetResponse> => {
    const { force, config } = context.body;

    debug.log('🔧 Database connection pool reset requested:', {
      force,
      config,
    });

    // 강제 재설정이 아닌 경우 현재 상태 확인
    if (!force) {
      const activeConnections = 15; // 시뮬레이션
      if (activeConnections > 10) {
        throw new Error(
          'Connection pool is busy. Use force=true to reset anyway or wait for connections to close'
        );
      }
    }

    const poolConfig = {
      maxConnections: config?.maxConnections || 10,
      minConnections: config?.minConnections || 2,
      acquireTimeout: config?.acquireTimeout || 30000,
      idleTimeout: config?.idleTimeout || 300000,
    };
    const result = await resetConnectionPool(poolConfig);

    return {
      success: true,
      message: 'Connection pool reset successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };
  });

export async function POST(request: NextRequest) {
  try {
    return await postHandler(request);
  } catch (error) {
    debug.error('❌ Database reset-pool POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to reset database connection pool',
        details: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}

// GET 핸들러
const getHandler = createApiRoute()
  .response(DatabasePoolStatusResponseSchema)
  .configure({
    showDetailedErrors: process.env.NODE_ENV === 'development',
    enableLogging: true,
  })
  .build(async (): Promise<DatabasePoolStatusResponse> => {
    // 현재 연결 풀 상태 반환
    return {
      success: true,
      data: {
        current: {
          total: 20,
          active: 8,
          idle: 12,
          waiting: 0,
        },
        statistics: {
          totalAcquired: 1250,
          totalReleased: 1242,
          totalCreated: 20,
          totalDestroyed: 0,
          averageAcquireTime: 15,
          maxAcquireTime: 125,
        },
        health: {
          status: 'healthy',
          lastReset: new Date(Date.now() - 3600000).toISOString(), // 1시간 전
          nextScheduledReset: null,
        },
        config: {
          maxConnections: 20,
          minConnections: 5,
          acquireTimeout: 30000,
          idleTimeout: 300000,
        },
      },
      timestamp: new Date().toISOString(),
    };
  });

export async function GET(request: NextRequest) {
  try {
    return await getHandler(request);
  } catch (error) {
    debug.error('❌ Database reset-pool GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get connection pool status',
      },
      { status: 500 }
    );
  }
}
