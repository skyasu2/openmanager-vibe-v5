/**
 * 🧪 Vitest Universal Vitals Plugin
 *
 * @description Vitest 테스트에 Universal Vitals 메트릭 수집 기능 추가
 * @integration Vitest hooks + Universal Vitals System
 * @auto-collect 테스트 실행 시간, 성공률, 커버리지 등을 자동으로 Vitals로 수집
 */

import { beforeAll, afterAll, beforeEach, afterEach, expect } from 'vitest';
import { universalVitals, type UniversalVital } from './universal-vitals';
import { performance } from 'node:perf_hooks';

// 🎯 Vitest Vitals 수집 상태
interface VitestVitalsState {
  testStartTime: number;
  suiteStartTime: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  currentTestName: string;
  suiteMetrics: Map<string, UniversalVital>;
}

let vitestState: VitestVitalsState = {
  testStartTime: 0,
  suiteStartTime: 0,
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  skippedTests: 0,
  currentTestName: '',
  suiteMetrics: new Map()
};

// 📊 Vitest 메트릭 수집 함수들
export const VitestVitals = {

  // 🚀 테스트 스위트 시작
  startSuite: (suiteName: string) => {
    vitestState.suiteStartTime = performance.now();
    universalVitals.startMeasurement(`suite-${suiteName}`, 'test-execution', {
      type: 'test-suite',
      suiteName
    });

    console.log(`🧪 [Vitest Vitals] 테스트 스위트 시작: ${suiteName}`);
  },

  // 🏁 테스트 스위트 완료
  endSuite: (suiteName: string) => {
    const suiteVital = universalVitals.endMeasurement(`suite-${suiteName}`, 'test-execution', 'ms', {
      totalTests: vitestState.totalTests,
      passedTests: vitestState.passedTests,
      failedTests: vitestState.failedTests,
      skippedTests: vitestState.skippedTests,
      successRate: vitestState.totalTests > 0 ? (vitestState.passedTests / vitestState.totalTests) * 100 : 0
    });

    // 성공률 Vital 별도 수집
    if (vitestState.totalTests > 0) {
      const successRate = (vitestState.passedTests / vitestState.totalTests) * 100;
      universalVitals.collectVital(
        'test-success-rate',
        'test-execution',
        successRate,
        '%',
        { suiteName, totalTests: vitestState.totalTests }
      );
    }

    vitestState.suiteMetrics.set(suiteName, suiteVital);
    console.log(`✅ [Vitest Vitals] 테스트 스위트 완료: ${suiteName} (${suiteVital.value.toFixed(0)}ms)`);

    return suiteVital;
  },

  // ⏱️ 개별 테스트 시작
  startTest: (testName: string) => {
    vitestState.testStartTime = performance.now();
    vitestState.currentTestName = testName;
    universalVitals.startMeasurement(`test-${testName}`, 'test-execution', {
      type: 'unit-test',
      testName
    });
  },

  // ✅ 개별 테스트 성공
  passTest: (testName: string = vitestState.currentTestName) => {
    const testVital = universalVitals.endMeasurement(`test-${testName}`, 'test-execution', 'ms', {
      result: 'passed'
    });

    vitestState.passedTests++;
    vitestState.totalTests++;

    // 단위 테스트 시간 Vital 수집
    universalVitals.collectVital(
      'unit-test-time',
      'test-execution',
      testVital.value,
      'ms',
      { testName, result: 'passed' }
    );

    return testVital;
  },

  // ❌ 개별 테스트 실패
  failTest: (testName: string = vitestState.currentTestName, error?: Error) => {
    const testVital = universalVitals.endMeasurement(`test-${testName}`, 'test-execution', 'ms', {
      result: 'failed',
      error: error?.message
    });

    vitestState.failedTests++;
    vitestState.totalTests++;

    // 실패 테스트도 시간 측정
    universalVitals.collectVital(
      'unit-test-time',
      'test-execution',
      testVital.value,
      'ms',
      { testName, result: 'failed', error: error?.message }
    );

    return testVital;
  },

  // ⏭️ 테스트 스킵
  skipTest: (testName: string) => {
    vitestState.skippedTests++;
    vitestState.totalTests++;

    universalVitals.collectVital(
      'test-skip-rate',
      'test-execution',
      1,
      'count',
      { testName, result: 'skipped' }
    );
  },

  // 📊 메모리 사용량 수집
  collectMemoryUsage: (label: string = 'test-memory') => {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memUsage = process.memoryUsage();
      const heapUsedMB = memUsage.heapUsed / 1024 / 1024;

      universalVitals.collectVital(
        'memory-usage',
        'infrastructure',
        heapUsedMB,
        'MB',
        {
          label,
          heapTotal: memUsage.heapTotal / 1024 / 1024,
          external: memUsage.external / 1024 / 1024,
          rss: memUsage.rss / 1024 / 1024
        }
      );

      return heapUsedMB;
    }
    return 0;
  },

  // 🔧 커버리지 Vital 수집 (외부에서 호출)
  collectCoverage: (coverageData: { lines: number; functions: number; branches: number; statements: number }) => {
    Object.entries(coverageData).forEach(([type, percentage]) => {
      universalVitals.collectVital(
        `test-coverage-${type}`,
        'test-execution',
        percentage,
        '%',
        { coverageType: type }
      );
    });

    // 전체 커버리지 평균
    const avgCoverage = Object.values(coverageData).reduce((sum, val) => sum + val, 0) / 4;
    universalVitals.collectVital(
      'test-coverage',
      'test-execution',
      avgCoverage,
      '%',
      { breakdown: coverageData }
    );
  },

  // 📈 현재 상태 조회
  getState: () => ({ ...vitestState }),

  // 🧹 상태 초기화
  reset: () => {
    vitestState = {
      testStartTime: 0,
      suiteStartTime: 0,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      currentTestName: '',
      suiteMetrics: new Map()
    };
  },

  // 📊 최종 리포트 생성
  generateReport: () => {
    const metrics = universalVitals.getMetricsByCategory('test-execution');
    const summary = universalVitals.getSummary();

    const report = {
      timestamp: Date.now(),
      testExecution: {
        totalTests: vitestState.totalTests,
        passedTests: vitestState.passedTests,
        failedTests: vitestState.failedTests,
        skippedTests: vitestState.skippedTests,
        successRate: vitestState.totalTests > 0 ? (vitestState.passedTests / vitestState.totalTests) * 100 : 0
      },
      vitals: metrics,
      summary: {
        totalVitals: summary.total,
        goodVitals: summary.good,
        needsImprovementVitals: summary.needsImprovement,
        poorVitals: summary.poor
      },
      recommendations: metrics
        .filter(m => m.recommendations && m.recommendations.length > 0)
        .map(m => ({ metric: m.name, recommendations: m.recommendations }))
    };

    return report;
  }
};

// 🔌 자동 Vitest Hook 통합
export function setupVitestVitals(options: {
  suiteName?: string;
  autoMemoryTracking?: boolean;
  reportEndpoint?: string;
} = {}) {
  const {
    suiteName = 'vitest-suite',
    autoMemoryTracking = true,
    reportEndpoint
  } = options;

  // 🚀 테스트 스위트 시작
  beforeAll(() => {
    VitestVitals.reset();
    VitestVitals.startSuite(suiteName);

    if (autoMemoryTracking) {
      VitestVitals.collectMemoryUsage('suite-start');
    }
  });

  // ⏱️ 각 테스트 시작
  beforeEach((context) => {
    const testName = context.task?.name || 'unknown-test';
    VitestVitals.startTest(testName);

    if (autoMemoryTracking) {
      VitestVitals.collectMemoryUsage(`test-start-${testName}`);
    }
  });

  // ✅ 각 테스트 완료 (성공/실패 자동 감지)
  afterEach((context) => {
    const testName = context.task?.name || 'unknown-test';
    const testResult = context.task?.result;

    if (testResult?.state === 'pass') {
      VitestVitals.passTest(testName);
    } else if (testResult?.state === 'fail') {
      VitestVitals.failTest(testName, testResult.errors?.[0] as Error);
    } else if (testResult?.state === 'skip') {
      VitestVitals.skipTest(testName);
    }

    if (autoMemoryTracking) {
      VitestVitals.collectMemoryUsage(`test-end-${testName}`);
    }
  });

  // 🏁 테스트 스위트 완료
  afterAll(async () => {
    VitestVitals.endSuite(suiteName);

    if (autoMemoryTracking) {
      VitestVitals.collectMemoryUsage('suite-end');
    }

    // 최종 리포트 생성
    const report = VitestVitals.generateReport();
    console.log('\n📊 [Vitest Vitals] 최종 리포트:');
    console.log(`✅ 성공: ${report.testExecution.passedTests}/${report.testExecution.totalTests}`);
    console.log(`📈 성공률: ${report.testExecution.successRate.toFixed(1)}%`);
    console.log(`🎯 Vitals 품질: ${report.summary.goodVitals}개 Good, ${report.summary.poorVitals}개 Poor`);

    // 권장사항 출력
    if (report.recommendations.length > 0) {
      console.log('\n💡 [성능 개선 권장사항]:');
      report.recommendations.forEach(rec => {
        console.log(`- ${rec.metric}: ${rec.recommendations?.join(', ')}`);
      });
    }

    // API로 리포트 전송 (선택사항)
    if (reportEndpoint) {
      try {
        const response = await fetch(reportEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(report)
        });

        if (response.ok) {
          console.log(`📤 [Vitest Vitals] 리포트 전송 완료: ${reportEndpoint}`);
        }
      } catch (error) {
        console.warn(`⚠️ [Vitest Vitals] 리포트 전송 실패:`, error);
      }
    }
  });
}

// 📝 사용 예시를 위한 헬퍼
export const vitestExample = {
  // setup.ts에서 사용
  setup: `
// src/test/setup.ts
import { setupVitestVitals } from '@/lib/testing/vitest-vitals-plugin';

setupVitestVitals({
  suiteName: 'my-test-suite',
  autoMemoryTracking: true,
  reportEndpoint: '/api/universal-vitals'
});
  `,

  // 개별 테스트에서 사용
  usage: `
import { VitestVitals } from '@/lib/testing/vitest-vitals-plugin';

test('성능 측정이 필요한 테스트', () => {
  // 메모리 사용량 수집
  const beforeMemory = VitestVitals.collectMemoryUsage('test-start');

  // 테스트 로직...

  const afterMemory = VitestVitals.collectMemoryUsage('test-end');
  expect(afterMemory - beforeMemory).toBeLessThan(10); // 10MB 미만 증가
});
  `
};