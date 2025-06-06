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

class OpenManagerMCPServer {
  constructor() {
    // AI 엔진 모드 감지
    this.isAIEngineMode = process.env.AI_ENGINE_MODE === 'true';
    this.environment = process.env.NODE_ENV || 'development';

    this.server = new Server(
      {
        name: this.isAIEngineMode
          ? 'openmanager-ai-engine'
          : 'openmanager-mcp-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();

    if (this.isAIEngineMode) {
      console.error('🤖 AI Engine Mode: 서버 모니터링 분석 엔진 실행');
    } else {
      console.error('🛠️ Development Mode: 개발 도구 MCP 서버 실행');
    }
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'read_project_file',
            description: 'Read a file from the project directory',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: 'Path to the file relative to project root',
                },
              },
              required: ['path'],
            },
          },
          {
            name: 'list_project_directory',
            description: 'List contents of a project directory',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: 'Path to the directory relative to project root',
                },
              },
              required: ['path'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async request => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'read_project_file':
            return await this.readProjectFile(args.path);
          case 'list_project_directory':
            return await this.listProjectDirectory(args.path);
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        throw new McpError(
          ErrorCode.InternalError,
          `Error executing tool ${name}: ${error.message}`
        );
      }
    });
  }

  async readProjectFile(relativePath) {
    const projectRoot = process.env.PROJECT_ROOT || '.';
    const fullPath = path.resolve(projectRoot, relativePath);

    // Security check to ensure path is within project
    if (!fullPath.startsWith(path.resolve(projectRoot))) {
      throw new Error('Access denied: Path outside project directory');
    }

    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      return {
        content: [
          {
            type: 'text',
            text: content,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to read file: ${error.message}`);
    }
  }

  async listProjectDirectory(relativePath) {
    const projectRoot = process.env.PROJECT_ROOT || '.';
    const fullPath = path.resolve(projectRoot, relativePath);

    // Security check
    if (!fullPath.startsWith(path.resolve(projectRoot))) {
      throw new Error('Access denied: Path outside project directory');
    }

    try {
      const items = fs.readdirSync(fullPath, { withFileTypes: true });
      const listing = items.map(item => ({
        name: item.name,
        type: item.isDirectory() ? 'directory' : 'file',
      }));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(listing, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to list directory: ${error.message}`);
    }
  }

  setupErrorHandling() {
    this.server.onerror = error => {
      console.error('[MCP Server Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async run() {
    // 🌍 Render 환경에서는 항상 HTTP 서버 실행 (포트 바인딩 필요)
    const isRenderEnvironment =
      process.env.RENDER || process.env.RENDER_SERVICE_NAME;

    if (this.isAIEngineMode || isRenderEnvironment) {
      console.error('🌐 Render/AI Engine 모드: HTTP 서버 시작');
      this.startHealthCheckServer();
    }

    // 🔄 Render 환경에서는 stdio 서버 비활성화 (HTTP만 사용)
    if (!isRenderEnvironment) {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      console.error('OpenManager MCP Server running on stdio');
    } else {
      console.error('🚀 Render 환경: HTTP 서버 전용 모드로 실행');
      // 무한 루프로 서버 유지
      await new Promise(() => {}); // 영원히 대기
    }
  }

  startHealthCheckServer() {
    const PORT = process.env.PORT || 3002;

    const healthServer = http.createServer((req, res) => {
      // CORS 헤더 설정
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader('Content-Type', 'application/json');

      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      if (req.url === '/health' && req.method === 'GET') {
        const healthStatus = {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          server: 'OpenManager MCP Server',
          version: '0.1.0',
          environment: process.env.NODE_ENV || 'development',
          isRenderEnvironment: !!(
            process.env.RENDER || process.env.RENDER_SERVICE_NAME
          ),
          mode: this.isAIEngineMode ? 'AI Engine' : 'Development',
        };

        res.writeHead(200);
        res.end(JSON.stringify(healthStatus, null, 2));
      } else if (req.url === '/ping' && req.method === 'GET') {
        res.writeHead(200);
        res.end(
          JSON.stringify({
            pong: true,
            timestamp: new Date().toISOString(),
            message: 'MCP Server is alive!',
          })
        );
      } else if (req.url === '/mcp/tools' && req.method === 'GET') {
        // 🔧 MCP 도구 목록 HTTP API
        const tools = [
          {
            name: 'read_project_file',
            description: 'Read a file from the project directory',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: 'Path to the file relative to project root',
                },
              },
              required: ['path'],
            },
          },
          {
            name: 'list_project_directory',
            description: 'List contents of a project directory',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: 'Path to the directory relative to project root',
                },
              },
              required: ['path'],
            },
          },
        ];

        res.writeHead(200);
        res.end(JSON.stringify({ tools, success: true }, null, 2));
      } else if (req.url === '/mcp/status' && req.method === 'GET') {
        // 🔧 MCP 상태 확인 API
        res.writeHead(200);
        res.end(
          JSON.stringify(
            {
              success: true,
              mcp: {
                connected: true,
                server: 'OpenManager MCP Server',
                version: '0.1.0',
                capabilities: ['tools'],
                toolCount: 2,
              },
              timestamp: new Date().toISOString(),
            },
            null,
            2
          )
        );
      } else {
        res.writeHead(404);
        res.end(
          JSON.stringify({
            error: 'Not Found',
            message: 'MCP Server endpoint not found',
            availableEndpoints: [
              '/health',
              '/ping',
              '/mcp/tools',
              '/mcp/status',
            ],
          })
        );
      }
    });

    healthServer.listen(PORT, '0.0.0.0', () => {
      console.error(`🏥 MCP Health Check Server running on port ${PORT}`);
      console.error(`📡 Health check: http://localhost:${PORT}/health`);
    });

    // 우아한 종료
    process.on('SIGTERM', () => {
      console.error('🛑 MCP 서버 종료 신호 받음');
      healthServer.close(() => {
        console.error('✅ Health Check 서버 종료 완료');
      });
    });
  }
}

const server = new OpenManagerMCPServer();
server.run().catch(console.error);
