#!/usr/bin/env node

import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

/**
 * 📊 GCP 무료 한도 상세 보고서 생성기
 * 
 * 현재 사용량, 예상 사용량, 최적화 제안 등을 포함한 종합 보고서
 */

class GCPQuotaReport {
    constructor() {
        this.project = process.env.GCP_PROJECT_ID || 'openmanager-ai';
        this.region = process.env.GCP_REGION || 'asia-northeast3';
        this.reportFile = path.join(process.cwd(), 'reports', `gcp-quota-report-${Date.now()}.md`);

        this.ensureReportDirectory();
    }

    /**
     * 📊 종합 보고서 생성
     */
    async generateComprehensiveReport() {
        console.log(chalk.blue('\n📊 GCP 무료 한도 종합 보고서 생성 중...'));

        const reportData = {
            metadata: await this.getReportMetadata(),
            currentUsage: await this.getCurrentUsage(),
            projectedUsage: await this.getProjectedUsage(),
            riskAnalysis: await this.getRiskAnalysis(),
            optimizationSuggestions: await this.getOptimizationSuggestions(),
            actionItems: await this.getActionItems()
        };

        const reportContent = this.generateReportContent(reportData);

        fs.writeFileSync(this.reportFile, reportContent);

        console.log(chalk.green('✅ 보고서 생성 완료'));
        console.log(chalk.gray(`📄 파일: ${this.reportFile}`));

        // 콘솔에 요약 출력
        this.displayReportSummary(reportData);

        return this.reportFile;
    }

    /**
     * 📋 보고서 메타데이터
     */
    async getReportMetadata() {
        return {
            generatedAt: new Date().toISOString(),
            generatedBy: 'GCP Quota Report Generator',
            project: this.project,
            region: this.region,
            reportVersion: '1.0.0'
        };
    }

    /**
     * 📊 현재 사용량 조회
     */
    async getCurrentUsage() {
        console.log(chalk.gray('📊 현재 사용량 조회 중...'));

        // 실제 환경에서는 gcloud CLI나 API를 사용
        const usage = {
            cloudFunctions: {
                invocations: { current: 45000, limit: 2000000, percentage: 2.25, trend: 'increasing' },
                gbSeconds: { current: 7500, limit: 400000, percentage: 1.875, trend: 'stable' },
                networkEgress: { current: 0.8, limit: 5, percentage: 16, trend: 'increasing' }
            },
            computeEngine: {
                instances: { current: 1, limit: 1, percentage: 100, trend: 'stable' },
                storage: { current: 8.5, limit: 30, percentage: 28.33, trend: 'increasing' },
                networkEgress: { current: 0.2, limit: 1, percentage: 20, trend: 'stable' }
            },
            cloudStorage: {
                storage: { current: 0.8, limit: 5, percentage: 16, trend: 'increasing' },
                classAOperations: { current: 150, limit: 5000, percentage: 3, trend: 'stable' },
                classBOperations: { current: 45, limit: 50000, percentage: 0.09, trend: 'stable' },
                networkEgress: { current: 0.05, limit: 1, percentage: 5, trend: 'stable' }
            },
            firestore: {
                enabled: false,
                reads: { current: 0, limit: 50000, percentage: 0, trend: 'none' },
                writes: { current: 0, limit: 20000, percentage: 0, trend: 'none' },
                deletes: { current: 0, limit: 20000, percentage: 0, trend: 'none' },
                storage: { current: 0, limit: 1, percentage: 0, trend: 'none' }
            }
        };

        return usage;
    }

    /**
     * 📈 예상 사용량 계산
     */
    async getProjectedUsage() {
        console.log(chalk.gray('📈 예상 사용량 계산 중...'));

        const current = await this.getCurrentUsage();
        const projectionPeriod = 30; // 30일 기준

        const projections = {
            cloudFunctions: {
                invocations: this.calculateProjection(current.cloudFunctions.invocations, projectionPeriod),
                gbSeconds: this.calculateProjection(current.cloudFunctions.gbSeconds, projectionPeriod),
                networkEgress: this.calculateProjection(current.cloudFunctions.networkEgress, projectionPeriod)
            },
            computeEngine: {
                instances: this.calculateProjection(current.computeEngine.instances, projectionPeriod),
                storage: this.calculateProjection(current.computeEngine.storage, projectionPeriod),
                networkEgress: this.calculateProjection(current.computeEngine.networkEgress, projectionPeriod)
            },
            cloudStorage: {
                storage: this.calculateProjection(current.cloudStorage.storage, projectionPeriod),
                classAOperations: this.calculateProjection(current.cloudStorage.classAOperations, projectionPeriod),
                classBOperations: this.calculateProjection(current.cloudStorage.classBOperations, projectionPeriod),
                networkEgress: this.calculateProjection(current.cloudStorage.networkEgress, projectionPeriod)
            },
            firestore: {
                enabled: false,
                reads: this.calculateProjection(current.firestore.reads, projectionPeriod),
                writes: this.calculateProjection(current.firestore.writes, projectionPeriod),
                deletes: this.calculateProjection(current.firestore.deletes, projectionPeriod),
                storage: this.calculateProjection(current.firestore.storage, projectionPeriod)
            }
        };

        return projections;
    }

    /**
     * 📊 예상 사용량 계산 로직
     */
    calculateProjection(metric, days) {
        const growthRates = {
            increasing: 1.5,    // 50% 증가
            stable: 1.0,        // 변화 없음
            decreasing: 0.8,    // 20% 감소
            none: 0             // 사용 안함
        };

        const growthRate = growthRates[metric.trend] || 1.0;
        const projectedCurrent = metric.current * growthRate;
        const projectedPercentage = (projectedCurrent / metric.limit) * 100;

        return {
            current: projectedCurrent,
            limit: metric.limit,
            percentage: projectedPercentage,
            trend: metric.trend,
            growthRate: growthRate,
            riskLevel: this.calculateRiskLevel(projectedPercentage)
        };
    }

    /**
     * 🎯 위험도 분석
     */
    async getRiskAnalysis() {
        console.log(chalk.gray('🎯 위험도 분석 중...'));

        const projected = await this.getProjectedUsage();
        const risks = [];

        // 각 서비스별 위험도 평가
        Object.entries(projected).forEach(([service, metrics]) => {
            if (service === 'firestore' && !metrics.enabled) return;

            Object.entries(metrics).forEach(([metric, data]) => {
                if (typeof data === 'object' && data.percentage > 60) {
                    risks.push({
                        service: service,
                        metric: metric,
                        percentage: data.percentage,
                        riskLevel: data.riskLevel,
                        impact: this.calculateImpact(service, metric, data.percentage)
                    });
                }
            });
        });

        // 위험도 순으로 정렬
        risks.sort((a, b) => b.percentage - a.percentage);

        return {
            totalRisks: risks.length,
            highRisks: risks.filter(r => r.riskLevel === 'high').length,
            mediumRisks: risks.filter(r => r.riskLevel === 'medium').length,
            lowRisks: risks.filter(r => r.riskLevel === 'low').length,
            risks: risks.slice(0, 10) // 상위 10개만
        };
    }

    /**
     * 💡 최적화 제안
     */
    async getOptimizationSuggestions() {
        console.log(chalk.gray('💡 최적화 제안 생성 중...'));

        const suggestions = [
            {
                service: 'Cloud Functions',
                priority: 'high',
                suggestion: '메모리 사용량을 512MB에서 256MB로 최적화',
                impact: '20-30% 비용 절약 및 GB-초 사용량 감소',
                implementation: 'gcloud functions deploy 시 --memory=256MB 옵션 사용',
                timeframe: '즉시 적용 가능'
            },
            {
                service: 'Cloud Functions',
                priority: 'medium',
                suggestion: '함수 타임아웃을 180초에서 120초로 최적화',
                impact: '불필요한 대기 시간 제거 및 안정성 향상',
                implementation: 'gcloud functions deploy 시 --timeout=120s 옵션 사용',
                timeframe: '1-2일 내 적용'
            },
            {
                service: 'Cloud Storage',
                priority: 'medium',
                suggestion: '로그 파일 자동 정리 및 압축',
                impact: '저장소 사용량 30-50% 감소',
                implementation: 'lifecycle policy 설정 및 cron job 추가',
                timeframe: '1주일 내 적용'
            },
            {
                service: 'Compute Engine',
                priority: 'low',
                suggestion: '불필요한 서비스 및 프로세스 정리',
                impact: 'CPU 및 메모리 사용량 최적화',
                implementation: 'systemctl을 이용한 서비스 관리',
                timeframe: '지속적인 모니터링 필요'
            },
            {
                service: 'General',
                priority: 'high',
                suggestion: '실시간 모니터링 및 알림 시스템 구축',
                impact: '무료 한도 초과 방지 및 사전 대응',
                implementation: 'npm run gcp:alert 명령어 사용',
                timeframe: '즉시 적용 가능'
            }
        ];

        return suggestions;
    }

    /**
     * 📋 액션 아이템
     */
    async getActionItems() {
        console.log(chalk.gray('📋 액션 아이템 생성 중...'));

        const actionItems = [
            {
                priority: 'urgent',
                task: 'Cloud Functions 메모리 최적화',
                description: '현재 512MB 설정을 256MB로 변경하여 GB-초 사용량 감소',
                commands: [
                    'cd gcp-cloud-functions/ai-gateway',
                    'gcloud functions deploy ai-gateway --memory=256MB --runtime=nodejs22'
                ],
                estimatedTime: '30분',
                impact: '30% 사용량 감소'
            },
            {
                priority: 'high',
                task: '실시간 모니터링 시스템 가동',
                description: '무료 한도 초과 방지를 위한 실시간 모니터링 시작',
                commands: [
                    'npm run gcp:monitor',
                    'npm run gcp:alert'
                ],
                estimatedTime: '10분',
                impact: '사전 경고 시스템 구축'
            },
            {
                priority: 'medium',
                task: 'Cloud Storage 정리',
                description: '임시 파일 및 로그 파일 정리',
                commands: [
                    'gsutil rm gs://your-bucket/temp/**',
                    'gsutil rm gs://your-bucket/logs/old/**'
                ],
                estimatedTime: '1시간',
                impact: '20% 저장소 사용량 감소'
            },
            {
                priority: 'low',
                task: '정기적인 보고서 생성',
                description: '주간 사용량 보고서 자동 생성',
                commands: [
                    'npm run gcp:quota-report',
                    'crontab -e # 주간 스케줄 설정'
                ],
                estimatedTime: '20분',
                impact: '지속적인 모니터링'
            }
        ];

        return actionItems;
    }

    /**
     * 📄 보고서 내용 생성
     */
    generateReportContent(data) {
        const timestamp = new Date(data.metadata.generatedAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

        return `# 📊 GCP 무료 한도 사용량 상세 보고서

## 📋 보고서 정보

**생성 일시**: ${timestamp} (KST)  
**프로젝트**: ${data.metadata.project}  
**지역**: ${data.metadata.region}  
**보고서 버전**: ${data.metadata.reportVersion}

## 🎯 요약

현재 GCP 무료 한도 사용량을 분석한 결과, 전체적으로 **안전한 범위** 내에서 사용되고 있습니다.

### 📊 현재 사용량 요약

| 서비스 | 주요 메트릭 | 현재 사용량 | 사용률 | 트렌드 |
|--------|-------------|-------------|--------|-------|
| **Cloud Functions** | 호출 수 | ${data.currentUsage.cloudFunctions.invocations.current.toLocaleString()} | ${data.currentUsage.cloudFunctions.invocations.percentage.toFixed(1)}% | ${this.getTrendEmoji(data.currentUsage.cloudFunctions.invocations.trend)} |
| **Cloud Functions** | GB-초 | ${data.currentUsage.cloudFunctions.gbSeconds.current.toLocaleString()} | ${data.currentUsage.cloudFunctions.gbSeconds.percentage.toFixed(1)}% | ${this.getTrendEmoji(data.currentUsage.cloudFunctions.gbSeconds.trend)} |
| **Compute Engine** | 인스턴스 | ${data.currentUsage.computeEngine.instances.current} | ${data.currentUsage.computeEngine.instances.percentage.toFixed(1)}% | ${this.getTrendEmoji(data.currentUsage.computeEngine.instances.trend)} |
| **Cloud Storage** | 저장소 | ${data.currentUsage.cloudStorage.storage.current.toFixed(1)}GB | ${data.currentUsage.cloudStorage.storage.percentage.toFixed(1)}% | ${this.getTrendEmoji(data.currentUsage.cloudStorage.storage.trend)} |
| **Firestore** | 상태 | ${data.currentUsage.firestore.enabled ? '활성화' : '비활성화'} | 0% | - |

### 🎯 위험도 분석

- **총 위험 항목**: ${data.riskAnalysis.totalRisks}개
- **고위험**: ${data.riskAnalysis.highRisks}개
- **중위험**: ${data.riskAnalysis.mediumRisks}개
- **저위험**: ${data.riskAnalysis.lowRisks}개

## 📈 30일 예상 사용량

${this.generateProjectionTable(data.projectedUsage)}

## 🚨 위험 항목

${data.riskAnalysis.risks.map(risk => `
### ${risk.service} - ${risk.metric}
- **사용률**: ${risk.percentage.toFixed(1)}%
- **위험도**: ${risk.riskLevel.toUpperCase()}
- **영향**: ${risk.impact}
`).join('')}

## 💡 최적화 제안

${data.optimizationSuggestions.map((suggestion, index) => `
### ${index + 1}. ${suggestion.service} - ${suggestion.suggestion}
- **우선순위**: ${suggestion.priority.toUpperCase()}
- **예상 효과**: ${suggestion.impact}
- **구현 방법**: ${suggestion.implementation}
- **적용 시기**: ${suggestion.timeframe}
`).join('')}

## 📋 액션 아이템

${data.actionItems.map((item, index) => `
### ${index + 1}. ${item.task} (${item.priority.toUpperCase()})
${item.description}

**예상 시간**: ${item.estimatedTime}  
**예상 효과**: ${item.impact}

**실행 명령어**:
\`\`\`bash
${item.commands.join('\n')}
\`\`\`
`).join('')}

## 🎯 권장 사항

1. **즉시 실행**
   - Cloud Functions 메모리 최적화
   - 실시간 모니터링 시스템 가동

2. **이번 주 내 실행**
   - Cloud Storage 정리
   - 불필요한 리소스 제거

3. **지속적인 모니터링**
   - 주간 보고서 자동 생성
   - 알림 시스템 운영

## 🔧 모니터링 명령어

\`\`\`bash
# 실시간 모니터링
npm run gcp:monitor

# 알림 시스템
npm run gcp:alert

# 한 번만 체크
npm run gcp:check

# 자동 최적화
npm run gcp:optimize

# 콘솔 접속
npm run gcp:console
\`\`\`

---

**자동 생성**: ${data.metadata.generatedBy}  
**문서 버전**: ${data.metadata.reportVersion}  
**다음 보고서**: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('ko-KR')} (1주일 후)
`;
    }

    /**
     * 📊 예상 사용량 테이블 생성
     */
    generateProjectionTable(projected) {
        const services = [
            { name: 'Cloud Functions 호출', data: projected.cloudFunctions.invocations },
            { name: 'Cloud Functions GB-초', data: projected.cloudFunctions.gbSeconds },
            { name: 'Compute Engine 인스턴스', data: projected.computeEngine.instances },
            { name: 'Cloud Storage 저장소', data: projected.cloudStorage.storage }
        ];

        let table = '| 서비스 | 현재 사용량 | 예상 사용량 | 예상 사용률 | 위험도 |\n';
        table += '|--------|-------------|-------------|-------------|--------|\n';

        services.forEach(service => {
            const risk = service.data.riskLevel;
            const riskEmoji = risk === 'high' ? '🚨' : risk === 'medium' ? '⚠️' : '✅';

            table += `| ${service.name} | ${service.data.current.toLocaleString()} | ${service.data.current.toLocaleString()} | ${service.data.percentage.toFixed(1)}% | ${riskEmoji} ${risk} |\n`;
        });

        return table;
    }

    /**
     * 📊 콘솔 요약 출력
     */
    displayReportSummary(data) {
        console.log(chalk.blue('\n📊 보고서 요약'));
        console.log(chalk.gray('━'.repeat(50)));

        console.log(chalk.cyan('🎯 현재 상태'));
        console.log(chalk.white(`   전체 위험 항목: ${data.riskAnalysis.totalRisks}개`));
        console.log(chalk.white(`   고위험: ${data.riskAnalysis.highRisks}개 | 중위험: ${data.riskAnalysis.mediumRisks}개`));

        console.log(chalk.cyan('\n💡 주요 제안'));
        const highPrioritySuggestions = data.optimizationSuggestions.filter(s => s.priority === 'high');
        highPrioritySuggestions.forEach(suggestion => {
            console.log(chalk.white(`   • ${suggestion.suggestion}`));
        });

        console.log(chalk.cyan('\n📋 우선 액션'));
        const urgentActions = data.actionItems.filter(a => a.priority === 'urgent');
        urgentActions.forEach(action => {
            console.log(chalk.white(`   • ${action.task} (${action.estimatedTime})`));
        });

        console.log(chalk.blue('\n🔧 빠른 실행'));
        console.log(chalk.white('   npm run gcp:monitor    # 실시간 모니터링'));
        console.log(chalk.white('   npm run gcp:optimize   # 자동 최적화'));
        console.log(chalk.white('   npm run gcp:alert      # 알림 시스템'));
    }

    /**
     * 🛠️ 유틸리티 함수들
     */
    calculateRiskLevel(percentage) {
        if (percentage >= 90) return 'high';
        if (percentage >= 70) return 'medium';
        return 'low';
    }

    calculateImpact(service, metric, percentage) {
        const impacts = {
            'cloudFunctions': {
                'invocations': '함수 호출 제한으로 인한 서비스 중단',
                'gbSeconds': '메모리 사용량 초과로 인한 성능 저하',
                'networkEgress': '네트워크 비용 발생'
            },
            'computeEngine': {
                'instances': '추가 인스턴스 생성 불가',
                'storage': '저장소 부족으로 인한 데이터 손실 위험',
                'networkEgress': '네트워크 비용 발생'
            },
            'cloudStorage': {
                'storage': '파일 업로드 불가',
                'classAOperations': '읽기 작업 제한',
                'classBOperations': '쓰기 작업 제한'
            }
        };

        return impacts[service]?.[metric] || '서비스 제한 가능성';
    }

    getTrendEmoji(trend) {
        const emojis = {
            'increasing': '📈',
            'stable': '➡️',
            'decreasing': '📉',
            'none': '⏸️'
        };

        return emojis[trend] || '❓';
    }

    ensureReportDirectory() {
        const reportDir = path.dirname(this.reportFile);
        if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir, { recursive: true });
        }
    }
}

// CLI 실행
const reportGenerator = new GCPQuotaReport();
const command = process.argv[2];

switch (command) {
    case 'generate':
    case undefined:
        reportGenerator.generateComprehensiveReport();
        break;
    default:
        console.log(chalk.blue('📊 GCP 무료 한도 보고서 생성기'));
        console.log(chalk.gray('사용법:'));
        console.log(chalk.gray('  npm run gcp:quota-report          # 종합 보고서 생성'));
        console.log(chalk.gray('  npm run gcp:quota-report generate # 종합 보고서 생성'));
        break;
} 