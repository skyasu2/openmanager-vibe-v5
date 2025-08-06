#!/usr/bin/env tsx

/**
 * 🧠 Smart Server Manager - 지능형 테스트 서버 관리 시스템
 * 
 * 리소스 기반 자동 시작/종료, 건강 체크, 자동 복구 기능을 제공합니다.
 */

import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { performance } from 'perf_hooks';
import * as os from 'os';

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// 서버 타입 정의
type ServerType = 'dev' | 'test' | 'e2e' | 'storybook';

interface ServerConfig {
  name: string;
  type: ServerType;
  command: string;
  args: string[];
  port: number;
  healthCheckUrl?: string;
  healthCheckInterval?: number; // ms
  autoStart?: boolean;
  autoShutdownMinutes?: number;
  memoryThreshold?: number; // MB
  cpuThreshold?: number; // %
}

interface ServerInstance {
  config: ServerConfig;
  process?: ChildProcess;
  pid?: number;
  startTime?: number;
  lastHealthCheck?: number;
  healthStatus?: 'healthy' | 'unhealthy' | 'unknown';
  restartCount: number;
  memoryUsage?: number;
  cpuUsage?: number;
}

interface SystemResources {
  memoryUsage: number; // percentage
  cpuUsage: number; // percentage
  availableMemory: number; // MB
  totalMemory: number; // MB
}

class SmartServerManager {
  private servers: Map<string, ServerInstance> = new Map();
  private monitoringInterval?: NodeJS.Timeout;
  private resourceCheckInterval?: NodeJS.Timeout;
  private logDir: string;

  constructor() {
    this.logDir = path.join(process.cwd(), 'logs');
    this.ensureLogDirectory();
    this.setupSignalHandlers();
  }

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private setupSignalHandlers(): void {
    process.on('SIGINT', () => this.shutdown('SIGINT'));
    process.on('SIGTERM', () => this.shutdown('SIGTERM'));
    process.on('exit', () => this.cleanup());
  }

  private log(level: 'info' | 'warn' | 'error' | 'success', message: string): void {
    const timestamp = new Date().toISOString();
    const color = {
      info: colors.blue,
      warn: colors.yellow,
      error: colors.red,
      success: colors.green,
    }[level];
    
    console.log(`${color}[${timestamp}] [${level.toUpperCase()}] ${message}${colors.reset}`);
    
    // 파일에도 로깅
    const logFile = path.join(this.logDir, `server-manager-${new Date().toISOString().split('T')[0]}.log`);
    fs.appendFileSync(logFile, `[${timestamp}] [${level.toUpperCase()}] ${message}\n`);
  }

  /**
   * 시스템 리소스 체크
   */
  private async getSystemResources(): Promise<SystemResources> {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsage = (usedMemory / totalMemory) * 100;

    // CPU 사용량 계산 (간단한 방식)
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    });

    const cpuUsage = 100 - Math.floor((totalIdle / totalTick) * 100);

    return {
      memoryUsage,
      cpuUsage,
      availableMemory: Math.floor(freeMemory / 1024 / 1024),
      totalMemory: Math.floor(totalMemory / 1024 / 1024),
    };
  }

  /**
   * 서버 시작 조건 체크
   */
  private async canStartServer(config: ServerConfig): Promise<{ canStart: boolean; reason?: string }> {
    const resources = await this.getSystemResources();

    // 메모리 체크
    if (resources.memoryUsage > 80) {
      return {
        canStart: false,
        reason: `Memory usage too high: ${resources.memoryUsage.toFixed(1)}% (threshold: 80%)`,
      };
    }

    // CPU 체크
    if (resources.cpuUsage > 70) {
      return {
        canStart: false,
        reason: `CPU usage too high: ${resources.cpuUsage}% (threshold: 70%)`,
      };
    }

    // 포트 체크
    const portInUse = await this.isPortInUse(config.port);
    if (portInUse) {
      return {
        canStart: false,
        reason: `Port ${config.port} is already in use`,
      };
    }

    return { canStart: true };
  }

  /**
   * 포트 사용 여부 체크
   */
  private async isPortInUse(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const net = require('net');
      const server = net.createServer();

      server.once('error', () => {
        resolve(true); // 포트 사용 중
      });

      server.once('listening', () => {
        server.close();
        resolve(false); // 포트 사용 가능
      });

      server.listen(port);
    });
  }

  /**
   * 서버 등록
   */
  public registerServer(config: ServerConfig): void {
    this.servers.set(config.name, {
      config,
      restartCount: 0,
    });

    this.log('info', `Server registered: ${config.name} (port: ${config.port})`);
  }

  /**
   * 서버 시작
   */
  public async startServer(name: string): Promise<boolean> {
    const server = this.servers.get(name);
    if (!server) {
      this.log('error', `Server not found: ${name}`);
      return false;
    }

    if (server.process && server.process.pid) {
      this.log('warn', `Server already running: ${name} (PID: ${server.process.pid})`);
      return false;
    }

    // 시작 조건 체크
    const { canStart, reason } = await this.canStartServer(server.config);
    if (!canStart) {
      this.log('error', `Cannot start server ${name}: ${reason}`);
      return false;
    }

    try {
      // 로그 파일 준비
      const logFile = path.join(this.logDir, `${name}-${Date.now()}.log`);
      const logStream = fs.createWriteStream(logFile, { flags: 'a' });

      // 프로세스 시작
      const childProcess = spawn(server.config.command, server.config.args, {
        stdio: ['inherit', 'pipe', 'pipe'],
        shell: true,
        env: {
          ...process.env,
          PORT: server.config.port.toString(),
          NODE_ENV: 'test',
        },
      });

      childProcess.stdout?.pipe(logStream);
      childProcess.stderr?.pipe(logStream);

      childProcess.stdout?.on('data', (data) => {
        if (process.env.VERBOSE) {
          console.log(`[${name}] ${data.toString().trim()}`);
        }
      });

      childProcess.stderr?.on('data', (data) => {
        console.error(`${colors.red}[${name}] ${data.toString().trim()}${colors.reset}`);
      });

      childProcess.on('exit', (code, signal) => {
        this.log('warn', `Server ${name} exited with code ${code} (signal: ${signal})`);
        this.handleServerExit(name);
      });

      // 서버 인스턴스 업데이트
      server.process = childProcess;
      server.pid = childProcess.pid;
      server.startTime = Date.now();
      server.healthStatus = 'unknown';

      this.log('success', `Server started: ${name} (PID: ${childProcess.pid})`);

      // 헬스체크 시작
      if (server.config.healthCheckUrl) {
        setTimeout(() => this.startHealthCheck(name), 5000); // 5초 후 헬스체크 시작
      }

      // 자동 종료 타이머 설정
      if (server.config.autoShutdownMinutes) {
        this.setupAutoShutdown(name, server.config.autoShutdownMinutes);
      }

      return true;
    } catch (error) {
      this.log('error', `Failed to start server ${name}: ${error}`);
      return false;
    }
  }

  /**
   * 서버 종료 처리
   */
  private async handleServerExit(name: string): Promise<void> {
    const server = this.servers.get(name);
    if (!server) return;

    server.process = undefined;
    server.pid = undefined;
    server.healthStatus = 'unknown';

    // 자동 재시작 (최대 3회)
    if (server.restartCount < 3) {
      server.restartCount++;
      this.log('info', `Attempting to restart server ${name} (attempt ${server.restartCount}/3)`);
      
      // 5초 대기 후 재시작
      setTimeout(() => {
        this.startServer(name);
      }, 5000);
    } else {
      this.log('error', `Server ${name} failed to restart after 3 attempts`);
    }
  }

  /**
   * 헬스체크
   */
  private async startHealthCheck(name: string): Promise<void> {
    const server = this.servers.get(name);
    if (!server || !server.config.healthCheckUrl) return;

    const interval = server.config.healthCheckInterval || 30000; // 기본 30초

    const checkHealth = async () => {
      if (!server.process || !server.process.pid) return;

      try {
        const http = require('http');
        const url = new URL(server.config.healthCheckUrl!);
        
        const options = {
          hostname: url.hostname,
          port: url.port || server.config.port,
          path: url.pathname,
          method: 'GET',
          timeout: 5000,
        };

        const req = http.request(options, (res: any) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            server.healthStatus = 'healthy';
            server.lastHealthCheck = Date.now();
            
            if (process.env.VERBOSE) {
              this.log('info', `Health check passed: ${name}`);
            }
          } else {
            server.healthStatus = 'unhealthy';
            this.log('warn', `Health check failed: ${name} (status: ${res.statusCode})`);
          }
        });

        req.on('error', (error: any) => {
          server.healthStatus = 'unhealthy';
          this.log('error', `Health check error for ${name}: ${error.message}`);
        });

        req.on('timeout', () => {
          req.destroy();
          server.healthStatus = 'unhealthy';
          this.log('warn', `Health check timeout: ${name}`);
        });

        req.end();
      } catch (error) {
        server.healthStatus = 'unhealthy';
        this.log('error', `Health check failed for ${name}: ${error}`);
      }
    };

    // 즉시 실행 후 주기적 실행
    await checkHealth();
    setInterval(checkHealth, interval);
  }

  /**
   * 자동 종료 설정
   */
  private setupAutoShutdown(name: string, minutes: number): void {
    setTimeout(() => {
      this.log('info', `Auto-shutdown triggered for ${name} after ${minutes} minutes`);
      this.stopServer(name);
    }, minutes * 60 * 1000);
  }

  /**
   * 서버 종료
   */
  public async stopServer(name: string): Promise<boolean> {
    const server = this.servers.get(name);
    if (!server || !server.process) {
      this.log('warn', `Server not running: ${name}`);
      return false;
    }

    try {
      // Graceful shutdown
      server.process.kill('SIGTERM');
      
      // 5초 대기
      await new Promise((resolve) => setTimeout(resolve, 5000));
      
      // 아직 살아있으면 강제 종료
      if (server.process.killed === false) {
        server.process.kill('SIGKILL');
      }

      this.log('success', `Server stopped: ${name}`);
      
      server.process = undefined;
      server.pid = undefined;
      server.healthStatus = 'unknown';
      server.restartCount = 0;
      
      return true;
    } catch (error) {
      this.log('error', `Failed to stop server ${name}: ${error}`);
      return false;
    }
  }

  /**
   * 모든 서버 상태 조회
   */
  public getStatus(): any {
    const status: any = {
      servers: {},
      resources: {},
    };

    this.servers.forEach((server, name) => {
      status.servers[name] = {
        running: !!server.process,
        pid: server.pid,
        port: server.config.port,
        healthStatus: server.healthStatus,
        uptime: server.startTime 
          ? Math.floor((Date.now() - server.startTime) / 1000) + 's'
          : null,
        restartCount: server.restartCount,
      };
    });

    return status;
  }

  /**
   * 리소스 모니터링 시작
   */
  public startMonitoring(intervalMs: number = 60000): void {
    this.resourceCheckInterval = setInterval(async () => {
      const resources = await this.getSystemResources();
      
      if (resources.memoryUsage > 85) {
        this.log('warn', `⚠️ High memory usage: ${resources.memoryUsage.toFixed(1)}%`);
        
        // 자동으로 불필요한 서버 종료
        this.servers.forEach((server, name) => {
          if (server.config.type === 'test' && server.process) {
            this.log('info', `Stopping ${name} to free memory`);
            this.stopServer(name);
          }
        });
      }
      
      if (resources.cpuUsage > 80) {
        this.log('warn', `⚠️ High CPU usage: ${resources.cpuUsage}%`);
      }
    }, intervalMs);
  }

  /**
   * 모니터링 중지
   */
  public stopMonitoring(): void {
    if (this.resourceCheckInterval) {
      clearInterval(this.resourceCheckInterval);
      this.resourceCheckInterval = undefined;
    }
  }

  /**
   * 전체 시스템 종료
   */
  private async shutdown(signal: string): Promise<void> {
    this.log('info', `Shutting down (${signal})...`);
    
    // 모든 서버 종료
    const stopPromises = Array.from(this.servers.keys()).map((name) => 
      this.stopServer(name)
    );
    
    await Promise.all(stopPromises);
    
    // 모니터링 중지
    this.stopMonitoring();
    
    this.log('success', 'All servers stopped');
    process.exit(0);
  }

  /**
   * 클린업
   */
  private cleanup(): void {
    // 임시 파일 정리 등
    this.log('info', 'Cleanup completed');
  }
}

// CLI 인터페이스
async function main() {
  const manager = new SmartServerManager();
  
  // 서버 구성 등록
  const servers: ServerConfig[] = [
    {
      name: 'dev-server',
      type: 'dev',
      command: 'npm',
      args: ['run', 'dev'],
      port: 3000,
      healthCheckUrl: 'http://localhost:3000/api/health',
      autoStart: true,
      memoryThreshold: 500,
    },
    {
      name: 'test-server',
      type: 'test',
      command: 'npm',
      args: ['run', 'test:watch'],
      port: 3001,
      autoStart: false,
      autoShutdownMinutes: 30,
    },
    {
      name: 'e2e-server',
      type: 'e2e',
      command: 'npm',
      args: ['run', 'test:e2e:server'],
      port: 3002,
      autoStart: false,
      autoShutdownMinutes: 15,
    },
  ];

  // 서버 등록
  servers.forEach(server => manager.registerServer(server));

  // CLI 명령어 파싱
  const command = process.argv[2];
  const serverName = process.argv[3];

  switch (command) {
    case 'start':
      if (serverName) {
        await manager.startServer(serverName);
      } else {
        // 자동 시작 서버들 시작
        for (const server of servers) {
          if (server.autoStart) {
            await manager.startServer(server.name);
          }
        }
      }
      break;

    case 'stop':
      if (serverName) {
        await manager.stopServer(serverName);
      } else {
        console.log('Please specify server name');
      }
      break;

    case 'status':
      const status = manager.getStatus();
      console.log(JSON.stringify(status, null, 2));
      break;

    case 'monitor':
      manager.startMonitoring(30000); // 30초마다 체크
      console.log('Monitoring started (Ctrl+C to stop)');
      
      // 상태 출력
      setInterval(() => {
        const status = manager.getStatus();
        console.clear();
        console.log('=== Server Status ===');
        console.log(JSON.stringify(status, null, 2));
      }, 5000);
      break;

    default:
      console.log(`
Smart Server Manager - Usage:
  tsx smart-server-manager.ts start [server-name]  # Start server(s)
  tsx smart-server-manager.ts stop <server-name>   # Stop server
  tsx smart-server-manager.ts status               # Show status
  tsx smart-server-manager.ts monitor              # Start monitoring
      `);
  }
}

// CLI로 실행된 경우만
if (require.main === module) {
  main().catch(console.error);
}

export { SmartServerManager };
export type { ServerConfig };