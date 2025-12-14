/**
 * LangGraph Checkpointer with Supabase PostgreSQL
 * 대화 상태 영속화 (Cloud Run Standalone)
 */

import { MemorySaver } from '@langchain/langgraph';
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';
import { Pool } from 'pg';

// ============================================================================
// 1. Database Connection
// ============================================================================

let pool: Pool | null = null;
let checkpointer: PostgresSaver | null = null;
let memoryCheckpointer: MemorySaver | null = null;

function createPool(): Pool {
  const connectionString = process.env.SUPABASE_DIRECT_URL;

  if (!connectionString) {
    throw new Error('SUPABASE_DIRECT_URL is not configured');
  }

  return new Pool({
    connectionString,
    max: 2, // Cloud Run 서버리스 환경 최적화 (max-instances 3 × 2 = 6 connections)
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
}

// ============================================================================
// 2. Checkpointer Factory
// ============================================================================

export async function getCheckpointer(): Promise<PostgresSaver> {
  if (checkpointer) {
    return checkpointer;
  }

  try {
    pool = createPool();

    checkpointer = PostgresSaver.fromConnString(
      process.env.SUPABASE_DIRECT_URL!
    );

    await checkpointer.setup();

    console.log('✅ LangGraph Checkpointer initialized with Supabase');
    return checkpointer;
  } catch (error) {
    console.error('❌ Failed to initialize Checkpointer:', error);
    throw error;
  }
}

// ============================================================================
// 3. Session Management
// ============================================================================

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

export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

// ============================================================================
// 4. Cleanup
// ============================================================================

export async function closeCheckpointer(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
  checkpointer = null;
  console.log('🔌 Checkpointer connection closed');
}

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

export function getMemoryCheckpointer(): MemorySaver {
  if (!memoryCheckpointer) {
    memoryCheckpointer = new MemorySaver();
  }
  return memoryCheckpointer;
}

export async function getAutoCheckpointer(): Promise<
  PostgresSaver | MemorySaver
> {
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.SUPABASE_DIRECT_URL
  ) {
    return getCheckpointer();
  }

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

  console.log('📝 Using MemorySaver for development');
  return getMemoryCheckpointer();
}
