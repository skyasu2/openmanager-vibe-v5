/**
 * CloudContextLoader 타입 가드 함수 테스트
 * 
 * Redis 타입 가드 함수들의 동작을 검증합니다.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isRedisClient,
  isRedisConnected,
  safeRedisOperation,
} from '@/services/mcp/CloudContextLoader';
import type { RedisClientInterface } from '@/lib/redis';

describe('CloudContextLoader 타입 가드 함수', () => {
  describe('isRedisClient', () => {
    it('유효한 Redis 클라이언트 객체를 올바르게 식별해야 함', () => {
      const validRedisClient = {
        get: vi.fn(),
        set: vi.fn(),
        setex: vi.fn(),
        del: vi.fn(),
        ping: vi.fn(),
      };

      expect(isRedisClient(validRedisClient)).toBe(true);
    });

    it('필수 메서드가 없는 객체는 거부해야 함', () => {
      const invalidClients = [
        { get: vi.fn(), set: vi.fn() }, // setex, del, ping 없음
        { get: vi.fn(), set: vi.fn(), setex: vi.fn(), del: vi.fn() }, // ping 없음
        { set: vi.fn(), setex: vi.fn(), del: vi.fn(), ping: vi.fn() }, // get 없음
      ];

      invalidClients.forEach(client => {
        expect(isRedisClient(client)).toBe(false);
      });
    });

    it('null, undefined, 프리미티브 값들을 거부해야 함', () => {
      expect(isRedisClient(null)).toBe(false);
      expect(isRedisClient(undefined)).toBe(false);
      expect(isRedisClient('string')).toBe(false);
      expect(isRedisClient(123)).toBe(false);
      expect(isRedisClient(true)).toBe(false);
      expect(isRedisClient([])).toBe(false);
    });

    it('메서드가 함수가 아닌 경우 거부해야 함', () => {
      const invalidClient = {
        get: 'not a function',
        set: vi.fn(),
        setex: vi.fn(),
        del: vi.fn(),
        ping: vi.fn(),
      };

      expect(isRedisClient(invalidClient)).toBe(false);
    });
  });

  describe('isRedisConnected', () => {
    it('유효한 Redis 클라이언트는 연결된 것으로 판단해야 함', () => {
      const validRedisClient: RedisClientInterface = {
        get: vi.fn(),
        set: vi.fn(),
        setex: vi.fn(),
        del: vi.fn(),
        ping: vi.fn(),
        ttl: vi.fn(),
        expire: vi.fn(),
        exists: vi.fn(),
        mget: vi.fn(),
        mset: vi.fn(),
        hget: vi.fn(),
        hset: vi.fn(),
        hgetall: vi.fn(),
        hdel: vi.fn(),
        incr: vi.fn(),
        decr: vi.fn(),
        lpush: vi.fn(),
        rpush: vi.fn(),
        lpop: vi.fn(),
        rpop: vi.fn(),
        lrange: vi.fn(),
        llen: vi.fn(),
        sadd: vi.fn(),
        srem: vi.fn(),
        smembers: vi.fn(),
        sismember: vi.fn(),
        zadd: vi.fn(),
        zrem: vi.fn(),
        zrange: vi.fn(),
        zrevrange: vi.fn(),
        zscore: vi.fn(),
        publish: vi.fn(),
        subscribe: vi.fn(),
        unsubscribe: vi.fn(),
        quit: vi.fn(),
      };

      expect(isRedisConnected(validRedisClient)).toBe(true);
    });

    it('null Redis 클라이언트는 연결되지 않은 것으로 판단해야 함', () => {
      expect(isRedisConnected(null)).toBe(false);
    });

    it('유효하지 않은 Redis 객체는 연결되지 않은 것으로 판단해야 함', () => {
      const invalidClient = { 
        get: 'not a function' 
      } as any;

      expect(isRedisConnected(invalidClient)).toBe(false);
    });
  });

  describe('safeRedisOperation', () => {
    let mockRedisClient: RedisClientInterface;
    let consoleWarnSpy: any;
    let consoleErrorSpy: any;

    beforeEach(() => {
      mockRedisClient = {
        get: vi.fn(),
        set: vi.fn(),
        setex: vi.fn(),
        del: vi.fn(),
        ping: vi.fn(),
        ttl: vi.fn(),
        expire: vi.fn(),
        exists: vi.fn(),
        mget: vi.fn(),
        mset: vi.fn(),
        hget: vi.fn(),
        hset: vi.fn(),
        hgetall: vi.fn(),
        hdel: vi.fn(),
        incr: vi.fn(),
        decr: vi.fn(),
        lpush: vi.fn(),
        rpush: vi.fn(),
        lpop: vi.fn(),
        rpop: vi.fn(),
        lrange: vi.fn(),
        llen: vi.fn(),
        sadd: vi.fn(),
        srem: vi.fn(),
        smembers: vi.fn(),
        sismember: vi.fn(),
        zadd: vi.fn(),
        zrem: vi.fn(),
        zrange: vi.fn(),
        zrevrange: vi.fn(),
        zscore: vi.fn(),
        publish: vi.fn(),
        subscribe: vi.fn(),
        unsubscribe: vi.fn(),
        quit: vi.fn(),
      };

      consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('연결된 Redis에서 성공적인 연산을 수행해야 함', async () => {
      const expectedResult = 'test-value';
      const operation = vi.fn().mockResolvedValue(expectedResult);

      const result = await safeRedisOperation(
        mockRedisClient,
        operation
      );

      expect(operation).toHaveBeenCalledWith(mockRedisClient);
      expect(result).toBe(expectedResult);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('Redis가 null일 때 fallback 값을 반환해야 함', async () => {
      const fallbackValue = 'fallback';
      const operation = vi.fn();

      const result = await safeRedisOperation(
        null,
        operation,
        fallbackValue
      );

      expect(operation).not.toHaveBeenCalled();
      expect(result).toBe(fallbackValue);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '⚠️ Redis가 연결되지 않음 - 연산 건너뜀'
      );
    });

    it('Redis가 null이고 fallback이 없을 때 null을 반환해야 함', async () => {
      const operation = vi.fn();

      const result = await safeRedisOperation(null, operation);

      expect(operation).not.toHaveBeenCalled();
      expect(result).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '⚠️ Redis가 연결되지 않음 - 연산 건너뜀'
      );
    });

    it('연산 중 에러 발생 시 fallback 값을 반환해야 함', async () => {
      const error = new Error('Redis operation failed');
      const fallbackValue = 'error-fallback';
      const operation = vi.fn().mockRejectedValue(error);

      const result = await safeRedisOperation(
        mockRedisClient,
        operation,
        fallbackValue
      );

      expect(operation).toHaveBeenCalledWith(mockRedisClient);
      expect(result).toBe(fallbackValue);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '❌ Redis 연산 실패:',
        error
      );
    });

    it('연산 중 에러 발생 시 fallback이 없으면 null을 반환해야 함', async () => {
      const error = new Error('Redis operation failed');
      const operation = vi.fn().mockRejectedValue(error);

      const result = await safeRedisOperation(
        mockRedisClient,
        operation
      );

      expect(operation).toHaveBeenCalledWith(mockRedisClient);
      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '❌ Redis 연산 실패:',
        error
      );
    });
  });
});