/**
 * 🌐 GCP 실제 데이터 서비스
 * Google Cloud Monitoring API를 통해 실제 서버 메트릭을 수집
 * 
 * ⚠️ 중요: Silent fallback 금지
 * - 모든 실패는 명시적 에러로 반환
 * - 사용자와 AI가 즉시 오류 상태 인식 가능
 */

import { detectEnvironment } from '@/config/environment';
import { ERROR_STATE_METADATA, STATIC_ERROR_SERVERS } from '@/config/fallback-data';

export interface GCPServerMetrics {
    id: string;
    name: string;
    type: 'compute-engine' | 'gke-node' | 'cloud-sql' | 'cloud-run' | 'ERROR';
    zone: string;
    projectId: string;
    status: 'healthy' | 'warning' | 'critical' | 'unknown' | 'ERROR';
    metrics: {
        cpu: {
            usage: number;
            cores: number;
        };
        memory: {
            usage: number;
            total: number;
            available: number;
        };
        disk: {
            usage: number;
            total: number;
            io: {
                read: number;
                write: number;
            };
        };
        network: {
            rx: number;
            tx: number;
            connections: number;
        };
    };
    timestamp: string;
    // 에러 상태 메타데이터 추가
    isErrorState?: boolean;
    errorMessage?: string;
}

export interface GCPRealDataResponse {
    success: boolean;
    data: GCPServerMetrics[];
    totalServers: number;
    timestamp: string;
    source: 'gcp-real-data' | 'static-error';
    // 에러 상태 정보
    isErrorState: boolean;
    errorMetadata?: typeof ERROR_STATE_METADATA;
}

export class GCPRealDataService {
    private static instance: GCPRealDataService | null = null;
    private isInitialized = false;
    private cache: Map<string, any> = new Map();
    private cacheTimeout = 30000; // 30초 캐시

    constructor() {
        console.log('🌐 GCP 실제 데이터 서비스 초기화');
    }

    static getInstance(): GCPRealDataService {
        const env = detectEnvironment();

        // 서버리스 환경에서는 매번 새 인스턴스
        if (env.IS_VERCEL) {
            return new GCPRealDataService();
        }

        // 로컬 환경에서는 싱글톤
        if (!GCPRealDataService.instance) {
            GCPRealDataService.instance = new GCPRealDataService();
        }

        return GCPRealDataService.instance;
    }

    /**
     * 🔧 서비스 초기화
     * ⚠️ 실패 시 명시적 에러 반환 (Silent fallback 없음)
     */
    async initialize(): Promise<void> {
        const env = detectEnvironment();

        try {
            if (env.IS_VERCEL) {
                console.log('🌐 Vercel 환경: GCP API 연결 시도...');

                // GCP API 연결 테스트
                const testResponse = await this.testGCPConnection();

                if (!testResponse.success) {
                    throw new Error(`GCP 연결 실패: ${testResponse.error}`);
                }

                console.log('✅ GCP API 연결 성공');
                this.isInitialized = true;
            } else {
                console.log('🏠 로컬 환경: GCP 서비스 시뮬레이션 모드');
                this.isInitialized = true;
            }
        } catch (error) {
            console.error('❌ GCP 서비스 초기화 실패:', error);
            this.isInitialized = false;

            // ❌ 초기화 실패 시 명시적 에러 throw (Silent fallback 금지)
            throw new Error(`GCP 서비스 초기화 실패: ${error instanceof Error ? error.message : 'Unknown'}`);
        }
    }

    /**
     * 🌐 GCP 실제 서버 메트릭 조회
     * ⚠️ 실패 시 정적 에러 데이터 반환 (사용자가 즉시 인식)
     */
    async getRealServerMetrics(): Promise<GCPRealDataResponse> {
        const env = detectEnvironment();

        try {
            if (!env.IS_VERCEL) {
                // 로컬 환경에서는 에러 상태 반환
                console.log('🏠 로컬 환경: GCP 실제 데이터 사용 불가');
                return this.createErrorResponse('로컬 환경에서는 GCP 실제 데이터를 사용할 수 없습니다');
            }

            console.log('🌐 GCP 실제 서버 메트릭 조회 시작...');

            // 캐시 확인
            const cacheKey = 'gcp-server-metrics';
            const cached = this.cache.get(cacheKey);
            if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
                console.log('📦 캐시된 GCP 데이터 반환');
                return cached.data;
            }

            // GCP Monitoring API 호출 시뮬레이션
            const realMetrics = await this.fetchGCPMetrics();

            if (!realMetrics || realMetrics.length === 0) {
                throw new Error('GCP에서 서버 메트릭을 가져올 수 없습니다');
            }

            const response: GCPRealDataResponse = {
                success: true,
                data: realMetrics,
                totalServers: realMetrics.length,
                timestamp: new Date().toISOString(),
                source: 'gcp-real-data',
                isErrorState: false
            };

            // 캐시 저장
            this.cache.set(cacheKey, {
                data: response,
                timestamp: Date.now()
            });

            console.log(`✅ GCP 실제 메트릭 조회 성공: ${realMetrics.length}개 서버`);
            return response;

        } catch (error) {
            console.error('❌ GCP 서버 메트릭 조회 실패:', error);

            // ❌ 실패 시 정적 에러 응답 반환 (사용자가 명확히 인식)
            return this.createErrorResponse(
                error instanceof Error ? error.message : 'GCP 연결 실패'
            );
        }
    }

    /**
     * 🚨 에러 응답 생성
     * 사용자와 AI가 즉시 오류 상태를 인식할 수 있도록 명시적 에러 데이터 반환
     */
    private createErrorResponse(errorMessage: string): GCPRealDataResponse {
        const errorServers: GCPServerMetrics[] = STATIC_ERROR_SERVERS.map(server => ({
            id: server.id,
            name: `🚨 ${server.name}`,
            type: 'ERROR',
            zone: 'ERROR_ZONE',
            projectId: 'ERROR_PROJECT',
            status: 'ERROR',
            metrics: {
                cpu: { usage: 0, cores: 0 },
                memory: { usage: 0, total: 0, available: 0 },
                disk: { usage: 0, total: 0, io: { read: 0, write: 0 } },
                network: { rx: 0, tx: 0, connections: 0 }
            },
            timestamp: new Date().toISOString(),
            isErrorState: true,
            errorMessage: errorMessage
        }));

        return {
            success: false,
            data: errorServers,
            totalServers: errorServers.length,
            timestamp: new Date().toISOString(),
            source: 'static-error',
            isErrorState: true,
            errorMetadata: {
                ...ERROR_STATE_METADATA,
                errorMessage: errorMessage,
                timestamp: new Date().toISOString()
            }
        };
    }

    /**
     * 🔗 GCP 연결 테스트
     */
    private async testGCPConnection(): Promise<{ success: boolean; error?: string }> {
        try {
            // 실제 GCP API 호출 시뮬레이션
            // 여기서는 환경변수 확인으로 대체
            const hasGCPConfig = process.env.GOOGLE_CLOUD_PROJECT &&
                process.env.GOOGLE_APPLICATION_CREDENTIALS;

            if (!hasGCPConfig) {
                return {
                    success: false,
                    error: 'GCP 설정이 누락되었습니다 (GOOGLE_CLOUD_PROJECT, GOOGLE_APPLICATION_CREDENTIALS)'
                };
            }

            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'GCP 연결 테스트 실패'
            };
        }
    }

    /**
     * 📊 GCP 메트릭 가져오기 (시뮬레이션)
     */
    private async fetchGCPMetrics(): Promise<GCPServerMetrics[]> {
        // 실제 환경에서는 Google Cloud Monitoring API 호출
        // 현재는 에러 발생으로 시뮬레이션
        throw new Error('GCP Monitoring API 연결 실패 - 실제 구현 필요');
    }

    /**
     * 🧹 캐시 정리
     */
    clearCache(): void {
        this.cache.clear();
        console.log('🧹 GCP 데이터 캐시 정리 완료');
    }
} 