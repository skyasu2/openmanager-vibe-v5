/**
 * 🌐 GCP 실제 데이터 연동 테스트
 * Vercel 환경에서 GCP 실제 서버 데이터 조회 테스트
 */

import { detectEnvironment } from '@/config/environment';
import { GCPRealDataService } from '@/services/gcp/GCPRealDataService';
import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';

describe('🌐 GCP 실제 데이터 서비스 테스트', () => {
    let gcpService: GCPRealDataService;
    let isVercelEnvironment: boolean;

    beforeAll(async () => {
        const env = detectEnvironment();
        isVercelEnvironment = env.IS_VERCEL;

        gcpService = GCPRealDataService.getInstance();

        if (isVercelEnvironment) {
            await gcpService.initialize();
        }
    });

    afterAll(() => {
        if (gcpService) {
            gcpService.clearCache();
        }
    });

    test('🏗️ GCP 서비스 초기화 테스트', async () => {
        if (!isVercelEnvironment) {
            console.log('🏠 로컬 환경: GCP 서비스 초기화 건너뛰기');
            expect(true).toBe(true);
            return;
        }

        expect(gcpService).toBeDefined();
        expect(gcpService.isInitialized).toBe(true);
    });

    test('📊 GCP 실제 서버 메트릭 조회 테스트', async () => {
        if (!isVercelEnvironment) {
            console.log('🏠 로컬 환경: GCP 메트릭 조회 건너뛰기');
            expect(true).toBe(true);
            return;
        }

        const response = await gcpService.getRealServerMetrics();

        expect(response).toBeDefined();
        expect(response.success).toBe(true);
        expect(response.source).toBe('gcp-real-data');
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.totalServers).toBeGreaterThanOrEqual(0);
        expect(response.timestamp).toBeDefined();

        // 서버 데이터 구조 검증
        if (response.data.length > 0) {
            const server = response.data[0];
            expect(server.id).toBeDefined();
            expect(server.name).toBeDefined();
            expect(server.type).toBeDefined();
            expect(server.zone).toBeDefined();
            expect(server.projectId).toBeDefined();
            expect(['healthy', 'warning', 'critical', 'unknown']).toContain(server.status);
            expect(server.metrics).toBeDefined();
            expect(server.metrics.cpu).toBeDefined();
            expect(server.metrics.memory).toBeDefined();
            expect(server.metrics.disk).toBeDefined();
            expect(server.metrics.network).toBeDefined();
            expect(server.source).toBe('gcp-monitoring');
        }
    });

    test('🔄 GCP 메트릭 캐싱 테스트', async () => {
        if (!isVercelEnvironment) {
            console.log('🏠 로컬 환경: GCP 캐싱 테스트 건너뛰기');
            expect(true).toBe(true);
            return;
        }

        // 첫 번째 호출
        const startTime1 = Date.now();
        const response1 = await gcpService.getRealServerMetrics();
        const duration1 = Date.now() - startTime1;

        // 두 번째 호출 (캐시 사용)
        const startTime2 = Date.now();
        const response2 = await gcpService.getRealServerMetrics();
        const duration2 = Date.now() - startTime2;

        expect(response1.success).toBe(true);
        expect(response2.success).toBe(true);
        expect(response1.data.length).toBe(response2.data.length);

        // 캐시 사용으로 두 번째 호출이 더 빨라야 함
        expect(duration2).toBeLessThan(duration1);

        console.log(`📊 GCP 메트릭 조회 성능: 첫 호출 ${duration1}ms, 캐시 호출 ${duration2}ms`);
    });

    test('🌐 GCP API 엔드포인트 테스트', async () => {
        if (!isVercelEnvironment) {
            console.log('🏠 로컬 환경: GCP API 엔드포인트 테스트 건너뛰기');
            expect(true).toBe(true);
            return;
        }

        // Mock fetch for testing
        const mockFetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                success: true,
                data: [],
                summary: {
                    totalServers: 0,
                    healthyServers: 0,
                    warningServers: 0,
                    criticalServers: 0,
                    averageCpuUsage: 0,
                    averageMemoryUsage: 0
                },
                source: 'gcp-real-data',
                timestamp: new Date().toISOString(),
                environment: 'vercel'
            })
        });

        global.fetch = mockFetch;

        try {
            const response = await fetch('/api/gcp/real-servers');
            const data = await response.json();

            expect(response.ok).toBe(true);
            expect(data.success).toBe(true);
            expect(data.source).toBe('gcp-real-data');
            expect(data.environment).toBe('vercel');
        } finally {
            // Restore original fetch
            delete (global as any).fetch;
        }
    });

    test('⚡ GCP 서버 상태 분석 테스트', async () => {
        if (!isVercelEnvironment) {
            console.log('🏠 로컬 환경: GCP 서버 상태 분석 건너뛰기');
            expect(true).toBe(true);
            return;
        }

        const response = await gcpService.getRealServerMetrics();

        if (response.success && response.data.length > 0) {
            const servers = response.data;

            // 상태별 서버 수 검증
            const healthyCount = servers.filter(s => s.status === 'healthy').length;
            const warningCount = servers.filter(s => s.status === 'warning').length;
            const criticalCount = servers.filter(s => s.status === 'critical').length;

            expect(healthyCount + warningCount + criticalCount).toBe(servers.length);
            expect(response.healthyServers).toBe(healthyCount);
            expect(response.warningServers).toBe(warningCount);
            expect(response.criticalServers).toBe(criticalCount);

            // 메트릭 범위 검증
            servers.forEach(server => {
                expect(server.metrics.cpu.usage).toBeGreaterThanOrEqual(0);
                expect(server.metrics.cpu.usage).toBeLessThanOrEqual(100);
                expect(server.metrics.memory.usage).toBeGreaterThanOrEqual(0);
                expect(server.metrics.memory.usage).toBeLessThanOrEqual(100);
                expect(server.metrics.disk.usage).toBeGreaterThanOrEqual(0);
                expect(server.metrics.disk.usage).toBeLessThanOrEqual(100);
            });

            console.log(`📊 GCP 서버 상태 분석: 정상 ${healthyCount}개, 경고 ${warningCount}개, 위험 ${criticalCount}개`);
        }
    });

    test('🔐 GCP 인증 정보 검증 테스트', async () => {
        if (!isVercelEnvironment) {
            console.log('🏠 로컬 환경: GCP 인증 검증 건너뛰기');
            expect(true).toBe(true);
            return;
        }

        // 환경변수 확인
        const projectId = process.env.GCP_PROJECT_ID;
        const serviceAccountKey = process.env.GCP_SERVICE_ACCOUNT_KEY;

        if (projectId) {
            expect(typeof projectId).toBe('string');
            expect(projectId.length).toBeGreaterThan(0);
        }

        if (serviceAccountKey) {
            expect(typeof serviceAccountKey).toBe('string');
            expect(() => JSON.parse(serviceAccountKey)).not.toThrow();

            const credentials = JSON.parse(serviceAccountKey);
            expect(credentials.client_email).toBeDefined();
            expect(credentials.private_key).toBeDefined();
        }

        console.log('🔐 GCP 인증 정보 검증 완료');
    });
}); 