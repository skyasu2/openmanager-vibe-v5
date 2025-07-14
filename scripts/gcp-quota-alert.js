#!/usr/bin/env node

import chalk from 'chalk';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * 🚨 GCP 무료 한도 실시간 알림 시스템
 * 
 * 개발 중 무료 한도 초과 위험 시 즉시 알림을 보내는 도구
 */

class GCPQuotaAlert {
    constructor() {
        this.project = process.env.GCP_PROJECT_ID || 'openmanager-ai';
        this.region = process.env.GCP_REGION || 'asia-northeast3';

        this.thresholds = {
            warning: 70,      // 70% 경고
            critical: 85,     // 85% 위험
            emergency: 95     // 95% 긴급
        };

        this.alertHistory = [];
        this.alertFile = path.join(process.cwd(), 'logs', 'gcp-alerts.json');
        this.lastAlertTime = {};

        this.ensureLogDirectory();
        this.loadAlertHistory();
    }

    /**
     * 🚨 알림 모니터링 시작
     */
    async startAlertMonitoring() {
        console.log(chalk.blue('\n🚨 GCP 무료 한도 알림 모니터링 시작'));
        console.log(chalk.gray(`📋 프로젝트: ${this.project}`));
        console.log(chalk.gray(`⚠️ 경고: ${this.thresholds.warning}% | 위험: ${this.thresholds.critical}% | 긴급: ${this.thresholds.emergency}%\n`));

        while (true) {
            try {
                await this.checkAndAlert();
                await this.sleep(15000); // 15초마다 체크
            } catch (error) {
                console.error(chalk.red('❌ 알림 모니터링 오류:'), error.message);
                await this.sleep(5000);
            }
        }
    }

    /**
     * 🎯 할당량 체크 및 알림 발송
     */
    async checkAndAlert() {
        const usage = await this.getCurrentUsage();

        // 각 서비스별 알림 체크
        await this.checkServiceAlerts('Cloud Functions - 호출', usage.cloudFunctions.invocations);
        await this.checkServiceAlerts('Cloud Functions - GB초', usage.cloudFunctions.gbSeconds);
        await this.checkServiceAlerts('Cloud Functions - 네트워크', usage.cloudFunctions.networkEgress);
        await this.checkServiceAlerts('Compute Engine - 인스턴스', usage.computeEngine.instances);
        await this.checkServiceAlerts('Cloud Storage - 저장소', usage.cloudStorage.storage);
        await this.checkServiceAlerts('Cloud Storage - 작업', usage.cloudStorage.operations);

        if (usage.firestore.enabled) {
            await this.checkServiceAlerts('Firestore - 읽기', usage.firestore.reads);
            await this.checkServiceAlerts('Firestore - 쓰기', usage.firestore.writes);
        }

        // 전체 사용량 체크
        const totalUsage = this.calculateTotalUsage(usage);
        await this.checkServiceAlerts('전체 사용량', {
            current: totalUsage,
            limit: 100,
            percentage: totalUsage
        });

        // 상태 출력
        this.displayAlertStatus(usage);
    }

    /**
     * ⚠️ 서비스별 알림 체크
     */
    async checkServiceAlerts(serviceName, usage) {
        const percentage = usage.percentage || 0;
        const alertKey = serviceName.replace(/\s+/g, '_').toLowerCase();

        // 중복 알림 방지 (같은 서비스는 5분 간격)
        const now = Date.now();
        const lastAlert = this.lastAlertTime[alertKey] || 0;
        const timeSinceLastAlert = now - lastAlert;

        if (timeSinceLastAlert < 300000) { // 5분
            return;
        }

        let alertLevel = null;
        let alertMessage = null;

        if (percentage >= this.thresholds.emergency) {
            alertLevel = 'emergency';
            alertMessage = `🚨 긴급: ${serviceName} 사용량 ${percentage.toFixed(1)}%`;
        } else if (percentage >= this.thresholds.critical) {
            alertLevel = 'critical';
            alertMessage = `⚠️ 위험: ${serviceName} 사용량 ${percentage.toFixed(1)}%`;
        } else if (percentage >= this.thresholds.warning) {
            alertLevel = 'warning';
            alertMessage = `💡 경고: ${serviceName} 사용량 ${percentage.toFixed(1)}%`;
        }

        if (alertLevel) {
            await this.sendAlert(alertLevel, alertMessage, serviceName, usage);
            this.lastAlertTime[alertKey] = now;
        }
    }

    /**
     * 📨 알림 발송
     */
    async sendAlert(level, message, serviceName, usage) {
        const alert = {
            timestamp: new Date().toISOString(),
            level,
            message,
            serviceName,
            usage: {
                current: usage.current,
                limit: usage.limit,
                percentage: usage.percentage
            },
            project: this.project,
            region: this.region
        };

        // 알림 히스토리에 추가
        this.alertHistory.push(alert);
        this.saveAlertHistory();

        // 콘솔 출력
        this.displayAlert(alert);

        // 시스템 알림 (Windows/Mac/Linux)
        await this.sendSystemNotification(alert);

        // 개발 도구 알림
        await this.sendDevelopmentAlert(alert);

        // 자동 최적화 제안
        await this.suggestOptimization(alert);
    }

    /**
     * 🖥️ 알림 콘솔 표시
     */
    displayAlert(alert) {
        const colors = {
            emergency: 'red',
            critical: 'yellow',
            warning: 'blue'
        };

        const color = colors[alert.level] || 'white';
        const timestamp = new Date(alert.timestamp).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

        console.log(chalk[color](`\n${alert.message}`));
        console.log(chalk.gray(`📅 ${timestamp}`));
        console.log(chalk.gray(`📊 ${alert.usage.current}/${alert.usage.limit} (${alert.usage.percentage.toFixed(1)}%)`));

        if (alert.level === 'emergency') {
            console.log(chalk.red('🚨 즉시 조치 필요!'));
            console.log(chalk.red('   1. GCP 콘솔에서 사용량 확인'));
            console.log(chalk.red('   2. 불필요한 리소스 정리'));
            console.log(chalk.red('   3. 자동 최적화 실행: npm run gcp:optimize'));
        }
    }

    /**
     * 🔔 시스템 알림 발송
     */
    async sendSystemNotification(alert) {
        try {
            const title = `GCP 무료 한도 알림`;
            const body = `${alert.message}\n프로젝트: ${this.project}`;

            // 운영체제별 알림 명령어
            let command;
            if (process.platform === 'win32') {
                // Windows - PowerShell 토스트 알림
                command = `powershell -Command "& {Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.MessageBox]::Show('${body}', '${title}', 'OK', 'Warning')}"`;
            } else if (process.platform === 'darwin') {
                // macOS - osascript 알림
                command = `osascript -e 'display notification "${body}" with title "${title}"'`;
            } else {
                // Linux - notify-send
                command = `notify-send "${title}" "${body}"`;
            }

            execSync(command, { stdio: 'ignore' });
        } catch (error) {
            console.warn(chalk.yellow('⚠️ 시스템 알림 발송 실패:'), error.message);
        }
    }

    /**
     * 🛠️ 개발 도구 알림
     */
    async sendDevelopmentAlert(alert) {
        // Visual Studio Code 알림 (확장 프로그램 연동)
        const vscodeAlert = {
            type: 'gcp-quota-alert',
            data: alert
        };

        const vscodeFile = path.join(process.cwd(), '.vscode', 'gcp-alerts.json');

        try {
            fs.writeFileSync(vscodeFile, JSON.stringify(vscodeAlert, null, 2));
            console.log(chalk.blue('📝 VS Code 알림 생성됨'));
        } catch (error) {
            console.warn(chalk.yellow('⚠️ VS Code 알림 생성 실패:'), error.message);
        }
    }

    /**
     * 💡 자동 최적화 제안
     */
    async suggestOptimization(alert) {
        const suggestions = this.getOptimizationSuggestions(alert.serviceName, alert.usage.percentage);

        if (suggestions.length > 0) {
            console.log(chalk.blue('\n💡 최적화 제안:'));
            suggestions.forEach((suggestion, index) => {
                console.log(chalk.blue(`   ${index + 1}. ${suggestion}`));
            });

            if (alert.level === 'emergency') {
                console.log(chalk.red('\n🚀 자동 최적화 실행:'));
                console.log(chalk.red('   npm run gcp:optimize'));
            }
        }
    }

    /**
     * 📋 최적화 제안 생성
     */
    getOptimizationSuggestions(serviceName, percentage) {
        const suggestions = [];

        if (serviceName.includes('Cloud Functions')) {
            suggestions.push('함수 메모리 사용량 최적화');
            suggestions.push('함수 타임아웃 설정 검토');
            suggestions.push('불필요한 함수 호출 최소화');

            if (percentage > 90) {
                suggestions.push('함수 병합 고려');
                suggestions.push('캐싱 전략 검토');
            }
        }

        if (serviceName.includes('Compute Engine')) {
            suggestions.push('VM 인스턴스 최적화');
            suggestions.push('불필요한 서비스 중지');
            suggestions.push('리소스 사용량 모니터링');

            if (percentage > 90) {
                suggestions.push('인스턴스 재시작 고려');
                suggestions.push('메모리 사용량 최적화');
            }
        }

        if (serviceName.includes('Cloud Storage')) {
            suggestions.push('임시 파일 정리');
            suggestions.push('로그 파일 압축');
            suggestions.push('오래된 백업 삭제');

            if (percentage > 90) {
                suggestions.push('파일 아카이빙');
                suggestions.push('중복 파일 제거');
            }
        }

        if (serviceName.includes('Firestore')) {
            suggestions.push('쿼리 최적화');
            suggestions.push('인덱스 정리');
            suggestions.push('불필요한 데이터 삭제');

            if (percentage > 90) {
                suggestions.push('데이터 아카이빙');
                suggestions.push('배치 작업 최적화');
            }
        }

        return suggestions;
    }

    /**
     * 📊 알림 상태 표시
     */
    displayAlertStatus(usage) {
        const timestamp = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

        console.log(chalk.gray(`\n📊 알림 상태 - ${timestamp}`));
        console.log(chalk.gray(`🔔 최근 알림: ${this.alertHistory.length}개`));

        // 최근 알림 표시 (최대 3개)
        const recentAlerts = this.alertHistory.slice(-3);
        recentAlerts.forEach(alert => {
            const color = alert.level === 'emergency' ? 'red' :
                alert.level === 'critical' ? 'yellow' : 'blue';
            console.log(chalk[color](`   ${alert.message}`));
        });

        // 전체 상태 요약
        const totalUsage = this.calculateTotalUsage(usage);
        if (totalUsage > this.thresholds.emergency) {
            console.log(chalk.red('🚨 전체 상태: 긴급'));
        } else if (totalUsage > this.thresholds.critical) {
            console.log(chalk.yellow('⚠️ 전체 상태: 위험'));
        } else if (totalUsage > this.thresholds.warning) {
            console.log(chalk.blue('💡 전체 상태: 경고'));
        } else {
            console.log(chalk.green('✅ 전체 상태: 정상'));
        }
    }

    /**
     * 📈 현재 사용량 조회
     */
    async getCurrentUsage() {
        // 실제로는 gcloud CLI나 API를 사용하여 실시간 데이터를 가져와야 함
        // 여기서는 시뮬레이션 데이터 사용
        return {
            cloudFunctions: {
                invocations: { current: 45000, limit: 2000000, percentage: 2.25 },
                gbSeconds: { current: 7500, limit: 400000, percentage: 1.875 },
                networkEgress: { current: 0.8, limit: 5, percentage: 16 }
            },
            computeEngine: {
                instances: { current: 1, limit: 1, percentage: 100 }
            },
            cloudStorage: {
                storage: { current: 0.8, limit: 5, percentage: 16 },
                operations: { current: 150, limit: 5000, percentage: 3 }
            },
            firestore: {
                enabled: false,
                reads: { current: 0, limit: 50000, percentage: 0 },
                writes: { current: 0, limit: 20000, percentage: 0 }
            }
        };
    }

    /**
     * 📊 전체 사용량 계산
     */
    calculateTotalUsage(usage) {
        let total = 0;
        let count = 0;

        // 주요 서비스 사용량 평균
        const services = [
            usage.cloudFunctions.invocations.percentage,
            usage.cloudFunctions.gbSeconds.percentage,
            usage.computeEngine.instances.percentage,
            usage.cloudStorage.storage.percentage
        ];

        services.forEach(percentage => {
            if (percentage > 0) {
                total += percentage;
                count++;
            }
        });

        return count > 0 ? total / count : 0;
    }

    /**
     * 💾 알림 히스토리 관리
     */
    saveAlertHistory() {
        // 최근 100개 알림만 보관
        if (this.alertHistory.length > 100) {
            this.alertHistory = this.alertHistory.slice(-100);
        }

        fs.writeFileSync(this.alertFile, JSON.stringify(this.alertHistory, null, 2));
    }

    loadAlertHistory() {
        try {
            if (fs.existsSync(this.alertFile)) {
                const data = fs.readFileSync(this.alertFile, 'utf8');
                this.alertHistory = JSON.parse(data);
            }
        } catch (error) {
            console.warn(chalk.yellow('⚠️ 알림 히스토리 로드 실패:'), error.message);
            this.alertHistory = [];
        }
    }

    ensureLogDirectory() {
        const logDir = path.dirname(this.alertFile);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }

        const vscodeDir = path.join(process.cwd(), '.vscode');
        if (!fs.existsSync(vscodeDir)) {
            fs.mkdirSync(vscodeDir, { recursive: true });
        }
    }

    /**
     * 🛠️ 유틸리티 함수
     */
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// CLI 실행
const alertSystem = new GCPQuotaAlert();
const command = process.argv[2];

switch (command) {
    case 'monitor':
        alertSystem.startAlertMonitoring();
        break;
    case 'test':
        // 테스트 알림 발송
        alertSystem.sendAlert('warning', '테스트 알림', 'Test Service', {
            current: 80,
            limit: 100,
            percentage: 80
        });
        break;
    default:
        console.log(chalk.blue('🚨 GCP 무료 한도 알림 시스템'));
        console.log(chalk.gray('사용법:'));
        console.log(chalk.gray('  npm run gcp:alert         # 알림 모니터링 시작'));
        console.log(chalk.gray('  npm run gcp:alert test    # 테스트 알림 발송'));
        break;
} 