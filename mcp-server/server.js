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

// 시스템 컨텍스트 저장소
const systemContext = {
  startup: new Date().toISOString(),
  logs: [],
  metrics: {},
  vercelSync: {
    lastSync: null,
    status: 'ready',
    errors: [],
  },
};

// 로그 수집 함수
function addLog(level, message, data = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    data,
    uptime: Math.floor(process.uptime()),
  };

  systemContext.logs.push(logEntry);

  // 최대 100개 로그 유지
  if (systemContext.logs.length > 100) {
    systemContext.logs = systemContext.logs.slice(-100);
  }

  console.error(`[${level.toUpperCase()}] ${message}`);
}

// Vercel API 호출 함수
async function sendToVercel(endpoint, data) {
  try {
    const vercelUrl =
      process.env.VERCEL_URL || 'https://openmanager-vibe-v5.vercel.app';
    const response = await fetch(`${vercelUrl}/api/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-MCP-Source': 'render-server',
      },
      body: JSON.stringify({
        ...data,
        renderContext: {
          timestamp: new Date().toISOString(),
          uptime: Math.floor(process.uptime()),
          environment: 'render',
          region: 'singapore',
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Vercel API 응답 오류: ${response.status}`);
    }

    const result = await response.json();
    systemContext.vercelSync.lastSync = new Date().toISOString();
    systemContext.vercelSync.status = 'success';

    addLog('info', `Vercel 동기화 성공: ${endpoint}`, {
      status: response.status,
    });
    return result;
  } catch (error) {
    systemContext.vercelSync.status = 'error';
    systemContext.vercelSync.errors.push({
      timestamp: new Date().toISOString(),
      endpoint,
      error: error.message,
    });

    addLog('error', `Vercel 동기화 실패: ${error.message}`, { endpoint });
    throw error;
  }
}

// 시스템 메트릭 수집
function collectMetrics() {
  const memUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();

  systemContext.metrics = {
    timestamp: new Date().toISOString(),
    memory: {
      rss: memUsage.rss,
      heapTotal: memUsage.heapTotal,
      heapUsed: memUsage.heapUsed,
      external: memUsage.external,
      usage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
    },
    cpu: {
      user: cpuUsage.user,
      system: cpuUsage.system,
      loadAverage: process.platform !== 'win32' ? os.loadavg() : [0, 0, 0],
    },
    uptime: Math.floor(process.uptime()),
    platform: process.platform,
    nodeVersion: process.version,
  };
}

// 주기적 메트릭 수집 및 Vercel 동기화
setInterval(() => {
  collectMetrics();

  // 5분마다 Vercel에 상태 동기화
  if (Math.floor(process.uptime()) % 300 === 0) {
    sendToVercel('mcp/sync', {
      type: 'health_update',
      metrics: systemContext.metrics,
      logs: systemContext.logs.slice(-10), // 최근 10개 로그만
    }).catch(() => {}); // 에러는 이미 로깅됨
  }
}, 30000); // 30초마다 수집

// MCP 서버 인스턴스 생성 (확장된 표준 구조)
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

// 도구 목록 제공 (확장된 표준 MCP 프로토콜)
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
        description: '확장된 시스템 정보를 가져옵니다',
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
      {
        name: 'sync_to_vercel',
        description: 'Vercel로 데이터를 동기화합니다',
        inputSchema: {
          type: 'object',
          properties: {
            endpoint: {
              type: 'string',
              description: 'Vercel API 엔드포인트',
            },
            data: {
              type: 'object',
              description: '전송할 데이터',
            },
          },
          required: ['endpoint'],
        },
      },
      {
        name: 'get_logs',
        description: '시스템 로그를 조회합니다',
        inputSchema: {
          type: 'object',
          properties: {
            level: {
              type: 'string',
              enum: ['info', 'warn', 'error', 'debug'],
              description: '로그 레벨 필터',
            },
            limit: {
              type: 'number',
              description: '조회할 로그 개수 (기본값: 20)',
              default: 20,
            },
          },
        },
      },
      {
        name: 'collect_context',
        description: 'Render 환경의 전체 컨텍스트를 수집합니다',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

// 도구 호출 처리 (확장된 표준 MCP 프로토콜)
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
        addLog('info', `파일 읽기: ${filePath}`);

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

        addLog('info', `디렉토리 조회: ${dirPath} (${fileList.length}개 항목)`);

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
        collectMetrics(); // 최신 메트릭 수집

        const systemInfo = {
          ...systemContext.metrics,
          context: {
            startup: systemContext.startup,
            vercelSync: systemContext.vercelSync,
            logsCount: systemContext.logs.length,
          },
          environment: {
            hostname: os.hostname(),
            environment: process.env.NODE_ENV || 'development',
            region: 'singapore',
            render: {
              deployment: process.env.RENDER_DEPLOYMENT_ID || 'local',
              service: process.env.RENDER_SERVICE_NAME || 'mcp-server',
            },
          },
        };

        addLog('info', '시스템 정보 조회됨');

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
        const healthData = {
          status: 'healthy',
          server: 'OpenManager Vibe v5 MCP Server',
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          uptime: Math.floor(process.uptime()),
          protocol: 'MCP 1.0',
          transport: 'stdio',
          context: {
            startup: systemContext.startup,
            logsCount: systemContext.logs.length,
            vercelSync: systemContext.vercelSync,
          },
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(healthData, null, 2),
            },
          ],
        };
      }

      case 'sync_to_vercel': {
        const { endpoint, data = {} } = args;

        const result = await sendToVercel(endpoint, data);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  endpoint,
                  timestamp: new Date().toISOString(),
                  result,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'get_logs': {
        const { level, limit = 20 } = args;

        let filteredLogs = systemContext.logs;
        if (level) {
          filteredLogs = systemContext.logs.filter(log => log.level === level);
        }

        const logs = filteredLogs.slice(-limit);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  logs,
                  total: filteredLogs.length,
                  filter: level || 'all',
                  retrieved: logs.length,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'collect_context': {
        collectMetrics(); // 최신 메트릭 수집

        const fullContext = {
          timestamp: new Date().toISOString(),
          server: {
            name: 'OpenManager Vibe v5 MCP Server',
            version: '1.0.0',
            startup: systemContext.startup,
            uptime: Math.floor(process.uptime()),
          },
          environment: {
            platform: process.platform,
            nodeVersion: process.version,
            hostname: os.hostname(),
            region: 'singapore',
            render: {
              deployment: process.env.RENDER_DEPLOYMENT_ID || 'local',
              service: process.env.RENDER_SERVICE_NAME || 'mcp-server',
            },
          },
          metrics: systemContext.metrics,
          logs: {
            count: systemContext.logs.length,
            recent: systemContext.logs.slice(-5),
          },
          vercelSync: systemContext.vercelSync,
        };

        addLog('info', 'Render 컨텍스트 전체 수집 완료');

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(fullContext, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`알 수 없는 도구: ${name}`);
    }
  } catch (error) {
    addLog('error', `도구 실행 오류: ${name}`, { error: error.message });

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

// 리소스 목록 제공 (확장된 표준 MCP 프로토콜)
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
      {
        uri: 'system://context',
        name: 'Render 컨텍스트',
        description: '전체 시스템 컨텍스트',
        mimeType: 'application/json',
      },
      {
        uri: 'vercel://sync-status',
        name: 'Vercel 동기화 상태',
        description: 'Vercel과의 동기화 상태',
        mimeType: 'application/json',
      },
    ],
  };
});

// 리소스 읽기 처리 (확장된 표준 MCP 프로토콜)
server.setRequestHandler(ReadResourceRequestSchema, async request => {
  const { uri } = request.params;

  switch (uri) {
    case 'system://status': {
      collectMetrics(); // 최신 메트릭 수집

      const status = {
        server: 'OpenManager Vibe v5 MCP Server',
        status: 'running',
        uptime: Math.floor(process.uptime()),
        memory: {
          rss: `${Math.round(systemContext.metrics.memory.rss / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(systemContext.metrics.memory.heapUsed / 1024 / 1024)}MB`,
          usage: `${systemContext.metrics.memory.usage}%`,
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
      const logs = systemContext.logs
        .slice(-20)
        .map(
          log => `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}`
        )
        .join('\n');

      return {
        contents: [
          {
            uri,
            mimeType: 'text/plain',
            text: logs || '로그가 없습니다.',
          },
        ],
      };
    }

    case 'system://context': {
      collectMetrics(); // 최신 메트릭 수집

      const context = {
        timestamp: new Date().toISOString(),
        startup: systemContext.startup,
        uptime: Math.floor(process.uptime()),
        metrics: systemContext.metrics,
        logs: {
          count: systemContext.logs.length,
          levels: systemContext.logs.reduce((acc, log) => {
            acc[log.level] = (acc[log.level] || 0) + 1;
            return acc;
          }, {}),
        },
        vercelSync: systemContext.vercelSync,
      };

      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(context, null, 2),
          },
        ],
      };
    }

    case 'vercel://sync-status': {
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(systemContext.vercelSync, null, 2),
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
  addLog('info', 'OpenManager Vibe v5 MCP Server 시작 중...');
  addLog('info', '7개 도구, 4개 리소스 등록됨');
  addLog('info', 'MCP 프로토콜 1.0 (stdio 전송)');
  addLog('info', 'Render 컨텍스트 수집 및 Vercel 연동 활성화');

  // 초기 메트릭 수집
  collectMetrics();

  const transport = new StdioServerTransport();
  await server.connect(transport);

  addLog('info', 'MCP 서버 준비 완료');
}

// 오류 처리
process.on('uncaughtException', err => {
  addLog('error', '예상치 못한 오류', { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', err => {
  addLog('error', '처리되지 않은 Promise 거부', { error: err.message });
  process.exit(1);
});

// 종료 처리
process.on('SIGINT', () => {
  addLog('info', 'MCP 서버 종료 중...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  addLog('info', 'MCP 서버 종료 중...');
  process.exit(0);
});

// 서버 시작
main().catch(error => {
  addLog('error', 'MCP 서버 시작 실패', { error: error.message });
  process.exit(1);
});
