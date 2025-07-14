#!/usr/bin/env node

/**
 * 서버 중복 실행 주기적 점검 시스템
 * OpenManager Vibe v5 - 2025-07-01 19:46:00 (KST)
 */

/* eslint-disable */
const fs = require('fs');
const cron = require('node-cron');
const path = require('path');
const ServerManager = require('./server-manager.js');

class ServerMonitor {
    constructor(options = {}) {
        this.serverManager = new ServerManager();
        this.logFile = path.join(process.cwd(), 'logs', 'server-monitor.log');
        this.alertThreshold = options.alertThreshold || 3; // 3번 연속 중복 발견시 알림
        this.checkInterval = options.checkInterval || '*/30 * * * * *'; // 30초마다 기본
        this.duplicateCount = 0;
        this.lastAlert = null;
        this.monitoringActive = false;

        this.ensureLogDir();
    }

    ensureLogDir() {
        const logDir = path.dirname(this.logFile);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
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

    async log(message, level = 'INFO') {
        const timestamp = await this.getCurrentTime();
        const logMessage = `[${timestamp}] ${level}: ${message}\n`;

        // 콘솔 출력
        console.log(logMessage.trim());

        // 🚨 베르셀 환경에서 파일 로깅 무력화 - 무료티어 최적화
        if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
            return;
        }

        // 파일 로깅 (개발 환경에서만)
        try {
            fs.appendFileSync(this.logFile, logMessage);
        } catch (error) {
            console.error('로그 파일 쓰기 실패:', error.message);
        }
    }

    async detectDuplicateProcesses() {
        const nodeProcesses = await this.serverManager.getRunningNodeProcesses();
        const duplicates = [];

        // 같은 포트를 사용하는 프로세스 찾기
        const portUsage = {};
        for (const [portName, port] of Object.entries(this.serverManager.ports)) {
            const isUsed = await this.serverManager.checkPortUsage(port);
            if (isUsed) {
                portUsage[port] = (portUsage[port] || 0) + 1;
                if (portUsage[port] > 1) {
                    duplicates.push({
                        type: 'port',
                        port: port,
                        portName: portName,
                        count: portUsage[port],
                        description: `포트 ${port}(${portName})에서 ${portUsage[port]}개 프로세스 감지`
                    });
                }
            }
        }

        // 같은 이름의 프로세스가 여러 개 실행 중인지 확인
        const processNames = {};
        nodeProcesses.forEach(proc => {
            processNames[proc.name] = (processNames[proc.name] || 0) + 1;
        });

        Object.entries(processNames).forEach(([name, count]) => {
            if (count > 2 && name === 'node.exe') { // node.exe는 2개 이상부터 의심
                duplicates.push({
                    type: 'process',
                    name: name,
                    count: count,
                    description: `${name} 프로세스 ${count}개 실행 중 (의심)`
                });
            }
        });

        return duplicates;
    }

    async performHealthCheck() {
        await this.log('🔍 서버 상태 점검 시작...', 'INFO');

        try {
            // 1. 중복 프로세스 감지
            const duplicates = await this.detectDuplicateProcesses();

            // 2. 죽은 프로세스 정리
            const cleanedCount = await this.serverManager.cleanupDeadProcesses();

            // 3. 서버 상태 확인
            const status = await this.serverManager.getServerStatus();

            // 4. 포트 사용 현황 확인
            const busyPorts = Object.entries(status.portUsage)
                .filter(([, isUsed]) => isUsed)
                .map(([port]) => port);

            // 결과 로깅
            if (duplicates.length > 0) {
                this.duplicateCount++;
                await this.log(`⚠️ 중복 실행 감지: ${duplicates.length}건`, 'WARN');

                duplicates.forEach(async (dup) => {
                    await this.log(`  - ${dup.description}`, 'WARN');
                });

                // 알림 조건 확인
                if (this.duplicateCount >= this.alertThreshold) {
                    await this.sendAlert(duplicates);
                }
            } else {
                this.duplicateCount = 0;
                await this.log(`✅ 중복 실행 없음 - 정상 상태`, 'INFO');
            }

            if (cleanedCount > 0) {
                await this.log(`🧹 죽은 프로세스 ${cleanedCount}개 정리 완료`, 'INFO');
            }

            if (busyPorts.length > 0) {
                await this.log(`📊 사용 중인 포트: ${busyPorts.join(', ')}`, 'INFO');
            }

            await this.log(`📋 Node.js 프로세스 ${status.nodeProcesses.length}개, MCP 서버 ${status.mcpProcesses.length}개 실행 중`, 'INFO');

            return {
                duplicates,
                cleanedCount,
                status,
                busyPorts
            };

        } catch (error) {
            await this.log(`❌ 상태 점검 실패: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    async sendAlert(duplicates) {
        const now = new Date();
        const timeSinceLastAlert = this.lastAlert ? (now - this.lastAlert) / 1000 / 60 : Infinity; // 분 단위

        // 30분 이내에 알림을 보낸 경우 스킵
        if (timeSinceLastAlert < 30) {
            await this.log(`🔕 최근 알림 발송으로 인해 알림 스킵 (${Math.round(timeSinceLastAlert)}분 전)`, 'INFO');
            return;
        }

        this.lastAlert = now;
        const alertMessage = `🚨 서버 중복 실행 알림 (${this.duplicateCount}번 연속 감지)\n` +
            `시간: ${await this.getCurrentTime()}\n` +
            `감지된 중복: ${duplicates.length}건\n` +
            duplicates.map(d => `- ${d.description}`).join('\n');

        await this.log(`📧 알림 발송: ${alertMessage}`, 'ALERT');

        // 추후 Slack, 이메일 등 실제 알림 시스템 연동 가능
        console.log('\n' + '='.repeat(60));
        console.log('🚨 ALERT: 서버 중복 실행 감지!');
        console.log('='.repeat(60));
        console.log(alertMessage);
        console.log('='.repeat(60) + '\n');
    }

    async startMonitoring() {
        if (this.monitoringActive) {
            await this.log('⚠️ 모니터링이 이미 실행 중입니다.', 'WARN');
            return;
        }

        this.monitoringActive = true;
        await this.log('🔄 서버 모니터링 시작...', 'INFO');
        await this.log(`📅 점검 주기: ${this.checkInterval}`, 'INFO');
        await this.log(`⚠️ 알림 임계값: ${this.alertThreshold}번 연속 중복 감지시`, 'INFO');

        // 즉시 한 번 점검
        await this.performHealthCheck();

        // 주기적 점검 시작
        const task = cron.schedule(this.checkInterval, async () => {
            if (this.monitoringActive) {
                try {
                    await this.performHealthCheck();
                } catch (error) {
                    await this.log(`점검 중 오류 발생: ${error.message}`, 'ERROR');
                }
            }
        });

        // 종료 시그널 처리
        process.on('SIGINT', async () => {
            await this.log('🛑 모니터링 종료 요청...', 'INFO');
            this.monitoringActive = false;
            task.stop();
            await this.log('✅ 모니터링 종료 완료', 'INFO');
            process.exit(0);
        });

        // 계속 실행
        await this.keepAlive();
    }

    async keepAlive() {
        while (this.monitoringActive) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    async generateReport() {
        await this.log('📊 서버 모니터링 보고서 생성 중...', 'INFO');

        const status = await this.serverManager.getServerStatus();
        const duplicates = await this.detectDuplicateProcesses();

        const report = {
            timestamp: await this.getCurrentTime(),
            summary: {
                totalNodeProcesses: status.nodeProcesses.length,
                totalMCPProcesses: status.mcpProcesses.length,
                activeLocks: status.runningServers.length,
                duplicatesDetected: duplicates.length,
                monitoringStatus: this.monitoringActive ? 'ACTIVE' : 'INACTIVE'
            },
            nodeProcesses: status.nodeProcesses,
            mcpProcesses: status.mcpProcesses,
            portUsage: status.portUsage,
            duplicates: duplicates,
            runningServers: status.runningServers
        };

        // 보고서 파일 저장
        const reportFile = path.join(process.cwd(), 'logs', `server-monitor-report-${new Date().toISOString().substring(0, 10)}.json`);
        fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

        await this.log(`📄 보고서 저장: ${reportFile}`, 'INFO');

        return report;
    }
}

// CLI 인터페이스
async function main() {
    const command = process.argv[2];
    const options = {};

    // 명령행 옵션 파싱
    if (process.argv.includes('--fast')) {
        options.checkInterval = '*/10 * * * * *'; // 10초마다
    }
    if (process.argv.includes('--slow')) {
        options.checkInterval = '*/2 * * * *'; // 2분마다
    }

    const monitor = new ServerMonitor(options);

    switch (command) {
        case 'start':
            await monitor.startMonitoring();
            break;

        case 'check':
            try {
                const result = await monitor.performHealthCheck();
                console.log('\n📊 점검 결과:');
                console.log(JSON.stringify(result, null, 2));
            } catch (error) {
                console.error('점검 실패:', error.message);
                process.exit(1);
            }
            break;

        case 'report':
            try {
                const report = await monitor.generateReport();
                console.log('\n📊 모니터링 보고서:');
                console.log(JSON.stringify(report, null, 2));
            } catch (error) {
                console.error('보고서 생성 실패:', error.message);
                process.exit(1);
            }
            break;

        case 'cleanup':
            try {
                await monitor.serverManager.cleanup();
            } catch (error) {
                console.error('정리 실패:', error.message);
                process.exit(1);
            }
            break;

        default:
            console.log(`
🎯 OpenManager Vibe v5 서버 모니터

사용법:
  node server-monitor.js start     - 주기적 모니터링 시작
  node server-monitor.js check     - 즉시 점검 실행
  node server-monitor.js report    - 상세 보고서 생성
  node server-monitor.js cleanup   - 서버 정리

옵션:
  --fast    - 빠른 점검 (10초마다)
  --slow    - 느린 점검 (2분마다)

예시:
  node server-monitor.js start --fast
  node server-monitor.js check
      `);
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = ServerMonitor; 