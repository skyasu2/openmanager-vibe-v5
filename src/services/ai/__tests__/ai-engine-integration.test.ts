/**
 * 🧪 SimplifiedQueryEngine 기본 동작 테스트
 * 간단한 통합 테스트로 기본 기능 검증
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';
import { SimplifiedQueryEngine } from '@/services/ai/SimplifiedQueryEngine';
import type { ServerInstance } from '@/types/data-generator';

// Mock dependencies
vi.mock('@/lib/ml/supabase-rag-engine', () => ({
  SupabaseRAGEngine: class {
    async searchSimilar() {
      return {
        results: [],
        cached: false,
      };
    }
  },
}));

vi.mock('@/services/ai/GoogleAIService', () => ({
  GoogleAIService: class {
    async processQuery() {
      return {
        text: 'Google AI response',
        confidence: 0.9,
      };
    }
  },
  RequestScopedGoogleAIService: class {
    async processQuery() {
      return {
        text: 'Google AI response',
        confidence: 0.9,
      };
    }
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('SimplifiedQueryEngine 기본 동작', () => {
  let engine: SimplifiedQueryEngine;

  const mockServers: ServerInstance[] = [
    {
      id: 'srv-001',
      name: 'web-server-01',
      type: 'web',
      status: 'healthy',
      cpu: 85,
      memory: 70,
      disk: 45,
      network: 0,
      location: 'Seoul',
      uptime: 99.9,
      lastUpdated: new Date(),
    },
    {
      id: 'srv-002',
      name: 'db-server-01',
      type: 'database',
      status: 'warning',
      cpu: 95,
      memory: 88,
      disk: 78,
      network: 0,
      location: 'Seoul',
      uptime: 98.5,
      lastUpdated: new Date(),
    },
  ];

  beforeAll(async () => {
    engine = new SimplifiedQueryEngine();
    // Mocks가 설정되어 있으므로 초기화 스킵
  });

  it('엔진이 생성되어야 함', () => {
    expect(engine).toBeDefined();
    expect(engine).toBeInstanceOf(SimplifiedQueryEngine);
  });

  it('빈 질의에 대해 에러를 반환해야 함', async () => {
    const response = await engine.query({
      query: '',
      mode: 'local',
    });

    expect(response.success).toBe(true);
    expect(response.response).toContain('질의를 입력해 주세요');
  });

  it('CPU 관련 질의를 처리해야 함', async () => {
    const response = await engine.query({
      query: 'CPU 사용률이 높은 서버는?',
      mode: 'local',
      context: { servers: mockServers },
    });

    expect(response.success).toBe(true);
    expect(response.response).toBeDefined();
    expect(response.response.length).toBeGreaterThan(0);
    expect(response.confidence).toBeGreaterThan(0);
    expect(response.thinkingSteps.length).toBeGreaterThan(0);
  });

  it('서버 상태 요약을 생성해야 함', async () => {
    const response = await engine.query({
      query: '전체 서버 상태 요약',
      mode: 'local',
      context: { servers: mockServers },
    });

    expect(response.success).toBe(true);
    expect(response.response).toContain('정상');
    expect(response.response).toContain('주의');
    expect(
      response.thinkingSteps.some(
        (s) => s.step.includes('쿼리') || s.step.includes('RAG')
      )
    ).toBe(true);
  });

  it('생각 과정을 단계별로 기록해야 함', async () => {
    const response = await engine.query({
      query: '메모리가 가장 높은 서버는?',
      mode: 'local',
      context: { servers: mockServers },
    });

    expect(response.thinkingSteps).toBeDefined();
    expect(response.thinkingSteps.length).toBeGreaterThanOrEqual(3);

    // 각 단계가 올바른 속성을 가져야 함
    response.thinkingSteps.forEach((step) => {
      expect(step.step).toBeDefined();
      expect(step.status).toMatch(/thinking|processing|completed|error/);
    });

    // 모든 단계가 완료되어야 함
    const allCompleted = response.thinkingSteps.every(
      (s) => s.status === 'completed'
    );
    expect(allCompleted).toBe(true);
  });
});
