import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import pg from 'pg';

const app = express();
const PORT = process.env.PORT || 8080;

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const server = new Server(
  { name: 'supabase-mcp', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'query',
        description: 'Run a read-only SQL query (SELECT type).',
        inputSchema: {
          type: 'object',
          properties: {
            sql: { type: 'string' },
          },
          required: ['sql'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'query') {
    const sql = String((request.params.arguments as any).sql);
    if (!sql.toLowerCase().includes('select')) throw new Error('SELECT only');
    const client = await pool.connect();
    try {
      const res = await client.query(sql);
      return { content: [{ type: 'text', text: JSON.stringify(res.rows) }] };
    } finally {
      client.release();
    }
  }
  throw new Error('Tool not found');
});

// SSE Setup
let transport: SSEServerTransport | null = null;

app.get('/sse', async (req, res) => {
  transport = new SSEServerTransport('/message', res);
  await server.connect(transport);
});

app.post('/message', async (req, res) => {
  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    res.status(404).send('Session not found');
  }
});

app.listen(PORT, () => console.log(`MCP Server running on port ${PORT}`));
