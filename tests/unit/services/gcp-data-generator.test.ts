/**
 * 🌐 GCP 데이터 생성기 테스트 (실제 데이터 기반)
 * 목업 데이터 대신 GCP 실제 데이터를 사용하는 테스트
 */

import { detectEnvironment } from '@/config/environment';
import { GCPRealDataService } from '@/services/gcp/GCPRealDataService';
import { afterEach, beforeAll, describe, expect, test } from 'vitest';

describe('🌐 GCP 실제 데이터 생성기 테스트', () => {
    let gcpService: GCPRealDataService;
    let isVercelEnvironment: boolean;

    beforeAll(async () => {
        const env = detectEnvironment();
        isVercelEnvironment = env.IS_VERCEL;

        gcpService = GCPRealDataService.getInstance();
    });

    afterEach(() => {
        if (gcpService) {
            gcpService.clearCache();
        }
    });

    test('🏗️ 환경별 데이터 생성기 초기화', async () => {
        if (isVercelEnvironment) {
            // Vercel 환경: GCP 실제 데이터 사용
            const initialized = await gcpService.initialize();
            expect(initialized).toBe(true);
            expect(gcpService.isInitialized).toBe(true);
            console.log('✅ Vercel 환경: GCP 실제 데이터 서비스 초기화 완료');
        } else {
            // 로컬 환경: 목업 데이터 사용
            const { RealServerDataGenerator } = await import('@/services/data-generator/RealServerDataGenerator');
            const mockGenerator = RealServerDataGenerator.getInstance();

            if (!mockGenerator.isInitialized) {
                await mockGenerator.initialize();
            }

            expect(mockGenerator.isInitialized).toBe(true);
            console.log('✅ 로컬 환경: 목업 데이터 생성기 초기화 완료');
        }
    });

    test('📊 서버 데이터 조회 성능 테스트', async () => {
        const startTime = Date.now();

        if (isVercelEnvironment) {
            // Vercel: GCP 실제 데이터 조회
            const response = await gcpService.getRealServerMetrics();
            const duration = Date.now() - startTime;

            expect(response.success).toBe(true);
            expect(Array.isArray(response.data)).toBe(true);
            expect(duration).toBeLessThan(5000); // 5초 이내

            console.log(`⚡ GCP 실제 데이터 조회 성능: ${duration}ms`);
        } else {
            // 로컬: 목업 데이터 조회
            const { RealServerDataGenerator } = await import('@/services/data-generator/RealServerDataGenerator');
            const mockGenerator = RealServerDataGenerator.getInstance();

            const servers = await mockGenerator.getAllServers();
            const duration = Date.now() - startTime;

            expect(Array.isArray(servers)).toBe(true);
            expect(duration).toBeLessThan(1000); // 1초 이내

            console.log(`⚡ 목업 데이터 조회 성능: ${duration}ms`);
        }
    });

    test('🔍 데이터 품질 검증', async () => {
        if (isVercelEnvironment) {
            // Vercel: GCP 실제 데이터 품질 검증
            const response = await gcpService.getRealServerMetrics();

            expect(response.success).toBe(true);
            expect(response.source).toBe('gcp-real-data');

            if (response.data.length > 0) {
                const server = response.data[0];

                // GCP 서버 데이터 구조 검증
                expect(server.id).toMatch(/^gcp-/);
                expect(server.type).toMatch(/^(compute-engine|gke-node|cloud-sql|cloud-run)$/);
                expect(server.zone).toMatch(/^asia-northeast3-[a-z]$/);
                expect(server.projectId).toBeDefined();
                expect(server.source).toBe('gcp-monitoring');

                // 메트릭 범위 검증
                expect(server.metrics.cpu.usage).toBeGreaterThanOrEqual(0);
                expect(server.metrics.cpu.usage).toBeLessThanOrEqual(100);
                expect(server.metrics.memory.usage).toBeGreaterThanOrEqual(0);
                expect(server.metrics.memory.usage).toBeLessThanOrEqual(100);

                console.log(`✅ GCP 실제 데이터 품질 검증 완료: ${response.data.length}개 서버`);
            }
        } else {
            // 로컬: 목업 데이터 품질 검증
            const { RealServerDataGenerator } = await import('@/services/data-generator/RealServerDataGenerator');
            const mockGenerator = RealServerDataGenerator.getInstance();

            const servers = await mockGenerator.getAllServers();

            if (servers.length > 0) {
                const server = servers[0];

                // 목업 서버 데이터 구조 검증
                expect(server.id).toBeDefined();
                expect(server.name).toBeDefined();
                expect(server.status).toBeDefined();
                expect(server.metrics).toBeDefined();

                console.log(`✅ 목업 데이터 품질 검증 완료: ${servers.length}개 서버`);
            }
        }
    });

    test('📈 실시간 메트릭 변동 테스트', async () => {
        if (isVercelEnvironment) {
            // GCP 실제 데이터의 실시간 변동 확인
            const response1 = await gcpService.getRealServerMetrics();

            // 캐시 클리어 후 재조회
            gcpService.clearCache();
            await new Promise(resolve => setTimeout(resolve, 100));

            const response2 = await gcpService.getRealServerMetrics();

            expect(response1.success).toBe(true);
            expect(response2.success).toBe(true);

            if (response1.data.length > 0 && response2.data.length > 0) {
                // 시간 차이로 인한 메트릭 변동 확인
                const server1 = response1.data[0];
                const server2 = response2.data[0];

                // CPU 사용률이 변동될 수 있음 (실시간 데이터)
                expect(Math.abs(server1.metrics.cpu.usage - server2.metrics.cpu.usage)).toBeLessThan(50);

                console.log(`📈 GCP 실시간 메트릭 변동 확인: CPU ${server1.metrics.cpu.usage}% → ${server2.metrics.cpu.usage}%`);
            }
        } else {
            console.log('🏠 로컬 환경: 실시간 메트릭 변동 테스트 건너뛰기');
            expect(true).toBe(true);
        }
    });

    test('🚨 장애 상황 시뮬레이션', async () => {
        if (isVercelEnvironment) {
            // GCP 실제 데이터에서 위험 상태 서버 확인
            const response = await gcpService.getRealServerMetrics();

            if (response.success && response.data.length > 0) {
                const criticalServers = response.data.filter(s => s.status === 'critical');
                const warningServers = response.data.filter(s => s.status === 'warning');

                // 위험/경고 상태 서버의 메트릭 검증
                [...criticalServers, ...warningServers].forEach(server => {
                    const highUsage = server.metrics.cpu.usage > 80 ||
                        server.metrics.memory.usage > 85 ||
                        server.metrics.disk.usage > 90;

                    if (server.status === 'critical') {
                        expect(highUsage).toBe(true);
                    }
                });

                console.log(`🚨 장애 상황 분석: 위험 ${criticalServers.length}개, 경고 ${warningServers.length}개`);
            }
        } else {
            // 로컬: 목업 데이터로 장애 시뮬레이션
            const { RealServerDataGenerator } = await import('@/services/data-generator/RealServerDataGenerator');
            const mockGenerator = RealServerDataGenerator.getInstance();

            const servers = await mockGenerator.getAllServers();

            if (servers.length > 0) {
                // 목업 데이터에서도 다양한 상태 확인
                const statuses = servers.map(s => s.status);
                const uniqueStatuses = [...new Set(statuses)];

                expect(uniqueStatuses.length).toBeGreaterThan(1); // 다양한 상태 존재

                console.log(`🚨 목업 장애 시뮬레이션: ${uniqueStatuses.join(', ')} 상태 확인`);
            }
        }
    });

    test('💾 데이터 캐싱 효율성 테스트', async () => {
        if (isVercelEnvironment) {
            // GCP 데이터 캐싱 성능 측정
            const startTime1 = Date.now();
            const response1 = await gcpService.getRealServerMetrics();
            const duration1 = Date.now() - startTime1;

            const startTime2 = Date.now();
            const response2 = await gcpService.getRealServerMetrics(); // 캐시 사용
            const duration2 = Date.now() - startTime2;

            expect(response1.success).toBe(true);
            expect(response2.success).toBe(true);
            expect(duration2).toBeLessThan(duration1); // 캐시가 더 빨라야 함

            const cacheEfficiency = ((duration1 - duration2) / duration1 * 100).toFixed(1);
            console.log(`💾 GCP 캐싱 효율성: ${cacheEfficiency}% 성능 향상 (${duration1}ms → ${duration2}ms)`);
        } else {
            console.log('🏠 로컬 환경: GCP 캐싱 테스트 건너뛰기');
            expect(true).toBe(true);
        }
    });
}); 