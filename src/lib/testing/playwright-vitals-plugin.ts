/**
 * 🎭 Playwright Universal Vitals Plugin
 *
 * @description Playwright E2E 테스트에 Universal Vitals 메트릭 수집 기능 추가
 * @integration Playwright hooks + Universal Vitals System + Browser API
 * @auto-collect E2E 테스트 시간, 페이지 로딩, 브라우저 성능 등을 자동으로 Vitals로 수집
 */

import { test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { universalVitals, type UniversalVital } from './universal-vitals';

// 🎯 Playwright Vitals 수집 상태
interface PlaywrightVitalsState {
  testStartTime: number;
  suiteStartTime: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  pageMetrics: Map<string, UniversalVital>;
  currentTestName: string;
  suiteMetrics: Map<string, UniversalVital>;
  browserName: string;
  sessionId: string;
}

let playwrightState: PlaywrightVitalsState = {
  testStartTime: 0,
  suiteStartTime: 0,
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  pageMetrics: new Map(),
  currentTestName: '',
  suiteMetrics: new Map(),
  browserName: 'unknown',
  sessionId: `pw-${Date.now()}`,
};

// 📊 Playwright 메트릭 수집 함수들
export const PlaywrightVitals = {
  // 🚀 E2E 테스트 스위트 시작
  startSuite: (suiteName: string, browserName: string = 'chromium') => {
    playwrightState.suiteStartTime = performance.now();
    playwrightState.browserName = browserName;
    playwrightState.sessionId = `pw-${browserName}-${Date.now()}`;

    universalVitals.startMeasurement(
      `e2e-suite-${suiteName}`,
      'test-execution',
      {
        type: 'e2e-suite',
        suiteName,
        browserName,
        sessionId: playwrightState.sessionId,
      }
    );

    console.log(
      `🎭 [Playwright Vitals] E2E 테스트 스위트 시작: ${suiteName} (${browserName})`
    );
  },

  // 🏁 E2E 테스트 스위트 완료
  endSuite: (suiteName: string) => {
    const suiteVital = universalVitals.endMeasurement(
      `e2e-suite-${suiteName}`,
      'test-execution',
      'ms',
      {
        totalTests: playwrightState.totalTests,
        passedTests: playwrightState.passedTests,
        failedTests: playwrightState.failedTests,
        successRate:
          playwrightState.totalTests > 0
            ? (playwrightState.passedTests / playwrightState.totalTests) * 100
            : 0,
        browserName: playwrightState.browserName,
        sessionId: playwrightState.sessionId,
      }
    );

    // E2E 성공률 Vital 별도 수집
    if (playwrightState.totalTests > 0) {
      const successRate =
        (playwrightState.passedTests / playwrightState.totalTests) * 100;
      universalVitals.collectVital(
        'e2e-success-rate',
        'test-execution',
        successRate,
        '%',
        {
          suiteName,
          totalTests: playwrightState.totalTests,
          browserName: playwrightState.browserName,
        }
      );
    }

    playwrightState.suiteMetrics.set(suiteName, suiteVital);
    console.log(
      `✅ [Playwright Vitals] E2E 스위트 완료: ${suiteName} (${suiteVital.value.toFixed(0)}ms)`
    );

    return suiteVital;
  },

  // ⏱️ 개별 E2E 테스트 시작
  startTest: (testName: string, _page?: Page) => {
    playwrightState.testStartTime = performance.now();
    playwrightState.currentTestName = testName;

    universalVitals.startMeasurement(`e2e-test-${testName}`, 'test-execution', {
      type: 'e2e-test',
      testName,
      browserName: playwrightState.browserName,
      sessionId: playwrightState.sessionId,
    });
  },

  // 📄 페이지 네비게이션 시작
  startNavigation: (_page: Page, url: string) => {
    const navigationKey = `navigation-${url}`;
    universalVitals.startMeasurement(navigationKey, 'web-performance', {
      url,
      browserName: playwrightState.browserName,
      testName: playwrightState.currentTestName,
    });
  },

  // 📄 페이지 네비게이션 완료 (Web Vitals 수집)
  endNavigation: async (page: Page, url: string) => {
    const navigationKey = `navigation-${url}`;
    const navigationVital = universalVitals.endMeasurement(
      navigationKey,
      'web-performance',
      'ms',
      {
        url,
        browserName: playwrightState.browserName,
      }
    );

    try {
      // 🌐 실제 Web Vitals 수집 (브라우저에서)
      const webVitals = await page.evaluate(() => {
        return new Promise((resolve) => {
          const vitals: Record<string, unknown> = {};
          let metricsCollected = 0;
          const totalMetrics = 5;

          const handleMetric = (metricName: string, value: number) => {
            vitals[metricName] = value;
            metricsCollected++;
            if (metricsCollected >= totalMetrics) {
              resolve(vitals);
            }
          };

          // Web Vitals 라이브러리를 사용할 수 없는 경우 Performance API 사용
          setTimeout(() => {
            const navigation = performance.getEntriesByType(
              'navigation'
            )[0] as PerformanceNavigationTiming;
            const paintEntries = performance.getEntriesByType('paint');

            if (navigation) {
              // TTFB (Time to First Byte)
              handleMetric(
                'TTFB',
                navigation.responseStart - navigation.fetchStart
              );

              // FCP (First Contentful Paint)
              const fcpEntry = paintEntries.find(
                (entry) => entry.name === 'first-contentful-paint'
              );
              if (fcpEntry) {
                handleMetric('FCP', fcpEntry.startTime);
              }

              // LCP 추정값 (실제로는 더 복잡한 계산 필요)
              handleMetric(
                'LCP',
                navigation.loadEventEnd - navigation.fetchStart
              );

              // FID는 사용자 상호작용 후에만 측정 가능하므로 0으로 설정
              handleMetric('FID', 0);

              // CLS는 레이아웃 시프트 측정이 필요하므로 0으로 설정
              handleMetric('CLS', 0);
            } else {
              resolve({});
            }
          }, 1000);
        });
      });

      // Web Vitals를 Universal Vitals로 수집
      for (const [metricName, value] of Object.entries(
        webVitals as Record<string, number>
      )) {
        if (typeof value === 'number' && value > 0) {
          universalVitals.collectVital(
            metricName,
            'web-performance',
            value,
            metricName === 'CLS' ? 'score' : 'ms',
            {
              url,
              browserName: playwrightState.browserName,
              testName: playwrightState.currentTestName,
            }
          );
        }
      }
    } catch (error) {
      console.warn('🎭 [Playwright Vitals] Web Vitals 수집 실패:', error);
    }

    return navigationVital;
  },

  // ✅ 개별 E2E 테스트 성공
  passTest: (testName: string = playwrightState.currentTestName) => {
    const testVital = universalVitals.endMeasurement(
      `e2e-test-${testName}`,
      'test-execution',
      'ms',
      {
        result: 'passed',
        browserName: playwrightState.browserName,
      }
    );

    playwrightState.passedTests++;
    playwrightState.totalTests++;

    // E2E 테스트 시간 Vital 수집
    universalVitals.collectVital(
      'e2e-test-time',
      'test-execution',
      testVital.value,
      'ms',
      {
        testName,
        result: 'passed',
        browserName: playwrightState.browserName,
      }
    );

    return testVital;
  },

  // ❌ 개별 E2E 테스트 실패
  failTest: (
    testName: string = playwrightState.currentTestName,
    error?: Error
  ) => {
    const testVital = universalVitals.endMeasurement(
      `e2e-test-${testName}`,
      'test-execution',
      'ms',
      {
        result: 'failed',
        error: error?.message,
        browserName: playwrightState.browserName,
      }
    );

    playwrightState.failedTests++;
    playwrightState.totalTests++;

    // 실패 E2E 테스트도 시간 측정
    universalVitals.collectVital(
      'e2e-test-time',
      'test-execution',
      testVital.value,
      'ms',
      {
        testName,
        result: 'failed',
        error: error?.message,
        browserName: playwrightState.browserName,
      }
    );

    return testVital;
  },

  // 📊 브라우저 성능 메트릭 수집
  collectBrowserMetrics: async (
    page: Page,
    label: string = 'browser-metrics'
  ) => {
    try {
      const metrics = await page.evaluate(() => {
        const memory = (
          performance as {
            memory?: { usedJSHeapSize: number; totalJSHeapSize: number };
          }
        ).memory;
        const timing = performance.timing;

        return {
          usedJSHeapSize: memory ? memory.usedJSHeapSize / 1024 / 1024 : 0, // MB
          totalJSHeapSize: memory ? memory.totalJSHeapSize / 1024 / 1024 : 0, // MB
          domContentLoaded: timing
            ? timing.domContentLoadedEventEnd - timing.navigationStart
            : 0,
          pageLoad: timing ? timing.loadEventEnd - timing.navigationStart : 0,
        };
      });

      // 브라우저 메모리 사용량
      if (metrics.usedJSHeapSize > 0) {
        universalVitals.collectVital(
          'browser-memory-usage',
          'infrastructure',
          metrics.usedJSHeapSize,
          'MB',
          {
            label,
            totalMemory: metrics.totalJSHeapSize,
            browserName: playwrightState.browserName,
            testName: playwrightState.currentTestName,
          }
        );
      }

      // DOM 로딩 시간
      if (metrics.domContentLoaded > 0) {
        universalVitals.collectVital(
          'dom-content-loaded',
          'web-performance',
          metrics.domContentLoaded,
          'ms',
          {
            label,
            browserName: playwrightState.browserName,
          }
        );
      }

      // 페이지 로딩 시간
      if (metrics.pageLoad > 0) {
        universalVitals.collectVital(
          'page-load-time',
          'web-performance',
          metrics.pageLoad,
          'ms',
          {
            label,
            browserName: playwrightState.browserName,
          }
        );
      }

      return metrics;
    } catch (error) {
      console.warn('🎭 [Playwright Vitals] 브라우저 메트릭 수집 실패:', error);
      return null;
    }
  },

  // 🔍 API 호출 성능 측정 (E2E 테스트 중)
  measureAPICall: async (page: Page, apiEndpoint: string) => {
    const apiKey = `api-call-${apiEndpoint}`;
    universalVitals.startMeasurement(apiKey, 'api-performance', {
      endpoint: apiEndpoint,
      browserContext: true,
      testName: playwrightState.currentTestName,
    });

    // API 응답 시간 측정을 위한 네트워크 모니터링
    const responsePromise = page.waitForResponse((response) =>
      response.url().includes(apiEndpoint)
    );

    try {
      const response = await responsePromise;
      const apiVital = universalVitals.endMeasurement(
        apiKey,
        'api-performance',
        'ms',
        {
          statusCode: response.status(),
          endpoint: apiEndpoint,
          browserContext: true,
        }
      );

      // API 응답 시간 Vital 수집
      universalVitals.collectVital(
        'e2e-api-response-time',
        'api-performance',
        apiVital.value,
        'ms',
        {
          endpoint: apiEndpoint,
          statusCode: response.status(),
          browserName: playwrightState.browserName,
        }
      );

      return apiVital;
    } catch (error) {
      universalVitals.endMeasurement(apiKey, 'api-performance', 'ms', {
        error: error instanceof Error ? error.message : 'Unknown error',
        endpoint: apiEndpoint,
      });
      throw error;
    }
  },

  // 📈 현재 상태 조회
  getState: () => ({ ...playwrightState }),

  // 🧹 상태 초기화
  reset: () => {
    playwrightState = {
      testStartTime: 0,
      suiteStartTime: 0,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      pageMetrics: new Map(),
      currentTestName: '',
      suiteMetrics: new Map(),
      browserName: 'unknown',
      sessionId: `pw-${Date.now()}`,
    };
  },

  // 📊 최종 E2E 리포트 생성
  generateReport: () => {
    const metrics = universalVitals.getMetricsByCategory('test-execution');
    const webMetrics = universalVitals.getMetricsByCategory('web-performance');
    const apiMetrics = universalVitals.getMetricsByCategory('api-performance');
    const summary = universalVitals.getSummary();

    const report = {
      timestamp: Date.now(),
      sessionId: playwrightState.sessionId,
      browserName: playwrightState.browserName,
      testExecution: {
        totalTests: playwrightState.totalTests,
        passedTests: playwrightState.passedTests,
        failedTests: playwrightState.failedTests,
        successRate:
          playwrightState.totalTests > 0
            ? (playwrightState.passedTests / playwrightState.totalTests) * 100
            : 0,
      },
      vitals: {
        testExecution: metrics,
        webPerformance: webMetrics,
        apiPerformance: apiMetrics,
      },
      summary: {
        totalVitals: summary.total,
        goodVitals: summary.good,
        needsImprovementVitals: summary.needsImprovement,
        poorVitals: summary.poor,
      },
      recommendations: [...metrics, ...webMetrics, ...apiMetrics]
        .filter((m) => m.recommendations && m.recommendations.length > 0)
        .map((m) => ({ metric: m.name, recommendations: m.recommendations })),
    };

    return report;
  },
};

// 🔌 자동 Playwright Hook 통합
export function setupPlaywrightVitals(
  options: {
    suiteName?: string;
    browserName?: string;
    collectWebVitals?: boolean;
    collectBrowserMetrics?: boolean;
    reportEndpoint?: string;
  } = {}
) {
  const {
    suiteName = 'playwright-suite',
    browserName = 'chromium',
    collectWebVitals: _collectWebVitals = true,
    collectBrowserMetrics = true,
    reportEndpoint,
  } = options;

  // 🚀 E2E 테스트 스위트 시작
  test.beforeAll(async () => {
    PlaywrightVitals.reset();
    PlaywrightVitals.startSuite(suiteName, browserName);
  });

  // ⏱️ 각 E2E 테스트 시작
  test.beforeEach(async ({ page }, testInfo) => {
    const testName = testInfo.title || 'unknown-test';
    PlaywrightVitals.startTest(testName, page);

    // 브라우저 메트릭 수집 (테스트 시작 시)
    if (collectBrowserMetrics) {
      await PlaywrightVitals.collectBrowserMetrics(
        page,
        `test-start-${testName}`
      );
    }
  });

  // ✅ 각 E2E 테스트 완료 (성공/실패 자동 감지)
  test.afterEach(async ({ page }, testInfo) => {
    const testName = testInfo.title || 'unknown-test';

    // 브라우저 메트릭 수집 (테스트 완료 시)
    if (collectBrowserMetrics) {
      await PlaywrightVitals.collectBrowserMetrics(
        page,
        `test-end-${testName}`
      );
    }

    // 테스트 결과에 따른 처리
    if (testInfo.status === 'passed') {
      PlaywrightVitals.passTest(testName);
    } else if (testInfo.status === 'failed') {
      const testError = testInfo.errors?.[0];
      const errorToPass = testError
        ? new Error(testError.message || 'Test failed')
        : undefined;
      PlaywrightVitals.failTest(testName, errorToPass);
    }
  });

  // 🏁 E2E 테스트 스위트 완료
  test.afterAll(async () => {
    PlaywrightVitals.endSuite(suiteName);

    // 최종 리포트 생성
    const report = PlaywrightVitals.generateReport();
    console.log('\n📊 [Playwright Vitals] 최종 E2E 리포트:');
    console.log(
      `✅ 성공: ${report.testExecution.passedTests}/${report.testExecution.totalTests}`
    );
    console.log(`📈 성공률: ${report.testExecution.successRate.toFixed(1)}%`);
    console.log(`🎭 브라우저: ${report.browserName}`);
    console.log(
      `🎯 Vitals 품질: ${report.summary.goodVitals}개 Good, ${report.summary.poorVitals}개 Poor`
    );

    // 권장사항 출력
    if (report.recommendations.length > 0) {
      console.log('\n💡 [E2E 성능 개선 권장사항]:');
      report.recommendations.forEach((rec) => {
        console.log(`- ${rec.metric}: ${rec.recommendations?.join(', ')}`);
      });
    }

    // API로 리포트 전송 (선택사항)
    if (reportEndpoint) {
      try {
        const response = await fetch(reportEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source: 'playwright',
            sessionId: report.sessionId,
            timestamp: report.timestamp,
            metrics: universalVitals.getAllMetrics(),
            metadata: {
              browserName: report.browserName,
              testSuite: suiteName,
              environment: process.env.NODE_ENV,
            },
          }),
        });

        if (response.ok) {
          console.log(
            `📤 [Playwright Vitals] E2E 리포트 전송 완료: ${reportEndpoint}`
          );
        }
      } catch (error) {
        console.warn(`⚠️ [Playwright Vitals] E2E 리포트 전송 실패:`, error);
      }
    }
  });
}

// 📝 사용 예시를 위한 헬퍼
export const playwrightExample = {
  // 기본 설정
  setup: `
// tests/setup/playwright-vitals.setup.ts
import { setupPlaywrightVitals } from '@/lib/testing/playwright-vitals-plugin';

setupPlaywrightVitals({
  suiteName: 'my-e2e-suite',
  browserName: 'chromium',
  collectWebVitals: true,
  collectBrowserMetrics: true,
  reportEndpoint: '/api/universal-vitals'
});
  `,

  // 개별 테스트에서 사용
  usage: `
import { test, expect } from '@playwright/test';
import { PlaywrightVitals } from '@/lib/testing/playwright-vitals-plugin';

test('페이지 성능 측정', async ({ page }) => {
  // 페이지 네비게이션 성능 측정
  PlaywrightVitals.startNavigation(page, '/dashboard');
  await page.goto('/dashboard');
  await PlaywrightVitals.endNavigation(page, '/dashboard');

  // API 호출 성능 측정
  const apiVital = await PlaywrightVitals.measureAPICall(page, '/api/servers');
  expect(apiVital.value).toBeLessThan(1000); // 1초 미만

  // 브라우저 메트릭 수집
  const metrics = await PlaywrightVitals.collectBrowserMetrics(page, 'dashboard-test');
  expect(metrics?.usedJSHeapSize).toBeLessThan(50); // 50MB 미만
});
  `,
};
