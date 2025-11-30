/**
 * 🤖 test-automation-specialist 서브에이전트 전용 테스트 컨트롤러
 *
 * @description test-automation-specialist가 쉽게 활용할 수 있는 통합 테스트 인터페이스
 * @purpose 서브에이전트의 테스트 실행, 결과 해석, 자동 액션 제안 지원
 * @integration AI 워크플로우 + 기존 테스트 시스템 완전 통합
 */

import { execSync } from 'child_process';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import type {
  AIFriendlyMetric,
  VitalsAnalysisResult,
} from './ai-friendly-vitals';
import { aiVitals } from './ai-friendly-vitals';

// 🎯 서브에이전트용 테스트 결과 타입
export interface SubagentTestResult {
  // 기본 정보
  testId: string;
  timestamp: string;
  duration: number;

  // 실행 결과
  success: boolean;
  exitCode: number;
  command: string;
  profile: TestProfile;

  // 상세 분석
  stats: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    coverage?: number;
  };

  // AI 친화적 메트릭
  vitals: AIFriendlyMetric[];
  analysis: VitalsAnalysisResult;

  // 서브에이전트용 액션 제안
  recommendations: TestRecommendation[];
  nextActions: string[];

  // 에러 정보
  errors: TestError[];
  warnings: string[];
}

export interface TestRecommendation {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'fix' | 'improve' | 'optimize' | 'investigate';
  title: string;
  description: string;
  commands: string[]; // 서브에이전트가 실행할 수 있는 명령어들
  estimatedTime: string;
  confidence: number; // 0-1
}

export interface TestError {
  file: string;
  line?: number;
  message: string;
  stack?: string;
  category: 'syntax' | 'runtime' | 'assertion' | 'timeout' | 'setup';
  severity: 'error' | 'warning' | 'info';
}

export interface TestProfile {
  name: string;
  command: string;
  expectedDuration: string;
  coverage: string;
  description: string;
}

// 🎯 서브에이전트 테스트 프로필 (AI 워크플로우 통합)
const SUBAGENT_TEST_PROFILES: Record<string, TestProfile> = {
  'ultra-fast': {
    name: 'Ultra Fast',
    command: 'npx vitest run --config config/testing/vitest.config.minimal.ts',
    expectedDuration: '3초',
    coverage: '핵심 로직만',
    description: '서브에이전트 빠른 검증용 - 순수 함수 및 유틸리티',
  },
  'smart-fast': {
    name: 'Smart Fast',
    command:
      'npx vitest run --config config/testing/vitest.config.main.ts --reporter=dot',
    expectedDuration: '8초',
    coverage: '주요 컴포넌트',
    description: '서브에이전트 개발 중 검증용 - Mock 기반 핵심 테스트',
  },
  'e2e-critical': {
    name: 'E2E Critical',
    command: 'npm run test:vercel',
    expectedDuration: '45초',
    coverage: '실제 환경',
    description: '서브에이전트 최종 검증용 - Vercel 실제 환경 E2E',
  },
  comprehensive: {
    name: 'Comprehensive',
    command: 'npm run vitals:full-integration',
    expectedDuration: '120초',
    coverage: '전체 시스템',
    description: '서브에이전트 품질 보증용 - Universal Vitals 포함 전체',
  },
  'playwright-visual': {
    name: 'Playwright Visual',
    command: 'npx playwright test --reporter=html',
    expectedDuration: '60초',
    coverage: 'UI/UX 검증',
    description: '서브에이전트 시각적 회귀 테스트용 - 스크린샷 비교',
  },
};

/**
 * 🤖 test-automation-specialist 전용 테스트 컨트롤러
 *
 * 서브에이전트가 쉽게 사용할 수 있는 단순한 인터페이스 제공
 * - 1줄로 테스트 실행 및 결과 분석
 * - 자동 액션 제안
 * - 다음 단계 가이드
 */
export class SubagentTestController {
  private projectRoot: string;
  private logDir: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
    this.logDir = join(projectRoot, 'logs', 'subagent-tests');
    this.ensureLogDirectory();
  }

  // 🚀 원샷 테스트 실행 (서브에이전트 메인 메서드)
  async runSmartTest(context?: {
    priority?: 'fast' | 'thorough' | 'comprehensive';
    focus?: string; // 특정 파일이나 테스트 패턴
    timeout?: number;
  }): Promise<SubagentTestResult> {
    const testId = `subagent-${Date.now()}`;
    const startTime = Date.now();

    try {
      console.log('🤖 [SubagentTestController] 스마트 테스트 시작...\n');

      // 1. 컨텍스트 분석
      const selectedProfile = this.analyzeAndSelectProfile(context);
      console.log(
        `📋 선택된 프로필: ${selectedProfile.name} (${selectedProfile.expectedDuration})`
      );

      // 2. 테스트 실행
      const executionResult = await this.executeTest(selectedProfile, context);

      // 3. 결과 분석
      const analysis = await this.analyzeResults(executionResult);

      // 4. 액션 제안 생성
      const recommendations = this.generateRecommendations(analysis);

      // 5. 다음 단계 가이드
      const nextActions = this.generateNextActions(analysis, recommendations);

      const result: SubagentTestResult = {
        testId,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        success: executionResult.exitCode === 0,
        exitCode: executionResult.exitCode,
        command: selectedProfile.command,
        profile: selectedProfile,
        stats: executionResult.stats,
        vitals: analysis.vitals,
        analysis: analysis.vitalsAnalysis,
        recommendations,
        nextActions,
        errors: executionResult.errors,
        warnings: executionResult.warnings,
      };

      // 6. 로그 저장
      this.saveTestLog(result);

      // 7. 결과 출력
      this.printSubagentSummary(result);

      return result;
    } catch (error) {
      const errorResult: SubagentTestResult = {
        testId,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        success: false,
        exitCode: 1,
        command: 'failed-to-execute',
        profile: this.getProfileOrFallback('ultra-fast'),
        stats: { total: 0, passed: 0, failed: 1, skipped: 0 },
        vitals: [],
        analysis: {
          overallScore: 0,
          overallRating: 'poor',
          categoryBreakdown: {},
          summary: '테스트 실행 실패',
          keyInsights: [
            `실행 오류: ${error instanceof Error ? error.message : String(error)}`,
          ],
        },
        recommendations: [
          {
            id: 'fix-execution-error',
            priority: 'critical',
            category: 'fix',
            title: '테스트 실행 오류 해결',
            description: '테스트를 실행할 수 없습니다.',
            commands: ['npm run test:super-fast'],
            estimatedTime: '5분',
            confidence: 0.9,
          },
        ],
        nextActions: ['환경 설정 확인', '의존성 설치 확인', '테스트 파일 검증'],
        errors: [
          {
            file: 'system',
            message: error instanceof Error ? error.message : String(error),
            category: 'setup',
            severity: 'error',
          },
        ],
        warnings: [],
      };

      this.saveTestLog(errorResult);
      return errorResult;
    }
  }

  // Helper function to ensure we always return a TestProfile
  private getProfileOrFallback(profileKey: string): TestProfile {
    return (
      SUBAGENT_TEST_PROFILES[profileKey] || {
        name: 'Default Fast',
        command: 'npm run test:fast',
        expectedDuration: '8초',
        coverage: '기본',
        description: '기본 빠른 테스트',
      }
    );
  }

  // 🧠 컨텍스트 기반 프로필 선택
  private analyzeAndSelectProfile(context?: {
    priority?: 'fast' | 'thorough' | 'comprehensive';
    focus?: string;
    timeout?: number;
  }): TestProfile {
    // 우선순위 기반 선택
    if (context?.priority === 'fast') {
      return this.getProfileOrFallback('ultra-fast');
    }
    if (context?.priority === 'comprehensive') {
      return this.getProfileOrFallback('comprehensive');
    }

    // 포커스 영역 기반 선택
    if (context?.focus) {
      if (
        context.focus.includes('e2e') ||
        context.focus.includes('playwright')
      ) {
        return this.getProfileOrFallback('playwright-visual');
      }
      if (
        context.focus.includes('api') ||
        context.focus.includes('integration')
      ) {
        return this.getProfileOrFallback('e2e-critical');
      }
    }

    // 타임아웃 기반 선택
    if (context?.timeout && context.timeout < 10000) {
      // 10초 미만
      return this.getProfileOrFallback('ultra-fast');
    }

    // 기본값: 스마트 빠른 테스트
    return this.getProfileOrFallback('smart-fast');
  }

  // ⚡ 테스트 실행
  private async executeTest(
    profile: TestProfile,
    _context?: unknown
  ): Promise<{
    exitCode: number;
    stdout: string;
    stderr: string;
    stats: SubagentTestResult['stats'];
    errors: TestError[];
    warnings: string[];
  }> {
    return new Promise((resolve) => {
      const _startTime = Date.now();
      let stdout = '';
      let stderr = '';

      try {
        // 동기 실행으로 간소화 (서브에이전트용)
        const result = execSync(profile.command, {
          cwd: this.projectRoot,
          encoding: 'utf8',
          timeout: 300000, // 5분 타임아웃
        });

        stdout = result;

        const stats = this.parseTestStats(stdout);
        const errors = this.parseErrors(stdout, stderr);
        const warnings = this.parseWarnings(stdout);

        resolve({
          exitCode: 0,
          stdout,
          stderr,
          stats,
          errors,
          warnings,
        });
      } catch (error: unknown) {
        const execError = error as {
          stderr?: string;
          stdout?: string;
          status?: number;
        };
        stderr = execError.stderr || '';
        stdout = execError.stdout || '';

        const stats = this.parseTestStats(stdout);
        const errors = this.parseErrors(stdout, stderr);
        const warnings = this.parseWarnings(stdout);

        resolve({
          exitCode: execError.status || 1,
          stdout,
          stderr,
          stats,
          errors,
          warnings,
        });
      }
    });
  }

  // 📊 결과 분석
  private async analyzeResults(executionResult: {
    exitCode: number;
    stdout: string;
    stderr: string;
    stats: SubagentTestResult['stats'];
  }): Promise<{
    vitals: AIFriendlyMetric[];
    vitalsAnalysis: VitalsAnalysisResult;
  }> {
    const vitals: AIFriendlyMetric[] = [];

    // 테스트 실행 시간 메트릭
    const testDurationMetric = aiVitals.quickCollect(
      'test-execution-time',
      executionResult.stats.total > 0 ? 1000 : 3000, // 가정값
      'test-execution'
    );
    vitals.push(testDurationMetric);

    // 테스트 성공률 메트릭
    if (executionResult.stats.total > 0) {
      const successRate =
        (executionResult.stats.passed / executionResult.stats.total) * 100;
      const successMetric = aiVitals.quickCollect(
        'test-success-rate',
        successRate,
        'reliability'
      );
      vitals.push(successMetric);
    }

    // 커버리지 메트릭 (있는 경우)
    if (executionResult.stats.coverage) {
      const coverageMetric = aiVitals.quickCollect(
        'test-coverage',
        executionResult.stats.coverage,
        'test-execution'
      );
      vitals.push(coverageMetric);
    }

    const vitalsAnalysis = aiVitals.quickAnalyze(vitals);

    return { vitals, vitalsAnalysis };
  }

  // 💡 권장사항 생성
  private generateRecommendations(analysis: {
    vitals: AIFriendlyMetric[];
    vitalsAnalysis: VitalsAnalysisResult;
  }): TestRecommendation[] {
    const recommendations: TestRecommendation[] = [];

    // 성능 문제가 있는 경우
    const poorVitals = analysis.vitals.filter((v) => v.rating === 'poor');
    if (poorVitals.length > 0) {
      recommendations.push({
        id: 'performance-optimization',
        priority: 'high',
        category: 'optimize',
        title: '테스트 성능 최적화',
        description: `${poorVitals.length}개 메트릭이 임계값을 초과했습니다.`,
        commands: [
          'npm run test:ai-optimized', // npm 오버헤드 제거
          'npm run test:ultra-fast', // 최소한의 테스트만
        ],
        estimatedTime: '10분',
        confidence: 0.85,
      });
    }

    // 실패한 테스트가 있는 경우
    const failureVitals = analysis.vitals.find((v) =>
      v.name.includes('success-rate')
    );
    if (failureVitals && failureVitals.rating !== 'good') {
      recommendations.push({
        id: 'fix-failing-tests',
        priority: 'critical',
        category: 'fix',
        title: '실패한 테스트 수정',
        description: '일부 테스트가 실패했습니다. 즉시 수정이 필요합니다.',
        commands: [
          'npm run test -- --reporter=verbose', // 상세 로그
          'npm run test:dev', // 개발 모드 테스트
        ],
        estimatedTime: '30분',
        confidence: 0.95,
      });
    }

    // 전반적인 점수가 낮은 경우
    if (analysis.vitalsAnalysis.overallScore < 70) {
      recommendations.push({
        id: 'comprehensive-review',
        priority: 'medium',
        category: 'investigate',
        title: '종합적 테스트 검토',
        description:
          '전반적인 테스트 품질이 낮습니다. 포괄적 검토가 필요합니다.',
        commands: [
          'npm run test:coverage', // 커버리지 확인
          'npm run vitals:full-integration', // 전체 통합 테스트
          'npm run lint:strict', // 엄격한 린트 검사
        ],
        estimatedTime: '2시간',
        confidence: 0.75,
      });
    }

    return recommendations;
  }

  // 🎯 다음 액션 생성
  private generateNextActions(
    analysis: { vitalsAnalysis: VitalsAnalysisResult },
    recommendations: TestRecommendation[]
  ): string[] {
    const actions: string[] = [];

    // 우선순위 높은 권장사항 기반
    const criticalRecs = recommendations.filter(
      (r) => r.priority === 'critical'
    );
    const firstCritical = criticalRecs[0];
    if (firstCritical) {
      actions.push(`1. 즉시 조치: ${firstCritical.title}`);
      firstCritical.commands.forEach((cmd) => {
        actions.push(`   → ${cmd}`);
      });
    }

    // 성능 개선
    const highRecs = recommendations.filter((r) => r.priority === 'high');
    const firstHigh = highRecs[0];
    if (firstHigh && firstHigh.commands.length > 0) {
      actions.push(`2. 성능 개선: ${firstHigh.title}`);
      actions.push(`   → ${firstHigh.commands[0]}`);
    }

    // 일반적인 다음 단계
    if (analysis.vitalsAnalysis.overallScore >= 90) {
      actions.push('3. ✅ 테스트 상태 우수 - 배포 가능');
      actions.push('   → npm run build && npm run deploy:safe');
    } else if (analysis.vitalsAnalysis.overallScore >= 75) {
      actions.push('3. 🟡 추가 검증 권장');
      actions.push('   → npm run test:e2e');
    } else {
      actions.push('3. 🔴 문제 해결 후 재테스트 필요');
      actions.push('   → 권장사항 우선 적용');
    }

    return actions;
  }

  // 📈 테스트 통계 파싱
  private parseTestStats(output: string): SubagentTestResult['stats'] {
    const stats = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      coverage: undefined as number | undefined,
    };

    // Vitest 출력 파싱
    const vitestMatch = output.match(
      /Test Files\s+(\d+) passed.*?Tests\s+(\d+) passed.*?(\d+) failed.*?(\d+) skipped/s
    );
    if (vitestMatch && vitestMatch.length >= 5) {
      stats.passed = parseInt(vitestMatch[2] || '0', 10);
      stats.failed = parseInt(vitestMatch[3] || '0', 10);
      stats.skipped = parseInt(vitestMatch[4] || '0', 10);
      stats.total = stats.passed + stats.failed + stats.skipped;
    }

    // Jest/Vitest coverage 파싱
    const coverageMatch = output.match(/All files.*?(\d+\.?\d*)%/);
    if (coverageMatch?.[1]) {
      stats.coverage = parseFloat(coverageMatch[1]);
    }

    // Playwright 출력 파싱
    const playwrightMatch = output.match(
      /(\d+) passed.*?(\d+) failed.*?(\d+) skipped/
    );
    if (playwrightMatch && playwrightMatch.length >= 4 && stats.total === 0) {
      stats.passed = parseInt(playwrightMatch[1] || '0', 10);
      stats.failed = parseInt(playwrightMatch[2] || '0', 10);
      stats.skipped = parseInt(playwrightMatch[3] || '0', 10);
      stats.total = stats.passed + stats.failed + stats.skipped;
    }

    return stats;
  }

  // 🚨 에러 파싱
  private parseErrors(stdout: string, stderr: string): TestError[] {
    const errors: TestError[] = [];
    const output = `${stdout}\n${stderr}`;

    // TypeScript 에러
    const tsErrorMatches = output.match(
      /.*\.ts\((\d+),\d+\): error TS\d+: (.*)/g
    );
    if (tsErrorMatches) {
      tsErrorMatches.forEach((match) => {
        const [, line, message] =
          match.match(/.*\.ts\((\d+),\d+\): error TS\d+: (.*)/) || [];
        if (line && message) {
          errors.push({
            file: 'typescript',
            line: parseInt(line, 10),
            message: message.trim(),
            category: 'syntax',
            severity: 'error',
          });
        }
      });
    }

    // 테스트 실패 에러
    const testErrorMatches = output.match(/FAIL.*\n.*Error: (.*)/g);
    if (testErrorMatches) {
      testErrorMatches.forEach((match) => {
        const message = match.replace(/FAIL.*\n.*Error: /, '');
        errors.push({
          file: 'test',
          message: message.trim(),
          category: 'assertion',
          severity: 'error',
        });
      });
    }

    return errors;
  }

  // ⚠️ 경고 파싱
  private parseWarnings(output: string): string[] {
    const warnings: string[] = [];

    // 일반적인 경고 패턴들
    const warningPatterns = [
      /WARNING: (.*)/g,
      /WARN: (.*)/g,
      /deprecated: (.*)/g,
      /⚠️ (.*)/g,
    ];

    warningPatterns.forEach((pattern) => {
      const matches = output.match(pattern);
      if (matches) {
        warnings.push(
          ...matches.map((m) =>
            m.replace(/WARNING: |WARN: |deprecated: |⚠️ /, '').trim()
          )
        );
      }
    });

    return warnings;
  }

  // 💾 로그 저장
  private saveTestLog(result: SubagentTestResult): void {
    const logFile = join(this.logDir, `${result.testId}.json`);
    try {
      writeFileSync(logFile, JSON.stringify(result, null, 2));
    } catch (error) {
      console.warn('⚠️ 로그 저장 실패:', error);
    }
  }

  // 📋 서브에이전트용 결과 출력
  private printSubagentSummary(result: SubagentTestResult): void {
    console.log('\n🤖 [SubagentTestController] 테스트 결과 요약\n');

    // 기본 정보
    console.log(`📊 테스트 ID: ${result.testId}`);
    console.log(`⏱️ 실행 시간: ${(result.duration / 1000).toFixed(1)}초`);
    console.log(
      `📋 프로필: ${result.profile.name} (${result.profile.expectedDuration})`
    );
    console.log(
      `${result.success ? '✅' : '❌'} 전체 결과: ${result.success ? '성공' : '실패'}`
    );

    // 테스트 통계
    if (result.stats.total > 0) {
      console.log(`\n📈 테스트 통계:`);
      console.log(`  총 테스트: ${result.stats.total}개`);
      console.log(`  성공: ${result.stats.passed}개`);
      console.log(`  실패: ${result.stats.failed}개`);
      console.log(`  건너뜀: ${result.stats.skipped}개`);
      if (result.stats.coverage) {
        console.log(`  커버리지: ${result.stats.coverage}%`);
      }
    }

    // AI 분석 결과
    console.log(`\n🧠 AI 분석:`);
    console.log(`  전체 점수: ${result.analysis.overallScore}/100`);
    console.log(`  평가: ${result.analysis.overallRating}`);
    console.log(`  요약: ${result.analysis.summary}`);

    // 핵심 통찰
    if (result.analysis.keyInsights.length > 0) {
      console.log(`\n💡 핵심 통찰:`);
      result.analysis.keyInsights.forEach((insight, idx) => {
        console.log(`  ${idx + 1}. ${insight}`);
      });
    }

    // 권장사항 (상위 3개만)
    if (result.recommendations.length > 0) {
      console.log(
        `\n🎯 권장사항 (상위 ${Math.min(3, result.recommendations.length)}개):`
      );
      result.recommendations.slice(0, 3).forEach((rec, idx) => {
        console.log(
          `  ${idx + 1}. [${rec.priority.toUpperCase()}] ${rec.title}`
        );
        console.log(`     → ${rec.description}`);
        console.log(`     → 예상 시간: ${rec.estimatedTime}`);
      });
    }

    // 다음 액션
    if (result.nextActions.length > 0) {
      console.log(`\n🚀 다음 액션:`);
      result.nextActions.forEach((action) => {
        console.log(`  ${action}`);
      });
    }

    // 에러 (있는 경우)
    if (result.errors.length > 0) {
      console.log(`\n🚨 에러 (${result.errors.length}개):`);
      result.errors.slice(0, 3).forEach((error, idx) => {
        console.log(`  ${idx + 1}. ${error.message}`);
      });
      if (result.errors.length > 3) {
        console.log(`  ... 및 ${result.errors.length - 3}개 더`);
      }
    }

    console.log(`\n📝 상세 로그: logs/subagent-tests/${result.testId}.json\n`);
  }

  // 📁 로그 디렉토리 확인
  private ensureLogDirectory(): void {
    try {
      mkdirSync(this.logDir, { recursive: true });
    } catch {
      // 이미 존재하거나 생성할 수 없는 경우 무시
    }
  }

  // 🔍 테스트 히스토리 조회 (서브에이전트용)
  getTestHistory(limit: number = 10): SubagentTestResult[] {
    try {
      const logFiles = readdirSync(this.logDir)
        .filter((file: string) => file.endsWith('.json'))
        .sort()
        .reverse()
        .slice(0, limit);

      return logFiles.map((file: string) => {
        const content = readFileSync(join(this.logDir, file), 'utf8');
        return JSON.parse(content);
      });
    } catch {
      return [];
    }
  }

  // 📊 성능 트렌드 분석 (서브에이전트용)
  analyzePerformanceTrend(): {
    averageDuration: number;
    successRate: number;
    trend: 'improving' | 'stable' | 'declining';
    recommendation: string;
  } {
    const history = this.getTestHistory(10);

    if (history.length < 2) {
      return {
        averageDuration: 0,
        successRate: 100,
        trend: 'stable',
        recommendation: '더 많은 테스트 데이터가 필요합니다.',
      };
    }

    const avgDuration =
      history.reduce((sum, test) => sum + test.duration, 0) / history.length;
    const successRate =
      (history.filter((test) => test.success).length / history.length) * 100;

    // 트렌드 분석 (최근 3개 vs 이전 3개)
    const recent = history.slice(0, 3);
    const previous = history.slice(3, 6);

    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (recent.length >= 2 && previous.length >= 2) {
      const recentAvg =
        recent.reduce((sum, test) => sum + test.analysis.overallScore, 0) /
        recent.length;
      const previousAvg =
        previous.reduce((sum, test) => sum + test.analysis.overallScore, 0) /
        previous.length;

      if (recentAvg > previousAvg + 5) trend = 'improving';
      else if (recentAvg < previousAvg - 5) trend = 'declining';
    }

    return {
      averageDuration: Math.round(avgDuration),
      successRate: Math.round(successRate),
      trend,
      recommendation:
        trend === 'declining'
          ? '테스트 품질이 하락하고 있습니다. 즉시 검토가 필요합니다.'
          : trend === 'improving'
            ? '테스트 품질이 개선되고 있습니다. 현재 방향을 유지하세요.'
            : '테스트 품질이 안정적입니다.',
    };
  }
}

// 🚀 서브에이전트용 간단한 팩토리 함수들
export const subagentTesting = {
  // 가장 간단한 사용법 - 원샷 테스트
  quickTest: async (
    priority: 'fast' | 'thorough' | 'comprehensive' = 'fast'
  ): Promise<SubagentTestResult> => {
    const controller = new SubagentTestController();
    return controller.runSmartTest({ priority });
  },

  // 특정 영역 포커스 테스트
  focusTest: async (
    focus: string,
    priority: 'fast' | 'thorough' = 'fast'
  ): Promise<SubagentTestResult> => {
    const controller = new SubagentTestController();
    return controller.runSmartTest({ priority, focus });
  },

  // 성능 트렌드 분석
  analyzeTrend: (): {
    averageDuration: number;
    successRate: number;
    trend: 'improving' | 'stable' | 'declining';
    recommendation: string;
  } => {
    const controller = new SubagentTestController();
    return controller.analyzePerformanceTrend();
  },

  // 테스트 히스토리 조회
  getHistory: (limit: number = 5): SubagentTestResult[] => {
    const controller = new SubagentTestController();
    return controller.getTestHistory(limit);
  },
};

// 📝 서브에이전트 사용 예시
export const subagentTestingExamples = {
  // 가장 간단한 사용법
  simple: `
// 1줄로 빠른 테스트
const result = await subagentTesting.quickTest('fast');
console.log(result.analysis.summary); // "우수한 성능! 테스트 통과"

// 권장사항 확인
result.recommendations.forEach(rec => {
  console.log(\`💡 \${rec.title}: \${rec.description}\`);
});
  `,

  // 특정 영역 테스트
  focus: `
// E2E 테스트에 집중
const result = await subagentTesting.focusTest('e2e', 'thorough');

// API 테스트에 집중
const apiResult = await subagentTesting.focusTest('api', 'fast');
  `,

  // 성능 트렌드 분석
  trend: `
// 성능 트렌드 분석
const trend = subagentTesting.analyzeTrend();
console.log(\`평균 실행시간: \${trend.averageDuration}ms\`);
console.log(\`성공률: \${trend.successRate}%\`);
console.log(\`트렌드: \${trend.trend}\`);
console.log(\`권장사항: \${trend.recommendation}\`);
  `,
};
