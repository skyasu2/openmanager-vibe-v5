#!/usr/bin/env node

/**
 * 간단한 서버 중복 실행 정리 스크립트
 * OpenManager Vibe v5 - 2025-07-01 19:48:00 (KST)
 */

/* eslint-disable */
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class SimpleServerCleanup {
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

    async checkPortUsage() {
        const ports = [3000, 6006, 8080, 9000];
        const results = {};

        console.log(`🔍 [${await this.getCurrentTime()}] 포트 사용 현황 확인 중...`);

        for (const port of ports) {
            try {
                const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
                results[port] = stdout.trim().length > 0;
                if (results[port]) {
                    console.log(`  📊 포트 ${port}: 사용 중`);
                }
            } catch (_) {
                results[port] = false;
            }
        }

        const busyPorts = Object.entries(results).filter(([, busy]) => busy);
        if (busyPorts.length === 0) {
            console.log(`  ✅ 모든 개발 포트 사용 안함`);
        }

        return results;
    }

    async getNodeProcesses() {
        try {
            const { stdout } = await execAsync('tasklist | findstr node.exe');
            const lines = stdout.trim().split('\n');

            const processes = lines.map(line => {
                const parts = line.trim().split(/\s+/);
                return {
                    name: parts[0],
                    pid: parts[1],
                    memory: parts[4] + ' K'
                };
            });

            console.log(`📋 [${await this.getCurrentTime()}] Node.js 프로세스 ${processes.length}개 발견:`);
            processes.forEach((proc, index) => {
                console.log(`  ${index + 1}. PID: ${proc.pid}, 메모리: ${proc.memory}`);
            });

            return processes;
        } catch (error) {
            console.log(`📋 [${await this.getCurrentTime()}] Node.js 프로세스 없음`);
            return [];
        }
    }

    async getMCPProcesses() {
        try {
            const { stdout } = await execAsync('wmic process where "name=\'node.exe\'" get processid,commandline /format:csv');
            const lines = stdout.trim().split('\n').slice(1);

            const mcpProcesses = lines.map(line => {
                const parts = line.split(',');
                if (parts.length >= 3) {
                    const commandLine = parts[1] || '';
                    const pid = parts[2] || '';

                    if (commandLine.includes('mcp') || commandLine.includes('duckduckgo') || commandLine.includes('tavily')) {
                        let type = 'Unknown MCP';
                        if (commandLine.includes('duckduckgo')) type = 'DuckDuckGo MCP';
                        else if (commandLine.includes('postgres')) type = 'PostgreSQL MCP';
                        else if (commandLine.includes('tavily')) type = 'Tavily MCP';
                        else if (commandLine.includes('github')) type = 'GitHub MCP';
                        else if (commandLine.includes('memory')) type = 'Memory MCP';

                        return { pid, type };
                    }
                }
                return null;
            }).filter(Boolean);

            if (mcpProcesses.length > 0) {
                console.log(`🤖 [${await this.getCurrentTime()}] MCP 서버 ${mcpProcesses.length}개 실행 중:`);
                mcpProcesses.forEach((proc, index) => {
                    console.log(`  ${index + 1}. ${proc.type} (PID: ${proc.pid})`);
                });
            } else {
                console.log(`🤖 [${await this.getCurrentTime()}] MCP 서버 없음`);
            }

            return mcpProcesses;
        } catch (error) {
            console.log(`🤖 [${await this.getCurrentTime()}] MCP 서버 확인 실패`);
            return [];
        }
    }

    async killProcessByPort(port) {
        try {
            console.log(`🔫 [${await this.getCurrentTime()}] 포트 ${port} 프로세스 종료 시도...`);

            // Windows에서 포트를 사용하는 프로세스 찾기
            const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
            const lines = stdout.trim().split('\n');

            for (const line of lines) {
                const parts = line.trim().split(/\s+/);
                const pid = parts[parts.length - 1];

                if (pid && !isNaN(pid)) {
                    try {
                        await execAsync(`taskkill /PID ${pid} /F`);
                        console.log(`  ✅ PID ${pid} 종료 완료`);
                    } catch (killError) {
                        console.log(`  ❌ PID ${pid} 종료 실패`);
                    }
                }
            }
        } catch (error) {
            console.log(`  ℹ️ 포트 ${port}에서 실행 중인 프로세스 없음`);
        }
    }

    async cleanupDevelopmentPorts() {
        console.log(`🧹 [${await this.getCurrentTime()}] 개발 포트 정리 시작...`);

        const devPorts = [3000, 6006]; // Next.js, Storybook

        for (const port of devPorts) {
            await this.killProcessByPort(port);
        }

        console.log(`✅ [${await this.getCurrentTime()}] 개발 포트 정리 완료`);
    }

    async performHealthCheck() {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`🏥 OpenManager Vibe v5 서버 상태 점검`);
        console.log(`⏰ ${await this.getCurrentTime()}`);
        console.log(`${'='.repeat(60)}\n`);

        // 1. 포트 사용 현황
        const portUsage = await this.checkPortUsage();

        // 2. Node.js 프로세스 확인
        const nodeProcesses = await this.getNodeProcesses();

        // 3. MCP 서버 확인
        const mcpProcesses = await this.getMCPProcesses();

        // 4. 요약
        console.log(`\n📊 [${await this.getCurrentTime()}] 상태 요약:`);
        console.log(`  - Node.js 프로세스: ${nodeProcesses.length}개`);
        console.log(`  - MCP 서버: ${mcpProcesses.length}개`);

        const busyPorts = Object.entries(portUsage).filter(([, busy]) => busy);
        if (busyPorts.length > 0) {
            console.log(`  - 사용 중인 포트: ${busyPorts.map(([port]) => port).join(', ')}`);
        } else {
            console.log(`  - 사용 중인 개발 포트: 없음`);
        }

        // 5. 권장사항
        if (nodeProcesses.length > 8) {
            console.log(`\n⚠️ [${await this.getCurrentTime()}] 권장사항:`);
            console.log(`  Node.js 프로세스가 ${nodeProcesses.length}개로 많습니다.`);
            console.log(`  불필요한 프로세스 정리를 권장합니다.`);
            console.log(`  사용법: npm run server:cleanup:dev`);
        }

        return {
            nodeProcesses: nodeProcesses.length,
            mcpProcesses: mcpProcesses.length,
            busyPorts,
            timestamp: await this.getCurrentTime()
        };
    }

    async safeDeveloperCleanup() {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`🛡️ 개발자 안전 모드 서버 정리`);
        console.log(`⏰ ${await this.getCurrentTime()}`);
        console.log(`${'='.repeat(60)}\n`);

        console.log(`ℹ️ 이 모드는 개발 포트(3000, 6006)만 정리합니다.`);
        console.log(`ℹ️ MCP 서버들은 그대로 유지됩니다.\n`);

        await this.cleanupDevelopmentPorts();

        // 정리 후 상태 확인
        console.log(`\n🔍 정리 후 상태 확인:`);
        await this.checkPortUsage();

        console.log(`\n✅ [${await this.getCurrentTime()}] 안전 정리 완료!`);
        console.log(`💡 이제 개발 서버를 시작할 수 있습니다:`);
        console.log(`   - Next.js: npm run dev`);
        console.log(`   - Storybook: npm run storybook`);
    }
}

// CLI 인터페이스
async function main() {
    const cleanup = new SimpleServerCleanup();
    const command = process.argv[2];

    switch (command) {
        case 'check':
        case 'status':
            try {
                await cleanup.performHealthCheck();
            } catch (error) {
                console.error('상태 점검 실패:', error.message);
                process.exit(1);
            }
            break;

        case 'cleanup':
        case 'clean':
            try {
                await cleanup.safeDeveloperCleanup();
            } catch (error) {
                console.error('정리 실패:', error.message);
                process.exit(1);
            }
            break;

        case 'ports':
            try {
                await cleanup.checkPortUsage();
            } catch (error) {
                console.error('포트 확인 실패:', error.message);
                process.exit(1);
            }
            break;

        default:
            console.log(`
🎯 OpenManager Vibe v5 간단 서버 정리 도구

사용법:
  node server-cleanup.js check    - 서버 상태 점검
  node server-cleanup.js cleanup  - 개발 포트 안전 정리 (3000, 6006)
  node server-cleanup.js ports    - 포트 사용 현황만 확인

안전 기능:
  ✅ 개발 포트만 정리 (MCP 서버 보호)
  ✅ 상세한 로깅
  ✅ 정리 전후 상태 비교

예시:
  npm run server:cleanup:check
  npm run server:cleanup:dev
      `);
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = SimpleServerCleanup; 