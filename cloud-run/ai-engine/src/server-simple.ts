/**
 * Simple Cloud Run Test Server
 */

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import type { Context } from 'hono';

const app = new Hono();

// Health Check
app.get('/health', (c: Context) =>
  c.json({
    status: 'ok',
    service: 'ai-engine-v5',
    timestamp: new Date().toISOString(),
  })
);

// Test endpoint
app.get('/', (c: Context) => c.json({ message: 'AI Engine is running!' }));

// Start Server
const port = parseInt(process.env.PORT || '8080', 10);
console.log(`🚀 Simple AI Engine Server starting on port ${port}...`);

serve({
  fetch: app.fetch,
  port,
});
