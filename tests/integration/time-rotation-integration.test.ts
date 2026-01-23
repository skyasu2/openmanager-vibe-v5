/**
 * 🔗 Time Rotation Service Integration Test
 *
 * 24시간 시뮬레이션 시스템 통합 테스트
 *
 * Vercel 무료 티어 안전:
 * - ✅ 시간 Mock 사용
 * - ✅ 외부 API 호출 없음
 * - ✅ 10초 이내 실행
 *
 * @vitest-environment node
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  TIME_OF_DAY_PATTERNS,
  TimeRotationService,
} from '@/services/time/TimeRotationService';

describe('TimeRotationService Integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('TIME_OF_DAY_PATTERNS 검증', () => {
    it('24개 시간대 패턴 정의', () => {
      // Then
      expect(TIME_OF_DAY_PATTERNS).toHaveLength(24);
    });

    it('각 시간대별 라벨 존재', () => {
      // Then
      for (const pattern of TIME_OF_DAY_PATTERNS) {
        expect(pattern.label).toBeDefined();
        expect(typeof pattern.label).toBe('string');
        expect(pattern.label.length).toBeGreaterThan(0);
      }
    });

    it('모든 시간(0-23) 커버', () => {
      // When
      const hours = TIME_OF_DAY_PATTERNS.map((p) => p.hour);

      // Then
      for (let i = 0; i < 24; i++) {
        expect(hours).toContain(i);
      }
    });

    it('모든 cpuMultiplier가 0-2 범위', () => {
      // Then
      for (const pattern of TIME_OF_DAY_PATTERNS) {
        expect(pattern.cpuMultiplier).toBeGreaterThanOrEqual(0);
        expect(pattern.cpuMultiplier).toBeLessThanOrEqual(2);
      }
    });

    it('모든 memoryMultiplier가 0-2 범위', () => {
      // Then
      for (const pattern of TIME_OF_DAY_PATTERNS) {
        expect(pattern.memoryMultiplier).toBeGreaterThanOrEqual(0);
        expect(pattern.memoryMultiplier).toBeLessThanOrEqual(2);
      }
    });

    it('모든 alertProbability가 0-1 범위', () => {
      // Then
      for (const pattern of TIME_OF_DAY_PATTERNS) {
        expect(pattern.alertProbability).toBeGreaterThanOrEqual(0);
        expect(pattern.alertProbability).toBeLessThanOrEqual(1);
      }
    });

    it('피크 시간대(14-16시) cpuMultiplier 최대', () => {
      // When
      const peakPatterns = TIME_OF_DAY_PATTERNS.filter(
        (p) => p.hour >= 14 && p.hour <= 16
      );

      // Then
      for (const pattern of peakPatterns) {
        expect(pattern.cpuMultiplier).toBeGreaterThanOrEqual(1.0);
      }
    });

    it('심야 시간대(0-5시) cpuMultiplier 최소', () => {
      // When
      const nightPatterns = TIME_OF_DAY_PATTERNS.filter(
        (p) => p.hour >= 0 && p.hour <= 5
      );

      // Then
      for (const pattern of nightPatterns) {
        expect(pattern.cpuMultiplier).toBeLessThanOrEqual(0.5);
      }
    });
  });

  describe('시간대 라벨 매핑', () => {
    it('새벽 시간대 라벨 확인', () => {
      // When
      const pattern = TIME_OF_DAY_PATTERNS.find((p) => p.hour === 4);

      // Then
      expect(pattern?.label).toBe('새벽');
    });

    it('출근 시간대 라벨 확인', () => {
      // When
      const pattern = TIME_OF_DAY_PATTERNS.find((p) => p.hour === 7);

      // Then
      expect(pattern?.label).toBe('출근시간');
    });

    it('피크 시간대 라벨 확인', () => {
      // When
      const pattern = TIME_OF_DAY_PATTERNS.find((p) => p.hour === 15);

      // Then
      expect(pattern?.label).toBe('최대피크');
    });

    it('퇴근 시간대 라벨 확인', () => {
      // When
      const pattern = TIME_OF_DAY_PATTERNS.find((p) => p.hour === 18);

      // Then
      expect(pattern?.label).toBe('퇴근시간');
    });
  });

  describe('상대 시간 계산', () => {
    it('getRelativeTime - 방금 업데이트 (< 10초)', () => {
      // Given
      const service = TimeRotationService.getInstance();
      const now = new Date();
      const lastUpdate = new Date(now.getTime() - 5000); // 5초 전

      // 서비스 상태 설정을 위해 시뮬레이션 시간 설정
      vi.setSystemTime(now);

      // When
      const result = service.getRelativeTime(lastUpdate);

      // Then
      expect(result).toBe('방금 업데이트');
    });

    it('getRelativeTime - N초 전 (10-59초)', () => {
      // Given
      const service = TimeRotationService.getInstance();
      const state = service.getState();
      const lastUpdate = new Date(state.simulatedTime.getTime() - 30000); // 30초 전

      // When
      const result = service.getRelativeTime(lastUpdate);

      // Then
      expect(result).toMatch(/^\d+초 전$/);
    });

    it('getRelativeTime - N분 전 (1-59분)', () => {
      // Given
      const service = TimeRotationService.getInstance();
      const state = service.getState();
      const lastUpdate = new Date(state.simulatedTime.getTime() - 5 * 60000); // 5분 전

      // When
      const result = service.getRelativeTime(lastUpdate);

      // Then
      expect(result).toMatch(/^\d+분 전$/);
    });

    it('getRelativeTime - N시간 전 (1-23시간)', () => {
      // Given
      const service = TimeRotationService.getInstance();
      const state = service.getState();
      const lastUpdate = new Date(
        state.simulatedTime.getTime() - 2 * 60 * 60000
      ); // 2시간 전

      // When
      const result = service.getRelativeTime(lastUpdate);

      // Then
      expect(result).toMatch(/^\d+시간 전$/);
    });

    it('getRelativeTime - N일 전 (24시간+)', () => {
      // Given
      const service = TimeRotationService.getInstance();
      const state = service.getState();
      const lastUpdate = new Date(
        state.simulatedTime.getTime() - 48 * 60 * 60000
      ); // 48시간 전

      // When
      const result = service.getRelativeTime(lastUpdate);

      // Then
      expect(result).toMatch(/^\d+일 전$/);
    });
  });
});
