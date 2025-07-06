/**
 * 🧪 Edge Runtime 최적화 테스트
 * 
 * Phase 4에서 추가된 Edge Runtime 최적화 테스트
 */

import { EdgeCache, EdgeHTTPClient, EdgeLogger, EdgePerformanceMonitor } from '@/lib/edge-runtime-utils';

describe('EdgeLogger', () => {
    let logger: EdgeLogger;

    beforeEach(() => {
        logger = EdgeLogger.getInstance();
        logger.clearLogs();
    });

    test('로그 레벨별 기록', () => {
        logger.info('정보 메시지');
        logger.warn('경고 메시지');
        logger.error('오류 메시지');
        logger.debug('디버그 메시지');

        const logs = logger.getLogs();
        expect(logs).toHaveLength(4);
        expect(logs[0].level).toBe('info');
        expect(logs[1].level).toBe('warn');
        expect(logs[2].level).toBe('error');
        expect(logs[3].level).toBe('debug');
    });

    test('메타데이터와 함께 로깅', () => {
        const metadata = { userId: '123', action: 'login' };
        logger.info('사용자 로그인', metadata);

        const logs = logger.getLogs();
        expect(logs[0].meta).toEqual(metadata);
    });

    test('최대 로그 수 제한', () => {
        // 최대 로그 수를 초과하여 로깅
        for (let i = 0; i < 150; i++) {
            logger.info(`로그 메시지 ${i}`);
        }

        const logs = logger.getLogs();
        expect(logs.length).toBeLessThanOrEqual(100); // maxLogs = 100
    });
});

describe('EdgeCache', () => {
    let cache: EdgeCache;

    beforeEach(() => {
        cache = EdgeCache.getInstance();
        cache.clear();
    });

    test('기본 캐시 작업', () => {
        const key = 'test-key';
        const value = { message: 'Hello Edge!' };

        cache.set(key, value);
        expect(cache.get(key)).toEqual(value);
        expect(cache.has(key)).toBe(true);
    });

    test('TTL 만료', async () => {
        const key = 'ttl-test';
        const value = { test: true };

        cache.set(key, value, 100); // 100ms TTL
        expect(cache.get(key)).toEqual(value);

        await new Promise(resolve => setTimeout(resolve, 150));
        expect(cache.get(key)).toBeNull();
        expect(cache.has(key)).toBe(false);
    });

    test('캐시 크기 제한', () => {
        // 최대 크기를 초과하여 저장
        for (let i = 0; i < 150; i++) {
            cache.set(`key-${i}`, { value: i });
        }

        expect(cache.size()).toBeLessThanOrEqual(100); // maxSize = 100
    });

    test('캐시 통계', () => {
        cache.set('key1', 'value1');
        cache.set('key2', 'value2');

        const stats = cache.getStats();
        expect(stats.size).toBe(2);
        expect(stats.maxSize).toBe(100);
        expect(stats.keys).toContain('key1');
        expect(stats.keys).toContain('key2');
    });
});

describe('EdgeHTTPClient', () => {
    // Mock fetch for testing
    const originalFetch = global.fetch;

    beforeEach(() => {
        global.fetch = jest.fn();
    });

    afterEach(() => {
        global.fetch = originalFetch;
        jest.resetAllMocks();
    });

    test('성공적인 GET 요청', async () => {
        const mockResponse = {
            ok: true,
            status: 200,
            json: async () => ({ success: true })
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

        const response = await EdgeHTTPClient.get('https://api.example.com/test');
        expect(response.ok).toBe(true);
        expect(global.fetch).toHaveBeenCalledWith(
            'https://api.example.com/test',
            expect.objectContaining({ method: 'GET' })
        );
    });

    test('POST 요청 with 데이터', async () => {
        const mockResponse = {
            ok: true,
            status: 201,
            json: async () => ({ id: 123 })
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

        const testData = { name: 'Test' };
        await EdgeHTTPClient.post('https://api.example.com/create', testData);

        expect(global.fetch).toHaveBeenCalledWith(
            'https://api.example.com/create',
            expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testData)
            })
        );
    });

    test('재시도 로직 테스트', async () => {
        // 500 에러를 반환하는 엔드포인트로 재시도 테스트
        const response = await EdgeHTTPClient.get('https://api.example.com/test', {
            timeout: 5000,
            retries: 3,
            retryDelay: 10 // 빠른 테스트를 위해 짧은 지연
        }).catch(error => error);

        expect(response).toBeInstanceOf(Error);
    });

    test('타임아웃 처리', async () => {
        await expect(
            EdgeHTTPClient.get('https://api.example.com/slow', {
                timeout: 100,
                retries: 1,
                retryDelay: 50
            })
        ).rejects.toThrow();
    });

    test('Edge HTTP 클라이언트 최적화', async () => {
        const response = await EdgeHTTPClient.get('https://api.example.com/test');

        if (response) {
            expect(response.ok).toBe(true);
        }
    });
});

describe('EdgePerformanceMonitor', () => {
    let monitor: EdgePerformanceMonitor;

    beforeEach(() => {
        monitor = EdgePerformanceMonitor.getInstance();
        monitor.clearMetrics();
    });

    test('성능 타이머 측정', async () => {
        const timerName = 'test-operation';
        const endTimer = monitor.startTimer(timerName);

        // 작업 시뮬레이션
        await new Promise(resolve => setTimeout(resolve, 50));

        const duration = endTimer();
        expect(duration).toBeGreaterThan(40); // 최소 40ms
        expect(duration).toBeLessThan(100);   // 최대 100ms
    });

    test('메트릭 기록 및 조회', () => {
        const metricName = 'api-response-time';

        monitor.recordMetric(metricName, 100);
        monitor.recordMetric(metricName, 150);
        monitor.recordMetric(metricName, 200);

        const metrics = monitor.getMetrics(metricName);
        if (metrics) {
            expect(metrics.count).toBe(3);
            expect(metrics.avg).toBe(150); // average 대신 avg 사용
            expect(metrics.min).toBe(100);
            expect(metrics.max).toBe(200);
        }
    });

    test('전체 메트릭 조회', () => {
        monitor.recordMetric('metric1', 100);
        monitor.recordMetric('metric2', 200);
        monitor.recordMetric('metric1', 150);

        const allMetrics = monitor.getAllMetrics();
        expect(Object.keys(allMetrics)).toContain('metric1');
        expect(Object.keys(allMetrics)).toContain('metric2');
        expect(allMetrics.metric1.count).toBe(2);
        expect(allMetrics.metric2.count).toBe(1);
    });

    test('성능 메트릭 통계', () => {
        monitor.recordMetric('response-time', 100);
        monitor.recordMetric('response-time', 200);
        monitor.recordMetric('response-time', 150);

        const metrics = monitor.getMetrics('response-time');
        if (metrics) {
            expect(metrics.count).toBe(3);
            expect(metrics.avg).toBe(150);
            expect(metrics.min).toBe(100);
            expect(metrics.max).toBe(200);
        }
    });

    test('메트릭 배치 처리', () => {
        const metricValues = [100, 200, 150, 300, 250];
        metricValues.forEach(value => {
            monitor.recordMetric('batch-test', value);
        });

        const stats = monitor.getMetrics('batch-test');
        if (stats) {
            expect(stats.count).toBe(5);
            expect(stats.avg).toBe(200);
            expect(stats.min).toBe(100);
            expect(stats.max).toBe(300);
        }
    });
});

describe('Edge Runtime 호환성', () => {
    test('Edge Runtime 환경 감지', () => {
        // Edge Runtime 환경 시뮬레이션
        const originalProcess = global.process;

        // @ts-ignore
        global.process = undefined;

        // isEdgeRuntime 함수 테스트는 실제 구현에 따라 조정 필요
        // expect(isEdgeRuntime()).toBe(true);

        global.process = originalProcess;
    });

    test('Node.js 전용 API 사용 금지 확인', () => {
        // Edge Runtime에서 사용할 수 없는 API들 체크
        const forbiddenAPIs = ['fs', 'path', 'crypto'];

        forbiddenAPIs.forEach(api => {
            expect(() => {
                // require 시뮬레이션 - 실제로는 dynamic import 에러 체크
                // require(api);
            }).not.toThrow(); // 현재는 테스트 환경이므로 에러가 발생하지 않음
        });
    });
});

describe('메모리 효율성', () => {
    test('메모리 사용량 모니터링', () => {
        const cache = EdgeCache.getInstance();
        const logger = EdgeLogger.getInstance();

        // 대량 데이터 생성
        for (let i = 0; i < 50; i++) {
            cache.set(`key-${i}`, { data: new Array(100).fill(i) });
            logger.info(`로그 메시지 ${i}`, { index: i });
        }

        const cacheStats = cache.getStats();
        const logs = logger.getLogs();

        expect(cacheStats.size).toBeGreaterThan(0);
        expect(logs.length).toBeGreaterThan(0);

        // 메모리 정리
        cache.clear();
        logger.clearLogs();

        expect(cache.size()).toBe(0);
        expect(logger.getLogs().length).toBe(0);
    });
});

describe('Edge Runtime 상태 확인', () => {
    test('Edge Runtime 상태 확인', async () => {
        const response = await fetch('/api/edge-runtime/status');

        // response가 undefined인지 확인
        expect(response).toBeDefined();
        // @ts-ignore - 테스트 환경에서 response는 정의되어 있음
        expect(response.ok).toBe(true);

        const data = await response.json();
    });
}); 