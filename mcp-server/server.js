#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

// MCP 서버 인스턴스 생성 (공식 표준 구조)
const server = new Server(
  {
    name: 'openmanager-vibe-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// 도구 목록 제공 (표준 MCP 프로토콜)
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'read_file',
        description: '파일 내용을 읽습니다',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: '읽을 파일의 경로',
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'list_directory',
        description: '디렉토리 내용을 나열합니다',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: '나열할 디렉토리 경로',
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'system_info',
        description: '시스템 정보를 가져옵니다',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'health_check',
        description: 'MCP 서버 상태를 확인합니다',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

// 도구 호출 처리 (표준 MCP 프로토콜)
server.setRequestHandler(CallToolRequestSchema, async request => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'read_file': {
        const { path: filePath } = args;

        // 보안: 상대 경로 차단
        if (filePath.includes('..')) {
          throw new Error('상대 경로는 허용되지 않습니다');
        }

        const content = await fs.readFile(filePath, 'utf-8');
        return {
          content: [
            {
              type: 'text',
              text: `파일: ${filePath}\n\n${content}`,
            },
          ],
        };
      }

      case 'list_directory': {
        const { path: dirPath } = args;

        // 보안: 상대 경로 차단
        if (dirPath.includes('..')) {
          throw new Error('상대 경로는 허용되지 않습니다');
        }

        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        const fileList = entries.map(entry => ({
          name: entry.name,
          type: entry.isDirectory() ? 'directory' : 'file',
          path: path.join(dirPath, entry.name),
        }));

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  directory: dirPath,
                  entries: fileList,
                  count: fileList.length,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'system_info': {
        const memUsage = process.memoryUsage();
        const systemInfo = {
          platform: process.platform,
          architecture: process.arch,
          nodeVersion: process.version,
          uptime: Math.floor(process.uptime()),
          memory: {
            rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
            heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
            heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
            external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
          },
          cpu: {
            loadAverage:
              process.platform !== 'win32' ? os.loadavg() : [0, 0, 0],
            cpuCount: os.cpus().length,
          },
          hostname: os.hostname(),
          environment: process.env.NODE_ENV || 'development',
          timestamp: new Date().toISOString(),
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(systemInfo, null, 2),
            },
          ],
        };
      }

      case 'health_check': {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  status: 'healthy',
                  server: 'OpenManager Vibe v5 MCP Server',
                  version: '1.0.0',
                  timestamp: new Date().toISOString(),
                  uptime: Math.floor(process.uptime()),
                  protocol: 'MCP 1.0',
                  transport: 'stdio',
                },
                null,
                2
              ),
            },
          ],
        };
      }

      default:
        throw new Error(`알 수 없는 도구: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `오류: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// 리소스 목록 제공 (표준 MCP 프로토콜)
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'system://status',
        name: '시스템 상태',
        description: '현재 시스템 상태 정보',
        mimeType: 'application/json',
      },
      {
        uri: 'system://logs',
        name: '시스템 로그',
        description: '최근 시스템 로그',
        mimeType: 'text/plain',
      },
    ],
  };
});

// 리소스 읽기 처리 (표준 MCP 프로토콜)
server.setRequestHandler(ReadResourceRequestSchema, async request => {
  const { uri } = request.params;

  switch (uri) {
    case 'system://status': {
      const memUsage = process.memoryUsage();
      const status = {
        server: 'OpenManager Vibe v5 MCP Server',
        status: 'running',
        uptime: Math.floor(process.uptime()),
        memory: {
          rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        },
        platform: process.platform,
        nodeVersion: process.version,
        timestamp: new Date().toISOString(),
      };

      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(status, null, 2),
          },
        ],
      };
    }

    case 'system://logs': {
      const logs = [
        `[${new Date().toISOString()}] INFO: MCP 서버 시작됨`,
        `[${new Date().toISOString()}] INFO: 프로토콜 버전: MCP 1.0`,
        `[${new Date().toISOString()}] INFO: 전송 방식: stdio`,
        `[${new Date().toISOString()}] INFO: 4개 도구 등록됨`,
        `[${new Date().toISOString()}] INFO: 2개 리소스 등록됨`,
      ].join('\n');

      return {
        contents: [
          {
            uri,
            mimeType: 'text/plain',
            text: logs,
          },
        ],
      };
    }

    default:
      throw new Error(`알 수 없는 리소스: ${uri}`);
  }
});

// 서버 시작 함수
async function main() {
  console.error('🚀 OpenManager Vibe v5 MCP Server 시작 중...');
  console.error('📋 4개 도구, 2개 리소스 등록됨');
  console.error('🔗 MCP 프로토콜 1.0 (stdio 전송)');

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('✅ MCP 서버 준비 완료');
}

// 오류 처리
process.on('uncaughtException', err => {
  console.error('❌ 예상치 못한 오류:', err);
  process.exit(1);
});

process.on('unhandledRejection', err => {
  console.error('❌ 처리되지 않은 Promise 거부:', err);
  process.exit(1);
});

// 종료 처리
process.on('SIGINT', () => {
  console.error('\n🛑 MCP 서버 종료 중...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('\n🛑 MCP 서버 종료 중...');
  process.exit(0);
});

// 서버 시작
main().catch(error => {
  console.error('❌ MCP 서버 시작 실패:', error);
  process.exit(1);
});
