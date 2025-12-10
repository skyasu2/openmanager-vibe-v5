import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  recordModelFailure,
  routeQueryEnhanced,
  SmartRoutingEngine,
  smartRoutingEngine,
} from '../../../../src/services/ai/smart-routing-engine';
import type { AIModel } from '../../../../src/types/ai/routing-types';

// Mock dependencies
vi.mock('../../../../src/lib/ai/google-ai-manager', () => ({
  checkGoogleAIRateLimit: vi.fn().mockReturnValue({ allowed: true }),
  getGoogleAIKey: vi.fn().mockReturnValue('mock-google-key'),
}));

vi.mock('../../../../src/lib/ai/groq-ai-manager', () => ({
  checkGroqAIRateLimit: vi.fn().mockReturnValue({ allowed: true }),
  getGroqAIRateLimitStatus: vi.fn().mockReturnValue({
    remainingRPM: 100,
    remainingRPD: 1000,
    requestsLastMinute: 0,
  }),
  isGroqAIAvailable: vi.fn().mockReturnValue(true),
}));

describe('SmartRoutingEngine', () => {
  // Reset singleton state before each test if possible, or just reset mocks
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset internal state of the singleton for isolation if we could,
    // but since it's a singleton, we might need to rely on public methods to reset or just test behavior ensuring no side effects leak too much.
    // For circuit breaker, we can rely on it recovering or being manually reset if we had a reset method.
    // Since we don't have a reset method, we should be careful.
    // However, we can use the `recordSuccess` to heal circuits if needed.
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = SmartRoutingEngine.getInstance();
      const instance2 = SmartRoutingEngine.getInstance();
      expect(instance1).toBe(instance2);
      expect(instance1).toBe(smartRoutingEngine);
    });
  });

  describe('analyzeQuery', () => {
    it('should estimate complexity correctly for simple queries', () => {
      const result = smartRoutingEngine.analyzeQuery('안녕');
      expect(result.complexity).toBe(1);
    });

    it('should estimate complexity correctly for complex queries', () => {
      const result = smartRoutingEngine.analyzeQuery(
        '서버의 CPU 사용량과 메모리 사용량을 분석해서 원인을 알려줘'
      );
      expect(result.complexity).toBeGreaterThanOrEqual(4);
    });

    it('should detect code intent', () => {
      const result = smartRoutingEngine.analyzeQuery(
        '이 기능을 구현하는 파이썬 코드를 작성해줘'
      );
      expect(result.intent).toBe('coding');
    });
  });

  describe('routeQueryEnhanced', () => {
    it('should select Llama 8B for low complexity queries', () => {
      const decision = routeQueryEnhanced('안녕, 반가워');
      expect(decision.primaryModel).toBe('llama-3.1-8b-instant');
      expect(decision.level).toBe(1);
    });

    it('should select Gemini Flash or Pro for high complexity queries with reasoning', () => {
      const decision = routeQueryEnhanced(
        '이 문제의 근본 원인을 추론하고 해결책을 제시해줘',
        { thinkingRequested: true }
      );
      expect(['gemini-2.5-pro', 'qwen-qwq-32b', 'gemini-2.5-flash']).toContain(
        decision.primaryModel
      );
      expect(decision.level).toBe('thinking');
    });

    it('should include reasoning in the decision', () => {
      const decision = routeQueryEnhanced('안녕');
      expect(decision.reasoning.length).toBeGreaterThan(0);
    });
  });

  describe('Circuit Breaker', () => {
    it('should open circuit after failures', () => {
      const model: AIModel = 'llama-3.1-8b-instant';

      // Fail enough times to open circuit (default threshold is usually 5)
      for (let i = 0; i < 10; i++) {
        recordModelFailure(model);
      }

      const health = smartRoutingEngine.getModelHealth(model);
      // Depending on implementation, it might be 'open'
      // Note: ModelHealth returned might be a copy or reference.
      expect(['open', 'half-open']).toContain(
        (health as { circuitState?: string }).circuitState
      );
    });

    // NOTE: Testing actual routing skipping the model requires more setup or guaranteed known state,
    // which is hard with a shared singleton in a single test file run.
    // We will verify the state change is recorded at least.
  });
});
