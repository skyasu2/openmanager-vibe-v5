import {
  calculatePercentage,
  clamp,
  cn,
  debounce,
  deepClone,
  formatBytes,
  formatDuration,
  formatNumber,
  formatPercentage,
  formatRelativeTime,
  generateId,
  generateSessionId,
  generateTimestamp,
  getSeverityIcon,
  getStatusColor,
  groupBy,
  hashString,
  isDevelopment,
  isEmpty,
  isServer,
  isValidEmail,
  omit,
  parseError,
  pick,
  retry,
  safeErrorMessage,
  safeJsonParse,
  sleep,
  sortBy,
  throttle,
  truncate,
} from '@/utils/utils-functions';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Utils Functions', () => {
  describe('cn (className merger)', () => {
    it('기본 클래스명을 병합한다', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
    });

    it('조건부 클래스명을 처리한다', () => {
      expect(cn('base', true && 'conditional', false && 'hidden')).toBe(
        'base conditional'
      );
    });

    it('Tailwind 충돌을 해결한다', () => {
      expect(cn('p-2', 'p-4')).toBe('p-4');
    });
  });

  describe('Error handling functions', () => {
    it('parseError는 Error 객체를 문자열로 변환한다', () => {
      const error = new Error('Test error');
      expect(parseError(error)).toBe('Test error');
    });

    it('parseError는 문자열 에러를 그대로 반환한다', () => {
      expect(parseError('String error')).toBe('String error');
    });

    it('safeErrorMessage는 fallback을 사용한다', () => {
      expect(safeErrorMessage(null, 'Fallback message')).toBe(
        'Fallback message'
      );
    });
  });

  describe('generateSessionId', () => {
    it('고유한 세션 ID를 생성한다', () => {
      const id1 = generateSessionId();
      const id2 = generateSessionId();
      expect(id1).not.toBe(id2);
      // 새로운 형식: timestamp.base58string
      expect(id1).toMatch(/^[a-z0-9]+\.[A-Za-z0-9]+$/);
    });

    it('prefix가 있을 때 올바른 형식으로 생성한다', () => {
      const id = generateSessionId('test');
      // 새로운 형식: prefix_timestamp.base58string
      expect(id).toMatch(/^test_[a-z0-9]+\.[A-Za-z0-9]+$/);
    });

    it('타임스탬프 부분이 포함되어야 한다', () => {
      const id = generateSessionId();
      const parts = id.split('.');
      expect(parts).toHaveLength(2);
      
      // 타임스탬프 부분이 유효한지 확인
      const timestamp = parseInt(parts[0], 36);
      expect(timestamp).toBeGreaterThan(0);
      expect(timestamp).toBeLessThanOrEqual(Date.now());
    });

    it('Base58 문자만 사용한다', () => {
      const id = generateSessionId();
      const parts = id.split('.');
      const base58Part = parts[1];
      
      // Base58에서 제외되는 문자들 (0, O, I, l)이 없어야 함
      expect(base58Part).not.toMatch(/[0OIl]/);
    });
  });

  describe('formatBytes', () => {
    it('0 바이트를 올바르게 포맷한다', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
    });

    it('바이트를 KB로 변환한다', () => {
      expect(formatBytes(1024)).toBe('1 KB');
    });

    it('바이트를 MB로 변환한다', () => {
      expect(formatBytes(1024 * 1024)).toBe('1 MB');
    });

    it('소수점 자릿수를 조정한다', () => {
      expect(formatBytes(1536, 1)).toBe('1.5 KB');
      expect(formatBytes(1536, 0)).toBe('2 KB');
    });
  });

  describe('generateTimestamp', () => {
    it('ISO 형식의 타임스탬프를 생성한다', () => {
      const timestamp = generateTimestamp();
      expect(timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      );
      expect(new Date(timestamp).toISOString()).toBe(timestamp);
    });
  });

  describe('safeJsonParse', () => {
    it('유효한 JSON을 파싱한다', () => {
      const result = safeJsonParse('{"key": "value"}', {});
      expect(result).toEqual({ key: 'value' });
    });

    it('잘못된 JSON에 대해 fallback을 반환한다', () => {
      const fallback = { error: true };
      const result = safeJsonParse('invalid json', fallback);
      expect(result).toBe(fallback);
    });
  });

  describe('deepClone', () => {
    it('원시 값을 그대로 반환한다', () => {
      expect(deepClone(42)).toBe(42);
      expect(deepClone('string')).toBe('string');
      expect(deepClone(null)).toBe(null);
    });

    it('객체를 깊게 복사한다', () => {
      const original = { a: 1, b: { c: 2 } };
      const cloned = deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.b).not.toBe(original.b);
    });

    it('배열을 깊게 복사한다', () => {
      const original = [1, [2, 3], { a: 4 }];
      const cloned = deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned[1]).not.toBe(original[1]);
    });

    it('Date 객체를 올바르게 복사한다', () => {
      const date = new Date('2023-01-01');
      const cloned = deepClone(date);

      expect(cloned).toEqual(date);
      expect(cloned).not.toBe(date);
    });
  });

  describe('formatPercentage', () => {
    it('기본 소수점 1자리로 포맷한다', () => {
      expect(formatPercentage(75.456)).toBe('75.5%');
    });

    it('소수점 자릿수를 조정한다', () => {
      expect(formatPercentage(75.456, 2)).toBe('75.46%');
      expect(formatPercentage(75.456, 0)).toBe('75%');
    });
  });

  describe('formatRelativeTime', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2023-01-01T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('방금 전을 올바르게 표시한다', () => {
      const now = new Date('2023-01-01T12:00:00Z');
      expect(formatRelativeTime(now)).toBe('just now');
    });

    it('분 단위를 올바르게 표시한다', () => {
      const fiveMinutesAgo = new Date('2023-01-01T11:55:00Z');
      expect(formatRelativeTime(fiveMinutesAgo)).toBe('5 minutes ago');
    });

    it('시간 단위를 올바르게 표시한다', () => {
      const twoHoursAgo = new Date('2023-01-01T10:00:00Z');
      expect(formatRelativeTime(twoHoursAgo)).toBe('2 hours ago');
    });
  });

  describe('formatDuration', () => {
    it('초 단위를 포맷한다', () => {
      expect(formatDuration(5000)).toBe('5s');
    });

    it('분과 초를 포맷한다', () => {
      expect(formatDuration(125000)).toBe('2m 5s');
    });

    it('시간, 분, 초를 포맷한다', () => {
      expect(formatDuration(3665000)).toBe('1h 1m 5s');
    });

    it('0ms를 올바르게 처리한다', () => {
      expect(formatDuration(0)).toBe('0s');
    });
  });

  describe('debounce', () => {
    it('함수 호출을 지연시킨다', async () => {
      vi.useFakeTimers();

      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      expect(mockFn).not.toHaveBeenCalled();

      // 타이머를 150ms 진행
      vi.advanceTimersByTime(150);
      await vi.runAllTimersAsync();

      expect(mockFn).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });

    it('연속 호출 시 마지막 호출만 실행한다', async () => {
      vi.useFakeTimers();

      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      // 타이머를 150ms 진행
      vi.advanceTimersByTime(150);
      await vi.runAllTimersAsync();

      expect(mockFn).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });
  });

  describe('throttle', () => {
    it('함수 호출을 제한한다', async () => {
      vi.useFakeTimers();

      const mockFn = vi.fn();
      const throttledFn = throttle(mockFn, 100);

      throttledFn();
      throttledFn();
      throttledFn();

      expect(mockFn).toHaveBeenCalledTimes(1);

      // 타이머를 150ms 진행
      vi.advanceTimersByTime(150);
      await vi.runAllTimersAsync();

      throttledFn();
      expect(mockFn).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });
  });

  describe('sleep', () => {
    it('지정된 시간만큼 대기한다', async () => {
      vi.useFakeTimers();

      const start = Date.now();
      const p = sleep(100);
      vi.advanceTimersByTime(100);
      await p;
      const end = Date.now();

      vi.useRealTimers();

      expect(end - start).toBeGreaterThanOrEqual(90);
    });
  });

  describe('retry', () => {
    it('성공하는 함수를 즉시 실행한다', async () => {
      const successFn = vi.fn().mockResolvedValue('success');
      const result = await retry(successFn);

      expect(result).toBe('success');
      expect(successFn).toHaveBeenCalledTimes(1);
    });

    it('실패하는 함수를 재시도한다', async () => {
      vi.useFakeTimers();

      const failFn = vi
        .fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValue('success');

      const resultPromise = retry(failFn, 3, 10);

      // 재시도 지연 시간들을 빠르게 진행 (10ms * 2회)
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result).toBe('success');
      expect(failFn).toHaveBeenCalledTimes(3);

      vi.useRealTimers();
    });

    it('모든 재시도가 실패하면 에러를 던진다', async () => {
      vi.useFakeTimers();

      const failFn = vi.fn().mockRejectedValue(new Error('always fail'));

      // 🔧 수정: Promise rejection을 즉시 처리하여 unhandled rejection 방지
      const failPromise = retry(failFn, 2, 10).catch(err => err);

      // 재시도 지연 시간을 빠르게 진행 (10ms * 1회)
      await vi.runAllTimersAsync();

      // 에러가 제대로 던져졌는지 확인
      const result = await failPromise;
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe('always fail');
      expect(failFn).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });
  });

  describe('hashString', () => {
    it('문자열을 해시한다', async () => {
      const hash = await hashString('test');
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('같은 문자열은 같은 해시를 생성한다', async () => {
      const hash1 = await hashString('test');
      const hash2 = await hashString('test');
      expect(hash1).toBe(hash2);
    });

    it('다른 문자열은 다른 해시를 생성한다', async () => {
      const hash1 = await hashString('test1');
      const hash2 = await hashString('test2');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Environment detection', () => {
    it('isServer는 서버 환경을 감지한다', () => {
      expect(isServer()).toBe(true); // Node.js 테스트 환경
    });

    it('isDevelopment는 개발 환경을 감지한다', () => {
      vi.stubEnv('NODE_ENV', 'development');
      expect(isDevelopment()).toBe(true);

      vi.stubEnv('NODE_ENV', 'production');
      expect(isDevelopment()).toBe(false);

      vi.unstubAllEnvs();
    });
  });

  describe('Array utilities', () => {
    it('groupBy는 배열을 그룹화한다', () => {
      const data = [
        { type: 'A', value: 1 },
        { type: 'B', value: 2 },
        { type: 'A', value: 3 },
      ];

      const grouped = groupBy(data, 'type');
      expect(grouped).toEqual({
        A: [
          { type: 'A', value: 1 },
          { type: 'A', value: 3 },
        ],
        B: [{ type: 'B', value: 2 }],
      });
    });

    it('sortBy는 배열을 정렬한다', () => {
      const data = [{ age: 30 }, { age: 20 }, { age: 25 }];

      const ascending = sortBy(data, 'age', 'asc');
      expect(ascending.map(item => item.age)).toEqual([20, 25, 30]);

      const descending = sortBy(data, 'age', 'desc');
      expect(descending.map(item => item.age)).toEqual([30, 25, 20]);
    });
  });

  describe('Object utilities', () => {
    it('pick은 지정된 키만 선택한다', () => {
      const obj = { a: 1, b: 2, c: 3 };
      const picked = pick(obj, ['a', 'c']);
      expect(picked).toEqual({ a: 1, c: 3 });
    });

    it('omit은 지정된 키를 제외한다', () => {
      const obj = { a: 1, b: 2, c: 3 };
      const omitted = omit(obj, ['b']);
      expect(omitted).toEqual({ a: 1, c: 3 });
    });
  });

  describe('Number utilities', () => {
    it('clamp는 값을 범위 내로 제한한다', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it('calculatePercentage는 백분율을 계산한다', () => {
      expect(calculatePercentage(25, 100)).toBe(25);
      expect(calculatePercentage(1, 3)).toBeCloseTo(33.33, 2);
      expect(calculatePercentage(0, 100)).toBe(0);
    });

    it('formatNumber는 숫자를 포맷한다', () => {
      expect(formatNumber(1000)).toBe('1,000');
      expect(formatNumber(1234567)).toBe('1,234,567');
    });
  });

  describe('String utilities', () => {
    it('generateId는 고유 ID를 생성한다', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
      expect(id1).toHaveLength(8);
    });

    it('generateId는 길이를 조정할 수 있다', () => {
      const id = generateId(12);
      expect(id).toHaveLength(12);
    });

    it('isValidEmail은 이메일을 검증한다', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
    });

    it('truncate는 문자열을 자른다', () => {
      expect(truncate('Hello World', 5)).toBe('Hello...');
      expect(truncate('Hi', 10)).toBe('Hi');
    });
  });

  describe('Status utilities', () => {
    it('getStatusColor는 상태에 따른 색상을 반환한다', () => {
      expect(getStatusColor('healthy')).toBe('text-green-600');
      expect(getStatusColor('warning')).toBe('text-yellow-600');
      expect(getStatusColor('critical')).toBe('text-red-600');
      expect(getStatusColor('unknown')).toBe('text-gray-600');
    });

    it('getSeverityIcon은 심각도에 따른 아이콘을 반환한다', () => {
      expect(getSeverityIcon('low')).toBe('🟢');
      expect(getSeverityIcon('medium')).toBe('🟡');
      expect(getSeverityIcon('high')).toBe('🟠');
      expect(getSeverityIcon('critical')).toBe('🔴');
      expect(getSeverityIcon('unknown')).toBe('⚪');
    });
  });

  describe('isEmpty', () => {
    it('빈 값들을 올바르게 감지한다', () => {
      expect(isEmpty(null)).toBe(true);
      expect(isEmpty(undefined)).toBe(true);
      expect(isEmpty('')).toBe(true);
      expect(isEmpty([])).toBe(true);
      expect(isEmpty({})).toBe(true);
    });

    it('비어있지 않은 값들을 올바르게 감지한다', () => {
      expect(isEmpty('text')).toBe(false);
      expect(isEmpty([1])).toBe(false);
      expect(isEmpty({ key: 'value' })).toBe(false);
      expect(isEmpty(0)).toBe(false);
      expect(isEmpty(false)).toBe(false);
    });
  });
});