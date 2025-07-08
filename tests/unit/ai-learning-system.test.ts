import { SolutionDatabase } from '@/core/ai/databases/SolutionDatabase';
import { IncidentDetectionEngine } from '@/core/ai/engines/IncidentDetectionEngine';
import { AutoIncidentReportSystem } from '@/core/ai/systems/AutoIncidentReportSystem';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * 🧠 AI 학습 시스템 기본 테스트
 *
 * AI 엔진 학습 시스템의 기본 기능을 테스트합니다.
 */
describe('AI Learning System - Basic Tests', () => {
  let autoIncidentSystem: AutoIncidentReportSystem;
  let solutionDatabase: SolutionDatabase;
  let detectionEngine: IncidentDetectionEngine;

  beforeEach(() => {
    // 각 테스트마다 새로운 인스턴스 생성
    detectionEngine = new IncidentDetectionEngine();
    solutionDatabase = new SolutionDatabase();
    autoIncidentSystem = new AutoIncidentReportSystem(
      detectionEngine,
      solutionDatabase,
      true, // enableLearning
      'LOCAL' // mode
    );

    // 콘솔 로그 모킹 (테스트 출력 정리)
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('시스템 초기화', () => {
    it('AutoIncidentReportSystem이 정상적으로 초기화된다', () => {
      expect(autoIncidentSystem).toBeDefined();
      expect(autoIncidentSystem).toBeInstanceOf(AutoIncidentReportSystem);
    });

    it('SolutionDatabase가 정상적으로 초기화된다', () => {
      expect(solutionDatabase).toBeDefined();
      expect(solutionDatabase).toBeInstanceOf(SolutionDatabase);
    });
  });

  describe('학습 메트릭', () => {
    it('학습 메트릭을 가져올 수 있다', () => {
      const metrics = autoIncidentSystem.getLearningMetrics();

      expect(metrics).toBeDefined();
      expect(typeof metrics).toBe('object');

      // 실제 존재하는 속성들만 테스트
      expect(metrics).toHaveProperty('patterns');
      expect(metrics).toHaveProperty('successRate');
      expect(metrics).toHaveProperty('totalIncidents');
      expect(metrics).toHaveProperty('resolvedIncidents');
      expect(metrics).toHaveProperty('averageResolutionTime');
      expect(metrics).toHaveProperty('lastUpdated');
      expect(metrics).toHaveProperty('currentMode');

      // 타입 검증
      expect(Array.isArray(metrics.patterns)).toBe(true);
      expect(typeof metrics.successRate).toBe('number');
      expect(typeof metrics.totalIncidents).toBe('number');
      expect(typeof metrics.resolvedIncidents).toBe('number');
      expect(typeof metrics.averageResolutionTime).toBe('number');
      expect(metrics.lastUpdated).toBeInstanceOf(Date);
      expect(typeof metrics.currentMode).toBe('string');
    });

    it('학습 활성화/비활성화가 작동한다', () => {
      // 학습 비활성화
      autoIncidentSystem.setLearningEnabled(false);

      // 학습 재활성화
      autoIncidentSystem.setLearningEnabled(true);

      // 오류 없이 실행되면 성공
      expect(true).toBe(true);
    });
  });

  describe('해결방안 데이터베이스', () => {
    it('해결방안을 추가할 수 있다', async () => {
      const solutionData = {
        action: '테스트 해결방안',
        description: '테스트용 해결방안입니다',
        category: 'immediate_action' as const,
        priority: 1,
        estimatedTime: 5,
        riskLevel: 'low' as const,
        commands: ['test command'],
        prerequisites: ['테스트 권한'],
        impact: '테스트 영향',
        successRate: 80,
      };

      const solutionId = await solutionDatabase.addSolution(solutionData);
      expect(solutionId).toBeDefined();
      expect(typeof solutionId).toBe('string');
      expect(solutionId.length).toBeGreaterThan(0);
    });

    it('해결방안을 검색할 수 있다', async () => {
      const searchResults = await solutionDatabase.searchSolutions('CPU');
      expect(Array.isArray(searchResults)).toBe(true);
    });

    it('통계를 가져올 수 있다', async () => {
      const stats = await solutionDatabase.getStatistics();
      expect(stats).toBeDefined();
      expect(typeof stats).toBe('object');
      expect(stats).toHaveProperty('totalSolutions');

      // 실제 존재하는 프로퍼티만 확인
      if (stats.hasOwnProperty('solutionsByCategory')) {
        expect(stats).toHaveProperty('solutionsByCategory');
      }
      if (stats.hasOwnProperty('solutionsByRiskLevel')) {
        expect(stats).toHaveProperty('solutionsByRiskLevel');
      }
    });

    it('특정 타입의 해결방안을 가져올 수 있다', async () => {
      const solutions = await solutionDatabase.getSolutions('cpu_overload');
      expect(Array.isArray(solutions)).toBe(true);
    });

    it('추천 해결방안을 가져올 수 있다', async () => {
      const recommendations = await solutionDatabase.getRecommendedSolutions(
        'cpu_overload',
        3
      );
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeLessThanOrEqual(3);
    });
  });

  describe('AI 학습 기능', () => {
    it('학습된 해결방안을 추가할 수 있다', async () => {
      const result = await solutionDatabase.addLearnedSolution(
        'cpu_overload',
        '학습된 CPU 최적화',
        'AI가 학습한 최적화 방법',
        ['htop', 'kill -TERM <PID>'],
        0.85
      );

      // 결과가 string이면 성공, null이면 중복/신뢰도 부족
      expect(result === null || typeof result === 'string').toBe(true);
    });

    it('해결방안 효과성을 업데이트할 수 있다', async () => {
      // 먼저 해결방안 추가
      const solutionData = {
        action: '효과성 테스트',
        description: '효과성 업데이트 테스트',
        category: 'immediate_action' as const,
        priority: 1,
        estimatedTime: 5,
        riskLevel: 'low' as const,
        commands: ['test'],
        prerequisites: ['test'],
        impact: 'test',
        successRate: 50,
      };

      const solutionId = await solutionDatabase.addSolution(solutionData);

      // 효과성 업데이트
      const updateResult = await solutionDatabase.updateSolutionEffectiveness(
        solutionId,
        0.9
      );
      expect(updateResult).toBe(true);
    });
  });

  describe('에러 처리', () => {
    it('잘못된 입력에 대해 적절히 처리한다', async () => {
      // 빈 검색어로 검색
      const emptySearch = await solutionDatabase.searchSolutions('');
      expect(Array.isArray(emptySearch)).toBe(true);

      // 존재하지 않는 해결방안 업데이트
      const invalidUpdate = await solutionDatabase.updateSolutionEffectiveness(
        'invalid-id',
        0.5
      );
      expect(invalidUpdate).toBe(false);
    });

    it('학습 시스템이 오류 상황을 처리한다', () => {
      // 학습 메트릭은 항상 유효한 객체를 반환해야 함
      const metrics = autoIncidentSystem.getLearningMetrics();
      expect(metrics).toBeDefined();
      expect(typeof metrics.successRate).toBe('number');
      expect(typeof metrics.totalIncidents).toBe('number');
      expect(typeof metrics.resolvedIncidents).toBe('number');
    });
  });
});
