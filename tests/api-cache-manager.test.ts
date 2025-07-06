/**
 * 🧪 API 캐시 매니저 테스트
 * 
 * Phase 2에서 추가된 통합 API 캐싱 시스템 테스트
 */

import { APICacheManager, getCacheHeaders, getCacheKey } from '../src/lib/api-cache-manager';

describe('APICacheManager', () => {
    let cacheManager: APICacheManager;

    beforeEach(() => {
        cacheManager = APICacheManager.getInstance();
        cacheManager.clear(); // 각 테스트 전에 캐시 초기화
    });

    afterEach(() => {
        cacheManager.clear();
    });

    describe('기본 캐시 작업', () => {
        test('데이터 저장 및 조회', () => {
            const key = 'test-key';
            const data = { message: 'test data' };

            cacheManager.set(key, data);
            const result = cacheManager.get(key);

            expect(result).toEqual(data);
        });

        test('존재하지 않는 키 조회', () => {
            const result = cacheManager.get('non-existent-key');
            expect(result).toBeNull();
        });

        test('TTL 설정 및 만료', async () => {
            const key = 'ttl-test';
            const data = { message: 'expires soon' };

            cacheManager.set(key, data, { customTTL: 100 });

            // 즉시 조회 - 존재해야 함
            let result = cacheManager.get(key);
            expect(result).toEqual(data);

            // TTL 만료 대기
            await new Promise(resolve => setTimeout(resolve, 150));

            // 만료 후 조회 - null이어야 함
            result = cacheManager.get(key);
            expect(result).toBeNull();
        });

        test('캐시 삭제', () => {
            const key = 'delete-test';
            const data = { test: true };

            cacheManager.set(key, data);
            expect(cacheManager.get(key)).toEqual(data);

            cacheManager.delete(key);
            expect(cacheManager.get(key)).toBeNull();
        });
    });

    describe('캐시 통계', () => {
        test('히트/미스 통계 추적', () => {
            const key = 'stats-test';
            const data = { value: 123 };

            // 미스 (데이터 없음)
            cacheManager.get(key);

            // 저장
            cacheManager.set(key, data);

            // 히트 (데이터 있음)
            cacheManager.get(key);

            const stats = cacheManager.getStats();
            expect(stats.totalHits).toBeGreaterThanOrEqual(1);
            expect(stats.totalMisses).toBeGreaterThanOrEqual(1);
        });

        test('메모리 사용량 추적', () => {
            const stats = cacheManager.getStats();
            expect(typeof stats.memoryUsage).toBe('number');
            expect(stats.memoryUsage).toBeGreaterThanOrEqual(0);
        });
    });

    describe('캐시 정리', () => {
        test('수동 정리', () => {
            cacheManager.set('cleanup-test', 'data');
            expect(cacheManager.get('cleanup-test')).toBe('data');

            cacheManager.clear();
            expect(cacheManager.get('cleanup-test')).toBeNull();
        });

        test('패턴별 정리', () => {
            cacheManager.set('/api/servers/1', 'server1');
            cacheManager.set('/api/servers/2', 'server2');
            cacheManager.set('/api/health', 'health');

            const deletedCount = cacheManager.clearByPattern('/api/servers');
            expect(deletedCount).toBe(2);
            expect(cacheManager.get('/api/health')).toBe('health');
        });
    });

    describe('캐시 키 생성', () => {
        test('기본 캐시 키 생성', () => {
            const key = getCacheKey('/api/servers');
            expect(key).toBe('/api/servers');
        });

        test('매개변수가 있는 캐시 키 생성', () => {
            const key = getCacheKey('/api/servers', { page: 1, limit: 10 });
            expect(key).toContain('/api/servers');
            expect(key).toContain('page=1');
            expect(key).toContain('limit=10');
        });
    });

    describe('캐시 헤더 생성', () => {
        test('캐시 히트 헤더', () => {
            const headers = getCacheHeaders(true);
            expect(headers['X-Cache']).toBe('HIT');
            expect(headers['Cache-Control']).toContain('public');
        });

        test('캐시 미스 헤더', () => {
            const headers = getCacheHeaders(false);
            expect(headers['X-Cache']).toBe('MISS');
            expect(headers['Cache-Control']).toContain('public');
        });
    });
}); 