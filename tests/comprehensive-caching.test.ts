/**
 * 🧪 포괄적인 캐싱 시스템 테스트
 * 
 * Phase 2-5 최적화의 캐싱 확대 테스트
 */

import { APICacheManager, getCacheHeaders, getCacheKey } from '../src/lib/api-cache-manager';

describe('포괄적인 캐싱 시스템', () => {
    let cacheManager: APICacheManager;

    beforeEach(() => {
        cacheManager = APICacheManager.getInstance();
        cacheManager.clear();
    });

    afterEach(() => {
        cacheManager.clear();
    });

    describe('다양한 API 엔드포인트 캐싱', () => {
        test('health API 캐싱', () => {
            const healthData = {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                services: { nextjs: 'healthy', environment: 'healthy' },
            };

            const key = getCacheKey('/api/health');
            cacheManager.set(key, healthData, { category: 'health' });

            const result = cacheManager.get(key);
            expect(result).toEqual(healthData);
        });

        test('metrics API 캐싱', () => {
            const metricsData = {
                totalServers: 20,
                onlineServers: 15,
                averageCpu: 45,
                timestamp: new Date().toISOString(),
            };

            const key = getCacheKey('/api/metrics');
            cacheManager.set(key, metricsData, { category: 'system' });

            const result = cacheManager.get(key);
            expect(result).toEqual(metricsData);
        });

        test('servers API 캐싱', () => {
            const serversData = [
                { id: 'server-1', status: 'healthy', cpu: 30 },
                { id: 'server-2', status: 'warning', cpu: 75 },
            ];

            const key = getCacheKey('/api/servers');
            cacheManager.set(key, serversData, { category: 'servers' });

            const result = cacheManager.get(key);
            expect(result).toEqual(serversData);
        });

        test('dashboard API 캐싱', () => {
            const dashboardData = {
                summary: { total: 20, healthy: 15, warning: 3, critical: 2 },
                metrics: { cpu: 45, memory: 60, disk: 30 },
                timestamp: new Date().toISOString(),
            };

            const key = getCacheKey('/api/dashboard');
            cacheManager.set(key, dashboardData, { category: 'dashboard' });

            const result = cacheManager.get(key);
            expect(result).toEqual(dashboardData);
        });
    });

    describe('캐시 헤더 생성', () => {
        test('캐시 히트 헤더 검증', () => {
            const headers = getCacheHeaders(true);

            expect(headers).toHaveProperty('X-Cache', 'HIT');
            expect(headers).toHaveProperty('Cache-Control');
            expect(headers['Cache-Control']).toContain('public');
        });

        test('캐시 미스 헤더 검증', () => {
            const headers = getCacheHeaders(false);

            expect(headers).toHaveProperty('X-Cache', 'MISS');
            expect(headers).toHaveProperty('Cache-Control');
            expect(headers['Cache-Control']).toContain('public');
        });

        test('커스텀 TTL 헤더', () => {
            const customTTL = 1800; // 30분
            const headers = getCacheHeaders(false, customTTL);

            expect(headers['Cache-Control']).toContain(`s-maxage=${customTTL}`);
        });
    });

    describe('캐시 키 생성 패턴', () => {
        test('단순 경로 캐시 키', () => {
            const key = getCacheKey('/api/health');
            expect(key).toBe('/api/health');
        });

        test('쿼리 파라미터가 있는 캐시 키', () => {
            const key = getCacheKey('/api/servers', {
                page: 1,
                limit: 10,
                status: 'healthy'
            });

            expect(key).toContain('/api/servers');
            expect(key).toContain('page=1');
            expect(key).toContain('limit=10');
            expect(key).toContain('status=healthy');
        });

        test('복잡한 객체 파라미터 캐시 키', () => {
            const params = {
                filters: { cpu: '>50', memory: '<80' },
                sort: ['name', 'status'],
                pagination: { page: 2, size: 20 }
            };

            const key = getCacheKey('/api/servers', params);
            expect(key).toContain('/api/servers');
            expect(key.length).toBeGreaterThan('/api/servers'.length);
        });
    });

    describe('캐시 성능 및 메모리 관리', () => {
        test('대량 데이터 캐싱 성능', () => {
            const startTime = Date.now();

            // 100개 항목 캐싱
            for (let i = 0; i < 100; i++) {
                const key = getCacheKey(`/api/test/${i}`);
                const data = { id: i, data: new Array(100).fill(`item-${i}`) };
                cacheManager.set(key, data);
            }

            const endTime = Date.now();
            const duration = endTime - startTime;

            // 100개 항목 캐싱이 1초 이내에 완료되어야 함
            expect(duration).toBeLessThan(1000);
        });

        test('캐시 메모리 사용량 추적', () => {
            // 초기 상태
            const initialStats = cacheManager.getStats();
            expect(initialStats.memoryUsage).toBeGreaterThanOrEqual(0);

            // 데이터 추가
            for (let i = 0; i < 50; i++) {
                cacheManager.set(`test-${i}`, { data: new Array(100).fill(i) });
            }

            // 메모리 사용량 증가 확인
            const afterStats = cacheManager.getStats();
            expect(afterStats.memoryUsage).toBeGreaterThan(initialStats.memoryUsage);
            expect(afterStats.totalEntries).toBe(50);
        });

        test('캐시 히트율 추적', () => {
            const testKey = 'hit-rate-test';
            const testData = { message: 'test data' };

            // 미스 발생
            cacheManager.get(testKey);

            // 데이터 저장
            cacheManager.set(testKey, testData);

            // 히트 발생
            cacheManager.get(testKey);
            cacheManager.get(testKey);

            const stats = cacheManager.getStats();
            expect(stats.totalHits).toBeGreaterThanOrEqual(2);
            expect(stats.totalMisses).toBeGreaterThanOrEqual(1);
            expect(stats.hitRate).toBeGreaterThan(0);
        });
    });

    describe('TTL 및 만료 관리', () => {
        test('짧은 TTL 만료', async () => {
            const key = 'short-ttl-test';
            const data = { message: 'expires quickly' };

            cacheManager.set(key, data, { customTTL: 50 });

            // 즉시 조회 - 존재해야 함
            expect(cacheManager.get(key)).toEqual(data);

            // TTL 만료 대기
            await new Promise(resolve => setTimeout(resolve, 100));

            // 만료 후 조회 - null이어야 함
            expect(cacheManager.get(key)).toBeNull();
        });

        test('긴 TTL 유지', async () => {
            const key = 'long-ttl-test';
            const data = { message: 'persists longer' };

            cacheManager.set(key, data, { customTTL: 500 });

            // 중간 시점 조회
            await new Promise(resolve => setTimeout(resolve, 100));
            expect(cacheManager.get(key)).toEqual(data);

            // 여전히 유효한 시점 조회
            await new Promise(resolve => setTimeout(resolve, 200));
            expect(cacheManager.get(key)).toEqual(data);
        });
    });

    describe('캐시 정리 및 관리', () => {
        test('전체 캐시 정리', () => {
            // 데이터 추가
            cacheManager.set('key1', 'data1');
            cacheManager.set('key2', 'data2');
            cacheManager.set('key3', 'data3');

            // 정리 전 확인
            expect(cacheManager.get('key1')).toBe('data1');
            expect(cacheManager.get('key2')).toBe('data2');

            // 전체 정리
            cacheManager.clear();

            // 정리 후 확인
            expect(cacheManager.get('key1')).toBeNull();
            expect(cacheManager.get('key2')).toBeNull();
            expect(cacheManager.get('key3')).toBeNull();
        });

        test('패턴별 캐시 정리', () => {
            // 다양한 패턴의 키 추가
            cacheManager.set('/api/servers/1', 'server1');
            cacheManager.set('/api/servers/2', 'server2');
            cacheManager.set('/api/health', 'health');
            cacheManager.set('/api/metrics', 'metrics');

            // 특정 패턴 정리
            const deletedCount = cacheManager.clearByPattern('/api/servers');

            expect(deletedCount).toBe(2);
            expect(cacheManager.get('/api/servers/1')).toBeNull();
            expect(cacheManager.get('/api/servers/2')).toBeNull();
            expect(cacheManager.get('/api/health')).toBe('health');
            expect(cacheManager.get('/api/metrics')).toBe('metrics');
        });

        test('개별 키 삭제', () => {
            cacheManager.set('delete-test', 'will be deleted');
            cacheManager.set('keep-test', 'will be kept');

            expect(cacheManager.get('delete-test')).toBe('will be deleted');

            const deleted = cacheManager.delete('delete-test');
            expect(deleted).toBe(true);

            expect(cacheManager.get('delete-test')).toBeNull();
            expect(cacheManager.get('keep-test')).toBe('will be kept');
        });
    });

    describe('에러 처리 및 복구', () => {
        test('잘못된 키 처리', () => {
            expect(() => cacheManager.get('')).not.toThrow();
            expect(() => cacheManager.set('', 'data')).not.toThrow();
            expect(() => cacheManager.delete('')).not.toThrow();
        });

        test('null/undefined 데이터 처리', () => {
            expect(() => cacheManager.set('null-test', null)).not.toThrow();
            expect(() => cacheManager.set('undefined-test', undefined)).not.toThrow();

            expect(cacheManager.get('null-test')).toBeNull();
            expect(cacheManager.get('undefined-test')).toBeUndefined();
        });

        test('대용량 데이터 처리', () => {
            const largeData = {
                array: new Array(10000).fill(0).map((_, i) => ({ id: i, data: `item-${i}` })),
                timestamp: Date.now(),
            };

            expect(() => cacheManager.set('large-data', largeData)).not.toThrow();

            const retrieved = cacheManager.get('large-data');
            expect(retrieved).toEqual(largeData);
            expect(retrieved.array.length).toBe(10000);
        });
    });
}); 