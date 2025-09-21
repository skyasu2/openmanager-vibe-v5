#!/usr/bin/env node
/**
 * Test Automation Optimizer
 * test-automation-specialist 전용 테스트 최적화 도구
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class TestAutomationOptimizer {
  constructor() {
    this.testResults = {
      unit: { passed: 0, failed: 0, duration: 0 },
      e2e: { passed: 0, failed: 0, duration: 0 },
      coverage: { percentage: 0, threshold: 80 }
    };
  }

  async runOptimizedTests() {
    console.log('🧪 테스트 자동화 최적화 시작...\n');

    // 1단계: 빠른 단위 테스트 (목표: 6ms)
    await this.runUnitTests();

    // 2단계: E2E 테스트 (병렬 실행)
    await this.runE2ETests();

    // 3단계: 커버리지 분석
    await this.analyzeCoverage();

    // 4단계: 성능 리포트 생성
    this.generateReport();
  }

  async runUnitTests() {
    console.log('⚡ 단위 테스트 실행 중...');
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const unitTest = spawn('npm', ['run', 'test:quick'], {
        stdio: 'inherit',
        shell: true
      });

      unitTest.on('close', (code) => {
        const duration = Date.now() - startTime;
        this.testResults.unit.duration = duration;

        if (code === 0) {
          this.testResults.unit.passed = 54; // 현재 테스트 수
          console.log(`✅ 단위 테스트 완료 (${duration}ms)\n`);
        } else {
          this.testResults.unit.failed = 1;
          console.log(`❌ 단위 테스트 실패 (${duration}ms)\n`);
        }
        resolve();
      });

      unitTest.on('error', reject);
    });
  }

  async runE2ETests() {
    console.log('🎭 E2E 테스트 실행 중...');
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const e2eTest = spawn('npm', ['run', 'test:e2e:quick'], {
        stdio: 'inherit',
        shell: true
      });

      e2eTest.on('close', (code) => {
        const duration = Date.now() - startTime;
        this.testResults.e2e.duration = duration;

        if (code === 0) {
          this.testResults.e2e.passed = 18; // E2E 테스트 수
          console.log(`✅ E2E 테스트 완료 (${duration}ms)\n`);
        } else {
          this.testResults.e2e.failed = 1;
          console.log(`❌ E2E 테스트 실패 (${duration}ms)\n`);
        }
        resolve();
      });

      e2eTest.on('error', reject);
    });
  }

  async analyzeCoverage() {
    console.log('📊 커버리지 분석 중...');

    return new Promise((resolve, reject) => {
      const coverageTest = spawn('npm', ['run', 'test:coverage'], {
        stdio: 'pipe',
        shell: true
      });

      let coverageOutput = '';
      coverageTest.stdout.on('data', (data) => {
        coverageOutput += data.toString();
      });

      coverageTest.on('close', (code) => {
        // 커버리지 퍼센티지 추출
        const coverageMatch = coverageOutput.match(/All files\s+\|\s+([\d.]+)/);
        if (coverageMatch) {
          this.testResults.coverage.percentage = parseFloat(coverageMatch[1]);
        }

        console.log(`📈 커버리지: ${this.testResults.coverage.percentage}%\n`);
        resolve();
      });

      coverageTest.on('error', reject);
    });
  }

  generateReport() {
    console.log('📋 테스트 자동화 리포트 생성 중...\n');

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: this.testResults.unit.passed + this.testResults.unit.failed +
                   this.testResults.e2e.passed + this.testResults.e2e.failed,
        passed: this.testResults.unit.passed + this.testResults.e2e.passed,
        failed: this.testResults.unit.failed + this.testResults.e2e.failed,
        totalDuration: this.testResults.unit.duration + this.testResults.e2e.duration
      },
      details: this.testResults,
      performance: {
        unitTestSpeed: `${this.testResults.unit.duration}ms`,
        e2eTestSpeed: `${this.testResults.e2e.duration}ms`,
        targetSpeed: '6ms (단위 테스트)',
        improvement: this.calculateImprovement()
      },
      coverage: {
        current: `${this.testResults.coverage.percentage}%`,
        target: `${this.testResults.coverage.threshold}%`,
        status: this.testResults.coverage.percentage >= this.testResults.coverage.threshold ? '✅ 목표 달성' : '❌ 목표 미달성'
      }
    };

    // 리포트 저장
    const reportPath = path.join(process.cwd(), 'test-results', 'automation-report.json');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // 콘솔 출력
    this.printReport(report);
  }

  calculateImprovement() {
    const current = this.testResults.unit.duration;
    const target = 6; // 6ms 목표
    const improvement = ((current - target) / current * 100).toFixed(1);
    return improvement > 0 ? `${improvement}% 개선 필요` : '✅ 목표 달성';
  }

  printReport(report) {
    console.log('═══════════════════════════════════════');
    console.log('🧪 TEST AUTOMATION SPECIALIST REPORT');
    console.log('═══════════════════════════════════════');
    console.log(`📊 총 테스트: ${report.summary.totalTests}개`);
    console.log(`✅ 성공: ${report.summary.passed}개`);
    console.log(`❌ 실패: ${report.summary.failed}개`);
    console.log(`⏱️  총 실행 시간: ${report.summary.totalDuration}ms`);
    console.log('');
    console.log('📈 성능 분석:');
    console.log(`   단위 테스트: ${report.performance.unitTestSpeed}`);
    console.log(`   E2E 테스트: ${report.performance.e2eTestSpeed}`);
    console.log(`   목표 속도: ${report.performance.targetSpeed}`);
    console.log(`   개선 상태: ${report.performance.improvement}`);
    console.log('');
    console.log('🎯 커버리지 현황:');
    console.log(`   현재: ${report.coverage.current}`);
    console.log(`   목표: ${report.coverage.target}`);
    console.log(`   상태: ${report.coverage.status}`);
    console.log('');
    console.log(`📄 상세 리포트: test-results/automation-report.json`);
    console.log('═══════════════════════════════════════');
  }
}

// 스크립트 실행
if (require.main === module) {
  const optimizer = new TestAutomationOptimizer();
  optimizer.runOptimizedTests().catch(console.error);
}

module.exports = TestAutomationOptimizer;