/**
 * Verifier Agent Unit Tests
 *
 * 테스트 대상:
 * 1. validateMetricRangesTool - 메트릭 범위 검증 (0-100%)
 * 2. checkRequiredFieldsTool - 필수 필드 검증
 * 3. detectHallucinationTool - 환각 탐지
 * 4. comprehensiveVerifyTool - 종합 검증
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  validateMetricRangesTool,
  checkRequiredFieldsTool,
  detectHallucinationTool,
  comprehensiveVerifyTool,
  DEFAULT_VERIFIER_CONFIG,
} from './verifier-agent';
import type { VerificationIssue } from '../lib/state-definition';

// Mock model config
vi.mock('../lib/model-config', () => ({
  getVerifierModel: vi.fn(),
}));

describe('VerifierAgent', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ============================================================================
  // 1. validateMetricRangesTool Tests
  // ============================================================================
  describe('validateMetricRangesTool', () => {
    it('should pass valid metrics in 0-100% range', async () => {
      const response = '서버의 CPU 사용량은 45%이고, 메모리는 72%입니다.';

      const result = await validateMetricRangesTool.invoke({ response });

      expect(result.success).toBe(true);
      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.corrections).toHaveLength(0);
    });

    it('should detect and correct out-of-range metrics', async () => {
      const response = '서버의 CPU 사용량은 150%이고, 메모리는 -20%입니다.';

      const result = await validateMetricRangesTool.invoke({ response });

      expect(result.success).toBe(true);
      expect(result.isValid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.corrections.length).toBeGreaterThan(0);

      // Check that values are corrected
      const cpuIssue = result.issues.find(
        (i: VerificationIssue) => i.field === 'cpu' || i.field === 'percentage'
      );
      expect(cpuIssue).toBeDefined();
    });

    it('should handle extremely out-of-range values with high severity', async () => {
      const response = 'CPU: 999%, Memory: -500%';

      const result = await validateMetricRangesTool.invoke({ response });

      expect(result.isValid).toBe(false);
      const highSeverityIssues = result.issues.filter(
        (i: VerificationIssue) => i.severity === 'high'
      );
      expect(highSeverityIssues.length).toBeGreaterThan(0);
    });

    it('should preserve valid parts of response', async () => {
      const response = 'CPU: 50%, Disk: 120%';

      const result = await validateMetricRangesTool.invoke({ response });

      expect(result.validatedResponse).toContain('50%');
      expect(result.validatedResponse).toContain('100'); // Corrected from 120
    });

    it('should track processing time', async () => {
      const response = 'CPU: 45%';

      const result = await validateMetricRangesTool.invoke({ response });

      expect(result.processingTimeMs).toBeDefined();
      expect(typeof result.processingTimeMs).toBe('number');
    });
  });

  // ============================================================================
  // 2. checkRequiredFieldsTool Tests
  // ============================================================================
  describe('checkRequiredFieldsTool', () => {
    it('should pass when all required fields are present', async () => {
      const response = `
        서버: web-server-01
        상태: 정상
        메트릭: CPU 45%, Memory 60%
        분석: 안정적인 상태입니다.
        권장 조치: 현재 모니터링 유지
      `;

      const result = await checkRequiredFieldsTool.invoke({ response });

      expect(result.success).toBe(true);
      expect(result.isValid).toBe(true);
      expect(result.completenessScore).toBe(1);
      expect(result.missingFields).toHaveLength(0);
    });

    it('should detect missing required fields', async () => {
      const response = '서버 상태가 정상입니다.';

      const result = await checkRequiredFieldsTool.invoke({ response });

      expect(result.isValid).toBe(false);
      expect(result.missingFields.length).toBeGreaterThan(0);
      expect(result.completenessScore).toBeLessThan(1);
    });

    it('should accept Korean field equivalents', async () => {
      const response = `
        호스트: server-01
        현황: 양호
        지표: 정상 범위
        진단: 이상 없음
        대응: 불필요
      `;

      const result = await checkRequiredFieldsTool.invoke({ response });

      expect(result.completenessScore).toBeGreaterThan(0.5);
    });

    it('should accept custom required fields', async () => {
      const response = 'Alert: Warning, Severity: High';
      const customFields = ['alert', 'severity'];

      const result = await checkRequiredFieldsTool.invoke({
        response,
        requiredFields: customFields,
      });

      expect(result.foundFields).toContain('alert');
      expect(result.foundFields).toContain('severity');
      expect(result.isValid).toBe(true);
    });

    it('should calculate correct completeness score', async () => {
      const response = '서버: test, 상태: ok';
      const requiredFields = ['server', 'status', 'metric', 'analysis'];

      const result = await checkRequiredFieldsTool.invoke({
        response,
        requiredFields,
      });

      expect(result.completenessScore).toBe(0.5); // 2 out of 4
    });
  });

  // ============================================================================
  // 3. detectHallucinationTool Tests
  // ============================================================================
  describe('detectHallucinationTool', () => {
    it('should pass clean response with no hallucination', async () => {
      const response = '서버 web-01의 CPU 사용량이 75%로 정상 범위입니다.';

      const result = await detectHallucinationTool.invoke({ response });

      expect(result.success).toBe(true);
      expect(result.isValid).toBe(true);
      expect(result.hallucinationRisk).toBe('low');
    });

    it('should detect extreme percentage values', async () => {
      const response = '서버의 CPU가 999%입니다.';

      const result = await detectHallucinationTool.invoke({ response });

      expect(result.isValid).toBe(false);
      expect(result.issues.some((i: VerificationIssue) => i.type === 'hallucination')).toBe(true);
    });

    it('should detect contradictions', async () => {
      const response =
        '서버 상태가 정상이지만 위험 수준입니다. 증가 추세이면서 감소하고 있습니다.';

      const result = await detectHallucinationTool.invoke({ response });

      expect(result.issueCount).toBeGreaterThan(0);
      expect(result.issues.some((i: VerificationIssue) => i.message.includes('모순'))).toBe(true);
    });

    it('should detect server ID not in context', async () => {
      const response = '서버 server_99가 위험 상태입니다.';
      const context = 'Available servers: server_01, server_02, server_03';

      const result = await detectHallucinationTool.invoke({ response, context });

      expect(result.issues.some((i: VerificationIssue) => i.message.includes('server_99'))).toBe(
        true
      );
    });

    it('should pass when response server IDs match context', async () => {
      const response = 'server_01의 상태는 정상입니다.';
      const context = 'Available servers: server_01, server_02';

      const result = await detectHallucinationTool.invoke({ response, context });

      expect(
        result.issues.filter((i: VerificationIssue) => i.field === 'server_id')
      ).toHaveLength(0);
    });

    it('should detect high repetition patterns', async () => {
      // Create a response with high repetition
      const response =
        'error error error error error warning warning warning warning warning ' +
        'critical critical critical critical critical alert alert alert alert alert';

      const result = await detectHallucinationTool.invoke({ response });

      // Repetition detection triggers
      expect(result.issues.some((i: VerificationIssue) => i.message.includes('반복률'))).toBe(
        true
      );
    });

    it('should return correct risk levels', async () => {
      // Low risk
      const lowRisk = await detectHallucinationTool.invoke({
        response: '서버가 정상입니다.',
      });
      expect(lowRisk.hallucinationRisk).toBe('low');

      // High risk (multiple issues)
      const highRisk = await detectHallucinationTool.invoke({
        response:
          '서버가 999% 사용 중이고 정상이면서 위험하고 증가하면서 감소합니다.',
      });
      expect(['medium', 'high']).toContain(highRisk.hallucinationRisk);
    });
  });

  // ============================================================================
  // 4. comprehensiveVerifyTool Tests
  // ============================================================================
  describe('comprehensiveVerifyTool', () => {
    it('should pass comprehensive verification for valid response', async () => {
      const response = `
        서버: web-server-01
        상태: 정상
        CPU: 45%, Memory: 60%, Disk: 70%
        분석: 모든 지표가 안정적입니다.
        권장: 현재 모니터링 유지
      `;

      const result = await comprehensiveVerifyTool.invoke({ response });

      expect(result.success).toBe(true);
      expect(result.isValid).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(0.7);
      expect(result.metadata.rulesApplied.length).toBeGreaterThan(0);
    });

    it('should calculate confidence based on issues', async () => {
      // Response with issues
      const response = '서버 CPU가 150%입니다.';

      const result = await comprehensiveVerifyTool.invoke({ response });

      expect(result.confidence).toBeLessThan(1);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should apply all rules when using default config', async () => {
      const response = '서버 상태 확인';

      const result = await comprehensiveVerifyTool.invoke({ response });

      expect(result.metadata.rulesApplied).toContain('metric_range_check');
      expect(result.metadata.rulesApplied).toContain('required_fields_check');
      expect(result.metadata.rulesApplied).toContain('hallucination_detection');
    });

    it('should respect custom config', async () => {
      const response = 'CPU: 150%';
      const config = {
        rules: {
          checkMetricRanges: false, // Disable metric check
          checkRequiredFields: true,
          detectHallucination: false,
        },
      };

      const result = await comprehensiveVerifyTool.invoke({ response, config });

      expect(result.metadata.rulesApplied).not.toContain('metric_range_check');
      expect(result.metadata.rulesApplied).toContain('required_fields_check');
    });

    it('should apply corrections to validated response', async () => {
      const response = '서버 CPU: 200%';

      const result = await comprehensiveVerifyTool.invoke({ response });

      expect(result.originalResponse).toContain('200');
      expect(result.validatedResponse).toContain('100'); // Corrected
      expect(result.metadata.corrections.length).toBeGreaterThan(0);
    });

    it('should include processing time in metadata', async () => {
      const response = '테스트 응답';

      const result = await comprehensiveVerifyTool.invoke({ response });

      expect(result.metadata.processingTimeMs).toBeDefined();
      expect(typeof result.metadata.processingTimeMs).toBe('number');
    });

    it('should include verification timestamp', async () => {
      const response = '테스트 응답';

      const result = await comprehensiveVerifyTool.invoke({ response });

      expect(result.metadata.verifiedAt).toBeDefined();
      expect(new Date(result.metadata.verifiedAt).getTime()).toBeLessThanOrEqual(
        Date.now()
      );
    });

    it('should handle context for hallucination detection', async () => {
      const response = 'server_unknown의 CPU가 50%입니다.';
      const context = 'Available: server_01, server_02';

      const result = await comprehensiveVerifyTool.invoke({ response, context });

      expect(
        result.issues.some((i: VerificationIssue) => i.message.includes('server_unknown'))
      ).toBe(true);
    });
  });

  // ============================================================================
  // 5. DEFAULT_VERIFIER_CONFIG Tests
  // ============================================================================
  describe('DEFAULT_VERIFIER_CONFIG', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_VERIFIER_CONFIG.rules.checkMetricRanges).toBe(true);
      expect(DEFAULT_VERIFIER_CONFIG.rules.checkRequiredFields).toBe(true);
      expect(DEFAULT_VERIFIER_CONFIG.rules.checkFormatConsistency).toBe(true);
      expect(DEFAULT_VERIFIER_CONFIG.rules.detectHallucination).toBe(true);

      expect(DEFAULT_VERIFIER_CONFIG.thresholds.minConfidence).toBe(0.7);
      expect(DEFAULT_VERIFIER_CONFIG.thresholds.metricMin).toBe(0);
      expect(DEFAULT_VERIFIER_CONFIG.thresholds.metricMax).toBe(100);
    });
  });
});
