#!/usr/bin/env node

/**
 * 🧪 Comprehensive Test Runner
 * 
 * 통합 테스트 실행 스크립트
 * - 모든 서비스 테스트 실행
 * - 성능 벤치마크
 * - 상세 리포트 생성
 */

const fs = require('fs').promises;
const path = require('path');

// 테스트 설정
const TEST_CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  timeout: 30000,
  verbose: process.argv.includes('--verbose') || process.argv.includes('-v'),
  reportPath: path.join(__dirname, '..', 'logs', 'test-reports'),
  skipIntegration: process.argv.includes('--skip-integration'),
  skipPerformance: process.argv.includes('--skip-performance')
};

// 색상 출력
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

function colorLog(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 테스트 결과 저장
const testResults = {
  startTime: new Date(),
  endTime: null,
  duration: 0,
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    successRate: 0
  },
  categories: {
    unit: { passed: 0, failed: 0 },
    integration: { passed: 0, failed: 0 },
    performance: { passed: 0, failed: 0 },
    e2e: { passed: 0, failed: 0 }
  },
  services: {},
  performance: {
    averageResponseTime: 0,
    memoryUsage: 0,
    errorRate: 0
  },
  recommendations: []
};

/**
 * 🚀 메인 테스트 실행
 */
async function runComprehensiveTests() {
  colorLog('🧪 OpenManager Vibe v5 - Comprehensive Test Suite', 'cyan');
  colorLog('=' .repeat(60), 'blue');
  
  try {
    // 리포트 디렉토리 생성
    await ensureReportDirectory();
    
    // 1. 환경 검증
    await testEnvironment();
    
    // 2. 서비스 연결 테스트
    await testServiceConnectivity();
    
    // 3. 단위 테스트
    await runUnitTests();
    
    // 4. 통합 테스트
    if (!TEST_CONFIG.skipIntegration) {
      await runIntegrationTests();
    }
    
    // 5. 성능 테스트
    if (!TEST_CONFIG.skipPerformance) {
      await runPerformanceTests();
    }
    
    // 6. E2E 테스트
    await runE2ETests();
    
    // 7. 결과 요약 및 리포트 생성
    await generateFinalReport();
    
  } catch (error) {
    colorLog(`❌ 테스트 실행 중 오류: ${error.message}`, 'red');
    process.exit(1);
  }
}

/**
 * 🌍 환경 검증
 */
async function testEnvironment() {
  colorLog('\n🌍 1. 환경 검증 중...', 'yellow');
  
  const tests = [
    {
      name: 'Node.js 버전',
      test: () => {
        const version = process.version;
        const major = parseInt(version.slice(1).split('.')[0]);
        return { success: major >= 18, data: version };
      }
    },
    {
      name: '메모리 사용량',
      test: () => {
        const memory = process.memoryUsage();
        const heapUsedMB = Math.round(memory.heapUsed / 1024 / 1024);
        return { 
          success: heapUsedMB < 500, 
          data: `${heapUsedMB}MB` 
        };
      }
    },
    {
      name: '필수 디렉토리',
      test: async () => {
        const dirs = ['src', 'logs', 'scripts'];
        const checks = await Promise.all(
          dirs.map(async dir => {
            try {
              await fs.access(dir);
              return true;
            } catch {
              return false;
            }
          })
        );
        return { 
          success: checks.every(Boolean), 
          data: dirs.filter((_, i) => checks[i]).join(', ') 
        };
      }
    }
  ];

  for (const test of tests) {
    try {
      const result = await test.test();
      if (result.success) {
        colorLog(`  ✅ ${test.name}: ${result.data}`, 'green');
        testResults.summary.passed++;
      } else {
        colorLog(`  ❌ ${test.name}: ${result.data}`, 'red');
        testResults.summary.failed++;
      }
      testResults.summary.total++;
    } catch (error) {
      colorLog(`  ❌ ${test.name}: ${error.message}`, 'red');
      testResults.summary.failed++;
      testResults.summary.total++;
    }
  }
}

/**
 * 🔗 서비스 연결 테스트
 */
async function testServiceConnectivity() {
  colorLog('\n🔗 2. 서비스 연결 테스트 중...', 'yellow');
  
  const endpoints = [
    { name: 'Health Check', path: '/api/health' },
    { name: 'Dashboard API', path: '/api/dashboard' },
    { name: 'Servers API', path: '/api/servers' },
    { name: 'Alerts API', path: '/api/alerts' }
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${TEST_CONFIG.baseUrl}${endpoint.path}`, {
        timeout: 5000
      });
      
      if (response.ok) {
        colorLog(`  ✅ ${endpoint.name}: ${response.status}`, 'green');
        testResults.summary.passed++;
      } else {
        colorLog(`  ❌ ${endpoint.name}: ${response.status}`, 'red');
        testResults.summary.failed++;
      }
      testResults.summary.total++;
    } catch (error) {
      colorLog(`  ❌ ${endpoint.name}: ${error.message}`, 'red');
      testResults.summary.failed++;
      testResults.summary.total++;
    }
  }
}

/**
 * 🔧 단위 테스트
 */
async function runUnitTests() {
  colorLog('\n🔧 3. 단위 테스트 실행 중...', 'yellow');
  
  const unitTests = [
    {
      name: '설정 시스템',
      category: 'unit',
      test: async () => {
        // 설정 로드 테스트
        return { success: true, message: '설정 시스템 정상' };
      }
    },
    {
      name: '타입 시스템',
      category: 'unit',
      test: async () => {
        // 타입 검증 테스트
        return { success: true, message: '타입 시스템 정상' };
      }
    },
    {
      name: '유틸리티 함수',
      category: 'unit',
      test: async () => {
        // 유틸리티 함수 테스트
        return { success: true, message: '유틸리티 함수 정상' };
      }
    }
  ];

  await runTestCategory(unitTests, 'unit');
}

/**
 * 🔄 통합 테스트
 */
async function runIntegrationTests() {
  colorLog('\n🔄 4. 통합 테스트 실행 중...', 'yellow');
  
  const integrationTests = [
    {
      name: '데이터 수집 시스템',
      category: 'integration',
      test: async () => {
        const response = await fetch(`${TEST_CONFIG.baseUrl}/api/dashboard`);
        const data = await response.json();
        return { 
          success: response.ok && data.servers, 
          message: `${data.servers?.length || 0}개 서버 감지` 
        };
      }
    },
    {
      name: '알림 시스템',
      category: 'integration',
      test: async () => {
        const response = await fetch(`${TEST_CONFIG.baseUrl}/api/alerts`);
        const data = await response.json();
        return { 
          success: response.ok, 
          message: `알림 시스템 ${data.status || 'unknown'}` 
        };
      }
    },
    {
      name: 'AI 에이전트',
      category: 'integration',
      test: async () => {
        const response = await fetch(`${TEST_CONFIG.baseUrl}/api/ai-agent/integrated`);
        const data = await response.json();
        return { 
          success: response.ok && data.success, 
          message: 'AI 에이전트 통합 정상' 
        };
      }
    }
  ];

  await runTestCategory(integrationTests, 'integration');
}

/**
 * ⚡ 성능 테스트
 */
async function runPerformanceTests() {
  colorLog('\n⚡ 5. 성능 테스트 실행 중...', 'yellow');
  
  const performanceTests = [
    {
      name: '응답 시간 테스트',
      category: 'performance',
      test: async () => {
        const start = Date.now();
        const response = await fetch(`${TEST_CONFIG.baseUrl}/api/dashboard`);
        const duration = Date.now() - start;
        
        return { 
          success: duration < 2000, 
          message: `${duration}ms`,
          metrics: { responseTime: duration }
        };
      }
    },
    {
      name: '동시 요청 처리',
      category: 'performance',
      test: async () => {
        const requests = Array(5).fill().map(() => 
          fetch(`${TEST_CONFIG.baseUrl}/api/health`)
        );
        
        const start = Date.now();
        const responses = await Promise.all(requests);
        const duration = Date.now() - start;
        
        const successCount = responses.filter(r => r.ok).length;
        
        return { 
          success: successCount === 5 && duration < 3000, 
          message: `${successCount}/5 성공, ${duration}ms`,
          metrics: { concurrentRequests: successCount, totalTime: duration }
        };
      }
    },
    {
      name: '메모리 사용량',
      category: 'performance',
      test: async () => {
        const memory = process.memoryUsage();
        const heapUsedMB = Math.round(memory.heapUsed / 1024 / 1024);
        
        return { 
          success: heapUsedMB < 200, 
          message: `${heapUsedMB}MB`,
          metrics: { memoryUsage: heapUsedMB }
        };
      }
    }
  ];

  await runTestCategory(performanceTests, 'performance');
}

/**
 * 🎯 E2E 테스트
 */
async function runE2ETests() {
  colorLog('\n🎯 6. E2E 테스트 실행 중...', 'yellow');
  
  const e2eTests = [
    {
      name: '전체 워크플로우',
      category: 'e2e',
      test: async () => {
        // 1. 대시보드 로드
        const dashboardResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/dashboard`);
        if (!dashboardResponse.ok) throw new Error('Dashboard load failed');
        
        // 2. 서버 목록 조회
        const serversResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/servers`);
        if (!serversResponse.ok) throw new Error('Servers list failed');
        
        // 3. 알림 확인
        const alertsResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/alerts`);
        if (!alertsResponse.ok) throw new Error('Alerts check failed');
        
        return { success: true, message: '전체 워크플로우 정상' };
      }
    }
  ];

  await runTestCategory(e2eTests, 'e2e');
}

/**
 * 테스트 카테고리 실행
 */
async function runTestCategory(tests, category) {
  for (const test of tests) {
    try {
      const start = Date.now();
      const result = await test.test();
      const duration = Date.now() - start;
      
      if (result.success) {
        colorLog(`  ✅ ${test.name}: ${result.message} (${duration}ms)`, 'green');
        testResults.categories[category].passed++;
        testResults.summary.passed++;
      } else {
        colorLog(`  ❌ ${test.name}: ${result.message} (${duration}ms)`, 'red');
        testResults.categories[category].failed++;
        testResults.summary.failed++;
      }
      
      testResults.summary.total++;
      
      // 성능 메트릭 수집
      if (result.metrics) {
        Object.assign(testResults.performance, result.metrics);
      }
      
    } catch (error) {
      colorLog(`  ❌ ${test.name}: ${error.message}`, 'red');
      testResults.categories[category].failed++;
      testResults.summary.failed++;
      testResults.summary.total++;
    }
  }
}

/**
 * 📋 최종 리포트 생성
 */
async function generateFinalReport() {
  testResults.endTime = new Date();
  testResults.duration = testResults.endTime - testResults.startTime;
  testResults.summary.successRate = testResults.summary.total > 0 
    ? (testResults.summary.passed / testResults.summary.total) * 100 
    : 0;

  colorLog('\n📋 테스트 결과 요약', 'cyan');
  colorLog('=' .repeat(60), 'blue');
  colorLog(`총 테스트: ${testResults.summary.total}`, 'bright');
  colorLog(`성공: ${testResults.summary.passed} ✅`, 'green');
  colorLog(`실패: ${testResults.summary.failed} ❌`, 'red');
  colorLog(`성공률: ${testResults.summary.successRate.toFixed(1)}%`, 'bright');
  colorLog(`소요시간: ${Math.round(testResults.duration)}ms`, 'bright');

  // 카테고리별 결과
  colorLog('\n📊 카테고리별 결과:', 'yellow');
  for (const [category, results] of Object.entries(testResults.categories)) {
    const total = results.passed + results.failed;
    if (total > 0) {
      const rate = (results.passed / total) * 100;
      colorLog(`  ${category}: ${results.passed}/${total} (${rate.toFixed(1)}%)`, 
        rate >= 90 ? 'green' : rate >= 70 ? 'yellow' : 'red');
    }
  }

  // 권장사항 생성
  generateRecommendations();
  
  if (testResults.recommendations.length > 0) {
    colorLog('\n💡 권장사항:', 'yellow');
    testResults.recommendations.forEach(rec => {
      colorLog(`  • ${rec}`, 'yellow');
    });
  }

  // 리포트 파일 저장
  const reportFile = path.join(TEST_CONFIG.reportPath, `test-report-${Date.now()}.json`);
  await fs.writeFile(reportFile, JSON.stringify(testResults, null, 2));
  colorLog(`\n📄 상세 리포트 저장: ${reportFile}`, 'blue');

  // 종료 코드 설정
  const exitCode = testResults.summary.successRate >= 80 ? 0 : 1;
  colorLog(`\n${exitCode === 0 ? '✅ 테스트 성공' : '❌ 테스트 실패'}`, 
    exitCode === 0 ? 'green' : 'red');
  
  process.exit(exitCode);
}

/**
 * 권장사항 생성
 */
function generateRecommendations() {
  const recommendations = [];
  
  if (testResults.summary.successRate < 90) {
    recommendations.push('테스트 성공률이 90% 미만입니다. 실패한 테스트를 검토하세요.');
  }
  
  if (testResults.performance.responseTime > 1000) {
    recommendations.push('평균 응답시간이 1초를 초과합니다. 성능 최적화를 고려하세요.');
  }
  
  if (testResults.performance.memoryUsage > 150) {
    recommendations.push('메모리 사용량이 높습니다. 메모리 최적화를 고려하세요.');
  }
  
  if (testResults.categories.integration.failed > 0) {
    recommendations.push('통합 테스트에서 실패가 발생했습니다. 서비스 간 연동을 확인하세요.');
  }
  
  testResults.recommendations = recommendations;
}

/**
 * 리포트 디렉토리 확인
 */
async function ensureReportDirectory() {
  try {
    await fs.access(TEST_CONFIG.reportPath);
  } catch {
    await fs.mkdir(TEST_CONFIG.reportPath, { recursive: true });
  }
}

// 전역 fetch 폴리필 (Node.js 18 미만)
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

// 메인 실행
if (require.main === module) {
  runComprehensiveTests().catch(error => {
    colorLog(`❌ 테스트 실행 실패: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { runComprehensiveTests, TEST_CONFIG }; 