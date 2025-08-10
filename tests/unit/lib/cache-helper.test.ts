/**
 * 🚀 캐시 헬퍼 유틸리티 테스트
 * 
 * @description 메모리 기반 LRU 캐시 시스템 테스트
 * @created 2025-08-10
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { 
  getCacheService, 
  getCachedData, 
  setCachedData,
  getCachedDataWithFallback,
  invalidateCache,
  cacheWrapper
} from '@/lib/cache-helper';

describe('MemoryCacheService', () => {
  let cacheService: ReturnType<typeof getCacheService>;

  beforeEach(() => {
    // 각 테스트 전에 캐시 초기화
    cacheService = getCacheService();
    cacheService.cache.clear();
    cacheService.resetStats();
    // maxSize를 기본값으로 리셋 (일부 테스트가 변경할 수 있음)
    (cacheService as any).maxSize = 100;
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.clearAllMocks();
  });

  describe('기본 캐시 동작', () => {
    it('데이터를 저장하고 조회할 수 있어야 함', async () => {
      const key = 'test-key';
      const value = { data: 'test-value' };
      
      await cacheService.set(key, value);
      const retrieved = await cacheService.get(key);
      
      expect(retrieved).toEqual(value);
    });

    it('존재하지 않는 키는 null을 반환해야 함', async () => {
      const result = await cacheService.get('non-existent');
      expect(result).toBeNull();
    });

    it('TTL이 만료되면 null을 반환해야 함', async () => {
      vi.useFakeTimers();
      
      const key = 'ttl-test';
      const value = 'test-value';
      
      await cacheService.set(key, value, 1); // 1초 TTL
      
      // TTL 내에서는 값을 반환
      expect(await cacheService.get(key)).toBe(value);
      
      // 2초 후 TTL 만료
      vi.advanceTimersByTime(2000);
      expect(await cacheService.get(key)).toBeNull();
      
      vi.useRealTimers();
    });
  });

  describe('LRU 캐시 관리', () => {
    it('최대 크기를 초과하면 가장 적게 사용된 항목을 제거해야 함', async () => {
      // maxSize를 작게 설정하기 위해 private 속성에 접근
      (cacheService as any).maxSize = 3;

      // 3개 항목 추가
      await cacheService.set('key1', 'value1');
      await cacheService.set('key2', 'value2');
      await cacheService.set('key3', 'value3');

      // key1과 key2를 각각 한 번씩 조회 (hits 증가)
      await cacheService.get('key1');
      await cacheService.get('key2');

      // 네 번째 항목 추가 (key3가 제거되어야 함 - 가장 적게 사용됨)
      await cacheService.set('key4', 'value4');

      expect(cacheService.cache.size).toBe(3);
      expect(await cacheService.get('key3')).toBeNull(); // key3 제거됨
      expect(await cacheService.get('key1')).toBe('value1');
      expect(await cacheService.get('key2')).toBe('value2');
      expect(await cacheService.get('key4')).toBe('value4');
    });

    it('같은 히트 수일 때 가장 오래된 항목을 제거해야 함', async () => {
      vi.useFakeTimers();
      (cacheService as any).maxSize = 2;

      await cacheService.set('old', 'old-value');
      
      vi.advanceTimersByTime(1000);
      await cacheService.set('new', 'new-value');

      // 둘 다 히트 수 0
      await cacheService.set('third', 'third-value');

      expect(cacheService.cache.size).toBe(2);
      expect(await cacheService.get('old')).toBeNull(); // 오래된 것이 제거됨
      expect(await cacheService.get('new')).toBe('new-value');
      expect(await cacheService.get('third')).toBe('third-value');

      vi.useRealTimers();
    });
  });

  describe('캐시 통계', () => {
    it('히트율을 올바르게 계산해야 함', async () => {
      await cacheService.set('key1', 'value1');
      await cacheService.set('key2', 'value2');

      // 2 hits
      await cacheService.get('key1');
      await cacheService.get('key2');
      
      // 2 misses
      await cacheService.get('non-existent1');
      await cacheService.get('non-existent2');

      const stats = cacheService.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(2);
      expect(stats.hitRate).toBe(50); // 50% 히트율
    });

    it('캐시 크기와 메모리 사용량을 추적해야 함', async () => {
      await cacheService.set('key1', 'value1');
      await cacheService.set('key2', 'value2');
      await cacheService.set('key3', 'value3');

      const stats = cacheService.getStats();
      expect(stats.size).toBe(3);
      expect(stats.memoryUsage).toMatch(/\d+KB/);
    });
  });

  describe('캐시 무효화', () => {
    it('패턴 매칭으로 캐시를 무효화할 수 있어야 함', async () => {
      await cacheService.set('user:1', 'user1');
      await cacheService.set('user:2', 'user2');
      await cacheService.set('post:1', 'post1');

      await cacheService.invalidateCache('user:*');

      expect(await cacheService.get('user:1')).toBeNull();
      expect(await cacheService.get('user:2')).toBeNull();
      expect(await cacheService.get('post:1')).toBe('post1');
    });

    it('패턴 없이 호출하면 전체 캐시를 클리어해야 함', async () => {
      await cacheService.set('key1', 'value1');
      await cacheService.set('key2', 'value2');

      await cacheService.invalidateCache();

      expect(cacheService.cache.size).toBe(0);
    });
  });

  describe('만료된 항목 정리', () => {
    it('cleanup 메서드가 만료된 항목을 제거해야 함', async () => {
      vi.useFakeTimers();

      await cacheService.set('expire-soon', 'value1', 1); // 1초
      await cacheService.set('expire-later', 'value2', 10); // 10초

      vi.advanceTimersByTime(2000); // 2초 경과

      cacheService.cleanup();

      expect(await cacheService.get('expire-soon')).toBeNull();
      expect(await cacheService.get('expire-later')).toBe('value2');

      vi.useRealTimers();
    });
  });

  describe('멀티 키 작업', () => {
    it('여러 키를 한 번에 조회할 수 있어야 함', async () => {
      await cacheService.set('key1', 'value1');
      await cacheService.set('key2', 'value2');
      await cacheService.set('key3', 'value3');

      const results = await cacheService.mget<string>(['key1', 'key2', 'non-existent', 'key3']);
      
      expect(results).toEqual(['value1', 'value2', null, 'value3']);
    });
  });
});

describe('캐시 헬퍼 함수', () => {
  beforeEach(() => {
    const cache = getCacheService();
    cache.cache.clear();
  });

  describe('getCachedData / setCachedData', () => {
    it('간편 API로 캐시를 사용할 수 있어야 함', () => {
      const key = 'simple-key';
      const value = { message: 'hello' };

      setCachedData(key, value);
      const retrieved = getCachedData<typeof value>(key);

      expect(retrieved).toEqual(value);
    });

    it('타입 안전성을 제공해야 함', () => {
      interface User {
        id: number;
        name: string;
      }

      const user: User = { id: 1, name: 'John' };
      setCachedData('user:1', user);

      const retrieved = getCachedData<User>('user:1');
      expect(retrieved?.id).toBe(1);
      expect(retrieved?.name).toBe('John');
    });
  });

  describe('getCachedDataWithFallback', () => {
    it('캐시 미스 시 fallback 함수를 실행해야 함', async () => {
      const fallback = vi.fn().mockResolvedValue('fallback-value');
      
      const result = await getCachedDataWithFallback(
        'missing-key',
        fallback,
        60
      );

      expect(fallback).toHaveBeenCalled();
      expect(result).toBe('fallback-value');
      
      // 캐시에 저장되었는지 확인
      const cached = getCachedData('missing-key');
      expect(cached).toBe('fallback-value');
    });

    it('캐시 히트 시 fallback을 실행하지 않아야 함', async () => {
      const key = 'existing-key';
      const value = 'cached-value';
      const fallback = vi.fn();

      setCachedData(key, value);
      
      const result = await getCachedDataWithFallback(key, fallback);

      expect(fallback).not.toHaveBeenCalled();
      expect(result).toBe(value);
    });
  });

  describe('cacheWrapper', () => {
    it('함수 실행 결과를 캐싱해야 함', async () => {
      const expensiveFunction = vi.fn().mockResolvedValue('expensive-result');
      const cachedFunction = cacheWrapper(
        'wrapped-key',
        expensiveFunction,
        60
      );

      // 첫 번째 호출 - 함수 실행
      const result1 = await cachedFunction();
      expect(expensiveFunction).toHaveBeenCalledTimes(1);
      expect(result1).toBe('expensive-result');

      // 두 번째 호출 - 캐시에서 반환
      const result2 = await cachedFunction();
      expect(expensiveFunction).toHaveBeenCalledTimes(1); // 여전히 1번
      expect(result2).toBe('expensive-result');
    });

    it('다른 인자에 대해 다른 캐시 키를 사용해야 함', async () => {
      const func = vi.fn((x: number) => Promise.resolve(x * 2));
      const cached = cacheWrapper('multiply', func, 60);

      const result1 = await cached(5);
      const result2 = await cached(10);
      const result3 = await cached(5); // 캐시에서

      expect(func).toHaveBeenCalledTimes(2); // 5와 10에 대해서만
      expect(result1).toBe(10);
      expect(result2).toBe(20);
      expect(result3).toBe(10);
    });
  });

  describe('invalidateCache', () => {
    it('export된 invalidateCache 함수가 동작해야 함', async () => {
      setCachedData('test:1', 'value1');
      setCachedData('test:2', 'value2');
      setCachedData('other:1', 'other');

      await invalidateCache('test:*');

      expect(getCachedData('test:1')).toBeNull();
      expect(getCachedData('test:2')).toBeNull();
      expect(getCachedData('other:1')).toBe('other');
    });
  });
});