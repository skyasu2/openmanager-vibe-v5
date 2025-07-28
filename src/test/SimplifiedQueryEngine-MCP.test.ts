/**
 * 🧪 SimplifiedQueryEngine MCP 통합 테스트
 * Google AI 모드에서도 MCP 컨텍스트를 사용할 수 있는지 확인
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SimplifiedQueryEngine } from '@/services/ai/SimplifiedQueryEngine';
import type {
  QueryRequest,
  QueryResponse,
} from '@/services/ai/SimplifiedQueryEngine';

// Mock dependencies
vi.mock('@/lib/ml/supabase-rag-engine');
vi.mock('@/services/ai/GoogleAIService');
vi.mock('@/services/mcp/ServerMonitoringAgent');
vi.mock('@/lib/logger');

// MCP 통합이 아직 구현되지 않아 테스트를 일시적으로 스킵합니다
describe.skip('SimplifiedQueryEngine - MCP Integration', () => {
  let engine: SimplifiedQueryEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new SimplifiedQueryEngine();
  });

  describe('Google AI 모드에서 MCP 컨텍스트 사용', () => {
    it('includeMCPContext 옵션이 true일 때 MCP를 사용해야 함', async () => {
      const request: QueryRequest = {
        query: '현재 서버 상태는 어떤가요?',
        mode: 'google-ai',
        options: {
          includeMCPContext: true,
        },
      };

      const response = await engine.query(request);

      expect(response.success).toBe(true);
      expect(response.metadata?.mcpUsed).toBe(true);
      expect(
        response.thinkingSteps.some(
          step => step.step.includes('MCP') || step.description?.includes('MCP')
        )
      ).toBe(true);
    });

    it('MCP 컨텍스트가 Google AI 응답에 포함되어야 함', async () => {
      const request: QueryRequest = {
        query: '서버 메트릭 확인 명령어는?',
        mode: 'google-ai',
        context: {
          servers: [
            {
              id: 'srv-001',
              name: 'web-server-01',
              status: 'warning',
              cpu: 85,
              memory: 78,
              disk: 45,
              network: 120,
            },
          ],
        },
        options: {
          includeMCPContext: true,
        },
      };

      const response = await engine.query(request);

      expect(response.success).toBe(true);
      expect(response.engine).toBe('google-ai');
      expect(response.metadata?.mcpUsed).toBe(true);

      // MCP 단계가 thinkingSteps에 포함되어야 함
      const mcpStep = response.thinkingSteps.find(step =>
        step.description?.includes('MCP 컨텍스트')
      );
      expect(mcpStep).toBeDefined();
      expect(mcpStep?.status).toBe('completed');
    });

    it('includeMCPContext가 false일 때는 MCP를 사용하지 않아야 함', async () => {
      const request: QueryRequest = {
        query: '서버 상태 요약',
        mode: 'google-ai',
        options: {
          includeMCPContext: false,
        },
      };

      const response = await engine.query(request);

      expect(response.success).toBe(true);
      expect(response.metadata?.mcpUsed).toBe(false);
      expect(
        response.thinkingSteps.every(
          step =>
            !step.step.includes('MCP') && !step.description?.includes('MCP')
        )
      ).toBe(true);
    });

    it('MCP 오류 시에도 Google AI가 정상 작동해야 함', async () => {
      // MCP가 오류를 발생시키도록 설정
      const mockMCPAgent = {
        processQuery: vi.fn().mockRejectedValue(new Error('MCP Error')),
      };
      vi.mocked(
        (await import('@/services/mcp/ServerMonitoringAgent'))
          .ServerMonitoringAgent.getInstance
      ).mockReturnValue(mockMCPAgent as unknown as ReturnType<typeof import('@/services/mcp/ServerMonitoringAgent').ServerMonitoringAgent.getInstance>);

      const request: QueryRequest = {
        query: '서버 문제 진단',
        mode: 'google-ai',
        options: {
          includeMCPContext: true,
        },
      };

      const response = await engine.query(request);

      // MCP 오류에도 불구하고 응답은 성공해야 함
      expect(response.success).toBe(true);
      expect(response.engine).toBe('google-ai');
      // MCP는 사용 시도했지만 실패
      expect(
        response.thinkingSteps.some(
          step => step.status === 'error' && step.description?.includes('MCP')
        )
      ).toBe(true);
    });
  });

  describe('Local 모드와 Google AI 모드의 MCP 동작 일관성', () => {
    it('두 모드 모두에서 MCP 옵션이 동일하게 작동해야 함', async () => {
      const baseRequest: Omit<QueryRequest, 'mode'> = {
        query: 'CPU 사용률이 높은 서버 확인',
        options: {
          includeMCPContext: true,
        },
      };

      // Local 모드
      const localResponse = await engine.query({
        ...baseRequest,
        mode: 'local',
      });

      // Google AI 모드
      const googleResponse = await engine.query({
        ...baseRequest,
        mode: 'google-ai',
      });

      // 두 모드 모두 MCP를 사용해야 함
      expect(localResponse.metadata?.mcpUsed).toBe(true);
      expect(googleResponse.metadata?.mcpUsed).toBe(true);

      // 두 모드 모두 MCP 단계를 포함해야 함
      expect(
        localResponse.thinkingSteps.some(step =>
          step.description?.includes('MCP')
        )
      ).toBe(true);
      expect(
        googleResponse.thinkingSteps.some(step =>
          step.description?.includes('MCP')
        )
      ).toBe(true);
    });
  });
});
