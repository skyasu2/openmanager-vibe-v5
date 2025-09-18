#!/usr/bin/env node

/**
 * Serena MCP Lightweight Proxy
 * 
 * 이 프록시는 Claude Code의 30초 타임아웃 문제를 해결합니다:
 * 1. 즉시 MCP handshake 응답 (< 100ms)
 * 2. 백그라운드에서 Serena 초기화
 * 3. 요청 큐잉으로 데이터 손실 방지
 * 4. 진행 상황 실시간 알림
 */

import { spawn, spawnSync } from 'child_process';
import { promises as fs } from 'fs';
import { EventEmitter } from 'events';
import { createWriteStream } from 'fs';
import path from 'path';
import os from 'os';

const userHome = process.env.HOME ?? os.homedir();
const defaultUvxPath = path.join(userHome, '.local', 'bin', 'uvx');

const resolvedUvx = (() => {
  const override = process.env.UVX_BIN_OVERRIDE || process.env.UVX_BIN;
  if (override) {
    return override;
  }

  try {
    const whichResult = spawnSync('which', ['uvx'], { encoding: 'utf-8' });
    if (whichResult.status === 0 && whichResult.stdout.trim()) {
      return whichResult.stdout.trim();
    }
  } catch (error) {
    // ignore, use fallback
  }

  return defaultUvxPath;
})();

class SerenaLightweightProxy extends EventEmitter {
  constructor() {
    super();
    
    // 설정
    this.projectRoot = '/mnt/d/cursor/openmanager-vibe-v5';
    this.logFile = '/tmp/serena-proxy.log';
    this.stateFile = '/tmp/serena-proxy-state.json';
    this.maxInitTime = 240000; // 4분
    
    // 상태 관리
    this.connectionState = 'disconnected';
    this.serenaProcess = null;
    this.requestQueue = [];
    this.responseHandlers = new Map();
    this.nextRequestId = 1;
    
    // 로깅 설정
    this.logger = createWriteStream(this.logFile, { flags: 'a' });
    
    // MCP 능력 정의 (Serena 25개 도구 사전 정의)
    this.capabilities = {
      tools: {
        "activate_project": {
          description: "Activate a project for analysis",
          inputSchema: {
            type: "object",
            properties: {
              project: { type: "string", description: "Project name or path" }
            },
            required: ["project"]
          }
        },
        "list_dir": {
          description: "List directory contents",
          inputSchema: {
            type: "object",
            properties: {
              relative_path: { type: "string", description: "Relative path from project root" },
              recursive: { type: "boolean", default: false }
            }
          }
        },
        "read_file": {
          description: "Read file contents",
          inputSchema: {
            type: "object",
            properties: {
              relative_path: { type: "string", description: "Relative path to file" },
              start_line: { type: "number", description: "Start line (1-indexed)" },
              end_line: { type: "number", description: "End line (1-indexed)" }
            },
            required: ["relative_path"]
          }
        },
        "create_text_file": {
          description: "Create a new text file",
          inputSchema: {
            type: "object",
            properties: {
              relative_path: { type: "string" },
              content: { type: "string" }
            },
            required: ["relative_path", "content"]
          }
        },
        "find_file": {
          description: "Find files by pattern",
          inputSchema: {
            type: "object",
            properties: {
              pattern: { type: "string", description: "Search pattern" },
              relative_path: { type: "string", description: "Directory to search in" }
            },
            required: ["pattern"]
          }
        },
        "replace_regex": {
          description: "Replace text using regex",
          inputSchema: {
            type: "object",
            properties: {
              relative_path: { type: "string" },
              pattern: { type: "string" },
              replacement: { type: "string" }
            },
            required: ["relative_path", "pattern", "replacement"]
          }
        },
        "search_for_pattern": {
          description: "Search for pattern in files",
          inputSchema: {
            type: "object",
            properties: {
              pattern: { type: "string" },
              relative_path: { type: "string" }
            },
            required: ["pattern"]
          }
        },
        "get_symbols_overview": {
          description: "Get overview of symbols in code",
          inputSchema: {
            type: "object",
            properties: {
              relative_path: { type: "string" }
            }
          }
        },
        "find_symbol": {
          description: "Find symbol in codebase",
          inputSchema: {
            type: "object",
            properties: {
              "name_path": { type: "string", description: "Symbol name or path" },
              "relative_path": { type: "string", description: "File to search in" }
            },
            required: ["name_path"]
          }
        },
        "find_referencing_symbols": {
          description: "Find symbols that reference given symbol",
          inputSchema: {
            type: "object",
            properties: {
              "name_path": { type: "string" },
              "relative_path": { type: "string" }
            },
            required: ["name_path"]
          }
        },
        "replace_symbol_body": {
          description: "Replace symbol body",
          inputSchema: {
            type: "object",
            properties: {
              "name_path": { type: "string" },
              "relative_path": { type: "string" },
              "new_body": { type: "string" }
            },
            required: ["name_path", "relative_path", "new_body"]
          }
        },
        "insert_after_symbol": {
          description: "Insert code after symbol",
          inputSchema: {
            type: "object",
            properties: {
              "name_path": { type: "string" },
              "relative_path": { type: "string" },
              "content": { type: "string" }
            },
            required: ["name_path", "relative_path", "content"]
          }
        },
        "insert_before_symbol": {
          description: "Insert code before symbol",
          inputSchema: {
            type: "object",
            properties: {
              "name_path": { type: "string" },
              "relative_path": { type: "string" },
              "content": { type: "string" }
            },
            required: ["name_path", "relative_path", "content"]
          }
        },
        "write_memory": {
          description: "Write to memory for context",
          inputSchema: {
            type: "object",
            properties: {
              "memory_name": { type: "string" },
              "content": { type: "string" }
            },
            required: ["memory_name", "content"]
          }
        },
        "read_memory": {
          description: "Read from memory",
          inputSchema: {
            type: "object",
            properties: {
              "memory_name": { type: "string" }
            },
            required: ["memory_name"]
          }
        },
        "list_memories": {
          description: "List all stored memories",
          inputSchema: { type: "object" }
        },
        "delete_memory": {
          description: "Delete memory",
          inputSchema: {
            type: "object",
            properties: {
              "memory_name": { type: "string" }
            },
            required: ["memory_name"]
          }
        },
        "execute_shell_command": {
          description: "Execute shell command",
          inputSchema: {
            type: "object",
            properties: {
              "command": { type: "string" }
            },
            required: ["command"]
          }
        },
        "switch_modes": {
          description: "Switch operation modes",
          inputSchema: {
            type: "object",
            properties: {
              "mode": { type: "string" }
            },
            required: ["mode"]
          }
        },
        "check_onboarding_performed": {
          description: "Check if onboarding was performed",
          inputSchema: { type: "object" }
        },
        "onboarding": {
          description: "Perform onboarding",
          inputSchema: { type: "object" }
        },
        "think_about_collected_information": {
          description: "Think about collected information",
          inputSchema: {
            type: "object",
            properties: {
              "query": { type: "string" }
            },
            required: ["query"]
          }
        },
        "think_about_task_adherence": {
          description: "Think about task adherence",
          inputSchema: {
            type: "object",
            properties: {
              "task": { type: "string" }
            },
            required: ["task"]
          }
        },
        "think_about_whether_you_are_done": {
          description: "Think about completion status",
          inputSchema: { type: "object" }
        },
        "prepare_for_new_conversation": {
          description: "Prepare for new conversation",
          inputSchema: { type: "object" }
        }
      }
    };
    
    // 초기화 시작
    this.initialize();
  }

  async initialize() {
    await this.log('info', '🚀 Serena Lightweight Proxy 시작');
    await this.saveState('starting', 'Proxy 초기화 중');
    
    // 즉시 MCP handshake 응답 설정
    this.setupStdinHandler();
    
    // 백그라운드에서 Serena 연결
    this.connectToSerenaAsync();
  }

  async log(level, message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
    this.logger.write(logEntry);
    
    // 중요한 로그는 stderr로도 출력 (Claude Code가 볼 수 있도록)
    if (level === 'error' || level === 'warn') {
      process.stderr.write(`[PROXY] ${message}\n`);
    }
  }

  async saveState(state, message, data = {}) {
    const stateData = {
      state,
      message,
      timestamp: new Date().toISOString(),
      connectionState: this.connectionState,
      queuedRequests: this.requestQueue.length,
      pid: this.serenaProcess?.pid || null,
      ...data
    };
    
    try {
      await fs.writeFile(this.stateFile, JSON.stringify(stateData, null, 2));
    } catch (error) {
      await this.log('error', `상태 저장 실패: ${error.message}`);
    }
  }

  setupStdinHandler() {
    let inputBuffer = '';
    
    process.stdin.on('data', (data) => {
      inputBuffer += data.toString();
      
      // JSON-RPC 메시지는 줄바꿈으로 구분
      const lines = inputBuffer.split('\n');
      inputBuffer = lines.pop() || ''; // 마지막 불완전한 라인 보존
      
      lines.forEach(line => {
        if (line.trim()) {
          try {
            const request = JSON.parse(line);
            this.handleRequest(request);
          } catch (error) {
            this.log('error', `요청 파싱 오류: ${error.message}, 라인: ${line}`);
          }
        }
      });
    });
  }

  async handleRequest(request) {
    await this.log('info', `요청 수신: ${request.method} (ID: ${request.id})`);
    
    if (request.method === 'initialize') {
      // 즉시 초기화 응답
      await this.sendImmediateHandshake(request.id);
      return;
    }

    if (request.method === 'tools/list') {
      // 도구 목록 즉시 응답
      this.sendResponse({
        jsonrpc: "2.0",
        id: request.id,
        result: {
          tools: Object.entries(this.capabilities.tools).map(([name, def]) => ({
            name,
            description: def.description,
            inputSchema: def.inputSchema
          }))
        }
      });
      return;
    }

    if (this.connectionState === 'connected') {
      // Serena가 준비된 경우 즉시 전달
      await this.forwardToSerena(request);
    } else {
      // 아직 준비되지 않은 경우 큐에 추가
      this.requestQueue.push(request);
      await this.log('info', `요청 큐에 추가: ${request.method} (큐 크기: ${this.requestQueue.length})`);
      
      // 도구 호출인 경우 진행 상황 알림
      if (request.method === 'tools/call') {
        this.sendProgressResponse(request.id, 
          `🔄 Serena 초기화 중... 현재 상태: ${this.connectionState}\n잠시만 기다려주세요 (최대 4분)`);
      }
    }
  }

  async sendImmediateHandshake(requestId) {
    const handshake = {
      jsonrpc: "2.0",
      id: requestId,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: {
          tools: {},  // 도구는 별도 tools/list에서 제공
          resources: {},
          prompts: {}
        },
        serverInfo: {
          name: "serena-lightweight-proxy",
          version: "1.0.0"
        }
      }
    };
    
    this.sendResponse(handshake);
    await this.log('info', '즉시 handshake 응답 전송 완료');
    await this.saveState('handshake_sent', 'Claude Code와 연결 완료');
  }

  async connectToSerenaAsync() {
    try {
      this.connectionState = 'connecting';
      await this.log('info', '🔄 Serena 백그라운드 연결 시작');
      await this.saveState('connecting', 'Serena 프로세스 시작 중');
      
      // Serena 프로세스 시작
      this.serenaProcess = spawn(resolvedUvx, [
        '--from', 'git+https://github.com/oraios/serena',
        'serena-mcp-server',
        '--project', this.projectRoot
      ], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          PYTHONUNBUFFERED: '1'
        }
      });

      await this.log('info', `Serena 프로세스 시작됨 (PID: ${this.serenaProcess.pid})`);
      
      // Serena 준비 대기
      await this.waitForSerenaReady();
      
      this.connectionState = 'connected';
      await this.log('info', '✅ Serena 연결 완료');
      await this.saveState('connected', 'Serena 준비 완료');
      
      // 대기 중인 요청들 처리
      await this.processQueuedRequests();
      
    } catch (error) {
      this.connectionState = 'error';
      await this.log('error', `Serena 연결 실패: ${error.message}`);
      await this.saveState('error', `연결 실패: ${error.message}`);
      
      // 큐에 있는 요청들에 에러 응답
      this.rejectQueuedRequests(error.message);
    }
  }

  async waitForSerenaReady() {
    return new Promise((resolve, reject) => {
      let buffer = '';
      let initMessages = [];
      
      const timeout = setTimeout(() => {
        reject(new Error(`Serena 초기화 타임아웃 (${this.maxInitTime/1000}초)`));
      }, this.maxInitTime);

      // stdout 데이터 처리
      this.serenaProcess.stdout.on('data', (data) => {
        buffer += data.toString();
        
        // 줄별로 처리
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        lines.forEach(line => {
          if (line.trim()) {
            try {
              const response = JSON.parse(line);
              
              // 초기화 응답 감지
              if (response.result && response.result.protocolVersion) {
                clearTimeout(timeout);
                this.setupSerenaResponseHandler();
                resolve();
                return;
              }
              
              initMessages.push(response);
            } catch (e) {
              // JSON이 아닌 로그 메시지일 수 있음
              if (line.includes('Starting MCP server') || 
                  line.includes('MCP server lifetime setup complete')) {
                this.log('info', `Serena: ${line}`);
              }
            }
          }
        });
      });

      // stderr 처리 (로그)
      this.serenaProcess.stderr.on('data', (data) => {
        const message = data.toString().trim();
        if (message) {
          this.log('info', `Serena stderr: ${message}`);
          
          // 초기화 완료 관련 메시지 감지
          if (message.includes('web dashboard started') ||
              message.includes('MCP server with') ||
              message.includes('tools:')) {
            // 추가 확인을 위해 잠시 대기
            setTimeout(() => {
              if (timeout._destroyed) return; // 이미 해결됨
              clearTimeout(timeout);
              this.setupSerenaResponseHandler();
              resolve();
            }, 2000);
          }
        }
      });

      this.serenaProcess.on('error', reject);
      this.serenaProcess.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`Serena 프로세스가 코드 ${code}로 종료됨`));
        }
      });
    });
  }

  setupSerenaResponseHandler() {
    let responseBuffer = '';
    
    this.serenaProcess.stdout.on('data', (data) => {
      responseBuffer += data.toString();
      
      const lines = responseBuffer.split('\n');
      responseBuffer = lines.pop() || '';
      
      lines.forEach(line => {
        if (line.trim()) {
          try {
            const response = JSON.parse(line);
            this.handleSerenaResponse(response);
          } catch (e) {
            this.log('warn', `Serena 응답 파싱 실패: ${e.message}, 라인: ${line}`);
          }
        }
      });
    });
  }

  handleSerenaResponse(response) {
    if (response.id && this.responseHandlers.has(response.id)) {
      // 대기 중인 요청에 대한 응답
      const handler = this.responseHandlers.get(response.id);
      handler(response);
      this.responseHandlers.delete(response.id);
    } else {
      // 알림이나 이벤트
      this.sendResponse(response);
    }
  }

  async forwardToSerena(request) {
    if (!this.serenaProcess || !this.serenaProcess.stdin.writable) {
      throw new Error('Serena 프로세스가 준비되지 않음');
    }

    // 요청을 Serena로 전달
    this.serenaProcess.stdin.write(JSON.stringify(request) + '\n');
    
    // 응답 핸들러 등록
    if (request.id) {
      this.responseHandlers.set(request.id, (response) => {
        this.sendResponse(response);
      });
    }
    
    await this.log('info', `Serena로 요청 전달: ${request.method} (ID: ${request.id})`);
  }

  async processQueuedRequests() {
    await this.log('info', `대기 중인 요청 ${this.requestQueue.length}개 처리 시작`);
    
    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      try {
        await this.forwardToSerena(request);
      } catch (error) {
        await this.log('error', `큐 요청 처리 실패: ${error.message}`);
        
        // 에러 응답 전송
        this.sendResponse({
          jsonrpc: "2.0",
          id: request.id,
          error: {
            code: -32603,
            message: `요청 처리 실패: ${error.message}`
          }
        });
      }
    }
    
    await this.log('info', '대기 큐 처리 완료');
  }

  rejectQueuedRequests(errorMessage) {
    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (request.id) {
        this.sendResponse({
          jsonrpc: "2.0",
          id: request.id,
          error: {
            code: -32603,
            message: `Serena 연결 실패: ${errorMessage}`
          }
        });
      }
    }
  }

  sendProgressResponse(requestId, message) {
    this.sendResponse({
      jsonrpc: "2.0",
      id: requestId,
      result: {
        content: [{
          type: "text",
          text: message
        }]
      }
    });
  }

  sendResponse(response) {
    process.stdout.write(JSON.stringify(response) + '\n');
  }

  // 정리 함수
  cleanup() {
    this.log('info', '프록시 정리 작업 시작');
    
    if (this.serenaProcess) {
      this.serenaProcess.kill('SIGTERM');
      setTimeout(() => {
        if (!this.serenaProcess.killed) {
          this.serenaProcess.kill('SIGKILL');
        }
      }, 5000);
    }
    
    if (this.logger) {
      this.logger.end();
    }
  }
}

// 메인 실행
const proxy = new SerenaLightweightProxy();

// 프로세스 종료 시 정리
process.on('SIGTERM', () => {
  proxy.cleanup();
  process.exit(0);
});

process.on('SIGINT', () => {
  proxy.cleanup();
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  proxy.log('error', `처리되지 않은 예외: ${error.message}`);
  proxy.cleanup();
  process.exit(1);
});

export default SerenaLightweightProxy;
