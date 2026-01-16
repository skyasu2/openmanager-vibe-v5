/**
 * Orchestrator Tests
 *
 * Unit tests for multi-agent orchestration system.
 * Tests mode selection, fallback chains, and response handling.
 *
 * @version 1.0.0
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock model-provider before imports
vi.mock('../model-provider', () => ({
  checkProviderStatus: vi.fn(() => ({
    cerebras: true,
    groq: true,
    mistral: true,
  })),
  getCerebrasModel: vi.fn(() => ({ modelId: 'llama-3.3-70b' })),
  getGroqModel: vi.fn(() => ({ modelId: 'llama-3.3-70b-versatile' })),
  getMistralModel: vi.fn(() => ({ modelId: 'mistral-small-2506' })),
  logProviderStatus: vi.fn(),
}));

// Mock @ai-sdk-tools/agents with proper class
vi.mock('@ai-sdk-tools/agents', () => {
  return {
    Agent: class MockAgent {
      name: string;
      model: unknown;
      instructions: string;
      tools: Record<string, unknown>;
      handoffs: unknown[];
      matchOn: unknown[];
      maxTurns: number;

      constructor(config: {
        name: string;
        model?: unknown;
        instructions?: string;
        tools?: Record<string, unknown>;
        handoffs?: unknown[];
        matchOn?: unknown[];
        maxTurns?: number;
      }) {
        this.name = config.name;
        this.model = config.model;
        this.instructions = config.instructions || '';
        this.tools = config.tools || {};
        this.handoffs = config.handoffs || [];
        this.matchOn = config.matchOn || [];
        this.maxTurns = config.maxTurns || 10;
      }

      async generate(_options: { prompt: string }) {
        return {
          text: 'Mock response from ' + this.name,
          handoffs: [],
          steps: [],
          usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
          finalAgent: this.name,
        };
      }
    },
  };
});

// Mock tools
vi.mock('../../../tools-ai-sdk', () => ({
  getServerMetrics: { execute: vi.fn() },
  getServerMetricsAdvanced: { execute: vi.fn() },
  filterServers: { execute: vi.fn() },
  detectAnomalies: { execute: vi.fn() },
  predictTrends: { execute: vi.fn() },
  analyzePattern: { execute: vi.fn() },
  correlateMetrics: { execute: vi.fn() },
  findRootCause: { execute: vi.fn() },
  buildIncidentTimeline: { execute: vi.fn() },
  searchKnowledgeBase: { execute: vi.fn() },
  searchWeb: { execute: vi.fn() },
  recommendCommands: { execute: vi.fn() },
}));

// ============================================================================
// Tests
// ============================================================================

describe('Multi-Agent Orchestrator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Agent Configuration', () => {
    it('should have all required agents defined', async () => {
      const { nlqAgent } = await import('./nlq-agent');
      const { analystAgent } = await import('./analyst-agent');
      const { reporterAgent } = await import('./reporter-agent');
      const { advisorAgent } = await import('./advisor-agent');

      expect(nlqAgent).toBeDefined();
      expect(nlqAgent.name).toBe('NLQ Agent');

      expect(analystAgent).toBeDefined();
      expect(analystAgent.name).toBe('Analyst Agent');

      expect(reporterAgent).toBeDefined();
      expect(reporterAgent.name).toBe('Reporter Agent');

      expect(advisorAgent).toBeDefined();
      expect(advisorAgent.name).toBe('Advisor Agent');
    });

    it('should have orchestrator with correct name', async () => {
      const { orchestrator } = await import('./orchestrator');

      expect(orchestrator).toBeDefined();
      expect(orchestrator.name).toBe('OpenManager Orchestrator');
    });

    it('should have orchestrator with handoffs configured', async () => {
      const { orchestrator } = await import('./orchestrator');

      expect(orchestrator.handoffs).toBeDefined();
      expect(orchestrator.handoffs.length).toBe(4); // NLQ, Analyst, Reporter, Advisor
    });
  });

  describe('executeMultiAgent', () => {
    it('should execute and return successful response', async () => {
      const { executeMultiAgent } = await import('./orchestrator');

      const result = await executeMultiAgent({
        messages: [{ role: 'user', content: '서버 상태 알려줘' }],
        sessionId: 'test-session-1',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.response).toContain('Mock response');
        expect(result.metadata).toBeDefined();
        expect(result.metadata.provider).toBeDefined();
        expect(result.metadata.durationMs).toBeGreaterThanOrEqual(0);
      }
    });

    it('should return error for empty messages', async () => {
      const { executeMultiAgent } = await import('./orchestrator');

      const result = await executeMultiAgent({
        messages: [],
        sessionId: 'test-session-2',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe('INVALID_REQUEST');
        expect(result.error).toBe('No user message found');
      }
    });

    it('should return error for no user message', async () => {
      const { executeMultiAgent } = await import('./orchestrator');

      const result = await executeMultiAgent({
        messages: [{ role: 'assistant', content: 'Hello' }],
        sessionId: 'test-session-3',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe('INVALID_REQUEST');
      }
    });

    it('should track usage metrics', async () => {
      const { executeMultiAgent } = await import('./orchestrator');

      const result = await executeMultiAgent({
        messages: [{ role: 'user', content: 'CPU 상태 확인' }],
        sessionId: 'test-session-4',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.usage).toBeDefined();
        expect(result.usage.promptTokens).toBeGreaterThanOrEqual(0);
        expect(result.usage.completionTokens).toBeGreaterThanOrEqual(0);
        expect(result.usage.totalTokens).toBeGreaterThanOrEqual(0);
      }
    });
  });
});

describe('Agent Model Selection', () => {
  it('NLQ agent should have model configured', async () => {
    const { nlqAgent } = await import('./nlq-agent');
    expect(nlqAgent.model).toBeDefined();
  });

  it('Analyst agent should have model configured', async () => {
    const { analystAgent } = await import('./analyst-agent');
    expect(analystAgent.model).toBeDefined();
  });

  it('Reporter agent should have model configured', async () => {
    const { reporterAgent } = await import('./reporter-agent');
    expect(reporterAgent.model).toBeDefined();
  });

  it('Advisor agent should have model configured', async () => {
    const { advisorAgent } = await import('./advisor-agent');
    expect(advisorAgent.model).toBeDefined();
  });
});

describe('Agent Tools Configuration', () => {
  it('NLQ agent should have server metric tools', async () => {
    const { nlqAgent } = await import('./nlq-agent');
    expect(nlqAgent.tools).toBeDefined();
    expect(Object.keys(nlqAgent.tools).length).toBeGreaterThan(0);
  });

  it('Analyst agent should have analysis tools', async () => {
    const { analystAgent } = await import('./analyst-agent');
    expect(analystAgent.tools).toBeDefined();
    expect(Object.keys(analystAgent.tools).length).toBeGreaterThan(0);
  });

  it('Reporter agent should have reporting tools', async () => {
    const { reporterAgent } = await import('./reporter-agent');
    expect(reporterAgent.tools).toBeDefined();
    expect(Object.keys(reporterAgent.tools).length).toBeGreaterThan(0);
  });

  it('Advisor agent should have knowledge tools', async () => {
    const { advisorAgent } = await import('./advisor-agent');
    expect(advisorAgent.tools).toBeDefined();
    expect(Object.keys(advisorAgent.tools).length).toBeGreaterThan(0);
  });
});

describe('Agent Pattern Matching', () => {
  it('NLQ agent should have matchOn patterns for server queries', async () => {
    const { nlqAgent } = await import('./nlq-agent');
    expect(nlqAgent.matchOn).toBeDefined();
    expect(nlqAgent.matchOn.length).toBeGreaterThan(0);
    expect(nlqAgent.matchOn).toContain('서버');
    expect(nlqAgent.matchOn).toContain('cpu');
  });

  it('Analyst agent should have matchOn patterns for analysis', async () => {
    const { analystAgent } = await import('./analyst-agent');
    expect(analystAgent.matchOn).toBeDefined();
    expect(analystAgent.matchOn).toContain('이상');
    expect(analystAgent.matchOn).toContain('예측');
  });

  it('Reporter agent should have matchOn patterns for reports', async () => {
    const { reporterAgent } = await import('./reporter-agent');
    expect(reporterAgent.matchOn).toBeDefined();
    expect(reporterAgent.matchOn).toContain('보고서');
    expect(reporterAgent.matchOn).toContain('장애');
  });

  it('Advisor agent should have matchOn patterns for troubleshooting', async () => {
    const { advisorAgent } = await import('./advisor-agent');
    expect(advisorAgent.matchOn).toBeDefined();
    expect(advisorAgent.matchOn).toContain('해결');
    expect(advisorAgent.matchOn).toContain('명령어');
  });
});
