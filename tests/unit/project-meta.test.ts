/**
 * 프로젝트 메타 데이터 유틸리티 단위 테스트
 * @vitest-environment node
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  getProjectDuration,
  getVersionDate,
  getProjectTimeline,
  getProjectProgress,
  isValidProjectDate,
  detectWrongDates,
  getNextVersion,
  ProjectMeta
} from '../../src/lib/project-meta';

describe('ProjectMeta Utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-07-01T06:30:45.000Z')); // KST: 2025-07-01 15:30:45
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('프로젝트 관리 함수', () => {
    it('getProjectDuration() - 프로젝트 진행 기간을 계산해야 함', () => {
      const result = getProjectDuration();
      expect(result).toHaveProperty('months');
      expect(result).toHaveProperty('days');
      expect(result).toHaveProperty('totalDays');
      expect(result.totalDays).toBeGreaterThanOrEqual(42);
      expect(result.totalDays).toBeLessThanOrEqual(43);
    });

    it('getVersionDate() - 버전별 날짜를 반환해야 함', () => {
      expect(getVersionDate('1.0.0')).toBe('2025-05-20');
      expect(getVersionDate('5.41.0')).toBe('2025-07-01');
      expect(getVersionDate('unknown')).toBe('2025-07-01');
    });

    it('getProjectTimeline() - 프로젝트 타임라인을 반환해야 함', () => {
      const timeline = getProjectTimeline();
      expect(timeline).toHaveLength(5);
      expect(timeline[0].phase).toBe('Phase 1: TDD 기반 리팩토링');
      expect(timeline[0].status).toBe('completed');
    });

    it('getProjectProgress() - 프로젝트 진행률을 계산해야 함', () => {
      const progress = getProjectProgress();
      expect(progress.completedPhases).toBe(3);
      expect(progress.totalPhases).toBe(5);
      expect(progress.progressPercentage).toBe(60);
      expect(progress.currentPhase).toBe('Phase 4: 마무리 작업');
    });
  });

  describe('날짜 검증 함수', () => {
    it('isValidProjectDate() - 유효한 프로젝트 날짜를 확인해야 함', () => {
      expect(isValidProjectDate('2025-06-01')).toBe(true);
      expect(isValidProjectDate('2025-05-20')).toBe(true);
      expect(isValidProjectDate('2025-07-01')).toBe(true);
    });

    it('isValidProjectDate() - 잘못된 날짜를 거부해야 함', () => {
      expect(isValidProjectDate('2025-08-01')).toBe(false);
      expect(isValidProjectDate('2025-05-19')).toBe(false);
      expect(isValidProjectDate('invalid-date')).toBe(false);
    });

    it('detectWrongDates() - 잘못된 날짜 패턴을 감지해야 함', () => {
      const content = `
        작성일: 2025-07-15 (잘못됨)
        업데이트: 2025-12-01 (잘못됨)
        시작일: 2024-01-01 (프로젝트 시작 전)
        올바른 날짜: 2025-06-15
      `;
      const wrongDates = detectWrongDates(content);
      expect(wrongDates).toEqual(expect.arrayContaining(['2025-07', '2025-12', '2024-01-01']));
    });
  });

  describe('버전 관리 함수', () => {
    it('getNextVersion() - 다음 버전 번호를 생성해야 함', () => {
      expect(getNextVersion('5.41.0', 'major')).toBe('6.0.0');
      expect(getNextVersion('5.41.0', 'minor')).toBe('5.42.0');
      expect(getNextVersion('5.41.0', 'patch')).toBe('5.41.1');
      expect(getNextVersion('5.41.0')).toBe('5.42.0');
    });
  });

  describe('ProjectMeta 단축 객체', () => {
    it('ProjectMeta 프로젝트 관리 함수들이 정상 작동해야 함', () => {
        expect(ProjectMeta.isValidDate('2025-06-01')).toBe(true);
        expect(ProjectMeta.checkWrongDates('2025-08-01')).toEqual(expect.arrayContaining(['2025-08']));
        expect(ProjectMeta.duration().totalDays).toBeGreaterThanOrEqual(42);
        expect(ProjectMeta.timeline()).toHaveLength(5);
        expect(ProjectMeta.progress().progressPercentage).toBe(60);
        expect(ProjectMeta.versionDate('1.0.0')).toBe('2025-05-20');
        expect(ProjectMeta.nextVersion('5.41.0', 'minor')).toBe('5.42.0');
    });
  });
});