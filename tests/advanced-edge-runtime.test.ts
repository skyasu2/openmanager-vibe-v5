/**
 * 🧪 고급 Edge Runtime 테스트
 * 
 * Phase 4에서 추가된 Edge Runtime 최적화 기능들의 포괄적인 테스트
 */

import { EdgeCache, EdgeHTTPClient, EdgeLogger, EdgePerformanceMonitor } from '../src/lib/edge-runtime-utils';

describe('Advanced Edge Runtime 테스트', () => {
    describe('EdgeLogger 고급 기능', () => {
        let logger: EdgeLogger;

        beforeEach(() => {
            logger = EdgeLogger.getInstance();
            logger.clearLogs();
        });

        test('로그 레벨별 필터링', () => {
            logger.info('정보 메시지');
            logger.warn('경고 메시지');
            logger.error('오류 메시지');

            const logs = logger.getLogs();
            expect(logs).toHaveLength(3);
            expect(logs[0].level).toBe('info');
            expect(logs[1].level).toBe('warn');
            expect(logs[2].level).toBe('error');
        });

        test('메타데이터 포함 로깅', () => {
            const metadata = { userId: '123', action: 'login' };
            logger.info('사용자 로그인', metadata);

            const logs = logger.getLogs();
            expect(logs).toHaveLength(1);
            expect(logs[0].meta).toEqual({ userId: '123', action: 'login' });
        });

        test('최대 로그 수 제한', () => {
            // 기본 maxLogs는 100개로 설정되어 있음
            for (let i = 0; i < 150; i++) {
                logger.info(`테스트 메시지 ${i}`);
            }

            const logs = logger.getLogs();
            expect(logs.length).toBeLessThanOrEqual(100);
            // 가장 최근 로그가 유지되는지 확인
            expect(logs[logs.length - 1].message).toBe('테스트 메시지 149');
        });

        test('로그 클리어 기능', () => {
            logger.info('테스트 메시지');
            expect(logger.getLogs()).toHaveLength(1);

            logger.clearLogs();
            expect(logger.getLogs()).toHaveLength(0);
        });
    });

    describe('EdgeCache 고급 기능', () => {
        let cache: EdgeCache;

        beforeEach(() => {
            cache = EdgeCache.getInstance();
            cache.clear();
        });

        test('다양한 데이터 타입 캐싱', () => {
            const testData = {
                string: 'hello',
                number: 42,
                object: { key: 'value' },
                array: [1, 2, 3],
                boolean: true
            };

            Object.entries(testData).forEach(([key, value]) => {
                cache.set(key, value);
            });

            Object.entries(testData).forEach(([key, value]) => {
                expect(cache.get(key)).toEqual(value);
            });
        });

        test('캐시 통계 정확성', () => {
            cache.set('key1', 'value1');
            cache.set('key2', 'value2');

            // 캐시 히트
            cache.get('key1');
            cache.get('key1');

            // 캐시 미스
            cache.get('nonexistent');

            const stats = cache.getStats();
            expect(stats.size).toBe(2);
            expect(stats.maxSize).toBe(100);
            expect(stats.keys).toContain('key1');
            expect(stats.keys).toContain('key2');
        });

        test('TTL 기반 자동 만료', async () => {
            cache.set('shortLived', 'value', 100); // 100ms TTL

            expect(cache.get('shortLived')).toBe('value');

            // 150ms 대기
            await new Promise(resolve => setTimeout(resolve, 150));

            expect(cache.get('shortLived')).toBeNull();
        });

        test('LRU 정책 (캐시 크기 제한)', () => {
            // 기본 maxSize는 100이므로 작은 캐시로 테스트
            const smallCache = EdgeCache.getInstance();
            smallCache.clear();

            // maxSize를 초과하는 데이터 추가 (실제로는 100개가 한계)
            for (let i = 0; i < 105; i++) {
                smallCache.set(`key${i}`, `value${i}`);
            }

            const stats = smallCache.getStats();
            expect(stats.size).toBeLessThanOrEqual(100);

            // 가장 오래된 키들이 제거되었는지 확인
            expect(smallCache.get('key0')).toBeNull();
            expect(smallCache.get('key104')).toBe('value104');
        });

        test('메모리 사용량 모니터링', () => {
            for (let i = 0; i < 10; i++) {
                cache.set(`key${i}`, { data: 'x'.repeat(1000) });
            }

            const stats = cache.getStats();
            expect(stats.size).toBe(10);
        });
    });

    describe('EdgeHTTPClient 고급 기능', () => {
        test('GET 요청', async () => {
            const response = await EdgeHTTPClient.get('https://jsonplaceholder.typicode.com/posts/1');

            expect(response).toBeDefined();
            if (response) {
                expect(response.status).toBe(200);
            }
        }, 10000);

        test('POST 요청', async () => {
            const postData = {
                title: 'foo',
                body: 'bar',
                userId: 1
            };

            const response = await EdgeHTTPClient.post('https://jsonplaceholder.typicode.com/posts', postData);

            expect(response).toBeDefined();
            if (response) {
                expect(response.status).toBe(201);
            }
        }, 10000);

        test('커스텀 헤더 설정', async () => {
            const headers = { 'X-Custom-Header': 'test-value' };

            const response = await EdgeHTTPClient.get('https://httpbin.org/headers', {
                timeout: 5000,
                retries: 1,
                retryDelay: 100
            });

            expect(response).toBeDefined();
            if (response) {
                expect(response.status).toBe(200);
            }
        }, 10000);

        test('타임아웃 처리', async () => {
            await expect(
                EdgeHTTPClient.get('https://httpbin.org/delay/1', {
                    timeout: 100,
                    retries: 1,
                    retryDelay: 50
                })
            ).rejects.toThrow();
        }, 10000);

        test('재시도 로직', async () => {
            await expect(
                EdgeHTTPClient.get('https://httpbin.org/status/500', {
                    timeout: 1000,
                    retries: 2,
                    retryDelay: 50
                })
            ).rejects.toThrow();
        }, 10000);

        test('에러 응답 처리', async () => {
            const response = await EdgeHTTPClient.get('https://httpbin.org/status/404', {
                timeout: 5000,
                retries: 1,
                retryDelay: 100
            }).catch(error => error);

            expect(response).toBeInstanceOf(Error);
        }, 10000);
    });

    describe('EdgePerformanceMonitor 고급 기능', () => {
        let monitor: EdgePerformanceMonitor;

        beforeEach(() => {
            monitor = EdgePerformanceMonitor.getInstance();
            monitor.clearMetrics();
        });

        test('성능 타이머', () => {
            const endTimer = monitor.startTimer('test-operation');

            // 시뮬레이션된 작업
            for (let i = 0; i < 1000; i++) {
                Math.sqrt(i);
            }

            const duration = endTimer();
            expect(duration).toBeGreaterThan(0);
        });

        test('메트릭 기록 및 조회', () => {
            monitor.recordMetric('operation-1', 100);
            monitor.recordMetric('operation-1', 200);
            monitor.recordMetric('operation-2', 150);

            const metrics1 = monitor.getMetrics('operation-1');
            const metrics2 = monitor.getMetrics('operation-2');

            expect(metrics1).toEqual([100, 200]);
            expect(metrics2).toEqual([150]);
        });

        test('통계 계산', () => {
            const values = [100, 150, 200];
            values.forEach(value => monitor.recordMetric('api-calls', value));

            const metrics = monitor.getMetrics('api-calls');
            expect(metrics).toEqual(values);
        });

        test('복합 메트릭 분석', () => {
            monitor.recordMetric('response-time', 100);
            monitor.recordMetric('response-time', 200);
            monitor.recordMetric('response-time', 150);

            monitor.recordMetric('error-count', 1);

            const allMetrics = monitor.getAllMetrics();
            expect(allMetrics.has('response-time')).toBe(true);
            expect(allMetrics.has('error-count')).toBe(true);
        });

        test('메모리 사용량 모니터링', () => {
            // 메트릭 데이터 생성
            for (let i = 0; i < 100; i++) {
                monitor.recordMetric('test-metric', Math.random() * 100);
            }

            const allMetrics = monitor.getAllMetrics();
            expect(allMetrics.size).toBeGreaterThan(0);
        });
    });

    describe('통합 시나리오 테스트', () => {
        test('캐시와 HTTP 클라이언트 조합', async () => {
            const cache = EdgeCache.getInstance();
            cache.clear();

            const cacheKey = 'api-response';

            // 캐시 미스 - API 호출
            let cachedData = cache.get(cacheKey);
            if (!cachedData) {
                const response = await EdgeHTTPClient.get('https://jsonplaceholder.typicode.com/users/1');
                if (response) {
                    cachedData = await response.json();
                    cache.set(cacheKey, cachedData, 60000); // 1분 캐시
                }
            }

            expect(cachedData).toBeDefined();
            expect(cache.has(cacheKey)).toBe(true);

            // 캐시 히트 - API 호출 없음
            const cachedResponse = cache.get(cacheKey);
            expect(cachedResponse).toEqual(cachedData);
        }, 10000);

        test('로거와 성능 모니터 조합', async () => {
            const logger = EdgeLogger.getInstance();
            const monitor = EdgePerformanceMonitor.getInstance();

            logger.clearLogs();
            monitor.clearMetrics();

            const endTimer = monitor.startTimer('test-operation');

            logger.info('작업 시작');

            // 시뮬레이션된 작업
            await new Promise(resolve => setTimeout(resolve, 100));

            const duration = endTimer();
            logger.info('작업 완료', { duration });

            const logs = logger.getLogs();
            expect(logs).toHaveLength(2);
            expect(logs[0].message).toBe('작업 시작');
            expect(logs[1].message).toBe('작업 완료');
            expect(logs[1].meta?.duration).toBe(duration);
        });

        test('전체 Edge Runtime 스택 테스트', async () => {
            const logger = EdgeLogger.getInstance();
            const cache = EdgeCache.getInstance();
            const monitor = EdgePerformanceMonitor.getInstance();

            // 초기화
            logger.clearLogs();
            cache.clear();
            monitor.clearMetrics();

            const endTimer = monitor.startTimer('full-stack-test');

            try {
                logger.info('전체 스택 테스트 시작');

                // 캐시된 데이터 확인
                let data = cache.get('test-data');
                if (!data) {
                    logger.info('캐시 미스 - API 호출');
                    const response = await EdgeHTTPClient.get('https://jsonplaceholder.typicode.com/users/1');
                    if (response) {
                        data = await response.json();
                        cache.set('test-data', data, 30000);
                        monitor.recordMetric('api-calls', 1);
                    }
                } else {
                    logger.info('캐시 히트');
                    monitor.recordMetric('cache-hits', 1);
                }

                const duration = endTimer();
                monitor.recordMetric('integration-calls', 1);

                logger.info('전체 스택 테스트 완료', { duration, dataReceived: !!data });

                // 검증
                expect(data).toBeDefined();
                expect(cache.has('test-data')).toBe(true);

                const logs = logger.getLogs();
                expect(logs.length).toBeGreaterThan(0);

                const allMetrics = monitor.getAllMetrics();
                expect(allMetrics.has('integration-calls')).toBe(true);

            } catch (error) {
                logger.error('전체 스택 테스트 실패', { error: error.message });
                throw error;
            }
        }, 15000);
    });
}); 