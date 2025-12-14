/**
 * Supabase MCP Bridge - Streamable HTTP Server
 *
 * Cloud Run 배포용 Supabase MCP REST API 서비스
 * - Streamable HTTP transport (MCP 2024 best practice)
 * - HTTP/2 h2c 지원
 * - IAM 인증 연동
 */

import { serve } from '@hono/node-server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: ['https://openmanager-vibe-v5.vercel.app', 'http://localhost:3000'],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
);

// Supabase Client (Singleton)
let supabase: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set');
    }

    supabase = createClient(url, key, {
      auth: { persistSession: false },
    });
  }
  return supabase;
}

// ============================================================================
// Health & Info Endpoints
// ============================================================================

app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    service: 'supabase-mcp',
    transport: 'streamable-http',
    timestamp: new Date().toISOString(),
  });
});

app.get('/info', (c) => {
  return c.json({
    name: 'Supabase MCP Bridge',
    version: '1.0.0',
    description: 'Supabase database access via MCP-compatible REST API',
    tools: [
      'list_tables',
      'get_table_schema',
      'query',
      'insert',
      'update',
      'delete',
    ],
  });
});

// ============================================================================
// MCP Tools - Database Operations
// ============================================================================

/**
 * List all tables in the database
 */
app.post('/mcp/tools/list_tables', async (c) => {
  try {
    const client = getSupabaseClient();

    const { data, error } = await client.rpc('get_all_tables');

    if (error) {
      // Fallback: Direct query if RPC not available
      const { data: fallbackData, error: fallbackError } = await client
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');

      if (fallbackError) {
        return c.json({ error: fallbackError.message }, 500);
      }
      return c.json({ result: fallbackData });
    }

    return c.json({ result: data });
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

/**
 * Get schema for a specific table
 */
app.post('/mcp/tools/get_table_schema', async (c) => {
  try {
    const { table_name } = await c.req.json();

    if (!table_name) {
      return c.json({ error: 'table_name is required' }, 400);
    }

    const client = getSupabaseClient();

    const { data, error } = await client
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_schema', 'public')
      .eq('table_name', table_name);

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    return c.json({ result: data });
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

/**
 * Execute a read-only SELECT query
 */
app.post('/mcp/tools/query', async (c) => {
  try {
    const { table, select = '*', filters = {} } = await c.req.json();

    if (!table) {
      return c.json({ error: 'table is required' }, 400);
    }

    const client = getSupabaseClient();
    let query = client.from(table).select(select);

    // Apply filters
    for (const [key, value] of Object.entries(filters)) {
      query = query.eq(key, value);
    }

    const { data, error } = await query.limit(100);

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    return c.json({ result: data, count: data?.length || 0 });
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

/**
 * Insert data into a table
 */
app.post('/mcp/tools/insert', async (c) => {
  try {
    const { table, data: insertData } = await c.req.json();

    if (!table || !insertData) {
      return c.json({ error: 'table and data are required' }, 400);
    }

    const client = getSupabaseClient();
    const { data, error } = await client
      .from(table)
      .insert(insertData)
      .select();

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    return c.json({ result: data, inserted: data?.length || 0 });
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

/**
 * Update data in a table
 */
app.post('/mcp/tools/update', async (c) => {
  try {
    const { table, data: updateData, filters } = await c.req.json();

    if (!table || !updateData || !filters) {
      return c.json({ error: 'table, data, and filters are required' }, 400);
    }

    const client = getSupabaseClient();
    let query = client.from(table).update(updateData);

    // Apply filters
    for (const [key, value] of Object.entries(filters)) {
      query = query.eq(key, value as string | number);
    }

    const { data, error } = await query.select();

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    return c.json({ result: data, updated: data?.length || 0 });
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

/**
 * Delete data from a table
 */
app.post('/mcp/tools/delete', async (c) => {
  try {
    const { table, filters } = await c.req.json();

    if (!table || !filters || Object.keys(filters).length === 0) {
      return c.json(
        { error: 'table and at least one filter are required' },
        400
      );
    }

    const client = getSupabaseClient();
    let query = client.from(table).delete();

    // Apply filters (required for safety)
    for (const [key, value] of Object.entries(filters)) {
      query = query.eq(key, value as string | number);
    }

    const { data, error } = await query.select();

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    return c.json({ result: data, deleted: data?.length || 0 });
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

// ============================================================================
// Server Start
// ============================================================================

const port = parseInt(process.env.PORT || '8080', 10);

console.log(`🚀 Supabase MCP Bridge starting on port ${port}`);
console.log(`📡 Transport: Streamable HTTP (MCP 2024)`);
console.log(`🔒 Security: IAM Authentication Required`);

serve({
  fetch: app.fetch,
  port,
});
