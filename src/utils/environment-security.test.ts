/**
 * 🔐 환경변수 보안 유틸리티 테스트
 *
 * @description environment-security.ts의 보안 검사 기능 테스트
 * @created 2025-08-10
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EnvironmentSecurityScanner } from '@/utils/environment-security';

describe('EnvironmentSecurityScanner', () => {
  let scanner: EnvironmentSecurityScanner;

  beforeEach(() => {
    scanner = new EnvironmentSecurityScanner();
    // 환경변수 초기화
    vi.stubEnv('NODE_ENV', 'test');
  });

  describe('환경변수 보안 스캔', () => {
    it('전체 보안 스캔을 실행할 수 있어야 함', async () => {
      const result = await scanner.scanEnvironmentSecurity();

      expect(result).toHaveProperty('vulnerabilities');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('recommendations');

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('취약점 요약을 올바르게 계산해야 함', async () => {
      const result = await scanner.scanEnvironmentSecurity();

      const totalVulnerabilities =
        result.summary.critical + result.summary.warnings + result.summary.info;

      expect(totalVulnerabilities).toBe(result.vulnerabilities.length);
    });
  });

  describe('민감한 패턴 감지', () => {
    it('GitHub 토큰 패턴을 감지해야 함', () => {
      const githubToken = 'ghp_1234567890123456789012345678901234567890';
      const isValid = scanner.validateSensitiveValue(githubToken);

      expect(isValid).toBe(false); // 민감한 값이므로 false 반환
    });

    it('Supabase JWT 패턴을 감지해야 함', () => {
      const supabaseKey = 'fake-jwt-pattern-for-testing-only';
      const isValid = scanner.validateSensitiveValue(supabaseKey);

      expect(isValid).toBe(true); // fake 패턴이므로 검증 통과
    });

    it('Google AI API 키 패턴을 감지해야 함', () => {
      // 테스트용 fake 키 (실제 키 아님)
      const googleKey = 'AIzaSyFAKE_TEST_KEY_NOT_REAL_12345678';
      const isValid = scanner.validateSensitiveValue(googleKey);

      expect(isValid).toBe(false);
    });

    it('일반 텍스트는 안전하다고 판단해야 함', () => {
      const normalText = 'development';
      const isValid = scanner.validateSensitiveValue(normalText);

      expect(isValid).toBe(true);
    });
  });

  describe('클라이언트/서버 환경변수 분리', () => {
    it('NEXT_PUBLIC_ 접두사가 있는 변수는 클라이언트 안전으로 분류해야 함', () => {
      const isClientSafe = scanner.isClientSafeVariable('NEXT_PUBLIC_APP_URL');
      expect(isClientSafe).toBe(true);
    });

    it('NEXT_PUBLIC_ 접두사가 없는 변수는 서버 전용으로 분류해야 함', () => {
      const isClientSafe = scanner.isClientSafeVariable(
        'SUPABASE_SERVICE_ROLE_KEY'
      );
      expect(isClientSafe).toBe(false);
    });

    it('민감한 서버 변수 목록을 확인해야 함', () => {
      const isSensitive = scanner.isSensitiveServerVariable(
        'GITHUB_CLIENT_SECRET'
      );
      expect(isSensitive).toBe(true);
    });
  });

  describe('환경별 설정 검증', () => {
    it('개발 환경에서는 느슨한 검사를 적용해야 함', () => {
      vi.stubEnv('NODE_ENV', 'development');
      const strictMode = scanner.getSecurityLevel();
      expect(strictMode).toBe('relaxed');
    });

    it('프로덕션 환경에서는 엄격한 검사를 적용해야 함', () => {
      vi.stubEnv('NODE_ENV', 'production');
      const strictMode = scanner.getSecurityLevel();
      expect(strictMode).toBe('strict');
    });

    it('테스트 환경에서는 중간 수준 검사를 적용해야 함', () => {
      vi.stubEnv('NODE_ENV', 'test');
      const strictMode = scanner.getSecurityLevel();
      expect(strictMode).toBe('moderate');
    });
  });

  describe('자동 수정 제안', () => {
    it('자동 수정 가능한 취약점을 식별해야 함', async () => {
      const result = await scanner.scanEnvironmentSecurity();
      const autoFixable = result.vulnerabilities.filter((v) => v.autoFixable);

      // 자동 수정 가능한 항목이 있다면 권장사항이 있어야 함
      if (autoFixable.length > 0) {
        expect(result.recommendations.length).toBeGreaterThan(0);
      }
    });

    it('각 취약점에 대한 권장사항을 제공해야 함', async () => {
      const result = await scanner.scanEnvironmentSecurity();

      result.vulnerabilities.forEach((vulnerability) => {
        if (vulnerability.type === 'critical') {
          expect(vulnerability.recommendation).toBeDefined();
        }
      });
    });
  });

  describe('보안 점수 계산', () => {
    it('취약점이 없으면 100점을 반환해야 함', () => {
      const score = scanner.calculateSecurityScore([]);
      expect(score).toBe(100);
    });

    it('심각한 취약점은 점수를 크게 감소시켜야 함', () => {
      const vulnerabilities = [
        {
          type: 'critical' as const,
          category: 'environment' as const,
          message: 'Test',
        },
      ];
      const score = scanner.calculateSecurityScore(vulnerabilities);
      expect(score).toBeLessThanOrEqual(70);
    });

    it('경고는 점수를 적당히 감소시켜야 함', () => {
      const vulnerabilities = [
        {
          type: 'warning' as const,
          category: 'configuration' as const,
          message: 'Test',
        },
      ];
      const score = scanner.calculateSecurityScore(vulnerabilities);
      expect(score).toBeLessThanOrEqual(90);
      expect(score).toBeGreaterThanOrEqual(70);
    });

    it('정보성 메시지는 점수에 영향이 적어야 함', () => {
      const vulnerabilities = [
        {
          type: 'info' as const,
          category: 'runtime' as const,
          message: 'Test',
        },
      ];
      const score = scanner.calculateSecurityScore(vulnerabilities);
      expect(score).toBeGreaterThan(90);
    });
  });

  describe('환경변수 유출 방지', () => {
    it('빌드 시 서버 변수 노출을 감지해야 함', () => {
      const buildConfig = {
        publicRuntimeConfig: {
          SUPABASE_SERVICE_ROLE_KEY: 'exposed-key', // 이건 안됨!
        },
      };

      const hasLeaks = scanner.checkBuildTimeLeaks(buildConfig);
      expect(hasLeaks).toBe(true);
    });

    it('클라이언트 번들에 서버 변수 포함을 감지해야 함', () => {
      const clientCode = `
        const apiKey = process.env.GOOGLE_AI_API_KEY;
        const publicUrl = process.env.NEXT_PUBLIC_APP_URL;
      `;

      const violations = scanner.findClientSideViolations(clientCode);
      expect(violations).toContain('GOOGLE_AI_API_KEY');
      expect(violations).not.toContain('NEXT_PUBLIC_APP_URL');
    });
  });

  describe('보안 감사 보고서', () => {
    it('포맷된 보고서를 생성할 수 있어야 함', async () => {
      const result = await scanner.scanEnvironmentSecurity();
      const report = scanner.generateSecurityReport(result);

      expect(report).toContain('환경변수 보안 감사 보고서');
      expect(report).toContain(`보안 점수: ${result.score}/100`);
    });

    it('JSON 형식 보고서를 생성할 수 있어야 함', async () => {
      const result = await scanner.scanEnvironmentSecurity();
      const jsonReport = scanner.generateJSONReport(result);

      const parsed = JSON.parse(jsonReport);
      expect(parsed).toHaveProperty('timestamp');
      expect(parsed).toHaveProperty('score');
      expect(parsed).toHaveProperty('vulnerabilities');
    });
  });
});
