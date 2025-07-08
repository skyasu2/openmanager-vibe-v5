#!/usr/bin/env node

import chalk from 'chalk';
import { execSync } from 'child_process';

/**
 * 🔗 GCP 콘솔 직접 접속 헬퍼
 * 
 * 개발 중 GCP 콘솔 페이지를 바로 열어주는 도구
 */

class GCPConsoleHelper {
    constructor() {
        this.project = process.env.GCP_PROJECT_ID || 'openmanager-ai';
        this.region = process.env.GCP_REGION || 'asia-northeast3';

        this.consoleUrls = {
            // 메인 대시보드
            dashboard: `https://console.cloud.google.com/home/dashboard?project=${this.project}`,

            // 할당량 모니터링
            quotas: `https://console.cloud.google.com/iam-admin/quotas?project=${this.project}`,
            billing: `https://console.cloud.google.com/billing/linkedaccount?project=${this.project}`,

            // Cloud Functions
            functions: `https://console.cloud.google.com/functions/list?project=${this.project}`,
            functionsLogs: `https://console.cloud.google.com/logs/query?project=${this.project}&query=resource.type%3D%22cloud_function%22`,
            functionsMetrics: `https://console.cloud.google.com/monitoring/metrics-explorer?project=${this.project}`,

            // Compute Engine
            compute: `https://console.cloud.google.com/compute/instances?project=${this.project}`,
            computeUsage: `https://console.cloud.google.com/compute/usage?project=${this.project}`,

            // Cloud Storage
            storage: `https://console.cloud.google.com/storage/browser?project=${this.project}`,
            storageUsage: `https://console.cloud.google.com/storage/usage?project=${this.project}`,

            // Firestore
            firestore: `https://console.cloud.google.com/firestore/databases?project=${this.project}`,
            firestoreUsage: `https://console.cloud.google.com/firestore/usage?project=${this.project}`,

            // Cloud Monitoring
            monitoring: `https://console.cloud.google.com/monitoring?project=${this.project}`,
            alerts: `https://console.cloud.google.com/monitoring/alerting?project=${this.project}`,

            // Cloud Logging
            logs: `https://console.cloud.google.com/logs/query?project=${this.project}`,

            // API 사용량
            apis: `https://console.cloud.google.com/apis/dashboard?project=${this.project}`,

            // 보안 및 IAM
            iam: `https://console.cloud.google.com/iam-admin/iam?project=${this.project}`,

            // 네트워킹
            networking: `https://console.cloud.google.com/networking/networks/list?project=${this.project}`
        };
    }

    /**
     * 🎯 메인 메뉴 표시
     */
    showMainMenu() {
        console.log(chalk.blue('\n🔗 GCP 콘솔 직접 접속 헬퍼'));
        console.log(chalk.gray(`📋 프로젝트: ${this.project} | 지역: ${this.region}\n`));

        console.log(chalk.cyan('📊 모니터링 & 할당량'));
        console.log(chalk.white('  1. 📈 메인 대시보드'));
        console.log(chalk.white('  2. 🎯 할당량 모니터링'));
        console.log(chalk.white('  3. 💰 빌링 정보'));
        console.log(chalk.white('  4. 📊 Cloud Monitoring'));
        console.log('');

        console.log(chalk.cyan('⚡ 서비스별 콘솔'));
        console.log(chalk.white('  5. ⚡ Cloud Functions'));
        console.log(chalk.white('  6. 🖥️ Compute Engine'));
        console.log(chalk.white('  7. 📦 Cloud Storage'));
        console.log(chalk.white('  8. 🔥 Firestore'));
        console.log('');

        console.log(chalk.cyan('🛠️ 개발 도구'));
        console.log(chalk.white('  9. 📝 Cloud Logging'));
        console.log(chalk.white(' 10. 🔔 알림 관리'));
        console.log(chalk.white(' 11. 🌐 API 사용량'));
        console.log(chalk.white(' 12. 🔐 IAM 관리'));
        console.log('');

        console.log(chalk.cyan('🚀 빠른 명령어'));
        console.log(chalk.white(' 13. 🔥 무료 한도 체크'));
        console.log(chalk.white(' 14. 📱 모든 URL 출력'));
        console.log(chalk.white(' 15. ⚡ 실시간 모니터링'));
        console.log('');

        console.log(chalk.yellow('💡 사용법: npm run gcp:console [번호]'));
        console.log(chalk.gray('예시: npm run gcp:console 1  # 메인 대시보드 열기'));
    }

    /**
     * 🌐 브라우저에서 URL 열기
     */
    openUrl(url, description) {
        console.log(chalk.blue(`\n🔗 ${description} 열기 중...`));
        console.log(chalk.gray(`📋 URL: ${url}`));

        try {
            // 운영체제별 브라우저 열기
            const command = process.platform === 'win32' ? 'start' :
                process.platform === 'darwin' ? 'open' : 'xdg-open';

            execSync(`${command} "${url}"`, { stdio: 'ignore' });
            console.log(chalk.green('✅ 브라우저에서 열었습니다.'));
        } catch (error) {
            console.log(chalk.red('❌ 브라우저 열기 실패:'), error.message);
            console.log(chalk.yellow('🔗 수동으로 열어주세요:'));
            console.log(chalk.white(url));
        }
    }

    /**
     * 📊 무료 한도 체크 (콘솔에서 확인)
     */
    async checkFreeTierQuotas() {
        console.log(chalk.blue('\n🎯 무료 한도 체크 (콘솔에서 확인)'));

        const quotaPages = [
            { name: 'Cloud Functions 할당량', url: this.consoleUrls.functions },
            { name: 'Compute Engine 할당량', url: this.consoleUrls.computeUsage },
            { name: 'Cloud Storage 할당량', url: this.consoleUrls.storageUsage },
            { name: 'Firestore 할당량', url: this.consoleUrls.firestoreUsage },
            { name: '전체 할당량 페이지', url: this.consoleUrls.quotas }
        ];

        console.log(chalk.yellow('📋 다음 페이지들을 확인하세요:\n'));

        for (const page of quotaPages) {
            console.log(chalk.white(`🔗 ${page.name}`));
            console.log(chalk.gray(`   ${page.url}`));
        }

        console.log(chalk.blue('\n💡 빠른 접속:'));
        console.log(chalk.white('npm run gcp:console 2  # 할당량 모니터링'));
        console.log(chalk.white('npm run gcp:console 3  # 빌링 정보'));
        console.log(chalk.white('npm run gcp:console 4  # Cloud Monitoring'));
    }

    /**
     * 📱 모든 URL 출력
     */
    printAllUrls() {
        console.log(chalk.blue('\n🔗 모든 GCP 콘솔 URL'));
        console.log(chalk.gray(`📋 프로젝트: ${this.project}\n`));

        const categories = {
            '📊 모니터링': ['dashboard', 'quotas', 'billing', 'monitoring'],
            '⚡ 서비스': ['functions', 'compute', 'storage', 'firestore'],
            '🛠️ 개발': ['logs', 'alerts', 'apis', 'iam'],
            '📈 메트릭': ['functionsMetrics', 'computeUsage', 'storageUsage', 'firestoreUsage']
        };

        for (const [category, urls] of Object.entries(categories)) {
            console.log(chalk.cyan(category));
            for (const key of urls) {
                if (this.consoleUrls[key]) {
                    console.log(chalk.white(`  ${key}: ${this.consoleUrls[key]}`));
                }
            }
            console.log('');
        }
    }

    /**
     * 🚀 실시간 모니터링 도구 실행
     */
    async startRealtimeMonitoring() {
        console.log(chalk.blue('\n🚀 실시간 모니터링 시작'));

        // 여러 탭에서 모니터링 페이지 열기
        const monitoringPages = [
            { name: '메인 대시보드', url: this.consoleUrls.dashboard },
            { name: 'Cloud Functions', url: this.consoleUrls.functions },
            { name: 'Compute Engine', url: this.consoleUrls.compute },
            { name: 'Cloud Monitoring', url: this.consoleUrls.monitoring },
            { name: '할당량 모니터링', url: this.consoleUrls.quotas }
        ];

        console.log(chalk.yellow('📋 다음 페이지들을 모두 열어줍니다:\n'));

        for (const page of monitoringPages) {
            console.log(chalk.white(`🔗 ${page.name}`));
            this.openUrl(page.url, page.name);
            await this.sleep(1000); // 1초 간격으로 열기
        }

        console.log(chalk.green('\n✅ 모든 모니터링 페이지가 열렸습니다.'));
        console.log(chalk.blue('💡 CLI 모니터링도 함께 실행하세요:'));
        console.log(chalk.white('npm run gcp:monitor'));
    }

    /**
     * 🎯 특정 선택 처리
     */
    async handleSelection(choice) {
        const selections = {
            '1': () => this.openUrl(this.consoleUrls.dashboard, '메인 대시보드'),
            '2': () => this.openUrl(this.consoleUrls.quotas, '할당량 모니터링'),
            '3': () => this.openUrl(this.consoleUrls.billing, '빌링 정보'),
            '4': () => this.openUrl(this.consoleUrls.monitoring, 'Cloud Monitoring'),
            '5': () => this.openUrl(this.consoleUrls.functions, 'Cloud Functions'),
            '6': () => this.openUrl(this.consoleUrls.compute, 'Compute Engine'),
            '7': () => this.openUrl(this.consoleUrls.storage, 'Cloud Storage'),
            '8': () => this.openUrl(this.consoleUrls.firestore, 'Firestore'),
            '9': () => this.openUrl(this.consoleUrls.logs, 'Cloud Logging'),
            '10': () => this.openUrl(this.consoleUrls.alerts, '알림 관리'),
            '11': () => this.openUrl(this.consoleUrls.apis, 'API 사용량'),
            '12': () => this.openUrl(this.consoleUrls.iam, 'IAM 관리'),
            '13': () => this.checkFreeTierQuotas(),
            '14': () => this.printAllUrls(),
            '15': () => this.startRealtimeMonitoring()
        };

        const handler = selections[choice];
        if (handler) {
            await handler();
        } else {
            console.log(chalk.red('❌ 잘못된 선택입니다.'));
            this.showMainMenu();
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
const helper = new GCPConsoleHelper();
const choice = process.argv[2];

if (choice) {
    helper.handleSelection(choice);
} else {
    helper.showMainMenu();
} 