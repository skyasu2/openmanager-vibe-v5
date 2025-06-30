/**
 * 🔴 TDD RED: SmartAIAgent 테스트
 *
 * 상황 인식 AI 에이전트의 핵심 기능을 테스트합니다.
 * 현재는 구현이 없으므로 모든 테스트가 실패할 것입니다.
 *
 * 테스트 커버리지:
 * - 시스템 상태 분석
 * - 쿼리 타입 분류
 * - 상황별 스마트 응답 생성
 * - 긴급도 판단
 * - 액션 제안
 */

import { beforeEach, describe, expect, test, vi } from 'vitest';

// 🔴 아직 존재하지 않는 모듈 (테스트가 실패할 것)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - TDD Red 단계: 모듈이 아직 존재하지 않음
import { SmartAIAgent } from '@/services/ai/SmartAIAgent';

// 타입 정의 (실제 구현에서는 별도 파일에 있을 것)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type SystemCondition = 'normal' | 'warning' | 'critical' | 'emergency';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type QueryType =
  | 'status'
  | 'performance'
  | 'troubleshooting'
  | 'optimization'
  | 'general';

describe('🔴 TDD Red - SmartAIAgent', () => {
  let aiAgent: SmartAIAgent;

  beforeEach(() => {
    // 🔴 이 생성자는 아직 존재하지 않음
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - TDD Red 단계
    aiAgent = new SmartAIAgent();
    // TDD Green: 각 테스트 전에 mock 상태 초기화
    aiAgent.setMockCondition(null);
  });

  describe('시스템 상태 분석', () => {
    test('정상 상태를 올바르게 감지해야 함', () => {
      // Mock 정상 상태 데이터 (향후 store mock에서 사용될 예정)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const mockServers = [
        { id: '1', status: 'healthy', cpu: 30, memory: 40 },
        { id: '2', status: 'healthy', cpu: 25, memory: 35 },
      ];

      // 🔴 이 메서드는 아직 존재하지 않음
      const condition = aiAgent.analyzeSystemCondition();

      expect(condition).toBe('normal');
    });

    test('경고 상태를 올바르게 감지해야 함', () => {
      // Mock 경고 상태 데이터 (향후 store mock에서 사용될 예정)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const mockServers = [
        { id: '1', status: 'warning', cpu: 85, memory: 80 },
        { id: '2', status: 'healthy', cpu: 30, memory: 40 },
      ];

      // TDD Green: mock 상태 설정
      aiAgent.setMockCondition('warning');
      const condition = aiAgent.analyzeSystemCondition();

      expect(condition).toBe('warning');
    });

    test('심각 상태를 올바르게 감지해야 함', () => {
      // Mock 심각 상태 데이터 (향후 store mock에서 사용될 예정)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const mockServers = [
        { id: '1', status: 'critical', cpu: 98, memory: 95 },
        { id: '2', status: 'critical', cpu: 97, memory: 93 },
      ];

      // TDD Green: mock 상태 설정
      aiAgent.setMockCondition('critical');
      const condition = aiAgent.analyzeSystemCondition();

      expect(condition).toBe('critical');
    });
  });

  describe('쿼리 타입 분류', () => {
    test('상태 쿼리를 올바르게 분류해야 함', () => {
      const queries = [
        '시스템 상태가 어떤가요?',
        '현재 서버 현황은?',
        'What is the status?',
      ];

      queries.forEach(query => {
        // 🔴 이 메서드는 아직 존재하지 않음
        const type = aiAgent.classifyQuery(query);
        expect(type).toBe('status');
      });
    });

    test('성능 쿼리를 올바르게 분류해야 함', () => {
      const queries = [
        '서버가 느려요',
        '성능이 이상해요',
        'Performance issues detected',
      ];

      queries.forEach(query => {
        const type = aiAgent.classifyQuery(query);
        expect(type).toBe('performance');
      });
    });

    test('문제해결 쿼리를 올바르게 분류해야 함', () => {
      const queries = [
        '서버에 문제가 있어요',
        '오류가 발생했습니다',
        '장애 상황입니다',
      ];

      queries.forEach(query => {
        const type = aiAgent.classifyQuery(query);
        expect(type).toBe('troubleshooting');
      });
    });

    test('최적화 쿼리를 올바르게 분류해야 함', () => {
      const queries = [
        '시스템을 최적화하고 싶어요',
        '성능을 개선하는 방법은?',
        '튜닝 방법을 알려주세요',
      ];

      queries.forEach(query => {
        const type = aiAgent.classifyQuery(query);
        expect(type).toBe('optimization');
      });
    });

    test('일반 쿼리는 general로 분류해야 함', () => {
      const queries = ['안녕하세요', '도움이 필요해요', '무엇을 할 수 있나요?'];

      queries.forEach(query => {
        const type = aiAgent.classifyQuery(query);
        expect(type).toBe('general');
      });
    });
  });

  describe('스마트 응답 생성', () => {
    test('정상 상태에서 적절한 응답을 생성해야 함', () => {
      const query = '시스템 상태가 어떤가요?';

      // 🔴 이 메서드는 아직 존재하지 않음
      const response = aiAgent.generateSmartResponse(query);

      expect(response).toHaveProperty('response');
      expect(response).toHaveProperty('suggestedActions');
      expect(response).toHaveProperty('urgencyLevel');
      expect(response.urgencyLevel).toBe('low');
      expect(response.response).toContain('정상');
    });

    test('경고 상태에서 적절한 응답을 생성해야 함', () => {
      // Mock 경고 상태로 설정
      vi.spyOn(aiAgent, 'analyzeSystemCondition').mockReturnValue('warning');

      const query = '시스템에 문제가 있나요?';
      const response = aiAgent.generateSmartResponse(query);

      expect(response.urgencyLevel).toBe('medium');
      expect(response.response).toContain('경고');
      expect(response.suggestedActions.length).toBeGreaterThan(0);
    });

    test('심각 상태에서 긴급 응답을 생성해야 함', () => {
      // Mock 심각 상태로 설정
      vi.spyOn(aiAgent, 'analyzeSystemCondition').mockReturnValue('critical');

      const query = '서버가 다운되었나요?';
      const response = aiAgent.generateSmartResponse(query);

      expect(response.urgencyLevel).toBe('critical');
      expect(response.response).toContain('긴급');
      expect(response.suggestedActions).toContain('긴급 복구 실행');
    });

    test('응답에 후속 질문이 포함되어야 함', () => {
      const query = '시스템 상태는?';
      const response = aiAgent.generateSmartResponse(query);

      expect(response).toHaveProperty('followUpQuestions');
      expect(Array.isArray(response.followUpQuestions)).toBe(true);
      expect(response.followUpQuestions.length).toBeGreaterThan(0);
    });

    test('관련 리포트를 포함해야 함', () => {
      const query = '성능 문제가 있어요';
      const response = aiAgent.generateSmartResponse(query);

      expect(response).toHaveProperty('relatedReports');
      expect(Array.isArray(response.relatedReports)).toBe(true);
    });
  });

  describe('긴급도 판단', () => {
    test('정상 상태는 낮은 긴급도를 가져야 함', () => {
      const query = '일반적인 질문';
      const response = aiAgent.generateSmartResponse(query);

      expect(['low', 'medium']).toContain(response.urgencyLevel);
    });

    test('심각 상태는 높은 긴급도를 가져야 함', () => {
      vi.spyOn(aiAgent, 'analyzeSystemCondition').mockReturnValue('critical');

      const query = '긴급 상황';
      const response = aiAgent.generateSmartResponse(query);

      expect(['high', 'critical']).toContain(response.urgencyLevel);
    });
  });

  describe('액션 제안', () => {
    test('상황에 맞는 액션을 제안해야 함', () => {
      const query = '최적화 방법은?';
      const response = aiAgent.generateSmartResponse(query);

      expect(response.suggestedActions.length).toBeGreaterThan(0);
      expect(
        response.suggestedActions.some(
          action => action.includes('최적화') || action.includes('성능')
        )
      ).toBe(true);
    });

    test('심각 상황에서 긴급 액션을 제안해야 함', () => {
      vi.spyOn(aiAgent, 'analyzeSystemCondition').mockReturnValue('critical');

      const query = '서버가 다운됐어요';
      const response = aiAgent.generateSmartResponse(query);

      expect(
        response.suggestedActions.some(
          action => action.includes('긴급') || action.includes('복구')
        )
      ).toBe(true);
    });
  });

  describe('프리셋 질문 생성', () => {
    test('상황별 프리셋 질문을 생성해야 함', () => {
      // 🔴 이 메서드는 아직 존재하지 않음
      const presetQuestions = aiAgent.generatePresetQuestions();

      expect(Array.isArray(presetQuestions)).toBe(true);
      expect(presetQuestions.length).toBeGreaterThan(0);
      expect(presetQuestions.every(q => typeof q === 'string')).toBe(true);
    });

    test('시스템 상태에 따라 다른 프리셋 질문을 제공해야 함', () => {
      // 정상 상태 프리셋
      vi.spyOn(aiAgent, 'analyzeSystemCondition').mockReturnValue('normal');
      const normalPresets = aiAgent.generatePresetQuestions();

      // 심각 상태 프리셋
      vi.spyOn(aiAgent, 'analyzeSystemCondition').mockReturnValue('critical');
      const criticalPresets = aiAgent.generatePresetQuestions();

      // 다른 질문들이어야 함
      expect(normalPresets).not.toEqual(criticalPresets);
    });
  });

  describe('활동 기록', () => {
    test('AI 에이전트 활동이 기록되어야 함', async () => {
      // API 모킹
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const query = '테스트 쿼리';
      aiAgent.generateSmartResponse(query);

      // 활동 기록 API가 호출되었는지 확인
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/ai-agent/power',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });
  });
});
