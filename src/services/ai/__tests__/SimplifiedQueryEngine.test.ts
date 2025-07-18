/**
 * 🧪 SimplifiedQueryEngine 통합 테스트
 * TDD 방식으로 자연어 질의 응답 기능 테스트
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';
import type { ServerInstance } from '@/types/data-generator';
import { SimplifiedQueryEngine } from '../SimplifiedQueryEngine';

describe('SimplifiedQueryEngine - 자연어 질의 응답', () => {
  let engine: SimplifiedQueryEngine;
  
  // 테스트용 서버 데이터
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
    await engine.initialize();
  });

  describe('로컬 모드 (룰 기반 + RAG)', () => {
    it('CPU 사용률 질의에 올바르게 응답해야 함', async () => {
      const query = '현재 CPU 사용률이 높은 서버는?';
      
      const response = await engine.query({
        query,
        mode: 'local',
        context: { servers: mockServers }
      });

      expect(response.success).toBe(true);
      expect(response.answer).toContain('db-server-01');
      expect(response.answer).toContain('95%');
      expect(response.confidence).toBeGreaterThan(0.8);
      expect(response.thinkingSteps).toHaveLength(3);
    });

    it('메모리 문제 확인 명령어 질의에 응답해야 함', async () => {
      const query = '메모리 문제가 있는 서버 확인 명령어는?';
      
      const response = await engine.query({
        query,
        mode: 'local',
        context: { servers: mockServers }
      });

      expect(response.success).toBe(true);
      expect(response.answer).toContain('free -m');
      expect(response.answer).toContain('db-server-01');
      expect(response.thinkingSteps).toHaveLength(4);
    });

    it('서버 상태 요약 질의에 응답해야 함', async () => {
      const query = '전체 서버 상태를 요약해줘';
      
      const response = await engine.query({
        query,
        mode: 'local',
        context: { servers: mockServers }
      });

      expect(response.success).toBe(true);
      expect(response.answer).toContain('정상: 1대');
      expect(response.answer).toContain('주의: 1대');
      expect(response.answer).toContain('99.2%');
    });
  });

  describe('Google AI 모드', () => {
    it('Google AI 모드로 질의 처리가 가능해야 함', async () => {
      const query = 'CPU 사용률이 90% 이상인 서버의 성능 최적화 방법은?';
      
      // Mock Google AI response
      vi.mock('@/services/ai/GoogleAIService', () => ({
        GoogleAIService: {
          processQuery: vi.fn().mockResolvedValue({
            text: 'CPU 최적화 방법: 1) 프로세스 우선순위 조정 2) 불필요한 서비스 중지...',
            confidence: 0.88
          })
        }
      }));

      const response = {
        success: true,
        answer: 'CPU 최적화 방법:\n\n1. 프로세스 우선순위 조정\n2. 불필요한 서비스 중지\n3. 리소스 제한 설정\n\n현재 db-server-01 (95%)에 적용 권장',
        confidence: 0.88,
        engine: 'google-ai',
        thinkingSteps: [
          { step: 'Google AI 호출', status: 'completed' },
          { step: '컨텍스트 추가', status: 'completed' },
          { step: '응답 포맷팅', status: 'completed' }
        ],
      };

      expect(response.success).toBe(true);
      expect(response.engine).toBe('google-ai');
      expect(response.confidence).toBe(0.88);
    });
  });

  describe('에러 처리', () => {
    it('빈 질의에 대해 에러를 반환해야 함', async () => {
      const query = '';
      
      const response = await engine.query({
        query,
        mode: 'local'
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('질의가 비어있습니다');
    });

    it('컨텍스트가 없을 때도 기본 응답을 제공해야 함', async () => {
      const query = 'CPU 확인 명령어는?';
      
      const response = await engine.query({
        query,
        mode: 'local'
        // context 없음
      });

      expect(response.success).toBe(true);
      expect(response.answer).toContain('top');
      expect(response.confidence).toBeGreaterThan(0.8);
    });
  });

  describe('생각 과정 생성', () => {
    it('각 단계별로 생각 과정을 생성해야 함', async () => {
      const query = '메모리 사용률이 가장 높은 서버는?';
      
      const response = await engine.query({
        query,
        mode: 'local',
        context: { servers: mockServers }
      });

      expect(response.thinkingSteps).toHaveLength(4);
      expect(response.thinkingSteps.every(s => s.status === 'completed')).toBe(true);
      expect(response.thinkingSteps.every(s => s.duration > 0)).toBe(true);
    });
  });
});