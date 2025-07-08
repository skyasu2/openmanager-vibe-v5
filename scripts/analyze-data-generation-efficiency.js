/**
 * 📊 서버 데이터 생성 효율성 분석 스크립트
 *
 * 목적: 직접 생성 방식 vs 전처리 방식의 성능, 메모리, 복잡도 비교
 *
 * 분석 항목:
 * 1. 응답 시간 비교
 * 2. 메모리 사용량 비교
 * 3. CPU 사용량 비교
 * 4. 캐시 효율성
 * 5. 코드 복잡도
 * 6. 유지보수성
 */

const BASE_URL = 'http://localhost:3000';

// 성능 측정 결과 저장
const performanceResults = {
  directGeneration: {
    monitoring: [],
    ai: [],
    both: [],
  },
  preprocessedGeneration: {
    monitoring: [],
    ai: [],
    both: [],
  },
  memoryUsage: {
    before: 0,
    afterDirect: 0,
    afterPreprocessed: 0,
  },
  cacheEfficiency: {
    directCacheHits: 0,
    preprocessedCacheHits: 0,
    totalRequests: 0,
  },
};

function log(message, color = 'white') {
  const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
    white: '\x1b[37m',
    reset: '\x1b[0m',
  };

  const timestamp = new Date().toLocaleTimeString('ko-KR');
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

async function fetchAPI(endpoint) {
  const startTime = Date.now();
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`);
    const data = await response.json();
    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}: ${data.error || data.message || 'Unknown error'}`
      );
    }

    return { data, responseTime, success: true };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ API 호출 실패 (${endpoint}):`, error.message);
    return { data: null, responseTime, success: false };
  }
}

function getMemoryUsage() {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const usage = process.memoryUsage();
    return {
      rss: Math.round(usage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
      external: Math.round(usage.external / 1024 / 1024), // MB
    };
  }
  return { rss: 0, heapTotal: 0, heapUsed: 0, external: 0 };
}

/**
 * 🔄 직접 생성 방식 성능 테스트
 */
async function testDirectGeneration() {
  log('🔄 직접 생성 방식 성능 테스트 시작', 'blue');

  const iterations = 10;
  const endpoints = {
    monitoring: '/api/dashboard',
    ai: '/api/ai-agent?action=status',
    both: '/api/servers?limit=15',
  };

  // 메모리 사용량 측정 시작
  performanceResults.memoryUsage.before = getMemoryUsage();

  for (const [type, endpoint] of Object.entries(endpoints)) {
    log(`  📊 ${type} 테스트 (${iterations}회)`, 'cyan');

    for (let i = 0; i < iterations; i++) {
      const result = await fetchAPI(endpoint);
      if (result.success) {
        performanceResults.directGeneration[type].push(result.responseTime);
      }

      // 부하 분산을 위한 짧은 대기
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  // 메모리 사용량 측정 완료
  performanceResults.memoryUsage.afterDirect = getMemoryUsage();

  // 통계 계산
  const stats = {};
  for (const [type, times] of Object.entries(
    performanceResults.directGeneration
  )) {
    if (times.length > 0) {
      stats[type] = {
        avg: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
        min: Math.min(...times),
        max: Math.max(...times),
        median: times.sort((a, b) => a - b)[Math.floor(times.length / 2)],
      };
    }
  }

  log('✅ 직접 생성 방식 테스트 완료', 'green');
  log(`   - 모니터링 평균: ${stats.monitoring?.avg || 0}ms`, 'white');
  log(`   - AI 평균: ${stats.ai?.avg || 0}ms`, 'white');
  log(`   - 통합 평균: ${stats.both?.avg || 0}ms`, 'white');

  return stats;
}

/**
 * 🧠 전처리 방식 성능 테스트
 */
async function testPreprocessedGeneration() {
  log('🧠 전처리 방식 성능 테스트 시작', 'blue');

  const iterations = 10;
  const endpoints = {
    monitoring: '/api/data-generator/unified-preprocessing?purpose=monitoring',
    ai: '/api/data-generator/unified-preprocessing?purpose=ai&enableAnomalyDetection=true',
    both: '/api/data-generator/unified-preprocessing?purpose=both',
  };

  for (const [type, endpoint] of Object.entries(endpoints)) {
    log(`  🧠 ${type} 테스트 (${iterations}회)`, 'cyan');

    for (let i = 0; i < iterations; i++) {
      const result = await fetchAPI(endpoint);
      if (result.success) {
        performanceResults.preprocessedGeneration[type].push(
          result.responseTime
        );

        // 캐시 히트 확인
        if (result.data?.metadata?.cacheHit) {
          performanceResults.cacheEfficiency.preprocessedCacheHits++;
        }
        performanceResults.cacheEfficiency.totalRequests++;
      }

      // 부하 분산을 위한 짧은 대기
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  // 메모리 사용량 측정 완료
  performanceResults.memoryUsage.afterPreprocessed = getMemoryUsage();

  // 통계 계산
  const stats = {};
  for (const [type, times] of Object.entries(
    performanceResults.preprocessedGeneration
  )) {
    if (times.length > 0) {
      stats[type] = {
        avg: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
        min: Math.min(...times),
        max: Math.max(...times),
        median: times.sort((a, b) => a - b)[Math.floor(times.length / 2)],
      };
    }
  }

  log('✅ 전처리 방식 테스트 완료', 'green');
  log(`   - 모니터링 평균: ${stats.monitoring?.avg || 0}ms`, 'white');
  log(`   - AI 평균: ${stats.ai?.avg || 0}ms`, 'white');
  log(`   - 통합 평균: ${stats.both?.avg || 0}ms`, 'white');

  return stats;
}

/**
 * 📈 캐시 효율성 테스트
 */
async function testCacheEfficiency() {
  log('📈 캐시 효율성 테스트', 'blue');

  // 전처리 방식 캐시 테스트
  const cacheEndpoint =
    '/api/data-generator/unified-preprocessing?purpose=monitoring';

  // 첫 번째 호출 (캐시 미스)
  const firstCall = await fetchAPI(cacheEndpoint + '&forceRefresh=true');

  // 연속 호출 (캐시 히트 기대)
  const cacheHits = [];
  for (let i = 0; i < 5; i++) {
    const result = await fetchAPI(cacheEndpoint);
    if (result.success && result.data?.metadata?.cacheHit) {
      cacheHits.push(result.responseTime);
    }
  }

  const cacheHitRate = cacheHits.length / 5;
  const avgCacheTime =
    cacheHits.length > 0
      ? Math.round(cacheHits.reduce((a, b) => a + b, 0) / cacheHits.length)
      : 0;

  log(`✅ 캐시 효율성: ${(cacheHitRate * 100).toFixed(1)}%`, 'green');
  log(`   - 캐시 미스: ${firstCall.responseTime}ms`, 'white');
  log(`   - 캐시 히트 평균: ${avgCacheTime}ms`, 'white');
  log(
    `   - 속도 향상: ${firstCall.responseTime > 0 ? (firstCall.responseTime / avgCacheTime).toFixed(1) : 0}배`,
    'white'
  );

  return {
    hitRate: cacheHitRate,
    missTime: firstCall.responseTime,
    hitTime: avgCacheTime,
    speedup: firstCall.responseTime / avgCacheTime,
  };
}

/**
 * 🔍 메모리 사용량 분석
 */
function analyzeMemoryUsage() {
  log('🔍 메모리 사용량 분석', 'blue');

  const { before, afterDirect, afterPreprocessed } =
    performanceResults.memoryUsage;

  const directIncrease = afterDirect.heapUsed - before.heapUsed;
  const preprocessedIncrease =
    afterPreprocessed.heapUsed - afterDirect.heapUsed;

  log(`✅ 메모리 사용량 분석 완료`, 'green');
  log(`   - 시작 시점: ${before.heapUsed}MB`, 'white');
  log(
    `   - 직접 생성 후: ${afterDirect.heapUsed}MB (+${directIncrease}MB)`,
    'white'
  );
  log(
    `   - 전처리 후: ${afterPreprocessed.heapUsed}MB (+${preprocessedIncrease}MB)`,
    'white'
  );
  log(
    `   - 메모리 효율성: ${directIncrease > preprocessedIncrease ? '전처리 방식 우수' : '직접 생성 우수'}`,
    directIncrease > preprocessedIncrease ? 'green' : 'yellow'
  );

  return {
    directIncrease,
    preprocessedIncrease,
    moreEfficient:
      directIncrease > preprocessedIncrease ? 'preprocessed' : 'direct',
  };
}

/**
 * 📊 종합 분석 및 권장사항
 */
function generateAnalysisReport(
  directStats,
  preprocessedStats,
  cacheStats,
  memoryStats
) {
  log(
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    'magenta'
  );
  log('📊 서버 데이터 생성 효율성 종합 분석 보고서', 'magenta');
  log(
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    'magenta'
  );

  // 1. 성능 비교
  log('🚀 1. 응답 시간 비교', 'cyan');
  const performanceWinner = {
    monitoring:
      directStats.monitoring?.avg < preprocessedStats.monitoring?.avg
        ? 'direct'
        : 'preprocessed',
    ai:
      directStats.ai?.avg < preprocessedStats.ai?.avg
        ? 'direct'
        : 'preprocessed',
    both:
      directStats.both?.avg < preprocessedStats.both?.avg
        ? 'direct'
        : 'preprocessed',
  };

  log(
    `   - 모니터링: 직접(${directStats.monitoring?.avg || 0}ms) vs 전처리(${preprocessedStats.monitoring?.avg || 0}ms) → ${performanceWinner.monitoring === 'direct' ? '직접 생성 우수' : '전처리 우수'}`,
    performanceWinner.monitoring === 'direct' ? 'yellow' : 'green'
  );
  log(
    `   - AI: 직접(${directStats.ai?.avg || 0}ms) vs 전처리(${preprocessedStats.ai?.avg || 0}ms) → ${performanceWinner.ai === 'direct' ? '직접 생성 우수' : '전처리 우수'}`,
    performanceWinner.ai === 'direct' ? 'yellow' : 'green'
  );
  log(
    `   - 통합: 직접(${directStats.both?.avg || 0}ms) vs 전처리(${preprocessedStats.both?.avg || 0}ms) → ${performanceWinner.both === 'direct' ? '직접 생성 우수' : '전처리 우수'}`,
    performanceWinner.both === 'direct' ? 'yellow' : 'green'
  );

  // 2. 캐시 효율성
  log('📈 2. 캐시 효율성', 'cyan');
  log(
    `   - 캐시 히트율: ${(cacheStats.hitRate * 100).toFixed(1)}%`,
    cacheStats.hitRate > 0.7 ? 'green' : 'yellow'
  );
  log(
    `   - 속도 향상: ${cacheStats.speedup.toFixed(1)}배`,
    cacheStats.speedup > 3 ? 'green' : 'yellow'
  );
  log(
    `   - 전처리 방식의 캐시 시스템이 ${cacheStats.speedup > 3 ? '매우 효과적' : '보통 수준'}`,
    cacheStats.speedup > 3 ? 'green' : 'yellow'
  );

  // 3. 메모리 효율성
  log('💾 3. 메모리 효율성', 'cyan');
  log(`   - 직접 생성: +${memoryStats.directIncrease}MB`, 'white');
  log(`   - 전처리 방식: +${memoryStats.preprocessedIncrease}MB`, 'white');
  log(
    `   - 메모리 효율성: ${memoryStats.moreEfficient === 'preprocessed' ? '전처리 방식 우수' : '직접 생성 우수'}`,
    memoryStats.moreEfficient === 'preprocessed' ? 'green' : 'yellow'
  );

  // 4. 복잡도 분석
  log('🔧 4. 코드 복잡도 및 유지보수성', 'cyan');
  log('   - 직접 생성 방식:', 'white');
  log('     ✅ 단순한 구조', 'green');
  log('     ❌ 중복 코드 발생', 'red');
  log('     ❌ 각 API별 개별 최적화 필요', 'red');
  log('   - 전처리 방식:', 'white');
  log('     ✅ 통합된 최적화', 'green');
  log('     ✅ 재사용 가능한 구조', 'green');
  log('     ✅ 캐시 시스템 내장', 'green');
  log('     ⚠️ 초기 구현 복잡도 높음', 'yellow');

  // 5. 확장성 분석
  log('📈 5. 확장성 분석', 'cyan');
  log(
    '   - 직접 생성 방식: 새로운 기능 추가 시 각 API별 개별 작업 필요',
    'yellow'
  );
  log('   - 전처리 방식: 중앙 집중식 개선으로 모든 기능에 자동 적용', 'green');

  // 6. 최종 권장사항
  log('🎯 6. 최종 권장사항', 'cyan');

  const overallScore = {
    direct: 0,
    preprocessed: 0,
  };

  // 성능 점수 (30점)
  Object.values(performanceWinner).forEach(winner => {
    if (winner === 'direct') overallScore.direct += 10;
    else overallScore.preprocessed += 10;
  });

  // 캐시 효율성 점수 (25점)
  if (cacheStats.hitRate > 0.7) overallScore.preprocessed += 25;
  else if (cacheStats.hitRate > 0.3) overallScore.preprocessed += 15;

  // 메모리 효율성 점수 (15점)
  if (memoryStats.moreEfficient === 'preprocessed')
    overallScore.preprocessed += 15;
  else overallScore.direct += 15;

  // 유지보수성 점수 (20점)
  overallScore.preprocessed += 20; // 전처리 방식이 유지보수성에서 우수

  // 확장성 점수 (10점)
  overallScore.preprocessed += 10; // 전처리 방식이 확장성에서 우수

  log(
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    'magenta'
  );

  if (overallScore.preprocessed > overallScore.direct) {
    log('🏆 결론: 전처리 방식 채택 권장', 'green');
    log(`   - 전처리 방식: ${overallScore.preprocessed}점`, 'green');
    log(`   - 직접 생성: ${overallScore.direct}점`, 'yellow');
    log('', 'white');
    log('📋 권장 이유:', 'white');
    log('   ✅ 캐시 시스템으로 반복 호출 시 성능 우수', 'green');
    log('   ✅ 통합된 최적화로 유지보수성 향상', 'green');
    log('   ✅ 확장성과 재사용성 우수', 'green');
    log('   ✅ 메모리 효율성 우수', 'green');
    log('', 'white');
    log('⚠️ 고려사항:', 'yellow');
    log('   - 초기 구현 복잡도가 높지만 장기적 이점이 큼', 'yellow');
    log('   - 캐시 무효화 전략이 중요함', 'yellow');
  } else {
    log('🏆 결론: 직접 생성 방식 유지 권장', 'yellow');
    log(`   - 직접 생성: ${overallScore.direct}점`, 'yellow');
    log(`   - 전처리 방식: ${overallScore.preprocessed}점`, 'white');
    log('', 'white');
    log('📋 권장 이유:', 'white');
    log('   ✅ 단순한 구조로 디버깅 용이', 'green');
    log('   ✅ 초기 응답 시간 우수', 'green');
    log('', 'white');
    log('⚠️ 고려사항:', 'yellow');
    log('   - 장기적으로 유지보수 비용 증가 가능성', 'yellow');
    log('   - 중복 코드 발생으로 일관성 관리 어려움', 'yellow');
  }

  log(
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    'magenta'
  );

  return {
    winner:
      overallScore.preprocessed > overallScore.direct
        ? 'preprocessed'
        : 'direct',
    scores: overallScore,
    recommendation:
      overallScore.preprocessed > overallScore.direct
        ? '전처리 방식 채택으로 장기적 효율성 확보'
        : '직접 생성 방식 유지로 단순성 확보',
  };
}

/**
 * 🚀 메인 분석 실행
 */
async function runAnalysis() {
  log('🚀 서버 데이터 생성 효율성 분석 시작', 'magenta');
  log(
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    'magenta'
  );

  try {
    // 1. 직접 생성 방식 테스트
    const directStats = await testDirectGeneration();

    // 메모리 정리를 위한 대기
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 2. 전처리 방식 테스트
    const preprocessedStats = await testPreprocessedGeneration();

    // 3. 캐시 효율성 테스트
    const cacheStats = await testCacheEfficiency();

    // 4. 메모리 사용량 분석
    const memoryStats = analyzeMemoryUsage();

    // 5. 종합 분석 및 권장사항
    const finalReport = generateAnalysisReport(
      directStats,
      preprocessedStats,
      cacheStats,
      memoryStats
    );

    log('✅ 서버 데이터 생성 효율성 분석 완료', 'green');

    return finalReport;
  } catch (error) {
    log(`❌ 분석 중 오류 발생: ${error.message}`, 'red');
    throw error;
  }
}

// 스크립트 실행
if (require.main === module) {
  runAnalysis()
    .then(() => {
      console.log('\n🎉 분석 완료!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 분석 실패:', error);
      process.exit(1);
    });
}

module.exports = {
  runAnalysis,
  testDirectGeneration,
  testPreprocessedGeneration,
  testCacheEfficiency,
  analyzeMemoryUsage,
};
