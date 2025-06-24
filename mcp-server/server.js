#!/usr/bin/env node

/**
 * 🗂️ 공식 MCP 파일시스템 서버 (Anthropic 권장 방식)
 * @modelcontextprotocol/server-filesystem 패키지 사용
 * 순수한 표준 MCP 파일시스템 서버 구현
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
import path from 'path';

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

  const transport = new StdioServerTransport();
  await server.connect(transport);

  log('info', '✅ 공식 MCP 파일시스템 서버 준비 완료');
  log('info', '🔗 Anthropic 권장 방식으로 구현됨');
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
