/**
 * LangGraph Supervisor Agent Tests
 * 라우팅 로직 및 상태 전환 테스트
 */

import { describe, expect, it } from 'vitest';
import { routeFromSupervisor } from '../agents/supervisor';
import type { AgentStateType } from '../state-definition';

// ============================================================================
// Helper: 기본 상태 생성
// ============================================================================

function createMockState(
  overrides: Partial<AgentStateType> = {}
): AgentStateType {
  return {
    messages: [],
    targetAgent: null,
    routerDecision: null,
    metricsData: null,
    analysisResult: null,
    reportResult: null,
    finalResponse: null,
    error: null,
    iteration: 0,
    taskType: 'general',
    currentAgent: null,
    ...overrides,
  };
}

// ============================================================================
// 1. routeFromSupervisor 테스트
// ============================================================================

describe('routeFromSupervisor', () => {
  describe('finalResponse가 있을 때', () => {
    it('__end__를 반환해야 함', () => {
      const state = createMockState({
        finalResponse: '안녕하세요!',
      });

      expect(routeFromSupervisor(state)).toBe('__end__');
    });
  });

  describe('taskType이 parallel_analysis일 때', () => {
    it('parallel_analysis를 반환해야 함', () => {
      const state = createMockState({
        taskType: 'parallel_analysis',
      });

      expect(routeFromSupervisor(state)).toBe('parallel_analysis');
    });
  });

  describe('targetAgent 라우팅', () => {
    it('nlq → nlq_agent', () => {
      const state = createMockState({ targetAgent: 'nlq' });
      expect(routeFromSupervisor(state)).toBe('nlq_agent');
    });

    it('analyst → analyst_agent', () => {
      const state = createMockState({ targetAgent: 'analyst' });
      expect(routeFromSupervisor(state)).toBe('analyst_agent');
    });

    it('reporter → reporter_agent', () => {
      const state = createMockState({ targetAgent: 'reporter' });
      expect(routeFromSupervisor(state)).toBe('reporter_agent');
    });

    it('null/undefined → __end__', () => {
      const state = createMockState({ targetAgent: null });
      expect(routeFromSupervisor(state)).toBe('__end__');
    });
  });

  describe('우선순위 테스트', () => {
    it('finalResponse가 targetAgent보다 우선', () => {
      const state = createMockState({
        finalResponse: '완료',
        targetAgent: 'nlq',
      });

      expect(routeFromSupervisor(state)).toBe('__end__');
    });

    it('parallel_analysis가 targetAgent보다 우선', () => {
      const state = createMockState({
        taskType: 'parallel_analysis',
        targetAgent: 'nlq',
      });

      expect(routeFromSupervisor(state)).toBe('parallel_analysis');
    });
  });
});

// ============================================================================
// 2. 상태 전환 시나리오 테스트
// ============================================================================

describe('Agent State Transitions', () => {
  describe('사용자 인사 시나리오', () => {
    it('인사는 직접 응답 후 종료', () => {
      const state = createMockState({
        targetAgent: 'reply',
        finalResponse: '안녕하세요! 서버 관리를 도와드리겠습니다.',
      });

      expect(routeFromSupervisor(state)).toBe('__end__');
    });
  });

  describe('메트릭 조회 시나리오', () => {
    it('CPU 조회 → NLQ Agent', () => {
      const state = createMockState({
        targetAgent: 'nlq',
        taskType: 'monitoring',
      });

      expect(routeFromSupervisor(state)).toBe('nlq_agent');
    });
  });

  describe('장애 분석 시나리오', () => {
    it('서버 장애 분석 → Reporter Agent', () => {
      const state = createMockState({
        targetAgent: 'reporter',
        taskType: 'incident_ops',
      });

      expect(routeFromSupervisor(state)).toBe('reporter_agent');
    });
  });

  describe('패턴 분석 시나리오', () => {
    it('트렌드 분석 → Analyst Agent', () => {
      const state = createMockState({
        targetAgent: 'analyst',
        taskType: 'analysis',
      });

      expect(routeFromSupervisor(state)).toBe('analyst_agent');
    });
  });

  describe('복합 분석 시나리오', () => {
    it('전체 상태 + 트렌드 → Parallel Analysis', () => {
      const state = createMockState({
        taskType: 'parallel_analysis',
        targetAgent: null,
      });

      expect(routeFromSupervisor(state)).toBe('parallel_analysis');
    });
  });
});
