/**
 * 🧪 MCP 컨텍스트 통합 테스트
 * MCP 서버와의 연동 및 컨텍스트 수집 기능 테스트
 */

import { describe, it, expect, beforeAll, vi, afterEach } from 'vitest';
import { ServerMonitoringAgent } from '../ServerMonitoringAgent';
import type { QueryRequest, QueryResponse } from '../ServerMonitoringAgent';

// Mock fetch for MCP server calls
global.fetch = vi.fn();

describe('MCP 컨텍스트 통합', () => {
  let agent: ServerMonitoringAgent;

  // 테스트용 서버 데이터
  const mockServerContext = {
    servers: [
      {
        id: 'srv-001',
        name: 'web-server-01',
        cpu: 75,
        memory: 60,
        status: 'healthy',
      },
      {
        id: 'srv-002',
        name: 'db-server-01',
        cpu: 90,
        memory: 85,
        status: 'warning',
      },
    ],
    totalServers: 2,
    healthyCount: 1,
    warningCount: 1,
  };

  beforeAll(() => {
    agent = new ServerMonitoringAgent();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('MCP 서버 연결', () => {
    it('MCP 서버와 성공적으로 연결되어야 함', async () => {
      // Mock successful MCP connection
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'connected', version: '1.0.0' }),
      } as Response);

      const status = await agent.checkMCPConnection();

      expect(status.connected).toBe(true);
      expect(status.version).toBe('1.0.0');
    });

    it('MCP 서버 연결 실패 시 폴백 모드로 작동해야 함', async () => {
      // Mock failed MCP connection
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Connection refused'));

      const status = await agent.checkMCPConnection();

      expect(status.connected).toBe(false);
      expect(status.fallbackMode).toBe(true);
    });
  });

  describe('컨텍스트 수집', () => {
    it('서버 모니터링 컨텍스트를 수집해야 함', async () => {
      // Mock MCP context response
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          context: mockServerContext,
          timestamp: new Date().toISOString(),
        }),
      } as Response);

      const context = await agent.collectContext();

      expect(context).toBeDefined();
      expect(context.servers).toHaveLength(2);
      expect(context.totalServers).toBe(2);
      expect(context.warningCount).toBe(1);
    });

    it('특정 서버의 상세 컨텍스트를 수집해야 함', async () => {
      // Mock server detail context
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          server: mockServerContext.servers[1],
          metrics: {
            cpu: { current: 90, average: 85, peak: 95 },
            memory: { current: 85, average: 80, peak: 90 },
          },
          logs: [
            {
              timestamp: new Date(),
              level: 'warn',
              message: 'High CPU usage detected',
            },
          ],
        }),
      } as Response);

      const context = await agent.collectServerContext('srv-002');

      expect(context.server.name).toBe('db-server-01');
      expect(context.metrics.cpu.current).toBe(90);
      expect(context.logs).toHaveLength(1);
    });
  });

  describe('질의 처리 with MCP', () => {
    it('MCP 컨텍스트를 활용하여 질의에 응답해야 함', async () => {
      const request: QueryRequest = {
        id: 'q-001',
        query: 'CPU 사용률이 높은 서버는?',
        timestamp: new Date(),
        context: {},
      };

      // Mock MCP enhanced response
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          context: mockServerContext,
          analysis: {
            highCPUServers: ['db-server-01'],
            recommendations: ['CPU 최적화 필요'],
          },
        }),
      } as Response);

      const response = await agent.processQuery(request);

      expect(response.answer).toContain('db-server-01');
      expect(response.answer).toContain('90%');
      expect(response.confidence).toBeGreaterThan(0.8);
      expect(response.metadata.mcpUsed).toBe(true);
    });

    it('MCP 없이도 기본 응답을 생성해야 함', async () => {
      // Mock MCP failure
      vi.mocked(fetch).mockRejectedValueOnce(new Error('MCP unavailable'));

      const request: QueryRequest = {
        id: 'q-002',
        query: '서버 상태 요약',
        timestamp: new Date(),
        context: {},
      };

      const response = await agent.processQuery(request);

      expect(response.answer).toBeDefined();
      expect(response.metadata.mcpUsed).toBe(false);
      expect(response.metadata.fallbackUsed).toBe(true);
    });
  });

  describe('생각 과정 생성', () => {
    it('MCP 컨텍스트 수집 과정을 생각 단계로 표시해야 함', async () => {
      const request: QueryRequest = {
        id: 'q-003',
        query: '메모리 사용량 상위 서버',
        timestamp: new Date(),
      };

      // Mock MCP context collection steps
      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'connected' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ context: mockServerContext }),
        } as Response);

      const response = await agent.processQuery(request);

      const mcpSteps = response.thinkingSteps.filter(
        s => s.title.includes('MCP') || s.description.includes('컨텍스트')
      );

      expect(mcpSteps.length).toBeGreaterThan(0);
      expect(mcpSteps[0].status).toBe('completed');
      expect(mcpSteps[0].duration).toBeGreaterThan(0);
    });
  });

  describe('실시간 업데이트', () => {
    it('MCP를 통해 실시간 서버 상태 업데이트를 받아야 함', async () => {
      // Mock real-time update stream
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            JSON.stringify({
              type: 'update',
              server: 'srv-001',
              cpu: 85,
              timestamp: new Date(),
            })
          );
          controller.close();
        },
      });

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        body: mockStream,
      } as Response);

      const updates: any[] = [];
      await agent.subscribeToUpdates(update => {
        updates.push(update);
      });

      // Wait for stream processing
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(updates).toHaveLength(1);
      expect(updates[0].server).toBe('srv-001');
      expect(updates[0].cpu).toBe(85);
    });
  });

  describe('에러 처리', () => {
    it('MCP 타임아웃 시 적절히 처리해야 함', async () => {
      // Mock timeout
      vi.mocked(fetch).mockImplementationOnce(
        () =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 100)
          )
      );

      const context = await agent.collectContext({ timeout: 50 });

      expect(context).toBeDefined();
      expect(context.error).toContain('Timeout');
      expect(context.fallback).toBe(true);
    });

    it('잘못된 MCP 응답 형식을 처리해야 함', async () => {
      // Mock invalid response
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ invalid: 'response' }),
      } as Response);

      const context = await agent.collectContext();

      expect(context.error).toBeDefined();
      expect(context.error).toContain('Invalid response format');
    });
  });

  describe('캐싱 및 성능', () => {
    it('MCP 컨텍스트를 캐싱해야 함', async () => {
      // First call - fetch from MCP
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ context: mockServerContext }),
      } as Response);

      const context1 = await agent.collectContext();
      expect(context1.cached).toBe(false);

      // Second call - should use cache
      const context2 = await agent.collectContext();
      expect(context2.cached).toBe(true);
      expect(context2).toEqual({ ...context1, cached: true });
    });

    it('캐시 만료 후 새로 수집해야 함', async () => {
      // Clear cache
      agent.clearCache();

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ context: mockServerContext }),
      } as Response);

      const context = await agent.collectContext();
      expect(context.cached).toBe(false);
    });
  });
});
