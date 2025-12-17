/**
 * Cloud Run AI Engine Server
 * Uses Hono for efficient HTTP handling
 */

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import { logAPIKeyStatus, validateAPIKeys } from './lib/model-config';
import { approvalStore } from './services/approval/approval-store';
import { createSupervisorStreamResponse } from './services/langgraph/multi-agent-supervisor';
import { loadHourlyScenarioData } from './services/scenario/scenario-loader';

// Initialize App
const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors());

// Health Check
app.get('/health', (c) => c.json({ status: 'ok', service: 'ai-engine-v5' }));

// Security Middleware (Skip for health/warmup)
app.use('/api/*', async (c, next) => {
  const apiKey = c.req.header('X-API-Key');
  const validKey = process.env.CLOUD_RUN_API_SECRET;

  // Only enforce if secret is set in env
  if (validKey && apiKey !== validKey) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  await next();
});

// Warm-up Endpoint (Lightweight)
app.get('/warmup', async (c) => {
  // Trigger data loading to warm up cache
  await loadHourlyScenarioData();
  // Validate keys
  const status = validateAPIKeys();
  return c.json({
    status: 'warmed_up',
    keys: status,
  });
});

// Main AI Supervisor Endpoint
app.post('/api/ai/supervisor', async (c) => {
  try {
    const { messages, sessionId } = await c.req.json();

    // Extract last user message
    const lastMessage = messages[messages.length - 1];
    const query = lastMessage?.content;

    if (!query) {
      return c.json({ error: 'No query provided' }, 400);
    }

    // Check API Keys provided (either in env or headers, currently relying on env)
    const { all } = validateAPIKeys();
    if (!all) {
      // return c.json({ error: 'Missing API Keys' }, 500);
      // Ensure we don't block if one is missing but others might work?
      // validateAPIKeys returns 'all' if BOTH are present.
      // Supervisor uses Groq, NLQ uses Gemini. We need at least one.
      // But let's log and proceed, models usually throw specifically.
      logAPIKeyStatus();
    }

    // Get ReadableStream (Web Standard) from Supervisor
    const stream = await createSupervisorStreamResponse(query, sessionId);

    // Convert Web ReadableStream to Node Readable for Hono (if needed)
    // Hono running on Node might handle Web Streams, but let's be safe.
    // Actually @hono/node-server supports returning a standard Response object with a Stream.

    // Set headers for AI SDK Data Stream Protocol
    c.header('Content-Type', 'text/event-stream; charset=utf-8');
    c.header('Cache-Control', 'no-cache');
    c.header('Connection', 'keep-alive');
    c.header('X-Vercel-AI-Data-Stream', 'v1');

    return c.body(stream);
  } catch (error) {
    console.error('API Error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// ============================================================================
// Human-in-the-Loop Approval Endpoints
// ============================================================================

// GET /api/ai/approval/status - Check pending approval status
app.get('/api/ai/approval/status', (c) => {
  const sessionId = c.req.query('sessionId');

  if (!sessionId) {
    return c.json({ success: false, error: 'sessionId is required' }, 400);
  }

  const pending = approvalStore.getPending(sessionId);

  if (!pending) {
    return c.json({
      success: true,
      hasPending: false,
      action: null,
      sessionId,
    });
  }

  return c.json({
    success: true,
    hasPending: true,
    action: {
      type: pending.actionType,
      description: pending.description,
      details: pending.payload,
      requestedAt: pending.requestedAt.toISOString(),
      requestedBy: pending.requestedBy,
      expiresAt: pending.expiresAt.toISOString(),
    },
    sessionId,
  });
});

// POST /api/ai/approval/decide - Submit approval decision
app.post('/api/ai/approval/decide', async (c) => {
  try {
    const { sessionId, approved, reason, approvedBy } = await c.req.json();

    if (!sessionId || typeof approved !== 'boolean') {
      return c.json(
        { success: false, error: 'sessionId and approved are required' },
        400
      );
    }

    const success = approvalStore.submitDecision(sessionId, approved, {
      reason,
      decidedBy: approvedBy,
    });

    if (!success) {
      return c.json(
        {
          success: false,
          error: 'No pending approval found for this session',
        },
        404
      );
    }

    return c.json({
      success: true,
      sessionId,
      decision: approved ? 'approved' : 'rejected',
      decidedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ [Approval] Decision error:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// GET /api/ai/approval/stats - Monitor approval store status
app.get('/api/ai/approval/stats', (c) => {
  const stats = approvalStore.getStats();
  return c.json({
    success: true,
    ...stats,
    timestamp: new Date().toISOString(),
  });
});

// Start Server
const port = parseInt(process.env.PORT || '8080', 10);
console.log(`🚀 AI Engine Server starting on port ${port}...`);
logAPIKeyStatus();

serve(
  {
    fetch: app.fetch,
    port,
    hostname: '0.0.0.0', // Required for Cloud Run
  },
  (info) => {
    console.log(`✅ Server listening on http://${info.address}:${info.port}`);
  }
);
