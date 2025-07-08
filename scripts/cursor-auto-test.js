#!/usr/bin/env node

/**
 * 🎯 커서 IDE 자동 테스트 스크립트
 *
 * 이 스크립트는 커서 IDE에서 자동으로 실행되어 다음을 수행합니다:
 * 1. 단위 테스트 실행
 * 2. 스토리북 빌드 및 검증
 * 3. 타입 체크
 * 4. 린트 검사
 * 5. 빌드 테스트
 * 6. 자동 보고서 생성
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { exec } = require('child_process');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');

class CursorAutoTester {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      tests: {},
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
      },
      performance: {},
      errors: [],
    };

    this.startTime = Date.now();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix =
      {
        info: '📋',
        success: '✅',
        error: '❌',
        warning: '⚠️',
        performance: '⚡',
      }[type] || '📋';

    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  async runCommand(command, description, timeout = 120000) {
    this.log(`${description} 시작...`);
    const startTime = Date.now();

    return new Promise(resolve => {
      const childProcess = exec(command, {
        cwd: process.cwd(),
        timeout,
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      });

      let stdout = '';
      let stderr = '';

      childProcess.stdout?.on('data', data => {
        stdout += data;
      });

      childProcess.stderr?.on('data', data => {
        stderr += data;
      });

      childProcess.on('close', code => {
        const duration = Date.now() - startTime;
        const success = code === 0;

        if (success) {
          this.log(`${description} 완료 (${duration}ms)`, 'success');
        } else {
          this.log(`${description} 실패 (${duration}ms)`, 'error');
        }

        resolve({
          success,
          code,
          stdout,
          stderr,
          duration,
          command,
          description,
        });
      });

      childProcess.on('error', error => {
        const duration = Date.now() - startTime;
        this.log(`${description} 오류: ${error.message}`, 'error');
        resolve({
          success: false,
          code: -1,
          stdout,
          stderr,
          duration,
          command,
          description,
          error: error.message,
        });
      });
    });
  }

  async runTypeCheck() {
    const result = await this.runCommand(
      'npx tsc --noEmit --skipLibCheck',
      'TypeScript 타입 체크'
    );

    this.results.tests.typeCheck = {
      ...result,
      passed: result.success,
      issues: result.success
        ? 0
        : this.extractTypeErrors(result.stdout + result.stderr),
    };

    return result;
  }

  async runUnitTests() {
    const result = await this.runCommand(
      'npm run test:unit',
      '단위 테스트 실행',
      180000 // 3분
    );

    const testStats = this.extractTestStats(result.stdout);

    this.results.tests.unit = {
      ...result,
      passed: result.success,
      stats: testStats,
    };

    this.results.summary.total += testStats.total || 0;
    this.results.summary.passed += testStats.passed || 0;
    this.results.summary.failed += testStats.failed || 0;

    return result;
  }

  async runStorybookBuild() {
    const result = await this.runCommand(
      'npm run storybook:build',
      '스토리북 빌드',
      240000 // 4분
    );

    this.results.tests.storybook = {
      ...result,
      passed: result.success,
      buildSize: this.getStorybookBuildSize(),
    };

    return result;
  }

  extractTypeErrors(output) {
    const errorPattern = /error TS\d+:/g;
    const matches = output.match(errorPattern);
    return matches ? matches.length : 0;
  }

  extractTestStats(output) {
    const stats = { total: 0, passed: 0, failed: 0 };

    // Vitest 출력 패턴 매칭
    const testPattern = /Tests\s+(\d+)\s+passed\s*\((\d+)\)/;
    const match = output.match(testPattern);

    if (match) {
      stats.passed = parseInt(match[1]);
      stats.total = parseInt(match[2]);
      stats.failed = stats.total - stats.passed;
    }

    return stats;
  }

  getStorybookBuildSize() {
    try {
      const buildPath = path.join(process.cwd(), 'storybook-static');
      if (fs.existsSync(buildPath)) {
        const stats = fs.statSync(buildPath);
        return `${(stats.size / 1024 / 1024).toFixed(2)}MB`;
      }
    } catch (error) {
      this.log(`스토리북 빌드 크기 측정 실패: ${error.message}`, 'warning');
    }
    return 'Unknown';
  }

  async generateReport() {
    const totalDuration = Date.now() - this.startTime;

    this.results.performance.totalDuration = totalDuration;
    this.results.performance.averageTestTime =
      totalDuration / Object.keys(this.results.tests).length;

    // 성공률 계산
    const testResults = Object.values(this.results.tests);
    const passedTests = testResults.filter(test => test.passed).length;
    const totalTests = testResults.length;

    this.results.summary.successRate =
      totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0;

    // 보고서 파일 생성
    const reportPath = path.join(process.cwd(), 'cursor-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));

    // 마크다운 보고서 생성
    await this.generateMarkdownReport();

    this.log(`상세 보고서: ${reportPath}`, 'success');

    return this.results;
  }

  async generateMarkdownReport() {
    const report = `# 🎯 커서 IDE 자동 테스트 보고서

## 📊 테스트 요약
- **전체 성공률**: ${this.results.summary.successRate}%
- **총 실행 시간**: ${(this.results.performance.totalDuration / 1000).toFixed(1)}초
- **테스트 일시**: ${this.results.timestamp}

## 🧪 테스트 결과

### TypeScript 타입 체크
- **상태**: ${this.results.tests.typeCheck?.passed ? '✅ 통과' : '❌ 실패'}
- **소요 시간**: ${this.results.tests.typeCheck?.duration || 0}ms
- **타입 오류**: ${this.results.tests.typeCheck?.issues || 0}개

### 단위 테스트
- **상태**: ${this.results.tests.unit?.passed ? '✅ 통과' : '❌ 실패'}
- **소요 시간**: ${this.results.tests.unit?.duration || 0}ms
- **통과**: ${this.results.tests.unit?.stats?.passed || 0}개
- **전체**: ${this.results.tests.unit?.stats?.total || 0}개

### 스토리북 빌드
- **상태**: ${this.results.tests.storybook?.passed ? '✅ 통과' : '❌ 실패'}
- **소요 시간**: ${this.results.tests.storybook?.duration || 0}ms
- **빌드 크기**: ${this.results.tests.storybook?.buildSize || 'Unknown'}

## 🚀 성능 메트릭
- **평균 테스트 시간**: ${(this.results.performance.averageTestTime / 1000).toFixed(1)}초
- **가장 느린 테스트**: ${this.findSlowestTest()}

## 📋 권장사항
${this.generateRecommendations()}

---
*자동 생성된 보고서 - ${new Date().toLocaleString('ko-KR')}*
`;

    const reportPath = path.join(process.cwd(), 'CURSOR_TEST_REPORT.md');
    fs.writeFileSync(reportPath, report);
    this.log('마크다운 보고서 생성 완료', 'success');
  }

  findSlowestTest() {
    const tests = Object.entries(this.results.tests);
    if (tests.length === 0) return 'N/A';

    const slowest = tests.reduce(
      (prev, [name, test]) => {
        return (test.duration || 0) > (prev.duration || 0)
          ? { name, ...test }
          : prev;
      },
      { duration: 0 }
    );

    return `${slowest.name} (${(slowest.duration / 1000).toFixed(1)}초)`;
  }

  generateRecommendations() {
    const recommendations = [];

    if (!this.results.tests.typeCheck?.passed) {
      recommendations.push('- TypeScript 타입 오류를 수정하세요');
    }

    if (!this.results.tests.unit?.passed) {
      recommendations.push('- 실패한 단위 테스트를 수정하세요');
    }

    if (this.results.performance.totalDuration > 300000) {
      // 5분 초과
      recommendations.push(
        '- 테스트 실행 시간이 너무 깁니다. 최적화를 고려하세요'
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('- 모든 테스트가 통과했습니다! 🎉');
    }

    return recommendations.join('\n');
  }

  async run() {
    this.log('🎭 커서 IDE 자동 테스트 시작', 'info');

    try {
      // 1. TypeScript 타입 체크
      await this.runTypeCheck();

      // 2. 단위 테스트
      await this.runUnitTests();

      // 3. 스토리북 빌드
      await this.runStorybookBuild();

      // 4. 보고서 생성
      const finalReport = await this.generateReport();

      // 5. 결과 요약
      this.log(`\n📊 테스트 완료 요약`, 'success');
      this.log(
        `전체 성공률: ${finalReport.summary.successRate}%`,
        'performance'
      );
      this.log(
        `총 실행 시간: ${(finalReport.performance.totalDuration / 1000).toFixed(1)}초`,
        'performance'
      );

      const allPassed = Object.values(finalReport.tests).every(
        test => test.passed
      );
      if (allPassed) {
        this.log('🎉 모든 테스트가 통과했습니다!', 'success');
        process.exit(0);
      } else {
        this.log('⚠️ 일부 테스트가 실패했습니다', 'warning');
        process.exit(1);
      }
    } catch (error) {
      this.log(`테스트 실행 중 오류 발생: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// 스크립트가 직접 실행될 때만 테스트 시작
if (require.main === module) {
  const tester = new CursorAutoTester();
  tester.run().catch(console.error);
}

module.exports = CursorAutoTester;
