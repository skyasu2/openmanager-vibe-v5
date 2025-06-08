#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs';
import path from 'path';
import http from 'http';
import { createServer } from 'http';

const PORT = process.env.PORT || 3100;

// MCP 서버 인스턴스 생성
const server = new Server(
  {
    name: 'openmanager-vibe-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 도구 목록 제공
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'health_check',
        description: 'MCP 서버 헬스 체크',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'server_status',
        description: '서버 상태 확인',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

// 도구 호출 처리
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name } = request.params;

  switch (name) {
    case 'health_check':
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'healthy',
              timestamp: new Date().toISOString(),
              port: PORT,
              version: '1.0.0'
            }, null, 2),
          },
        ],
      };

    case 'server_status':
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              mcp_server: 'running',
              port: PORT,
              uptime: process.uptime(),
              memory: process.memoryUsage(),
              timestamp: new Date().toISOString()
            }, null, 2),
          },
        ],
      };

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// HTTP 서버 생성 (헬스체크용)
const httpServer = createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  
  if (req.url === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      port: PORT,
      version: '1.0.0',
      uptime: process.uptime()
    }));
  } else if (req.url === '/status') {
    res.writeHead(200);
    res.end(JSON.stringify({
      mcp_server: 'running',
      port: PORT,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    }));
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

// 서버 시작
async function main() {
  // HTTP 서버 시작
  httpServer.listen(PORT, () => {
    console.log(`🚀 MCP HTTP Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`📈 Status check: http://localhost:${PORT}/status`);
  });

  // MCP 서버 실행 (stdio 모드)
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log('🔗 MCP Server connected via stdio');
}

// 종료 처리
process.on('SIGINT', () => {
  console.log('\n🛑 MCP Server shutting down...');
  httpServer.close(() => {
    console.log('✅ MCP Server stopped');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 MCP Server shutting down...');
  httpServer.close(() => {
    console.log('✅ MCP Server stopped');
    process.exit(0);
  });
});

// 오류 처리
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  process.exit(1);
});

main().catch((error) => {
  console.error('❌ Failed to start MCP server:', error);
  process.exit(1);
});
