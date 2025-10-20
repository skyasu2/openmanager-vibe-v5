/**
 * 🧪 serverConfig.ts 단위 테스트
 *
 * AI 교차검증 권장사항 구현:
 * - getAllServersInfo() 길이 검증
 * - ACTIVE_SERVER_CONFIG.maxServers 동적 설정 검증
 * - 서버 정보 생성 로직 검증
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getAllServersInfo,
  getServerInfoByIndex,
  getServerTypeByIndex,
  getServerStatusByIndex,
  ACTIVE_SERVER_CONFIG,
  DEFAULT_SERVER_COUNT,
} from '@/config/serverConfig';

describe('serverConfig', () => {
  describe('getAllServersInfo', () => {
    it('현재 설정된 서버 개수만큼 정확히 반환한다', () => {
      const servers = getAllServersInfo();

      // CRITICAL: 하드코딩 8 버그 수정 검증 (Commit 11a43210)
      expect(servers).toHaveLength(ACTIVE_SERVER_CONFIG.maxServers);
    });

    it('기본값 15개 서버를 생성한다', () => {
      const servers = getAllServersInfo();

      // 환경변수로 오버라이드하지 않은 경우 15개
      expect(servers.length).toBeGreaterThanOrEqual(15);
    });

    it('각 서버가 필수 속성을 포함한다', () => {
      const servers = getAllServersInfo();

      servers.forEach((server, index) => {
        expect(server).toHaveProperty('index', index);
        expect(server).toHaveProperty('type');
        expect(server).toHaveProperty('status');
        expect(server).toHaveProperty('name');

        // 타입 검증
        expect(typeof server.index).toBe('number');
        expect(typeof server.type).toBe('string');
        expect(server.status).toMatch(/^(online|warning|critical)$/);
        expect(typeof server.name).toBe('string');
      });
    });

    it('서버 인덱스가 0부터 연속적이다', () => {
      const servers = getAllServersInfo();

      servers.forEach((server, index) => {
        expect(server.index).toBe(index);
      });
    });

    it('모든 서버의 이름이 고유하다', () => {
      const servers = getAllServersInfo();
      const names = servers.map((s) => s.name);
      const uniqueNames = new Set(names);

      expect(uniqueNames.size).toBe(servers.length);
    });

    it('CRITICAL 버그 수정 검증: 7개 서버 누락 방지', () => {
      const servers = getAllServersInfo();
      const maxServers = ACTIVE_SERVER_CONFIG.maxServers;

      // 이전 버그: Array.from({ length: 8 })로 인해 인덱스 8-14 누락
      // 현재: 동적으로 maxServers만큼 생성
      expect(servers.length).toBe(maxServers);

      // 마지막 서버 인덱스 검증 (15개 설정 시 14가 마지막)
      const lastServer = servers[servers.length - 1];
      expect(lastServer?.index).toBe(maxServers - 1);
    });
  });

  describe('getServerInfoByIndex', () => {
    it('유효한 인덱스에 대해 올바른 서버 정보를 반환한다', () => {
      const server0 = getServerInfoByIndex(0);
      const server14 = getServerInfoByIndex(14);

      expect(server0.index).toBe(0);
      expect(server14.index).toBe(14);

      expect(server0.name).toMatch(/^[a-z-]+-01$/);
      expect(server14.name).toMatch(/^[a-z-]+-15$/);
    });

    it('서버 타입과 상태를 올바르게 반환한다', () => {
      const server = getServerInfoByIndex(0);

      expect(server.type).toBeTruthy();
      expect(server.status).toMatch(/^(online|warning|critical)$/);
    });
  });

  describe('getServerTypeByIndex', () => {
    it('유효한 인덱스에 대해 서버 타입을 반환한다', () => {
      const types = [
        'web',
        'app',
        'api',
        'database',
        'cache',
        'storage',
        'load-balancer',
        'backup',
      ];

      const type0 = getServerTypeByIndex(0);
      const type7 = getServerTypeByIndex(7);

      // 폴백 타입 중 하나여야 함
      expect(types).toContain(type0);
      expect(types).toContain(type7);
    });

    it('범위 밖 인덱스에 대해 폴백 타입을 반환한다', () => {
      const type100 = getServerTypeByIndex(100);

      expect(type100).toBeTruthy();
      expect(typeof type100).toBe('string');
    });
  });

  describe('getServerStatusByIndex', () => {
    it('유효한 상태 값을 반환한다', () => {
      const status0 = getServerStatusByIndex(0);
      const status5 = getServerStatusByIndex(5);

      expect(status0).toMatch(/^(online|warning|critical)$/);
      expect(status5).toMatch(/^(online|warning|critical)$/);
    });

    it('폴백 로직이 올바르게 동작한다', () => {
      // 인덱스 0-1: critical
      expect(getServerStatusByIndex(0)).toBe('critical');
      expect(getServerStatusByIndex(1)).toBe('critical');

      // 인덱스 2-4: warning
      expect(getServerStatusByIndex(2)).toBe('warning');
      expect(getServerStatusByIndex(3)).toBe('warning');
      expect(getServerStatusByIndex(4)).toBe('warning');

      // 인덱스 5+: online
      expect(getServerStatusByIndex(5)).toBe('online');
      expect(getServerStatusByIndex(10)).toBe('online');
    });
  });

  describe('ACTIVE_SERVER_CONFIG', () => {
    it('maxServers가 올바르게 설정되어 있다', () => {
      expect(ACTIVE_SERVER_CONFIG.maxServers).toBeGreaterThan(0);
      expect(typeof ACTIVE_SERVER_CONFIG.maxServers).toBe('number');
    });

    it('시나리오 설정이 존재한다', () => {
      expect(ACTIVE_SERVER_CONFIG.scenario).toBeDefined();
      expect(ACTIVE_SERVER_CONFIG.scenario.criticalCount).toBeGreaterThan(0);
      expect(ACTIVE_SERVER_CONFIG.scenario.warningPercent).toBeGreaterThan(0);
    });

    it('페이지네이션 설정이 존재한다', () => {
      expect(ACTIVE_SERVER_CONFIG.pagination).toBeDefined();
      expect(ACTIVE_SERVER_CONFIG.pagination.defaultPageSize).toBeGreaterThan(
        0
      );
      expect(ACTIVE_SERVER_CONFIG.pagination.maxPageSize).toBeGreaterThan(0);
    });
  });

  describe('환경 변수 동작', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      vi.resetModules();
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('DEFAULT_SERVER_COUNT가 15로 설정되어 있다', () => {
      expect(DEFAULT_SERVER_COUNT).toBe(15);
    });

    it('환경변수 없이도 기본값 15로 동작한다', () => {
      // SERVER_COUNT 환경변수가 없어도 15개 생성
      const servers = getAllServersInfo();
      expect(servers.length).toBeGreaterThanOrEqual(15);
    });
  });

  describe('에지 케이스', () => {
    it('음수 인덱스에 대해 안전하게 처리한다', () => {
      expect(() => getServerInfoByIndex(-1)).not.toThrow();
      const server = getServerInfoByIndex(-1);
      expect(server).toBeDefined();
    });

    it('매우 큰 인덱스에 대해 안전하게 처리한다', () => {
      expect(() => getServerInfoByIndex(1000)).not.toThrow();
      const server = getServerInfoByIndex(1000);
      expect(server).toBeDefined();
      expect(server.index).toBe(1000);
    });

    it('getAllServersInfo를 여러 번 호출해도 일관된 결과를 반환한다', () => {
      const servers1 = getAllServersInfo();
      const servers2 = getAllServersInfo();

      expect(servers1.length).toBe(servers2.length);

      servers1.forEach((server, index) => {
        expect(server.index).toBe(servers2[index]?.index);
        expect(server.type).toBe(servers2[index]?.type);
        expect(server.status).toBe(servers2[index]?.status);
        expect(server.name).toBe(servers2[index]?.name);
      });
    });
  });

  describe('성능', () => {
    it('getAllServersInfo가 합리적인 시간 내에 완료된다', () => {
      const startTime = performance.now();
      getAllServersInfo();
      const endTime = performance.now();

      // 15개 서버 생성이 10ms 이내 완료되어야 함
      expect(endTime - startTime).toBeLessThan(10);
    });

    it('100회 호출 시 성능 저하가 없다', () => {
      const startTime = performance.now();

      for (let i = 0; i < 100; i++) {
        getAllServersInfo();
      }

      const endTime = performance.now();
      const avgTime = (endTime - startTime) / 100;

      // 평균 1ms 이내
      expect(avgTime).toBeLessThan(1);
    });
  });
});
