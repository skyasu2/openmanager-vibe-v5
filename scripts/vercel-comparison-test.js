#!/usr/bin/env node

/**
 * Vercel Emergency Measures Comparison Test
 * 응급 조치 전후 비교 분석 도구
 */

const scenarios = {
  // 위기 상황 시뮬레이션 (이전 설정)
  crisis: {
    name: 'Crisis Simulation (Previous Settings)',
    description: 'Edge Runtime + No Caching + 10s Polling',
    config: {
      pollingInterval: 10000, // 10초
      cacheEnabled: false,
      rateLimit: false,
      schedulerInterval: 20000, // 20초
    },
    expectedDaily: 920000,
  },

  // 응급 조치 후 (현재 설정)
  emergency: {
    name: 'Emergency Measures (Current Settings)',
    description: 'Node.js Runtime + 60s Caching + 300s Polling',
    config: {
      pollingInterval: 300000, // 5분
      cacheEnabled: true,
      cacheTtl: 60,
      rateLimit: true,
      schedulerInterval: 600000, // 10분
    },
    expectedDaily: 10000,
  },

  // 최적화된 설정 (권장)
  optimized: {
    name: 'Optimized Settings (Recommended)',
    description: 'Balanced performance + cost efficiency',
    config: {
      pollingInterval: 120000, // 2분
      cacheEnabled: true,
      cacheTtl: 120,
      rateLimit: true,
      schedulerInterval: 300000, // 5분
    },
    expectedDaily: 25000,
  },
};

class VercelComparisonTest {
  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    this.results = {};
  }

  async log(message, data = null) {
    const timestamp = new Date().toISOString();
    console.log(
      `[${timestamp}] ${message}`,
      data ? JSON.stringify(data, null, 2) : ''
    );
  }

  // 시나리오별 성능 테스트
  async testScenario(scenarioKey, scenario, testDurationMs = 60000) {
    await this.log(`🧪 Testing scenario: ${scenario.name}`);
    await this.log(`📝 ${scenario.description}`);

    const startTime = Date.now();
    const endTime = startTime + testDurationMs;
    const requests = [];
    let requestCount = 0;

    // 실제 폴링 간격으로 요청 시뮬레이션
    while (Date.now() < endTime) {
      const batchStart = Date.now();

      try {
        // 시스템 상태 API 호출 (주요 부하 원인)
        const statusPromise = this.makeRequest(
          '/api/system/status',
          scenario.config
        );

        // 건강 상태 체크 (보조 요청)
        const healthPromise = this.makeRequest(
          '/api/system/health',
          scenario.config
        );

        const [statusResult, healthResult] = await Promise.allSettled([
          statusPromise,
          healthPromise,
        ]);

        requests.push({
          timestamp: new Date().toISOString(),
          batchDuration: Date.now() - batchStart,
          status:
            statusResult.status === 'fulfilled' ? statusResult.value : null,
          health:
            healthResult.status === 'fulfilled' ? healthResult.value : null,
        });

        requestCount += 2; // status + health
      } catch (error) {
        await this.log(`❌ Request error in ${scenarioKey}:`, error.message);
      }

      // 다음 폴링까지 대기
      const waitTime =
        scenario.config.pollingInterval - (Date.now() - batchStart);
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    const totalDuration = Date.now() - startTime;
    const avgRequestsPerMinute = (requestCount / totalDuration) * 60 * 1000;
    const projectedDailyRequests = avgRequestsPerMinute * 60 * 24;

    // 응답 시간 분석
    const responseTimes = requests
      .flatMap(r => [r.status?.responseTime, r.health?.responseTime])
      .filter(rt => rt && rt > 0);

    const avgResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;

    // 캐시 효과 분석
    const cachedResponses = requests
      .flatMap(r => [r.status, r.health])
      .filter(resp => resp && resp.cacheStatus === 'HIT');

    const cacheHitRate =
      requests.length > 0
        ? (cachedResponses.length / (requests.length * 2)) * 100
        : 0;

    const result = {
      scenario: scenario.name,
      config: scenario.config,
      testDuration: Math.round(totalDuration / 1000),
      totalRequests: requestCount,
      avgRequestsPerMinute: Math.round(avgRequestsPerMinute),
      projectedDailyRequests: Math.round(projectedDailyRequests),
      avgResponseTime: Math.round(avgResponseTime),
      cacheHitRate: Math.round(cacheHitRate),
      expectedDaily: scenario.expectedDaily,
      actualVsExpected: Math.round(
        (projectedDailyRequests / scenario.expectedDaily) * 100
      ),
      requests: requests.slice(-5), // 최근 5개 요청만 저장
    };

    this.results[scenarioKey] = result;

    await this.log(`✅ Scenario ${scenarioKey} completed:`, {
      projectedDaily: result.projectedDailyRequests.toLocaleString(),
      avgResponse: `${result.avgResponseTime}ms`,
      cacheHitRate: `${result.cacheHitRate}%`,
      actualVsExpected: `${result.actualVsExpected}%`,
    });

    return result;
  }

  // HTTP 요청 실행
  async makeRequest(endpoint, config) {
    const startTime = Date.now();
    const url = `${this.baseUrl}${endpoint}`;

    // 캐시 무효화 (crisis 시나리오에서)
    const requestUrl = config.cacheEnabled ? url : `${url}?t=${Date.now()}`;

    try {
      const response = await fetch(requestUrl, {
        headers: config.cacheEnabled
          ? {}
          : {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
      });

      const endTime = Date.now();

      return {
        responseTime: endTime - startTime,
        status: response.status,
        ok: response.ok,
        cacheStatus: response.headers.get('x-vercel-cache') || 'none',
        runtime: response.headers.get('x-vercel-runtime') || 'unknown',
      };
    } catch (error) {
      return {
        responseTime: Date.now() - startTime,
        status: 0,
        ok: false,
        error: error.message,
      };
    }
  }

  // 비교 분석 리포트 생성
  generateComparisonReport() {
    console.log('\n' + '='.repeat(100));
    console.log('📊 VERCEL EMERGENCY MEASURES - COMPARISON ANALYSIS REPORT');
    console.log('='.repeat(100));

    const crisisResult = this.results.crisis;
    const emergencyResult = this.results.emergency;
    const optimizedResult = this.results.optimized;

    if (crisisResult && emergencyResult) {
      // 핵심 지표 비교
      console.log('\n🎯 KEY METRICS COMPARISON:');
      console.log(
        '┌─────────────────────────┬─────────────┬──────────────┬─────────────┐'
      );
      console.log(
        '│ Metric                  │ Crisis      │ Emergency    │ Optimized   │'
      );
      console.log(
        '├─────────────────────────┼─────────────┼──────────────┼─────────────┤'
      );
      console.log(
        `│ Daily Requests          │ ${crisisResult.projectedDailyRequests.toLocaleString().padEnd(11)} │ ${emergencyResult.projectedDailyRequests.toLocaleString().padEnd(12)} │ ${optimizedResult?.projectedDailyRequests.toLocaleString().padEnd(11) || 'N/A'.padEnd(11)} │`
      );
      console.log(
        `│ Avg Response Time       │ ${crisisResult.avgResponseTime}ms${' '.repeat(8 - crisisResult.avgResponseTime.toString().length)} │ ${emergencyResult.avgResponseTime}ms${' '.repeat(9 - emergencyResult.avgResponseTime.toString().length)} │ ${optimizedResult?.avgResponseTime || 'N/A'}ms${' '.repeat(8 - (optimizedResult?.avgResponseTime?.toString().length || 3))} │`
      );
      console.log(
        `│ Cache Hit Rate          │ ${crisisResult.cacheHitRate}%${' '.repeat(10 - crisisResult.cacheHitRate.toString().length)} │ ${emergencyResult.cacheHitRate}%${' '.repeat(11 - emergencyResult.cacheHitRate.toString().length)} │ ${optimizedResult?.cacheHitRate || 'N/A'}%${' '.repeat(10 - (optimizedResult?.cacheHitRate?.toString().length || 3))} │`
      );
      console.log(
        '└─────────────────────────┴─────────────┴──────────────┴─────────────┘'
      );

      // 개선 효과 계산
      const requestImprovement =
        ((crisisResult.projectedDailyRequests -
          emergencyResult.projectedDailyRequests) /
          crisisResult.projectedDailyRequests) *
        100;
      const responseImprovement =
        ((crisisResult.avgResponseTime - emergencyResult.avgResponseTime) /
          crisisResult.avgResponseTime) *
        100;

      console.log('\n📈 IMPROVEMENT ANALYSIS:');
      console.log(
        `🔥 Request Reduction: ${Math.round(requestImprovement)}% (${crisisResult.projectedDailyRequests.toLocaleString()} → ${emergencyResult.projectedDailyRequests.toLocaleString()})`
      );
      console.log(
        `⚡ Response Time: ${responseImprovement > 0 ? Math.round(responseImprovement) + '% faster' : Math.round(Math.abs(responseImprovement)) + '% slower'}`
      );
      console.log(
        `🗄️ Cache Effectiveness: ${emergencyResult.cacheHitRate}% hit rate (vs ${crisisResult.cacheHitRate}% in crisis)`
      );

      // 비용 영향 추정
      console.log('\n💰 ESTIMATED COST IMPACT:');
      const crisisCost = crisisResult.projectedDailyRequests * 0.0000002; // 예상 단가
      const emergencyCost = emergencyResult.projectedDailyRequests * 0.0000002;
      const monthlySavings = (crisisCost - emergencyCost) * 30;

      console.log(`📊 Daily Cost - Crisis: $${crisisCost.toFixed(4)}`);
      console.log(`📊 Daily Cost - Emergency: $${emergencyCost.toFixed(4)}`);
      console.log(`💵 Monthly Savings: $${monthlySavings.toFixed(2)}`);

      // 권장사항
      console.log('\n🎯 RECOMMENDATIONS:');
      if (requestImprovement > 90) {
        console.log('✅ Emergency measures are HIGHLY EFFECTIVE');
        console.log('✅ Crisis successfully resolved');
        console.log(
          '⚠️  Consider gradual optimization to restore some real-time features'
        );
      } else if (requestImprovement > 70) {
        console.log('✅ Emergency measures are EFFECTIVE');
        console.log('⚠️  Monitor usage closely');
        console.log('💡 Consider further optimization');
      } else {
        console.log('❌ Emergency measures may be INSUFFICIENT');
        console.log('🚨 Additional measures may be required');
      }

      if (optimizedResult) {
        console.log('\n🔧 OPTIMIZATION POTENTIAL:');
        const optimizedImprovement =
          ((crisisResult.projectedDailyRequests -
            optimizedResult.projectedDailyRequests) /
            crisisResult.projectedDailyRequests) *
          100;
        console.log(
          `📊 Optimized scenario: ${Math.round(optimizedImprovement)}% improvement vs crisis`
        );
        console.log(
          `⚖️  Balance: Better performance than emergency, still ${Math.round(((emergencyResult.projectedDailyRequests - optimizedResult.projectedDailyRequests) / emergencyResult.projectedDailyRequests) * 100)}% more efficient`
        );
      }
    }

    console.log('\n' + '='.repeat(100));
    return this.results;
  }

  // 전체 비교 테스트 실행
  async runFullComparison(testDurationSeconds = 60) {
    await this.log('🚀 Starting comprehensive comparison test');

    const testDuration = testDurationSeconds * 1000;

    // 시나리오별 순차 테스트 (리소스 충돌 방지)
    for (const [key, scenario] of Object.entries(scenarios)) {
      await this.testScenario(key, scenario, testDuration);

      // 시나리오 간 휴식 시간
      if (key !== Object.keys(scenarios)[Object.keys(scenarios).length - 1]) {
        await this.log('⏸️  Resting between scenarios...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    // 최종 비교 리포트 생성
    const report = this.generateComparisonReport();

    // 결과 저장
    await this.saveResults(report);

    return report;
  }

  async saveResults(report) {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');

      const resultsDir = path.join(process.cwd(), 'test-results');
      await fs.mkdir(resultsDir, { recursive: true });

      const filename = `vercel-comparison-${new Date().toISOString().split('T')[0]}.json`;
      const filepath = path.join(resultsDir, filename);

      await fs.writeFile(filepath, JSON.stringify(report, null, 2));
      await this.log('💾 Comparison results saved', { filepath });
    } catch (error) {
      await this.log('❌ Failed to save results', error.message);
    }
  }
}

// 스크립트 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  const duration = parseInt(process.argv[2]) || 60;

  const tester = new VercelComparisonTest();
  tester
    .runFullComparison(duration)
    .then(() => {
      console.log('\n✅ Comparison test completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Comparison test failed:', error);
      process.exit(1);
    });
}
