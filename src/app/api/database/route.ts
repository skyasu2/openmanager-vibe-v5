/**
 * 🗄️ 통합 데이터베이스 API
 *
 * 데이터베이스 상태, 연결 풀, 읽기전용 모드를 통합 관리
 *
 * v5.84.1 변경사항:
 * - /api/database/status, reset-pool, readonly-mode 기능 통합
 * - Query parameter로 뷰 선택 (?view=status|pool|readonly)
 * - POST body.action으로 작업 통합
 *
 * GET /api/database
 *   - (default): 전체 데이터베이스 상태
 *   - ?view=pool: 연결 풀 상태
 *   - ?view=readonly: 읽기전용 모드 상태
 *   - ?detailed=true: 상세 정보 포함
 *
 * POST /api/database
 *   - action: 'health_check' | 'refresh_connections' | 'clear_cache'
 *   - action: 'reset_pool' (with force, config options)
 *   - action: 'set_readonly' (with enabled, reason, duration)
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/auth/api-auth';
import debug from '@/utils/debug';

const DatabaseViewSchema = z.enum(['pool', 'readonly']).optional();

const DatabaseActionSchema = z.object({
  action: z.enum([
    'health_check',
    'refresh_connections',
    'clear_cache',
    'reset_pool',
    'set_readonly',
    'emergency_readonly',
    'restore_readwrite',
  ]),
  force: z.boolean().optional(),
  config: z
    .object({
      maxConnections: z.number().optional(),
      minConnections: z.number().optional(),
      acquireTimeout: z.number().optional(),
      idleTimeout: z.number().optional(),
    })
    .optional(),
  enabled: z.boolean().optional(),
  reason: z.string().optional(),
  duration: z.number().positive().optional(),
});

export const runtime = 'nodejs';

// ============================================================================
// Shared State (for readonly mode)
// 환경변수 기반으로 초기 상태 결정.
// 런타임 변경은 인스턴스 로컬 상태에만 적용됨 (데모/포트폴리오용).
// ============================================================================

/**
 * readOnly 상태를 환경변수에서 읽습니다.
 * Vercel 서버리스에서 인스턴스 간 일관성을 위해 환경변수를 SSOT로 사용.
 * 런타임 오버라이드는 해당 인스턴스 수명 동안만 유효합니다.
 */
let readOnlyOverride: boolean | null = null;
let readOnlyReason = process.env.DB_READONLY_REASON || '';
let readOnlyStartTime: string | null =
  process.env.DB_READONLY_MODE === 'true' ? new Date().toISOString() : null;

function isReadOnlyMode(): boolean {
  if (readOnlyOverride !== null) return readOnlyOverride;
  return process.env.DB_READONLY_MODE === 'true';
}

// ============================================================================
// Database Status Functions
//
// [DEMO MODE] 실제 DB 연결 없이 현실적인 상태값을 반환합니다.
// 프로덕션에서는 Supabase/Redis 클라이언트의 실제 상태를 조회하도록
// 교체해야 합니다. 현재 값은 일반적인 Supabase + Upstash Redis 환경의
// 정상 운영 상태를 시뮬레이션합니다.
// ============================================================================

function getDatabaseStatus() {
  const now = Date.now();
  const uptime = now - (now % (24 * 60 * 60 * 1000));

  // [DEMO] 실제 구현: supabaseAdmin.rpc('pg_stat_activity') 등으로 조회
  return {
    primary: {
      status: 'online' as const,
      host: 'db.supabase.co',
      port: 5432,
      database: 'postgres',
      connectionPool: { total: 20, active: 8, idle: 12, waiting: 0 },
      performance: { avgResponseTime: 35, queryCount: 1250, errorRate: 0.02 },
      replication: { lag: 0, status: 'in_sync' },
      uptime: Math.floor((Date.now() - uptime) / 1000),
    },
    // [DEMO] 실제 구현: redis.info('memory') 등으로 조회
    redis: {
      status: 'online' as const,
      host: process.env.UPSTASH_REDIS_HOST || 'redis-host',
      port: 6379,
      memory: { used: '2.5MB', peak: '4.1MB', total: '1GB' },
      performance: { avgResponseTime: 1.2, commandCount: 5420, hitRate: 0.95 },
      persistence: {
        lastSave: new Date(Date.now() - 300000).toISOString(),
        bgSaveInProgress: false,
      },
    },
    // [DEMO] 실제 구현: SELECT count(*) FROM pg_embedding 등으로 조회
    vector: {
      status: 'online' as const,
      engine: 'pgvector',
      collections: 3,
      totalVectors: 1024,
      indexStatus: 'optimized',
      performance: { avgSearchTime: 15, searchCount: 156, accuracy: 0.92 },
    },
    overall: {
      status: 'healthy' as const,
      score: 94,
      issues: [] as string[],
      lastHealthCheck: new Date().toISOString(),
    },
  };
}

function getPoolStatus() {
  // [DEMO] 실제 구현: pg Pool의 totalCount/idleCount/waitingCount 조회
  return {
    current: { total: 20, active: 8, idle: 12, waiting: 0 },
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
      lastReset: new Date(Date.now() - 3600000).toISOString(),
      nextScheduledReset: null,
    },
    config: {
      maxConnections: 20,
      minConnections: 5,
      acquireTimeout: 30000,
      idleTimeout: 300000,
    },
  };
}

function getReadonlyStatus() {
  const enabled = isReadOnlyMode();
  return {
    mode: enabled ? 'readonly' : 'readwrite',
    enabled,
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
  };
}

// ============================================================================
// Action Functions
// ============================================================================

// [DEMO] 실제 구현: pool.end() → pool.connect() 재생성
async function resetConnectionPool(config?: {
  maxConnections?: number;
  minConnections?: number;
  acquireTimeout?: number;
  idleTimeout?: number;
}) {
  debug.log('🔄 Resetting database connection pool...');
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    action: 'reset_pool' as const,
    timestamp: new Date().toISOString(),
    previousPool: { total: 20, active: 15, idle: 3, waiting: 2 },
    newPool: { total: 20, active: 0, idle: 20, waiting: 0 },
    config: {
      maxConnections: config?.maxConnections ?? 20,
      minConnections: config?.minConnections ?? 5,
      acquireTimeout: config?.acquireTimeout ?? 30000,
      idleTimeout: config?.idleTimeout ?? 300000,
    },
    result: 'success' as const,
  };
}

async function setReadOnlyMode(enabled: boolean, reason?: string) {
  debug.log(
    `🔒 Setting database readonly mode: ${enabled ? 'ON' : 'OFF'}`,
    reason
  );
  await new Promise((resolve) => setTimeout(resolve, 500));

  readOnlyOverride = enabled;
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
  };
}

// ============================================================================
// GET Handler
// ============================================================================

async function getHandler(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const rawView = searchParams.get('view') || undefined;
    const viewParsed = DatabaseViewSchema.safeParse(rawView);
    if (!viewParsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid view parameter. Must be "pool" or "readonly"',
        },
        { status: 400 }
      );
    }
    const view = viewParsed.data;
    const detailed = searchParams.get('detailed') === 'true';

    debug.log('🔍 Database GET requested:', { view, detailed });

    // View-specific responses
    if (view === 'pool') {
      return NextResponse.json({
        success: true,
        data: getPoolStatus(),
        timestamp: new Date().toISOString(),
      });
    }

    if (view === 'readonly') {
      return NextResponse.json({
        success: true,
        data: getReadonlyStatus(),
        timestamp: new Date().toISOString(),
      });
    }

    // Default: full status
    const status = getDatabaseStatus();

    if (!detailed) {
      // Simple status
      return NextResponse.json(
        {
          success: true,
          data: {
            primary: status.primary.status,
            redis: status.redis.status,
            vector: status.vector.status,
            overall: status.overall.status,
            readonly: isReadOnlyMode(),
          },
          timestamp: new Date().toISOString(),
        },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=180, stale-while-revalidate=360',
          },
        }
      );
    }

    // Detailed status
    return NextResponse.json(
      {
        success: true,
        data: {
          ...status,
          pool: getPoolStatus(),
          readonlyMode: getReadonlyStatus(),
        },
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=180, stale-while-revalidate=360',
        },
      }
    );
  } catch (error) {
    debug.error('❌ Database GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get database status' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST Handler
// ============================================================================

async function postHandler(request: NextRequest): Promise<NextResponse> {
  try {
    const rawBody = await request.json();
    const parsed = DatabaseActionSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const body = parsed.data;
    const { action } = body;

    debug.log('🔧 Database POST action:', action);

    switch (action) {
      // Status actions (from /api/database/status)
      case 'health_check': {
        const status = getDatabaseStatus();
        return NextResponse.json({
          success: true,
          action: 'health_check',
          data: status.overall,
          timestamp: new Date().toISOString(),
        });
      }

      case 'refresh_connections':
        return NextResponse.json({
          success: true,
          action: 'refresh_connections',
          message: 'Database connections refreshed successfully',
          timestamp: new Date().toISOString(),
        });

      case 'clear_cache':
        return NextResponse.json({
          success: true,
          action: 'clear_cache',
          message: 'Database cache cleared successfully',
          timestamp: new Date().toISOString(),
        });

      // Pool actions (from /api/database/reset-pool)
      case 'reset_pool': {
        const { force, config } = body;
        if (!force) {
          const activeConnections = 15;
          if (activeConnections > 10) {
            return NextResponse.json(
              {
                success: false,
                error:
                  'Connection pool is busy. Use force=true to reset anyway.',
              },
              { status: 400 }
            );
          }
        }
        const result = await resetConnectionPool(config);
        return NextResponse.json({
          success: true,
          message: 'Connection pool reset successfully',
          data: result,
          timestamp: new Date().toISOString(),
        });
      }

      // Readonly actions (from /api/database/readonly-mode)
      case 'set_readonly': {
        const { enabled, reason, duration } = body;
        if (typeof enabled !== 'boolean') {
          return NextResponse.json(
            {
              success: false,
              error: 'enabled parameter must be boolean',
            },
            { status: 400 }
          );
        }
        const result = await setReadOnlyMode(enabled, reason);

        // Auto-disable after duration
        if (enabled && duration && duration > 0) {
          setTimeout(() => {
            setReadOnlyMode(false, 'Auto-disable after duration').catch(
              (err) => {
                debug.error('❌ Failed to auto-disable readonly mode:', err);
              }
            );
          }, duration);
        }

        return NextResponse.json({
          success: true,
          message: `Database ${enabled ? 'switched to readonly' : 'switched to read-write'} mode`,
          data: result,
          timestamp: new Date().toISOString(),
        });
      }

      case 'emergency_readonly': {
        const emergencyResult = await setReadOnlyMode(
          true,
          'Emergency activation'
        );
        return NextResponse.json({
          success: true,
          action: 'emergency_readonly',
          message: 'Database switched to emergency readonly mode',
          data: emergencyResult,
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
            error: `Unknown action: ${action}`,
            availableActions: [
              'health_check',
              'refresh_connections',
              'clear_cache',
              'reset_pool',
              'set_readonly',
              'emergency_readonly',
              'restore_readwrite',
            ],
          },
          { status: 400 }
        );
    }
  } catch (error) {
    debug.error('❌ Database POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to execute database action' },
      { status: 500 }
    );
  }
}

// Export with authentication
export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);
