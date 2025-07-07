/**
 * 🌐 GCP 실제 메트릭 수집기 v2.0
 * 
 * 목적: 시뮬레이션 제거, GCP에서 실제 서버 메트릭 수집
 * 책임:
 * - GCP Monitoring API 연동
 * - 실제 서버 메트릭 수집
 * - 메트릭 데이터 변환
 * - 실시간 모니터링
 */

import type { ServerInstance } from '@/types/data-generator';

interface GCPMetricsConfig {
    projectId: string;
    region: string;
    sessionId: string;
    refreshInterval: number;
}

interface GCPMetricData {
    serverId: string;
    timestamp: Date;
    cpu: number;
    memory: number;
    disk: number;
    network: {
        in: number;
        out: number;
    };
    requests: number;
    errors: number;
    uptime: number;
    customMetrics?: Record<string, any>;
}

export class GCPMetricsCollector {
    private config: GCPMetricsConfig;
    private lastCollectionTime = 0;
    private metricsCache = new Map<string, GCPMetricData>();

    constructor(config: GCPMetricsConfig) {
        this.config = config;
        console.log('🌐 GCP 실제 메트릭 수집기 초기화');
        console.log(`📡 프로젝트: ${config.projectId}`);
        console.log(`🌍 리전: ${config.region}`);
    }

    /**
     * 🌐 GCP에서 실제 서버 메트릭 수집 및 업데이트
     */
    async updateServerMetrics(server: ServerInstance): Promise<void> {
        try {
            // GCP에서 실제 메트릭 수집
            const gcpMetrics = await this.collectGCPMetrics(server.id);

            if (!gcpMetrics) {
                throw new Error(`GCP에서 서버 ${server.id}의 메트릭을 찾을 수 없습니다`);
            }

            // 실제 메트릭으로 서버 데이터 업데이트
            this.applyGCPMetrics(server, gcpMetrics);

            console.log(`✅ ${server.name}: GCP 실제 메트릭 업데이트 완료`);
        } catch (error) {
            console.error(`❌ ${server.name}: GCP 메트릭 수집 실패:`, error);
            throw new Error(`GCP 메트릭 수집 실패: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * 📡 GCP Monitoring API에서 메트릭 수집
     */
    private async collectGCPMetrics(serverId: string): Promise<GCPMetricData | null> {
        try {
            // 캐시 확인 (최근 수집한 데이터가 있으면 사용)
            const cached = this.metricsCache.get(serverId);
            const now = Date.now();

            if (cached && (now - this.lastCollectionTime) < this.config.refreshInterval) {
                console.log(`📦 캐시된 GCP 메트릭 사용: ${serverId}`);
                return cached;
            }

            // GCP Monitoring API 호출
            const response = await fetch(`/api/gcp/metrics?serverId=${serverId}&sessionId=${this.config.sessionId}`);

            if (!response.ok) {
                throw new Error(`GCP API 호출 실패: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(`GCP 메트릭 조회 실패: ${result.error}`);
            }

            // GCP 응답을 내부 형식으로 변환
            const gcpMetrics = this.transformGCPResponse(result.data, serverId);

            // 캐시 업데이트
            this.metricsCache.set(serverId, gcpMetrics);
            this.lastCollectionTime = now;

            return gcpMetrics;
        } catch (error) {
            console.error(`GCP 메트릭 수집 실패 (${serverId}):`, error);
            return null;
        }
    }

    /**
     * 🔄 GCP API 응답을 내부 메트릭 형식으로 변환
     */
    private transformGCPResponse(gcpData: any, serverId: string): GCPMetricData {
        return {
            serverId,
            timestamp: new Date(),
            cpu: this.extractCPUMetric(gcpData),
            memory: this.extractMemoryMetric(gcpData),
            disk: this.extractDiskMetric(gcpData),
            network: this.extractNetworkMetrics(gcpData),
            requests: this.extractRequestMetrics(gcpData),
            errors: this.extractErrorMetrics(gcpData),
            uptime: this.extractUptimeMetric(gcpData),
            customMetrics: this.extractCustomMetrics(gcpData, serverId),
        };
    }

    /**
     * 🌐 실제 GCP 메트릭을 서버 인스턴스에 적용
     */
    private applyGCPMetrics(server: ServerInstance, gcpMetrics: GCPMetricData): void {
        // GCP 메트릭을 서버 메트릭에 적용
        if (server.metrics) {
            server.metrics.cpu = gcpMetrics.cpu || 0;
            server.metrics.memory = gcpMetrics.memory || 0;
            server.metrics.disk = gcpMetrics.disk || 0;
            server.metrics.network = gcpMetrics.network || { in: 0, out: 0 };

            // 추가 메트릭
            server.metrics.uptime = gcpMetrics.uptime || 0;
        }

        // 서버 상태 결정 (허용된 상태만 사용)
        const statusValue = this.determineServerStatus(gcpMetrics);
        if (['warning', 'error', 'stopped', 'running', 'maintenance'].includes(statusValue)) {
            server.status = statusValue as 'warning' | 'error' | 'stopped' | 'running' | 'maintenance';
        } else {
            server.status = 'running'; // critical이나 healthy는 running으로 매핑
        }

        // 마지막 체크 시간 업데이트 (선택적 속성)
        if ('lastCheck' in server) {
            (server as any).lastCheck = gcpMetrics.timestamp.toISOString();
        }

        // GCP 태그 추가 (선택적 속성)
        if ('tags' in server) {
            const serverWithTags = server as any;
            if (!serverWithTags.tags || !serverWithTags.tags.includes('source:gcp')) {
                if (!serverWithTags.tags) serverWithTags.tags = [];
                serverWithTags.tags.push('source:gcp');
            }
        }
    }

    /**
     * 🏥 실제 메트릭 기반 서버 상태 결정
     */
    private determineServerStatus(metrics: GCPMetricData): 'healthy' | 'warning' | 'critical' {
        const { cpu, memory, disk, errors, requests } = metrics;
        const errorRate = requests > 0 ? (errors / requests) * 100 : 0;

        // Critical 조건 (GCP 권장 임계값)
        if (cpu > 90 || memory > 95 || disk > 95 || errorRate > 5) {
            return 'critical';
        }

        // Warning 조건
        if (cpu > 70 || memory > 80 || disk > 85 || errorRate > 1) {
            return 'warning';
        }

        return 'healthy';
    }

    // ===== GCP 메트릭 추출 메서드들 =====

    private extractCPUMetric(gcpData: any): number {
        return gcpData.cpu_utilization || gcpData.cpu || 0;
    }

    private extractMemoryMetric(gcpData: any): number {
        return gcpData.memory_utilization || gcpData.memory || 0;
    }

    private extractDiskMetric(gcpData: any): number {
        return gcpData.disk_utilization || gcpData.disk || 0;
    }

    private extractNetworkMetrics(gcpData: any): { in: number; out: number } {
        return {
            in: gcpData.network_in || gcpData.network?.in || 0,
            out: gcpData.network_out || gcpData.network?.out || 0,
        };
    }

    private extractRequestMetrics(gcpData: any): number {
        return gcpData.requests_per_second || gcpData.requests || 0;
    }

    private extractErrorMetrics(gcpData: any): number {
        return gcpData.error_count || gcpData.errors || 0;
    }

    private extractUptimeMetric(gcpData: any): number {
        return gcpData.uptime_seconds || gcpData.uptime || 0;
    }

    private extractCustomMetrics(gcpData: any, serverId: string): Record<string, any> {
        const customMetrics: Record<string, any> = {};

        // 서버 타입별 커스텀 메트릭 추출
        if (serverId.includes('db')) {
            customMetrics.connections = gcpData.database_connections || 0;
            customMetrics.queries_per_second = gcpData.queries_per_second || 0;
            customMetrics.replication_lag = gcpData.replication_lag || 0;
        }

        if (serverId.includes('cache')) {
            customMetrics.cache_hit_ratio = gcpData.cache_hit_ratio || 0;
            customMetrics.cache_memory_usage = gcpData.cache_memory_usage || 0;
        }

        if (serverId.includes('web')) {
            customMetrics.active_connections = gcpData.active_connections || 0;
            customMetrics.response_time = gcpData.response_time || 0;
        }

        return customMetrics;
    }

    /**
     * 🔄 모든 서버의 메트릭을 배치로 수집
     */
    async batchUpdateMetrics(servers: ServerInstance[]): Promise<void> {
        console.log(`🌐 ${servers.length}개 서버의 GCP 메트릭 배치 수집 시작...`);

        const updatePromises = servers.map(server =>
            this.updateServerMetrics(server).catch((error: any): null => {
                console.error(`서버 ${server.id} 메트릭 업데이트 실패:`, error);
                return null;
            })
        );

        await Promise.allSettled(updatePromises);
        console.log(`✅ GCP 메트릭 배치 수집 완료`);
    }

    /**
     * 🧹 캐시 정리
     */
    clearCache(): void {
        this.metricsCache.clear();
        this.lastCollectionTime = 0;
        console.log('🧹 GCP 메트릭 캐시 정리 완료');
    }

    /**
     * 📊 수집기 상태 조회
     */
    getCollectorStatus(): {
        cacheSize: number;
        lastCollectionTime: number;
        config: GCPMetricsConfig;
    } {
        return {
            cacheSize: this.metricsCache.size,
            lastCollectionTime: this.lastCollectionTime,
            config: this.config,
        };
    }

    /**
     * 🚫 시뮬레이션 기능 완전 제거됨
     */
    simulateIncidents(): void {
        throw new Error('시뮬레이션 기능이 제거되었습니다. GCP에서 실제 메트릭을 사용하세요.');
    }

    updateSimulationConfig(): void {
        throw new Error('시뮬레이션 기능이 제거되었습니다. GCP에서 실제 메트릭을 사용하세요.');
    }

    getActiveIncidents(): never {
        throw new Error('시뮬레이션 기능이 제거되었습니다. GCP에서 실제 알림을 사용하세요.');
    }
}

// 🔧 GCP 메트릭 수집기 팩토리 함수
export function createGCPMetricsCollector(config: GCPMetricsConfig): GCPMetricsCollector {
    return new GCPMetricsCollector(config);
}

// 🚫 레거시 호환성 (사용 금지)
export const MetricsGenerator = GCPMetricsCollector; 