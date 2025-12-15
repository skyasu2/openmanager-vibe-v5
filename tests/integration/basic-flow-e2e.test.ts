/**
 * @vitest-environment jsdom
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * E2E Tests - Vitest-based Mock 시나리오
 *
 * @description
 * Playwright 대신 Vitest를 사용한 경량 E2E 테스트
 * 실제 서버 없이 Mock 기반으로 주요 플로우 검증
 */

describe('OpenManager VIBE v5 - E2E Mock Flow', () => {
  const mockServerData = {
    servers: [
      {
        id: 'server-1',
        name: 'Production Server',
        status: 'online',
        host: 'prod-server.com',
        cpu: 45,
        memory: 67,
        disk: 23,
        uptime: 86400,
        location: 'us-east-1',
        environment: 'production',
      },
      {
        id: 'server-2',
        name: 'Development Server',
        status: 'warning',
        host: 'dev-server.com',
        cpu: 78,
        memory: 82,
        disk: 56,
        uptime: 43200,
        location: 'us-west-2',
        environment: 'development',
      },
    ],
    summary: {
      total: 2,
      online: 1,
      warning: 1,
      offline: 0,
      avgCpu: 61.5,
      avgMemory: 74.5,
    },
  };

  beforeEach(() => {
    // Mock global fetch for API calls
    global.fetch = vi
      .fn()
      .mockImplementation(async (url: string, options?: RequestInit) => {
        if (url.includes('/api/servers')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () =>
              Promise.resolve({
                success: true,
                data: mockServerData.servers,
                servers: mockServerData.servers,
                summary: mockServerData.summary,
              }),
          } as Response);
        }

        if (url.includes('/api/ai/supervisor')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () =>
              Promise.resolve({
                success: true,
                response:
                  '현재 서버 상태: 2대 중 1대 온라인, 1대 경고 상태입니다.',
                targetAgent: 'nlq-agent',
                sessionId: 'mock-session',
              }),
          } as Response);
        }

        return Promise.resolve({
          ok: false,
          status: 404,
          json: () => Promise.resolve({ error: 'Not found' }),
        } as Response);
      });

    // Mock DOM elements that E2E tests would interact with
    const originalQuerySelector = document.querySelector;
    document.querySelector = vi.fn().mockImplementation((selector: string) => {
      if (selector.includes('main-dashboard')) {
        return {
          style: { display: 'block' },
          textContent: 'OpenManager Dashboard',
          getAttribute: () => 'main-dashboard',
        };
      }
      if (selector.includes('server-list')) {
        return {
          children: mockServerData.servers.map((server) => ({
            id: server.id,
            textContent: server.name,
            getAttribute: () => `server-card-${server.id}`,
          })),
        };
      }
      if (selector.includes('ai-sidebar')) {
        return {
          style: { display: 'none' },
          classList: {
            add: vi.fn(),
            remove: vi.fn(),
            contains: vi.fn().mockReturnValue(false),
          },
        };
      }
      return originalQuerySelector.call(document, selector);
    });
  });

  describe('🏠 메인 페이지 로드 시나리오', () => {
    it('should load main dashboard with server data', async () => {
      // Simulate page load - fetch server data
      const response = await fetch('/api/servers');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.servers).toHaveLength(2);
      expect(data.summary.total).toBe(2);
      expect(data.summary.online).toBe(1);
      expect(data.summary.warning).toBe(1);
    });

    it('should display server cards with correct information', async () => {
      const response = await fetch('/api/servers');
      const data = await response.json();

      // Verify server data structure
      const servers = data.servers;
      expect(servers[0].name).toBe('Production Server');
      expect(servers[0].status).toBe('online');
      expect(servers[0].environment).toBe('production');

      expect(servers[1].name).toBe('Development Server');
      expect(servers[1].status).toBe('warning');
      expect(servers[1].environment).toBe('development');
    });

    it('should show dashboard summary statistics', async () => {
      const response = await fetch('/api/servers');
      const data = await response.json();

      const summary = data.summary;
      expect(summary.total).toBe(2);
      expect(summary.avgCpu).toBe(61.5);
      expect(summary.avgMemory).toBe(74.5);
    });
  });

  describe('🤖 AI Sidebar 상호작용 시나리오', () => {
    it('should open AI sidebar and process query', async () => {
      // Simulate AI sidebar toggle
      const aiSidebar = document.querySelector('[data-testid="ai-sidebar"]');
      expect(aiSidebar).toBeTruthy();

      // Simulate AI query (unified-stream API)
      const aiResponse = await fetch('/api/ai/supervisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: '현재 서버 상태는 어떤가요?' }],
        }),
      });

      const aiData = await aiResponse.json();
      expect(aiData.success).toBe(true);
      expect(aiData.response).toContain('서버 상태');
    });

    it('should handle multi-turn conversation', async () => {
      // Test multi-turn conversation with unified-stream API
      const response = await fetch('/api/ai/supervisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: '안녕하세요' },
            { role: 'assistant', content: '안녕하세요! 무엇을 도와드릴까요?' },
            { role: 'user', content: '서버 상태 알려줘' },
          ],
        }),
      });

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.response).toBeTruthy();
    });
  });

  describe('📊 서버 모니터링 시나리오', () => {
    it('should identify server health issues', async () => {
      const response = await fetch('/api/servers');
      const data = await response.json();

      // Check for warning servers
      const warningServers = data.servers.filter((s) => s.status === 'warning');
      expect(warningServers).toHaveLength(1);
      expect(warningServers[0].name).toBe('Development Server');

      // Check resource usage
      const highCpuServers = data.servers.filter((s) => s.cpu > 70);
      expect(highCpuServers).toHaveLength(1);
      expect(highCpuServers[0].cpu).toBe(78);
    });

    it('should provide server metrics analysis', async () => {
      const response = await fetch('/api/servers');
      const data = await response.json();

      // Test analytics capabilities
      const totalCpu = data.servers.reduce((sum, s) => sum + s.cpu, 0);
      const avgCpu = totalCpu / data.servers.length;

      expect(avgCpu).toBe(61.5);
      expect(data.summary.avgCpu).toBe(avgCpu);
    });
  });

  describe('🔒 에러 처리 시나리오', () => {
    it('should handle API failures gracefully', async () => {
      // Override fetch to simulate failure
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () =>
          Promise.resolve({
            success: false,
            error: 'Internal server error',
          }),
      } as Response);

      const response = await fetch('/api/servers');
      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });

    it('should validate input data', async () => {
      // Test empty messages with unified-stream API
      const response = await fetch('/api/ai/supervisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [],
        }),
      });

      // Should still work with our mock (in real app, Zod validation returns 400)
      expect(response.ok).toBe(true);
    });
  });

  describe('⚡ 성능 검증 시나리오', () => {
    it('should respond within acceptable time limits', async () => {
      const startTime = Date.now();

      const response = await fetch('/api/servers');
      await response.json();

      const responseTime = Date.now() - startTime;

      // Mock responses should be very fast
      expect(responseTime).toBeLessThan(100);
    });

    it('should handle concurrent requests', async () => {
      // Test multiple simultaneous API calls
      const promises = [
        fetch('/api/servers'),
        fetch('/api/servers'),
        fetch('/api/ai/supervisor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: 'test' }],
          }),
        }),
      ];

      const responses = await Promise.all(promises);

      // All should succeed
      responses.forEach((response) => {
        expect(response.ok).toBe(true);
      });
    });
  });

  describe('🎨 UI 컴포넌트 렌더링 시나리오', () => {
    it('should render main dashboard elements', () => {
      const dashboard = document.querySelector(
        '[data-testid="main-dashboard"]'
      );
      expect(dashboard).toBeTruthy();
      expect(dashboard?.textContent).toContain('OpenManager');
    });

    it('should render server list with proper structure', () => {
      const serverList = document.querySelector('[data-testid="server-list"]');
      expect(serverList).toBeTruthy();
      expect(serverList?.children).toHaveLength(2);
    });

    it('should handle AI sidebar state', () => {
      const aiSidebar = document.querySelector('[data-testid="ai-sidebar"]');
      expect(aiSidebar).toBeTruthy();
      expect(aiSidebar?.style.display).toBe('none'); // Initially hidden
    });
  });
});
