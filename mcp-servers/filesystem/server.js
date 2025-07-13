#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-unused-vars */

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
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';

// 🌐 Render 배포를 위한 HTTP 서버 설정
const PORT = process.env.PORT || 10000;
const HTTP_ENABLED =
  process.env.NODE_ENV === 'production' || process.env.ENABLE_HTTP === 'true';

// 🗂️ 공식 MCP 파일시스템 서버 설정
const ALLOWED_DIRECTORIES = [
  process.cwd(), // 현재 작업 디렉토리
  path.join(process.cwd(), 'src'),
  path.join(process.cwd(), 'docs'),
  path.join(process.cwd(), 'mcp-servers'),
  path.join(process.cwd(), 'config'),
];

// 헬스체크 캐싱 시스템 (과도한 헬스체크 방지)
const healthCache = new Map();
const HEALTH_CACHE_DURATION = 30000; // 30초 캐시

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
        const { path: dirPath = '.' } = args;
        const entries = await safeListDirectory(dirPath);

        const directoryList = entries
          .map(
            entry => `${entry.type === 'directory' ? '📁' : '📄'} ${entry.name}`
          )
          .join('\n');

        return {
          content: [
            {
              type: 'text',
              text: `디렉토리: ${dirPath}\n\n${directoryList}`,
            },
          ],
        };
      }

      case 'get_file_info': {
        const { path: targetPath } = args;

        if (!isPathAllowed(targetPath)) {
          throw new Error(`접근이 허용되지 않은 경로입니다: ${targetPath}`);
        }

        const stats = await fs.stat(targetPath);
        const info = {
          path: targetPath,
          type: stats.isDirectory() ? 'directory' : 'file',
          size: stats.size,
          modified: stats.mtime.toISOString(),
          created: stats.birthtime.toISOString(),
        };

        return {
          content: [
            {
              type: 'text',
              text: `파일 정보: ${targetPath}\n\n${JSON.stringify(info, null, 2)}`,
            },
          ],
        };
      }

      case 'search_files': {
        const { pattern, directory = '.' } = args;

        if (!isPathAllowed(directory)) {
          throw new Error(`접근이 허용되지 않은 경로입니다: ${directory}`);
        }

        const results = [];

        async function searchRecursive(dir) {
          try {
            const entries = await fs.readdir(dir, { withFileTypes: true });

            for (const entry of entries) {
              const fullPath = path.join(dir, entry.name);

              if (entry.name.includes(pattern)) {
                results.push({
                  name: entry.name,
                  path: fullPath,
                  type: entry.isDirectory() ? 'directory' : 'file',
                });
              }

              if (entry.isDirectory() && results.length < 50) {
                await searchRecursive(fullPath);
              }
            }
          } catch {
            // 권한 오류 등은 무시하고 계속 진행
          }
        }

        await searchRecursive(directory);

        const searchResults = results
          .map(
            result =>
              `${result.type === 'directory' ? '📁' : '📄'} ${result.name} (${result.path})`
          )
          .join('\n');

        return {
          content: [
            {
              type: 'text',
              text: `검색 결과: "${pattern}" in ${directory}\n\n${searchResults || '검색 결과가 없습니다.'}`,
            },
          ],
        };
      }

      default:
        throw new Error(`지원되지 않는 도구: ${name}`);
    }
  } catch (error) {
    log('error', `MCP 도구 실행 오류: ${name}`, { error: error.message });
    throw error;
  }
});

// 📚 표준 MCP 파일시스템 리소스 목록
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'file://project-root',
        name: '프로젝트 루트 구조',
        description: '프로젝트의 루트 디렉토리 구조',
        mimeType: 'application/json',
      },
      {
        uri: 'file://src-structure',
        name: '소스 코드 구조',
        description: 'src 디렉토리의 구조와 주요 파일들',
        mimeType: 'application/json',
      },
      {
        uri: 'file://docs-structure',
        name: '문서 구조',
        description: 'docs 디렉토리의 구조와 문서 파일들',
        mimeType: 'application/json',
      },
    ],
  };
});

// 📖 표준 MCP 파일시스템 리소스 읽기
server.setRequestHandler(ReadResourceRequestSchema, async request => {
  const { uri } = request.params;

  try {
    log('info', `MCP 리소스 읽기: ${uri}`);

    switch (uri) {
      case 'file://project-root': {
        try {
          const rootEntries = await safeListDirectory('.');
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(
                  {
                    name: '프로젝트 루트',
                    path: '.',
                    entries: rootEntries,
                    timestamp: new Date().toISOString(),
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error) {
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(
                  {
                    error: '프로젝트 루트를 읽을 수 없습니다',
                    message: error.message,
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

      case 'file://src-structure': {
        try {
          const srcPath = path.join(process.cwd(), 'src');
          const srcEntries = await safeListDirectory(srcPath);
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(
                  {
                    name: '소스 코드 구조',
                    path: srcPath,
                    entries: srcEntries,
                    timestamp: new Date().toISOString(),
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error) {
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(
                  {
                    error: 'src 디렉토리를 찾을 수 없습니다',
                    message: error.message,
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
        try {
          const docsPath = path.join(process.cwd(), 'docs');
          const docsEntries = await safeListDirectory(docsPath);
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(
                  {
                    name: '문서 구조',
                    path: docsPath,
                    entries: docsEntries,
                    timestamp: new Date().toISOString(),
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error) {
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

    // 경량 헬스체크 엔드포인트 (30초 캐시로 과도한 요청 방지)
    if (method === 'GET' && url === '/health') {
      const cached = healthCache.get('health');
      if (cached && Date.now() - cached.timestamp < HEALTH_CACHE_DURATION) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(cached.data));
        return;
      }

      const healthData = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
      };

      healthCache.set('health', {
        data: healthData,
        timestamp: Date.now(),
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(healthData));
      return;
    }

    // 상세 헬스체크 엔드포인트 (필요시에만 사용)
    if (method === 'GET' && url === '/health/detailed') {
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

    // MCP 도구 HTTP API 엔드포인트
    if (method === 'POST' && url.startsWith('/mcp/tools/')) {
      const toolName = url.replace('/mcp/tools/', '');

      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        try {
          const args = JSON.parse(body);
          log('info', `MCP HTTP API 호출: ${toolName}`, { args });

          let result;

          switch (toolName) {
            case 'list_directory': {
              const { path: dirPath = '.' } = args;
              const entries = await safeListDirectory(dirPath);
              result = {
                tool: 'list_directory',
                path: dirPath,
                entries,
                count: entries.length,
              };
              break;
            }

            case 'read_file': {
              const { path: filePath } = args;
              if (!filePath) {
                throw new Error('파일 경로가 필요합니다');
              }
              const content = await safeReadFile(filePath);
              result = {
                tool: 'read_file',
                path: filePath,
                content,
                size: content.length,
              };
              break;
            }

            case 'get_file_info': {
              const { path: targetPath } = args;
              if (!targetPath) {
                throw new Error('경로가 필요합니다');
              }

              if (!isPathAllowed(targetPath)) {
                throw new Error(
                  `접근이 허용되지 않은 경로입니다: ${targetPath}`
                );
              }

              const stats = await fs.stat(targetPath);
              result = {
                tool: 'get_file_info',
                path: targetPath,
                type: stats.isDirectory() ? 'directory' : 'file',
                size: stats.size,
                modified: stats.mtime.toISOString(),
                created: stats.birthtime.toISOString(),
              };
              break;
            }

            case 'search_files': {
              const { pattern, directory = '.' } = args;
              if (!pattern) {
                throw new Error('검색 패턴이 필요합니다');
              }

              if (!isPathAllowed(directory)) {
                throw new Error(
                  `접근이 허용되지 않은 경로입니다: ${directory}`
                );
              }

              const results = [];

              async function searchRecursive(dir) {
                try {
                  const entries = await fs.readdir(dir, {
                    withFileTypes: true,
                  });

                  for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);

                    if (entry.name.includes(pattern)) {
                      results.push({
                        name: entry.name,
                        path: fullPath,
                        type: entry.isDirectory() ? 'directory' : 'file',
                      });
                    }

                    if (entry.isDirectory() && results.length < 50) {
                      await searchRecursive(fullPath);
                    }
                  }
                } catch {
                  // 권한 오류 등은 무시하고 계속 진행
                }
              }

              await searchRecursive(directory);

              result = {
                tool: 'search_files',
                pattern,
                directory,
                results,
                count: results.length,
              };
              break;
            }

            default:
              throw new Error(`지원되지 않는 MCP 도구: ${toolName}`);
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              success: true,
              timestamp: new Date().toISOString(),
              ...result,
            })
          );
        } catch (error) {
          log('error', `MCP HTTP API 오류: ${toolName}`, {
            error: error.message,
          });
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              success: false,
              error: error.message,
              tool: toolName,
              timestamp: new Date().toISOString(),
            })
          );
        }
      });

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
            .api-endpoint { background: #dbeafe; border-left: 4px solid #3b82f6; }
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

            <div class="info api-endpoint">
              <h3>🛠️ MCP HTTP API 엔드포인트</h3>
              <ul>
                <li>POST /mcp/tools/list_directory - 디렉토리 목록</li>
                <li>POST /mcp/tools/read_file - 파일 읽기</li>
                <li>POST /mcp/tools/get_file_info - 파일 정보</li>
                <li>POST /mcp/tools/search_files - 파일 검색</li>
              </ul>
              <p><strong>사용법:</strong> Content-Type: application/json으로 POST 요청</p>
            </div>

            <p><strong>📝 참고:</strong> 이 서버는 표준 MCP 프로토콜(stdio)과 HTTP API를 모두 지원합니다.</p>
            <p><strong>🔗 Anthropic MCP 권장 방식 + HTTP API 확장</strong></p>
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
        availableEndpoints: [
          '/health',
          '/',
          '/mcp/tools/list_directory',
          '/mcp/tools/read_file',
          '/mcp/tools/get_file_info',
          '/mcp/tools/search_files',
        ],
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
      log('info', `🛠️ MCP HTTP API: http://localhost:${PORT}/mcp/tools/`);
    });
  }

  // MCP 서버 시작 (stdio 통신)
  const transport = new StdioServerTransport();
  await server.connect(transport);

  log('info', '✅ 공식 MCP 파일시스템 서버 준비 완료');
  log('info', '🔗 Anthropic 권장 방식으로 구현됨');

  if (HTTP_ENABLED) {
    log('info', '🌐 HTTP 헬스체크 서버도 함께 실행 중');
    log('info', '🛠️ MCP HTTP API 엔드포인트 활성화됨');
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
