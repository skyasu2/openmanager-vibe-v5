#!/usr/bin/env node

/**
 * OpenManager Vibe V5 - 서버 관리 스크립트
 * 포트 대역대 분리 및 서버 상태 관리
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// 포트 대역대 정의
const PORT_RANGES = {
  MAIN: 3000, // Next.js 메인 서버
  MCP: 3100, // 독립 MCP 서버
  TEST: [3200, 3299], // 테스트 서버 대역
  BACKUP: [3300, 3399], // 백업/대체 서버 대역
};

const SERVERS = {
  main: {
    name: 'Next.js Main Server',
    port: PORT_RANGES.MAIN,
    command: 'npm run dev',
    healthCheck: `http://localhost:${PORT_RANGES.MAIN}/api/health`,
    cwd: process.cwd(),
  },
  mcp: {
    name: 'MCP Server',
    port: PORT_RANGES.MCP,
    command: 'npm start',
    healthCheck: `http://localhost:${PORT_RANGES.MCP}/health`,
    cwd: path.join(process.cwd(), 'mcp-server'),
  },
  test: {
    name: 'Test Server',
    port: PORT_RANGES.TEST[0], // 3200부터 시작
    command: 'npm run dev:standalone',
    healthCheck: `http://localhost:${PORT_RANGES.TEST[0]}/api/health`,
    cwd: process.cwd(),
    env: { PORT: PORT_RANGES.TEST[0].toString() },
  },
};

class ServerManager {
  constructor() {
    this.runningProcesses = new Map();
    this.isWindows = process.platform === 'win32';
  }

  async checkPortInUse(port) {
    return new Promise(resolve => {
      const command = this.isWindows
        ? `netstat -ano | findstr ":${port}"`
        : `lsof -i :${port}`;

      exec(command, (error, stdout) => {
        resolve(!!stdout.trim());
      });
    });
  }

  async killProcessOnPort(port) {
    return new Promise(resolve => {
      if (this.isWindows) {
        exec(`netstat -ano | findstr ":${port}"`, (error, stdout) => {
          if (stdout) {
            const lines = stdout
              .split('\n')
              .filter(line => line.includes('LISTENING'));
            lines.forEach(line => {
              const pid = line.trim().split(/\s+/).pop();
              if (pid && pid !== '0') {
                exec(`taskkill /f /pid ${pid}`, () => {});
              }
            });
          }
          setTimeout(resolve, 1000);
        });
      } else {
        exec(`lsof -ti :${port} | xargs kill -9`, () => {
          setTimeout(resolve, 1000);
        });
      }
    });
  }

  async healthCheck(url) {
    return new Promise(resolve => {
      exec(`curl -f ${url}`, (error, stdout) => {
        resolve(!error && stdout);
      });
    });
  }

  async startServer(serverKey, force = false) {
    const server = SERVERS[serverKey];
    if (!server) {
      console.error(`❌ 알 수 없는 서버: ${serverKey}`);
      return false;
    }

    console.log(`\n🔍 ${server.name} 상태 확인 중...`);

    // 포트 사용 중인지 확인
    const portInUse = await this.checkPortInUse(server.port);

    if (portInUse) {
      if (force) {
        console.log(`🔧 포트 ${server.port}에서 기존 프로세스 종료 중...`);
        await this.killProcessOnPort(server.port);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        // 헬스체크로 서버가 정상 동작하는지 확인
        const isHealthy = await this.healthCheck(server.healthCheck);
        if (isHealthy) {
          console.log(
            `✅ ${server.name} 이미 정상 동작 중 (포트: ${server.port})`
          );
          return true;
        } else {
          console.log(
            `⚠️ 포트 ${server.port} 사용 중이지만 헬스체크 실패 - 재시작 중...`
          );
          await this.killProcessOnPort(server.port);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    console.log(`🚀 ${server.name} 시작 중... (포트: ${server.port})`);

    const env = {
      ...process.env,
      PORT: server.port.toString(),
      ...(server.env || {}),
    };

    const child = spawn('cmd', ['/c', server.command], {
      cwd: server.cwd,
      env,
      stdio: 'pipe',
      shell: true,
      detached: false,
    });

    this.runningProcesses.set(serverKey, child);

    // 로그 출력
    child.stdout.on('data', data => {
      console.log(`[${server.name}] ${data}`);
    });

    child.stderr.on('data', data => {
      console.error(`[${server.name}] ${data}`);
    });

    child.on('exit', code => {
      console.log(`[${server.name}] 프로세스 종료됨 (코드: ${code})`);
      this.runningProcesses.delete(serverKey);
    });

    // 시작 대기
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 헬스체크
    const isHealthy = await this.healthCheck(server.healthCheck);
    if (isHealthy) {
      console.log(`✅ ${server.name} 성공적으로 시작됨`);
      return true;
    } else {
      console.log(`❌ ${server.name} 헬스체크 실패`);
      return false;
    }
  }

  async checkAllServers() {
    console.log('\n📊 전체 서버 상태 점검\n');
    console.log('포트 대역대 분리:');
    console.log(`  - 메인 서버: ${PORT_RANGES.MAIN}`);
    console.log(`  - MCP 서버: ${PORT_RANGES.MCP}`);
    console.log(
      `  - 테스트 서버: ${PORT_RANGES.TEST[0]}-${PORT_RANGES.TEST[1]}`
    );
    console.log(
      `  - 백업 서버: ${PORT_RANGES.BACKUP[0]}-${PORT_RANGES.BACKUP[1]}\n`
    );

    const results = {};

    for (const [key, server] of Object.entries(SERVERS)) {
      const portInUse = await this.checkPortInUse(server.port);
      const isHealthy = portInUse
        ? await this.healthCheck(server.healthCheck)
        : false;

      results[key] = {
        name: server.name,
        port: server.port,
        portInUse,
        isHealthy,
        status: isHealthy ? '✅ 정상' : portInUse ? '⚠️ 응답없음' : '❌ 중지됨',
      };

      console.log(
        `${results[key].status} ${server.name} (포트: ${server.port})`
      );
    }

    return results;
  }

  async restartServer(serverKey) {
    console.log(`🔄 ${SERVERS[serverKey]?.name || serverKey} 재시작 중...`);
    return await this.startServer(serverKey, true);
  }

  async stopServer(serverKey) {
    const server = SERVERS[serverKey];
    if (!server) return;

    console.log(`🛑 ${server.name} 중지 중...`);
    await this.killProcessOnPort(server.port);

    if (this.runningProcesses.has(serverKey)) {
      const process = this.runningProcesses.get(serverKey);
      process.kill();
      this.runningProcesses.delete(serverKey);
    }
  }

  async stopAllServers() {
    console.log('🛑 모든 서버 중지 중...');
    for (const serverKey of Object.keys(SERVERS)) {
      await this.stopServer(serverKey);
    }
  }
}

// CLI 실행
async function main() {
  const manager = new ServerManager();
  const action = process.argv[2];
  const serverKey = process.argv[3];

  switch (action) {
    case 'status':
    case 'check':
      await manager.checkAllServers();
      break;

    case 'start':
      if (serverKey && SERVERS[serverKey]) {
        await manager.startServer(serverKey);
      } else {
        console.log('사용법: node server-manager.js start [main|mcp|test]');
      }
      break;

    case 'restart':
      if (serverKey && SERVERS[serverKey]) {
        await manager.restartServer(serverKey);
      } else {
        console.log('사용법: node server-manager.js restart [main|mcp|test]');
      }
      break;

    case 'stop':
      if (serverKey && SERVERS[serverKey]) {
        await manager.stopServer(serverKey);
      } else if (serverKey === 'all') {
        await manager.stopAllServers();
      } else {
        console.log('사용법: node server-manager.js stop [main|mcp|test|all]');
      }
      break;

    case 'auto':
      console.log('🤖 자동 서버 관리 모드');
      const status = await manager.checkAllServers();

      // 메인 서버가 중지되었거나 응답없으면 재시작
      if (!status.main.isHealthy) {
        await manager.restartServer('main');
      }

      // MCP 서버 상태 확인 및 재시작
      if (!status.mcp.isHealthy) {
        await manager.restartServer('mcp');
      }

      break;

    default:
      console.log(`
OpenManager Vibe V5 서버 관리 도구

사용법:
  node server-manager.js status           - 전체 서버 상태 확인
  node server-manager.js start [서버]     - 특정 서버 시작
  node server-manager.js restart [서버]   - 특정 서버 재시작
  node server-manager.js stop [서버|all]  - 서버 중지
  node server-manager.js auto             - 자동 관리 모드

서버 종류: main, mcp, test

포트 대역대:
  - 메인 서버: ${PORT_RANGES.MAIN}
  - MCP 서버: ${PORT_RANGES.MCP}  
  - 테스트 서버: ${PORT_RANGES.TEST[0]}-${PORT_RANGES.TEST[1]}
  - 백업 서버: ${PORT_RANGES.BACKUP[0]}-${PORT_RANGES.BACKUP[1]}
      `);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = ServerManager;
