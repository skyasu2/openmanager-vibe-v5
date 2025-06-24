#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { FileSystemServer } from '@modelcontextprotocol/server-filesystem';
import os from 'os';

// 시스템 컨텍스트 저장소 (Vercel 연동용)
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

// 공식 MCP 파일시스템 서버 인스턴스 생성
const fileSystemServer = new FileSystemServer();

// 메인 MCP 서버 인스턴스 생성 (공식 파일시스템 서버 + Vercel 연동)
const server = new Server(
  {
    name: 'openmanager-vibe-filesystem-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// 공식 파일시스템 서버의 도구들을 위임
server.setRequestHandler(ListToolsRequestSchema, async () => {
  const fsTools = await fileSystemServer.listTools();

  // 추가 Vercel 연동 도구들
  const customTools = [
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
      name: 'get_system_context',
      description: 'Render 환경의 시스템 컨텍스트를 조회합니다',
      inputSchema: {
        type: 'object',
        properties: {
          includeMetrics: {
            type: 'boolean',
            description: '메트릭 포함 여부',
            default: true,
          },
          includeLogs: {
            type: 'boolean',
            description: '로그 포함 여부',
            default: true,
          },
        },
      },
    },
  ];

  return {
    tools: [...fsTools.tools, ...customTools],
  };
});

// 도구 호출 처리 (공식 파일시스템 + 커스텀 기능)
server.setRequestHandler(CallToolRequestSchema, async request => {
  const { name, arguments: args } = request.params;

  try {
    // 공식 파일시스템 서버 도구들 위임
    if (
      [
        'read_file',
        'write_file',
        'create_directory',
        'list_directory',
        'move_file',
        'search_files',
      ].includes(name)
    ) {
      addLog('info', `파일시스템 도구 실행: ${name}`, { args });
      return await fileSystemServer.callTool(request);
    }

    // 커스텀 Vercel 연동 도구들
    switch (name) {
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

      case 'get_system_context': {
        const { includeMetrics = true, includeLogs = true } = args;

        collectMetrics(); // 최신 메트릭 수집

        const context = {
          timestamp: new Date().toISOString(),
          server: {
            name: 'OpenManager Vibe v5 Filesystem Server',
            version: '1.0.0',
            startup: systemContext.startup,
            uptime: Math.floor(process.uptime()),
            type: 'official-filesystem-server',
          },
          environment: {
            platform: process.platform,
            nodeVersion: process.version,
            hostname: os.hostname(),
            region: 'singapore',
            render: {
              deployment: process.env.RENDER_DEPLOYMENT_ID || 'local',
              service:
                process.env.RENDER_SERVICE_NAME || 'mcp-filesystem-server',
            },
          },
          ...(includeMetrics && { metrics: systemContext.metrics }),
          ...(includeLogs && {
            logs: {
              count: systemContext.logs.length,
              recent: systemContext.logs.slice(-5),
              levels: systemContext.logs.reduce((acc, log) => {
                acc[log.level] = (acc[log.level] || 0) + 1;
                return acc;
              }, {}),
            },
          }),
          vercelSync: systemContext.vercelSync,
        };

        addLog('info', 'Render 시스템 컨텍스트 조회 완료');

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(context, null, 2),
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

// 리소스 목록 제공 (공식 파일시스템 + 커스텀)
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const fsResources = await fileSystemServer.listResources();

  const customResources = [
    {
      uri: 'system://context',
      name: 'Render 시스템 컨텍스트',
      description: '전체 시스템 컨텍스트 및 메트릭',
      mimeType: 'application/json',
    },
    {
      uri: 'vercel://sync-status',
      name: 'Vercel 동기화 상태',
      description: 'Vercel과의 동기화 상태',
      mimeType: 'application/json',
    },
  ];

  return {
    resources: [...fsResources.resources, ...customResources],
  };
});

// 리소스 읽기 처리 (공식 파일시스템 + 커스텀)
server.setRequestHandler(ReadResourceRequestSchema, async request => {
  const { uri } = request.params;

  // 공식 파일시스템 서버 리소스들 위임
  if (uri.startsWith('file://')) {
    return await fileSystemServer.readResource(request);
  }

  // 커스텀 시스템 리소스들
  switch (uri) {
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
  addLog('info', 'OpenManager Vibe v5 공식 파일시스템 서버 시작 중...');
  addLog('info', '공식 MCP 파일시스템 서버 + Vercel 연동 기능 활성화');

  // 파일시스템 서버 초기화 (루트 디렉토리 설정)
  const rootPath = process.env.MCP_FILESYSTEM_ROOT || process.cwd();
  addLog('info', `파일시스템 루트 경로: ${rootPath}`);

  // 초기 메트릭 수집
  collectMetrics();

  const transport = new StdioServerTransport();
  await server.connect(transport);

  addLog('info', 'MCP 파일시스템 서버 준비 완료');
  addLog('info', '공식 파일시스템 도구 + Vercel 연동 도구 사용 가능');
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
  addLog('info', 'MCP 파일시스템 서버 종료 중...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  addLog('info', 'MCP 파일시스템 서버 종료 중...');
  process.exit(0);
});

// 서버 시작
main().catch(error => {
  addLog('error', 'MCP 파일시스템 서버 시작 실패', { error: error.message });
  process.exit(1);
});
