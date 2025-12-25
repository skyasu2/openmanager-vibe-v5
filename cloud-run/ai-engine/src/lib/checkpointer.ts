/**
 * LangGraph Checkpointer with Supabase PostgreSQL
 *
 * v2.1: Added retry logic with exponential backoff
 * v2.0: Environment-based pool configuration
 */

import { MemorySaver } from '@langchain/langgraph';
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';
import { Pool } from 'pg';
import { DatabaseConfigError, getErrorMessage } from './errors';

// ============================================================================
// 1. Configuration (Environment-based)
// ============================================================================

const DB_CONFIG = {
  maxConnections: parseInt(process.env.DB_POOL_MAX || '10', 10),
  idleTimeoutMs: parseInt(process.env.DB_IDLE_TIMEOUT_MS || '30000', 10),
  connectionTimeoutMs: parseInt(process.env.DB_CONNECTION_TIMEOUT_MS || '10000', 10),
  retryAttempts: parseInt(process.env.DB_RETRY_ATTEMPTS || '3', 10),
  retryDelayMs: parseInt(process.env.DB_RETRY_DELAY_MS || '1000', 10),
} as const;

// ============================================================================
// 2. Database Connection with Retry
// ============================================================================

let pool: Pool | null = null;
let checkpointer: PostgresSaver | null = null;

function getDirectConnectionUrl(): string | undefined {
  return (
    process.env.SUPABASE_DIRECT_URL || process.env.POSTGRES_URL_NON_POOLING
  );
}

/**
 * Retry wrapper with exponential backoff
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= DB_CONFIG.retryAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const delay = DB_CONFIG.retryDelayMs * Math.pow(2, attempt - 1); // Exponential backoff

      console.warn(
        `⚠️ [${operationName}] Attempt ${attempt}/${DB_CONFIG.retryAttempts} failed: ${lastError.message}`
      );

      if (attempt < DB_CONFIG.retryAttempts) {
        console.log(`   Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error(`${operationName} failed after ${DB_CONFIG.retryAttempts} attempts`);
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
    max: DB_CONFIG.maxConnections,
    idleTimeoutMillis: DB_CONFIG.idleTimeoutMs,
    connectionTimeoutMillis: DB_CONFIG.connectionTimeoutMs,
  });
}

// ============================================================================
// 3. Checkpointer Factory with Retry
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

  return withRetry(async () => {
    pool = createPool();
    checkpointer = PostgresSaver.fromConnString(connectionString);
    await checkpointer.setup();

    console.log('✅ LangGraph Checkpointer initialized with PostgreSQL');
    return checkpointer;
  }, 'PostgresSaver.setup');
}

// ============================================================================
// 3. Session Management
// ============================================================================

// LangGraph config type with optional callbacks
export interface SessionConfig {
  configurable: { thread_id: string; checkpoint_ns?: string };
  callbacks?: unknown[];
}

export function createSessionConfig(
  sessionId: string,
  checkpoint_ns?: string,
  callbacks?: unknown[]
): SessionConfig {
  return {
    configurable: {
      thread_id: sessionId,
      ...(checkpoint_ns && { checkpoint_ns }),
    },
    ...(callbacks && callbacks.length > 0 && { callbacks }),
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

/**
 * Validate if URL is a proper PostgreSQL connection string
 */
function isValidPostgresUrl(url: string): boolean {
  return url.startsWith('postgresql://') || url.startsWith('postgres://');
}

export async function getAutoCheckpointer(): Promise<
  PostgresSaver | MemorySaver
> {
  const directUrl = getDirectConnectionUrl();

  // Cloud Run specific: Use MemorySaver to avoid PostgreSQL connection issues
  // The SUPABASE_DIRECT_URL might be misconfigured or network-blocked
  if (process.env.K_SERVICE) {
    console.log('☁️ Cloud Run detected - using MemorySaver for reliability');
    return getMemoryCheckpointer();
  }

  // Validate URL format before attempting PostgreSQL connection
  if (directUrl && !isValidPostgresUrl(directUrl)) {
    console.warn(
      `⚠️ Invalid PostgreSQL URL format: ${directUrl.substring(0, 30)}...`
    );
    console.log('📝 Using MemorySaver instead');
    return getMemoryCheckpointer();
  }

  if (process.env.NODE_ENV === 'production' && directUrl) {
    try {
      return await getCheckpointer();
    } catch (error) {
      console.warn(
        '⚠️ PostgresSaver failed in production, falling back to MemorySaver:',
        getErrorMessage(error)
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
        getErrorMessage(error)
      );
      return getMemoryCheckpointer();
    }
  }

  console.log('📝 Using MemorySaver for development');
  return getMemoryCheckpointer();
}
