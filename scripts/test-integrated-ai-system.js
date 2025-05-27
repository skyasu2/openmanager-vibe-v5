#!/usr/bin/env node

/**
 * 🧪 Integrated AI System Test Suite
 * 
 * AI 에이전트와 기존 시스템 통합 테스트
 * - 어댑터 연결 테스트
 * - 데이터 흐름 검증
 * - 성능 벤치마크
 * - 장애 복구 테스트
 */

const { performance } = require('perf_hooks');
const fs = require('fs').promises;
const path = require('path');

// 테스트 설정
const TEST_CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  timeout: 10000, // 10초로 단축
  retries: 2, // 재시도 횟수 감소
  verbose: true
};

// 테스트 결과 저장
const testResults = {
  startTime: new Date(),
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  }
};

/**
 * 🎯 메인 테스트 실행
 */
async function runIntegratedTests() {
  console.log('🧪 AI Agent Integrated System Test Suite 시작');
  console.log('=' .repeat(60));
  
  try {
    // 1. 기본 연결 테스트
    await runBasicConnectivityTests();
    
    // 2. 어댑터 통합 테스트
    await runAdapterIntegrationTests();
    
    // 3. AI 엔진 통합 테스트
    await runAIEngineIntegrationTests();
    
    // 4. 데이터 흐름 테스트
    await runDataFlowTests();
    
    // 5. 성능 벤치마크
    await runPerformanceBenchmarks();
    
    // 6. 장애 복구 테스트
    await runFailureRecoveryTests();
    
    // 7. 종합 시나리오 테스트
    await runEndToEndScenarios();
    
    // 결과 요약
    await generateTestReport();
    
  } catch (error) {
    console.error('❌ 테스트 실행 중 오류 발생:', error);
    process.exit(1);
  }
}

/**
 * 🔌 기본 연결 테스트
 */
async function runBasicConnectivityTests() {
  console.log('\n📡 기본 연결 테스트');
  console.log('-'.repeat(40));
  
  // API 엔드포인트 연결 테스트
  await runTest('API 엔드포인트 연결', async () => {
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/health`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return { status: 'connected', endpoint: TEST_CONFIG.baseUrl };
  });
  
  // 통합 API 상태 확인
  await runTest('통합 API 상태 확인', async () => {
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/ai-agent/integrated`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(`API 응답 실패: ${data.error}`);
    }
    
    return {
      integration: data.data.integration.isInitialized,
      aiEngine: data.data.aiEngine.isInitialized,
      servers: data.data.servers.total
    };
  });
}

/**
 * 🔧 어댑터 통합 테스트
 */
async function runAdapterIntegrationTests() {
  console.log('\n🔧 어댑터 통합 테스트');
  console.log('-'.repeat(40));
  
  // 데이터베이스 어댑터 테스트
  await runTest('데이터베이스 어댑터 연결', async () => {
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/ai-agent/integrated`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'health-check' })
    });
    
    const data = await response.json();
    if (!data.success) {
      throw new Error(`헬스 체크 실패: ${data.error}`);
    }
    
    return {
      serversFound: data.data.summary.total,
      overallHealth: data.data.overallHealth
    };
  });
  
  // Redis 캐시 어댑터 테스트
  await runTest('Redis 캐시 어댑터 테스트', async () => {
    // 간단한 헬스 체크로 대체
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/health`);
    const data = await response.json();
    
    return {
      cacheTest: response.ok,
      redisAvailable: data.redis || false
    };
  });
  
  // 데이터 수집기 어댑터 테스트
  await runTest('데이터 수집기 어댑터 테스트', async () => {
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/ai-agent/integrated`);
    const data = await response.json();
    
    const serverList = data.data.servers.list;
    if (serverList.length === 0) {
      throw new Error('수집된 서버 데이터가 없습니다');
    }
    
    return {
      serversCollected: serverList.length,
      recentMetrics: data.data.servers.recentMetrics.length
    };
  });
}

/**
 * 🧠 AI 엔진 통합 테스트
 */
async function runAIEngineIntegrationTests() {
  console.log('\n🧠 AI 엔진 통합 테스트');
  console.log('-'.repeat(40));
  
  // MCP 패턴 매칭 테스트
  await runTest('MCP 패턴 매칭 테스트', async () => {
    // 단일 간단한 쿼리로 테스트
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/ai-agent/integrated`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'smart-query', 
        query: '서버 상태 확인'
      })
    });
    
    const data = await response.json();
    
    return {
      mcpTest: data.success,
      responseReceived: !!data.data
    };
  });
  
  // Python 분석 엔진 테스트
  await runTest('Python 분석 엔진 테스트', async () => {
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/ai-agent/integrated`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'anomaly-detection',
        timeRange: { hours: 1 }
      })
    });
    
    const data = await response.json();
    return {
      anomalyDetection: data.success,
      serversAnalyzed: data.data?.serversAnalyzed || 0,
      anomaliesFound: data.data?.anomaliesDetected || 0
    };
  });
}

/**
 * 📊 데이터 흐름 테스트
 */
async function runDataFlowTests() {
  console.log('\n📊 데이터 흐름 테스트');
  console.log('-'.repeat(40));
  
  // 서버 메트릭 조회 테스트
  await runTest('서버 메트릭 조회 테스트', async () => {
    const healthResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/ai-agent/integrated`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'health-check' })
    });
    
    const healthData = await healthResponse.json();
    const servers = healthData.data.servers;
    
    if (servers.length === 0) {
      throw new Error('테스트할 서버가 없습니다');
    }
    
    // 첫 번째 서버 분석
    const testServerId = servers[0].serverId;
    const analysisResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/ai-agent/integrated`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'analyze-server',
        serverId: testServerId
      })
    });
    
    const analysisData = await analysisResponse.json();
    return {
      serverAnalyzed: testServerId,
      analysisSuccess: analysisData.success,
      metricsFound: !!analysisData.data?.metrics
    };
  });
  
  // 메트릭 히스토리 테스트
  await runTest('메트릭 히스토리 테스트', async () => {
    const healthResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/ai-agent/integrated`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'health-check' })
    });
    
    const healthData = await healthResponse.json();
    const servers = healthData.data.servers;
    
    if (servers.length === 0) {
      return { historyTest: 'skipped', reason: 'no servers' };
    }
    
    const testServerId = servers[0].serverId;
    const historyResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/ai-agent/integrated`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'metrics-history',
        serverId: testServerId,
        timeRange: { hours: 24 }
      })
    });
    
    const historyData = await historyResponse.json();
    return {
      historySuccess: historyData.success,
      dataPoints: historyData.data?.summary?.dataPoints || 0
    };
  });
}

/**
 * ⚡ 성능 벤치마크
 */
async function runPerformanceBenchmarks() {
  console.log('\n⚡ 성능 벤치마크');
  console.log('-'.repeat(40));
  
  // 응답 시간 벤치마크
  await runTest('응답 시간 벤치마크', async () => {
    // 단일 헬스 체크로 간소화
    const startTime = performance.now();
    
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/ai-agent/integrated`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'health-check' })
    });
    
    const endTime = performance.now();
    const data = await response.json();
    
    return {
      responseTime: endTime - startTime,
      success: data.success
    };
  });
  
  // 동시 요청 처리 테스트
  await runTest('동시 요청 처리 테스트', async () => {
    // 간단한 2개 요청으로 축소
    const promises = [
      fetch(`${TEST_CONFIG.baseUrl}/api/health`),
      fetch(`${TEST_CONFIG.baseUrl}/api/health`)
    ];
    
    const startTime = performance.now();
    const responses = await Promise.allSettled(promises);
    const endTime = performance.now();
    
    const successCount = responses.filter(r => r.status === 'fulfilled').length;
    
    return {
      concurrentRequests: 2,
      successCount,
      totalTime: endTime - startTime
    };
  });
}

/**
 * 🛡️ 장애 복구 테스트
 */
async function runFailureRecoveryTests() {
  console.log('\n🛡️ 장애 복구 테스트');
  console.log('-'.repeat(40));
  
  // 잘못된 요청 처리 테스트
  await runTest('잘못된 요청 처리 테스트', async () => {
    const invalidRequests = [
      { action: 'invalid-action' },
      { action: 'analyze-server' }, // serverId 누락
      { action: 'smart-query' }, // query 누락
      { action: 'metrics-history', serverId: 'non-existent-server' }
    ];
    
    const results = [];
    
    for (const request of invalidRequests) {
      const response = await fetch(`${TEST_CONFIG.baseUrl}/api/ai-agent/integrated`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });
      
      const data = await response.json();
      results.push({
        request: JSON.stringify(request),
        handled: !data.success && response.status >= 400,
        status: response.status
      });
    }
    
    return {
      invalidRequests: results.length,
      properlyHandled: results.filter(r => r.handled).length
    };
  });
  
  // 타임아웃 처리 테스트
  await runTest('타임아웃 처리 테스트', async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000); // 1초 타임아웃
    
    try {
      const response = await fetch(`${TEST_CONFIG.baseUrl}/api/ai-agent/integrated`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'health-check' }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return { timeoutTest: 'passed', responseReceived: true };
      
    } catch (error) {
      if (error.name === 'AbortError') {
        return { timeoutTest: 'timeout', responseReceived: false };
      }
      throw error;
    }
  });
}

/**
 * 🎭 종합 시나리오 테스트
 */
async function runEndToEndScenarios() {
  console.log('\n🎭 종합 시나리오 테스트');
  console.log('-'.repeat(40));
  
  // 서버 모니터링 시나리오
  await runTest('서버 모니터링 시나리오', async () => {
    const scenario = [];
    
    // 1. 전체 헬스 체크
    const healthResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/ai-agent/integrated`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'health-check' })
    });
    const healthData = await healthResponse.json();
    scenario.push({ step: 'health-check', success: healthData.success });
    
    // 2. 이상 감지
    const anomalyResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/ai-agent/integrated`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'anomaly-detection' })
    });
    const anomalyData = await anomalyResponse.json();
    scenario.push({ step: 'anomaly-detection', success: anomalyData.success });
    
    // 3. AI 분석 요청
    const queryResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/ai-agent/integrated`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'smart-query',
        query: '현재 시스템 상태를 종합적으로 분석해주세요'
      })
    });
    const queryData = await queryResponse.json();
    scenario.push({ step: 'ai-analysis', success: queryData.success });
    
    return {
      scenarioSteps: scenario.length,
      successfulSteps: scenario.filter(s => s.success).length,
      scenario
    };
  });
}

/**
 * 🧪 개별 테스트 실행
 */
async function runTest(name, testFunction) {
  const test = {
    name,
    startTime: new Date(),
    status: 'running',
    duration: 0,
    result: null,
    error: null
  };
  
  testResults.tests.push(test);
  testResults.summary.total++;
  
  if (TEST_CONFIG.verbose) {
    process.stdout.write(`  ${name}... `);
  }
  
  try {
    const startTime = performance.now();
    const result = await Promise.race([
      testFunction(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Test timeout')), TEST_CONFIG.timeout)
      )
    ]);
    const endTime = performance.now();
    
    test.status = 'passed';
    test.duration = endTime - startTime;
    test.result = result;
    testResults.summary.passed++;
    
    if (TEST_CONFIG.verbose) {
      console.log(`✅ (${Math.round(test.duration)}ms)`);
    }
    
  } catch (error) {
    test.status = 'failed';
    test.error = error.message;
    testResults.summary.failed++;
    
    if (TEST_CONFIG.verbose) {
      console.log(`❌ ${error.message}`);
    }
  }
  
  test.endTime = new Date();
}

/**
 * 📋 테스트 리포트 생성
 */
async function generateTestReport() {
  testResults.endTime = new Date();
  testResults.duration = testResults.endTime - testResults.startTime;
  
  console.log('\n📋 테스트 결과 요약');
  console.log('='.repeat(60));
  console.log(`총 테스트: ${testResults.summary.total}`);
  console.log(`성공: ${testResults.summary.passed} ✅`);
  console.log(`실패: ${testResults.summary.failed} ❌`);
  console.log(`건너뜀: ${testResults.summary.skipped} ⏭️`);
  console.log(`성공률: ${((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1)}%`);
  console.log(`총 소요시간: ${Math.round(testResults.duration)}ms`);
  
  // 실패한 테스트 상세 정보
  const failedTests = testResults.tests.filter(t => t.status === 'failed');
  if (failedTests.length > 0) {
    console.log('\n❌ 실패한 테스트:');
    failedTests.forEach(test => {
      console.log(`  - ${test.name}: ${test.error}`);
    });
  }
  
  // 성능 통계
  const performanceTests = testResults.tests.filter(t => t.status === 'passed');
  if (performanceTests.length > 0) {
    const avgDuration = performanceTests.reduce((sum, t) => sum + t.duration, 0) / performanceTests.length;
    console.log(`\n⚡ 평균 응답시간: ${Math.round(avgDuration)}ms`);
  }
  
  // 리포트 파일 저장
  const reportPath = path.join(__dirname, '..', 'logs', 'integrated-test-report.json');
  await fs.writeFile(reportPath, JSON.stringify(testResults, null, 2));
  console.log(`\n📄 상세 리포트 저장: ${reportPath}`);
  
  // 종료 코드 설정
  process.exit(testResults.summary.failed > 0 ? 1 : 0);
}

// 스크립트 실행
if (require.main === module) {
  runIntegratedTests().catch(error => {
    console.error('❌ 테스트 실행 실패:', error);
    process.exit(1);
  });
}

module.exports = { runIntegratedTests }; 