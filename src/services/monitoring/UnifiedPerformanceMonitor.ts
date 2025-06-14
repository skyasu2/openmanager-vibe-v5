/**
 * 🎯 통합 성능 모니터링 시스템 v1.0
 * 
 * 4개의 특화된 성능 모니터를 통합 관리:
 * - AI 에이전트 학습 성능 모니터링 (PerformanceMonitor)
 * - 하이브리드 AI 시스템 성능 추적 (HybridPerformanceMonitor)
 * - 중앙화된 시스템 성능 모니터링 (CentralizedPerformanceMonitor)
 * - 실시간 벤치마크 및 측정 (BenchmarkMonitor)
 * 
 * 통합 아키텍처:
 * - 단일 진입점 제공
 * - 각 모니터의 특화 기능 유지
 * - 중복 제거 및 효율성 향상
 * - 통합 알림 및 리포팅
 */

'use client';

// 기존 모니터들 임포트
import { PerformanceMonitor as AILearningMonitor } from '../../modules/ai-agent/learning/PerformanceMonitor';
import { PerformanceMonitor as HybridAIMonitor } from '../ai/hybrid/monitoring/PerformanceMonitor';
import { CentralizedPerformanceMonitor } from './CentralizedPerformanceMonitor';
import { PerformanceMonitor as BenchmarkMonitor } from '../../utils/performance-monitor';

// 통합 타입 정의
export interface UnifiedMetrics {
    timestamp: Date;

    // AI 학습 메트릭
    learning: {
        totalInteractions: number;
        successRate: number;
        averageConfidence: number;
        averageResponseTime: number;
        userSatisfactionRate: number;
        errorRate: number;
        improvementRate: number;
        activePatterns: number;
        pendingUpdates: number;
    };

    // 하이브리드 AI 메트릭
    hybrid: {
        korean: { initialized: boolean; successCount: number; avgTime: number };
        lightweightML: { initialized: boolean; successCount: number; avgTime: number };
        transformers: { initialized: boolean; successCount: number; avgTime: number };
        vector: { initialized: boolean; documentCount: number; searchCount: number };
        processingHistory: any[];
    };

    // 시스템 메트릭
    system: {
        cpu: { usage: number; cores: number; loadAverage: number[] };
        memory: { used: number; total: number; usage: number; heapUsed: number; heapTotal: number };
        network: { bytesIn: number; bytesOut: number; requestsPerSecond: number; activeConnections: number };
        disk: { used: number; total: number; usage: number; ioOperations: number };
    };

    // 벤치마크 메트릭
    benchmark: {
        memoryUsage: { heapUsed: number; heapTotal: number; external: number; rss: number; percentage: number; optimization: string };
        responseTime: { responseTime: number; category: 'fast' | 'normal' | 'slow'; baseline: number; improvement: number };
        accuracy: { accuracy: number; precision: number; recall: number; f1Score: number; sampleSize: number };
    };
}

export interface UnifiedAlert {
    id: string;
    source: 'learning' | 'hybrid' | 'system' | 'benchmark';
    type: string;
    severity: 'info' | 'warning' | 'critical';
    title: string;
    message: string;
    timestamp: Date;
    acknowledged: boolean;
    metrics?: any;
    recommendations?: string[];
}

export interface UnifiedReport {
    id: string;
    timestamp: Date;
    period: { start: Date; end: Date };

    // 각 모니터별 리포트
    learning: any;
    hybrid: any;
    system: any;
    benchmark: any;

    // 통합 분석
    overall: {
        score: number; // 0-100
        status: 'excellent' | 'good' | 'fair' | 'poor';
        keyInsights: string[];
        recommendations: string[];
        trends: Array<{
            metric: string;
            trend: 'improving' | 'declining' | 'stable';
            significance: 'high' | 'medium' | 'low';
        }>;
    };
}

export interface MonitoringConfig {
    enabled: boolean;

    // 각 모니터 활성화 설정
    monitors: {
        learning: boolean;
        hybrid: boolean;
        system: boolean;
        benchmark: boolean;
    };

    // 수집 간격 (ms)
    intervals: {
        learning: number;
        hybrid: number;
        system: number;
        benchmark: number;
        unified: number;
    };

    // 데이터 보관 설정
    retention: {
        metrics: number; // 일
        alerts: number; // 일
        reports: number; // 일
    };

    // 알림 설정
    alerts: {
        enabled: boolean;
        aggregation: boolean; // 중복 알림 통합
        thresholds: {
            successRate: number;
            responseTime: number;
            memoryUsage: number;
            cpuUsage: number;
            errorRate: number;
        };
    };
}

/**
 * 🎯 통합 성능 모니터링 시스템
 */
export class UnifiedPerformanceMonitor {
    private static instance: UnifiedPerformanceMonitor;

    // 개별 모니터 인스턴스
    private aiLearningMonitor: AILearningMonitor;
    private hybridAIMonitor: HybridAIMonitor;
    private centralizedMonitor: CentralizedPerformanceMonitor;

    // 설정 및 상태
    private config: MonitoringConfig;
    private isMonitoring = false;
    private startTime = Date.now();

    // 데이터 저장소
    private unifiedMetricsHistory: UnifiedMetrics[] = [];
    private unifiedAlerts: Map<string, UnifiedAlert> = new Map();
    private unifiedReports: UnifiedReport[] = [];

    // 스케줄러
    private unifiedInterval: NodeJS.Timeout | null = null;

    // 통계
    private stats = {
        totalMetricsCollected: 0,
        totalAlertsGenerated: 0,
        totalReportsGenerated: 0,
        uptime: 0,
        lastCollectionTime: null as Date | null,
    };

    private constructor(config?: Partial<MonitoringConfig>) {
        this.config = this.loadDefaultConfig();
        if (config) {
            this.config = { ...this.config, ...config };
        }

        // 개별 모니터 초기화
        this.initializeMonitors();
    }

    public static getInstance(config?: Partial<MonitoringConfig>): UnifiedPerformanceMonitor {
        if (!UnifiedPerformanceMonitor.instance) {
            UnifiedPerformanceMonitor.instance = new UnifiedPerformanceMonitor(config);
        }
        return UnifiedPerformanceMonitor.instance;
    }

    /**
     * 🚀 통합 모니터링 시작
     */
    public async startMonitoring(): Promise<void> {
        if (this.isMonitoring) {
            console.log('🔍 통합 성능 모니터링이 이미 실행 중입니다.');
            return;
        }

        this.isMonitoring = true;
        this.startTime = Date.now();

        console.log('🎯 [UnifiedPerformanceMonitor] 통합 성능 모니터링을 시작합니다.');

        try {
            // 개별 모니터들 시작
            if (this.config.monitors.learning) {
                this.aiLearningMonitor.startMonitoring();
            }

            if (this.config.monitors.system) {
                await this.centralizedMonitor.startMonitoring();
            }

            // 통합 메트릭 수집 스케줄링
            this.scheduleUnifiedCollection();

            // 즉시 첫 번째 수집 실행
            await this.collectUnifiedMetrics();

            console.log('✅ [UnifiedPerformanceMonitor] 모든 모니터링 시스템이 시작되었습니다.');

        } catch (error) {
            console.error('❌ [UnifiedPerformanceMonitor] 모니터링 시작 실패:', error);
            this.isMonitoring = false;
            throw error;
        }
    }

    /**
     * 🛑 통합 모니터링 중지
     */
    public async stopMonitoring(): Promise<void> {
        if (!this.isMonitoring) {
            console.log('🔍 통합 성능 모니터링이 실행되고 있지 않습니다.');
            return;
        }

        this.isMonitoring = false;

        console.log('🎯 [UnifiedPerformanceMonitor] 통합 성능 모니터링을 중지합니다.');

        try {
            // 스케줄러 정리
            if (this.unifiedInterval) {
                clearInterval(this.unifiedInterval);
                this.unifiedInterval = null;
            }

            // 개별 모니터들 중지
            if (this.config.monitors.learning) {
                this.aiLearningMonitor.stopMonitoring();
            }

            if (this.config.monitors.system) {
                await this.centralizedMonitor.stopMonitoring();
            }

            console.log('✅ [UnifiedPerformanceMonitor] 모든 모니터링 시스템이 중지되었습니다.');

        } catch (error) {
            console.error('❌ [UnifiedPerformanceMonitor] 모니터링 중지 실패:', error);
            throw error;
        }
    }

    /**
     * 📊 통합 메트릭 수집
     */
    public async collectUnifiedMetrics(): Promise<UnifiedMetrics> {
        try {
            const timestamp = new Date();

            // 각 모니터에서 메트릭 수집
            const [learningMetrics, hybridStats, systemMetrics, benchmarkMemory] = await Promise.allSettled([
                this.config.monitors.learning ? this.aiLearningMonitor.collectCurrentMetrics() : null,
                this.config.monitors.hybrid ? this.hybridAIMonitor.getPerformanceStats() : null,
                this.config.monitors.system ? this.centralizedMonitor.getCurrentMetrics() : null,
                this.config.monitors.benchmark ? BenchmarkMonitor.getMemoryUsage() : null,
            ]);

            // 통합 메트릭 구성
            const unifiedMetrics: UnifiedMetrics = {
                timestamp,

                learning: learningMetrics.status === 'fulfilled' && learningMetrics.value ? {
                    totalInteractions: learningMetrics.value.totalInteractions,
                    successRate: learningMetrics.value.successRate,
                    averageConfidence: learningMetrics.value.averageConfidence,
                    averageResponseTime: learningMetrics.value.averageResponseTime,
                    userSatisfactionRate: learningMetrics.value.userSatisfactionRate,
                    errorRate: learningMetrics.value.errorRate,
                    improvementRate: learningMetrics.value.improvementRate,
                    activePatterns: learningMetrics.value.activePatterns,
                    pendingUpdates: learningMetrics.value.pendingUpdates,
                } : this.getEmptyLearningMetrics(),

                hybrid: hybridStats.status === 'fulfilled' && hybridStats.value ? {
                    korean: hybridStats.value.korean,
                    lightweightML: hybridStats.value.lightweightML,
                    transformers: hybridStats.value.transformers,
                    vector: hybridStats.value.vector,
                    processingHistory: [],
                } : this.getEmptyHybridMetrics(),

                system: systemMetrics.status === 'fulfilled' && systemMetrics.value ? {
                    cpu: systemMetrics.value.system.cpu,
                    memory: systemMetrics.value.system.memory,
                    network: systemMetrics.value.system.network,
                    disk: systemMetrics.value.system.disk,
                } : this.getEmptySystemMetrics(),

                benchmark: benchmarkMemory.status === 'fulfilled' && benchmarkMemory.value ? {
                    memoryUsage: benchmarkMemory.value,
                    responseTime: { responseTime: 0, category: 'normal', baseline: 1000, improvement: 0 },
                    accuracy: { accuracy: 0, precision: 0, recall: 0, f1Score: 0, sampleSize: 0 },
                } : this.getEmptyBenchmarkMetrics(),
            };

            // 히스토리에 추가
            this.addToHistory(unifiedMetrics);

            // 알림 처리
            await this.processUnifiedAlerts(unifiedMetrics);

            // 통계 업데이트
            this.updateStats();

            return unifiedMetrics;

        } catch (error) {
            console.error('❌ [UnifiedPerformanceMonitor] 통합 메트릭 수집 실패:', error);
            return this.getEmptyUnifiedMetrics();
        }
    }

    /**
     * 📈 통합 성능 리포트 생성
     */
    public async generateUnifiedReport(): Promise<UnifiedReport> {
        try {
            const timestamp = new Date();
            const period = {
                start: new Date(timestamp.getTime() - 24 * 60 * 60 * 1000), // 24시간 전
                end: timestamp,
            };

            // 각 모니터에서 리포트 수집
            const [learningReport, hybridReport, systemReport, benchmarkReport] = await Promise.allSettled([
                this.config.monitors.learning ? this.aiLearningMonitor.generatePerformanceReport() : null,
                this.config.monitors.hybrid ? this.hybridAIMonitor.generatePerformanceReport() : null,
                this.config.monitors.system ? this.centralizedMonitor.generateOptimizationReport() : null,
                this.config.monitors.benchmark ? BenchmarkMonitor.generatePerformanceReport() : null,
            ]);

            // 통합 분석 수행
            const overallAnalysis = this.performOverallAnalysis();

            const unifiedReport: UnifiedReport = {
                id: `unified_report_${Date.now()}`,
                timestamp,
                period,

                learning: learningReport.status === 'fulfilled' ? learningReport.value : null,
                hybrid: hybridReport.status === 'fulfilled' ? hybridReport.value : null,
                system: systemReport.status === 'fulfilled' ? systemReport.value : null,
                benchmark: benchmarkReport.status === 'fulfilled' ? benchmarkReport.value : null,

                overall: overallAnalysis,
            };

            // 리포트 저장
            this.unifiedReports.push(unifiedReport);
            this.stats.totalReportsGenerated++;

            // 오래된 리포트 정리
            this.cleanupOldReports();

            return unifiedReport;

        } catch (error) {
            console.error('❌ [UnifiedPerformanceMonitor] 통합 리포트 생성 실패:', error);
            throw error;
        }
    }

    /**
     * 🔧 개별 모니터 초기화
     */
    private initializeMonitors(): void {
        try {
            // AI 학습 모니터 초기화
            if (this.config.monitors.learning) {
                this.aiLearningMonitor = AILearningMonitor.getInstance({
                    performanceCheckInterval: this.config.intervals.learning / (60 * 1000), // 분 단위로 변환
                });
            }

            // 하이브리드 AI 모니터 초기화
            if (this.config.monitors.hybrid) {
                this.hybridAIMonitor = new HybridAIMonitor();
            }

            // 중앙화된 모니터 초기화
            if (this.config.monitors.system) {
                this.centralizedMonitor = CentralizedPerformanceMonitor.getInstance();
            }

            console.log('✅ [UnifiedPerformanceMonitor] 모든 개별 모니터가 초기화되었습니다.');

        } catch (error) {
            console.error('❌ [UnifiedPerformanceMonitor] 모니터 초기화 실패:', error);
            throw error;
        }
    }

    /**
     * ⏰ 통합 수집 스케줄링
     */
    private scheduleUnifiedCollection(): void {
        if (this.unifiedInterval) {
            clearInterval(this.unifiedInterval);
        }

        this.unifiedInterval = setInterval(async () => {
            try {
                await this.collectUnifiedMetrics();
            } catch (error) {
                console.error('❌ [UnifiedPerformanceMonitor] 스케줄된 메트릭 수집 실패:', error);
            }
        }, this.config.intervals.unified);
    }

    /**
     * 🚨 통합 알림 처리
     */
    private async processUnifiedAlerts(metrics: UnifiedMetrics): Promise<void> {
        if (!this.config.alerts.enabled) return;

        const alerts: UnifiedAlert[] = [];

        // 학습 성능 알림
        if (metrics.learning.successRate < this.config.alerts.thresholds.successRate) {
            alerts.push({
                id: `learning_success_${Date.now()}`,
                source: 'learning',
                type: 'performance_degradation',
                severity: 'warning',
                title: 'AI 학습 성공률 저하',
                message: `성공률이 ${(metrics.learning.successRate * 100).toFixed(1)}%로 임계값 ${(this.config.alerts.thresholds.successRate * 100).toFixed(1)}% 미만입니다.`,
                timestamp: new Date(),
                acknowledged: false,
                metrics: metrics.learning,
                recommendations: ['학습 데이터 품질 검토', '모델 파라미터 조정', '사용자 피드백 분석'],
            });
        }

        // 응답 시간 알림
        if (metrics.learning.averageResponseTime > this.config.alerts.thresholds.responseTime) {
            alerts.push({
                id: `response_time_${Date.now()}`,
                source: 'learning',
                type: 'performance_degradation',
                severity: 'warning',
                title: '응답 시간 지연',
                message: `평균 응답 시간이 ${metrics.learning.averageResponseTime.toFixed(0)}ms로 임계값 ${this.config.alerts.thresholds.responseTime}ms를 초과했습니다.`,
                timestamp: new Date(),
                acknowledged: false,
                metrics: metrics.learning,
                recommendations: ['시스템 리소스 확인', '캐시 최적화', '쿼리 성능 튜닝'],
            });
        }

        // 메모리 사용량 알림
        if (metrics.system.memory.usage > this.config.alerts.thresholds.memoryUsage) {
            alerts.push({
                id: `memory_usage_${Date.now()}`,
                source: 'system',
                type: 'resource_exhaustion',
                severity: 'critical',
                title: '메모리 사용량 과다',
                message: `메모리 사용률이 ${metrics.system.memory.usage.toFixed(1)}%로 임계값 ${this.config.alerts.thresholds.memoryUsage}%를 초과했습니다.`,
                timestamp: new Date(),
                acknowledged: false,
                metrics: metrics.system,
                recommendations: ['메모리 누수 점검', '가비지 컬렉션 최적화', '캐시 크기 조정'],
            });
        }

        // 알림 저장 및 통계 업데이트
        alerts.forEach(alert => {
            this.unifiedAlerts.set(alert.id, alert);
            this.stats.totalAlertsGenerated++;
        });

        // 중복 알림 통합 (설정에 따라)
        if (this.config.alerts.aggregation) {
            this.aggregateSimilarAlerts();
        }
    }

    /**
     * 📊 전체 분석 수행
     */
    private performOverallAnalysis(): UnifiedReport['overall'] {
        const recentMetrics = this.unifiedMetricsHistory.slice(-10);

        if (recentMetrics.length === 0) {
            return {
                score: 50,
                status: 'fair',
                keyInsights: ['데이터 수집 중...'],
                recommendations: ['모니터링 시스템 안정화 대기'],
                trends: [],
            };
        }

        // 점수 계산 (0-100)
        const latestMetrics = recentMetrics[recentMetrics.length - 1];
        let score = 0;
        let factors = 0;

        // 학습 성능 점수 (25점)
        if (latestMetrics.learning.successRate > 0) {
            score += latestMetrics.learning.successRate * 25;
            factors++;
        }

        // 시스템 성능 점수 (25점)
        if (latestMetrics.system.cpu.usage > 0) {
            score += Math.max(0, (100 - latestMetrics.system.cpu.usage) / 100 * 25);
            factors++;
        }

        // 메모리 효율성 점수 (25점)
        if (latestMetrics.system.memory.usage > 0) {
            score += Math.max(0, (100 - latestMetrics.system.memory.usage) / 100 * 25);
            factors++;
        }

        // 벤치마크 점수 (25점)
        if (latestMetrics.benchmark.responseTime.improvement !== 0) {
            score += Math.max(0, Math.min(25, latestMetrics.benchmark.responseTime.improvement / 4));
            factors++;
        }

        const finalScore = factors > 0 ? Math.round(score / factors * 4) : 50;

        // 상태 결정
        let status: 'excellent' | 'good' | 'fair' | 'poor';
        if (finalScore >= 90) status = 'excellent';
        else if (finalScore >= 70) status = 'good';
        else if (finalScore >= 50) status = 'fair';
        else status = 'poor';

        // 주요 인사이트 생성
        const keyInsights = this.generateKeyInsights(recentMetrics);

        // 권장사항 생성
        const recommendations = this.generateRecommendations(latestMetrics);

        // 트렌드 분석
        const trends = this.analyzeTrends(recentMetrics);

        return {
            score: finalScore,
            status,
            keyInsights,
            recommendations,
            trends,
        };
    }

    /**
     * 💡 주요 인사이트 생성
     */
    private generateKeyInsights(metrics: UnifiedMetrics[]): string[] {
        const insights: string[] = [];

        if (metrics.length < 2) {
            return ['데이터 수집 중...'];
        }

        const latest = metrics[metrics.length - 1];
        const previous = metrics[metrics.length - 2];

        // 성공률 변화
        const successRateChange = latest.learning.successRate - previous.learning.successRate;
        if (Math.abs(successRateChange) > 0.05) {
            insights.push(
                `AI 학습 성공률이 ${successRateChange > 0 ? '향상' : '저하'}되었습니다 (${(successRateChange * 100).toFixed(1)}%p)`
            );
        }

        // 응답 시간 변화
        const responseTimeChange = latest.learning.averageResponseTime - previous.learning.averageResponseTime;
        if (Math.abs(responseTimeChange) > 100) {
            insights.push(
                `평균 응답 시간이 ${responseTimeChange > 0 ? '증가' : '감소'}했습니다 (${Math.abs(responseTimeChange).toFixed(0)}ms)`
            );
        }

        // 메모리 사용량 변화
        const memoryChange = latest.system.memory.usage - previous.system.memory.usage;
        if (Math.abs(memoryChange) > 5) {
            insights.push(
                `메모리 사용률이 ${memoryChange > 0 ? '증가' : '감소'}했습니다 (${Math.abs(memoryChange).toFixed(1)}%)`
            );
        }

        return insights.length > 0 ? insights : ['시스템이 안정적으로 운영되고 있습니다'];
    }

    /**
     * 📋 권장사항 생성
     */
    private generateRecommendations(metrics: UnifiedMetrics): string[] {
        const recommendations: string[] = [];

        // 성능 기반 권장사항
        if (metrics.learning.successRate < 0.8) {
            recommendations.push('AI 모델 재학습 또는 파라미터 튜닝을 고려하세요');
        }

        if (metrics.learning.averageResponseTime > 2000) {
            recommendations.push('응답 시간 최적화를 위한 캐싱 전략을 검토하세요');
        }

        if (metrics.system.memory.usage > 80) {
            recommendations.push('메모리 사용량 최적화 또는 스케일링을 고려하세요');
        }

        if (metrics.system.cpu.usage > 80) {
            recommendations.push('CPU 부하 분산 또는 리소스 확장을 검토하세요');
        }

        return recommendations.length > 0 ? recommendations : ['현재 시스템 성능이 양호합니다'];
    }

    /**
     * 📈 트렌드 분석
     */
    private analyzeTrends(metrics: UnifiedMetrics[]): UnifiedReport['overall']['trends'] {
        if (metrics.length < 3) {
            return [];
        }

        const trends: UnifiedReport['overall']['trends'] = [];
        const recent = metrics.slice(-3);

        // 성공률 트렌드
        const successRates = recent.map(m => m.learning.successRate);
        const successTrend = this.calculateTrend(successRates);
        trends.push({
            metric: 'AI 학습 성공률',
            trend: successTrend.direction,
            significance: successTrend.significance,
        });

        // 응답 시간 트렌드
        const responseTimes = recent.map(m => m.learning.averageResponseTime);
        const responseTrend = this.calculateTrend(responseTimes, true); // 낮을수록 좋음
        trends.push({
            metric: '평균 응답 시간',
            trend: responseTrend.direction,
            significance: responseTrend.significance,
        });

        // 메모리 사용률 트렌드
        const memoryUsages = recent.map(m => m.system.memory.usage);
        const memoryTrend = this.calculateTrend(memoryUsages, true); // 낮을수록 좋음
        trends.push({
            metric: '메모리 사용률',
            trend: memoryTrend.direction,
            significance: memoryTrend.significance,
        });

        return trends;
    }

    /**
     * 📊 트렌드 계산
     */
    private calculateTrend(values: number[], lowerIsBetter = false): {
        direction: 'improving' | 'declining' | 'stable';
        significance: 'high' | 'medium' | 'low';
    } {
        if (values.length < 2) {
            return { direction: 'stable', significance: 'low' };
        }

        const first = values[0];
        const last = values[values.length - 1];
        const change = last - first;
        const changePercent = Math.abs(change / first) * 100;

        let direction: 'improving' | 'declining' | 'stable';
        if (Math.abs(change) < first * 0.05) {
            direction = 'stable';
        } else if (lowerIsBetter) {
            direction = change < 0 ? 'improving' : 'declining';
        } else {
            direction = change > 0 ? 'improving' : 'declining';
        }

        let significance: 'high' | 'medium' | 'low';
        if (changePercent > 20) significance = 'high';
        else if (changePercent > 10) significance = 'medium';
        else significance = 'low';

        return { direction, significance };
    }

    /**
     * 🔄 유사한 알림 통합
     */
    private aggregateSimilarAlerts(): void {
        const alertGroups = new Map<string, UnifiedAlert[]>();

        // 알림을 타입별로 그룹화
        this.unifiedAlerts.forEach(alert => {
            const key = `${alert.source}_${alert.type}`;
            if (!alertGroups.has(key)) {
                alertGroups.set(key, []);
            }
            alertGroups.get(key)!.push(alert);
        });

        // 각 그룹에서 중복 제거
        alertGroups.forEach((alerts, key) => {
            if (alerts.length > 1) {
                // 가장 최근 알림만 유지
                const latestAlert = alerts.reduce((latest, current) =>
                    current.timestamp > latest.timestamp ? current : latest
                );

                // 나머지 알림 제거
                alerts.forEach(alert => {
                    if (alert.id !== latestAlert.id) {
                        this.unifiedAlerts.delete(alert.id);
                    }
                });
            }
        });
    }

    /**
     * 📚 히스토리에 메트릭 추가
     */
    private addToHistory(metrics: UnifiedMetrics): void {
        this.unifiedMetricsHistory.push(metrics);

        // 보관 기간에 따라 오래된 데이터 정리
        const maxAge = this.config.retention.metrics * 24 * 60 * 60 * 1000;
        const cutoffTime = Date.now() - maxAge;

        this.unifiedMetricsHistory = this.unifiedMetricsHistory.filter(
            m => m.timestamp.getTime() > cutoffTime
        );
    }

    /**
     * 🧹 오래된 리포트 정리
     */
    private cleanupOldReports(): void {
        const maxAge = this.config.retention.reports * 24 * 60 * 60 * 1000;
        const cutoffTime = Date.now() - maxAge;

        this.unifiedReports = this.unifiedReports.filter(
            r => r.timestamp.getTime() > cutoffTime
        );
    }

    /**
     * 📊 통계 업데이트
     */
    private updateStats(): void {
        this.stats.totalMetricsCollected++;
        this.stats.uptime = Date.now() - this.startTime;
        this.stats.lastCollectionTime = new Date();
    }

    // 빈 메트릭 생성 헬퍼 메서드들
    private getEmptyLearningMetrics() {
        return {
            totalInteractions: 0,
            successRate: 0,
            averageConfidence: 0,
            averageResponseTime: 0,
            userSatisfactionRate: 0,
            errorRate: 0,
            improvementRate: 0,
            activePatterns: 0,
            pendingUpdates: 0,
        };
    }

    private getEmptyHybridMetrics() {
        return {
            korean: { initialized: false, successCount: 0, avgTime: 0 },
            lightweightML: { initialized: false, successCount: 0, avgTime: 0 },
            transformers: { initialized: false, successCount: 0, avgTime: 0 },
            vector: { initialized: false, documentCount: 0, searchCount: 0 },
            processingHistory: [],
        };
    }

    private getEmptySystemMetrics() {
        return {
            cpu: { usage: 0, cores: 0, loadAverage: [] },
            memory: { used: 0, total: 0, usage: 0, heapUsed: 0, heapTotal: 0 },
            network: { bytesIn: 0, bytesOut: 0, requestsPerSecond: 0, activeConnections: 0 },
            disk: { used: 0, total: 0, usage: 0, ioOperations: 0 },
        };
    }

    private getEmptyBenchmarkMetrics() {
        return {
            memoryUsage: { heapUsed: 0, heapTotal: 0, external: 0, rss: 0, percentage: 0, optimization: 'unknown' },
            responseTime: { responseTime: 0, category: 'normal' as const, baseline: 1000, improvement: 0 },
            accuracy: { accuracy: 0, precision: 0, recall: 0, f1Score: 0, sampleSize: 0 },
        };
    }

    private getEmptyUnifiedMetrics(): UnifiedMetrics {
        return {
            timestamp: new Date(),
            learning: this.getEmptyLearningMetrics(),
            hybrid: this.getEmptyHybridMetrics(),
            system: this.getEmptySystemMetrics(),
            benchmark: this.getEmptyBenchmarkMetrics(),
        };
    }

    /**
     * 🔧 기본 설정 로드
     */
    private loadDefaultConfig(): MonitoringConfig {
        return {
            enabled: true,
            monitors: {
                learning: true,
                hybrid: true,
                system: true,
                benchmark: true,
            },
            intervals: {
                learning: 15 * 60 * 1000, // 15분
                hybrid: 30 * 1000, // 30초
                system: 60 * 1000, // 1분
                benchmark: 5 * 1000, // 5초
                unified: 60 * 1000, // 1분
            },
            retention: {
                metrics: 7, // 7일
                alerts: 30, // 30일
                reports: 90, // 90일
            },
            alerts: {
                enabled: true,
                aggregation: true,
                thresholds: {
                    successRate: 0.7,
                    responseTime: 2000,
                    memoryUsage: 80,
                    cpuUsage: 80,
                    errorRate: 0.1,
                },
            },
        };
    }

    // 공개 API 메서드들

    /**
     * 📊 현재 통합 메트릭 조회
     */
    public getCurrentMetrics(): UnifiedMetrics | null {
        return this.unifiedMetricsHistory.length > 0
            ? this.unifiedMetricsHistory[this.unifiedMetricsHistory.length - 1]
            : null;
    }

    /**
     * 📈 메트릭 히스토리 조회
     */
    public getMetricsHistory(hours = 24): UnifiedMetrics[] {
        const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
        return this.unifiedMetricsHistory.filter(
            m => m.timestamp.getTime() > cutoffTime
        );
    }

    /**
     * 🚨 활성 알림 조회
     */
    public getActiveAlerts(): UnifiedAlert[] {
        return Array.from(this.unifiedAlerts.values())
            .filter(alert => !alert.acknowledged)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }

    /**
     * 📋 리포트 히스토리 조회
     */
    public getReports(limit = 10): UnifiedReport[] {
        return this.unifiedReports
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit);
    }

    /**
     * 📊 통계 조회
     */
    public getStats() {
        return {
            ...this.stats,
            isMonitoring: this.isMonitoring,
            config: this.config,
            metricsCount: this.unifiedMetricsHistory.length,
            activeAlertsCount: this.getActiveAlerts().length,
            reportsCount: this.unifiedReports.length,
        };
    }

    /**
     * ⚙️ 설정 업데이트
     */
    public updateConfig(newConfig: Partial<MonitoringConfig>): void {
        this.config = { ...this.config, ...newConfig };

        // 모니터링 중이면 재시작
        if (this.isMonitoring) {
            this.stopMonitoring().then(() => {
                this.startMonitoring();
            });
        }
    }

    /**
     * ✅ 알림 확인 처리
     */
    public acknowledgeAlert(alertId: string): boolean {
        const alert = this.unifiedAlerts.get(alertId);
        if (alert) {
            alert.acknowledged = true;
            return true;
        }
        return false;
    }

    /**
     * 🔄 시스템 재시작
     */
    public async restart(): Promise<void> {
        await this.stopMonitoring();
        await this.startMonitoring();
    }

    /**
     * 🛑 시스템 종료
     */
    public async shutdown(): Promise<void> {
        await this.stopMonitoring();

        // 데이터 정리
        this.unifiedMetricsHistory = [];
        this.unifiedAlerts.clear();
        this.unifiedReports = [];

        console.log('🎯 [UnifiedPerformanceMonitor] 시스템이 완전히 종료되었습니다.');
    }
}

// 싱글톤 인스턴스 내보내기
export const unifiedPerformanceMonitor = UnifiedPerformanceMonitor.getInstance(); 