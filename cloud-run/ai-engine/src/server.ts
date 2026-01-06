/**
 * Cloud Run AI Engine Server
 *
 * Modular Hono server with route separation.
 * Refactored for maintainability and consistency.
 *
 * @version 2.0.0
 * @updated 2025-12-28
 */

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import type { Context, Next } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

// Configuration
import { logAPIKeyStatus, validateAPIKeys } from './lib/model-config';
import { getConfigStatus, getLangfuseConfig } from './lib/config-parser';
import { isRedisAvailable } from './lib/redis-client';
import { getCurrentState } from './data/precomputed-state';

// Error handling
import { handleUnauthorizedError, jsonSuccess } from './lib/error-handler';

// Observability & Resilience
import { flushLangfuse, shutdownLangfuse, getLangfuseUsageStatus } from './services/observability/langfuse';
import { getAllCircuitStats, resetAllCircuitBreakers } from './services/resilience/circuit-breaker';

// Routes
import {
  supervisorRouter,
  embeddingRouter,
  generateRouter,
  approvalRouter,
  analyticsRouter,
  graphragRouter,
  jobsRouter,
} from './routes';
import { providersRouter } from './routes/providers';

// ============================================================================
// App Initialization
// ============================================================================

const app = new Hono();

// ============================================================================
// Middleware
// ============================================================================

app.use('*', logger());
app.use('*', cors());

// Security Middleware (Skip for health/warmup)
app.use('/api/*', async (c: Context, next: Next) => {
  const apiKey = c.req.header('X-API-Key');
  const validKey = process.env.CLOUD_RUN_API_SECRET;

  // Only enforce if secret is set in env
  if (validKey && apiKey !== validKey) {
    return handleUnauthorizedError(c);
  }
  await next();
});

// ============================================================================
// Core Endpoints (Non-API)
// ============================================================================

/**
 * GET /health - Health Check
 */
app.get('/health', (c: Context) =>
  c.json({
    status: 'ok',
    service: 'ai-engine-v5',
    version: '2.0.0',
    config: getConfigStatus(),
    redis: isRedisAvailable(),
    timestamp: new Date().toISOString(),
  })
);

/**
 * GET /warmup - Warm-up Endpoint (Lightweight)
 */
app.get('/warmup', (c: Context) => {
  // Precomputed State load (O(1) - already built)
  const state = getCurrentState();
  // Validate keys
  const status = validateAPIKeys();

  return jsonSuccess(c, {
    status: 'warmed_up',
    keys: status,
    precomputed: {
      totalSlots: 144, // 24h * 6 (10-min intervals)
      currentSlot: state.slotIndex,
      currentTime: state.timeLabel,
      serverCount: state.servers.length,
      summary: state.summary,
    },
  });
});

/**
 * GET /monitoring - Circuit Breaker, Langfuse & Resilience Status
 */
app.get('/monitoring', (c: Context) => {
  const circuitStats = getAllCircuitStats();
  const langfuseStatus = getLangfuseUsageStatus();

  return c.json({
    status: 'ok',
    circuits: circuitStats,
    langfuse: langfuseStatus,
    timestamp: new Date().toISOString(),
  });
});

/**
 * POST /monitoring/reset - Reset Circuit Breakers (Admin)
 */
app.post('/monitoring/reset', (c: Context) => {
  resetAllCircuitBreakers();

  return jsonSuccess(c, {
    message: 'All circuit breakers reset',
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /monitoring/traces - Langfuse 최근 트레이스 조회
 * AI 어시스턴트 테스트 결과 확인용
 */
app.get('/monitoring/traces', async (c: Context) => {
  const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
  const secretKey = process.env.LANGFUSE_SECRET_KEY;
  const baseUrl = process.env.LANGFUSE_BASE_URL || 'https://us.cloud.langfuse.com';

  if (!publicKey || !secretKey) {
    return c.json({ error: 'Langfuse API keys not configured' }, 500);
  }

  try {
    // Basic Auth: publicKey:secretKey
    const authToken = Buffer.from(`${publicKey}:${secretKey}`).toString('base64');

    // 최근 10개 트레이스 조회
    const response = await fetch(`${baseUrl}/api/public/traces?limit=10`, {
      headers: {
        Authorization: `Basic ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return c.json({
        error: 'Langfuse API error',
        status: response.status,
        message: errorText,
      }, response.status as 400 | 401 | 403 | 500);
    }

    const data = await response.json();

    // 트레이스 요약 정보만 추출 (보안상 전체 내용은 제외)
    const traces = (data.data || []).map((trace: {
      id: string;
      name: string;
      sessionId?: string;
      input?: string;
      output?: string;
      metadata?: Record<string, unknown>;
      createdAt: string;
      updatedAt: string;
    }) => ({
      id: trace.id,
      name: trace.name,
      sessionId: trace.sessionId,
      inputPreview: typeof trace.input === 'string'
        ? trace.input.substring(0, 100) + (trace.input.length > 100 ? '...' : '')
        : '[object]',
      outputPreview: typeof trace.output === 'string'
        ? trace.output.substring(0, 200) + (trace.output.length > 200 ? '...' : '')
        : '[object]',
      metadata: trace.metadata,
      createdAt: trace.createdAt,
      updatedAt: trace.updatedAt,
    }));

    return c.json({
      status: 'ok',
      count: traces.length,
      traces,
      dashboardUrl: `${baseUrl}/project`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json({
      error: 'Failed to fetch Langfuse traces',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// ============================================================================
// Route Registration
// ============================================================================

// AI Supervisor
app.route('/api/ai/supervisor', supervisorRouter);

// Embedding Service
app.route('/api/ai/embedding', embeddingRouter);

// Generate Service
app.route('/api/ai/generate', generateRouter);

// Human-in-the-Loop Approval
app.route('/api/ai/approval', approvalRouter);

// Analytics (analyze-server, incident-report, analyze-batch)
app.route('/api/ai', analyticsRouter);

// GraphRAG
app.route('/api/ai/graphrag', graphragRouter);

// Async Job Processing
app.route('/api/jobs', jobsRouter);

// Provider Management (testing/debugging)
app.route('/api/ai/providers', providersRouter);

// ============================================================================
// Server Start
// ============================================================================

const port = parseInt(process.env.PORT || '8080', 10);
console.log(`🚀 AI Engine Server starting on port ${port}...`);
logAPIKeyStatus();

// Initialize Langfuse config (sets env vars from JSON secret)
const langfuseConfig = getLangfuseConfig();
if (langfuseConfig) {
  console.log(`📊 [Langfuse] Initialized: ${langfuseConfig.baseUrl}`);
} else {
  console.warn(`⚠️ [Langfuse] Not configured - observability disabled`);
}

serve(
  {
    fetch: app.fetch,
    port,
    hostname: '0.0.0.0', // Required for Cloud Run
  },
  (info: { address: string; port: number }) => {
    console.log(`✅ Server listening on http://${info.address}:${info.port}`);
    console.log(`📚 Routes registered:`);
    console.log(`   - /health, /warmup, /monitoring`);
    console.log(`   - /api/ai/supervisor`);
    console.log(`   - /api/ai/embedding`);
    console.log(`   - /api/ai/generate`);
    console.log(`   - /api/ai/approval`);
    console.log(`   - /api/ai/analyze-server, /api/ai/incident-report, /api/ai/analyze-batch`);
    console.log(`   - /api/ai/graphrag`);
    console.log(`   - /api/ai/providers (toggle)`);
    console.log(`   - /api/jobs`);
  }
);

// ============================================================================
// Graceful Shutdown
// ============================================================================

async function gracefulShutdown(signal: string): Promise<void> {
  console.log(`\n⏳ Received ${signal}, shutting down gracefully...`);

  try {
    // Flush Langfuse traces before shutdown
    console.log('📊 Flushing Langfuse traces...');
    await flushLangfuse();

    // Shutdown Langfuse client
    console.log('🔌 Shutting down Langfuse...');
    await shutdownLangfuse();

    console.log('✅ Graceful shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
