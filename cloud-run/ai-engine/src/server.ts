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
import { getConfigStatus } from './lib/config-parser';
import { isRedisAvailable } from './lib/redis-client';
import { getCurrentState } from './data/precomputed-state';

// Error handling
import { handleUnauthorizedError, jsonSuccess } from './lib/error-handler';

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

// ============================================================================
// Server Start
// ============================================================================

const port = parseInt(process.env.PORT || '8080', 10);
console.log(`🚀 AI Engine Server starting on port ${port}...`);
logAPIKeyStatus();

serve(
  {
    fetch: app.fetch,
    port,
    hostname: '0.0.0.0', // Required for Cloud Run
  },
  (info: { address: string; port: number }) => {
    console.log(`✅ Server listening on http://${info.address}:${info.port}`);
    console.log(`📚 Routes registered:`);
    console.log(`   - /health, /warmup`);
    console.log(`   - /api/ai/supervisor`);
    console.log(`   - /api/ai/embedding`);
    console.log(`   - /api/ai/generate`);
    console.log(`   - /api/ai/approval`);
    console.log(`   - /api/ai/analyze-server, /api/ai/incident-report, /api/ai/analyze-batch`);
    console.log(`   - /api/ai/graphrag`);
    console.log(`   - /api/jobs`);
  }
);
