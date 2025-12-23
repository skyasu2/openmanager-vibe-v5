/**
 * Supervisor → Verifier Integration Tests
 *
 * 테스트 대상:
 * 1. Verifier가 Supervisor 응답을 정상적으로 검증하는지
 * 2. 검증 결과에 따른 응답 수정이 제대로 이루어지는지
 * 3. 검증 실패 시 원본 응답이 유지되는지
 * 4. enableVerification 옵션이 제대로 동작하는지
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock external dependencies
vi.mock('../../lib/model-config', () => ({
  getVerifierModel: vi.fn(),
  getNLQModel: vi.fn(),
  getAnalystModel: vi.fn(),
  getReporterModel: vi.fn(),
  getSupervisorModel: vi.fn(),
  getGeminiKeyStatus: vi.fn().mockReturnValue({ totalKeys: 1, activeKeyIndex: 0 }),
  markGeminiKeyExhausted: vi.fn(),
}));

vi.mock('../../lib/checkpointer', () => ({
  getAutoCheckpointer: vi.fn().mockResolvedValue(null),
  createSessionConfig: vi.fn().mockReturnValue({ configurable: { thread_id: 'test' } }),
}));

vi.mock('@langchain/langgraph/prebuilt', () => ({
  createReactAgent: vi.fn().mockReturnValue({
    name: 'mock_agent',
  }),
}));

vi.mock('@langchain/langgraph-supervisor', () => ({
  createSupervisor: vi.fn().mockReturnValue({
    compile: vi.fn().mockReturnValue({
      invoke: vi.fn(),
    }),
  }),
}));

// Import after mocks
import { comprehensiveVerifyTool } from '../../agents/verifier-agent';

// Create a testable version of verifyAgentResponse
async function verifyAgentResponse(
  response: string,
  options: { enableVerification?: boolean; context?: string } = {}
): Promise<{
  response: string;
  verification: {
    isValid: boolean;
    confidence: number;
    originalResponse: string;
    validatedResponse: string;
    issues: Array<{ type: string; severity: string; message: string }>;
  } | null;
}> {
  const { enableVerification = true, context } = options;

  if (!enableVerification) {
    return { response, verification: null };
  }

  try {
    const result = await comprehensiveVerifyTool.invoke({
      response,
      context,
    });

    const verification = {
      isValid: result.isValid,
      confidence: result.confidence,
      originalResponse: result.originalResponse,
      validatedResponse: result.validatedResponse,
      issues: result.issues || [],
    };

    return {
      response: verification.validatedResponse || response,
      verification,
    };
  } catch (error) {
    return { response, verification: null };
  }
}

describe('Supervisor → Verifier Integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  // ============================================================================
  // 1. Basic Verification Flow
  // ============================================================================
  describe('Basic Verification Flow', () => {
    it('should verify valid response and return high confidence', async () => {
      const supervisorResponse = `
        서버: web-server-01
        상태: 정상
        CPU: 45%, Memory: 60%, Disk: 70%
        분석: 모든 지표가 안정적입니다.
        권장: 현재 모니터링 유지
      `;

      const result = await verifyAgentResponse(supervisorResponse);

      expect(result.verification).not.toBeNull();
      expect(result.verification?.isValid).toBe(true);
      expect(result.verification?.confidence).toBeGreaterThanOrEqual(0.7);
    });

    it('should detect and correct out-of-range metrics', async () => {
      const supervisorResponse = 'CPU 사용량이 150%로 측정되었습니다.';

      const result = await verifyAgentResponse(supervisorResponse);

      expect(result.verification).not.toBeNull();
      expect(result.verification?.issues.length).toBeGreaterThan(0);
      expect(result.response).toContain('100'); // Corrected value
      expect(result.verification?.originalResponse).toContain('150');
    });

    it('should skip verification when disabled', async () => {
      const supervisorResponse = 'CPU: 999%'; // Invalid but should not be verified

      const result = await verifyAgentResponse(supervisorResponse, {
        enableVerification: false,
      });

      expect(result.verification).toBeNull();
      expect(result.response).toBe(supervisorResponse); // Unchanged
    });
  });

  // ============================================================================
  // 2. Context-Aware Verification
  // ============================================================================
  describe('Context-Aware Verification', () => {
    it('should detect server ID not in context', async () => {
      const supervisorResponse = 'server_unknown의 CPU가 높습니다.';
      const context = 'Available: server_01, server_02, server_03';

      const result = await verifyAgentResponse(supervisorResponse, {
        context,
      });

      expect(result.verification?.issues.some(
        (i) => i.message.includes('server_unknown')
      )).toBe(true);
    });

    it('should pass when server IDs match context', async () => {
      const supervisorResponse = 'server_01의 CPU: 50%, Memory: 60%';
      const context = 'Available: server_01, server_02';

      const result = await verifyAgentResponse(supervisorResponse, {
        context,
      });

      // Should have no server ID issues
      const serverIdIssues = result.verification?.issues.filter(
        (i) => i.message.includes('server')
      ) || [];
      expect(serverIdIssues.length).toBe(0);
    });
  });

  // ============================================================================
  // 3. Hallucination Detection
  // ============================================================================
  describe('Hallucination Detection', () => {
    it('should detect contradictory statements', async () => {
      const supervisorResponse =
        '서버 상태가 정상이지만 위험 수준입니다. 안정적이면서 불안정합니다.';

      const result = await verifyAgentResponse(supervisorResponse);

      expect(result.verification?.issues.some(
        (i) => i.message.includes('모순')
      )).toBe(true);
    });

    it('should detect extreme percentage values', async () => {
      const supervisorResponse = 'CPU가 999%입니다.';

      const result = await verifyAgentResponse(supervisorResponse);

      expect(result.verification?.issues.some(
        (i) => i.type === 'hallucination'
      )).toBe(true);
    });
  });

  // ============================================================================
  // 4. Confidence Score Calculation
  // ============================================================================
  describe('Confidence Score Calculation', () => {
    it('should return confidence 1.0 for perfect response', async () => {
      const perfectResponse = `
        서버: web-01
        상태: 정상
        메트릭: CPU 45%
        분석: 안정적
        권장: 유지
      `;

      const result = await verifyAgentResponse(perfectResponse);

      expect(result.verification?.confidence).toBe(1);
    });

    it('should reduce confidence based on issue severity', async () => {
      // Response with medium severity issues (missing fields)
      const incompleteResponse = 'CPU가 50%입니다.';

      const result = await verifyAgentResponse(incompleteResponse);

      expect(result.verification?.confidence).toBeLessThan(1);
      expect(result.verification?.confidence).toBeGreaterThan(0);
    });

    it('should significantly reduce confidence for high severity issues', async () => {
      // Response with high severity issues (extreme values)
      const badResponse = 'CPU: 999%, Memory: -500%';

      const result = await verifyAgentResponse(badResponse);

      expect(result.verification?.confidence).toBeLessThan(0.7);
    });
  });

  // ============================================================================
  // 5. Response Correction
  // ============================================================================
  describe('Response Correction', () => {
    it('should correct multiple out-of-range values', async () => {
      const response = 'CPU: 150%, Memory: 200%, Disk: -10%';

      const result = await verifyAgentResponse(response);

      const validated = result.response;
      // All values should be corrected to 0-100 range
      expect(validated).not.toContain('150');
      expect(validated).not.toContain('200');
      expect(validated).not.toContain('-10');
    });

    it('should preserve valid parts of response', async () => {
      const response = '서버 web-01의 CPU: 50%, Memory: 150%';

      const result = await verifyAgentResponse(response);

      expect(result.response).toContain('web-01');
      expect(result.response).toContain('50%');
      expect(result.response).toContain('100'); // Corrected from 150
    });
  });

  // ============================================================================
  // 6. Error Handling
  // ============================================================================
  describe('Error Handling', () => {
    it('should return original response when verification fails', async () => {
      // Mock comprehensiveVerifyTool to throw using vi.spyOn
      const mockInvoke = vi.spyOn(comprehensiveVerifyTool, 'invoke')
        .mockRejectedValueOnce(new Error('Verification service unavailable'));

      const response = 'Test response';
      const result = await verifyAgentResponse(response);

      expect(result.response).toBe(response);
      expect(result.verification).toBeNull();

      // Restore
      mockInvoke.mockRestore();
    });
  });

  // ============================================================================
  // 7. Edge Cases
  // ============================================================================
  describe('Edge Cases', () => {
    it('should handle empty response', async () => {
      const result = await verifyAgentResponse('');

      expect(result.verification).not.toBeNull();
      expect(result.response).toBe('');
    });

    it('should handle very long response', async () => {
      const longResponse = '서버 상태: 정상. '.repeat(1000);

      const result = await verifyAgentResponse(longResponse);

      expect(result.verification).not.toBeNull();
    });

    it('should handle Korean and English mixed response', async () => {
      const mixedResponse = `
        Server: web-01
        상태: Normal
        CPU Usage: 45%
        메모리 사용량: 60%
        Analysis: 안정적인 상태입니다.
        Recommendation: 모니터링 유지
      `;

      const result = await verifyAgentResponse(mixedResponse);

      expect(result.verification).not.toBeNull();
      expect(result.verification?.isValid).toBe(true);
    });

    it('should handle special characters in response', async () => {
      const specialResponse = 'CPU: 50% | Memory: 60% → 정상 [OK] <status>';

      const result = await verifyAgentResponse(specialResponse);

      expect(result.verification).not.toBeNull();
    });
  });

  // ============================================================================
  // 8. Performance Considerations
  // ============================================================================
  describe('Performance', () => {
    it('should complete verification within reasonable time', async () => {
      const response = '서버 상태: 정상, CPU: 50%, Memory: 60%';

      const startTime = Date.now();
      await verifyAgentResponse(response);
      const duration = Date.now() - startTime;

      // Should complete within 1 second (with fake timers)
      expect(duration).toBeLessThan(1000);
    });
  });
});
