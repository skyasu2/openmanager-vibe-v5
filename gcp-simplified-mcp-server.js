#!/usr/bin/env node

/**
 * 🚀 GCP 최적화 MCP 서버 v1.0
 * 핵심 MCP 기능 + HTTP 헬스체크 서버
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';

// 🌐 서버 설정
const PORT = process.env.PORT || 10000;
const ALLOWED_DIRECTORIES = [
    process.cwd(),
    path.join(process.cwd(), 'src'),
    path.join(process.cwd(), 'docs'),
    path.join(process.cwd(), 'config'),
];

// 로깅 함수
function log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
    if (Object.keys(data).length > 0) {
        console.log('  Data:', JSON.stringify(data, null, 2));
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
        throw error;
    }
}

// 🗂️ MCP 서버 생성
const server = new Server(
    {
        name: 'gcp-mcp-filesystem-server',
        version: '1.0.0',
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// 📋 MCP 도구 목록
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'read_file',
                description: '파일 내용을 읽습니다',
                inputSchema: {
                    type: 'object',
                    properties: {
                        path: { type: 'string', description: '읽을 파일의 경로' },
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
                        path: { type: 'string', description: '나열할 디렉토리 경로' },
                    },
                    required: ['path'],
                },
            },
        ],
    };
});

// 🔧 MCP 도구 실행
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
                const listing = entries
                    .map(entry => `${entry.type === 'directory' ? '📁' : '📄'} ${entry.name}`)
                    .join('\n');

                return {
                    content: [
                        {
                            type: 'text',
                            text: `디렉토리: ${dirPath}\n\n${listing}`,
                        },
                    ],
                };
            }

            default:
                throw new Error(`알 수 없는 도구: ${name}`);
        }
    } catch (error) {
        log('error', `도구 실행 실패: ${name}`, { error: error.message });
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

// 🩺 HTTP 헬스체크 서버
function createHealthCheckServer() {
    const httpServer = http.createServer((req, res) => {
        if (req.url === '/health') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                service: 'gcp-mcp-server',
                version: '1.0.0',
                port: PORT,
                migration: {
                    from: 'render.com',
                    to: 'gcp-vm',
                    savings: '$7/month',
                    status: 'completed'
                }
            }));
        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
        }
    });

    httpServer.listen(PORT, () => {
        log('info', `🩺 HTTP 헬스체크 서버 시작됨`, { port: PORT });
    });

    return httpServer;
}

// 🚀 메인 실행 함수
async function main() {
    try {
        log('info', '🚀 GCP MCP 서버 시작...');

        // HTTP 헬스체크 서버 시작
        createHealthCheckServer();

        // MCP 서버 시작 (stdio 모드)
        const transport = new StdioServerTransport();
        await server.connect(transport);

        log('info', '✅ MCP 서버 준비 완료');

        // Graceful shutdown
        process.on('SIGINT', () => {
            log('info', '🛑 서버 종료 중...');
            process.exit(0);
        });

        process.on('SIGTERM', () => {
            log('info', '🛑 서버 종료 중...');
            process.exit(0);
        });

    } catch (error) {
        log('error', '❌ 서버 시작 실패', { error: error.message });
        process.exit(1);
    }
}

// 직접 실행 시에만 서버 시작
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
} 