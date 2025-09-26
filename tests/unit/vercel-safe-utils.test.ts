/**
 * 🛡️ Vercel Safe Utils Test Suite
 * 베르셀 환경에서 발생하는 undefined/null 접근 오류 방지 함수들의 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  isValidServer,
  getSafeServicesLength,
  getSafeValidServices,
  getSafeAlertsCount,
  getSafeArrayLength,
  getSafeProperty,
  normalizeServerForVercel
} from '../../src/lib/vercel-safe-utils';

describe('vercel-safe-utils', () => {
  describe('isValidServer', () => {
    it('유효한 서버 객체를 올바르게 인식한다', () => {
      const validServer = {
        id: 'server-1',
        name: 'Test Server',
        status: 'online'
      };

      expect(isValidServer(validServer)).toBe(true);
    });

    it('무효한 서버 객체를 거부한다', () => {
      expect(isValidServer(null)).toBe(false);
      expect(isValidServer(undefined)).toBe(false);
      expect(isValidServer({})).toBe(false);
      expect(isValidServer({ id: 'test' })).toBe(false);
      expect(isValidServer({ name: 'test' })).toBe(false);
      expect(isValidServer('string')).toBe(false);
      expect(isValidServer(123)).toBe(false);
    });
  });

  describe('getSafeServicesLength', () => {
    it('유효한 서비스 배열의 길이를 반환한다', () => {
      const server = {
        id: 'server-1',
        name: 'Test Server',
        status: 'online',
        services: [
          { name: 'nginx', status: 'running' },
          { name: 'nodejs', status: 'running' }
        ]
      };

      expect(getSafeServicesLength(server)).toBe(2);
    });

    it('무효한 서버에 대해 0을 반환한다', () => {
      expect(getSafeServicesLength(null)).toBe(0);
      expect(getSafeServicesLength(undefined)).toBe(0);
      expect(getSafeServicesLength({})).toBe(0);
    });

    it('서비스가 없는 경우 0을 반환한다', () => {
      const server = {
        id: 'server-1',
        name: 'Test Server',
        status: 'online'
      };

      expect(getSafeServicesLength(server)).toBe(0);
    });

    it('서비스가 배열이 아닌 경우 0을 반환한다', () => {
      const server = {
        id: 'server-1',
        name: 'Test Server',
        status: 'online',
        services: 'not-array'
      };

      expect(getSafeServicesLength(server)).toBe(0);
    });
  });

  describe('getSafeValidServices', () => {
    it('유효한 서비스들만 필터링한다', () => {
      const server = {
        id: 'server-1',
        name: 'Test Server',
        status: 'online',
        services: [
          { name: 'nginx', status: 'running' },
          null,
          { name: '', status: 'running' }, // 빈 이름
          { name: 'nodejs', status: 'running' },
          undefined,
          { status: 'running' }, // 이름 없음
          { name: 'redis', status: 'stopped' }
        ]
      };

      const validServices = getSafeValidServices(server);
      expect(validServices).toHaveLength(3);
      expect(validServices[0].name).toBe('nginx');
      expect(validServices[1].name).toBe('nodejs');
      expect(validServices[2].name).toBe('redis');
    });

    it('무효한 서버에 대해 빈 배열을 반환한다', () => {
      expect(getSafeValidServices(null)).toEqual([]);
      expect(getSafeValidServices(undefined)).toEqual([]);
      expect(getSafeValidServices({})).toEqual([]);
    });
  });

  describe('getSafeAlertsCount', () => {
    it('숫자 타입 알림 수를 올바르게 처리한다', () => {
      expect(getSafeAlertsCount(5)).toBe(5);
      expect(getSafeAlertsCount(0)).toBe(0);
      expect(getSafeAlertsCount(-1)).toBe(0); // 음수는 0으로
      expect(getSafeAlertsCount(3.7)).toBe(3); // 소수는 버림
    });

    it('배열 타입 알림의 길이를 반환한다', () => {
      const alerts = [
        { message: 'Alert 1' },
        { message: 'Alert 2' },
        { message: 'Alert 3' }
      ];

      expect(getSafeAlertsCount(alerts)).toBe(3);
      expect(getSafeAlertsCount([])).toBe(0);
    });

    it('null/undefined에 대해 0을 반환한다', () => {
      expect(getSafeAlertsCount(null)).toBe(0);
      expect(getSafeAlertsCount(undefined)).toBe(0);
    });

    it('잘못된 타입에 대해 0을 반환한다', () => {
      expect(getSafeAlertsCount('string')).toBe(0);
      expect(getSafeAlertsCount({})).toBe(0);
      expect(getSafeAlertsCount(true)).toBe(0);
    });
  });

  describe('getSafeArrayLength', () => {
    it('유효한 배열의 길이를 반환한다', () => {
      expect(getSafeArrayLength([1, 2, 3])).toBe(3);
      expect(getSafeArrayLength([])).toBe(0);
      expect(getSafeArrayLength(['a', 'b'])).toBe(2);
    });

    it('무효한 입력에 대해 0을 반환한다', () => {
      expect(getSafeArrayLength(null)).toBe(0);
      expect(getSafeArrayLength(undefined)).toBe(0);
      expect(getSafeArrayLength('string')).toBe(0);
      expect(getSafeArrayLength(123)).toBe(0);
      expect(getSafeArrayLength({})).toBe(0);
    });
  });

  describe('getSafeProperty', () => {
    it('존재하는 속성을 올바르게 반환한다', () => {
      const obj = { name: 'test', count: 42 };

      expect(getSafeProperty(obj, 'name', 'default')).toBe('test');
      expect(getSafeProperty(obj, 'count', 0)).toBe(42);
    });

    it('존재하지 않는 속성에 대해 기본값을 반환한다', () => {
      const obj = { name: 'test' };

      expect(getSafeProperty(obj, 'missing', 'default')).toBe('default');
      expect(getSafeProperty(obj, 'count', 0)).toBe(0);
    });

    it('무효한 객체에 대해 기본값을 반환한다', () => {
      expect(getSafeProperty(null, 'name', 'default')).toBe('default');
      expect(getSafeProperty(undefined, 'name', 'default')).toBe('default');
      expect(getSafeProperty('string', 'name', 'default')).toBe('default');
    });
  });

  describe('normalizeServerForVercel', () => {
    it('유효한 서버 객체를 정규화한다', () => {
      const server = {
        id: 'server-1',
        name: 'Test Server',
        status: 'online',
        cpu: 75,
        memory: 60,
        services: [{ name: 'nginx', status: 'running' }]
      };

      const normalized = normalizeServerForVercel(server);

      expect(normalized).toBeTruthy();
      expect(normalized?.id).toBe('server-1');
      expect(normalized?.name).toBe('Test Server');
      expect(normalized?.status).toBe('online');
      expect(normalized?.cpu).toBe(75);
      expect(normalized?.services).toHaveLength(1);
    });

    it('무효한 서버에 대해 null을 반환한다', () => {
      expect(normalizeServerForVercel(null)).toBe(null);
      expect(normalizeServerForVercel(undefined)).toBe(null);
      expect(normalizeServerForVercel({})).toBe(null);
      expect(normalizeServerForVercel('invalid')).toBe(null);
    });

    it('부분적으로 누락된 속성을 기본값으로 채운다', () => {
      const incompleteServer = {
        id: 'server-1',
        name: 'Test Server',
        status: 'online'
        // cpu, memory 등이 누락됨
      };

      const normalized = normalizeServerForVercel(incompleteServer);

      expect(normalized).toBeTruthy();
      expect(normalized?.cpu).toBe(0); // 기본값
      expect(normalized?.memory).toBe(0); // 기본값
      expect(normalized?.location).toBe('Unknown'); // 기본값
      expect(normalized?.services).toEqual([]); // 빈 배열
    });
  });

  describe('베르셀 환경 시뮬레이션', () => {
    it('압축된 코드에서 발생할 수 있는 undefined 접근을 안전하게 처리한다', () => {
      // l6 함수에서 발생했던 실제 시나리오 시뮬레이션
      const problematicServer = undefined;

      expect(() => getSafeServicesLength(problematicServer)).not.toThrow();
      expect(() => getSafeValidServices(problematicServer)).not.toThrow();
      expect(() => getSafeAlertsCount(problematicServer?.alerts)).not.toThrow();

      expect(getSafeServicesLength(problematicServer)).toBe(0);
      expect(getSafeValidServices(problematicServer)).toEqual([]);
      expect(getSafeAlertsCount(problematicServer?.alerts)).toBe(0);
    });

    it('중첩된 undefined 접근을 안전하게 처리한다', () => {
      const server = {
        id: 'server-1',
        name: 'Test Server',
        status: 'online',
        services: undefined
      };

      expect(() => {
        const services = server?.services;
        const length = services?.length; // 이런 패턴에서 오류 방지
        return getSafeArrayLength(services);
      }).not.toThrow();
    });
  });
});