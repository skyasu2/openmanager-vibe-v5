/**
 * 🔄 데이터 통합 검증 테스트
 *
 * 통합 전처리 엔진이 서버 모니터링과 AI 기능들에게
 * 올바른 데이터를 제공하는지 검증합니다.
 */

const BASE_URL = 'http://localhost:3000';

async function fetchAPI(endpoint) {
  try {
    console.log(`📡 API 호출: ${endpoint}`);
    const response = await fetch(`${BASE_URL}${endpoint}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}: ${data.error || data.message || 'Unknown error'}`
      );
    }

    return data;
  } catch (error) {
    console.error(`❌ API 호출 실패 (${endpoint}):`, error.message);
    return null;
  }
}

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

async function testUnifiedPreprocessingAPI() {
  log('🚀 통합 전처리 엔진 API 테스트', 'cyan');

  // 1. 모니터링 전용 데이터 테스트
  log('📊 1. 모니터링 전용 데이터 테스트...', 'blue');
  const monitoringData = await fetchAPI(
    '/api/data-generator/unified-preprocessing?purpose=monitoring&forceRefresh=true'
  );

  if (monitoringData && monitoringData.success) {
    log(
      `✅ 모니터링 데이터 성공: ${monitoringData.data.monitoring?.servers?.length || 0}개 서버`,
      'green'
    );
    log(
      `   - 처리시간: ${monitoringData.data.metadata.processingTime}ms`,
      'white'
    );
    log(
      `   - 캐시 히트: ${monitoringData.data.metadata.cacheHit ? 'Yes' : 'No'}`,
      'white'
    );
    log(
      `   - 데이터 품질: ${(monitoringData.data.metadata.dataQuality * 100).toFixed(1)}%`,
      'white'
    );
  } else {
    log('❌ 모니터링 데이터 테스트 실패', 'red');
    return false;
  }

  // 2. AI 전용 데이터 테스트
  log('🤖 2. AI 전용 데이터 테스트...', 'blue');
  const aiData = await fetchAPI(
    '/api/data-generator/unified-preprocessing?purpose=ai&enableAnomalyDetection=true'
  );

  if (aiData && aiData.success) {
    log(
      `✅ AI 데이터 성공: ${aiData.data.ai?.metrics?.length || 0}개 AI 메트릭`,
      'green'
    );
    log(
      `   - 정규화된 메트릭: ${aiData.data.ai?.metrics?.[0]?.normalizedMetrics ? 'Yes' : 'No'}`,
      'white'
    );
    log(
      `   - AI 특성: ${aiData.data.ai?.metrics?.[0]?.aiFeatures ? 'Yes' : 'No'}`,
      'white'
    );
    log(
      `   - 이상 점수: ${aiData.data.ai?.metrics?.[0]?.aiFeatures?.anomalyScore?.toFixed(3) || 'N/A'}`,
      'white'
    );
  } else {
    log('❌ AI 데이터 테스트 실패', 'red');
    return false;
  }

  // 3. 통합 데이터 테스트
  log('🔄 3. 통합 데이터 테스트...', 'blue');
  const bothData = await fetchAPI(
    '/api/data-generator/unified-preprocessing?purpose=both&normalizationMode=minmax'
  );

  if (bothData && bothData.success) {
    log(`✅ 통합 데이터 성공`, 'green');
    log(`   - 모니터링: ${bothData.data.monitoring ? 'Yes' : 'No'}`, 'white');
    log(`   - AI 데이터: ${bothData.data.ai ? 'Yes' : 'No'}`, 'white');
    log(
      `   - 완전성: ${(bothData.data.metadata.completeness * 100).toFixed(1)}%`,
      'white'
    );
  } else {
    log('❌ 통합 데이터 테스트 실패', 'red');
    return false;
  }

  // 4. 상태 API 테스트
  log('📈 4. 상태 API 테스트...', 'blue');
  const statusData = await fetchAPI(
    '/api/data-generator/unified-preprocessing/status?detailed=true&includeCache=true'
  );

  if (statusData && statusData.success) {
    log(`✅ 상태 API 성공`, 'green');
    log(
      `   - 엔진 준비상태: ${statusData.data.status.isReady ? 'Ready' : 'Not Ready'}`,
      'white'
    );
    log(
      `   - 총 처리 건수: ${statusData.data.performance.totalProcessed}`,
      'white'
    );
    log(
      `   - 캐시 히트율: ${statusData.data.performance.cacheHitRate.toFixed(1)}%`,
      'white'
    );
    log(`   - 건강도 점수: ${statusData.data.health.score}/100`, 'white');
  } else {
    log('❌ 상태 API 테스트 실패', 'red');
    return false;
  }

  return true;
}

async function testMonitoringIntegration() {
  log('📊 서버 모니터링 통합 테스트', 'cyan');

  // 1. 대시보드 API 테스트
  log('🖥️ 1. 대시보드 API 테스트...', 'blue');
  const dashboardData = await fetchAPI('/api/dashboard');

  if (dashboardData && dashboardData.success) {
    log(
      `✅ 대시보드 데이터: ${dashboardData.data.servers?.length || 0}개 서버`,
      'green'
    );
    log(`   - 총 서버: ${dashboardData.data.overview?.total || 0}`, 'white');
    log(`   - 정상: ${dashboardData.data.overview?.healthy || 0}`, 'white');
    log(`   - 경고: ${dashboardData.data.overview?.warning || 0}`, 'white');
    log(`   - 오프라인: ${dashboardData.data.overview?.offline || 0}`, 'white');
  } else {
    log('❌ 대시보드 API 테스트 실패', 'red');
    return false;
  }

  // 2. 실시간 서버 API 테스트
  log('⚡ 2. 실시간 서버 API 테스트...', 'blue');
  const realtimeData = await fetchAPI('/api/servers?limit=10');

  if (realtimeData && realtimeData.success) {
    log(
      `✅ 실시간 서버 데이터: ${realtimeData.servers?.length || 0}개 서버`,
      'green'
    );
    log(`   - 평균 CPU: ${realtimeData.stats?.avgCpu || 0}%`, 'white');
    log(`   - 평균 메모리: ${realtimeData.stats?.avgMemory || 0}%`, 'white');
    log(`   - 평균 디스크: ${realtimeData.stats?.avgDisk || 0}%`, 'white');
  } else {
    log('❌ 실시간 서버 API 테스트 실패', 'red');
    return false;
  }

  // 3. 통합 메트릭 API 테스트
  log('📈 3. 통합 메트릭 API 테스트...', 'blue');
  const metricsData = await fetchAPI('/api/unified-metrics?limit=5');

  if (metricsData && metricsData.success) {
    log(`✅ 통합 메트릭: ${metricsData.data?.length || 0}개 서버`, 'green');
    log(`   - 데이터 소스: ${metricsData.source || 'unknown'}`, 'white');
    log(
      `   - 일관성 보장: ${metricsData.dataConsistency || 'unknown'}`,
      'white'
    );
  } else {
    log('❌ 통합 메트릭 API 테스트 실패', 'red');
    return false;
  }

  return true;
}

async function testAIIntegration() {
  log('🤖 AI 기능 통합 테스트', 'cyan');

  // 1. AI 에이전트 상태 테스트
  log('🧠 1. AI 에이전트 상태 테스트...', 'blue');
  const aiStatus = await fetchAPI('/api/ai-agent?action=status');

  if (aiStatus && aiStatus.success) {
    log(`✅ AI 에이전트 상태: ${aiStatus.data?.message || 'OK'}`, 'green');
    log(
      `   - 사용 가능한 액션: ${aiStatus.data?.availableActions?.join(', ') || 'none'}`,
      'white'
    );
  } else {
    log('❌ AI 에이전트 상태 테스트 실패', 'red');
    return false;
  }

  // 2. AI 통합 API 테스트
  log('🔗 2. AI 통합 API 테스트...', 'blue');
  const aiIntegrated = await fetchAPI('/api/ai-agent/integrated?action=status');

  if (aiIntegrated) {
    log(`✅ AI 통합 상태: ${aiIntegrated.status || 'unknown'}`, 'green');
    log(
      `   - 엔진 상태: Unified(${aiIntegrated.engines?.unified}), RAG(${aiIntegrated.engines?.rag}), NLP(${aiIntegrated.engines?.nlp})`,
      'white'
    );
    log(
      `   - 응답시간: ${aiIntegrated.performance?.responseTime || 0}ms`,
      'white'
    );
    log(
      `   - 정확도: ${((aiIntegrated.performance?.accuracy || 0) * 100).toFixed(1)}%`,
      'white'
    );
  } else {
    log('❌ AI 통합 API 테스트 실패', 'red');
    return false;
  }

  // 3. AI 데이터 필터 테스트 (POST 요청)
  log('🔧 3. AI 데이터 필터 테스트...', 'blue');
  try {
    const response = await fetch(`${BASE_URL}/api/ai-agent/integrated`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: '현재 서버 상태를 분석해주세요',
        context: { source: 'test' },
      }),
    });

    const aiQuery = await response.json();

    if (aiQuery && aiQuery.response) {
      log(`✅ AI 쿼리 처리: ${aiQuery.query}`, 'green');
      log(`   - 응답: ${aiQuery.response.substring(0, 50)}...`, 'white');
      log(
        `   - 신뢰도: ${((aiQuery.confidence || 0) * 100).toFixed(1)}%`,
        'white'
      );
      log(
        `   - 처리시간: ${aiQuery.processing_time?.toFixed(1) || 0}ms`,
        'white'
      );
    } else {
      log('❌ AI 쿼리 처리 실패', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ AI 쿼리 테스트 오류: ${error.message}`, 'red');
    return false;
  }

  return true;
}

async function testDataConsistency() {
  log('🔍 데이터 일관성 검증', 'cyan');

  // 1. 동일한 서버 데이터 비교
  log('📊 1. 서버 데이터 일관성 검증...', 'blue');

  const [dashboardData, unifiedData, preprocessedData] = await Promise.all([
    fetchAPI('/api/dashboard'),
    fetchAPI('/api/unified-metrics?limit=10'),
    fetchAPI('/api/data-generator/unified-preprocessing?purpose=monitoring'),
  ]);

  if (dashboardData && unifiedData && preprocessedData) {
    const dashboardCount = dashboardData.data?.servers?.length || 0;
    const unifiedCount = unifiedData.data?.length || 0;
    const preprocessedCount =
      preprocessedData.data?.monitoring?.servers?.length || 0;

    log(`✅ 데이터 소스별 서버 개수:`, 'green');
    log(`   - 대시보드: ${dashboardCount}개`, 'white');
    log(`   - 통합 메트릭: ${unifiedCount}개`, 'white');
    log(`   - 전처리 엔진: ${preprocessedCount}개`, 'white');

    // 데이터 일관성 체크
    const isConsistent =
      Math.abs(dashboardCount - unifiedCount) <= 2 &&
      Math.abs(dashboardCount - preprocessedCount) <= 2;

    if (isConsistent) {
      log(`✅ 데이터 일관성: 양호 (차이 ±2개 이내)`, 'green');
    } else {
      log(`⚠️ 데이터 일관성: 주의 (차이가 큼)`, 'yellow');
    }

    return isConsistent;
  } else {
    log('❌ 데이터 일관성 검증 실패', 'red');
    return false;
  }
}

async function runAllTests() {
  log('🚀 통합 전처리 엔진 검증 테스트 시작', 'magenta');
  log(
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    'magenta'
  );

  const results = {
    preprocessingAPI: false,
    monitoringIntegration: false,
    aiIntegration: false,
    dataConsistency: false,
  };

  try {
    // 서버 준비 대기
    log('⏳ 서버 준비 대기 (5초)...', 'yellow');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 1. 통합 전처리 엔진 API 테스트
    results.preprocessingAPI = await testUnifiedPreprocessingAPI();

    // 2. 서버 모니터링 통합 테스트
    results.monitoringIntegration = await testMonitoringIntegration();

    // 3. AI 기능 통합 테스트
    results.aiIntegration = await testAIIntegration();

    // 4. 데이터 일관성 검증
    results.dataConsistency = await testDataConsistency();

    // 결과 요약
    log(
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      'magenta'
    );
    log('📋 테스트 결과 요약', 'magenta');
    log(
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      'magenta'
    );

    Object.entries(results).forEach(([test, passed]) => {
      const status = passed ? '✅ 통과' : '❌ 실패';
      const color = passed ? 'green' : 'red';
      log(`${test.padEnd(25)}: ${status}`, color);
    });

    const passedTests = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    const successRate = ((passedTests / totalTests) * 100).toFixed(1);

    log(
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      'magenta'
    );
    log(
      `전체 성공률: ${passedTests}/${totalTests} (${successRate}%)`,
      successRate >= 75 ? 'green' : 'red'
    );

    if (successRate >= 75) {
      log('🎉 통합 전처리 엔진이 성공적으로 검증되었습니다!', 'green');
    } else {
      log('⚠️ 일부 테스트가 실패했습니다. 문제를 확인해주세요.', 'yellow');
    }
  } catch (error) {
    log(`❌ 테스트 실행 중 오류: ${error.message}`, 'red');
  }
}

// 메인 실행
if (require.main === module) {
  runAllTests();
}
