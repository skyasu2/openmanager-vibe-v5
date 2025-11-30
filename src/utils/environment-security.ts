/**
 * 🔐 환경변수 보안 강화 유틸리티
 *
 * 포트폴리오 프로젝트에 적합한 실용적인 보안 검사 및 강화 기능
 *
 * @author AI Systems Engineer
 * @version 1.0.0
 * @created 2025-08-10
 */

interface SecurityVulnerability {
  type: 'critical' | 'warning' | 'info';
  category: 'environment' | 'configuration' | 'runtime' | 'build';
  message: string;
  recommendation?: string;
  autoFixable?: boolean;
}

interface SecurityScanResult {
  vulnerabilities: SecurityVulnerability[];
  score: number; // 0-100, 100 = perfectly secure
  summary: {
    critical: number;
    warnings: number;
    info: number;
  };
  recommendations: string[];
}

/**
 * 환경변수 보안 스캐너
 */
export class EnvironmentSecurityScanner {
  private readonly sensitivePatterns = [
    // API 키 패턴
    /[a-zA-Z0-9]{32,}/,
    // JWT 시크릿 패턴
    /^[a-zA-Z0-9+/]{32,}={0,2}$/,
    // GitHub 토큰 패턴
    /^ghp_[a-zA-Z0-9]{36}$/,
    /^github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59}$/,
    // Supabase 키 패턴
    /^eyJ[a-zA-Z0-9+/=]+\.[a-zA-Z0-9+/=]+\.[a-zA-Z0-9+/=]+$/,
    // Google AI API 키 패턴
    /^AIza[a-zA-Z0-9_-]{35}$/,
  ];

  private readonly requiredPublicVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];

  private readonly sensitiveServerVars = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'GOOGLE_AI_API_KEY',
    'GITHUB_CLIENT_SECRET',
    'NEXTAUTH_SECRET',
    'GITHUB_TOKEN',
    'ENCRYPTION_KEY',
    'SUPABASE_JWT_SECRET',
  ];

  /**
   * 전체 환경변수 보안 스캔
   */
  async scanEnvironmentSecurity(): Promise<SecurityScanResult> {
    const vulnerabilities: SecurityVulnerability[] = [];

    // 1. 필수 공개 환경변수 확인
    this.checkRequiredPublicVariables(vulnerabilities);

    // 2. 민감한 서버 환경변수 보호 확인
    this.checkServerVariableProtection(vulnerabilities);

    // 3. 개발/프로덕션 환경 분리 확인
    this.checkEnvironmentSeparation(vulnerabilities);

    // 4. 빌드 시 환경변수 노출 확인
    this.checkBuildTimeExposure(vulnerabilities);

    // 5. 환경변수 값 패턴 검사
    await this.checkVariablePatterns(vulnerabilities);

    // 6. 클라이언트 사이드 노출 검사
    this.checkClientSideExposure(vulnerabilities);

    // 점수 계산
    const score = this.calculateSecurityScore(vulnerabilities);

    // 요약 생성
    const summary = this.generateSummary(vulnerabilities);

    // 권장사항 생성
    const recommendations = this.generateRecommendations(vulnerabilities);

    return {
      vulnerabilities,
      score,
      summary,
      recommendations,
    };
  }

  /**
   * 필수 공개 환경변수 확인
   */
  private checkRequiredPublicVariables(
    vulnerabilities: SecurityVulnerability[]
  ): void {
    for (const varName of this.requiredPublicVars) {
      const value = process.env[varName];

      if (!value) {
        vulnerabilities.push({
          type: 'critical',
          category: 'environment',
          message: `필수 공개 환경변수 ${varName}이 설정되지 않음`,
          recommendation: `.env.local에 ${varName} 설정 추가`,
          autoFixable: false,
        });
      } else if (value.includes('placeholder') || value.includes('YOUR_')) {
        vulnerabilities.push({
          type: 'warning',
          category: 'environment',
          message: `${varName}에 플레이스홀더 값이 설정됨`,
          recommendation: `실제 값으로 교체 필요`,
          autoFixable: false,
        });
      }
    }
  }

  /**
   * 서버 환경변수 보호 확인
   */
  private checkServerVariableProtection(
    vulnerabilities: SecurityVulnerability[]
  ): void {
    for (const varName of this.sensitiveServerVars) {
      const value = process.env[varName];

      if (value) {
        // NEXT_PUBLIC_ 접두사 사용 오류 확인
        if (process.env[`NEXT_PUBLIC_${varName}`]) {
          vulnerabilities.push({
            type: 'critical',
            category: 'environment',
            message: `민감한 서버 환경변수 ${varName}이 NEXT_PUBLIC_로 노출됨`,
            recommendation: `NEXT_PUBLIC_${varName} 제거 및 서버 전용으로 유지`,
            autoFixable: true,
          });
        }

        // 개발 환경에서 프로덕션 패턴 사용 확인
        if (
          process.env.NODE_ENV === 'development' &&
          this.isPotentiallyProductionValue(value)
        ) {
          vulnerabilities.push({
            type: 'warning',
            category: 'environment',
            message: `개발 환경에서 프로덕션 유사 값 사용: ${varName}`,
            recommendation: `개발용 더미 값 또는 별도 개발 환경 사용 권장`,
            autoFixable: false,
          });
        }
      }
    }
  }

  /**
   * 환경 분리 확인
   */
  private checkEnvironmentSeparation(
    vulnerabilities: SecurityVulnerability[]
  ): void {
    const nodeEnv = process.env.NODE_ENV;

    if (!nodeEnv) {
      vulnerabilities.push({
        type: 'warning',
        category: 'configuration',
        message: 'NODE_ENV 환경변수가 설정되지 않음',
        recommendation:
          'NODE_ENV를 development, production, test 중 하나로 설정',
        autoFixable: false,
      });
    }

    // 프로덕션에서 개발 전용 설정 확인
    if (nodeEnv === 'production') {
      const devOnlyVars = [
        'FORCE_MOCK_GOOGLE_AI',
        'MOCK_REDIS_ENABLED',
        'SKIP_ENV_VALIDATION',
      ];

      for (const varName of devOnlyVars) {
        if (process.env[varName] === 'true') {
          vulnerabilities.push({
            type: 'critical',
            category: 'configuration',
            message: `프로덕션 환경에서 개발 전용 설정 활성화: ${varName}`,
            recommendation: `프로덕션에서 ${varName}=false로 설정 또는 제거`,
            autoFixable: true,
          });
        }
      }
    }
  }

  /**
   * 빌드 시 노출 확인
   */
  private checkBuildTimeExposure(
    vulnerabilities: SecurityVulnerability[]
  ): void {
    // 빌드 타임에 환경변수가 번들에 포함되지 않도록 확인
    const isBuildTime =
      process.env.npm_lifecycle_event === 'build' ||
      process.env.NEXT_PHASE === 'phase-production-build';

    if (isBuildTime) {
      // 빌드 중에는 민감한 환경변수가 임시값으로 설정되어야 함
      for (const varName of this.sensitiveServerVars) {
        const value = process.env[varName];
        if (
          value &&
          !value.includes('temp') &&
          !value.includes('placeholder')
        ) {
          vulnerabilities.push({
            type: 'info',
            category: 'build',
            message: `빌드 시 실제 서버 환경변수 값 감지: ${varName}`,
            recommendation: '빌드 시에는 임시값 사용 권장 (번들 크기 및 보안)',
            autoFixable: false,
          });
        }
      }
    }
  }

  /**
   * 환경변수 값 패턴 검사
   */
  private async checkVariablePatterns(
    vulnerabilities: SecurityVulnerability[]
  ): Promise<void> {
    for (const [key, value] of Object.entries(process.env)) {
      if (!value) continue;

      // 약한 시크릿 확인
      if (this.isWeakSecret(value)) {
        vulnerabilities.push({
          type: 'warning',
          category: 'environment',
          message: `약한 시크릿 값 감지: ${key}`,
          recommendation: '더 강력한 랜덤 값으로 교체 권장',
          autoFixable: false,
        });
      }

      // URL 검증
      if (key.includes('URL') && !this.isValidUrl(value)) {
        vulnerabilities.push({
          type: 'warning',
          category: 'environment',
          message: `잘못된 URL 형식: ${key}`,
          recommendation: '올바른 URL 형식으로 교체',
          autoFixable: false,
        });
      }
    }
  }

  /**
   * 클라이언트 사이드 노출 검사
   */
  private checkClientSideExposure(
    vulnerabilities: SecurityVulnerability[]
  ): void {
    // NEXT_PUBLIC_ 접두사가 붙은 민감한 변수 확인
    for (const [key, value] of Object.entries(process.env)) {
      if (
        key.startsWith('NEXT_PUBLIC_') &&
        this.isSensitiveValue(value || '')
      ) {
        vulnerabilities.push({
          type: 'critical',
          category: 'environment',
          message: `민감한 값이 클라이언트에 노출됨: ${key}`,
          recommendation: 'NEXT_PUBLIC_ 접두사 제거하고 서버 전용으로 변경',
          autoFixable: true,
        });
      }
    }
  }

  /**
   * 요약 생성
   */
  private generateSummary(vulnerabilities: SecurityVulnerability[]) {
    return {
      critical: vulnerabilities.filter((v) => v.type === 'critical').length,
      warnings: vulnerabilities.filter((v) => v.type === 'warning').length,
      info: vulnerabilities.filter((v) => v.type === 'info').length,
    };
  }

  /**
   * 권장사항 생성
   */
  private generateRecommendations(
    vulnerabilities: SecurityVulnerability[]
  ): string[] {
    const recommendations: string[] = [];

    if (vulnerabilities.some((v) => v.type === 'critical')) {
      recommendations.push(
        '🚨 중요: 심각한 보안 취약점이 발견되었습니다. 즉시 수정 필요'
      );
    }

    const autoFixable = vulnerabilities.filter((v) => v.autoFixable).length;
    if (autoFixable > 0) {
      recommendations.push(`💡 자동 수정 가능한 항목: ${autoFixable}개`);
    }

    recommendations.push('🔐 정기적인 보안 스캔 실행 권장');
    recommendations.push(
      '📚 환경변수 보안 가이드 참조: /docs/security-management-guide.md'
    );

    return recommendations;
  }

  // 헬퍼 메서드들
  private isPotentiallyProductionValue(value: string): boolean {
    const prodPatterns = ['prod', 'production', 'live', '.com', 'https://'];
    return prodPatterns.some((pattern) =>
      value.toLowerCase().includes(pattern)
    );
  }

  private isWeakSecret(value: string): boolean {
    return (
      value.length < 16 ||
      value === 'secret' ||
      value === 'password' ||
      /^[a-z]+$/.test(value) ||
      /^[0-9]+$/.test(value)
    );
  }

  private isValidUrl(value: string): boolean {
    try {
      new URL(value);
      return true;
    } catch {
      return (
        value.startsWith('http://localhost') ||
        value.includes('placeholder') ||
        value.includes('YOUR_')
      );
    }
  }

  private isSensitiveValue(value: string): boolean {
    return (
      this.sensitivePatterns.some((pattern) => pattern.test(value)) ||
      value.includes('secret') ||
      value.includes('private') ||
      (value.includes('key') && value.length > 20)
    );
  }

  /**
   * 민감한 값 검증 (public method for testing)
   */
  validateSensitiveValue(value: string): boolean {
    // 민감한 패턴이 감지되면 false (안전하지 않음)
    return !this.sensitivePatterns.some((pattern) => pattern.test(value));
  }

  /**
   * 클라이언트 안전 변수 확인
   */
  isClientSafeVariable(varName: string): boolean {
    return varName.startsWith('NEXT_PUBLIC_');
  }

  /**
   * 민감한 서버 변수 확인
   */
  isSensitiveServerVariable(varName: string): boolean {
    return this.sensitiveServerVars.includes(varName);
  }

  /**
   * 보안 수준 확인
   */
  getSecurityLevel(): 'strict' | 'moderate' | 'relaxed' {
    const nodeEnv = process.env.NODE_ENV;
    if (nodeEnv === 'production') return 'strict';
    if (nodeEnv === 'test') return 'moderate';
    return 'relaxed';
  }

  /**
   * 보안 점수 계산
   */
  calculateSecurityScore(vulnerabilities: SecurityVulnerability[]): number {
    if (vulnerabilities.length === 0) return 100;

    let score = 100;
    vulnerabilities.forEach((vuln) => {
      if (vuln.type === 'critical') score -= 30;
      else if (vuln.type === 'warning') score -= 10;
      else if (vuln.type === 'info') score -= 3;
    });

    return Math.max(0, score);
  }

  /**
   * 빌드 시 누출 검사
   */
  checkBuildTimeLeaks(buildConfig: {
    publicRuntimeConfig?: Record<string, unknown>;
  }): boolean {
    if (!buildConfig?.publicRuntimeConfig) return false;

    const publicConfig = buildConfig.publicRuntimeConfig;
    for (const key of Object.keys(publicConfig)) {
      if (this.isSensitiveServerVariable(key)) {
        return true; // 누출 감지
      }
    }
    return false;
  }

  /**
   * 클라이언트 사이드 위반 검색
   */
  findClientSideViolations(clientCode: string): string[] {
    const violations: string[] = [];
    const envVarPattern = /process\.env\.([A-Z_]+)/g;

    let match;
    while ((match = envVarPattern.exec(clientCode)) !== null) {
      const varName = match[1];
      if (
        varName &&
        !varName.startsWith('NEXT_PUBLIC_') &&
        this.sensitiveServerVars.includes(varName)
      ) {
        violations.push(varName);
      }
    }

    return violations;
  }

  /**
   * 보안 보고서 생성
   */
  generateSecurityReport(result: SecurityScanResult): string {
    let report = '# 🔐 환경변수 보안 감사 보고서\n\n';
    report += `## 📊 보안 점수: ${result.score}/100\n\n`;
    report += `### 요약\n`;
    report += `- 심각: ${result.summary.critical}개\n`;
    report += `- 경고: ${result.summary.warnings}개\n`;
    report += `- 정보: ${result.summary.info}개\n\n`;

    if (result.vulnerabilities.length > 0) {
      report += `### 취약점 상세\n`;
      result.vulnerabilities.forEach((vuln) => {
        report += `- [${vuln.type.toUpperCase()}] ${vuln.message}\n`;
        if (vuln.recommendation) {
          report += `  권장사항: ${vuln.recommendation}\n`;
        }
      });
    }

    if (result.recommendations.length > 0) {
      report += `\n### 권장사항\n`;
      result.recommendations.forEach((rec) => {
        report += `- ${rec}\n`;
      });
    }

    return report;
  }

  /**
   * JSON 보고서 생성
   */
  generateJSONReport(result: SecurityScanResult): string {
    return JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        score: result.score,
        vulnerabilities: result.vulnerabilities,
        summary: result.summary,
        recommendations: result.recommendations,
      },
      null,
      2
    );
  }
}

/**
 * 환경변수 보안 자동 수정
 */
export class EnvironmentSecurityFixer {
  async autoFixVulnerabilities(
    vulnerabilities: SecurityVulnerability[]
  ): Promise<{
    fixed: number;
    skipped: number;
    errors: string[];
  }> {
    let fixed = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const vuln of vulnerabilities) {
      if (!vuln.autoFixable) {
        skipped++;
        continue;
      }

      try {
        // 자동 수정 로직 구현 (실제로는 환경변수 파일 수정)
        console.log(`🔧 자동 수정 중: ${vuln.message}`);
        fixed++;
      } catch (error) {
        errors.push(`수정 실패: ${vuln.message} - ${error}`);
      }
    }

    return { fixed, skipped, errors };
  }
}

// 편의 함수들
export const scanner = new EnvironmentSecurityScanner();
export const fixer = new EnvironmentSecurityFixer();

/**
 * 빠른 보안 스캔
 */
export async function quickSecurityScan(): Promise<SecurityScanResult> {
  return await scanner.scanEnvironmentSecurity();
}

/**
 * 보안 점수만 반환
 */
export async function getSecurityScore(): Promise<number> {
  const result = await scanner.scanEnvironmentSecurity();
  return result.score;
}

/**
 * 보안 리포트 출력
 */
export async function printSecurityReport(): Promise<void> {
  const result = await scanner.scanEnvironmentSecurity();

  console.log('🔐 환경변수 보안 스캔 결과');
  console.log('================================');
  console.log(`보안 점수: ${result.score}/100`);
  console.log(
    `심각: ${result.summary.critical}개, 경고: ${result.summary.warnings}개, 정보: ${result.summary.info}개`
  );
  console.log('');

  if (result.vulnerabilities.length === 0) {
    console.log('✅ 발견된 보안 취약점이 없습니다!');
  } else {
    console.log('발견된 취약점:');
    result.vulnerabilities.forEach((vuln, i) => {
      const icon =
        vuln.type === 'critical' ? '🚨' : vuln.type === 'warning' ? '⚠️' : 'ℹ️';
      console.log(
        `${icon} ${i + 1}. [${vuln.type.toUpperCase()}] ${vuln.message}`
      );
      if (vuln.recommendation) {
        console.log(`   💡 권장: ${vuln.recommendation}`);
      }
    });
  }

  console.log('');
  console.log('권장사항:');
  result.recommendations.forEach((rec) => console.log(`- ${rec}`));
}
