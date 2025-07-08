#!/usr/bin/env node

/**
 * 서버 중복 실행 방지 및 자동 정리 시스템
 * OpenManager Vibe v5 - 2025-07-01 19:44:00 (KST)
 */

/* eslint-disable */
const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const execAsync = promisify(exec);

class ServerManager {
    constructor() {
        this.ports = {
            nextjs: 3000,
            storybook: 6006,
            api: 8080,
            websocket: 9000
        };

        this.lockDir = path.join(process.cwd(), '.server-locks');
        this.ensureLockDir();
    }

    ensureLockDir() {
        if (!fs.existsSync(this.lockDir)) {
            fs.mkdirSync(this.lockDir, { recursive: true });
        }
    }

    async getCurrentTime() {
        return new Date().toLocaleString('ko-KR', {
            timeZone: 'Asia/Seoul',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }) + ' (KST)';
    }

    async checkPortUsage(port) {
        try {
            const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
            return stdout.trim().length > 0;
        } catch (error) {
            return false;
        }
    }

    async getRunningNodeProcesses() {
        try {
            const { stdout } = await execAsync('tasklist | findstr node.exe');
            const lines = stdout.trim().split('\n');
            return lines.map(line => {
                const parts = line.trim().split(/\s+/);
                return {
                    name: parts[0],
                    pid: parts[1],
                    memory: parts[4]
                };
            });
        } catch (error) {
            return [];
        }
    }

    async getMCPProcesses() {
        try {
            const { stdout } = await execAsync('wmic process where "name=\'node.exe\'" get processid,commandline /format:csv');
            const lines = stdout.trim().split('\n').slice(1);

            return lines.map(line => {
                const parts = line.split(',');
                if (parts.length >= 3) {
                    const commandLine = parts[1] || '';
                    const pid = parts[2] || '';

                    if (commandLine.includes('mcp') || commandLine.includes('duckduckgo') || commandLine.includes('brave-search')) {
                        return {
                            pid,
                            type: this.identifyMCPType(commandLine),
                            commandLine: commandLine.substring(0, 100) + '...'
                        };
                    }
                }
                return null;
            }).filter(Boolean);
        } catch (error) {
            return [];
        }
    }

    identifyMCPType(commandLine) {
        if (commandLine.includes('duckduckgo')) return 'DuckDuckGo MCP';
        if (commandLine.includes('postgres')) return 'PostgreSQL MCP';
        if (commandLine.includes('brave-search')) return 'Brave Search MCP';
        if (commandLine.includes('github')) return 'GitHub MCP';
        if (commandLine.includes('memory')) return 'Memory MCP';
        return 'Unknown MCP';
    }

    async createServerLock(serverType, port, pid) {
        const lockFile = path.join(this.lockDir, `${serverType}.lock`);
        const lockData = {
            serverType,
            port,
            pid,
            startTime: await this.getCurrentTime(),
            lockFile: lockFile
        };

        fs.writeFileSync(lockFile, JSON.stringify(lockData, null, 2));
        return lockData;
    }

    async removeServerLock(serverType) {
        const lockFile = path.join(this.lockDir, `${serverType}.lock`);
        if (fs.existsSync(lockFile)) {
            fs.unlinkSync(lockFile);
            return true;
        }
        return false;
    }

    async getExistingLocks() {
        const locks = [];
        const lockFiles = fs.readdirSync(this.lockDir).filter(f => f.endsWith('.lock'));

        for (const file of lockFiles) {
            try {
                const lockData = JSON.parse(fs.readFileSync(path.join(this.lockDir, file), 'utf8'));
                locks.push(lockData);
            } catch (error) {
                // 손상된 락 파일 제거
                fs.unlinkSync(path.join(this.lockDir, file));
            }
        }

        return locks;
    }

    async isServerRunning(serverType) {
        const locks = await this.getExistingLocks();
        const lock = locks.find(l => l.serverType === serverType);

        if (!lock) return false;

        // PID가 실제로 실행 중인지 확인
        try {
            const { stdout } = await execAsync(`tasklist /FI "PID eq ${lock.pid}"`);
            return stdout.includes(lock.pid);
        } catch (error) {
            // 죽은 락 파일 제거
            await this.removeServerLock(serverType);
            return false;
        }
    }

    async killProcessByPid(pid) {
        try {
            await execAsync(`taskkill /PID ${pid} /F`);
            return true;
        } catch (error) {
            return false;
        }
    }

    async cleanupDeadProcesses() {
        console.log(`🧹 [${await this.getCurrentTime()}] 죽은 프로세스 정리 시작...`);

        const locks = await this.getExistingLocks();
        let cleanedCount = 0;

        for (const lock of locks) {
            try {
                const { stdout } = await execAsync(`tasklist /FI "PID eq ${lock.pid}"`);
                if (!stdout.includes(lock.pid)) {
                    await this.removeServerLock(lock.serverType);
                    cleanedCount++;
                    console.log(`  ❌ 죽은 프로세스 락 제거: ${lock.serverType} (PID: ${lock.pid})`);
                }
            } catch (error) {
                await this.removeServerLock(lock.serverType);
                cleanedCount++;
            }
        }

        console.log(`✅ [${await this.getCurrentTime()}] ${cleanedCount}개 죽은 프로세스 락 정리 완료`);
        return cleanedCount;
    }

    async startServer(serverType, command, options = {}) {
        const time = await this.getCurrentTime();
        console.log(`🚀 [${time}] ${serverType} 서버 시작 시도...`);

        // 중복 실행 확인
        if (await this.isServerRunning(serverType)) {
            console.log(`⚠️  [${time}] ${serverType} 서버가 이미 실행 중입니다.`);
            return false;
        }

        // 포트 사용 확인
        const port = options.port || this.ports[serverType.toLowerCase()];
        if (port && await this.checkPortUsage(port)) {
            console.log(`❌ [${time}] 포트 ${port}이 이미 사용 중입니다.`);
            return false;
        }

        try {
            const child = spawn(command, options.args || [], {
                stdio: options.stdio || 'inherit',
                shell: true,
                detached: options.detached || false
            });

            // 락 파일 생성
            await this.createServerLock(serverType, port, child.pid);

            console.log(`✅ [${time}] ${serverType} 서버 시작 완료 (PID: ${child.pid}, Port: ${port})`);
            return child;
        } catch (error) {
            console.error(`❌ [${time}] ${serverType} 서버 시작 실패:`, error.message);
            return false;
        }
    }

    async stopServer(serverType) {
        const time = await this.getCurrentTime();
        console.log(`🛑 [${time}] ${serverType} 서버 중지 시도...`);

        const locks = await this.getExistingLocks();
        const lock = locks.find(l => l.serverType === serverType);

        if (!lock) {
            console.log(`⚠️  [${time}] ${serverType} 서버가 실행 중이지 않습니다.`);
            return false;
        }

        const killed = await this.killProcessByPid(lock.pid);
        if (killed) {
            await this.removeServerLock(serverType);
            console.log(`✅ [${time}] ${serverType} 서버 중지 완료 (PID: ${lock.pid})`);
            return true;
        } else {
            console.log(`❌ [${time}] ${serverType} 서버 중지 실패 (PID: ${lock.pid})`);
            return false;
        }
    }

    async getServerStatus() {
        const time = await this.getCurrentTime();
        console.log(`📊 [${time}] 서버 상태 확인 중...`);

        const status = {
            timestamp: time,
            runningServers: await this.getExistingLocks(),
            nodeProcesses: await this.getRunningNodeProcesses(),
            mcpProcesses: await this.getMCPProcesses(),
            portUsage: {}
        };

        // 포트 사용 현황 확인
        for (const [name, port] of Object.entries(this.ports)) {
            status.portUsage[port] = await this.checkPortUsage(port);
        }

        return status;
    }

    async cleanup() {
        const time = await this.getCurrentTime();
        console.log(`🧹 [${time}] 전체 서버 정리 시작...`);

        await this.cleanupDeadProcesses();

        const mcpProcesses = await this.getMCPProcesses();
        console.log(`\n📋 현재 실행 중인 MCP 서버: ${mcpProcesses.length}개`);

        mcpProcesses.forEach((proc, index) => {
            console.log(`  ${index + 1}. ${proc.type} (PID: ${proc.pid})`);
        });

        const locks = await this.getExistingLocks();
        console.log(`\n🔒 활성 서버 락: ${locks.length}개`);

        locks.forEach((lock, index) => {
            console.log(`  ${index + 1}. ${lock.serverType} (PID: ${lock.pid}, Port: ${lock.port})`);
        });

        console.log(`\n✅ [${time}] 정리 작업 완료`);
    }
}

// CLI 인터페이스
async function main() {
    const serverManager = new ServerManager();
    const command = process.argv[2];
    const serverType = process.argv[3];

    switch (command) {
        case 'status':
            const status = await serverManager.getServerStatus();
            console.log(JSON.stringify(status, null, 2));
            break;

        case 'start':
            if (!serverType) {
                console.error('사용법: node server-manager.js start <서버타입>');
                process.exit(1);
            }

            if (serverType === 'nextjs') {
                await serverManager.startServer('NextJS', 'npm run dev', { port: 3000 });
            } else if (serverType === 'storybook') {
                await serverManager.startServer('Storybook', 'npm run storybook', { port: 6006 });
            }
            break;

        case 'stop':
            if (!serverType) {
                console.error('사용법: node server-manager.js stop <서버타입>');
                process.exit(1);
            }
            await serverManager.stopServer(serverType);
            break;

        case 'cleanup':
            await serverManager.cleanup();
            break;

        case 'watch':
            console.log('🔄 서버 감시 모드 시작...');
            setInterval(async () => {
                await serverManager.cleanupDeadProcesses();
            }, 30000); // 30초마다 정리
            break;

        default:
            console.log(`
🎯 OpenManager Vibe v5 서버 매니저

사용법:
  node server-manager.js status          - 서버 상태 확인
  node server-manager.js start nextjs    - Next.js 서버 시작
  node server-manager.js start storybook - Storybook 서버 시작
  node server-manager.js stop <서버>     - 서버 중지
  node server-manager.js cleanup         - 전체 정리
  node server-manager.js watch           - 감시 모드 (자동 정리)
      `);
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = ServerManager; 