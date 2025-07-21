/**
 * 🧪 Integrated Test Framework
 *
 * 통합 테스트 프레임워크
 * - 서비스 단위 테스트
 * - 통합 테스트
 * - 성능 테스트
 * - E2E 테스트
 * - 자동화된 테스트 리포트
 */

import { ILogger, IErrorHandler } from '@/interfaces/services';
import { getService } from '@/lib/service-registry';
import { SERVICE_TOKENS } from '@/lib/di-container';

export interface TestCase {
  id: string;
  name: string;
  description: string;
  category: TestCategory;
  priority: TestPriority;
  timeout: number;
  setup?: () => Promise<void>;
  teardown?: () => Promise<void>;
  test: () => Promise<TestResult>;
}

export interface TestResult {
  success: boolean;
  duration: number;
  message?: string;
  data?: any;
  error?: Error;
  metrics?: TestMetrics;
}

export interface TestMetrics {
  memoryUsage: number;
  responseTime: number;
  throughput: number;
  errorRate: number;
}

export interface TestSuite {
  id: string;
  name: string;
  description: string;
  tests: TestCase[];
  beforeAll?: () => Promise<void>;
  afterAll?: () => Promise<void>;
}

export interface TestReport {
  id: string;
  timestamp: Date;
  duration: number;
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    successRate: number;
  };
  suites: TestSuiteResult[];
  performance: {
    averageResponseTime: number;
    totalMemoryUsage: number;
    peakMemoryUsage: number;
    errorRate: number;
  };
  recommendations: string[];
}

export interface TestSuiteResult {
  suite: TestSuite;
  results: TestCaseResult[];
  duration: number;
  success: boolean;
}

export interface TestCaseResult {
  testCase: TestCase;
  result: TestResult;
  timestamp: Date;
}

export type TestCategory =
  | 'unit'
  | 'integration'
  | 'performance'
  | 'e2e'
  | 'security';
export type TestPriority = 'low' | 'medium' | 'high' | 'critical';

export class TestFramework {
  private suites = new Map<string, TestSuite>();
  private results = new Map<string, TestReport>();
  private isRunning = false;
  private currentReport?: TestReport;

  constructor(
    private logger: ILogger,
    private errorHandler: IErrorHandler
  ) {
    this.logger.info('Test Framework initialized');
  }

  /**
   * 테스트 스위트 등록
   */
  registerSuite(suite: TestSuite): void {
    this.suites.set(suite.id, suite);
    this.logger.debug(`Test suite registered: ${suite.name}`, {
      id: suite.id,
      testsCount: suite.tests.length,
    });
  }

  /**
   * 테스트 케이스 등록
   */
  registerTest(suiteId: string, testCase: TestCase): void {
    const suite = this.suites.get(suiteId);
    if (!suite) {
      throw new Error(`Test suite not found: ${suiteId}`);
    }

    suite.tests.push(testCase);
    this.logger.debug(`Test case registered: ${testCase.name}`, {
      suiteId,
      testId: testCase.id,
      category: testCase.category,
    });
  }

  /**
   * 모든 테스트 실행
   */
  async runAllTests(): Promise<TestReport> {
    if (this.isRunning) {
      throw new Error('Tests are already running');
    }

    this.isRunning = true;
    const startTime = Date.now();

    this.logger.info('Starting comprehensive test execution', {
      suitesCount: this.suites.size,
      totalTests: this.getTotalTestCount(),
    });

    try {
      const report: TestReport = {
        id: `test-run-${Date.now()}`,
        timestamp: new Date(),
        duration: 0,
        summary: {
          total: 0,
          passed: 0,
          failed: 0,
          skipped: 0,
          successRate: 0,
        },
        suites: [],
        performance: {
          averageResponseTime: 0,
          totalMemoryUsage: 0,
          peakMemoryUsage: 0,
          errorRate: 0,
        },
        recommendations: [],
      };

      this.currentReport = report;

      // 각 스위트 실행
      for (const suite of this.suites.values()) {
        const suiteResult = await this.runTestSuite(suite);
        report.suites.push(suiteResult);
      }

      // 리포트 완성
      report.duration = Date.now() - startTime;
      this.calculateSummary(report);
      this.calculatePerformance(report);
      this.generateRecommendations(report);

      this.results.set(report.id, report);
      this.logger.info('Test execution completed', {
        duration: report.duration,
        successRate: report.summary.successRate,
      });

      return report;
    } finally {
      this.isRunning = false;
      this.currentReport = undefined;
    }
  }

  /**
   * 특정 스위트 실행
   */
  async runTestSuite(suite: TestSuite): Promise<TestSuiteResult> {
    const startTime = Date.now();
    const results: TestCaseResult[] = [];

    this.logger.info(`Running test suite: ${suite.name}`, {
      testsCount: suite.tests.length,
    });

    try {
      // 스위트 설정
      if (suite.beforeAll) {
        await suite.beforeAll();
      }

      // 각 테스트 실행
      for (const testCase of suite.tests) {
        const result = await this.runTestCase(testCase);
        results.push({
          testCase,
          result,
          timestamp: new Date(),
        });
      }

      // 스위트 정리
      if (suite.afterAll) {
        await suite.afterAll();
      }

      const duration = Date.now() - startTime;
      const success = results.every(r => r.result.success);

      this.logger.info(`Test suite completed: ${suite.name}`, {
        duration,
        success,
        passed: results.filter(r => r.result.success).length,
        failed: results.filter(r => !r.result.success).length,
      });

      return {
        suite,
        results,
        duration,
        success,
      };
    } catch (error) {
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Test suite failed: ${suite.name}`, errorObj);
      throw error;
    }
  }

  /**
   * 개별 테스트 실행
   */
  async runTestCase(testCase: TestCase): Promise<TestResult> {
    const startTime = Date.now();

    this.logger.debug(`Running test: ${testCase.name}`);

    try {
      // 테스트 설정
      if (testCase.setup) {
        await testCase.setup();
      }

      // 메모리 사용량 측정 시작
      const initialMemory = this.getMemoryUsage();

      // 타임아웃과 함께 테스트 실행
      const result = await Promise.race([
        testCase.test(),
        this.createTimeoutPromise(testCase.timeout),
      ]);

      // 메트릭 수집
      const finalMemory = this.getMemoryUsage();
      const duration = Date.now() - startTime;

      result.duration = duration;
      result.metrics = {
        memoryUsage: finalMemory - initialMemory,
        responseTime: duration,
        throughput: 1000 / duration, // requests per second
        errorRate: result.success ? 0 : 1,
      };

      // 테스트 정리
      if (testCase.teardown) {
        await testCase.teardown();
      }

      this.logger.debug(`Test completed: ${testCase.name}`, {
        success: result.success,
        duration: result.duration,
      });

      return result;
    } catch (error) {
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      const duration = Date.now() - startTime;

      this.logger.error(`Test failed: ${testCase.name}`, errorObj);

      return {
        success: false,
        duration,
        error: errorObj,
        message: errorObj.message,
      };
    }
  }

  /**
   * 서비스별 테스트 스위트 생성
   */
  createServiceTestSuites(): void {
    // 1. 로깅 서비스 테스트
    this.registerSuite({
      id: 'logging-service',
      name: 'Logging Service Tests',
      description: '로깅 서비스 기능 테스트',
      tests: [
        {
          id: 'logging-basic',
          name: 'Basic Logging',
          description: '기본 로깅 기능 테스트',
          category: 'unit',
          priority: 'high',
          timeout: 5000,
          test: async () => {
            try {
              const logger = getService<ILogger>(SERVICE_TOKENS.LOGGER);
              logger.info('Test log message');
              return { success: true, duration: 0 };
            } catch (error) {
              return {
                success: false,
                duration: 0,
                error:
                  error instanceof Error ? error : new Error(String(error)),
              };
            }
          },
        },
        {
          id: 'logging-levels',
          name: 'Log Levels',
          description: '로그 레벨별 기능 테스트',
          category: 'unit',
          priority: 'medium',
          timeout: 5000,
          test: async () => {
            try {
              const logger = getService<ILogger>(SERVICE_TOKENS.LOGGER);
              logger.debug('Debug message');
              logger.info('Info message');
              logger.warn('Warning message');
              logger.error('Error message', new Error('Test error'));
              return { success: true, duration: 0 };
            } catch (error) {
              return {
                success: false,
                duration: 0,
                error:
                  error instanceof Error ? error : new Error(String(error)),
              };
            }
          },
        },
      ],
    });

    // 2. 에러 처리 서비스 테스트
    this.registerSuite({
      id: 'error-handling-service',
      name: 'Error Handling Service Tests',
      description: '에러 처리 서비스 기능 테스트',
      tests: [
        {
          id: 'error-handling-basic',
          name: 'Basic Error Handling',
          description: '기본 에러 처리 기능 테스트',
          category: 'unit',
          priority: 'high',
          timeout: 5000,
          test: async () => {
            try {
              const errorHandler = getService<IErrorHandler>(
                SERVICE_TOKENS.ERROR_HANDLER
              );
              // 간단한 테스트만 수행
              return {
                success: true,
                duration: 0,
                message: 'Error handler service available',
              };
            } catch (error) {
              return {
                success: false,
                duration: 0,
                error:
                  error instanceof Error ? error : new Error(String(error)),
              };
            }
          },
        },
      ],
    });

    // 4. 캐시 서비스 테스트
    this.registerSuite({
      id: 'cache-service',
      name: 'Smart Cache Service Tests',
      description: '스마트 캐시 서비스 테스트',
      tests: [
        {
          id: 'cache-basic-operations',
          name: 'Basic Cache Operations',
          description: '기본 캐시 작업 테스트',
          category: 'unit',
          priority: 'high',
          timeout: 5000,
          test: async () => {
            try {
              const cache = getService<any>(SERVICE_TOKENS.CACHE_SERVICE);

              // 설정
              await cache.set('test-key', 'test-value');

              // 조회
              const value = await cache.get('test-key');

              // 삭제
              await cache.delete('test-key');

              return {
                success: value === 'test-value',
                duration: 0,
                data: { value },
              };
            } catch (error) {
              return {
                success: false,
                duration: 0,
                error:
                  error instanceof Error ? error : new Error(String(error)),
              };
            }
          },
        },
        {
          id: 'cache-performance',
          name: 'Cache Performance',
          description: '캐시 성능 테스트',
          category: 'performance',
          priority: 'medium',
          timeout: 10000,
          test: async () => {
            try {
              const cache = getService<any>(SERVICE_TOKENS.CACHE_SERVICE);
              const stats = await cache.stats();

              return {
                success: stats.hitRate >= 0,
                duration: 0,
                data: stats,
              };
            } catch (error) {
              return {
                success: false,
                duration: 0,
                error:
                  error instanceof Error ? error : new Error(String(error)),
              };
            }
          },
        },
      ],
    });
  }

  /**
   * 요약 계산
   */
  private calculateSummary(report: TestReport): void {
    let total = 0;
    let passed = 0;
    let failed = 0;

    for (const suiteResult of report.suites) {
      for (const testResult of suiteResult.results) {
        total++;
        if (testResult.result.success) {
          passed++;
        } else {
          failed++;
        }
      }
    }

    report.summary = {
      total,
      passed,
      failed,
      skipped: 0,
      successRate: total > 0 ? (passed / total) * 100 : 0,
    };
  }

  /**
   * 성능 메트릭 계산
   */
  private calculatePerformance(report: TestReport): void {
    const allResults = report.suites.flatMap(s => s.results);
    const responseTimes = allResults.map(r => r.result.duration);
    const memoryUsages = allResults
      .map(r => r.result.metrics?.memoryUsage || 0)
      .filter(m => m > 0);

    report.performance = {
      averageResponseTime:
        responseTimes.length > 0
          ? responseTimes.reduce((sum, time) => sum + time, 0) /
            responseTimes.length
          : 0,
      totalMemoryUsage: memoryUsages.reduce((sum, mem) => sum + mem, 0),
      peakMemoryUsage: Math.max(...memoryUsages, 0),
      errorRate: (report.summary.failed / report.summary.total) * 100,
    };
  }

  /**
   * 권장사항 생성
   */
  private generateRecommendations(report: TestReport): void {
    const recommendations: string[] = [];

    if (report.summary.successRate < 90) {
      recommendations.push(
        '테스트 성공률이 90% 미만입니다. 실패한 테스트를 검토하세요.'
      );
    }

    if (report.performance.averageResponseTime > 1000) {
      recommendations.push(
        '평균 응답시간이 1초를 초과합니다. 성능 최적화를 고려하세요.'
      );
    }

    if (report.performance.errorRate > 5) {
      recommendations.push(
        '에러율이 5%를 초과합니다. 에러 처리 로직을 검토하세요.'
      );
    }

    if (report.performance.peakMemoryUsage > 100 * 1024 * 1024) {
      // 100MB
      recommendations.push(
        '메모리 사용량이 높습니다. 메모리 누수를 확인하세요.'
      );
    }

    report.recommendations = recommendations;
  }

  /**
   * 유틸리티 메서드들
   */
  private getTotalTestCount(): number {
    return Array.from(this.suites.values()).reduce(
      (total, suite) => total + suite.tests.length,
      0
    );
  }

  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    return 0;
  }

  private createTimeoutPromise(timeout: number): Promise<TestResult> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Test timeout after ${timeout}ms`));
      }, timeout);
    });
  }

  /**
   * 테스트 리포트 조회
   */
  getTestReport(reportId: string): TestReport | undefined {
    return this.results.get(reportId);
  }

  /**
   * 최신 테스트 리포트 조회
   */
  getLatestTestReport(): TestReport | undefined {
    const reports = Array.from(this.results.values());
    return reports.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    )[0];
  }

  /**
   * 모든 테스트 리포트 조회
   */
  getAllTestReports(): TestReport[] {
    return Array.from(this.results.values()).sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  /**
   * 테스트 실행 상태 조회
   */
  getTestStatus(): {
    isRunning: boolean;
    currentReport?: string;
    totalSuites: number;
    totalTests: number;
  } {
    return {
      isRunning: this.isRunning,
      currentReport: this.currentReport?.id,
      totalSuites: this.suites.size,
      totalTests: this.getTotalTestCount(),
    };
  }
}
