/**
 * 🔄 데이터 통합 검증 스크립트
 *
 * 통합 전처리 엔진이 서버 모니터링과 AI 기능들에게
 * 올바른 데이터를 제공하는지 검증합니다.
 */

const BASE_URL = 'http://localhost:3000';

function log(message, color = 'white') {
  const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    reset: '\x1b[0m',
  };

  const timestamp = new Date().toLocaleTimeString('ko-KR');
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

async function fetchAPI(endpoint) {
  try {
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

/**
 * 1. 통합 전처리 엔진 기본 검증
 */
async function validateUnifiedProcessor() {
  log('🔧 통합 전처리 엔진 기본 검증', 'cyan');

  // 모니터링 데이터 검증
  const monitoringData = await fetchAPI(
    '/api/data-generator/unified-preprocessing?purpose=monitoring'
  );
  if (!monitoringData || !monitoringData.success) {
    log('❌ 모니터링 데이터 생성 실패', 'red');
    return false;
  }

  // AI 데이터 검증
  const aiData = await fetchAPI(
    '/api/data-generator/unified-preprocessing?purpose=ai&enableAnomalyDetection=true'
  );
  if (!aiData || !aiData.success) {
    log('❌ AI 데이터 생성 실패', 'red');
    return false;
  }

  // 상태 API 검증
  const statusData = await fetchAPI(
    '/api/data-generator/unified-preprocessing/status'
  );
  if (!statusData || !statusData.success) {
    log('❌ 상태 API 실패', 'red');
    return false;
  }

  log(`✅ 통합 전처리 엔진 기본 검증 완료`, 'green');
  log(
    `   - 모니터링 서버: ${monitoringData.data?.monitoring?.servers?.length || 0}개`,
    'white'
  );
  log(`   - AI 메트릭: ${aiData.data?.ai?.metrics?.length || 0}개`, 'white');
  log(`   - 엔진 상태: ${statusData.status}`, 'white');

  return {
    monitoring: monitoringData,
    ai: aiData,
    status: statusData,
  };
}

/**
 * 2. 서버 모니터링 시스템 검증
 */
async function validateMonitoringIntegration() {
  log('📊 서버 모니터링 시스템 검증', 'cyan');

  // 대시보드 API 검증
  const dashboardData = await fetchAPI('/api/dashboard');
  if (!dashboardData || !dashboardData.data) {
    log('❌ 대시보드 API 실패', 'red');
    return false;
  }

  // 실시간 서버 API 검증
  const serversData = await fetchAPI('/api/servers?limit=10');
  if (!serversData || !serversData.success) {
    log('❌ 실시간 서버 API 실패', 'red');
    return false;
  }

  // 통합 메트릭 API 검증
  const metricsData = await fetchAPI('/api/unified-metrics?limit=5');
  if (!metricsData || !metricsData.success) {
    log('❌ 통합 메트릭 API 실패', 'red');
    return false;
  }

  log(`✅ 서버 모니터링 시스템 검증 완료`, 'green');
  log(
    `   - 대시보드 서버: ${dashboardData.data?.servers?.length || 0}개`,
    'white'
  );
  log(`   - 실시간 서버: ${serversData.servers?.length || 0}개`, 'white');
  log(`   - 통합 메트릭: ${metricsData.data?.length || 0}개`, 'white');

  return {
    dashboard: dashboardData,
    servers: serversData,
    metrics: metricsData,
  };
}

/**
 * 3. AI 기능 시스템 검증
 */
async function validateAIIntegration() {
  log('🤖 AI 기능 시스템 검증', 'cyan');

  // AI 에이전트 상태 검증
  const aiAgentStatus = await fetchAPI('/api/ai-agent?action=status');
  if (!aiAgentStatus || !aiAgentStatus.success) {
    log('❌ AI 에이전트 상태 실패', 'red');
    return false;
  }

  // AI 통합 API 검증
  const aiIntegrated = await fetchAPI('/api/ai-agent/integrated?action=status');
  if (!aiIntegrated) {
    log('❌ AI 통합 API 실패', 'red');
    return false;
  }

  // 이상징후 모니터링 검증
  const anomalyData = await fetchAPI('/api/ai/anomaly');
  if (!anomalyData || !anomalyData.success) {
    log('❌ 이상징후 모니터링 실패', 'red');
    return false;
  }

  log(`✅ AI 기능 시스템 검증 완료`, 'green');
  log(`   - AI 에이전트: ${aiAgentStatus.data?.message || 'OK'}`, 'white');
  log(`   - 통합 상태: ${aiIntegrated.status || 'unknown'}`, 'white');
  log(
    `   - 모니터링 서버: ${anomalyData.systemStatus?.totalServers || 0}개`,
    'white'
  );

  return {
    agent: aiAgentStatus,
    integrated: aiIntegrated,
    anomaly: anomalyData,
  };
}

/**
 * 4. 데이터 일관성 검증
 */
async function validateDataConsistency(processorData, monitoringData, aiData) {
  log('🔍 데이터 일관성 검증', 'cyan');

  const issues = [];

  // 서버 개수 일관성 검증
  const processorServers =
    processorData.monitoring?.data?.monitoring?.servers?.length || 0;
  const dashboardServers = monitoringData.dashboard?.data?.servers?.length || 0;
  const realtimeServers = monitoringData.servers?.servers?.length || 0;

  if (Math.abs(processorServers - dashboardServers) > 2) {
    issues.push(
      `서버 개수 불일치: 전처리기(${processorServers}) vs 대시보드(${dashboardServers})`
    );
  }

  if (Math.abs(processorServers - realtimeServers) > 2) {
    issues.push(
      `서버 개수 불일치: 전처리기(${processorServers}) vs 실시간(${realtimeServers})`
    );
  }

  // AI 메트릭 검증
  const aiMetrics = processorData.ai?.data?.ai?.metrics?.length || 0;
  const anomalyServers = aiData.anomaly?.systemStatus?.totalServers || 0;

  if (Math.abs(aiMetrics - anomalyServers) > 2) {
    issues.push(
      `AI 메트릭 불일치: 전처리기(${aiMetrics}) vs 이상징후(${anomalyServers})`
    );
  }

  // 데이터 품질 검증
  const dataQuality = processorData.monitoring?.metadata?.dataQuality || 0;
  if (dataQuality < 0.9) {
    issues.push(`데이터 품질 낮음: ${(dataQuality * 100).toFixed(1)}%`);
  }

  if (issues.length === 0) {
    log(`✅ 데이터 일관성 검증 통과`, 'green');
    log(
      `   - 서버 개수: 전처리기(${processorServers}), 대시보드(${dashboardServers}), 실시간(${realtimeServers})`,
      'white'
    );
    log(
      `   - AI 메트릭: 전처리기(${aiMetrics}), 이상징후(${anomalyServers})`,
      'white'
    );
    log(`   - 데이터 품질: ${(dataQuality * 100).toFixed(1)}%`, 'white');
    return true;
  } else {
    log(`⚠️ 데이터 일관성 문제 발견:`, 'yellow');
    issues.forEach(issue => log(`   - ${issue}`, 'yellow'));
    return false;
  }
}

/**
 * 5. 성능 검증
 */
async function validatePerformance() {
  log('⚡ 성능 검증', 'cyan');

  const startTime = Date.now();

  // 동시 API 호출 테스트
  const promises = [
    fetchAPI('/api/data-generator/unified-preprocessing?purpose=monitoring'),
    fetchAPI('/api/data-generator/unified-preprocessing?purpose=ai'),
    fetchAPI('/api/dashboard'),
    fetchAPI('/api/servers?limit=5'),
    fetchAPI('/api/ai-agent?action=status'),
  ];

  const results = await Promise.allSettled(promises);
  const totalTime = Date.now() - startTime;

  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.length - successful;

  log(`✅ 성능 검증 완료`, 'green');
  log(`   - 총 처리시간: ${totalTime}ms`, 'white');
  log(`   - 성공한 API: ${successful}/${results.length}`, 'white');
  log(
    `   - 실패한 API: ${failed}/${results.length}`,
    failed > 0 ? 'yellow' : 'white'
  );
  log(
    `   - 평균 응답시간: ${(totalTime / results.length).toFixed(1)}ms`,
    'white'
  );

  return {
    totalTime,
    successful,
    failed,
    averageTime: totalTime / results.length,
  };
}

/**
 * 메인 검증 함수
 */
async function runValidation() {
  log('🚀 통합 전처리 엔진 데이터 연동 검증 시작', 'cyan');
  log('================================================', 'white');

  try {
    // 1. 통합 전처리 엔진 검증
    const processorData = await validateUnifiedProcessor();
    if (!processorData) {
      log('❌ 통합 전처리 엔진 검증 실패', 'red');
      return;
    }

    // 2. 서버 모니터링 검증
    const monitoringData = await validateMonitoringIntegration();
    if (!monitoringData) {
      log('❌ 서버 모니터링 검증 실패', 'red');
      return;
    }

    // 3. AI 기능 검증
    const aiData = await validateAIIntegration();
    if (!aiData) {
      log('❌ AI 기능 검증 실패', 'red');
      return;
    }

    // 4. 데이터 일관성 검증
    const consistencyPassed = await validateDataConsistency(
      processorData,
      monitoringData,
      aiData
    );

    // 5. 성능 검증
    const performanceData = await validatePerformance();

    // 최종 결과
    log('================================================', 'white');
    log('🎯 검증 결과 요약', 'cyan');
    log(`   ✅ 통합 전처리 엔진: 정상`, 'green');
    log(`   ✅ 서버 모니터링: 정상`, 'green');
    log(`   ✅ AI 기능: 정상`, 'green');
    log(
      `   ${consistencyPassed ? '✅' : '⚠️'} 데이터 일관성: ${consistencyPassed ? '통과' : '주의 필요'}`,
      consistencyPassed ? 'green' : 'yellow'
    );
    log(
      `   ✅ 성능: ${performanceData.averageTime.toFixed(1)}ms 평균`,
      'green'
    );

    if (consistencyPassed && performanceData.failed === 0) {
      log(
        '🎉 모든 검증 통과! 통합 전처리 엔진이 정상적으로 작동합니다.',
        'green'
      );
    } else {
      log('⚠️ 일부 문제가 발견되었지만 기본 기능은 정상입니다.', 'yellow');
    }
  } catch (error) {
    log(`❌ 검증 중 오류 발생: ${error.message}`, 'red');
  }
}

// 메인 실행
if (require.main === module) {
  runValidation();
}
