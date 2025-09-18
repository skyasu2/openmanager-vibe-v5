#!/usr/bin/env node

/**
 * Serena MCP Pre-warming Service
 * 
 * 시스템 레벨에서 Serena 인스턴스들을 미리 준비해두는 서비스:
 * 1. 시스템 부팅 시 자동 시작
 * 2. 다중 인스턴스 관리 (고가용성)
 * 3. 헬스체크 및 자동 복구
 * 4. 웹 대시보드로 모니터링
 * 5. 즉시 사용 가능한 인스턴스 제공
 */

import { spawn, spawnSync } from 'child_process';
import { promises as fs } from 'fs';
import { createServer } from 'http';
import { EventEmitter } from 'events';
import path from 'path';
import url from 'url';
import os from 'os';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    // ignore resolution errors and use fallback
  }

  return defaultUvxPath;
})();

class SerenaPrewarmingService extends EventEmitter {
  constructor() {
    super();
    
    // 설정
    this.projectRoot = '/mnt/d/cursor/openmanager-vibe-v5';
    this.maxInstances = 2;
    this.statusPort = 3101;
    this.logFile = '/tmp/serena-prewarming.log';
    
    // 상태 관리
    this.instances = new Map();
    this.instanceCounter = 0;
    this.isShuttingDown = false;
    
    // 헬스체크 설정
    this.healthCheckInterval = 30000; // 30초
    this.maxRestartAttempts = 3;
    this.restartCooldown = 60000; // 1분
    
    // 통계
    this.stats = {
      totalRequests: 0,
      successfulStarts: 0,
      failedStarts: 0,
      restarts: 0,
      lastHealthCheck: null
    };
  }

  async start() {
    try {
      await this.log('info', '🔥 Serena Pre-warming Service 시작');
      
      // 로그 파일 초기화
      await this.initializeLogging();
      
      // 기존 인스턴스 정리
      await this.cleanupExistingInstances();
      
      // 인스턴스들 사전 준비
      await this.prewarmInstances();
      
      // 상태 모니터링 서버 시작
      await this.startStatusServer();
      
      // 헬스체크 시작
      this.startHealthCheck();
      
      await this.log('info', '✅ Pre-warming Service 시작 완료');
      
    } catch (error) {
      await this.log('error', `서비스 시작 실패: ${error.message}`);
      process.exit(1);
    }
  }

  async initializeLogging() {
    const timestamp = new Date().toISOString();
    const logHeader = `\n=== Serena Pre-warming Service 시작: ${timestamp} ===\n`;
    await fs.appendFile(this.logFile, logHeader);
  }

  async log(level, message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
    
    // 파일에 로그
    await fs.appendFile(this.logFile, logEntry);
    
    // 콘솔에도 출력
    const coloredLevel = this.colorizeLevel(level);
    console.log(`[${timestamp}] ${coloredLevel} ${message}`);
  }

  colorizeLevel(level) {
    const colors = {
      info: '\x1b[36m[INFO]\x1b[0m',      // 청록색
      warn: '\x1b[33m[WARN]\x1b[0m',      // 노란색
      error: '\x1b[31m[ERROR]\x1b[0m',    // 빨간색
      success: '\x1b[32m[SUCCESS]\x1b[0m' // 녹색
    };
    return colors[level] || `[${level.toUpperCase()}]`;
  }

  async cleanupExistingInstances() {
    await this.log('info', '🧹 기존 Serena 인스턴스 정리 중...');
    
    try {
      // 이름으로 프로세스 종료
      const { spawn } = await import('child_process');
      await new Promise((resolve) => {
        const killProcess = spawn('pkill', ['-f', 'serena-mcp-server'], { stdio: 'ignore' });
        killProcess.on('close', resolve);
      });
      
      // 잠시 대기
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await this.log('info', '정리 완료');
      
    } catch (error) {
      await this.log('warn', `정리 중 오류 (무시됨): ${error.message}`);
    }
  }

  async prewarmInstances() {
    await this.log('info', `🚀 ${this.maxInstances}개 Serena 인스턴스 pre-warming 시작...`);
    
    const startPromises = [];
    
    for (let i = 0; i < this.maxInstances; i++) {
      const instanceId = `serena-${++this.instanceCounter}`;
      startPromises.push(this.createInstance(instanceId));
    }
    
    // 모든 인스턴스를 병렬로 시작
    const results = await Promise.allSettled(startPromises);
    
    // 결과 분석
    let successCount = 0;
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successCount++;
      } else {
        this.log('error', `인스턴스 ${index} 시작 실패: ${result.reason}`);
        this.stats.failedStarts++;
      }
    });
    
    await this.log('success', `🎉 ${successCount}/${this.maxInstances} 인스턴스 준비 완료`);
    this.stats.successfulStarts += successCount;
    
    if (successCount === 0) {
      throw new Error('모든 인스턴스 시작 실패');
    }
  }

  async createInstance(instanceId) {
    const startTime = Date.now();
    await this.log('info', `   📦 인스턴스 ${instanceId} 시작 중...`);
    
    return new Promise((resolve, reject) => {
      const serenaProcess = spawn(resolvedUvx, [
        '--from', 'git+https://github.com/oraios/serena',
        'serena-mcp-server',
        '--project', this.projectRoot
      ], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { 
          ...process.env, 
          SERENA_INSTANCE_ID: instanceId,
          PYTHONUNBUFFERED: '1'
        }
      });

      let initBuffer = '';
      let isReady = false;
      
      const timeout = setTimeout(() => {
        if (!isReady) {
          serenaProcess.kill('SIGKILL');
          reject(new Error(`인스턴스 ${instanceId} 초기화 타임아웃 (4분)`));
        }
      }, 240000); // 4분

      // stdout 모니터링
      serenaProcess.stdout.on('data', (data) => {
        initBuffer += data.toString();
        
        // 초기화 완료 감지
        if (initBuffer.includes('"protocolVersion"') || 
            initBuffer.includes('MCP server with')) {
          
          if (!isReady) {
            isReady = true;
            clearTimeout(timeout);
            
            const readyTime = Date.now() - startTime;
            const instance = {
              id: instanceId,
              process: serenaProcess,
              status: 'ready',
              createdAt: Date.now(),
              initTime: readyTime,
              lastUsed: null,
              restartAttempts: 0,
              lastRestart: null
            };
            
            this.instances.set(instanceId, instance);
            this.log('success', `   ✅ 인스턴스 ${instanceId} 준비 완료 (${readyTime}ms)`);
            resolve(instance);
          }
        }
      });

      // stderr 로깅
      serenaProcess.stderr.on('data', (data) => {
        const message = data.toString().trim();
        if (message && !message.includes('INFO') && !message.includes('DEBUG')) {
          this.log('warn', `${instanceId} stderr: ${message}`);
        }
      });

      // 프로세스 오류 처리
      serenaProcess.on('error', (error) => {
        if (!isReady) {
          clearTimeout(timeout);
          reject(error);
        }
      });

      serenaProcess.on('exit', (code, signal) => {
        if (!isReady) {
          clearTimeout(timeout);
          reject(new Error(`인스턴스 ${instanceId} 조기 종료 (코드: ${code}, 신호: ${signal})`));
        } else {
          // 실행 중인 인스턴스가 종료됨
          this.log('warn', `인스턴스 ${instanceId} 종료됨 (코드: ${code})`);
          this.handleInstanceFailure(instanceId);
        }
      });
    });
  }

  getAvailableInstance() {
    for (const [id, instance] of this.instances) {
      if (instance.status === 'ready') {
        instance.status = 'busy';
        instance.lastUsed = Date.now();
        this.stats.totalRequests++;
        this.log('info', `인스턴스 ${id} 할당됨`);
        return instance;
      }
    }
    return null;
  }

  releaseInstance(instanceId) {
    const instance = this.instances.get(instanceId);
    if (instance && instance.status === 'busy') {
      instance.status = 'ready';
      this.log('info', `인스턴스 ${instanceId} 해제됨`);
      return true;
    }
    return false;
  }

  async handleInstanceFailure(instanceId) {
    const instance = this.instances.get(instanceId);
    if (!instance) return;
    
    instance.status = 'failed';
    instance.restartAttempts++;
    
    if (instance.restartAttempts <= this.maxRestartAttempts) {
      await this.log('warn', `인스턴스 ${instanceId} 재시작 시도 ${instance.restartAttempts}/${this.maxRestartAttempts}`);
      
      // 쿨다운 대기
      setTimeout(async () => {
        try {
          const newInstance = await this.createInstance(instanceId);
          await this.log('success', `인스턴스 ${instanceId} 재시작 성공`);
          this.stats.restarts++;
        } catch (error) {
          await this.log('error', `인스턴스 ${instanceId} 재시작 실패: ${error.message}`);
          this.instances.delete(instanceId);
        }
      }, this.restartCooldown);
      
    } else {
      await this.log('error', `인스턴스 ${instanceId} 최대 재시작 횟수 초과, 제거됨`);
      this.instances.delete(instanceId);
      
      // 인스턴스가 부족하면 새로 생성
      if (this.instances.size < this.maxInstances && !this.isShuttingDown) {
        await this.createReplacementInstance();
      }
    }
  }

  async createReplacementInstance() {
    const newInstanceId = `serena-${++this.instanceCounter}`;
    await this.log('info', `교체 인스턴스 ${newInstanceId} 생성 중...`);
    
    try {
      await this.createInstance(newInstanceId);
      await this.log('success', `교체 인스턴스 ${newInstanceId} 생성 완료`);
    } catch (error) {
      await this.log('error', `교체 인스턴스 생성 실패: ${error.message}`);
    }
  }

  startHealthCheck() {
    setInterval(async () => {
      if (this.isShuttingDown) return;
      
      await this.performHealthCheck();
    }, this.healthCheckInterval);
    
    this.log('info', `🔍 헬스체크 시작 (${this.healthCheckInterval/1000}초 간격)`);
  }

  async performHealthCheck() {
    this.stats.lastHealthCheck = new Date().toISOString();
    await this.log('info', '🔍 헬스체크 수행 중...');
    
    let healthyCount = 0;
    let unhealthyCount = 0;
    
    for (const [id, instance] of this.instances) {
      if (instance.process && !instance.process.killed) {
        try {
          // 프로세스가 응답하는지 확인
          process.kill(instance.process.pid, 0);
          
          if (instance.status === 'failed') {
            instance.status = 'ready'; // 복구됨
            await this.log('info', `인스턴스 ${id} 복구 확인됨`);
          }
          
          healthyCount++;
          
        } catch (error) {
          await this.log('warn', `인스턴스 ${id} 헬스체크 실패: ${error.message}`);
          await this.handleInstanceFailure(id);
          unhealthyCount++;
        }
      } else {
        await this.log('warn', `인스턴스 ${id} 프로세스 없음`);
        await this.handleInstanceFailure(id);
        unhealthyCount++;
      }
    }
    
    await this.log('info', `헬스체크 완료: 정상 ${healthyCount}, 비정상 ${unhealthyCount}`);
    
    // 인스턴스가 부족하면 보충
    const targetCount = this.maxInstances;
    const currentCount = this.instances.size;
    
    if (currentCount < targetCount && !this.isShuttingDown) {
      const needed = targetCount - currentCount;
      await this.log('info', `${needed}개 인스턴스 부족, 보충 중...`);
      
      for (let i = 0; i < needed; i++) {
        await this.createReplacementInstance();
      }
    }
  }

  async startStatusServer() {
    const server = createServer(async (req, res) => {
      const urlPath = new URL(req.url, `http://${req.headers.host}`).pathname;
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      
      try {
        if (urlPath === '/status' || urlPath === '/') {
          const status = await this.getServiceStatus();
          res.writeHead(200);
          res.end(JSON.stringify(status, null, 2));
          
        } else if (urlPath === '/health') {
          const health = await this.getHealthStatus();
          res.writeHead(200);
          res.end(JSON.stringify(health, null, 2));
          
        } else if (urlPath === '/logs') {
          const logs = await this.getRecentLogs();
          res.writeHead(200);
          res.end(JSON.stringify({ logs }, null, 2));
          
        } else if (urlPath === '/dashboard') {
          const dashboard = this.generateDashboardHTML();
          res.setHeader('Content-Type', 'text/html');
          res.writeHead(200);
          res.end(dashboard);
          
        } else {
          res.writeHead(404);
          res.end(JSON.stringify({ error: 'Not Found' }));
        }
        
      } catch (error) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: error.message }));
      }
    });

    server.listen(this.statusPort, () => {
      this.log('success', `📊 상태 서버 시작: http://localhost:${this.statusPort}`);
      console.log(`\n🌐 대시보드: http://localhost:${this.statusPort}/dashboard`);
      console.log(`📈 상태 API: http://localhost:${this.statusPort}/status`);
      console.log(`💚 헬스체크: http://localhost:${this.statusPort}/health\n`);
    });

    return server;
  }

  async getServiceStatus() {
    const instances = {};
    
    for (const [id, instance] of this.instances) {
      instances[id] = {
        status: instance.status,
        createdAt: instance.createdAt,
        lastUsed: instance.lastUsed,
        initTime: instance.initTime,
        restartAttempts: instance.restartAttempts,
        pid: instance.process?.pid || null,
        killed: instance.process?.killed || false
      };
    }
    
    return {
      service: 'serena-prewarming',
      version: '1.0.0',
      uptime: process.uptime(),
      instances,
      stats: this.stats,
      config: {
        maxInstances: this.maxInstances,
        projectRoot: this.projectRoot,
        healthCheckInterval: this.healthCheckInterval
      }
    };
  }

  async getHealthStatus() {
    const readyInstances = Array.from(this.instances.values())
      .filter(i => i.status === 'ready').length;
    
    const totalInstances = this.instances.size;
    const isHealthy = readyInstances > 0;
    
    return {
      healthy: isHealthy,
      readyInstances,
      totalInstances,
      maxInstances: this.maxInstances,
      lastHealthCheck: this.stats.lastHealthCheck,
      availability: totalInstances > 0 ? (readyInstances / totalInstances * 100).toFixed(1) + '%' : '0%'
    };
  }

  async getRecentLogs() {
    try {
      const logContent = await fs.readFile(this.logFile, 'utf-8');
      const lines = logContent.split('\n').filter(line => line.trim());
      return lines.slice(-50); // 최근 50줄
    } catch (error) {
      return [`로그 읽기 실패: ${error.message}`];
    }
  }

  generateDashboardHTML() {
    return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Serena Pre-warming Service Dashboard</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
        .card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px; }
        .status-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
        .status-good { color: #28a745; }
        .status-warn { color: #ffc107; }
        .status-error { color: #dc3545; }
        .instance { border: 1px solid #e0e0e0; padding: 15px; border-radius: 8px; margin: 10px 0; }
        .refresh-btn { background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; }
        .refresh-btn:hover { background: #0056b3; }
        pre { background: #f8f9fa; padding: 15px; border-radius: 5px; overflow-x: auto; max-height: 300px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔥 Serena Pre-warming Service</h1>
            <p>WSL 환경에서 Serena MCP 인스턴스들을 사전 준비하여 즉시 사용 가능하게 합니다</p>
        </div>
        
        <div class="status-grid">
            <div class="card">
                <h3>📊 서비스 상태</h3>
                <div id="service-status">로딩 중...</div>
                <button class="refresh-btn" onclick="refreshData()">새로고침</button>
            </div>
            
            <div class="card">
                <h3>🏥 헬스 상태</h3>
                <div id="health-status">로딩 중...</div>
            </div>
        </div>
        
        <div class="card">
            <h3>🖥️ 인스턴스 목록</h3>
            <div id="instances">로딩 중...</div>
        </div>
        
        <div class="card">
            <h3>📋 최근 로그</h3>
            <pre id="logs">로딩 중...</pre>
        </div>
    </div>

    <script>
        async function fetchData(endpoint) {
            try {
                const response = await fetch(endpoint);
                return await response.json();
            } catch (error) {
                return { error: error.message };
            }
        }

        async function refreshData() {
            const [status, health, logs] = await Promise.all([
                fetchData('/status'),
                fetchData('/health'),
                fetchData('/logs')
            ]);

            // 서비스 상태
            document.getElementById('service-status').innerHTML = 
                \`<p><strong>업타임:</strong> \${Math.floor(status.uptime / 60)} 분</p>
                 <p><strong>총 요청:</strong> \${status.stats?.totalRequests || 0}</p>
                 <p><strong>성공/실패:</strong> \${status.stats?.successfulStarts || 0}/\${status.stats?.failedStarts || 0}</p>
                 <p><strong>재시작:</strong> \${status.stats?.restarts || 0}</p>\`;

            // 헬스 상태
            const healthClass = health.healthy ? 'status-good' : 'status-error';
            document.getElementById('health-status').innerHTML = 
                \`<p class="\${healthClass}"><strong>상태:</strong> \${health.healthy ? '정상' : '비정상'}</p>
                 <p><strong>가용 인스턴스:</strong> \${health.readyInstances}/\${health.totalInstances}</p>
                 <p><strong>가용률:</strong> \${health.availability}</p>
                 <p><strong>마지막 체크:</strong> \${health.lastHealthCheck || 'N/A'}</p>\`;

            // 인스턴스 목록
            let instancesHTML = '';
            if (status.instances) {
                for (const [id, instance] of Object.entries(status.instances)) {
                    const statusClass = instance.status === 'ready' ? 'status-good' : 
                                      instance.status === 'busy' ? 'status-warn' : 'status-error';
                    instancesHTML += 
                        \`<div class="instance">
                            <h4>\${id} <span class="\${statusClass}">[\${instance.status}]</span></h4>
                            <p><strong>PID:</strong> \${instance.pid || 'N/A'}</p>
                            <p><strong>생성시간:</strong> \${new Date(instance.createdAt).toLocaleString()}</p>
                            <p><strong>초기화 시간:</strong> \${instance.initTime}ms</p>
                            <p><strong>마지막 사용:</strong> \${instance.lastUsed ? new Date(instance.lastUsed).toLocaleString() : '미사용'}</p>
                            <p><strong>재시작 횟수:</strong> \${instance.restartAttempts}</p>
                        </div>\`;
                }
            }
            document.getElementById('instances').innerHTML = instancesHTML || '<p>인스턴스 없음</p>';

            // 로그
            document.getElementById('logs').textContent = logs.logs?.join('\\n') || '로그 없음';
        }

        // 초기 로딩
        refreshData();
        
        // 5초마다 자동 갱신
        setInterval(refreshData, 5000);
    </script>
</body>
</html>`;
  }

  async shutdown() {
    this.isShuttingDown = true;
    await this.log('info', '🛑 서비스 종료 시작...');
    
    // 모든 인스턴스 종료
    const shutdownPromises = [];
    for (const [id, instance] of this.instances) {
      if (instance.process && !instance.process.killed) {
        shutdownPromises.push(this.shutdownInstance(id, instance));
      }
    }
    
    await Promise.all(shutdownPromises);
    await this.log('info', '✅ 모든 인스턴스 종료 완료');
  }

  async shutdownInstance(id, instance) {
    await this.log('info', `인스턴스 ${id} 종료 중...`);
    
    // SIGTERM으로 정중하게 종료 시도
    instance.process.kill('SIGTERM');
    
    // 5초 후 강제 종료
    setTimeout(() => {
      if (!instance.process.killed) {
        instance.process.kill('SIGKILL');
        this.log('warn', `인스턴스 ${id} 강제 종료됨`);
      }
    }, 5000);
  }
}

// 메인 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  const service = new SerenaPrewarmingService();
  
  // 우아한 종료 처리
  process.on('SIGTERM', async () => {
    await service.shutdown();
    process.exit(0);
  });
  
  process.on('SIGINT', async () => {
    await service.shutdown();
    process.exit(0);
  });
  
  // 시작
  service.start().catch(error => {
    console.error('서비스 시작 실패:', error);
    process.exit(1);
  });
}

export default SerenaPrewarmingService;
