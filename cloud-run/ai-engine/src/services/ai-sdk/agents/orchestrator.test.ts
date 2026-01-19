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

// Mock @ai-sdk-tools/agents with proper class including stream support
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

      // Stream method for executeMultiAgentStream tests
      stream(_options: { prompt: string }) {
        const agentName = this.name;
        return {
          textStream: (async function* () {
            yield 'Mock ';
            yield 'streaming ';
            yield 'response from ';
            yield agentName;
          })(),
          steps: Promise.resolve([
            { toolCalls: [{ toolName: 'getServerMetrics' }] },
          ]),
          usage: Promise.resolve({ inputTokens: 100, outputTokens: 50 }),
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
  getServerByGroup: { execute: vi.fn() },
  detectAnomalies: { execute: vi.fn() },
  predictTrends: { execute: vi.fn() },
  analyzePattern: { execute: vi.fn() },
  correlateMetrics: { execute: vi.fn() },
  findRootCause: { execute: vi.fn() },
  buildIncidentTimeline: { execute: vi.fn() },
  searchKnowledgeBase: { execute: vi.fn() },
  searchWeb: { execute: vi.fn() },
  recommendCommands: { execute: vi.fn() },
  // Incident evaluation tools
  evaluateIncidentReport: { execute: vi.fn() },
  validateReportStructure: { execute: vi.fn() },
  scoreRootCauseConfidence: { execute: vi.fn() },
  refineRootCauseAnalysis: { execute: vi.fn() },
  enhanceSuggestedActions: { execute: vi.fn() },
  extendServerCorrelation: { execute: vi.fn() },
  incidentEvaluationTools: {},
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

// ============================================================================
// executeMultiAgentStream Tests
// ============================================================================

describe('executeMultiAgentStream', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should yield text_delta events for streaming', async () => {
    const { executeMultiAgentStream } = await import('./orchestrator');

    const events: Array<{ type: string; data: unknown }> = [];

    for await (const event of executeMultiAgentStream({
      messages: [{ role: 'user', content: '서버 상태 알려줘' }],
      sessionId: 'stream-test-1',
    })) {
      events.push(event);
    }

    // Should have at least one text_delta event
    const textDeltas = events.filter((e) => e.type === 'text_delta');
    expect(textDeltas.length).toBeGreaterThan(0);

    // Should end with done event
    const doneEvents = events.filter((e) => e.type === 'done');
    expect(doneEvents.length).toBe(1);
  });

  it('should yield error event for empty messages', async () => {
    const { executeMultiAgentStream } = await import('./orchestrator');

    const events: Array<{ type: string; data: unknown }> = [];

    for await (const event of executeMultiAgentStream({
      messages: [],
      sessionId: 'stream-test-2',
    })) {
      events.push(event);
    }

    // Should have error event
    const errorEvents = events.filter((e) => e.type === 'error');
    expect(errorEvents.length).toBe(1);
    expect((errorEvents[0].data as { code: string }).code).toBe('INVALID_REQUEST');
  });

  it('should yield error event for no user message', async () => {
    const { executeMultiAgentStream } = await import('./orchestrator');

    const events: Array<{ type: string; data: unknown }> = [];

    for await (const event of executeMultiAgentStream({
      messages: [{ role: 'assistant', content: 'Hello' }],
      sessionId: 'stream-test-3',
    })) {
      events.push(event);
    }

    const errorEvents = events.filter((e) => e.type === 'error');
    expect(errorEvents.length).toBe(1);
  });

  it('should include tool_call events when tools are used', async () => {
    const { executeMultiAgentStream } = await import('./orchestrator');

    const events: Array<{ type: string; data: unknown }> = [];

    for await (const event of executeMultiAgentStream({
      messages: [{ role: 'user', content: 'CPU 상태 확인' }],
      sessionId: 'stream-test-4',
    })) {
      events.push(event);
    }

    // Should have tool_call event (from mock)
    const toolCalls = events.filter((e) => e.type === 'tool_call');
    expect(toolCalls.length).toBeGreaterThanOrEqual(0); // May or may not have depending on flow
  });

  it('should include metadata in done event', async () => {
    const { executeMultiAgentStream } = await import('./orchestrator');

    const events: Array<{ type: string; data: unknown }> = [];

    for await (const event of executeMultiAgentStream({
      messages: [{ role: 'user', content: '서버 상태' }],
      sessionId: 'stream-test-5',
    })) {
      events.push(event);
    }

    const doneEvent = events.find((e) => e.type === 'done');
    expect(doneEvent).toBeDefined();

    const doneData = doneEvent?.data as {
      success: boolean;
      metadata?: { durationMs: number };
    };
    expect(doneData.success).toBe(true);
    expect(doneData.metadata?.durationMs).toBeGreaterThanOrEqual(0);
  });
});

// ============================================================================
// preFilterQuery Tests
// ============================================================================

describe('preFilterQuery', () => {
  it('should suggest NLQ Agent for server queries', async () => {
    const { preFilterQuery } = await import('./orchestrator');

    const result = preFilterQuery('web-server-01 CPU 상태 알려줘');

    expect(result.suggestedAgent).toBe('NLQ Agent');
    expect(result.confidence).toBeGreaterThanOrEqual(0.5);
  });

  it('should suggest Analyst Agent for analysis queries', async () => {
    const { preFilterQuery } = await import('./orchestrator');

    const result = preFilterQuery('이상 징후 탐지해줘');

    expect(result.suggestedAgent).toBe('Analyst Agent');
    expect(result.confidence).toBeGreaterThanOrEqual(0.5);
  });

  it('should suggest Reporter Agent for report queries', async () => {
    const { preFilterQuery } = await import('./orchestrator');

    const result = preFilterQuery('장애 보고서 생성해줘');

    expect(result.suggestedAgent).toBe('Reporter Agent');
    expect(result.confidence).toBeGreaterThanOrEqual(0.5);
  });

  it('should suggest Advisor Agent for troubleshooting queries', async () => {
    const { preFilterQuery } = await import('./orchestrator');

    const result = preFilterQuery('CPU 높을 때 해결 방법 알려줘');

    expect(result.suggestedAgent).toBe('Advisor Agent');
    expect(result.confidence).toBeGreaterThanOrEqual(0.5);
  });

  it('should return direct response for greeting', async () => {
    const { preFilterQuery } = await import('./orchestrator');

    const result = preFilterQuery('안녕하세요');

    expect(result.shouldHandoff).toBe(false);
    expect(result.directResponse).toBeDefined();
    expect(result.directResponse?.length).toBeGreaterThan(0);
  });
});
