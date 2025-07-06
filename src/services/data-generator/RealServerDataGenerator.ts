/**
 * 🚫 서버리스 호환: 실제 서버 데이터 생성기
 *
 * 싱글톤 패턴 제거, 요청별 인스턴스 생성
 * 서버리스 환경에서 상태 유지 없이 동작
 */

import { systemLogger } from '@/lib/logger';
import { ServerData } from '@/types/server';

interface ServerGenerationConfig {
    count?: number;
    includeMetrics?: boolean;
    simulateLoad?: boolean;
    region?: string;
}

/**
 * 🚫 서버리스 호환: 요청별 데이터 생성기
 * 전역 상태 없이 각 요청마다 새로운 인스턴스 생성
 */
export class RequestScopedServerDataGenerator {
    private readonly config: Required<ServerGenerationConfig>;

    constructor(config: ServerGenerationConfig = {}) {
        this.config = {
            count: config.count || 16,
            includeMetrics: config.includeMetrics !== false,
            simulateLoad: config.simulateLoad !== false,
            region: config.region || 'auto',
        };

        console.log('🚫 서버리스 호환: 요청별 서버 데이터 생성기 초기화');
    }

    /**
     * 🔧 서버 데이터 생성 (요청별)
     */
    async generateServers(): Promise<ServerData[]> {
        try {
            const servers: ServerData[] = [];

            for (let i = 1; i <= this.config.count; i++) {
                const server = this.createServerData(i);
                servers.push(server);
            }

            systemLogger.system(`✅ ${this.config.count}개 서버 데이터 생성 완료 (요청별)`);
            return servers;
        } catch (error) {
            systemLogger.error('❌ 서버 데이터 생성 실패:', error);
            throw error;
        }
    }

    /**
     * 🔧 개별 서버 데이터 생성
     */
    private createServerData(index: number): ServerData {
        const serverTypes = ['web', 'api', 'database', 'cache', 'worker'];
        const environments = ['production', 'staging', 'development'];
        const regions = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'];

        const type = serverTypes[Math.floor(Math.random() * serverTypes.length)];
        const environment = environments[Math.floor(Math.random() * environments.length)];
        const region = regions[Math.floor(Math.random() * regions.length)];

        // 상태 분포: 70% healthy, 20% warning, 10% critical
        const statusRand = Math.random();
        let status: 'healthy' | 'warning' | 'critical';
        if (statusRand < 0.7) status = 'healthy';
        else if (statusRand < 0.9) status = 'warning';
        else status = 'critical';

        return {
            id: `server-${index.toString().padStart(3, '0')}`,
            name: `${type}-${environment}-${index}`,
            status,
            cpu: Math.floor(Math.random() * 100),
            memory: Math.floor(Math.random() * 100),
            disk: Math.floor(Math.random() * 100),
            network: Math.floor(Math.random() * 1000),
            uptime: Math.floor(Math.random() * 365 * 24 * 60 * 60), // 초 단위
            lastCheck: new Date().toISOString(),
            type,
            environment,
            region,
            version: `v${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`,
            tags: [`env:${environment}`, `type:${type}`, `region:${region}`],
            alerts: status === 'critical' ? Math.floor(Math.random() * 5) + 1 :
                status === 'warning' ? Math.floor(Math.random() * 2) : 0,
        };
    }

    /**
     * 🚫 자동 생성 비활성화
     */
    startAutoGeneration(): void {
        console.warn('⚠️ 자동 생성 무시됨 - 서버리스에서는 요청별 처리');
    }

    /**
     * 🚫 자동 생성 중지 비활성화
     */
    stopAutoGeneration(): void {
        console.warn('⚠️ 자동 생성 중지 무시됨 - 서버리스 환경');
    }

    /**
     * 🚫 상태 업데이트 비활성화
     */
    updateServerStatus(serverId: string, status: 'healthy' | 'warning' | 'critical'): void {
        console.warn(`⚠️ 서버 상태 업데이트 무시됨: ${serverId} - 서버리스에서는 요청별 처리`);
    }

    /**
     * 🚫 메트릭 조회 비활성화
     */
    getServerMetrics(serverId: string): any {
        console.warn(`⚠️ 서버 메트릭 조회 무시됨: ${serverId} - 서버리스에서는 요청별 처리`);
        return null;
    }

    /**
     * 🚫 전체 상태 조회 비활성화
     */
    getAllServersStatus(): { total: number; healthy: number; warning: number; critical: number } {
        console.warn('⚠️ 모든 서버 상태 조회 무시됨 - 서버리스에서는 요청별 처리');
        return { total: 0, healthy: 0, warning: 0, critical: 0 };
    }

    /**
     * 🚫 헬스체크 비활성화
     */
    async healthCheck(): Promise<any> {
        console.warn('⚠️ 헬스체크 무시됨 - 서버리스에서는 Vercel이 자동 관리');
        return { status: 'serverless', message: 'Vercel이 자동 관리합니다.' };
    }

    /**
     * 🚫 초기화 비활성화
     */
    async initialize(): Promise<void> {
        console.warn('⚠️ 초기화 무시됨 - 서버리스에서는 요청별 처리');
    }

    /**
     * 🚫 정리 비활성화
     */
    dispose(): void {
        console.warn('⚠️ 정리 무시됨 - 서버리스에서는 자동 정리');
    }
}

/**
 * 🔧 서버리스 호환 팩토리 함수
 */
export function createServerDataGenerator(config?: ServerGenerationConfig): RequestScopedServerDataGenerator {
    return new RequestScopedServerDataGenerator(config);
}

/**
 * 🚫 레거시 호환성 (사용 금지)
 * @deprecated 서버리스 환경에서는 createServerDataGenerator() 사용
 */
export const RealServerDataGenerator = {
    getInstance: () => {
        console.warn('⚠️ RealServerDataGenerator.getInstance()는 서버리스에서 사용 금지.');
        console.warn('🔧 대신 createServerDataGenerator()를 사용하세요.');
        return new RequestScopedServerDataGenerator();
    }
}; 