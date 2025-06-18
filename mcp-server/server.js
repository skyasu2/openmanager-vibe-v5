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
      {
        name: 'render_info',
        description: 'Render 환경 정보 확인',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'system_metrics',
        description: '시스템 리소스 메트릭 조회',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

// 도구 호출 처리
server.setRequestHandler(CallToolRequestSchema, async request => {
  const { name } = request.params;

  switch (name) {
    case 'health_check':
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                port: PORT,
                version: '1.0.0',
              },
              null,
              2
            ),
          },
        ],
      };

    case 'server_status':
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                mcp_server: 'running',
                port: PORT,
                uptime: Math.floor(process.uptime()),
                memory: process.memoryUsage(),
                timestamp: new Date().toISOString(),
              },
              null,
              2
            ),
          },
        ],
      };

    case 'render_info':
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                platform: 'render',
                region: 'singapore',
                environment: process.env.NODE_ENV || 'development',
                deployment: {
                  auto_deploy: true,
                  branch: 'main',
                  build_command: 'npm ci && npm run build',
                  start_command: 'npm start',
                },
                features: ['http_endpoints', 'mcp_protocol', 'health_checks'],
                endpoints: {
                  base: `http://localhost:${PORT}`,
                  health: '/health',
                  status: '/status',
                },
                timestamp: new Date().toISOString(),
              },
              null,
              2
            ),
          },
        ],
      };

    case 'system_metrics':
      const memUsage = process.memoryUsage();
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                cpu: {
                  uptime: Math.floor(process.uptime()),
                  load_average:
                    process.platform !== 'win32'
                      ? require('os').loadavg()
                      : [0, 0, 0],
                },
                memory: {
                  rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
                  heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
                  heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
                  external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
                  usage_percent: Math.round(
                    (memUsage.heapUsed / memUsage.heapTotal) * 100
                  ),
                },
                process: {
                  pid: process.pid,
                  version: process.version,
                  platform: process.platform,
                  arch: process.arch,
                },
                timestamp: new Date().toISOString(),
              },
              null,
              2
            ),
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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // CORS preflight 처리
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/health') {
    res.writeHead(200);
    res.end(
      JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        port: PORT,
        version: '1.0.0',
        uptime: Math.floor(process.uptime()),
        environment: 'render',
        region: 'singapore',
        mcp_protocol: 'stdio',
        endpoints: {
          health: '/health',
          status: '/status',
        },
      })
    );
  } else if (req.url === '/status') {
    const memUsage = process.memoryUsage();
    res.writeHead(200);
    res.end(
      JSON.stringify({
        mcp_server: 'running',
        port: PORT,
        uptime: Math.floor(process.uptime()),
        memory: {
          rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
          external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
        },
        environment: process.env.NODE_ENV || 'development',
        platform: 'render',
        nodeVersion: process.version,
        timestamp: new Date().toISOString(),
      })
    );
  } else if (req.url === '/') {
    res.writeHead(200);
    res.end(
      JSON.stringify({
        name: 'OpenManager Vibe v5 MCP Server',
        version: '1.0.0',
        environment: 'render',
        endpoints: {
          health: '/health',
          status: '/status',
        },
        documentation: 'https://github.com/skyasu2/openmanager-vibe-v5',
      })
    );
  } else {
    res.writeHead(404);
    res.end(
      JSON.stringify({
        error: 'Not found',
        available_endpoints: ['/health', '/status', '/'],
      })
    );
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
process.on('uncaughtException', err => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', err => {
  console.error('❌ Unhandled Rejection:', err);
  process.exit(1);
});

main().catch(error => {
  console.error('❌ Failed to start MCP server:', error);
  process.exit(1);
});
