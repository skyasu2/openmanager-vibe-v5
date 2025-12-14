/**
 * LangGraph Checkpointer with Supabase PostgreSQL
 * 대화 상태 영속화 (Cloud Run Stateless 지원)
 */
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';
import { Pool } from 'pg';
import { DatabaseConfigError, getErrorMessage } from './errors';

// ============================================================================
// 1. Database Connection
// ============================================================================

let pool: Pool | null = null;
let checkpointer: PostgresSaver | null = null;

/**
 * Supabase PostgreSQL 연결 풀 생성
 * Direct connection (not pooler) for LangGraph compatibility
 */
function createPool(): Pool {
  const connectionString = process.env.SUPABASE_DIRECT_URL;

  if (!connectionString) {
    throw new DatabaseConfigError('SUPABASE_DIRECT_URL');
  }

  return new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
}

// ============================================================================
// 2. Checkpointer Factory
// ============================================================================

/**
 * PostgresSaver 인스턴스 생성 (Singleton)
 *
 * @returns PostgresSaver instance connected to Supabase
 */
export async function getCheckpointer(): Promise<PostgresSaver> {
  if (checkpointer) {
    return checkpointer;
  }

  try {
    pool = createPool();

    // PostgresSaver 생성
    checkpointer = PostgresSaver.fromConnString(
      process.env.SUPABASE_DIRECT_URL!
    );

    // 테이블 자동 생성 (이미 있으면 무시)
    await checkpointer.setup();

    console.log('✅ LangGraph Checkpointer initialized with Supabase');
    return checkpointer;
  } catch (error) {
    console.error(
      '❌ Failed to initialize Checkpointer:',
      getErrorMessage(error)
    );
    throw error;
  }
}

// ============================================================================
// 3. Session Management
// ============================================================================

/**
 * 세션 설정 생성
 * @param sessionId - 사용자 세션 ID
 * @param checkpoint_ns - 체크포인트 네임스페이스 (선택)
 */
export function createSessionConfig(
  sessionId: string,
  checkpoint_ns?: string
): { configurable: { thread_id: string; checkpoint_ns?: string } } {
  return {
    configurable: {
      thread_id: sessionId,
      ...(checkpoint_ns && { checkpoint_ns }),
    },
  };
}

/**
 * 세션 ID 생성 (UUID v4 형식)
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

// ============================================================================
// 4. Cleanup
// ============================================================================

/**
 * 리소스 정리 (서버 종료 시)
 */
export async function closeCheckpointer(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
  checkpointer = null;
  console.log('🔌 Checkpointer connection closed');
}

// Graceful shutdown handler
if (typeof process !== 'undefined') {
  process.on('SIGTERM', async () => {
    await closeCheckpointer();
  });

  process.on('SIGINT', async () => {
    await closeCheckpointer();
  });
}

// ============================================================================
// 5. Memory Checkpointer (Development Fallback)
// ============================================================================

import { MemorySaver } from '@langchain/langgraph';

let memoryCheckpointer: MemorySaver | null = null;

/**
 * 개발 환경용 인메모리 체크포인터
 * Supabase 연결 없이 로컬 테스트 가능
 */
export function getMemoryCheckpointer(): MemorySaver {
  if (!memoryCheckpointer) {
    memoryCheckpointer = new MemorySaver();
  }
  return memoryCheckpointer;
}

/**
 * 환경에 따른 체크포인터 자동 선택
 */
export async function getAutoCheckpointer(): Promise<
  PostgresSaver | MemorySaver
> {
  // Production: PostgresSaver with Supabase
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.SUPABASE_DIRECT_URL
  ) {
    return getCheckpointer();
  }

  // Development with Supabase configured
  if (process.env.SUPABASE_DIRECT_URL) {
    try {
      return await getCheckpointer();
    } catch (error) {
      console.warn(
        '⚠️ PostgresSaver failed, falling back to MemorySaver:',
        error
      );
      return getMemoryCheckpointer();
    }
  }

  // Development fallback
  console.log('📝 Using MemorySaver for development');
  return getMemoryCheckpointer();
}
