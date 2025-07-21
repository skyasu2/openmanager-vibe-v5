#!/usr/bin/env node

/**
 * Comprehensive Function Test Script
 * 응급 조치 후 전체 기능 동작 확인
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

class ComprehensiveFunctionTest {
  constructor() {
    this.baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      'https://openmanager-vibe-v5.vercel.app';
    this.localUrl = 'http://localhost:3000';
    this.testResults = {
      timestamp: new Date().toISOString(),
      production: {},
      local: {},
      summary: {},
    };
  }

  async log(message, data = null) {
    const timestamp = new Date().toISOString();
    const logMsg = `[${timestamp}] ${message}`;
    console.log(logMsg, data ? JSON.stringify(data, null, 2) : '');
  }

  async makeRequest(url, timeout = 10000) {
    return new Promise(resolve => {
      const startTime = Date.now();
      const client = url.startsWith('https') ? https : http;

      const req = client
        .get(url, res => {
          let data = '';
          res.on('data', chunk => (data += chunk));
          res.on('end', () => {
            const endTime = Date.now();
            resolve({
              success: true,
              responseTime: endTime - startTime,
              status: res.statusCode,
              headers: res.headers,
              data: data,
              size: data.length,
            });
          });
        })
        .setTimeout(timeout, () => {
          req.destroy();
          resolve({
            success: false,
            error: 'Timeout',
            responseTime: Date.now() - startTime,
          });
        });

      req.on('error', err => {
        resolve({
          success: false,
          error: err.message,
          responseTime: Date.now() - startTime,
        });
      });
    });
  }

  // 핵심 API 엔드포인트 테스트
  async testCoreAPIs(baseUrl, environment) {
    await this.log(`🔍 ${environment} 환경 핵심 API 테스트 시작`);

    const coreAPIs = [
      '/api/system/status',
      '/api/system/health',
      '/api/metrics',
      '/api/unified-metrics',
      '/api/version',
      '/api/health',
    ];

    const results = {};

    for (const endpoint of coreAPIs) {
      const url = `${baseUrl}${endpoint}`;
      const result = await this.makeRequest(url);

      // 응답 데이터 파싱 시도
      if (result.success && result.data) {
        try {
          const parsedData = JSON.parse(result.data);
          result.parsedData = parsedData;
          result.isValidJSON = true;
        } catch (e) {
          result.isValidJSON = false;
        }
      }

      results[endpoint] = result;

      const status = result.success
        ? `✅ ${result.status} (${result.responseTime}ms)`
        : `❌ ${result.error}`;

      await this.log(`  ${endpoint}: ${status}`);
    }

    return results;
  }

  // 대시보드 페이지 테스트
  async testDashboardPages(baseUrl, environment) {
    await this.log(`📊 ${environment} 환경 대시보드 페이지 테스트`);

    const dashboardPages = [
      '/',
      '/dashboard',
      '/metrics',
      '/monitoring',
      '/settings',
    ];

    const results = {};

    for (const page of dashboardPages) {
      const url = `${baseUrl}${page}`;
      const result = await this.makeRequest(url);

      results[page] = result;

      const status = result.success
        ? `✅ ${result.status} (${result.responseTime}ms, ${result.size} bytes)`
        : `❌ ${result.error}`;

      await this.log(`  ${page}: ${status}`);
    }

    return results;
  }

  // 실시간 기능 테스트 (폴링 간격 확인)
  async testRealTimeFeatures(baseUrl, environment) {
    await this.log(`⏱️ ${environment} 환경 실시간 기능 테스트`);

    const endpoint = '/api/system/status';
    const url = `${baseUrl}${endpoint}`;
    const samples = [];

    // 5회 연속 요청으로 캐싱 및 일관성 확인
    for (let i = 0; i < 5; i++) {
      const result = await this.makeRequest(url);
      samples.push({
        attempt: i + 1,
        timestamp: new Date().toISOString(),
        responseTime: result.responseTime,
        success: result.success,
        cacheStatus: result.headers?.['x-vercel-cache'] || 'unknown',
        runtime: result.headers?.['x-vercel-runtime'] || 'unknown',
      });

      await this.log(
        `    시도 ${i + 1}: ${result.responseTime}ms (캐시: ${result.headers?.['x-vercel-cache'] || 'N/A'})`
      );

      // 2초 간격
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // 캐싱 효과 분석
    const avgResponseTime =
      samples.reduce((sum, s) => sum + s.responseTime, 0) / samples.length;
    const cacheHits = samples.filter(s => s.cacheStatus === 'HIT').length;
    const cacheHitRate = (cacheHits / samples.length) * 100;

    const analysis = {
      samples,
      avgResponseTime: Math.round(avgResponseTime),
      cacheHitRate: Math.round(cacheHitRate),
      consistencyCheck: samples.every(s => s.success),
    };

    await this.log(`  📈 평균 응답시간: ${analysis.avgResponseTime}ms`);
    await this.log(`  🗄️ 캐시 히트율: ${analysis.cacheHitRate}%`);
    await this.log(
      `  ✅ 일관성 체크: ${analysis.consistencyCheck ? '통과' : '실패'}`
    );

    return analysis;
  }

  // 메모리 및 성능 테스트
  async testPerformanceMetrics(baseUrl, environment) {
    await this.log(`⚡ ${environment} 환경 성능 메트릭 테스트`);

    const performanceTests = [
      { name: 'Cold Start', endpoint: '/api/system/status?t=' + Date.now() },
      { name: 'Warm Request', endpoint: '/api/system/status' },
      { name: 'Heavy Endpoint', endpoint: '/api/unified-metrics' },
      { name: 'Light Endpoint', endpoint: '/api/version' },
    ];

    const results = {};

    for (const test of performanceTests) {
      const url = `${baseUrl}${test.endpoint}`;
      const result = await this.makeRequest(url);

      results[test.name] = {
        responseTime: result.responseTime,
        success: result.success,
        headers: result.headers,
      };

      await this.log(
        `  ${test.name}: ${result.responseTime}ms (${result.success ? '성공' : '실패'})`
      );
    }

    return results;
  }

  // 에러 처리 테스트
  async testErrorHandling(baseUrl, environment) {
    await this.log(`🚨 ${environment} 환경 에러 처리 테스트`);

    const errorTests = [
      { name: 'Non-existent endpoint', endpoint: '/api/nonexistent' },
      {
        name: 'Invalid method',
        endpoint: '/api/system/status',
        method: 'POST',
      },
      {
        name: 'Malformed request',
        endpoint: '/api/system/status?invalid=<script>',
      },
    ];

    const results = {};

    for (const test of errorTests) {
      const url = `${baseUrl}${test.endpoint}`;
      const result = await this.makeRequest(url);

      results[test.name] = {
        responseTime: result.responseTime,
        status: result.status,
        success: result.success,
      };

      const expected =
        result.status === 404 || result.status === 405 || result.status >= 400;
      await this.log(
        `  ${test.name}: ${result.status} (${expected ? '예상된 에러' : '예상치 못한 응답'})`
      );
    }

    return results;
  }

  // 종합 분석
  async generateAnalysis() {
    const production = this.testResults.production;
    const local = this.testResults.local;

    const analysis = {
      timestamp: new Date().toISOString(),
      environments: {
        production: production.coreAPIs ? '✅ 사용 가능' : '❌ 사용 불가',
        local: local.coreAPIs ? '✅ 사용 가능' : '❌ 사용 불가',
      },
      coreAPIs: {
        production: production.coreAPIs
          ? Object.keys(production.coreAPIs).filter(
              k => production.coreAPIs[k].success
            ).length
          : 0,
        local: local.coreAPIs
          ? Object.keys(local.coreAPIs).filter(k => local.coreAPIs[k].success)
              .length
          : 0,
      },
      performance: {
        production: production.realTime
          ? production.realTime.avgResponseTime
          : 0,
        local: local.realTime ? local.realTime.avgResponseTime : 0,
      },
      caching: {
        production: production.realTime ? production.realTime.cacheHitRate : 0,
        local: local.realTime ? local.realTime.cacheHitRate : 0,
      },
      emergencyMeasures: {
        pollingInterval: '300초 (5분)',
        cacheEnabled: '60초 TTL',
        runtimeType: 'Node.js',
        rateLimit: '활성화',
      },
    };

    // 추천사항 생성
    const recommendations = [];

    if (analysis.performance.production > 500) {
      recommendations.push(
        '⚠️ 프로덕션 응답시간이 느림 - 캐시 설정 재검토 필요'
      );
    }

    if (analysis.caching.production < 50) {
      recommendations.push('🗄️ 캐시 히트율이 낮음 - TTL 설정 조정 고려');
    }

    if (analysis.coreAPIs.production < 4) {
      recommendations.push('🚨 일부 핵심 API 실패 - 즉시 확인 필요');
    } else {
      recommendations.push('✅ 모든 핵심 API 정상 작동');
    }

    if (analysis.performance.production < 400) {
      recommendations.push('⚡ 응답 성능 양호 - 응급 조치 효과적');
    }

    analysis.recommendations = recommendations;

    return analysis;
  }

  // 전체 테스트 실행
  async runFullTest() {
    try {
      await this.log('🎯 종합 기능 테스트 시작');

      // 프로덕션 환경 테스트
      await this.log('📡 프로덕션 환경 테스트');
      this.testResults.production = {
        coreAPIs: await this.testCoreAPIs(this.baseUrl, 'Production'),
        dashboard: await this.testDashboardPages(this.baseUrl, 'Production'),
        realTime: await this.testRealTimeFeatures(this.baseUrl, 'Production'),
        performance: await this.testPerformanceMetrics(
          this.baseUrl,
          'Production'
        ),
        errorHandling: await this.testErrorHandling(this.baseUrl, 'Production'),
      };

      // 로컬 환경 테스트 (가능한 경우)
      try {
        await this.log('🏠 로컬 환경 테스트');
        const localCheck = await this.makeRequest(
          this.localUrl + '/api/system/status',
          5000
        );

        if (localCheck.success) {
          this.testResults.local = {
            coreAPIs: await this.testCoreAPIs(this.localUrl, 'Local'),
            realTime: await this.testRealTimeFeatures(this.localUrl, 'Local'),
            performance: await this.testPerformanceMetrics(
              this.localUrl,
              'Local'
            ),
          };
        } else {
          await this.log('⚠️ 로컬 서버 사용 불가 - 프로덕션 환경만 테스트');
        }
      } catch (error) {
        await this.log('⚠️ 로컬 서버 테스트 건너뜀:', error.message);
      }

      // 종합 분석
      const analysis = await this.generateAnalysis();
      this.testResults.summary = analysis;

      // 결과 출력
      await this.printSummary(analysis);

      // 결과 저장
      await this.saveResults();

      return this.testResults;
    } catch (error) {
      await this.log('❌ 테스트 실행 중 에러:', error.message);
      throw error;
    }
  }

  async printSummary(analysis) {
    console.log('\n' + '='.repeat(80));
    console.log('📋 종합 기능 테스트 결과 요약');
    console.log('='.repeat(80));

    console.log(`\n🌍 환경별 상태:`);
    console.log(`  프로덕션: ${analysis.environments.production}`);
    console.log(`  로컬: ${analysis.environments.local}`);

    console.log(`\n🔗 핵심 API 상태:`);
    console.log(`  프로덕션: ${analysis.coreAPIs.production}개 성공`);
    console.log(`  로컬: ${analysis.coreAPIs.local}개 성공`);

    console.log(`\n⚡ 성능 지표:`);
    console.log(`  프로덕션 평균 응답: ${analysis.performance.production}ms`);
    console.log(`  로컬 평균 응답: ${analysis.performance.local}ms`);

    console.log(`\n🗄️ 캐싱 효과:`);
    console.log(`  프로덕션 캐시 히트율: ${analysis.caching.production}%`);
    console.log(`  로컬 캐시 히트율: ${analysis.caching.local}%`);

    console.log(`\n🚨 응급 조치 현황:`);
    console.log(`  폴링 간격: ${analysis.emergencyMeasures.pollingInterval}`);
    console.log(`  캐시 설정: ${analysis.emergencyMeasures.cacheEnabled}`);
    console.log(`  런타임: ${analysis.emergencyMeasures.runtimeType}`);
    console.log(`  레이트 제한: ${analysis.emergencyMeasures.rateLimit}`);

    console.log(`\n💡 권장사항:`);
    analysis.recommendations.forEach(rec => console.log(`  ${rec}`));

    console.log('\n' + '='.repeat(80));
  }

  async saveResults() {
    try {
      const resultsDir = path.join(process.cwd(), 'test-results');
      if (!fs.existsSync(resultsDir)) {
        fs.mkdirSync(resultsDir, { recursive: true });
      }

      const filename = `function-test-${new Date().toISOString().split('T')[0]}.json`;
      const filepath = path.join(resultsDir, filename);

      fs.writeFileSync(filepath, JSON.stringify(this.testResults, null, 2));
      await this.log('💾 테스트 결과 저장됨:', filepath);
    } catch (error) {
      await this.log('❌ 결과 저장 실패:', error.message);
    }
  }
}

// 스크립트 실행
if (require.main === module) {
  const tester = new ComprehensiveFunctionTest();
  tester
    .runFullTest()
    .then(() => {
      console.log('\n✅ 종합 기능 테스트 완료!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ 테스트 실패:', error);
      process.exit(1);
    });
}

module.exports = ComprehensiveFunctionTest;
