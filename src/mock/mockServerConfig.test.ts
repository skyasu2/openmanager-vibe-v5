import { describe, expect, it } from 'vitest';
import { isValidServerRole, isValidServerStatus } from '@/types/server';
import {
  getFallbackServers,
  getInfrastructureSummary,
  getServerById,
  getServersByLocation,
  getServersByType,
  mockServers,
} from './mockServerConfig';

describe('mockServerConfig', () => {
  describe('mockServers', () => {
    it('15개의 서버가 정의되어야 함', () => {
      expect(mockServers).toBeDefined();
      expect(Array.isArray(mockServers)).toBe(true);
      expect(mockServers.length).toBe(15);
    });

    it('모든 서버가 올바른 구조를 가져야 함', () => {
      mockServers.forEach((server) => {
        expect(server).toHaveProperty('id');
        expect(server).toHaveProperty('hostname');
        expect(server).toHaveProperty('type');
        expect(server).toHaveProperty('os');
        expect(server).toHaveProperty('service');
        expect(server).toHaveProperty('ip');
        expect(server).toHaveProperty('location');
        expect(server).toHaveProperty('cpu');
        expect(server).toHaveProperty('memory');
        expect(server).toHaveProperty('disk');
        expect(server).toHaveProperty('status');
        expect(server).toHaveProperty('description');

        expect(typeof server.id).toBe('string');
        expect(typeof server.hostname).toBe('string');
        expect(typeof server.cpu.cores).toBe('number');
        expect(typeof server.memory.total).toBe('number');
        expect(typeof server.disk.total).toBe('number');
      });
    });

    it('서버 ID가 고유해야 함', () => {
      const ids = mockServers.map((server) => server.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('모든 서버가 유효한 타입을 가져야 함 (MockServerInfo.type)', () => {
      // MockServerInfo.type은 'loadbalancer'를 포함 (getFallbackServers에서 정규화됨)
      const validMockTypes = [
        'web',
        'app',
        'database',
        'storage',
        'backup',
        'cache',
        'monitoring',
        'loadbalancer',
      ];
      mockServers.forEach((server) => {
        expect(validMockTypes).toContain(server.type);
      });
    });

    it('모든 서버가 유효한 상태를 가져야 함', () => {
      mockServers.forEach((server) => {
        expect(isValidServerStatus(server.status)).toBe(true);
      });
    });

    it('서울(ICN)과 부산(PUS) 서버가 혼합되어야 함', () => {
      const icnServers = mockServers.filter((s) => s.location.includes('ICN'));
      const pusServers = mockServers.filter((s) => s.location.includes('PUS'));

      expect(icnServers.length).toBeGreaterThan(0);
      expect(pusServers.length).toBeGreaterThan(0);
    });
  });

  describe('getServerById', () => {
    it('존재하는 서버 ID로 서버를 반환해야 함', () => {
      const server = getServerById('web-nginx-icn-01');
      expect(server).toBeDefined();
      expect(server?.id).toBe('web-nginx-icn-01');
    });

    it('존재하지 않는 서버 ID로 undefined를 반환해야 함', () => {
      const server = getServerById('non-existent-server');
      expect(server).toBeUndefined();
    });
  });

  describe('getServersByType', () => {
    it('타입별로 서버를 필터링해야 함', () => {
      const webServers = getServersByType('web');
      expect(webServers.length).toBeGreaterThan(0);
      webServers.forEach((server) => {
        expect(server.type).toBe('web');
      });
    });

    it('데이터베이스 서버를 올바르게 필터링해야 함', () => {
      const dbServers = getServersByType('database');
      expect(dbServers.length).toBeGreaterThan(0);
      dbServers.forEach((server) => {
        expect(server.type).toBe('database');
      });
    });
  });

  describe('getServersByLocation', () => {
    it('위치별로 서버를 필터링해야 함', () => {
      const icnServers = getServersByLocation('ICN');
      expect(icnServers.length).toBeGreaterThan(0);
      icnServers.forEach((server) => {
        expect(server.location).toContain('ICN');
      });
    });

    it('부산 DR 서버를 올바르게 필터링해야 함', () => {
      const pusServers = getServersByLocation('PUS');
      expect(pusServers.length).toBeGreaterThan(0);
      pusServers.forEach((server) => {
        expect(server.location).toContain('PUS');
      });
    });
  });

  describe('getInfrastructureSummary', () => {
    it('인프라 요약 정보를 올바르게 반환해야 함', () => {
      const summary = getInfrastructureSummary();

      expect(summary).toHaveProperty('total');
      expect(summary).toHaveProperty('byZone');
      expect(summary).toHaveProperty('byType');

      expect(summary.total).toBe(15);
      expect(typeof summary.byZone).toBe('object');
      expect(typeof summary.byType).toBe('object');
    });

    it('존별 서버 수가 올바르게 계산되어야 함', () => {
      const summary = getInfrastructureSummary();

      expect(summary.byZone['Seoul-ICN']).toBeGreaterThan(0);
      expect(summary.byZone['Busan-PUS']).toBeGreaterThan(0);
      expect(summary.byZone['Seoul-ICN'] + summary.byZone['Busan-PUS']).toBe(
        15
      );
    });

    it('타입별 서버 수가 올바르게 계산되어야 함', () => {
      const summary = getInfrastructureSummary();

      // 타입별 합계가 전체 서버 수와 같아야 함
      const totalByType = Object.values(summary.byType).reduce(
        (sum, count) => sum + count,
        0
      );
      expect(totalByType).toBe(15);
    });
  });

  describe('getFallbackServers', () => {
    it('15개의 Server 객체를 반환해야 함', () => {
      const servers = getFallbackServers();
      expect(servers).toBeDefined();
      expect(Array.isArray(servers)).toBe(true);
      expect(servers.length).toBe(15);
    });

    it('모든 서버가 Server 인터페이스 구조를 가져야 함', () => {
      const servers = getFallbackServers();

      servers.forEach((server) => {
        // 필수 필드 확인
        expect(server).toHaveProperty('id');
        expect(server).toHaveProperty('name');
        expect(server).toHaveProperty('hostname');
        expect(server).toHaveProperty('type');
        expect(server).toHaveProperty('status');
        expect(server).toHaveProperty('cpu');
        expect(server).toHaveProperty('memory');
        expect(server).toHaveProperty('disk');
        expect(server).toHaveProperty('network');
        expect(server).toHaveProperty('uptime');
        expect(server).toHaveProperty('location');
        expect(server).toHaveProperty('specs');

        // 타입 확인
        expect(typeof server.id).toBe('string');
        expect(typeof server.name).toBe('string');
        expect(typeof server.hostname).toBe('string');
        expect(typeof server.cpu).toBe('number');
        expect(typeof server.memory).toBe('number');
        expect(typeof server.disk).toBe('number');
        expect(typeof server.network).toBe('number');
      });
    });

    it('메트릭 값이 예상 범위 내에 있어야 함', () => {
      const servers = getFallbackServers();

      servers.forEach((server) => {
        // CPU: 30-50% 범위
        expect(server.cpu).toBeGreaterThanOrEqual(30);
        expect(server.cpu).toBeLessThanOrEqual(50);

        // Memory: 40-70% 범위
        expect(server.memory).toBeGreaterThanOrEqual(40);
        expect(server.memory).toBeLessThanOrEqual(70);

        // Disk: 20-50% 범위
        expect(server.disk).toBeGreaterThanOrEqual(20);
        expect(server.disk).toBeLessThanOrEqual(50);

        // Network: 40-70% 범위
        expect(server.network).toBeGreaterThanOrEqual(40);
        expect(server.network).toBeLessThanOrEqual(70);
      });
    });

    it('specs 객체가 올바른 구조를 가져야 함', () => {
      const servers = getFallbackServers();

      servers.forEach((server) => {
        expect(server.specs).toBeDefined();
        expect(server.specs).toHaveProperty('cpu_cores');
        expect(server.specs).toHaveProperty('memory_gb');
        expect(server.specs).toHaveProperty('disk_gb');
        expect(server.specs).toHaveProperty('network_speed');

        expect(typeof server.specs?.cpu_cores).toBe('number');
        expect(typeof server.specs?.memory_gb).toBe('number');
        expect(typeof server.specs?.disk_gb).toBe('number');
        expect(server.specs?.network_speed).toBe('1Gbps');
      });
    });

    it('hostname이 .internal 도메인을 가져야 함', () => {
      const servers = getFallbackServers();

      servers.forEach((server) => {
        expect(server.hostname).toMatch(/\.internal$/);
      });
    });

    it('환경이 production으로 설정되어야 함', () => {
      const servers = getFallbackServers();

      servers.forEach((server) => {
        expect(server.environment).toBe('production');
      });
    });

    it('provider가 On-Premise로 설정되어야 함', () => {
      const servers = getFallbackServers();

      servers.forEach((server) => {
        expect(server.provider).toBe('On-Premise');
      });
    });

    it('lastUpdate가 Date 객체여야 함', () => {
      const servers = getFallbackServers();

      servers.forEach((server) => {
        expect(server.lastUpdate).toBeInstanceOf(Date);
      });
    });

    it('type과 role이 일치해야 함', () => {
      const servers = getFallbackServers();

      servers.forEach((server) => {
        expect(server.type).toBe(server.role);
      });
    });

    it('모든 서버 타입이 SSOT ServerRole에 유효해야 함', () => {
      const servers = getFallbackServers();

      servers.forEach((server) => {
        // isValidServerRole 타입 가드를 사용하여 SSOT 정합성 검증
        expect(isValidServerRole(server.type)).toBe(true);
        expect(isValidServerRole(server.role)).toBe(true);
      });
    });

    it('loadbalancer 타입이 load-balancer로 정규화되어야 함', () => {
      const servers = getFallbackServers();

      // lb-haproxy-icn-01, lb-haproxy-pus-01 서버가 load-balancer로 변환되었는지 확인
      const lbServers = servers.filter((s) => s.id.startsWith('lb-'));
      expect(lbServers.length).toBe(2);

      lbServers.forEach((server) => {
        expect(server.type).toBe('load-balancer');
        expect(server.role).toBe('load-balancer');
      });
    });
  });
});
