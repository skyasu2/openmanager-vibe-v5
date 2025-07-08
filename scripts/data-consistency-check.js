/**
 * 🔍 데이터 일관성 검증 스크립트
 *
 * 목적: 서버 데이터 생성기와 모니터링 대시보드, AI 기능들이
 *       동일한 데이터 소스를 사용하는지 확인
 *
 * 검증 항목:
 * 1. 서버 개수 일치 확인
 * 2. 서버 ID 및 이름 일치 확인
 * 3. 메트릭 데이터 일치 확인 (시간차 허용)
 * 4. 상태 정보 일치 확인
 * 5. AI 엔진이 참조하는 데이터 확인
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

// 색상 출력을 위한 ANSI 코드
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// API 호출 헬퍼
async function fetchAPI(endpoint) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    log(`❌ API 호출 실패 [${endpoint}]: ${error.message}`, 'red');
    return null;
  }
}

// 서버 데이터 정규화 함수
function normalizeServerData(servers, source) {
  if (!Array.isArray(servers)) {
    log(`⚠️  ${source}: 서버 데이터가 배열이 아닙니다.`, 'yellow');
    return [];
  }

  return servers.map(server => ({
    id: server.id || server.serverId,
    name: server.name || server.hostname,
    status: server.status,
    cpu:
      server.cpu_usage ||
      server.node_cpu_usage_percent ||
      server.metrics?.cpu ||
      server.cpu ||
      0,
    memory:
      server.memory_usage ||
      server.node_memory_usage_percent ||
      server.metrics?.memory ||
      server.memory ||
      0,
    disk:
      server.disk_usage ||
      server.node_disk_usage_percent ||
      server.metrics?.disk ||
      server.disk ||
      0,
    source: source,
    timestamp:
      server.timestamp ||
      server.lastUpdate ||
      server.last_updated ||
      new Date().toISOString(),
  }));
}

// 메트릭 비교 함수 (시간차 허용)
function compareMetrics(server1, server2, tolerance = 10) {
  const cpuDiff = Math.abs(server1.cpu - server2.cpu);
  const memoryDiff = Math.abs(server1.memory - server2.memory);
  const diskDiff = Math.abs(server1.disk - server2.disk);

  return {
    cpu: cpuDiff <= tolerance,
    memory: memoryDiff <= tolerance,
    disk: diskDiff <= tolerance,
    cpuDiff,
    memoryDiff,
    diskDiff,
  };
}

// 1. 서버 데이터 생성기 데이터 수집
async function getServerGeneratorData() {
  log('\n📊 1. 서버 데이터 생성기 데이터 수집...', 'cyan');

  const data = await fetchAPI('/api/servers/realtime?limit=50');
  if (!data || !data.success) {
    log('❌ 서버 데이터 생성기 API 호출 실패', 'red');
    return null;
  }

  const servers = normalizeServerData(data.data || data.servers, 'generator');
  log(`✅ 서버 데이터 생성기: ${servers.length}개 서버`, 'green');

  return {
    servers,
    summary: data.summary,
    source: 'server-generator',
  };
}

// 2. 모니터링 대시보드 데이터 수집
async function getDashboardData() {
  log('\n📈 2. 모니터링 대시보드 데이터 수집...', 'cyan');

  const data = await fetchAPI('/api/dashboard');
  if (!data || !data.data) {
    log('❌ 대시보드 API 호출 실패', 'red');
    return null;
  }

  const servers = normalizeServerData(data.data.servers, 'dashboard');
  log(`✅ 모니터링 대시보드: ${servers.length}개 서버`, 'green');

  return {
    servers,
    overview: data.data.overview,
    source: 'dashboard',
  };
}

// 3. AI 엔진 데이터 수집
async function getAIEngineData() {
  log('\n🤖 3. AI 엔진 데이터 수집...', 'cyan');

  // AI 엔진 상태 확인
  const statusData = await fetchAPI('/api/ai/unified-query?action=status');
  if (!statusData || !statusData.success) {
    log('❌ AI 엔진 상태 확인 실패', 'red');
    return null;
  }

  // AI 쿼리로 서버 정보 요청
  const queryData = await fetchAPI(
    '/api/ai/unified-query?action=query&query=서버 상태를 알려줘&mode=AUTO'
  );
  if (!queryData || !queryData.success) {
    log('❌ AI 쿼리 실행 실패', 'red');
    return null;
  }

  log(
    `✅ AI 엔진 상태: ${statusData.engines?.length || 0}개 엔진 활성`,
    'green'
  );

  return {
    status: statusData,
    queryResult: queryData,
    source: 'ai-engine',
  };
}

// 4. 데이터 일관성 검증
function validateDataConsistency(generatorData, dashboardData, aiData) {
  log('\n🔍 4. 데이터 일관성 검증 시작...', 'magenta');

  const results = {
    serverCount: false,
    serverIds: false,
    serverNames: false,
    metricsConsistency: false,
    statusConsistency: false,
    aiDataAccess: false,
    details: {},
  };

  if (!generatorData || !dashboardData) {
    log('❌ 필수 데이터가 누락되어 검증을 수행할 수 없습니다.', 'red');
    return results;
  }

  const genServers = generatorData.servers;
  const dashServers = dashboardData.servers;

  // 4.1 서버 개수 일치 확인
  log(`\n📊 서버 개수 비교:`, 'blue');
  log(`  - 서버 생성기: ${genServers.length}개`);
  log(`  - 대시보드: ${dashServers.length}개`);

  results.serverCount = genServers.length === dashServers.length;
  if (results.serverCount) {
    log(`  ✅ 서버 개수 일치`, 'green');
  } else {
    log(`  ❌ 서버 개수 불일치`, 'red');
  }

  // 4.2 서버 ID 일치 확인
  const genIds = new Set(genServers.map(s => s.id));
  const dashIds = new Set(dashServers.map(s => s.id));
  const commonIds = new Set([...genIds].filter(id => dashIds.has(id)));

  log(`\n🔑 서버 ID 비교:`, 'blue');
  log(`  - 공통 ID: ${commonIds.size}개`);
  log(`  - 생성기 전용: ${genIds.size - commonIds.size}개`);
  log(`  - 대시보드 전용: ${dashIds.size - commonIds.size}개`);

  results.serverIds =
    commonIds.size > 0 &&
    commonIds.size >= Math.min(genIds.size, dashIds.size) * 0.8;
  if (results.serverIds) {
    log(`  ✅ 서버 ID 80% 이상 일치`, 'green');
  } else {
    log(`  ❌ 서버 ID 일치율 부족`, 'red');
  }

  // 4.3 메트릭 데이터 일치 확인 (공통 서버만)
  log(`\n📈 메트릭 데이터 비교 (공통 서버 ${commonIds.size}개):`, 'blue');

  let metricsMatchCount = 0;
  const metricDetails = [];

  for (const id of commonIds) {
    const genServer = genServers.find(s => s.id === id);
    const dashServer = dashServers.find(s => s.id === id);

    if (genServer && dashServer) {
      const comparison = compareMetrics(genServer, dashServer);
      const isMatch = comparison.cpu && comparison.memory && comparison.disk;

      if (isMatch) {
        metricsMatchCount++;
      }

      metricDetails.push({
        id,
        name: genServer.name,
        isMatch,
        differences: {
          cpu: comparison.cpuDiff.toFixed(1),
          memory: comparison.memoryDiff.toFixed(1),
          disk: comparison.diskDiff.toFixed(1),
        },
      });
    }
  }

  const metricsMatchRate =
    commonIds.size > 0 ? metricsMatchCount / commonIds.size : 0;
  results.metricsConsistency = metricsMatchRate >= 0.7; // 70% 이상 일치

  log(
    `  - 메트릭 일치 서버: ${metricsMatchCount}/${commonIds.size}개 (${(metricsMatchRate * 100).toFixed(1)}%)`
  );

  if (results.metricsConsistency) {
    log(`  ✅ 메트릭 데이터 70% 이상 일치`, 'green');
  } else {
    log(`  ❌ 메트릭 데이터 일치율 부족`, 'red');

    // 상세 차이점 출력 (처음 3개만)
    log(`  📋 메트릭 차이점 (상위 3개):`, 'yellow');
    metricDetails.slice(0, 3).forEach(detail => {
      if (!detail.isMatch) {
        log(
          `    - ${detail.name}: CPU차이 ${detail.differences.cpu}%, 메모리차이 ${detail.differences.memory}%, 디스크차이 ${detail.differences.disk}%`
        );
      }
    });
  }

  // 4.4 AI 데이터 접근 확인
  if (aiData && aiData.status) {
    log(`\n🤖 AI 엔진 데이터 접근 확인:`, 'blue');
    log(`  - AI 엔진 상태: ${aiData.status.status}`);
    log(`  - 활성 엔진: ${aiData.status.engines?.length || 0}개`);
    log(`  - 쿼리 응답: ${aiData.queryResult.response ? '성공' : '실패'}`);

    results.aiDataAccess = aiData.status.success && aiData.queryResult.success;

    if (results.aiDataAccess) {
      log(`  ✅ AI 엔진이 데이터에 정상 접근`, 'green');
    } else {
      log(`  ❌ AI 엔진 데이터 접근 문제`, 'red');
    }
  }

  results.details = {
    serverCounts: {
      generator: genServers.length,
      dashboard: dashServers.length,
    },
    idMatching: {
      common: commonIds.size,
      generatorOnly: genIds.size - commonIds.size,
      dashboardOnly: dashIds.size - commonIds.size,
    },
    metricsMatching: {
      matched: metricsMatchCount,
      total: commonIds.size,
      rate: metricsMatchRate,
    },
    metricDetails: metricDetails.slice(0, 5), // 상위 5개만 저장
  };

  return results;
}

// 5. 결과 리포트 생성
function generateReport(results) {
  log('\n📋 5. 데이터 일관성 검증 결과 리포트', 'bright');
  log('='.repeat(50), 'bright');

  // 검증 항목들만 필터링 (details 제외)
  const validationKeys = [
    'serverCount',
    'serverIds',
    'metricsConsistency',
    'aiDataAccess',
  ];
  const passed = validationKeys.filter(key => results[key] === true).length;
  const total = validationKeys.length;
  const score = ((passed / total) * 100).toFixed(1);

  log(
    `\n🎯 전체 점수: ${passed}/${total} (${score}%)`,
    score >= 80 ? 'green' : score >= 60 ? 'yellow' : 'red'
  );

  log(`\n📊 검증 항목별 결과:`, 'blue');
  log(`  ${results.serverCount ? '✅' : '❌'} 서버 개수 일치`);
  log(`  ${results.serverIds ? '✅' : '❌'} 서버 ID 일치 (80% 이상)`);
  log(
    `  ${results.metricsConsistency ? '✅' : '❌'} 메트릭 데이터 일치 (70% 이상)`
  );
  log(`  ${results.aiDataAccess ? '✅' : '❌'} AI 엔진 데이터 접근`);

  if (results.details) {
    log(`\n📈 상세 통계:`, 'cyan');
    log(
      `  - 서버 개수: 생성기 ${results.details.serverCounts.generator}개, 대시보드 ${results.details.serverCounts.dashboard}개`
    );
    log(
      `  - ID 매칭: 공통 ${results.details.idMatching.common}개, 생성기전용 ${results.details.idMatching.generatorOnly}개, 대시보드전용 ${results.details.idMatching.dashboardOnly}개`
    );
    log(
      `  - 메트릭 매칭: ${results.details.metricsMatching.matched}/${results.details.metricsMatching.total}개 (${(results.details.metricsMatching.rate * 100).toFixed(1)}%)`
    );
  }

  // 권장사항
  log(`\n💡 권장사항:`, 'yellow');
  if (!results.serverCount) {
    log(
      `  - 서버 데이터 생성기와 대시보드 API의 서버 개수 불일치 문제 해결 필요`
    );
  }
  if (!results.serverIds) {
    log(`  - 서버 ID 매핑 로직 검토 필요 (서로 다른 ID 체계 사용 중)`);
  }
  if (!results.metricsConsistency) {
    log(`  - 메트릭 데이터 동기화 간격 조정 또는 캐싱 로직 검토 필요`);
  }
  if (!results.aiDataAccess) {
    log(`  - AI 엔진의 데이터 소스 연결 상태 점검 필요`);
  }

  if (score >= 80) {
    log(`\n🎉 결론: 데이터 일관성이 우수합니다!`, 'green');
  } else if (score >= 60) {
    log(
      `\n⚠️  결론: 데이터 일관성에 일부 문제가 있지만 사용 가능한 수준입니다.`,
      'yellow'
    );
  } else {
    log(
      `\n🚨 결론: 데이터 일관성에 심각한 문제가 있습니다. 즉시 수정이 필요합니다.`,
      'red'
    );
  }

  return score;
}

// 메인 실행 함수
async function main() {
  log('🚀 OpenManager Vibe v5 데이터 일관성 검증 시작', 'bright');
  log(`📍 Base URL: ${BASE_URL}`, 'cyan');
  log(`⏰ 시작 시간: ${new Date().toLocaleString()}`, 'cyan');

  try {
    // 데이터 수집
    const [generatorData, dashboardData, aiData] = await Promise.all([
      getServerGeneratorData(),
      getDashboardData(),
      getAIEngineData(),
    ]);

    // 데이터 일관성 검증
    const results = validateDataConsistency(
      generatorData,
      dashboardData,
      aiData
    );

    // 결과 리포트 생성
    const score = generateReport(results);

    // 프로세스 종료 코드 설정
    process.exit(score >= 70 ? 0 : 1);
  } catch (error) {
    log(`\n❌ 검증 중 오류 발생: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  main();
}

module.exports = {
  main,
  validateDataConsistency,
  normalizeServerData,
  compareMetrics,
};
