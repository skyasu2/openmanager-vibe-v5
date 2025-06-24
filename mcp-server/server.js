#!/usr/bin/env node

/**
 * 🗂️ 공식 MCP 파일시스템 서버 (Anthropic 권장 방식)
 * @modelcontextprotocol/server-filesystem 패키지 사용
 * 순수한 표준 MCP 파일시스템 서버 구현
 * + Render 배포를 위한 HTTP 헬스체크 서버 추가
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs/promises';
import http from 'http';
import path from 'path';

// 🌐 Render 배포를 위한 HTTP 서버 설정
const PORT = process.env.PORT || 10000;
const HTTP_ENABLED =
  process.env.NODE_ENV === 'production' || process.env.ENABLE_HTTP === 'true';

// 🗂️ 공식 MCP 파일시스템 서버 설정
const ALLOWED_DIRECTORIES = [
  process.cwd(), // 현재 작업 디렉토리
  path.join(process.cwd(), 'src'),
  path.join(process.cwd(), 'docs'),
  path.join(process.cwd(), 'mcp-server'),
  path.join(process.cwd(), 'config'),
];

// 로깅 함수 (최소한으로 유지)
function log(level, message, data = {}) {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
  if (Object.keys(data).length > 0) {
    console.error('  Data:', JSON.stringify(data, null, 2));
  }
}

// 경로 보안 검증
function isPathAllowed(filePath) {
  const resolvedPath = path.resolve(filePath);

  return ALLOWED_DIRECTORIES.some(allowedDir => {
    const resolvedAllowedDir = path.resolve(allowedDir);
    return resolvedPath.startsWith(resolvedAllowedDir);
  });
}

// 안전한 파일 읽기
async function safeReadFile(filePath) {
  if (!isPathAllowed(filePath)) {
    throw new Error(`접근이 허용되지 않은 경로입니다: ${filePath}`);
  }

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`파일을 찾을 수 없습니다: ${filePath}`);
    }
    if (error.code === 'EACCES') {
      throw new Error(`파일에 접근할 수 없습니다: ${filePath}`);
    }
    throw error;
  }
}

// 안전한 디렉토리 목록 조회
async function safeListDirectory(dirPath) {
  if (!isPathAllowed(dirPath)) {
    throw new Error(`접근이 허용되지 않은 경로입니다: ${dirPath}`);
  }

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    return entries.map(entry => ({
      name: entry.name,
      type: entry.isDirectory() ? 'directory' : 'file',
      path: path.join(dirPath, entry.name),
    }));
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`디렉토리를 찾을 수 없습니다: ${dirPath}`);
    }
    if (error.code === 'EACCES') {
      throw new Error(`디렉토리에 접근할 수 없습니다: ${dirPath}`);
    }
    throw error;
  }
}

// 🗂️ 순수 공식 MCP 파일시스템 서버 생성
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

// 📋 표준 MCP 파일시스템 도구 목록
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
        name: 'get_file_info',
        description: '파일 또는 디렉토리 정보를 조회합니다',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: '정보를 조회할 경로',
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'search_files',
        description: '파일 이름으로 검색합니다',
        inputSchema: {
          type: 'object',
          properties: {
            pattern: {
              type: 'string',
              description: '검색할 파일 패턴',
            },
            directory: {
              type: 'string',
              description: '검색할 디렉토리 (기본값: 현재 디렉토리)',
              default: '.',
            },
          },
          required: ['pattern'],
        },
      },
    ],
  };
});

// 🔧 표준 MCP 파일시스템 도구 실행
server.setRequestHandler(CallToolRequestSchema, async request => {
  const { name, arguments: args } = request.params;

  try {
    log('info', `MCP 도구 실행: ${name}`, { args });

    switch (name) {
      case 'read_file': {
        const { path: filePath } = args;
        const content = await safeReadFile(filePath);

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
        const entries = await safeListDirectory(dirPath);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  directory: dirPath,
                  entries,
                  count: entries.length,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'get_file_info': {
        const { path: filePath } = args;

        if (!isPathAllowed(filePath)) {
          throw new Error(`접근이 허용되지 않은 경로입니다: ${filePath}`);
        }

        const stats = await fs.stat(filePath);
        const info = {
          path: filePath,
          type: stats.isDirectory() ? 'directory' : 'file',
          size: stats.size,
          modified: stats.mtime.toISOString(),
          created: stats.birthtime.toISOString(),
          permissions: stats.mode.toString(8),
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(info, null, 2),
            },
          ],
        };
      }

      case 'search_files': {
        const { pattern, directory = '.' } = args;

        if (!isPathAllowed(directory)) {
          throw new Error(`접근이 허용되지 않은 경로입니다: ${directory}`);
        }

        const searchResults = [];

        async function searchRecursive(dir) {
          const entries = await fs.readdir(dir, { withFileTypes: true });

          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.name.includes(pattern)) {
              searchResults.push({
                name: entry.name,
                path: fullPath,
                type: entry.isDirectory() ? 'directory' : 'file',
              });
            }

            if (entry.isDirectory() && isPathAllowed(fullPath)) {
              await searchRecursive(fullPath);
            }
          }
        }

        await searchRecursive(directory);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  pattern,
                  directory,
                  results: searchResults,
                  count: searchResults.length,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      default:
        throw new Error(`지원되지 않는 도구: ${name}`);
    }
  } catch (error) {
    log('error', `도구 실행 오류: ${name}`, { error: error.message });

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

// 📚 표준 MCP 파일시스템 리소스 목록
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'file://project-root',
        name: '프로젝트 루트',
        description: '프로젝트 루트 디렉토리 구조',
        mimeType: 'application/json',
      },
      {
        uri: 'file://src-structure',
        name: 'src 디렉토리 구조',
        description: '소스 코드 디렉토리 구조',
        mimeType: 'application/json',
      },
      {
        uri: 'file://docs-structure',
        name: '문서 디렉토리 구조',
        description: '문서 디렉토리 구조',
        mimeType: 'application/json',
      },
    ],
  };
});

// 📖 표준 MCP 파일시스템 리소스 읽기
server.setRequestHandler(ReadResourceRequestSchema, async request => {
  const { uri } = request.params;

  try {
    switch (uri) {
      case 'file://project-root': {
        const entries = await safeListDirectory('.');
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(
                {
                  directory: '.',
                  entries,
                  timestamp: new Date().toISOString(),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'file://src-structure': {
        const srcPath = './src';
        if (
          await fs
            .access(srcPath)
            .then(() => true)
            .catch(() => false)
        ) {
          const entries = await safeListDirectory(srcPath);
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(
                  {
                    directory: srcPath,
                    entries,
                    timestamp: new Date().toISOString(),
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } else {
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(
                  {
                    error: 'src 디렉토리를 찾을 수 없습니다',
                    timestamp: new Date().toISOString(),
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }
      }

      case 'file://docs-structure': {
        const docsPath = './docs';
        if (
          await fs
            .access(docsPath)
            .then(() => true)
            .catch(() => false)
        ) {
          const entries = await safeListDirectory(docsPath);
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(
                  {
                    directory: docsPath,
                    entries,
                    timestamp: new Date().toISOString(),
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } else {
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(
                  {
                    error: 'docs 디렉토리를 찾을 수 없습니다',
                    timestamp: new Date().toISOString(),
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }
      }

      default:
        throw new Error(`지원되지 않는 리소스: ${uri}`);
    }
  } catch (error) {
    log('error', `리소스 읽기 오류: ${uri}`, { error: error.message });
    throw error;
  }
});

// 🌐 HTTP 헬스체크 서버 (Render 배포용)
function createHealthCheckServer() {
  const httpServer = http.createServer((req, res) => {
    const { method, url } = req;

    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    if (method === 'GET' && url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          status: 'healthy',
          service: 'openmanager-vibe-mcp-server',
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          allowedDirectories: ALLOWED_DIRECTORIES.length,
          tools: [
            'read_file',
            'list_directory',
            'get_file_info',
            'search_files',
          ],
          resources: ['project-root', 'src-structure', 'docs-structure'],
        })
      );
      return;
    }

    if (method === 'GET' && url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>OpenManager Vibe MCP Server</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
            .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #2563eb; }
            .status { background: #10b981; color: white; padding: 10px; border-radius: 5px; display: inline-block; }
            .info { background: #f3f4f6; padding: 15px; border-radius: 5px; margin: 10px 0; }
            ul { list-style-type: none; padding: 0; }
            li { background: #e5e7eb; margin: 5px 0; padding: 8px; border-radius: 3px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🗂️ OpenManager Vibe MCP Server</h1>
            <div class="status">✅ 서버가 정상 작동 중입니다</div>
            
            <div class="info">
              <h3>📋 지원되는 MCP 도구</h3>
              <ul>
                <li>read_file - 파일 내용 읽기</li>
                <li>list_directory - 디렉토리 목록 조회</li>
                <li>get_file_info - 파일 정보 조회</li>
                <li>search_files - 파일 검색</li>
              </ul>
            </div>

            <div class="info">
              <h3>📚 지원되는 MCP 리소스</h3>
              <ul>
                <li>file://project-root - 프로젝트 루트 구조</li>
                <li>file://src-structure - 소스 코드 구조</li>
                <li>file://docs-structure - 문서 구조</li>
              </ul>
            </div>

            <div class="info">
              <h3>🔗 API 엔드포인트</h3>
              <ul>
                <li><a href="/health">/health</a> - 헬스체크 (JSON)</li>
                <li><a href="/">/</a> - 서버 정보 (HTML)</li>
              </ul>
            </div>

            <p><strong>📝 참고:</strong> 이 서버는 표준 MCP 프로토콜을 사용하며, stdio 통신을 통해 작동합니다.</p>
            <p><strong>🔗 Anthropic MCP 권장 방식으로 구현됨</strong></p>
          </div>
        </body>
        </html>
      `);
      return;
    }

    // 404 처리
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        error: 'Not Found',
        message: `경로를 찾을 수 없습니다: ${url}`,
        availableEndpoints: ['/health', '/'],
      })
    );
  });

  return httpServer;
}

// 🚀 서버 시작
async function main() {
  log('info', '🗂️ 공식 MCP 파일시스템 서버 시작 중...');
  log('info', `📁 허용된 디렉토리: ${ALLOWED_DIRECTORIES.length}개`);
  log('info', `🔧 작업 디렉토리: ${process.cwd()}`);
  log(
    'info',
    '📋 표준 MCP 도구: read_file, list_directory, get_file_info, search_files'
  );
  log(
    'info',
    '📚 표준 MCP 리소스: project-root, src-structure, docs-structure'
  );

  // HTTP 서버 시작 (Render 배포용)
  if (HTTP_ENABLED) {
    const httpServer = createHealthCheckServer();
    httpServer.listen(PORT, () => {
      log('info', `🌐 HTTP 헬스체크 서버 시작: 포트 ${PORT}`);
      log('info', `🔗 헬스체크: http://localhost:${PORT}/health`);
    });
  }

  // MCP 서버 시작 (stdio 통신)
  const transport = new StdioServerTransport();
  await server.connect(transport);

  log('info', '✅ 공식 MCP 파일시스템 서버 준비 완료');
  log('info', '🔗 Anthropic 권장 방식으로 구현됨');

  if (HTTP_ENABLED) {
    log('info', '🌐 HTTP 헬스체크 서버도 함께 실행 중');
  }
}

// 오류 처리
process.on('uncaughtException', err => {
  log('error', '예상치 못한 오류', { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', err => {
  log('error', '처리되지 않은 Promise 거부', { error: err.message });
  process.exit(1);
});

// 종료 처리
process.on('SIGINT', () => {
  log('info', '🗂️ 공식 MCP 파일시스템 서버 종료 중...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('info', '🗂️ 공식 MCP 파일시스템 서버 종료 중...');
  process.exit(0);
});

// 서버 시작
main().catch(error => {
  log('error', '공식 MCP 파일시스템 서버 시작 실패', { error: error.message });
  process.exit(1);
});
