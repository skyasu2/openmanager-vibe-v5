/**
 * 📊 AI 성능 모니터링 시스템 v1.0
 * 
 * ✅ 실시간 성능 메트릭 수집
 * ✅ 엔진별 성능 추적
 * ✅ 간단한 분석 및 알림
 * ✅ 대시보드용 데이터 제공
 */

export interface PerformanceMetric {
    timestamp: string;
    engine: string;
    mode: string;
    responseTime: number;
    success: boolean;
    confidence: number;
    fallbacksUsed: number;
    queryType?: string;
    errorType?: string;
}

export interface PerformanceStats {
    totalRequests: number;
    averageResponseTime: number;
    successRate: number;
    errorRate: number;
    fallbackRate: number;

    // 엔진별 통계
    engineStats: Record<string, {
        requests: number;
        averageResponseTime: number;
        successRate: number;
        confidence: number;
    }>;

    // 모드별 통계
    modeStats: Record<string, {
        requests: number;
        averageResponseTime: number;
        successRate: number;
    }>;

    // 시간대별 통계
    hourlyStats: Array<{
        hour: string;
        requests: number;
        averageResponseTime: number;
        successRate: number;
    }>;

    lastUpdated: string;
}

export interface PerformanceAlert {
    id: string;
    type: 'warning' | 'critical';
    engine: string;
    message: string;
    metric: string;
    value: number;
    threshold: number;
    timestamp: string;
}

/**
 * 🎯 AI 성능 모니터링 매니저
 */
export class PerformanceMonitor {
    private static instance: PerformanceMonitor | null = null;

    // 메트릭 저장소 (메모리 기반 - 간단한 구현)
    private metrics: PerformanceMetric[] = [];
    private maxMetrics = 10000; // 최대 10,000개 메트릭 보관

    // 성능 임계값
    private thresholds = {
        responseTime: {
            warning: 5000,  // 5초
            critical: 10000 // 10초
        },
        errorRate: {
            warning: 0.1,   // 10%
            critical: 0.25  // 25%
        },
        successRate: {
            warning: 0.8,   // 80%
            critical: 0.6   // 60%
        }
    };

    // 알림 저장소
    private alerts: PerformanceAlert[] = [];
    private maxAlerts = 1000;

    // 상태 관리
    private enabled = true;
    private cleanupInterval: NodeJS.Timeout | null = null;

    private constructor() {
        this.startCleanupTimer();
    }

    public static getInstance(): PerformanceMonitor {
        if (!PerformanceMonitor.instance) {
            PerformanceMonitor.instance = new PerformanceMonitor();
        }
        return PerformanceMonitor.instance;
    }

    /**
     * 📊 성능 메트릭 기록
     */
    public recordMetric(metric: Omit<PerformanceMetric, 'timestamp'>): void {
        if (!this.enabled) return;

        const fullMetric: PerformanceMetric = {
            ...metric,
            timestamp: new Date().toISOString()
        };

        this.metrics.push(fullMetric);

        // 메트릭 제한 관리
        if (this.metrics.length > this.maxMetrics) {
            this.metrics = this.metrics.slice(-this.maxMetrics);
        }

        // 성능 알림 체크
        this.checkPerformanceAlerts(fullMetric);
    }

    /**
     * 📊 실시간 성능 통계 계산
     */
    public getPerformanceStats(timeRange?: number): PerformanceStats {
        const now = Date.now();
        const timeRangeMs = timeRange ? timeRange * 60 * 1000 : 60 * 60 * 1000; // 기본 1시간

        const relevantMetrics = this.metrics.filter(m =>
            now - new Date(m.timestamp).getTime() <= timeRangeMs
        );

        if (relevantMetrics.length === 0) {
            return this.getEmptyStats();
        }

        // 기본 통계
        const totalRequests = relevantMetrics.length;
        const successfulRequests = relevantMetrics.filter(m => m.success).length;
        const averageResponseTime = relevantMetrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests;
        const successRate = successfulRequests / totalRequests;
        const errorRate = 1 - successRate;
        const fallbackRate = relevantMetrics.filter(m => m.fallbacksUsed > 0).length / totalRequests;

        // 엔진별 통계
        const engineStats: Record<string, any> = {};
        const engines = [...new Set(relevantMetrics.map(m => m.engine))];

        engines.forEach(engine => {
            const engineMetrics = relevantMetrics.filter(m => m.engine === engine);
            const engineSuccessful = engineMetrics.filter(m => m.success).length;

            engineStats[engine] = {
                requests: engineMetrics.length,
                averageResponseTime: engineMetrics.reduce((sum, m) => sum + m.responseTime, 0) / engineMetrics.length,
                successRate: engineSuccessful / engineMetrics.length,
                confidence: engineMetrics.reduce((sum, m) => sum + m.confidence, 0) / engineMetrics.length
            };
        });

        // 모드별 통계
        const modeStats: Record<string, any> = {};
        const modes = [...new Set(relevantMetrics.map(m => m.mode))];

        modes.forEach(mode => {
            const modeMetrics = relevantMetrics.filter(m => m.mode === mode);
            const modeSuccessful = modeMetrics.filter(m => m.success).length;

            modeStats[mode] = {
                requests: modeMetrics.length,
                averageResponseTime: modeMetrics.reduce((sum, m) => sum + m.responseTime, 0) / modeMetrics.length,
                successRate: modeSuccessful / modeMetrics.length
            };
        });

        // 시간대별 통계 (최근 24시간)
        const hourlyStats = this.calculateHourlyStats(relevantMetrics);

        return {
            totalRequests,
            averageResponseTime,
            successRate,
            errorRate,
            fallbackRate,
            engineStats,
            modeStats,
            hourlyStats,
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * 📊 시간대별 통계 계산
     */
    private calculateHourlyStats(metrics: PerformanceMetric[]): Array<{
        hour: string;
        requests: number;
        averageResponseTime: number;
        successRate: number;
    }> {
        const hourlyData: Record<string, PerformanceMetric[]> = {};

        metrics.forEach(metric => {
            const hour = new Date(metric.timestamp).toISOString().slice(0, 13) + ':00:00.000Z';
            if (!hourlyData[hour]) {
                hourlyData[hour] = [];
            }
            hourlyData[hour].push(metric);
        });

        return Object.entries(hourlyData).map(([hour, hourMetrics]) => {
            const successful = hourMetrics.filter(m => m.success).length;
            return {
                hour,
                requests: hourMetrics.length,
                averageResponseTime: hourMetrics.reduce((sum, m) => sum + m.responseTime, 0) / hourMetrics.length,
                successRate: successful / hourMetrics.length
            };
        }).sort((a, b) => a.hour.localeCompare(b.hour));
    }

    /**
     * 🚨 성능 알림 체크
     */
    private checkPerformanceAlerts(metric: PerformanceMetric): void {
        const recentMetrics = this.metrics
            .filter(m =>
                m.engine === metric.engine &&
                Date.now() - new Date(m.timestamp).getTime() <= 5 * 60 * 1000 // 최근 5분
            );

        if (recentMetrics.length < 5) return; // 최소 5개 샘플 필요

        // 응답 시간 체크
        const avgResponseTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length;
        if (avgResponseTime > this.thresholds.responseTime.critical) {
            this.createAlert('critical', metric.engine, 'Response time critical', 'responseTime', avgResponseTime, this.thresholds.responseTime.critical);
        } else if (avgResponseTime > this.thresholds.responseTime.warning) {
            this.createAlert('warning', metric.engine, 'Response time warning', 'responseTime', avgResponseTime, this.thresholds.responseTime.warning);
        }

        // 에러율 체크
        const errorRate = recentMetrics.filter(m => !m.success).length / recentMetrics.length;
        if (errorRate > this.thresholds.errorRate.critical) {
            this.createAlert('critical', metric.engine, 'Error rate critical', 'errorRate', errorRate, this.thresholds.errorRate.critical);
        } else if (errorRate > this.thresholds.errorRate.warning) {
            this.createAlert('warning', metric.engine, 'Error rate warning', 'errorRate', errorRate, this.thresholds.errorRate.warning);
        }

        // 성공률 체크
        const successRate = recentMetrics.filter(m => m.success).length / recentMetrics.length;
        if (successRate < this.thresholds.successRate.critical) {
            this.createAlert('critical', metric.engine, 'Success rate critical', 'successRate', successRate, this.thresholds.successRate.critical);
        } else if (successRate < this.thresholds.successRate.warning) {
            this.createAlert('warning', metric.engine, 'Success rate warning', 'successRate', successRate, this.thresholds.successRate.warning);
        }
    }

    /**
     * 🚨 알림 생성
     */
    private createAlert(
        type: 'warning' | 'critical',
        engine: string,
        message: string,
        metric: string,
        value: number,
        threshold: number
    ): void {
        // 중복 알림 방지 (같은 엔진, 같은 메트릭에 대한 최근 알림 체크)
        const recentAlert = this.alerts.find(a =>
            a.engine === engine &&
            a.metric === metric &&
            Date.now() - new Date(a.timestamp).getTime() <= 10 * 60 * 1000 // 10분 내
        );

        if (recentAlert) return;

        const alert: PerformanceAlert = {
            id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            engine,
            message,
            metric,
            value,
            threshold,
            timestamp: new Date().toISOString()
        };

        this.alerts.push(alert);

        // 알림 제한 관리
        if (this.alerts.length > this.maxAlerts) {
            this.alerts = this.alerts.slice(-this.maxAlerts);
        }

        console.warn(`🚨 성능 알림 [${type.toUpperCase()}]: ${message} (${engine}) - ${metric}: ${value.toFixed(2)} > ${threshold}`);
    }

    /**
     * 🚨 알림 조회
     */
    public getAlerts(limit?: number): PerformanceAlert[] {
        const sorted = [...this.alerts].sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        return limit ? sorted.slice(0, limit) : sorted;
    }

    /**
     * 🧹 오래된 메트릭 정리
     */
    private startCleanupTimer(): void {
        this.cleanupInterval = setInterval(() => {
            const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

            // 24시간 이상 된 메트릭 제거
            this.metrics = this.metrics.filter(m =>
                new Date(m.timestamp).getTime() > oneDayAgo
            );

            // 24시간 이상 된 알림 제거
            this.alerts = this.alerts.filter(a =>
                new Date(a.timestamp).getTime() > oneDayAgo
            );

            console.log(`🧹 성능 메트릭 정리 완료: ${this.metrics.length}개 메트릭, ${this.alerts.length}개 알림`);
        }, 60 * 60 * 1000); // 1시간마다 실행
    }

    /**
     * 📊 빈 통계 반환
     */
    private getEmptyStats(): PerformanceStats {
        return {
            totalRequests: 0,
            averageResponseTime: 0,
            successRate: 0,
            errorRate: 0,
            fallbackRate: 0,
            engineStats: {},
            modeStats: {},
            hourlyStats: [],
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * 🔧 설정 관리
     */
    public updateThresholds(newThresholds: Partial<typeof this.thresholds>): void {
        this.thresholds = { ...this.thresholds, ...newThresholds };
    }

    public enable(): void {
        this.enabled = true;
    }

    public disable(): void {
        this.enabled = false;
    }

    public isEnabled(): boolean {
        return this.enabled;
    }

    /**
     * 🔄 메트릭 리셋
     */
    public resetMetrics(): void {
        this.metrics = [];
        this.alerts = [];
        console.log('📊 성능 메트릭 리셋 완료');
    }

    /**
     * 🛑 정리
     */
    public destroy(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.resetMetrics();
    }

    /**
     * 📊 현재 상태 요약
     */
    public getStatus(): {
        enabled: boolean;
        metricsCount: number;
        alertsCount: number;
        lastMetricTime?: string;
    } {
        const lastMetric = this.metrics[this.metrics.length - 1];

        return {
            enabled: this.enabled,
            metricsCount: this.metrics.length,
            alertsCount: this.alerts.length,
            lastMetricTime: lastMetric?.timestamp
        };
    }
} 