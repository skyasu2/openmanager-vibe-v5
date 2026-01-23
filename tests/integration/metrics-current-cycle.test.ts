/**
 * 🔗 Metrics Current Cycle Integration Test
 *
 * 메트릭 API 시간 정규화 및 사이클 생성 로직 통합 테스트
 *
 * Vercel 무료 티어 안전:
 * - ✅ 외부 API 호출 없음 (순수 함수 테스트)
 * - ✅ 시간 기반 로직 테스트 (가상 시간 사용)
 * - ✅ 10초 이내 실행
 *
 * @vitest-environment node
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// 시간 정규화 함수 (API route에서 추출)
function normalizeTimestamp(timestamp: number): number {
  const minuteMs = 60 * 1000;
  return Math.floor(timestamp / minuteMs) * minuteMs;
}

// 24시간 순환 계산 함수
function get24HourCycle(timestamp: number): number {
  const dayMs = 24 * 60 * 60 * 1000;
  return timestamp % dayMs;
}

// 10분 슬롯 계산
function getBaseline10MinSlot(cycleTime: number): number {
  const tenMinMs = 10 * 60 * 1000;
  return Math.floor(cycleTime / tenMinMs);
}

// FNV-1a 해시
function fnv1aHash(seed: number | string): number {
  let hash = 0x811c9dc5;
  const str = typeof seed === 'number' ? seed.toString() : seed;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }
  return hash / 0xffffffff;
}

// 사이클 시나리오 정의
const cycleScenarios = [
  {
    name: 'backup_cycle',
    description: '야간 백업 및 정리',
    affectedServers: ['backup-01', 'database-01', 'file-01'],
  },
  {
    name: 'maintenance_cycle',
    description: '새벽 패치 및 재시작',
    affectedServers: ['web-01', 'api-01', 'security-01'],
  },
  {
    name: 'traffic_cycle',
    description: '출근시간 트래픽 폭증',
    affectedServers: ['web-01', 'web-02', 'load_balancer-01'],
  },
  {
    name: 'database_cycle',
    description: '점심시간 주문 폭증',
    affectedServers: ['database-01', 'api-01', 'cache-01'],
  },
  {
    name: 'network_cycle',
    description: '퇴근시간 파일 다운로드',
    affectedServers: ['file-01', 'web-03', 'load_balancer-01'],
  },
  {
    name: 'batch_cycle',
    description: '저녁 데이터 처리',
    affectedServers: ['api-02', 'database-02', 'monitoring-01'],
  },
];

// 장애 진행 단계 계산
function getIncidentPhase(progress: number) {
  if (progress < 0.2)
    return { phase: 'normal', intensity: 0.0, description: '정상 운영' };
  if (progress < 0.5)
    return { phase: 'incident', intensity: 0.7, description: '장애 발생' };
  if (progress < 0.8)
    return { phase: 'peak', intensity: 1.0, description: '장애 심화' };
  if (progress < 0.95)
    return { phase: 'resolving', intensity: 0.3, description: '해결 중' };
  return { phase: 'resolved', intensity: 0.0, description: '해결 완료' };
}

// 사이클 정보 계산
function getIncidentCycleInfo(hour: number, minute: number) {
  const timeSlot = Math.floor(hour / 4);
  const progressInSlot = ((hour % 4) * 60 + minute) / 240;
  const scenario = cycleScenarios[timeSlot];
  const phaseInfo = getIncidentPhase(progressInSlot);

  return {
    timeSlot,
    scenario,
    phase: phaseInfo.phase,
    intensity: phaseInfo.intensity,
    progress: progressInSlot,
    description: `${scenario?.description || 'Unknown'} - ${phaseInfo.description}`,
    affectedServers: scenario?.affectedServers || [],
  };
}

describe('Metrics Current Cycle Integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('시간 정규화', () => {
    it('1분 단위로 타임스탬프 정규화', () => {
      // Given - 14:32:45.123
      const testTime = new Date('2024-01-15T14:32:45.123Z').getTime();

      // When
      const normalized = normalizeTimestamp(testTime);

      // Then - 14:32:00.000으로 정규화
      const normalizedDate = new Date(normalized);
      expect(normalizedDate.getUTCSeconds()).toBe(0);
      expect(normalizedDate.getUTCMilliseconds()).toBe(0);
      expect(normalizedDate.getUTCMinutes()).toBe(32);
    });

    it('분 경계에서 정확한 정규화', () => {
      // Given - 정각
      const exactMinute = new Date('2024-01-15T09:15:00.000Z').getTime();

      // When
      const normalized = normalizeTimestamp(exactMinute);

      // Then
      expect(normalized).toBe(exactMinute);
    });

    it('actualTimestamp와 normalized timestamp 차이', () => {
      // Given
      const testTime = new Date('2024-01-15T09:15:30.500Z').getTime();

      // When
      const normalized = normalizeTimestamp(testTime);

      // Then
      expect(normalized).toBeLessThanOrEqual(testTime);
      expect(testTime - normalized).toBeLessThan(60000); // 1분 미만
      expect(normalized % 60000).toBe(0); // 정확히 분 단위
    });
  });

  describe('24시간 사이클 시스템', () => {
    it('0-4시: backup_cycle 장애 시나리오', () => {
      // Given - 새벽 2시 30분
      const cycleInfo = getIncidentCycleInfo(2, 30);

      // Then
      expect(cycleInfo.timeSlot).toBe(0);
      expect(cycleInfo.scenario.name).toBe('backup_cycle');
      expect(cycleInfo.affectedServers).toContain('backup-01');
      expect(cycleInfo.affectedServers).toContain('database-01');
    });

    it('4-8시: maintenance_cycle 유지보수', () => {
      // Given - 새벽 6시
      const cycleInfo = getIncidentCycleInfo(6, 0);

      // Then
      expect(cycleInfo.timeSlot).toBe(1);
      expect(cycleInfo.scenario.name).toBe('maintenance_cycle');
      expect(cycleInfo.affectedServers).toContain('web-01');
    });

    it('8-12시: traffic_cycle 트래픽 폭증', () => {
      // Given - 출근시간 10시
      const cycleInfo = getIncidentCycleInfo(10, 0);

      // Then
      expect(cycleInfo.timeSlot).toBe(2);
      expect(cycleInfo.scenario.name).toBe('traffic_cycle');
      expect(cycleInfo.description).toContain('트래픽');
    });

    it('12-16시: database_cycle 점심 주문 폭증', () => {
      // Given - 점심시간 13시
      const cycleInfo = getIncidentCycleInfo(13, 0);

      // Then
      expect(cycleInfo.timeSlot).toBe(3);
      expect(cycleInfo.scenario.name).toBe('database_cycle');
      expect(cycleInfo.affectedServers).toContain('database-01');
    });

    it('16-20시: network_cycle 파일 다운로드', () => {
      // Given - 퇴근시간 18시
      const cycleInfo = getIncidentCycleInfo(18, 0);

      // Then
      expect(cycleInfo.timeSlot).toBe(4);
      expect(cycleInfo.scenario.name).toBe('network_cycle');
    });

    it('20-24시: batch_cycle 배치 처리', () => {
      // Given - 저녁 22시
      const cycleInfo = getIncidentCycleInfo(22, 0);

      // Then
      expect(cycleInfo.timeSlot).toBe(5);
      expect(cycleInfo.scenario.name).toBe('batch_cycle');
    });
  });

  describe('장애 진행 단계', () => {
    it('0-20%: normal (정상 운영)', () => {
      // Given - 사이클 시작 (8시 10분 = 4.2% 진행)
      const cycleInfo = getIncidentCycleInfo(8, 10);

      // Then
      expect(cycleInfo.phase).toBe('normal');
      expect(cycleInfo.intensity).toBe(0);
    });

    it('20-50%: incident (장애 발생)', () => {
      // Given - 사이클 중간 (9시 0분 = 25% 진행)
      const cycleInfo = getIncidentCycleInfo(9, 0);

      // Then
      expect(cycleInfo.phase).toBe('incident');
      expect(cycleInfo.intensity).toBe(0.7);
    });

    it('50-80%: peak (장애 심화)', () => {
      // Given - 사이클 피크 (10시 30분 = 62.5% 진행)
      const cycleInfo = getIncidentCycleInfo(10, 30);

      // Then
      expect(cycleInfo.phase).toBe('peak');
      expect(cycleInfo.intensity).toBe(1.0);
    });

    it('80-95%: resolving (해결 중)', () => {
      // Given - 해결 중 (11시 30분 = 87.5% 진행)
      const cycleInfo = getIncidentCycleInfo(11, 30);

      // Then
      expect(cycleInfo.phase).toBe('resolving');
      expect(cycleInfo.intensity).toBe(0.3);
    });

    it('95-100%: resolved (해결 완료)', () => {
      // Given - 사이클 종료 (11시 55분 = 98.9% 진행)
      const cycleInfo = getIncidentCycleInfo(11, 55);

      // Then
      expect(cycleInfo.phase).toBe('resolved');
      expect(cycleInfo.intensity).toBe(0);
    });

    it('progress 퍼센트 정확도', () => {
      // Given - 사이클 중간
      const cycleInfo = getIncidentCycleInfo(10, 0);

      // Then
      expect(cycleInfo.progress).toBeGreaterThanOrEqual(0);
      expect(cycleInfo.progress).toBeLessThanOrEqual(1);
      // 10시 = (2*60 + 0) / 240 = 0.5
      expect(cycleInfo.progress).toBeCloseTo(0.5);
    });
  });

  describe('10분 슬롯 계산', () => {
    it('0시 → 슬롯 0', () => {
      // Given
      const midnight = new Date('2024-01-15T00:00:00Z').getTime();
      const cycleTime = get24HourCycle(midnight);

      // When
      const slot = getBaseline10MinSlot(cycleTime);

      // Then
      expect(slot).toBe(0);
    });

    it('12시 30분 → 슬롯 75', () => {
      // Given - 12시 30분 = 750분 = 75 * 10분
      const noon = new Date('2024-01-15T12:30:00Z').getTime();
      const cycleTime = get24HourCycle(noon);

      // When
      const slot = getBaseline10MinSlot(cycleTime);

      // Then
      expect(slot).toBe(75);
    });

    it('23시 50분 → 슬롯 143', () => {
      // Given - 23시 50분 = 1430분 = 143 * 10분
      const lateNight = new Date('2024-01-15T23:50:00Z').getTime();
      const cycleTime = get24HourCycle(lateNight);

      // When
      const slot = getBaseline10MinSlot(cycleTime);

      // Then
      expect(slot).toBe(143);
    });

    it('슬롯 범위: 0-143', () => {
      // When - 다양한 시간대 테스트
      for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += 10) {
          const time = new Date(
            `2024-01-15T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00Z`
          ).getTime();
          const cycleTime = get24HourCycle(time);
          const slot = getBaseline10MinSlot(cycleTime);

          // Then
          expect(slot).toBeGreaterThanOrEqual(0);
          expect(slot).toBeLessThanOrEqual(143);
        }
      }
    });
  });

  describe('FNV-1a 해시', () => {
    it('동일 입력 → 동일 해시', () => {
      // Given
      const seed = 'test-server-01';

      // When
      const hash1 = fnv1aHash(seed);
      const hash2 = fnv1aHash(seed);

      // Then
      expect(hash1).toBe(hash2);
    });

    it('다른 입력 → 다른 해시', () => {
      // When
      const hash1 = fnv1aHash('server-01');
      const hash2 = fnv1aHash('server-02');

      // Then
      expect(hash1).not.toBe(hash2);
    });

    it('해시값은 0-1 범위', () => {
      // Given
      const seeds = ['a', 'test', '12345', 'very-long-string-for-testing'];

      // Then
      for (const seed of seeds) {
        const hash = fnv1aHash(seed);
        expect(hash).toBeGreaterThanOrEqual(0);
        expect(hash).toBeLessThanOrEqual(1);
      }
    });

    it('숫자 입력도 처리', () => {
      // When
      const hashFromNumber = fnv1aHash(12345);
      const hashFromString = fnv1aHash('12345');

      // Then
      expect(hashFromNumber).toBe(hashFromString);
    });
  });

  describe('사이클 전환', () => {
    it('사이클 경계 (3시 59분 → 4시 0분) 전환', () => {
      // Given
      const beforeBoundary = getIncidentCycleInfo(3, 59);
      const afterBoundary = getIncidentCycleInfo(4, 0);

      // Then
      expect(beforeBoundary.timeSlot).toBe(0);
      expect(beforeBoundary.scenario.name).toBe('backup_cycle');

      expect(afterBoundary.timeSlot).toBe(1);
      expect(afterBoundary.scenario.name).toBe('maintenance_cycle');
    });

    it('자정 경계 (23시 → 0시) 사이클 리셋', () => {
      // Given
      const beforeMidnight = getIncidentCycleInfo(23, 0);
      const afterMidnight = getIncidentCycleInfo(0, 0);

      // Then
      expect(beforeMidnight.timeSlot).toBe(5);
      expect(afterMidnight.timeSlot).toBe(0);
    });
  });

  describe('서버 영향 범위', () => {
    it('특정 서버가 영향받는 사이클 식별', () => {
      // Given
      const targetServer = 'database-01';

      // When - 모든 사이클에서 영향 확인
      const affectedCycles = cycleScenarios.filter((scenario) =>
        scenario.affectedServers.includes(targetServer)
      );

      // Then
      expect(affectedCycles.length).toBeGreaterThan(0);
      expect(affectedCycles.map((s) => s.name)).toContain('backup_cycle');
      expect(affectedCycles.map((s) => s.name)).toContain('database_cycle');
    });

    it('사이클당 영향받는 서버 수 확인', () => {
      // Then
      for (const scenario of cycleScenarios) {
        expect(scenario.affectedServers.length).toBeGreaterThanOrEqual(2);
        expect(scenario.affectedServers.length).toBeLessThanOrEqual(4);
      }
    });
  });
});
