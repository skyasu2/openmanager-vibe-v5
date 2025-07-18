/**
 * 🧪 SimplifiedQueryEngine 기본 동작 테스트
 * 간단한 통합 테스트로 기본 기능 검증
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { SimplifiedQueryEngine } from '@/services/ai/SimplifiedQueryEngine';
import type { ServerInstance } from '@/types/data-generator';

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
      network: { in: 100, out: 200 },
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
      network: { in: 50, out: 30 },
      location: 'Seoul',
      uptime: 98.5,
      lastUpdated: new Date(),
    },
  ];

  beforeAll(async () => {
    engine = new SimplifiedQueryEngine();
    // 초기화는 스킵 (Supabase 연결 필요)
    // await engine.initialize();
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

    expect(response.success).toBe(false);
    expect(response.error).toContain('질의가 비어있습니다');
  });

  it('CPU 관련 질의를 처리해야 함', async () => {
    const response = await engine.query({
      query: 'CPU 사용률이 높은 서버는?',
      mode: 'local',
      context: { servers: mockServers },
    });

    expect(response.success).toBe(true);
    expect(response.answer).toBeDefined();
    expect(response.answer.length).toBeGreaterThan(0);
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
    expect(response.answer).toContain('정상');
    expect(response.answer).toContain('주의');
    expect(response.thinkingSteps.some(s => s.step.includes('데이터'))).toBe(true);
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
    response.thinkingSteps.forEach(step => {
      expect(step.step).toBeDefined();
      expect(step.status).toMatch(/thinking|processing|completed|error/);
    });

    // 모든 단계가 완료되어야 함
    const allCompleted = response.thinkingSteps.every(s => s.status === 'completed');
    expect(allCompleted).toBe(true);
  });
});