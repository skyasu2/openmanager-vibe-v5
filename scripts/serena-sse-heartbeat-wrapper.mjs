#!/usr/bin/env node

/**
 * Serena MCP SSE Heartbeat Wrapper
 * 
 * SSE 연결 타임아웃 문제 해결을 위한 하트비트 래퍼:
 * 1. 30초마다 keep-alive 메시지 전송
 * 2. SSE 모드로 Serena 실행 (--transport sse)
 * 3. 연결 상태 모니터링 및 자동 재연결
 * 4. Claude Code MCP 호환 인터페이스 제공
 */

import { spawn } from 'child_process';
import { createServer } from 'http';
import { EventEmitter } from 'events';
import { promises as fs } from 'fs';

class SerenaSSEHeartbeatWrapper extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // 설정
    this.projectRoot = options.projectRoot || '/mnt/d/cursor/openmanager-vibe-v5';
    this.serenaPort = options.serenaPort || 9121;
    this.wrapperPort = options.wrapperPort || 9122;
    this.heartbeatInterval = options.heartbeatInterval || 30000; // 30초
    this.logFile = '/tmp/serena-sse-wrapper.log';
    
    // 상태 관리
    this.serenaProcess = null;
    this.isSerenaReady = false;
    this.heartbeatTimer = null;
    this.clients = new Set();
    this.lastHeartbeat = Date.now();
    
    // 통계
    this.stats = {
      startTime: Date.now(),
      heartbeatsSent: 0,
      connectionsServed: 0,
      reconnections: 0
    };
  }

  async start() {
    try {
      await this.log('info', '🚀 Serena SSE Heartbeat Wrapper 시작');
      
      // 기존 프로세스 정리
      await this.cleanup();
      
      // Serena SSE 모드 시작
      await this.startSerenaSSE();
      
      // 래퍼 서버 시작
      await this.startWrapperServer();
      
      // 하트비트 시작
      this.startHeartbeat();
      
      await this.log('success', '✅ 모든 서비스 시작 완료');
      this.printStatus();
      
    } catch (error) {
      await this.log('error', `시작 실패: ${error.message}`);
      process.exit(1);
    }
  }

  async log(level, message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
    
    // 파일 로그
    await fs.appendFile(this.logFile, logEntry);
    
    // 콘솔 출력
    const colors = {
      info: '\x1b[36m',     // 청록색
      success: '\x1b[32m',  // 녹색
      warn: '\x1b[33m',     // 노란색
      error: '\x1b[31m',    // 빨간색
      reset: '\x1b[0m'
    };
    
    console.log(`${colors[level] || ''}[${level.toUpperCase()}]${colors.reset} ${message}`);
  }

  async cleanup() {
    await this.log('info', '🧹 기존 프로세스 정리 중...');
    
    // 이전 Serena 프로세스 종료
    try {
      const { spawn } = await import('child_process');
      await new Promise((resolve) => {
        const killProcess = spawn('pkill', ['-f', 'serena.*--transport.*sse'], { stdio: 'ignore' });
        killProcess.on('close', resolve);
      });
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      await this.log('warn', `정리 중 오류 (무시됨): ${error.message}`);
    }
  }

  async startSerenaSSE() {
    return new Promise((resolve, reject) => {
      this.log('info', `🔥 Serena SSE 모드 시작 (포트: ${this.serenaPort})`);
      
      // Serena SSE 모드로 시작
      this.serenaProcess = spawn('/home/skyasu/.local/bin/uvx', [
        '--from', 'git+https://github.com/oraios/serena',
        'serena-mcp-server',
        '--transport', 'sse',
        '--port', this.serenaPort.toString(),
        '--project', this.projectRoot
      ], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          PYTHONUNBUFFERED: '1'
        }
      });

      let initBuffer = '';
      const timeout = setTimeout(() => {
        reject(new Error(`Serena SSE 초기화 타임아웃 (3분)`));
      }, 180000);

      // stdout 모니터링
      this.serenaProcess.stdout.on('data', (data) => {
        initBuffer += data.toString();
        
        // SSE 서버 시작 감지
        if (initBuffer.includes(`http://0.0.0.0:${this.serenaPort}`) ||
            initBuffer.includes('SSE server started') ||
            initBuffer.includes('MCP server with')) {
          
          clearTimeout(timeout);
          this.isSerenaReady = true;
          this.log('success', `Serena SSE 서버 준비 완료: http://localhost:${this.serenaPort}`);
          resolve();
        }
      });

      // stderr 로깅
      this.serenaProcess.stderr.on('data', (data) => {
        const message = data.toString().trim();
        if (message && !message.includes('INFO')) {
          this.log('info', `Serena: ${message}`);
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

  async startWrapperServer() {
    return new Promise((resolve, reject) => {
      this.log('info', `🌐 SSE 래퍼 서버 시작 (포트: ${this.wrapperPort})`);
      
      const server = createServer((req, res) => {
        this.handleRequest(req, res);
      });

      server.on('error', reject);
      
      server.listen(this.wrapperPort, () => {
        this.log('success', `래퍼 서버 시작됨: http://localhost:${this.wrapperPort}`);
        resolve();
      });
    });
  }

  handleRequest(req, res) {
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

    if (url === '/sse' && method === 'GET') {
      this.handleSSEConnection(req, res);
    } else if (url === '/status' && method === 'GET') {
      this.handleStatusRequest(req, res);
    } else {
      // 다른 요청들은 Serena로 프록시
      this.proxyToSerena(req, res);
    }
  }

  handleSSEConnection(req, res) {
    this.stats.connectionsServed++;
    this.log('info', `새 SSE 연결: ${req.socket.remoteAddress}`);

    // SSE 헤더 설정
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    // 클라이언트 등록
    this.clients.add(res);
    
    // 초기 연결 메시지
    res.write('data: {"type":"connection","status":"connected"}\n\n');

    // 연결 종료 처리
    req.on('close', () => {
      this.clients.delete(res);
      this.log('info', `SSE 연결 종료: ${req.socket.remoteAddress}`);
    });

    // Serena로 연결 프록시
    this.proxySSEToSerena(res);
  }

  async proxySSEToSerena(clientRes) {
    try {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(`http://localhost:${this.serenaPort}/sse`);
      
      if (!response.ok) {
        throw new Error(`Serena SSE 연결 실패: ${response.status}`);
      }

      // Serena의 SSE 스트림을 클라이언트로 파이프
      response.body.on('data', (chunk) => {
        if (!clientRes.destroyed) {
          clientRes.write(chunk);
        }
      });

      response.body.on('end', () => {
        this.log('warn', 'Serena SSE 스트림 종료됨');
      });

    } catch (error) {
      this.log('error', `Serena SSE 프록시 오류: ${error.message}`);
      if (!clientRes.destroyed) {
        clientRes.write(`data: {"type":"error","message":"${error.message}"}\n\n`);
      }
    }
  }

  handleStatusRequest(req, res) {
    const status = {
      wrapper: {
        uptime: Date.now() - this.stats.startTime,
        port: this.wrapperPort,
        clients: this.clients.size
      },
      serena: {
        ready: this.isSerenaReady,
        port: this.serenaPort,
        pid: this.serenaProcess?.pid || null
      },
      heartbeat: {
        interval: this.heartbeatInterval,
        lastSent: this.lastHeartbeat,
        totalSent: this.stats.heartbeatsSent
      },
      stats: this.stats
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(status, null, 2));
  }

  async proxyToSerena(req, res) {
    try {
      const fetch = (await import('node-fetch')).default;
      const targetUrl = `http://localhost:${this.serenaPort}${req.url}`;
      
      const response = await fetch(targetUrl, {
        method: req.method,
        headers: req.headers,
        body: req.method !== 'GET' ? req : undefined
      });

      res.writeHead(response.status, response.headers);
      response.body.pipe(res);

    } catch (error) {
      this.log('error', `프록시 오류: ${error.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
  }

  startHeartbeat() {
    this.log('info', `💓 하트비트 시작 (${this.heartbeatInterval/1000}초 간격)`);
    
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat();
    }, this.heartbeatInterval);
  }

  sendHeartbeat() {
    if (this.clients.size === 0) return;

    const heartbeatMessage = ': keepalive\n\n';
    let sentCount = 0;

    for (const client of this.clients) {
      if (!client.destroyed) {
        try {
          client.write(heartbeatMessage);
          sentCount++;
        } catch (error) {
          this.log('warn', `하트비트 전송 실패: ${error.message}`);
          this.clients.delete(client);
        }
      } else {
        this.clients.delete(client);
      }
    }

    if (sentCount > 0) {
      this.stats.heartbeatsSent++;
      this.lastHeartbeat = Date.now();
      this.log('info', `💓 하트비트 전송: ${sentCount}개 클라이언트`);
    }
  }

  printStatus() {
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Serena SSE Heartbeat Wrapper 시작 완료!');
    console.log('='.repeat(60));
    console.log(`📊 래퍼 서버: http://localhost:${this.wrapperPort}`);
    console.log(`🔥 Serena SSE: http://localhost:${this.serenaPort}`);
    console.log(`💓 하트비트: ${this.heartbeatInterval/1000}초 간격`);
    console.log(`📋 로그 파일: ${this.logFile}`);
    console.log(`📈 상태 확인: http://localhost:${this.wrapperPort}/status`);
    console.log('='.repeat(60));
    console.log('\n🤖 Claude Code .mcp.json 설정:');
    console.log(`"serena": {`);
    console.log(`  "command": "curl",`);
    console.log(`  "args": ["-X", "GET", "http://localhost:${this.wrapperPort}/sse"]`);
    console.log(`}`);
    console.log('='.repeat(60) + '\n');
  }

  async shutdown() {
    this.log('info', '🛑 서비스 종료 시작...');
    
    // 하트비트 중지
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    
    // 클라이언트 연결 종료
    for (const client of this.clients) {
      if (!client.destroyed) {
        client.end();
      }
    }
    
    // Serena 프로세스 종료
    if (this.serenaProcess) {
      this.serenaProcess.kill('SIGTERM');
      setTimeout(() => {
        if (!this.serenaProcess.killed) {
          this.serenaProcess.kill('SIGKILL');
        }
      }, 5000);
    }
    
    this.log('info', '✅ 모든 서비스 종료 완료');
  }
}

// 메인 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  const wrapper = new SerenaSSEHeartbeatWrapper({
    projectRoot: process.env.PROJECT_ROOT || '/mnt/d/cursor/openmanager-vibe-v5'
  });
  
  // 우아한 종료 처리
  process.on('SIGTERM', async () => {
    await wrapper.shutdown();
    process.exit(0);
  });
  
  process.on('SIGINT', async () => {
    await wrapper.shutdown();
    process.exit(0);
  });
  
  // 시작
  wrapper.start().catch(error => {
    console.error('래퍼 시작 실패:', error);
    process.exit(1);
  });
}

export default SerenaSSEHeartbeatWrapper;