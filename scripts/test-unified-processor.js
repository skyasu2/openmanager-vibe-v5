/**
 * 🚀 통합 전처리 엔진 테스트 스크립트 v1.0
 *
 * 목적: UnifiedDataProcessor의 모든 기능을 테스트하여
 *      모니터링과 AI 에이전트 최적화 성능을 검증
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

// 🎨 로그 스타일링
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

function log(message, color = 'white') {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

// 📊 테스트 결과 수집
const testResults = {
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  performance: {
    monitoringProcessingTime: 0,
    aiProcessingTime: 0,
    bothProcessingTime: 0,
    cacheHitRate: 0,
  },
  dataQuality: {
    monitoringDataQuality: 0,
    aiDataQuality: 0,
    completeness: 0,
  },
  details: [],
};

/**
 * 🧪 테스트 실행 함수
 */
async function runTest(testName, testFunction) {
  testResults.totalTests++;
  log(`🧪 ${testName} 테스트 시작...`, 'cyan');

  try {
    const result = await testFunction();
    testResults.passedTests++;
    log(`✅ ${testName} 테스트 성공`, 'green');
    testResults.details.push({ name: testName, status: 'PASS', result });
    return result;
  } catch (error) {
    testResults.failedTests++;
    log(`❌ ${testName} 테스트 실패: ${error.message}`, 'red');
    testResults.details.push({
      name: testName,
      status: 'FAIL',
      error: error.message,
    });
    throw error;
  }
}

/**
 * 🔄 모니터링 전처리 테스트
 */
async function testMonitoringProcessing() {
  // 동적 import 사용
  const { UnifiedDataProcessor } = await import(
    '../../src/services/data-generator/UnifiedDataProcessor.ts'
  );

  const processor = UnifiedDataProcessor.getInstance();
  const startTime = Date.now();

  const result = await processor.processData('monitoring', {
    forceRefresh: true,
    cacheTTL: 60000,
  });

  const processingTime = Date.now() - startTime;
  testResults.performance.monitoringProcessingTime = processingTime;

  // 검증
  if (!result.monitoring) {
    throw new Error('모니터링 데이터가 없습니다');
  }

  if (!result.monitoring.servers || result.monitoring.servers.length === 0) {
    throw new Error('서버 데이터가 없습니다');
  }

  if (!result.monitoring.stats) {
    throw new Error('통계 데이터가 없습니다');
  }

  testResults.dataQuality.monitoringDataQuality = result.metadata.dataQuality;

  return {
    serverCount: result.monitoring.servers.length,
    stats: result.monitoring.stats,
    processingTime,
    dataQuality: result.metadata.dataQuality,
    completeness: result.metadata.completeness,
  };
}

/**
 * 🧠 AI 전처리 테스트
 */
async function testAIProcessing() {
  const { UnifiedDataProcessor } = await import(
    '../../src/services/data-generator/UnifiedDataProcessor.ts'
  );

  const processor = UnifiedDataProcessor.getInstance();
  const startTime = Date.now();

  const result = await processor.processData('ai', {
    forceRefresh: true,
    enableAnomalyDetection: true,
    normalizationMode: 'minmax',
  });

  const processingTime = Date.now() - startTime;
  testResults.performance.aiProcessingTime = processingTime;

  // 검증
  if (!result.ai) {
    throw new Error('AI 데이터가 없습니다');
  }

  if (!result.ai.metrics || result.ai.metrics.length === 0) {
    throw new Error('AI 메트릭이 없습니다');
  }

  // AI 최적화 메트릭 검증
  const firstMetric = result.ai.metrics[0];
  if (!firstMetric.normalizedMetrics) {
    throw new Error('정규화된 메트릭이 없습니다');
  }

  if (!firstMetric.context) {
    throw new Error('컨텍스트 정보가 없습니다');
  }

  if (!firstMetric.aiFeatures) {
    throw new Error('AI 특성이 없습니다');
  }

  // 정규화 검증 (0-1 범위)
  const normalized = firstMetric.normalizedMetrics;
  if (
    normalized.cpu < 0 ||
    normalized.cpu > 1 ||
    normalized.memory < 0 ||
    normalized.memory > 1 ||
    normalized.disk < 0 ||
    normalized.disk > 1 ||
    normalized.network < 0 ||
    normalized.network > 1
  ) {
    throw new Error('정규화 값이 0-1 범위를 벗어났습니다');
  }

  testResults.dataQuality.aiDataQuality = result.metadata.dataQuality;

  return {
    metricsCount: result.ai.metrics.length,
    aggregatedStats: result.ai.aggregatedStats,
    trends: result.ai.trends,
    insights: result.ai.insights,
    processingTime,
    dataQuality: result.metadata.dataQuality,
    sampleNormalizedMetrics: normalized,
  };
}

/**
 * 🔄 통합 처리 테스트 (monitoring + ai)
 */
async function testBothProcessing() {
  const { UnifiedDataProcessor } = await import(
    '../../src/services/data-generator/UnifiedDataProcessor.ts'
  );

  const processor = UnifiedDataProcessor.getInstance();
  const startTime = Date.now();

  const result = await processor.processData('both', {
    forceRefresh: true,
    enableAnomalyDetection: true,
    includeHistorical: false,
  });

  const processingTime = Date.now() - startTime;
  testResults.performance.bothProcessingTime = processingTime;

  // 검증
  if (!result.monitoring || !result.ai) {
    throw new Error('모니터링 또는 AI 데이터가 누락되었습니다');
  }

  // 데이터 일관성 검증
  if (result.monitoring.servers.length !== result.ai.metrics.length) {
    throw new Error('모니터링과 AI 데이터의 서버 수가 일치하지 않습니다');
  }

  testResults.dataQuality.completeness = result.metadata.completeness;

  return {
    monitoringServerCount: result.monitoring.servers.length,
    aiMetricsCount: result.ai.metrics.length,
    processingTime,
    dataConsistency:
      result.monitoring.servers.length === result.ai.metrics.length,
    completeness: result.metadata.completeness,
  };
}

/**
 * ⚡ 캐시 성능 테스트
 */
async function testCachePerformance() {
  const { UnifiedDataProcessor } = await import(
    '../../src/services/data-generator/UnifiedDataProcessor.ts'
  );

  const processor = UnifiedDataProcessor.getInstance();

  // 첫 번째 호출 (캐시 미스)
  const startTime1 = Date.now();
  await processor.processData('monitoring', { forceRefresh: true });
  const firstCallTime = Date.now() - startTime1;

  // 두 번째 호출 (캐시 히트)
  const startTime2 = Date.now();
  const cachedResult = await processor.processData('monitoring');
  const secondCallTime = Date.now() - startTime2;

  const cacheHitRate = secondCallTime < firstCallTime * 0.1 ? 1 : 0;
  testResults.performance.cacheHitRate = cacheHitRate;

  // 캐시 상태 확인
  const status = processor.getStatus();

  return {
    firstCallTime,
    secondCallTime,
    speedupRatio: firstCallTime / secondCallTime,
    cacheHit: cachedResult.metadata.cacheHit,
    cacheStats: status.cacheStats,
    processingStats: status.processingStats,
  };
}

/**
 * 🎯 AI 특성 검증 테스트
 */
async function testAIFeatures() {
  const { UnifiedDataProcessor } = await import(
    '../../src/services/data-generator/UnifiedDataProcessor.ts'
  );

  const processor = UnifiedDataProcessor.getInstance();
  const result = await processor.processData('ai', {
    forceRefresh: true,
    enableAnomalyDetection: true,
  });

  const metrics = result.ai.metrics;
  const featuresValidation = {
    anomalyScores: [],
    riskLevels: [],
    patternSignatures: [],
    contextAccuracy: 0,
  };

  let validContextCount = 0;

  metrics.forEach(metric => {
    const features = metric.aiFeatures;
    const context = metric.context;

    // 이상 점수 검증 (0-1 범위)
    if (features.anomalyScore >= 0 && features.anomalyScore <= 1) {
      featuresValidation.anomalyScores.push(features.anomalyScore);
    }

    // 위험 수준 검증
    if (['low', 'medium', 'high', 'critical'].includes(features.riskLevel)) {
      featuresValidation.riskLevels.push(features.riskLevel);
    }

    // 패턴 시그니처 검증
    if (
      features.patternSignature &&
      features.patternSignature.startsWith('pattern_')
    ) {
      featuresValidation.patternSignatures.push(features.patternSignature);
    }

    // 컨텍스트 검증
    if (
      context.serverRole &&
      context.environment &&
      context.businessCriticality
    ) {
      validContextCount++;
    }
  });

  featuresValidation.contextAccuracy = validContextCount / metrics.length;

  return {
    totalMetrics: metrics.length,
    validAnomalyScores: featuresValidation.anomalyScores.length,
    validRiskLevels: featuresValidation.riskLevels.length,
    validPatternSignatures: featuresValidation.patternSignatures.length,
    contextAccuracy: featuresValidation.contextAccuracy,
    avgAnomalyScore:
      featuresValidation.anomalyScores.reduce((a, b) => a + b, 0) /
      featuresValidation.anomalyScores.length,
    riskDistribution: featuresValidation.riskLevels.reduce((acc, level) => {
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {}),
  };
}

/**
 * 📊 성능 벤치마크 테스트
 */
async function testPerformanceBenchmark() {
  const { UnifiedDataProcessor } = await import(
    '../../src/services/data-generator/UnifiedDataProcessor.ts'
  );

  const processor = UnifiedDataProcessor.getInstance();
  const iterations = 5;
  const results = {
    monitoring: [],
    ai: [],
    both: [],
  };

  // 각 처리 방식별로 여러 번 실행
  for (let i = 0; i < iterations; i++) {
    // 모니터링 처리
    const startMonitoring = Date.now();
    await processor.processData('monitoring', { forceRefresh: true });
    results.monitoring.push(Date.now() - startMonitoring);

    // AI 처리
    const startAI = Date.now();
    await processor.processData('ai', { forceRefresh: true });
    results.ai.push(Date.now() - startAI);

    // 통합 처리
    const startBoth = Date.now();
    await processor.processData('both', { forceRefresh: true });
    results.both.push(Date.now() - startBoth);
  }

  const calculateStats = times => ({
    avg: times.reduce((a, b) => a + b, 0) / times.length,
    min: Math.min(...times),
    max: Math.max(...times),
    median: times.sort()[Math.floor(times.length / 2)],
  });

  return {
    monitoring: calculateStats(results.monitoring),
    ai: calculateStats(results.ai),
    both: calculateStats(results.both),
    iterations,
  };
}

/**
 * 📋 종합 리포트 생성
 */
function generateReport() {
  const successRate = (testResults.passedTests / testResults.totalTests) * 100;

  console.log('\n' + '='.repeat(80));
  log('🚀 통합 전처리 엔진 테스트 결과 리포트', 'bright');
  console.log('='.repeat(80));

  log(`📊 테스트 요약:`, 'cyan');
  log(`   총 테스트: ${testResults.totalTests}개`);
  log(`   성공: ${testResults.passedTests}개`, 'green');
  log(
    `   실패: ${testResults.failedTests}개`,
    testResults.failedTests > 0 ? 'red' : 'white'
  );
  log(
    `   성공률: ${successRate.toFixed(1)}%`,
    successRate >= 90 ? 'green' : 'yellow'
  );

  log(`\n⚡ 성능 분석:`, 'cyan');
  log(
    `   모니터링 처리: ${testResults.performance.monitoringProcessingTime}ms`
  );
  log(`   AI 처리: ${testResults.performance.aiProcessingTime}ms`);
  log(`   통합 처리: ${testResults.performance.bothProcessingTime}ms`);
  log(
    `   캐시 히트율: ${(testResults.performance.cacheHitRate * 100).toFixed(1)}%`
  );

  log(`\n📈 데이터 품질:`, 'cyan');
  log(
    `   모니터링 데이터 품질: ${(testResults.dataQuality.monitoringDataQuality * 100).toFixed(1)}%`
  );
  log(
    `   AI 데이터 품질: ${(testResults.dataQuality.aiDataQuality * 100).toFixed(1)}%`
  );
  log(`   완전성: ${(testResults.dataQuality.completeness * 100).toFixed(1)}%`);

  log(`\n🎯 종합 평가:`, 'cyan');
  if (
    successRate >= 95 &&
    testResults.performance.monitoringProcessingTime < 200
  ) {
    log('   🌟 우수: 모든 테스트를 통과하고 성능이 뛰어납니다!', 'green');
  } else if (successRate >= 80) {
    log('   ✅ 양호: 대부분의 테스트를 통과했습니다.', 'yellow');
  } else {
    log('   ⚠️ 개선 필요: 일부 테스트가 실패했습니다.', 'red');
  }

  console.log('\n' + '='.repeat(80));

  // 상세 결과를 파일로 저장
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTests: testResults.totalTests,
      passedTests: testResults.passedTests,
      failedTests: testResults.failedTests,
      successRate: successRate,
    },
    performance: testResults.performance,
    dataQuality: testResults.dataQuality,
    details: testResults.details,
  };

  const reportPath = path.join(
    __dirname,
    '../docs/unified-processor-test-report.json'
  );
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  log(`📄 상세 리포트 저장: ${reportPath}`, 'blue');
}

/**
 * 🚀 메인 테스트 실행
 */
async function main() {
  log('🚀 통합 전처리 엔진 테스트 시작', 'bright');
  log('━'.repeat(80), 'cyan');

  try {
    // 1. 모니터링 전처리 테스트
    await runTest('모니터링 전처리', testMonitoringProcessing);

    // 2. AI 전처리 테스트
    await runTest('AI 전처리', testAIProcessing);

    // 3. 통합 처리 테스트
    await runTest('통합 처리', testBothProcessing);

    // 4. 캐시 성능 테스트
    await runTest('캐시 성능', testCachePerformance);

    // 5. AI 특성 검증 테스트
    await runTest('AI 특성 검증', testAIFeatures);

    // 6. 성능 벤치마크 테스트
    await runTest('성능 벤치마크', testPerformanceBenchmark);

    // 7. 종합 리포트 생성
    generateReport();
  } catch (error) {
    log(`❌ 테스트 실행 중 오류: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  runTest,
  testMonitoringProcessing,
  testAIProcessing,
  testBothProcessing,
  testCachePerformance,
  testAIFeatures,
  testPerformanceBenchmark,
};
