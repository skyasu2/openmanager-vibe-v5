/**
 * LangGraph Checkpointer with Supabase PostgreSQL
 */

import { MemorySaver } from '@langchain/langgraph';
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';
import { Pool } from 'pg';
import { DatabaseConfigError, getErrorMessage } from './errors';

// ============================================================================
// 1. Database Connection
// ============================================================================

let pool: Pool | null = null;
let checkpointer: PostgresSaver | null = null;

function getDirectConnectionUrl(): string | undefined {
  return (
    process.env.SUPABASE_DIRECT_URL || process.env.POSTGRES_URL_NON_POOLING
  );
}

function createPool(): Pool {
  const connectionString = getDirectConnectionUrl();

  if (!connectionString) {
    throw new DatabaseConfigError(
      'SUPABASE_DIRECT_URL or POSTGRES_URL_NON_POOLING'
    );
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

export async function getCheckpointer(): Promise<PostgresSaver> {
  if (checkpointer) {
    return checkpointer;
  }

  const connectionString = getDirectConnectionUrl();
  if (!connectionString) {
    throw new DatabaseConfigError(
      'SUPABASE_DIRECT_URL or POSTGRES_URL_NON_POOLING'
    );
  }

  try {
    pool = createPool();
    checkpointer = PostgresSaver.fromConnString(connectionString);
    await checkpointer.setup();

    console.log('✅ LangGraph Checkpointer initialized with PostgreSQL');
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

let memoryCheckpointer: MemorySaver | null = null;

export function getMemoryCheckpointer(): MemorySaver {
  if (!memoryCheckpointer) {
    memoryCheckpointer = new MemorySaver();
  }
  return memoryCheckpointer;
}

export async function getAutoCheckpointer(): Promise<
  PostgresSaver | MemorySaver
> {
  const directUrl = getDirectConnectionUrl();

  if (process.env.NODE_ENV === 'production' && directUrl) {
    try {
      return await getCheckpointer();
    } catch (error) {
      console.warn(
        '⚠️ PostgresSaver failed in production, falling back to MemorySaver:',
        error
      );
      return getMemoryCheckpointer();
    }
  }

  if (directUrl) {
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
