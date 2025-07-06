/**
 * SupabaseTimeSeriesManager - Supabase 시계열 데이터 관리자
 * Phase 2: Supabase 시계열 DB 시스템
 * 
 * 🟢 Green 단계: 최소 구현으로 테스트 통과
 * 
 * 목표:
 * - Firestore 120% 사용량을 Supabase 60% 사용량으로 분산
 * - 시계열 데이터 7일 TTL 저장
 * - 배치 처리로 성능 최적화
 * - 집계 통계 및 분석 기능
 */

import { ServerMetric } from '@/types/gcp-data-generator';

export interface SupabaseClient {
    from(table: string): SupabaseQueryBuilder;
    rpc(fn: string, args?: any): Promise<any>;
    storage: {
        from(bucket: string): SupabaseStorageBucket;
    };
}

export interface SupabaseQueryBuilder {
    insert(values: any[] | any): Promise<{ data: any; error: any }>;
    select(columns?: string): SupabaseQueryBuilder;
    delete(): SupabaseQueryBuilder;
    update(values: any): SupabaseQueryBuilder;
    upsert(values: any[] | any): Promise<{ data: any; error: any }>;
    eq(column: string, value: any): SupabaseQueryBuilder;
    gte(column: string, value: any): SupabaseQueryBuilder;
    lte(column: string, value: any): SupabaseQueryBuilder;
    lt(column: string, value: any): SupabaseQueryBuilder;
    gt(column: string, value: any): SupabaseQueryBuilder;
    order(column: string, options?: { ascending?: boolean }): SupabaseQueryBuilder;
    limit(count: number): SupabaseQueryBuilder;
    range(from: number, to: number): SupabaseQueryBuilder;
    then(onfulfilled?: (value: { data: any; error: any }) => any): Promise<any>;
    data?: any;
    error?: any;
}

export interface SupabaseStorageBucket {
    upload(path: string, file: any, options?: any): Promise<{ data: any; error: any }>;
    download(path: string): Promise<{ data: any; error: any }>;
    remove(paths: string[]): Promise<{ data: any; error: any }>;
    list(path?: string, options?: any): Promise<{ data: any; error: any }>;
}

export interface TimeSeriesRecord {
    session_id: string;
    server_id: string;
    timestamp: string;
    cpu_usage: number;
    memory_usage: number;
    disk_usage: number;
    network_usage: number;
    request_count: number;
    error_rate: number;
    response_time: number;
    created_at: string;
}

export interface TimeSeriesQuery {
    sessionId?: string;
    serverId?: string;
    startTime?: Date;
    endTime?: Date;
    limit?: number;
    orderBy?: string;
    ascending?: boolean;
}

export interface AggregatedStats {
    sessionId: string;
    serverId?: string;
    timeRange: {
        start: Date;
        end: Date;
    };
    metrics: {
        avgCpuUsage: number;
        maxCpuUsage: number;
        avgMemoryUsage: number;
        maxMemoryUsage: number;
        avgDiskUsage: number;
        avgNetworkUsage: number;
        totalRequests: number;
        avgResponseTime: number;
        maxResponseTime: number;
        avgErrorRate: number;
        maxErrorRate: number;
    };
    dataPoints: number;
}

export interface AlertThreshold {
    metric: 'cpu_usage' | 'memory_usage' | 'disk_usage' | 'error_rate' | 'response_time';
    operator: '>' | '<' | '>=' | '<=' | '=';
    value: number;
    duration: number; // seconds
}

export class SupabaseTimeSeriesManager {
    private readonly TABLE_NAME = 'server_metrics_timeseries';
    private readonly TTL_DAYS = 7;
    private readonly BATCH_SIZE = 1000;

    constructor(private supabase: SupabaseClient) { }

    /**
     * 🟢 GREEN: 배치 메트릭 삽입
     */
    async batchInsertMetrics(sessionId: string, metrics: ServerMetric[]): Promise<void> {
        const records = this.transformToTimeSeriesRecords(sessionId, metrics);

        // 배치 크기로 나누어 처리
        for (let i = 0; i < records.length; i += this.BATCH_SIZE) {
            const batch = records.slice(i, i + this.BATCH_SIZE);
            await this.supabase.from(this.TABLE_NAME).insert(batch);
        }
    }

    /**
     * 🟢 GREEN: 시계열 데이터 조회
     */
    async queryTimeSeriesData(query: TimeSeriesQuery): Promise<TimeSeriesRecord[]> {
        let queryBuilder = this.supabase.from(this.TABLE_NAME).select('*');

        if (query.sessionId) {
            queryBuilder = queryBuilder.eq('session_id', query.sessionId);
        }

        if (query.serverId) {
            queryBuilder = queryBuilder.eq('server_id', query.serverId);
        }

        if (query.startTime) {
            queryBuilder = queryBuilder.gte('timestamp', query.startTime.toISOString());
        }

        if (query.endTime) {
            queryBuilder = queryBuilder.lte('timestamp', query.endTime.toISOString());
        }

        if (query.orderBy) {
            queryBuilder = queryBuilder.order(query.orderBy, {
                ascending: query.ascending ?? false
            });
        }

        if (query.limit) {
            queryBuilder = queryBuilder.limit(query.limit);
        }

        const result = await queryBuilder;
        const { data, error } = result as any; // 타입 단언으로 임시 해결

        if (error) {
            throw new Error(`시계열 데이터 조회 실패: ${error.message}`);
        }

        return data || [];
    }

    /**
     * 🟢 GREEN: 세션별 메트릭 히스토리 조회
     */
    async getSessionMetricsHistory(
        sessionId: string,
        startTime?: Date,
        endTime?: Date
    ): Promise<ServerMetric[]> {
        const query: TimeSeriesQuery = {
            sessionId,
            startTime,
            endTime,
            orderBy: 'timestamp',
            ascending: true
        };

        const records = await this.queryTimeSeriesData(query);
        return this.transformFromTimeSeriesRecords(records);
    }

    /**
     * 🟢 GREEN: 서버별 시계열 분석
     */
    async getServerTimeSeriesAnalysis(
        serverId: string,
        timeRange: { start: Date; end: Date }
    ): Promise<AggregatedStats> {
        const query: TimeSeriesQuery = {
            serverId,
            startTime: timeRange.start,
            endTime: timeRange.end
        };

        const records = await this.queryTimeSeriesData(query);
        return this.calculateAggregatedStats(records, serverId, timeRange);
    }

    /**
     * 🟢 GREEN: TTL 기반 자동 정리
     */
    async cleanupExpiredData(): Promise<number> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.TTL_DAYS);

        const { data, error } = await this.supabase
            .from(this.TABLE_NAME)
            .delete()
            .lte('created_at', cutoffDate.toISOString());

        if (error) {
            throw new Error(`만료 데이터 정리 실패: ${error.message}`);
        }

        return data?.length || 0;
    }

    /**
     * 🟢 GREEN: 집계 통계 계산
     */
    async calculateSessionAggregates(sessionId: string): Promise<AggregatedStats> {
        const records = await this.queryTimeSeriesData({ sessionId });

        if (records.length === 0) {
            throw new Error(`세션 ${sessionId}에 대한 데이터가 없습니다.`);
        }

        const timeRange = {
            start: new Date(Math.min(...records.map(r => new Date(r.timestamp).getTime()))),
            end: new Date(Math.max(...records.map(r => new Date(r.timestamp).getTime())))
        };

        return this.calculateAggregatedStats(records, undefined, timeRange, sessionId);
    }

    /**
     * 🔄 REFACTOR: 데이터 압축 및 아카이빙
     */
    async archiveOldData(daysOld: number = 30): Promise<string> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        // 아카이브할 데이터 조회
        const selectResult = await this.supabase
            .from(this.TABLE_NAME)
            .select('*')
            .lt('created_at', cutoffDate.toISOString());

        const { data: archiveData, error: selectError } = selectResult as any; // 타입 단언으로 임시 해결

        if (selectError) {
            throw new Error(`아카이브 데이터 조회 실패: ${selectError.message}`);
        }

        if (!archiveData || archiveData.length === 0) {
            return '아카이브할 데이터가 없습니다.';
        }

        // Storage에 압축 저장
        const archiveFileName = `metrics_archive_${cutoffDate.toISOString().split('T')[0]}.json`;
        const compressedData = JSON.stringify(archiveData);

        await this.supabase.storage
            .from('metrics-archive')
            .upload(archiveFileName, compressedData);

        // 원본 데이터 삭제
        await this.supabase
            .from(this.TABLE_NAME)
            .delete()
            .lte('created_at', cutoffDate.toISOString());

        return `${archiveData.length}개 레코드가 ${archiveFileName}로 아카이브되었습니다.`;
    }

    /**
     * 🔄 REFACTOR: 실시간 알림 트리거
     */
    async checkAlertThresholds(
        sessionId: string,
        thresholds: AlertThreshold[]
    ): Promise<{ metric: string; value: number; threshold: number; serverId: string }[]> {
        const recentData = await this.queryTimeSeriesData({
            sessionId,
            startTime: new Date(Date.now() - 5 * 60 * 1000), // 최근 5분
            orderBy: 'timestamp',
            ascending: false
        });

        const alerts: { metric: string; value: number; threshold: number; serverId: string }[] = [];

        for (const threshold of thresholds) {
            for (const record of recentData) {
                const value = this.getMetricValue(record, threshold.metric);

                if (this.evaluateThreshold(value, threshold.operator, threshold.value)) {
                    alerts.push({
                        metric: threshold.metric,
                        value,
                        threshold: threshold.value,
                        serverId: record.server_id
                    });
                }
            }
        }

        return alerts;
    }

    /**
     * 🔄 REFACTOR: 데이터 무결성 검증
     */
    async validateDataIntegrity(sessionId: string): Promise<{
        isValid: boolean;
        issues: string[];
        totalRecords: number;
        validRecords: number;
    }> {
        const records = await this.queryTimeSeriesData({ sessionId });
        const issues: string[] = [];
        let validRecords = 0;

        for (const record of records) {
            let isRecordValid = true;

            // 필수 필드 검증
            if (!record.server_id || !record.timestamp) {
                issues.push(`레코드 ${record.server_id || 'unknown'}에 필수 필드가 누락됨`);
                isRecordValid = false;
            }

            // 메트릭 범위 검증
            if (record.cpu_usage < 0 || record.cpu_usage > 100) {
                issues.push(`서버 ${record.server_id}의 CPU 사용률이 유효 범위를 벗어남: ${record.cpu_usage}`);
                isRecordValid = false;
            }

            if (record.memory_usage < 0 || record.memory_usage > 100) {
                issues.push(`서버 ${record.server_id}의 메모리 사용률이 유효 범위를 벗어남: ${record.memory_usage}`);
                isRecordValid = false;
            }

            if (record.error_rate < 0 || record.error_rate > 100) {
                issues.push(`서버 ${record.server_id}의 에러율이 유효 범위를 벗어남: ${record.error_rate}`);
                isRecordValid = false;
            }

            if (isRecordValid) {
                validRecords++;
            }
        }

        return {
            isValid: issues.length === 0,
            issues,
            totalRecords: records.length,
            validRecords
        };
    }

    /**
     * Private: ServerMetric을 TimeSeriesRecord로 변환
     */
    private transformToTimeSeriesRecords(sessionId: string, metrics: ServerMetric[]): TimeSeriesRecord[] {
        return metrics.map(metric => ({
            session_id: sessionId,
            server_id: metric.serverId,
            timestamp: metric.timestamp.toISOString(),
            cpu_usage: metric.systemMetrics.cpuUsage,
            memory_usage: metric.systemMetrics.memoryUsage,
            disk_usage: metric.systemMetrics.diskUsage,
            network_usage: metric.systemMetrics.networkUsage,
            request_count: metric.applicationMetrics.requestCount,
            error_rate: metric.applicationMetrics.errorRate,
            response_time: metric.applicationMetrics.responseTime,
            created_at: new Date().toISOString()
        }));
    }

    /**
     * Private: TimeSeriesRecord를 ServerMetric으로 변환
     */
    private transformFromTimeSeriesRecords(records: TimeSeriesRecord[]): ServerMetric[] {
        return records.map(record => ({
            timestamp: new Date(record.timestamp),
            serverId: record.server_id,
            systemMetrics: {
                cpuUsage: record.cpu_usage,
                memoryUsage: record.memory_usage,
                diskUsage: record.disk_usage,
                networkUsage: record.network_usage
            },
            applicationMetrics: {
                requestCount: record.request_count,
                errorRate: record.error_rate,
                responseTime: record.response_time
            }
        }));
    }

    /**
     * Private: 집계 통계 계산
     */
    private calculateAggregatedStats(
        records: TimeSeriesRecord[],
        serverId?: string,
        timeRange?: { start: Date; end: Date },
        sessionId?: string
    ): AggregatedStats {
        if (records.length === 0) {
            throw new Error('집계할 데이터가 없습니다.');
        }

        const cpuUsages = records.map(r => r.cpu_usage);
        const memoryUsages = records.map(r => r.memory_usage);
        const diskUsages = records.map(r => r.disk_usage);
        const networkUsages = records.map(r => r.network_usage);
        const requestCounts = records.map(r => r.request_count);
        const responseTimes = records.map(r => r.response_time);
        const errorRates = records.map(r => r.error_rate);

        return {
            sessionId: sessionId || records[0].session_id,
            serverId,
            timeRange: timeRange || {
                start: new Date(Math.min(...records.map(r => new Date(r.timestamp).getTime()))),
                end: new Date(Math.max(...records.map(r => new Date(r.timestamp).getTime())))
            },
            metrics: {
                avgCpuUsage: cpuUsages.reduce((a, b) => a + b, 0) / cpuUsages.length,
                maxCpuUsage: Math.max(...cpuUsages),
                avgMemoryUsage: memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length,
                maxMemoryUsage: Math.max(...memoryUsages),
                avgDiskUsage: diskUsages.reduce((a, b) => a + b, 0) / diskUsages.length,
                avgNetworkUsage: networkUsages.reduce((a, b) => a + b, 0) / networkUsages.length,
                totalRequests: requestCounts.reduce((a, b) => a + b, 0),
                avgResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
                maxResponseTime: Math.max(...responseTimes),
                avgErrorRate: errorRates.reduce((a, b) => a + b, 0) / errorRates.length,
                maxErrorRate: Math.max(...errorRates)
            },
            dataPoints: records.length
        };
    }

    /**
     * Private: 메트릭 값 추출
     */
    private getMetricValue(record: TimeSeriesRecord, metric: string): number {
        switch (metric) {
            case 'cpu_usage': return record.cpu_usage;
            case 'memory_usage': return record.memory_usage;
            case 'disk_usage': return record.disk_usage;
            case 'error_rate': return record.error_rate;
            case 'response_time': return record.response_time;
            default: return 0;
        }
    }

    /**
     * Private: 임계값 평가
     */
    private evaluateThreshold(value: number, operator: string, threshold: number): boolean {
        switch (operator) {
            case '>': return value > threshold;
            case '<': return value < threshold;
            case '>=': return value >= threshold;
            case '<=': return value <= threshold;
            case '=': return value === threshold;
            default: return false;
        }
    }
} 