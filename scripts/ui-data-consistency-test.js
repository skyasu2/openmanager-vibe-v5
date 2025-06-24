/**
 * 🔍 UI 데이터 정합성 검증 스크립트 v1.0
 *
 * 서버데이터 생성기와 UI 컴포넌트 간의 데이터 일치성 검증:
 * - 서버 카드 데이터 매핑 검증
 * - 서버 모달 데이터 표시 검증
 * - 대시보드 통계 일치성 검증
 * - 실시간 업데이트 동기화 검증
 */

const BASE_URL = 'http://localhost:3000';

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

// 📡 API 호출 함수
async function fetchAPI(endpoint) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    throw new Error(`API 호출 실패 [${endpoint}]: ${error.message}`);
  }
}

// 🔍 1. 서버 데이터 생성기 데이터 수집
async function getServerGeneratorData() {
  log('📊 서버 데이터 생성기 데이터 수집 중...', 'cyan');

  const data = await fetchAPI('/api/servers/realtime?limit=50');
  if (!data.success || !data.data) {
    throw new Error('서버 데이터 생성기 응답이 유효하지 않습니다');
  }

  const servers = data.data.map(server => ({
    id: server.id,
    name: server.name,
    hostname: server.hostname,
    status: server.status,
    cpu: server.cpu,
    memory: server.memory,
    disk: server.disk,
    network: server.network,
    uptime: server.uptime,
    location: server.location,
    environment: server.environment,
    type: server.type,
    provider: server.provider,
    ip: server.ip,
    os: server.os,
    alerts: server.alerts,
    services: server.services || [],
    specs: server.specs || {},
    lastUpdate: server.lastUpdate,
    source: 'server-generator',
  }));

  log(`✅ 서버 데이터 생성기: ${servers.length}개 서버 수집 완료`, 'green');
  return { servers, summary: data.summary };
}

// 📊 2. 대시보드 API 데이터 수집
async function getDashboardData() {
  log('📈 대시보드 API 데이터 수집 중...', 'cyan');

  const data = await fetchAPI('/api/dashboard');
  if (!data.data || !data.data.servers) {
    throw new Error('대시보드 API 응답이 유효하지 않습니다');
  }

  const servers = data.data.servers.map(server => ({
    id: server.id,
    name: server.hostname, // 대시보드에서는 hostname을 name으로 사용
    hostname: server.hostname,
    status: server.status,
    cpu: server.node_cpu_usage_percent || server.cpu_usage,
    memory: server.node_memory_usage_percent || server.memory_usage,
    disk: server.node_disk_usage_percent || server.disk_usage,
    network:
      (server.node_network_receive_rate_mbps || 0) +
      (server.node_network_transmit_rate_mbps || 0),
    uptime: server.uptime,
    location: server.labels?.cluster || 'unknown',
    environment: server.environment,
    type: 'unknown', // 대시보드 API에서는 타입 정보가 제한적
    provider: 'unknown',
    ip: 'unknown',
    os: 'unknown',
    alerts: 0,
    services: [],
    specs: {},
    lastUpdate: server.last_updated,
    source: 'dashboard-api',
  }));

  log(`✅ 대시보드 API: ${servers.length}개 서버 수집 완료`, 'green');
  return { servers, overview: data.data.overview };
}

// 🔍 3. 데이터 필드별 정합성 검증
function validateDataConsistency(generatorData, dashboardData) {
  log('🔍 데이터 정합성 검증 시작...', 'magenta');

  const genServers = generatorData.servers;
  const dashServers = dashboardData.servers;

  const results = {
    serverCount: false,
    serverIds: false,
    coreMetrics: false,
    dataMapping: false,
    uiCompatibility: false,
    details: {},
  };

  // 3.1 서버 개수 일치 확인
  log(`\n📊 서버 개수 비교:`, 'blue');
  log(`  - 서버 생성기: ${genServers.length}개`);
  log(`  - 대시보드 API: ${dashServers.length}개`);

  results.serverCount = genServers.length === dashServers.length;
  log(
    `  ${results.serverCount ? '✅' : '❌'} 서버 개수 ${results.serverCount ? '일치' : '불일치'}`,
    results.serverCount ? 'green' : 'red'
  );

  // 3.2 서버 ID 매핑 확인
  const genIds = new Set(genServers.map(s => s.id));
  const dashIds = new Set(dashServers.map(s => s.id));
  const commonIds = new Set([...genIds].filter(id => dashIds.has(id)));

  log(`\n🔑 서버 ID 매핑:`, 'blue');
  log(`  - 공통 ID: ${commonIds.size}개`);
  log(`  - 생성기 전용: ${genIds.size - commonIds.size}개`);
  log(`  - 대시보드 전용: ${dashIds.size - commonIds.size}개`);

  results.serverIds =
    commonIds.size >= Math.min(genIds.size, dashIds.size) * 0.8;
  log(
    `  ${results.serverIds ? '✅' : '❌'} ID 매핑 ${results.serverIds ? '80% 이상 일치' : '부족'}`,
    results.serverIds ? 'green' : 'red'
  );

  // 3.3 핵심 메트릭 정합성 (CPU, Memory, Disk)
  log(`\n📈 핵심 메트릭 정합성 (공통 서버 ${commonIds.size}개):`, 'blue');

  let metricsMatchCount = 0;
  const metricDetails = [];

  for (const id of commonIds) {
    const genServer = genServers.find(s => s.id === id);
    const dashServer = dashServers.find(s => s.id === id);

    if (genServer && dashServer) {
      const cpuDiff = Math.abs(genServer.cpu - dashServer.cpu);
      const memoryDiff = Math.abs(genServer.memory - dashServer.memory);
      const diskDiff = Math.abs(genServer.disk - dashServer.disk);

      // 5% 이내 차이를 허용 (실시간 데이터 변동 고려)
      const isMatch = cpuDiff <= 5 && memoryDiff <= 5 && diskDiff <= 5;

      if (isMatch) metricsMatchCount++;

      metricDetails.push({
        id,
        name: genServer.name,
        isMatch,
        differences: {
          cpu: cpuDiff.toFixed(1),
          memory: memoryDiff.toFixed(1),
          disk: diskDiff.toFixed(1),
        },
      });
    }
  }

  const metricsMatchRate =
    commonIds.size > 0 ? metricsMatchCount / commonIds.size : 0;
  results.coreMetrics = metricsMatchRate >= 0.8; // 80% 이상 일치

  log(
    `  - 메트릭 일치 서버: ${metricsMatchCount}/${commonIds.size}개 (${(metricsMatchRate * 100).toFixed(1)}%)`
  );
  log(
    `  ${results.coreMetrics ? '✅' : '❌'} 메트릭 정합성 ${results.coreMetrics ? '80% 이상 일치' : '부족'}`,
    results.coreMetrics ? 'green' : 'red'
  );

  // 3.4 UI 컴포넌트 호환성 검증
  log(`\n🎨 UI 컴포넌트 호환성 검증:`, 'blue');

  const uiRequiredFields = ['id', 'name', 'status', 'cpu', 'memory', 'disk'];
  const uiOptionalFields = [
    'network',
    'uptime',
    'location',
    'environment',
    'alerts',
    'services',
  ];

  let uiCompatibilityScore = 0;
  const uiFieldResults = {};

  // 필수 필드 검증 (각각 20점)
  uiRequiredFields.forEach(field => {
    const hasField = genServers.every(
      server => server[field] !== undefined && server[field] !== null
    );
    uiFieldResults[field] = {
      required: true,
      present: hasField,
      score: hasField ? 20 : 0,
    };
    if (hasField) uiCompatibilityScore += 20;
  });

  // 선택적 필드 검증 (각각 5점)
  uiOptionalFields.forEach(field => {
    const hasField = genServers.some(
      server => server[field] !== undefined && server[field] !== null
    );
    uiFieldResults[field] = {
      required: false,
      present: hasField,
      score: hasField ? 5 : 0,
    };
    if (hasField) uiCompatibilityScore += 5;
  });

  const maxScore = uiRequiredFields.length * 20 + uiOptionalFields.length * 5;
  const uiCompatibilityRate = uiCompatibilityScore / maxScore;
  results.uiCompatibility = uiCompatibilityRate >= 0.9; // 90% 이상

  log(
    `  - UI 호환성 점수: ${uiCompatibilityScore}/${maxScore} (${(uiCompatibilityRate * 100).toFixed(1)}%)`
  );
  log(
    `  ${results.uiCompatibility ? '✅' : '❌'} UI 호환성 ${results.uiCompatibility ? '90% 이상' : '부족'}`,
    results.uiCompatibility ? 'green' : 'red'
  );

  // 필수 필드 누락 체크
  const missingRequired = uiRequiredFields.filter(
    field => !uiFieldResults[field].present
  );
  if (missingRequired.length > 0) {
    log(`  ⚠️ 누락된 필수 필드: ${missingRequired.join(', ')}`, 'yellow');
  }

  // 상세 결과 저장
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
    uiCompatibility: {
      score: uiCompatibilityScore,
      maxScore: maxScore,
      rate: uiCompatibilityRate,
      fieldResults: uiFieldResults,
    },
    metricDetails: metricDetails.slice(0, 5), // 상위 5개만 저장
  };

  return results;
}

// 📋 4. 결과 리포트 생성
function generateReport(results) {
  log('\n📋 UI 데이터 정합성 검증 결과 리포트', 'bright');
  log('='.repeat(60), 'bright');

  const validationKeys = [
    'serverCount',
    'serverIds',
    'coreMetrics',
    'uiCompatibility',
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
  log(`  ${results.serverIds ? '✅' : '❌'} 서버 ID 매핑 (80% 이상)`);
  log(`  ${results.coreMetrics ? '✅' : '❌'} 핵심 메트릭 정합성 (80% 이상)`);
  log(
    `  ${results.uiCompatibility ? '✅' : '❌'} UI 컴포넌트 호환성 (90% 이상)`
  );

  if (results.details) {
    log(`\n📈 상세 통계:`, 'cyan');
    log(
      `  - 서버 개수: 생성기 ${results.details.serverCounts.generator}개, 대시보드 ${results.details.serverCounts.dashboard}개`
    );
    log(
      `  - ID 매핑: 공통 ${results.details.idMatching.common}개, 생성기전용 ${results.details.idMatching.generatorOnly}개, 대시보드전용 ${results.details.idMatching.dashboardOnly}개`
    );
    log(
      `  - 메트릭 일치: ${results.details.metricsMatching.matched}/${results.details.metricsMatching.total}개 (${(results.details.metricsMatching.rate * 100).toFixed(1)}%)`
    );
    log(
      `  - UI 호환성: ${results.details.uiCompatibility.score}/${results.details.uiCompatibility.maxScore} (${(results.details.uiCompatibility.rate * 100).toFixed(1)}%)`
    );
  }

  // 권장사항
  log(`\n💡 권장사항:`, 'yellow');
  if (!results.serverCount) {
    log(`  - 서버 데이터 생성기와 대시보드 API의 서버 개수 불일치 해결 필요`);
  }
  if (!results.serverIds) {
    log(
      `  - 서버 ID 매핑 일치율 개선 필요 (현재 ${results.details?.idMatching ? ((results.details.idMatching.common / Math.max(results.details.serverCounts.generator, results.details.serverCounts.dashboard)) * 100).toFixed(1) : '알 수 없음'}%)`
    );
  }
  if (!results.coreMetrics) {
    log(`  - CPU, Memory, Disk 메트릭 동기화 개선 필요`);
  }
  if (!results.uiCompatibility) {
    log(`  - UI 컴포넌트 필수 필드 누락 해결 필요`);
    if (results.details?.uiCompatibility?.fieldResults) {
      const missingRequired = Object.entries(
        results.details.uiCompatibility.fieldResults
      )
        .filter(([, info]) => info.required && !info.present)
        .map(([field]) => field);
      if (missingRequired.length > 0) {
        log(`    누락된 필수 필드: ${missingRequired.join(', ')}`);
      }
    }
  }

  if (passed === total) {
    log(`\n🎉 결론: UI 데이터 정합성이 완벽합니다!`, 'green');
  } else if (score >= 75) {
    log(`\n✅ 결론: UI 데이터 정합성이 양호합니다.`, 'green');
  } else if (score >= 50) {
    log(`\n⚠️ 결론: UI 데이터 정합성에 개선이 필요합니다.`, 'yellow');
  } else {
    log(`\n❌ 결론: UI 데이터 정합성에 심각한 문제가 있습니다.`, 'red');
  }
}

// 🚀 메인 실행 함수
async function main() {
  log('🔍 UI 데이터 정합성 검증 시작', 'bright');
  log('━'.repeat(60), 'bright');
  log(`📡 대상 서버: ${BASE_URL}`);
  log(`⏰ 시작 시간: ${new Date().toLocaleString()}\n`);

  try {
    // 1. 서버 데이터 생성기 데이터 수집
    const generatorData = await getServerGeneratorData();

    // 2. 대시보드 API 데이터 수집
    const dashboardData = await getDashboardData();

    // 3. 데이터 정합성 검증
    const results = validateDataConsistency(generatorData, dashboardData);

    // 4. 결과 리포트 생성
    generateReport(results);
  } catch (error) {
    log(`❌ 검증 실행 중 오류 발생: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }

  log(`\n⏰ 완료 시간: ${new Date().toLocaleString()}`, 'bright');
}

// 스크립트 실행
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  main,
  getServerGeneratorData,
  getDashboardData,
  validateDataConsistency,
  generateReport,
};
