#!/usr/bin/env node

/**
 * 🚀 Optimized AI Agent Engine Test Suite
 * 
 * 최적화된 AI 에이전트 엔진 종합 테스트
 * - 환경별 최적화 테스트
 * - 성능 벤치마크
 * - 부하 테스트
 * - Fallback 메커니즘 테스트
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// 색상 출력 함수
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorLog(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 테스트 설정
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  apiEndpoint: '/api/ai-agent/optimized',
  timeout: 30000,
  maxRetries: 3,
  concurrentRequests: 5
};

// 테스트 데이터
const TEST_QUERIES = [
  {
    name: '기본 서버 상태 조회',
    query: '서버 상태를 알려주세요',
    priority: 'medium',
    expectedKeywords: ['서버', '상태', '메트릭']
  },
  {
    name: 'CPU 사용률 분석',
    query: 'CPU 사용률이 높은 이유를 분석해주세요',
    priority: 'high',
    expectedKeywords: ['CPU', '사용률', '분석']
  },
  {
    name: '메모리 최적화 추천',
    query: '메모리 사용량을 최적화하는 방법을 알려주세요',
    priority: 'medium',
    expectedKeywords: ['메모리', '최적화', '추천']
  },
  {
    name: '시스템 성능 예측',
    query: '향후 시스템 성능 트렌드를 예측해주세요',
    priority: 'low',
    expectedKeywords: ['성능', '예측', '트렌드']
  }
];

const MOCK_SERVER_DATA = {
  metrics: {
    cpu: {
      current: 75.5,
      history: Array.from({ length: 50 }, (_, i) => ({
        timestamp: Date.now() - (49 - i) * 60000,
        value: 60 + Math.random() * 30
      }))
    },
    memory: {
      current: 68.2,
      history: Array.from({ length: 50 }, (_, i) => ({
        timestamp: Date.now() - (49 - i) * 60000,
        value: 50 + Math.random() * 40
      }))
    },
    disk: {
      current: 45.8,
      history: Array.from({ length: 50 }, (_, i) => ({
        timestamp: Date.now() - (49 - i) * 60000,
        value: 30 + Math.random() * 30
      }))
    }
  },
  servers: [
    { id: 'server-1', name: 'Web Server', status: 'running' },
    { id: 'server-2', name: 'Database Server', status: 'running' },
    { id: 'server-3', name: 'Cache Server', status: 'warning' }
  ]
};

// 테스트 결과 저장
const testResults = {
  startTime: Date.now(),
  environment: null,
  tests: [],
  performance: {
    averageResponseTime: 0,
    successRate: 0,
    errorCount: 0,
    totalRequests: 0
  },
  summary: {
    passed: 0,
    failed: 0,
    skipped: 0
  }
};

/**
 * 🌟 메인 테스트 실행
 */
async function runTests() {
  colorLog('cyan', '🚀 Optimized AI Agent Engine Test Suite 시작');
  colorLog('blue', '=' .repeat(60));

  try {
    // 1. 환경 검증
    await testEnvironment();
    
    // 2. API 연결 테스트
    await testAPIConnection();
    
    // 3. 환경 감지 테스트
    await testEnvironmentDetection();
    
    // 4. 기본 기능 테스트
    await testBasicFunctionality();
    
    // 5. 스마트 쿼리 테스트
    await testSmartQueries();
    
    // 6. 성능 벤치마크
    await testPerformanceBenchmark();
    
    // 7. 부하 테스트
    await testLoadTesting();
    
    // 8. Fallback 메커니즘 테스트
    await testFallbackMechanism();
    
    // 9. 결과 요약
    generateTestReport();

  } catch (error) {
    colorLog('red', `❌ 테스트 실행 중 오류: ${error.message}`);
    process.exit(1);
  }
}

/**
 * 🔍 환경 검증
 */
async function testEnvironment() {
  colorLog('yellow', '\n📋 1. 환경 검증 중...');
  
  const checks = [
    { name: 'Node.js 버전', check: () => process.version },
    { name: '메모리 사용량', check: () => `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB` },
    { name: '플랫폼', check: () => process.platform },
    { name: '작업 디렉토리', check: () => process.cwd() }
  ];

  for (const check of checks) {
    try {
      const result = check.check();
      colorLog('green', `  ✅ ${check.name}: ${result}`);
    } catch (error) {
      colorLog('red', `  ❌ ${check.name}: ${error.message}`);
    }
  }
}

/**
 * 🔗 API 연결 테스트
 */
async function testAPIConnection() {
  colorLog('yellow', '\n🔗 2. API 연결 테스트 중...');
  
  try {
    const response = await makeRequest('GET', '');
    
    if (response.success) {
      colorLog('green', '  ✅ API 연결 성공');
      colorLog('blue', `  📊 응답 시간: ${response.metadata?.responseTime || 'N/A'}ms`);
      colorLog('blue', `  🌍 플랫폼: ${response.metadata?.platform || 'unknown'}`);
      
      testResults.environment = response.environment;
    } else {
      throw new Error('API 연결 실패');
    }
  } catch (error) {
    colorLog('red', `  ❌ API 연결 실패: ${error.message}`);
    throw error;
  }
}

/**
 * 🌍 환경 감지 테스트
 */
async function testEnvironmentDetection() {
  colorLog('yellow', '\n🌍 3. 환경 감지 테스트 중...');
  
  try {
    const response = await makeRequest('POST', '', {
      action: 'environment'
    });
    
    if (response.success && response.data) {
      const env = response.data.environment;
      colorLog('green', '  ✅ 환경 감지 성공');
      colorLog('blue', `  🖥️  플랫폼: ${env?.platform || 'unknown'}`);
      colorLog('blue', `  💾 메모리 제한: ${env?.memoryLimit || 'N/A'}MB`);
      colorLog('blue', `  ⏱️  시간 제한: ${env?.timeLimit || 'N/A'}ms`);
      colorLog('blue', `  🐍 Python 분석: ${env?.capabilities?.pythonAnalysis ? '활성화' : '비활성화'}`);
      
      // 추천사항 출력
      if (response.data.recommendations?.length > 0) {
        colorLog('cyan', '  💡 추천사항:');
        response.data.recommendations.forEach(rec => {
          colorLog('cyan', `    - ${rec}`);
        });
      }
    } else {
      throw new Error('환경 감지 실패');
    }
  } catch (error) {
    colorLog('red', `  ❌ 환경 감지 실패: ${error.message}`);
  }
}

/**
 * ⚙️ 기본 기능 테스트
 */
async function testBasicFunctionality() {
  colorLog('yellow', '\n⚙️ 4. 기본 기능 테스트 중...');
  
  const tests = [
    {
      name: '상태 조회',
      action: 'status',
      validator: (response) => response.success && response.data?.status === 'operational'
    },
    {
      name: '최적화 설정 조회',
      action: 'optimize',
      validator: (response) => response.success && response.data?.optimization
    }
  ];

  for (const test of tests) {
    try {
      const response = await makeRequest('POST', '', { action: test.action });
      
      if (test.validator(response)) {
        colorLog('green', `  ✅ ${test.name} 성공`);
        testResults.summary.passed++;
      } else {
        colorLog('red', `  ❌ ${test.name} 실패: 응답 검증 실패`);
        testResults.summary.failed++;
      }
    } catch (error) {
      colorLog('red', `  ❌ ${test.name} 실패: ${error.message}`);
      testResults.summary.failed++;
    }
  }
}

/**
 * 🧠 스마트 쿼리 테스트
 */
async function testSmartQueries() {
  colorLog('yellow', '\n🧠 5. 스마트 쿼리 테스트 중...');
  
  for (const testQuery of TEST_QUERIES) {
    try {
      colorLog('blue', `  🔍 테스트: ${testQuery.name}`);
      
      const startTime = Date.now();
      const response = await makeRequest('POST', '', {
        action: 'smart-query',
        query: testQuery.query,
        priority: testQuery.priority,
        serverData: MOCK_SERVER_DATA,
        sessionId: `test_session_${Date.now()}`
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.success && response.data) {
        colorLog('green', `    ✅ 성공 (${responseTime}ms)`);
        colorLog('blue', `    📝 응답: ${response.data.response.substring(0, 100)}...`);
        colorLog('blue', `    🔧 방법: ${response.data.method}`);
        
        // 키워드 검증
        const hasExpectedKeywords = testQuery.expectedKeywords.some(keyword =>
          response.data.response.toLowerCase().includes(keyword.toLowerCase())
        );
        
        if (hasExpectedKeywords) {
          colorLog('green', `    ✅ 키워드 검증 통과`);
        } else {
          colorLog('yellow', `    ⚠️ 키워드 검증 실패`);
        }
        
        // 분석 결과 확인
        if (response.data.analysis) {
          colorLog('cyan', `    🔬 분석 결과 포함됨`);
          if (response.data.analysis.insights?.length > 0) {
            colorLog('cyan', `    💡 인사이트: ${response.data.analysis.insights.length}개`);
          }
        }
        
        testResults.summary.passed++;
        testResults.performance.totalRequests++;
        testResults.performance.averageResponseTime += responseTime;
        
      } else {
        colorLog('red', `    ❌ 실패: ${response.error || '알 수 없는 오류'}`);
        testResults.summary.failed++;
        testResults.performance.errorCount++;
      }
      
    } catch (error) {
      colorLog('red', `    ❌ 실패: ${error.message}`);
      testResults.summary.failed++;
      testResults.performance.errorCount++;
    }
    
    // 요청 간 간격
    await sleep(1000);
  }
}

/**
 * 📊 성능 벤치마크
 */
async function testPerformanceBenchmark() {
  colorLog('yellow', '\n📊 6. 성능 벤치마크 중...');
  
  const benchmarks = [
    { name: '소규모 데이터', dataSize: 'small', iterations: 5 },
    { name: '중규모 데이터', dataSize: 'medium', iterations: 3 },
    { name: '대규모 데이터', dataSize: 'large', iterations: 2 }
  ];

  for (const benchmark of benchmarks) {
    colorLog('blue', `  🔬 ${benchmark.name} 벤치마크 (${benchmark.iterations}회)`);
    
    const times = [];
    
    for (let i = 0; i < benchmark.iterations; i++) {
      try {
        const serverData = generateMockData(benchmark.dataSize);
        const startTime = Date.now();
        
        const response = await makeRequest('POST', '', {
          action: 'smart-query',
          query: '시스템 성능을 종합적으로 분석해주세요',
          serverData,
          priority: 'high'
        });
        
        const responseTime = Date.now() - startTime;
        times.push(responseTime);
        
        if (response.success) {
          colorLog('green', `    ✅ 반복 ${i + 1}: ${responseTime}ms`);
        } else {
          colorLog('red', `    ❌ 반복 ${i + 1}: 실패`);
        }
        
      } catch (error) {
        colorLog('red', `    ❌ 반복 ${i + 1}: ${error.message}`);
      }
      
      await sleep(500);
    }
    
    if (times.length > 0) {
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);
      
      colorLog('cyan', `    📈 평균: ${avgTime.toFixed(0)}ms, 최소: ${minTime}ms, 최대: ${maxTime}ms`);
    }
  }
}

/**
 * 🚀 부하 테스트
 */
async function testLoadTesting() {
  colorLog('yellow', '\n🚀 7. 부하 테스트 중...');
  
  const concurrentRequests = TEST_CONFIG.concurrentRequests;
  colorLog('blue', `  🔄 동시 요청 ${concurrentRequests}개 실행`);
  
  const promises = [];
  const startTime = Date.now();
  
  for (let i = 0; i < concurrentRequests; i++) {
    const promise = makeRequest('POST', '', {
      action: 'smart-query',
      query: `부하 테스트 쿼리 ${i + 1}`,
      serverData: MOCK_SERVER_DATA,
      sessionId: `load_test_${i}`
    }).then(response => ({
      index: i,
      success: response.success,
      responseTime: Date.now() - startTime,
      error: response.error
    })).catch(error => ({
      index: i,
      success: false,
      responseTime: Date.now() - startTime,
      error: error.message
    }));
    
    promises.push(promise);
  }
  
  try {
    const results = await Promise.all(promises);
    const totalTime = Date.now() - startTime;
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    colorLog('green', `  ✅ 성공: ${successful}/${concurrentRequests}`);
    colorLog('red', `  ❌ 실패: ${failed}/${concurrentRequests}`);
    colorLog('cyan', `  ⏱️  총 시간: ${totalTime}ms`);
    colorLog('cyan', `  📊 처리량: ${(concurrentRequests / totalTime * 1000).toFixed(2)} req/sec`);
    
  } catch (error) {
    colorLog('red', `  ❌ 부하 테스트 실패: ${error.message}`);
  }
}

/**
 * 🔄 Fallback 메커니즘 테스트
 */
async function testFallbackMechanism() {
  colorLog('yellow', '\n🔄 8. Fallback 메커니즘 테스트 중...');
  
  // 의도적으로 문제가 있는 요청들
  const fallbackTests = [
    {
      name: '빈 쿼리',
      request: { action: 'smart-query', query: '' }
    },
    {
      name: '너무 긴 쿼리',
      request: { action: 'smart-query', query: 'a'.repeat(2000) }
    },
    {
      name: '잘못된 우선순위',
      request: { action: 'smart-query', query: '테스트', priority: 'invalid' }
    },
    {
      name: '지원하지 않는 액션',
      request: { action: 'invalid-action' }
    }
  ];

  for (const test of fallbackTests) {
    try {
      colorLog('blue', `  🧪 ${test.name} 테스트`);
      
      const response = await makeRequest('POST', '', test.request);
      
      if (!response.success && response.error) {
        colorLog('green', `    ✅ 적절한 에러 처리: ${response.error}`);
        testResults.summary.passed++;
      } else {
        colorLog('yellow', `    ⚠️ 예상과 다른 응답`);
        testResults.summary.failed++;
      }
      
    } catch (error) {
      colorLog('green', `    ✅ 예외 처리됨: ${error.message}`);
      testResults.summary.passed++;
    }
  }
}

/**
 * 📋 테스트 결과 요약
 */
function generateTestReport() {
  colorLog('yellow', '\n📋 9. 테스트 결과 요약');
  colorLog('blue', '=' .repeat(60));
  
  const totalTime = Date.now() - testResults.startTime;
  const totalTests = testResults.summary.passed + testResults.summary.failed + testResults.summary.skipped;
  
  // 성능 메트릭 계산
  if (testResults.performance.totalRequests > 0) {
    testResults.performance.averageResponseTime /= testResults.performance.totalRequests;
    testResults.performance.successRate = 
      ((testResults.performance.totalRequests - testResults.performance.errorCount) / 
       testResults.performance.totalRequests) * 100;
  }
  
  // 결과 출력
  colorLog('cyan', `📊 전체 테스트: ${totalTests}개`);
  colorLog('green', `✅ 성공: ${testResults.summary.passed}개`);
  colorLog('red', `❌ 실패: ${testResults.summary.failed}개`);
  colorLog('yellow', `⏭️ 건너뜀: ${testResults.summary.skipped}개`);
  colorLog('blue', `⏱️ 총 실행 시간: ${totalTime}ms`);
  
  if (testResults.performance.totalRequests > 0) {
    colorLog('cyan', `📈 평균 응답 시간: ${testResults.performance.averageResponseTime.toFixed(0)}ms`);
    colorLog('cyan', `📊 성공률: ${testResults.performance.successRate.toFixed(1)}%`);
  }
  
  // 환경 정보
  if (testResults.environment) {
    colorLog('magenta', '\n🌍 테스트 환경:');
    colorLog('blue', `  플랫폼: ${testResults.environment.environment?.platform || 'unknown'}`);
    colorLog('blue', `  메모리: ${testResults.environment.environment?.memoryLimit || 'N/A'}MB`);
    colorLog('blue', `  Python 분석: ${testResults.environment.environment?.capabilities?.pythonAnalysis ? '활성화' : '비활성화'}`);
  }
  
  // 최종 결과
  const successRate = totalTests > 0 ? (testResults.summary.passed / totalTests) * 100 : 0;
  
  if (successRate >= 90) {
    colorLog('green', '\n🎉 테스트 성공! 시스템이 정상적으로 동작합니다.');
  } else if (successRate >= 70) {
    colorLog('yellow', '\n⚠️ 일부 테스트 실패. 시스템을 점검해보세요.');
  } else {
    colorLog('red', '\n❌ 다수 테스트 실패. 시스템에 문제가 있습니다.');
  }
  
  // 결과 파일 저장
  saveTestResults();
}

/**
 * 🔧 유틸리티 함수들
 */
async function makeRequest(method, endpoint, data = null) {
  const url = `${TEST_CONFIG.baseUrl}${TEST_CONFIG.apiEndpoint}${endpoint}`;
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  const response = await fetch(url, options);
  return await response.json();
}

function generateMockData(size) {
  const sizes = {
    small: 10,
    medium: 50,
    large: 100
  };
  
  const historyLength = sizes[size] || 10;
  
  return {
    ...MOCK_SERVER_DATA,
    metrics: {
      ...MOCK_SERVER_DATA.metrics,
      cpu: {
        ...MOCK_SERVER_DATA.metrics.cpu,
        history: Array.from({ length: historyLength }, (_, i) => ({
          timestamp: Date.now() - (historyLength - 1 - i) * 60000,
          value: 60 + Math.random() * 30
        }))
      }
    }
  };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function saveTestResults() {
  try {
    const resultsDir = path.join(process.cwd(), 'logs', 'test-results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `optimized-ai-test-${timestamp}.json`;
    const filepath = path.join(resultsDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(testResults, null, 2));
    colorLog('blue', `\n💾 테스트 결과 저장: ${filepath}`);
  } catch (error) {
    colorLog('red', `❌ 결과 저장 실패: ${error.message}`);
  }
}

// 전역 fetch 폴리필 (Node.js 18 미만)
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

// 메인 실행
if (require.main === module) {
  runTests().catch(error => {
    colorLog('red', `❌ 테스트 실행 실패: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { runTests, TEST_CONFIG }; 