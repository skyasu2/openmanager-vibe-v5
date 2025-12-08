#!/usr/bin/env node

/**
 * 🧹 WSL2 포트 정리 유틸리티
 *
 * AI 교차검증 기반 포트 충돌 해결 솔루션
 * Codex (실무) + Gemini (아키텍처) + Qwen (성능) 통합
 */

const { exec, execSync } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// 로그 함수
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  title: (msg) => console.log(`${colors.cyan}🚀 ${msg}${colors.reset}`)
};

// 포트 정리 클래스
class WSLPortCleaner {
  constructor() {
    this.defaultPorts = [3000, 3001, 3002, 3003, 3004, 3005];
    this.processLog = [];
    this.startTime = Date.now();
  }

  /**
   * WSL 포트에서 실행 중인 프로세스 찾기
   */
  async findWSLProcesses(port) {
    try {
      const { stdout } = await execAsync(`lsof -ti:${port}`);
      const pids = stdout.trim().split('\n').filter(pid => pid);

      if (pids.length === 0) return [];

      const processes = [];

      for (const pid of pids) {
        try {
          const { stdout: processInfo } = await execAsync(`ps -p ${pid} -o pid,ppid,cmd --no-headers`);
          const [, , ...cmdParts] = processInfo.trim().split(/\s+/);
          const command = cmdParts.join(' ');

          processes.push({
            pid: parseInt(pid),
            port,
            command: command || 'Unknown',
            platform: 'WSL'
          });
        } catch (error) {
          // 프로세스가 이미 종료된 경우
          continue;
        }
      }

      return processes;
    } catch (error) {
      return [];
    }
  }

  /**
   * Windows 포트에서 실행 중인 프로세스 찾기
   */
  async findWindowsProcesses(port) {
    try {
      const { stdout } = await execAsync(`cmd.exe /c "netstat -ano | findstr :${port}"`);
      const lines = stdout.trim().split('\n');
      const processes = [];

      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 5) {
          const pid = parseInt(parts[parts.length - 1]);
          if (pid && pid > 1000) { // 시스템 프로세스 제외
            try {
              const { stdout: processName } = await execAsync(`cmd.exe /c "tasklist /FI \\"PID eq ${pid}\\" /FO CSV"`);
              const lines = processName.split('\n');
              const processLine = lines[1];
              if (processLine) {
                const name = processLine.split(',')[0].replace(/"/g, '');
                processes.push({
                  pid,
                  port,
                  command: name,
                  platform: 'Windows'
                });
              }
            } catch (error) {
              // 프로세스 정보 조회 실패
              continue;
            }
          }
        }
      }

      return processes;
    } catch (error) {
      return [];
    }
  }

  /**
   * 프로세스 종료
   */
  async killProcess(process) {
    try {
      if (process.platform === 'WSL') {
        await execAsync(`kill -9 ${process.pid}`);
      } else if (process.platform === 'Windows') {
        await execAsync(`cmd.exe /c "taskkill /PID ${process.pid} /F"`);
      }

      this.processLog.push({
        ...process,
        status: 'killed',
        timestamp: new Date().toISOString()
      });

      log.success(`${process.platform} PID ${process.pid} (${process.command}) 종료됨`);
      return true;
    } catch (error) {
      log.error(`프로세스 종료 실패 - PID: ${process.pid}, Error: ${error.message}`);
      this.processLog.push({
        ...process,
        status: 'kill_failed',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      return false;
    }
  }

  /**
   * 포트 검증 (실제로 사용 가능한지 확인)
   */
  async verifyPortCleaned(port) {
    return new Promise((resolve) => {
      const net = require('net');
      const server = net.createServer();

      server.once('error', () => {
        resolve(false);
      });

      server.once('listening', () => {
        server.close();
        resolve(true);
      });

      server.listen(port, '127.0.0.1');
    });
  }

  /**
   * 단일 포트 정리
   */
  async cleanPort(port) {
    log.info(`포트 ${port} 정리 시작`);

    // 1. WSL 프로세스 찾기 및 종료
    const wslProcesses = await this.findWSLProcesses(port);
    if (wslProcesses.length > 0) {
      log.warn(`WSL에서 포트 ${port} 사용 중인 프로세스 ${wslProcesses.length}개 발견`);
      for (const process of wslProcesses) {
        await this.killProcess(process);
      }
    }

    // 2. Windows 프로세스 찾기 및 종료
    const windowsProcesses = await this.findWindowsProcesses(port);
    if (windowsProcesses.length > 0) {
      log.warn(`Windows에서 포트 ${port} 사용 중인 프로세스 ${windowsProcesses.length}개 발견`);
      for (const process of windowsProcesses) {
        // Next.js, Node.js 관련 프로세스만 종료 (안전을 위해)
        if (process.command.toLowerCase().includes('node') ||
            process.command.toLowerCase().includes('next') ||
            process.command.toLowerCase().includes('npm')) {
          await this.killProcess(process);
        } else {
          log.warn(`안전을 위해 ${process.command} 프로세스는 건드리지 않음`);
        }
      }
    }

    // 3. 포트 정리 검증
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
    const isClean = await this.verifyPortCleaned(port);

    if (isClean) {
      log.success(`포트 ${port} 정리 완료 ✨`);
      return true;
    } else {
      log.error(`포트 ${port} 여전히 사용 중`);
      return false;
    }
  }

  /**
   * 여러 포트 정리
   */
  async cleanPorts(ports = this.defaultPorts) {
    log.title('WSL2 포트 충돌 해결 시스템 - AI 교차검증 기반');
    log.info(`정리할 포트: ${ports.join(', ')}`);

    const results = {};
    let successCount = 0;

    for (const port of ports) {
      const success = await this.cleanPort(port);
      results[port] = success;
      if (success) successCount++;
    }

    const elapsed = Date.now() - this.startTime;

    // 결과 요약
    console.log('\n📊 정리 결과 요약:');
    console.log('─'.repeat(50));

    for (const [port, success] of Object.entries(results)) {
      const status = success ? `${colors.green}✅ 성공${colors.reset}` : `${colors.red}❌ 실패${colors.reset}`;
      console.log(`포트 ${port}: ${status}`);
    }

    console.log('─'.repeat(50));
    log.success(`전체 ${ports.length}개 중 ${successCount}개 포트 정리 완료`);
    log.info(`소요 시간: ${elapsed}ms`);

    // 로그 파일 생성
    await this.saveLog();

    return results;
  }

  /**
   * 현재 포트 상태 조회
   */
  async getPortStatus(ports = this.defaultPorts) {
    log.info('포트 상태 조회 중...');

    const status = {};

    for (const port of ports) {
      const wslProcesses = await this.findWSLProcesses(port);
      const windowsProcesses = await this.findWindowsProcesses(port);
      const isAvailable = await this.verifyPortCleaned(port);

      status[port] = {
        available: isAvailable,
        wslProcesses: wslProcesses.length,
        windowsProcesses: windowsProcesses.length,
        processes: [...wslProcesses, ...windowsProcesses]
      };
    }

    return status;
  }

  /**
   * 상태를 테이블로 출력
   */
  displayPortStatus(status) {
    console.log('\n📊 현재 포트 상태:');
    console.log('─'.repeat(70));
    console.log('포트    상태        WSL    Windows   프로세스');
    console.log('─'.repeat(70));

    for (const [port, info] of Object.entries(status)) {
      const availableStatus = info.available ?
        `${colors.green}사용가능${colors.reset}` :
        `${colors.red}사용중${colors.reset}  `;

      const processes = info.processes.slice(0, 1)
        .map(p => `${p.command.substring(0, 20)}...`)
        .join(', ') || '-';

      console.log(`${port}      ${availableStatus}    ${info.wslProcesses}      ${info.windowsProcesses}         ${processes}`);
    }
    console.log('─'.repeat(70));
  }

  /**
   * 로그 파일 저장
   */
  async saveLog() {
    if (this.processLog.length === 0) return;

    const logDir = path.join(process.cwd(), 'logs');
    const logFile = path.join(logDir, `port-cleanup-${new Date().toISOString().slice(0, 10)}.json`);

    try {
      await fs.mkdir(logDir, { recursive: true });

      const logData = {
        timestamp: new Date().toISOString(),
        summary: {
          totalProcesses: this.processLog.length,
          killedProcesses: this.processLog.filter(p => p.status === 'killed').length,
          failedKills: this.processLog.filter(p => p.status === 'kill_failed').length,
          executionTime: Date.now() - this.startTime
        },
        processes: this.processLog
      };

      await fs.writeFile(logFile, JSON.stringify(logData, null, 2));
      log.info(`로그 파일 저장됨: ${logFile}`);
    } catch (error) {
      log.error(`로그 저장 실패: ${error.message}`);
    }
  }
}

// CLI 실행
async function main() {
  const args = process.argv.slice(2);
  const cleaner = new WSLPortCleaner();

  try {
    if (args.includes('--status') || args.includes('-s')) {
      // 포트 상태만 조회
      const status = await cleaner.getPortStatus();
      cleaner.displayPortStatus(status);
      return;
    }

    if (args.includes('--help') || args.includes('-h')) {
      console.log(`
🧹 WSL2 포트 정리 유틸리티 - AI 교차검증 기반

사용법:
  node cleanup-ports.js [옵션] [포트들...]

옵션:
  -s, --status     포트 상태만 조회 (정리 안 함)
  -h, --help       이 도움말 표시

예시:
  node cleanup-ports.js                    # 기본 포트들 정리
  node cleanup-ports.js 3000 3001 3002    # 특정 포트들 정리
  node cleanup-ports.js --status           # 상태만 조회
      `);
      return;
    }

    // 포트 지정 (인자에서 포트 추출)
    const customPorts = args
      .filter(arg => !arg.startsWith('-'))
      .map(port => parseInt(port))
      .filter(port => port > 0 && port < 65536);

    const ports = customPorts.length > 0 ? customPorts : undefined;

    // 포트 정리 실행
    const results = await cleaner.cleanPorts(ports);

    // 최종 상태 확인
    const finalStatus = await cleaner.getPortStatus(Object.keys(results).map(p => parseInt(p)));
    cleaner.displayPortStatus(finalStatus);

  } catch (error) {
    log.error(`실행 중 오류 발생: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// 스크립트로 직접 실행된 경우에만 main 함수 호출
if (require.main === module) {
  main();
}

module.exports = { WSLPortCleaner };