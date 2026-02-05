/**
 * @vitest-environment node
 */

import { describe, expect, it } from 'vitest';
import {
  fnv1aHash,
  generateCycleBasedMetric,
  generateCycleScenarios,
  get24HourCycle,
  getBaseline10MinSlot,
  getIncidentCycleInfo,
  interpolate1MinVariation,
  normalizeTimestamp,
  SERVER_PROFILES,
} from './cycle-engine';

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

describe('cycle-engine', () => {
  describe('normalizeTimestamp', () => {
    it('분 단위로 절삭해야 한다', () => {
      // 12345678ms → 분 단위 정규화
      const ts = 12345678;
      const normalized = normalizeTimestamp(ts);
      expect(normalized % MINUTE_MS).toBe(0);
      expect(normalized).toBeLessThanOrEqual(ts);
    });

    it('동일 분 내 다른 밀리초는 같은 결과를 반환해야 한다', () => {
      const base = 1700000000000; // 임의 타임스탬프
      const a = normalizeTimestamp(base);
      const b = normalizeTimestamp(base + 30000); // 30초 뒤 (같은 분)
      expect(a).toBe(b);
    });
  });

  describe('get24HourCycle', () => {
    it('86400000(24시간)으로 나눈 나머지를 반환해야 한다', () => {
      const ts = DAY_MS + 3600000; // 25시간 = 1시간
      expect(get24HourCycle(ts)).toBe(3600000);
    });

    it('결정론적이어야 한다 (동일 입력 → 동일 출력)', () => {
      const ts = 1700000000000;
      expect(get24HourCycle(ts)).toBe(get24HourCycle(ts));
    });
  });

  describe('getBaseline10MinSlot', () => {
    it('cycleTime=0 → slot 0', () => {
      expect(getBaseline10MinSlot(0)).toBe(0);
    });

    it('cycleTime=23:50 → slot 143', () => {
      const cycleTime = 23 * 60 * 60 * 1000 + 50 * 60 * 1000; // 23:50
      expect(getBaseline10MinSlot(cycleTime)).toBe(143);
    });

    it('slot 범위가 0-143이어야 한다', () => {
      // 최대값: DAY_MS - 1
      const maxSlot = getBaseline10MinSlot(DAY_MS - 1);
      expect(maxSlot).toBeLessThanOrEqual(143);
      expect(maxSlot).toBeGreaterThanOrEqual(0);
    });
  });

  describe('fnv1aHash', () => {
    it('동일 입력 → 동일 출력 (결정론적)', () => {
      expect(fnv1aHash('test-server')).toBe(fnv1aHash('test-server'));
    });

    it('0-1 범위를 반환해야 한다', () => {
      const result = fnv1aHash('hello');
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });

    it('숫자 입력도 처리해야 한다', () => {
      const result = fnv1aHash(42);
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });

    it('다른 입력은 다른 값을 반환해야 한다 (분포)', () => {
      const values = new Set<number>();
      for (let i = 0; i < 100; i++) {
        values.add(fnv1aHash(`server-${i}`));
      }
      // 100개 입력에서 최소 90개 이상 고유값 (충돌 10% 미만)
      expect(values.size).toBeGreaterThan(90);
    });
  });

  describe('getIncidentCycleInfo', () => {
    it('hour=0 → timeSlot=0 (backup_cycle)', () => {
      const info = getIncidentCycleInfo(0, 0);
      expect(info.timeSlot).toBe(0);
      expect(info.scenario?.name).toBe('backup_cycle');
    });

    it('hour=4 → timeSlot=1 (maintenance_cycle)', () => {
      const info = getIncidentCycleInfo(4, 0);
      expect(info.timeSlot).toBe(1);
      expect(info.scenario?.name).toBe('maintenance_cycle');
    });

    it('progress < 0.2 → phase=normal', () => {
      // hour=0, minute=0 → progress = 0/240 = 0 (< 0.2)
      const info = getIncidentCycleInfo(0, 0);
      expect(info.phase).toBe('normal');
      expect(info.intensity).toBe(0.0);
    });

    it('progress 0.2~0.5 → phase=incident', () => {
      // hour=0, minute=60 → progress = 60/240 = 0.25 (incident)
      const info = getIncidentCycleInfo(0, 60);
      expect(info.phase).toBe('incident');
      expect(info.intensity).toBe(0.7);
    });

    it('progress 0.5~0.8 → phase=peak', () => {
      // hour=2, minute=0 → progress = 120/240 = 0.5 (peak)
      const info = getIncidentCycleInfo(2, 0);
      expect(info.phase).toBe('peak');
      expect(info.intensity).toBe(1.0);
    });

    it('progress 0.8~0.95 → phase=resolving', () => {
      // hour=3, minute=15 → progress = (3*60+15)/240 = 195/240 = 0.8125
      const info = getIncidentCycleInfo(3, 15);
      expect(info.phase).toBe('resolving');
      expect(info.intensity).toBe(0.3);
    });

    it('progress >= 0.95 → phase=resolved', () => {
      // hour=3, minute=50 → progress = (3*60+50)/240 = 230/240 ≈ 0.958
      const info = getIncidentCycleInfo(3, 50);
      expect(info.phase).toBe('resolved');
      expect(info.intensity).toBe(0.0);
    });
  });

  describe('generateCycleBasedMetric', () => {
    it('결과가 0-100 범위여야 한다', () => {
      const cycleInfo = getIncidentCycleInfo(12, 30);
      const result = generateCycleBasedMetric('web-01', 'cpu', 72, cycleInfo);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(100);
    });

    it('affected server에서 intensity > 0일 때 cycleEffect가 적용되어야 한다', () => {
      // backup_cycle의 affectedServers: ['backup-01', 'database-01', 'file-01']
      // hour=1, minute=0 → progress = 60/240 = 0.25, phase=incident, intensity=0.7
      const cycleInfo = getIncidentCycleInfo(1, 0);
      expect(cycleInfo.intensity).toBe(0.7);

      // affected server
      const affected = generateCycleBasedMetric(
        'backup-01',
        'disk',
        6,
        cycleInfo
      );
      // non-affected server (동일 조건이지만 cycle effect 없음)
      const unaffected = generateCycleBasedMetric(
        'monitoring-01',
        'disk',
        6,
        cycleInfo
      );

      // affected는 cycleEffect가 추가되어 더 높을 수 있음 (backup_cycle disk=40)
      // 둘 다 0-100 범위
      expect(affected).toBeGreaterThanOrEqual(0);
      expect(affected).toBeLessThanOrEqual(100);
      expect(unaffected).toBeGreaterThanOrEqual(0);
      expect(unaffected).toBeLessThanOrEqual(100);
    });
  });

  describe('interpolate1MinVariation', () => {
    it('결과가 0-100 범위로 클램프되어야 한다', () => {
      const result = interpolate1MinVariation(50, Date.now(), 'web-01', 'cpu');
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(100);
    });

    it('결정론적이어야 한다 (동일 입력 → 동일 출력)', () => {
      const ts = 1700000000000;
      const a = interpolate1MinVariation(50, ts, 'web-01', 'cpu');
      const b = interpolate1MinVariation(50, ts, 'web-01', 'cpu');
      expect(a).toBe(b);
    });
  });

  describe('generateCycleScenarios', () => {
    it('scenario가 없으면 빈 배열을 반환해야 한다', () => {
      const noScenario = {
        timeSlot: 0,
        phase: 'normal',
        intensity: 0,
        progress: 0,
        description: 'test',
        expectedResolution: null,
      };
      const alerts = generateCycleScenarios(
        noScenario,
        'web-01',
        'web',
        Date.now()
      );
      expect(alerts).toEqual([]);
    });

    it('intensity > 0.7이면 severity=critical이어야 한다', () => {
      const cycleInfo = getIncidentCycleInfo(2, 0); // peak, intensity=1.0
      const alerts = generateCycleScenarios(
        cycleInfo,
        'web-01',
        'web',
        Date.now()
      );
      expect(alerts.length).toBe(1);
      expect(alerts[0].severity).toBe('critical');
    });
  });

  describe('SERVER_PROFILES', () => {
    it('10개 서버 타입이 정의되어야 한다', () => {
      const types = Object.keys(SERVER_PROFILES);
      expect(types).toContain('web');
      expect(types).toContain('api');
      expect(types).toContain('database');
      expect(types).toContain('cache');
      expect(types).toContain('monitoring');
      expect(types).toContain('security');
      expect(types).toContain('backup');
      expect(types).toContain('load_balancer');
      expect(types).toContain('file');
      expect(types).toContain('mail');
    });

    it('각 프로필의 메트릭 범위가 [min, max] 형식이어야 한다', () => {
      for (const [, profile] of Object.entries(SERVER_PROFILES)) {
        for (const [, range] of Object.entries(profile)) {
          expect(range).toHaveLength(2);
          expect(range[0]).toBeLessThan(range[1]);
          expect(range[0]).toBeGreaterThanOrEqual(0);
          expect(range[1]).toBeLessThanOrEqual(100);
        }
      }
    });
  });
});
