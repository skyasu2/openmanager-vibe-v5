/**
 * 🔍 OpenManager Vibe v5 - 데이터 일치성 검증 스크립트
 *
 * 서버 모니터링 프론트엔드와 서버 데이터 생성기 간의 데이터 일치성을 검증합니다.
 *
 * 실행: node scripts/data-consistency-verification.js
 */

const BASE_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : process.env.NEXTAUTH_URL
    ? process.env.NEXTAUTH_URL
    : process.argv[2]
      ? process.argv[2]
      : 'https://openmanager-vibe-v5.vercel.app'; // 기본값을 프로덕션 서버로 설정

// 🎯 검증할 API 엔드포인트들
const API_ENDPOINTS = {
  // 1. 메인 데이터 소스 (RealServerDataGenerator 기반)
  dashboard: '/api/dashboard',

  // 2. 기타 서버 데이터 소스들
  serversAll: '/api/servers/all',
  unifiedMetrics: '/api/unified-metrics',
  serversCached: '/api/servers/cached',
  realtimeServers: '/api/servers/realtime',

  // 3. 상태 확인 API들
  dataflow: '/api/dataflow',
  status: '/api/status',
};

// 🔧 API 호출 헬퍼 함수
async function fetchAPI(endpoint, timeout = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Data-Consistency-Verifier/1.0',
        Accept: 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// 🎯 서버 데이터 정규화 함수
function normalizeServerData(servers, source) {
  if (!Array.isArray(servers)) {
    console.warn(
      `⚠️ ${source}: 서버 데이터가 배열이 아닙니다.`,
      typeof servers
    );
    return [];
  }

  return servers.map(server => ({
    id: server.id,
    name: server.name || server.hostname || server.id,
    hostname: server.hostname || server.name || server.id,
    status: normalizeStatus(server.status),
    cpu: server.cpu_usage || server.cpu || server.node_cpu_usage_percent || 0,
    memory:
      server.memory_usage ||
      server.memory ||
      server.node_memory_usage_percent ||
      0,
    disk:
      server.disk_usage || server.disk || server.node_disk_usage_percent || 0,
    environment: server.environment || 'unknown',
    role: server.role || 'unknown',
    source: source,
  }));
}

// 🔧 상태 정규화 함수
function normalizeStatus(status) {
  if (!status) return 'unknown';

  const statusLower = status.toLowerCase();
  if (['running', 'healthy', 'online'].includes(statusLower)) return 'healthy';
  if (['warning'].includes(statusLower)) return 'warning';
  if (['error', 'critical', 'offline'].includes(statusLower)) return 'critical';
  return status;
}

// 📊 통계 계산 함수
function calculateStats(servers, source) {
  const total = servers.length;
  const healthy = servers.filter(s => s.status === 'healthy').length;
  const warning = servers.filter(s => s.status === 'warning').length;
  const critical = servers.filter(s => s.status === 'critical').length;

  const avgCpu =
    total > 0 ? servers.reduce((sum, s) => sum + s.cpu, 0) / total : 0;
  const avgMemory =
    total > 0 ? servers.reduce((sum, s) => sum + s.memory, 0) / total : 0;
  const avgDisk =
    total > 0 ? servers.reduce((sum, s) => sum + s.disk, 0) / total : 0;

  return {
    source,
    total,
    healthy,
    warning,
    critical,
    healthyPercent: total > 0 ? ((healthy / total) * 100).toFixed(1) : 0,
    warningPercent: total > 0 ? ((warning / total) * 100).toFixed(1) : 0,
    criticalPercent: total > 0 ? ((critical / total) * 100).toFixed(1) : 0,
    avgCpu: avgCpu.toFixed(1),
    avgMemory: avgMemory.toFixed(1),
    avgDisk: avgDisk.toFixed(1),
  };
}

// 🔍 데이터 일치성 검증 함수
function verifyDataConsistency(dataResults) {
  console.log('\n🔍 데이터 일치성 검증 결과');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const dashboardData = dataResults.find(d => d.source === 'dashboard');
  if (!dashboardData) {
    console.log('❌ 대시보드 데이터를 찾을 수 없습니다.');
    return;
  }

  const issues = [];
  const tolerance = 5; // 5% 허용 오차

  dataResults.forEach(data => {
    if (data.source === 'dashboard') return;

    console.log(`\n📊 ${data.source} vs 대시보드 비교:`);

    // 서버 개수 비교
    if (data.total !== dashboardData.total) {
      const diff = Math.abs(data.total - dashboardData.total);
      console.log(
        `  ⚠️ 서버 개수 불일치: ${data.total} vs ${dashboardData.total} (차이: ${diff}개)`
      );
      issues.push(`${data.source}: 서버 개수 불일치 (${diff}개 차이)`);
    } else {
      console.log(`  ✅ 서버 개수 일치: ${data.total}개`);
    }

    // 상태 분포 비교
    const healthyDiff = Math.abs(
      parseFloat(data.healthyPercent) - parseFloat(dashboardData.healthyPercent)
    );
    const warningDiff = Math.abs(
      parseFloat(data.warningPercent) - parseFloat(dashboardData.warningPercent)
    );
    const criticalDiff = Math.abs(
      parseFloat(data.criticalPercent) -
        parseFloat(dashboardData.criticalPercent)
    );

    if (healthyDiff > tolerance) {
      console.log(
        `  ⚠️ 정상 서버 비율 차이: ${data.healthyPercent}% vs ${dashboardData.healthyPercent}% (차이: ${healthyDiff.toFixed(1)}%)`
      );
      issues.push(
        `${data.source}: 정상 서버 비율 차이 (${healthyDiff.toFixed(1)}%)`
      );
    } else {
      console.log(`  ✅ 정상 서버 비율 일치: ${data.healthyPercent}%`);
    }

    if (warningDiff > tolerance) {
      console.log(
        `  ⚠️ 경고 서버 비율 차이: ${data.warningPercent}% vs ${dashboardData.warningPercent}% (차이: ${warningDiff.toFixed(1)}%)`
      );
      issues.push(
        `${data.source}: 경고 서버 비율 차이 (${warningDiff.toFixed(1)}%)`
      );
    } else {
      console.log(`  ✅ 경고 서버 비율 일치: ${data.warningPercent}%`);
    }

    if (criticalDiff > tolerance) {
      console.log(
        `  ⚠️ 심각 서버 비율 차이: ${data.criticalPercent}% vs ${dashboardData.criticalPercent}% (차이: ${criticalDiff.toFixed(1)}%)`
      );
      issues.push(
        `${data.source}: 심각 서버 비율 차이 (${criticalDiff.toFixed(1)}%)`
      );
    } else {
      console.log(`  ✅ 심각 서버 비율 일치: ${data.criticalPercent}%`);
    }

    // 평균 리소스 사용률 비교
    const cpuDiff = Math.abs(
      parseFloat(data.avgCpu) - parseFloat(dashboardData.avgCpu)
    );
    const memoryDiff = Math.abs(
      parseFloat(data.avgMemory) - parseFloat(dashboardData.avgMemory)
    );
    const diskDiff = Math.abs(
      parseFloat(data.avgDisk) - parseFloat(dashboardData.avgDisk)
    );

    if (cpuDiff > 10) {
      console.log(
        `  ⚠️ 평균 CPU 사용률 차이: ${data.avgCpu}% vs ${dashboardData.avgCpu}% (차이: ${cpuDiff.toFixed(1)}%)`
      );
      issues.push(
        `${data.source}: 평균 CPU 사용률 차이 (${cpuDiff.toFixed(1)}%)`
      );
    } else {
      console.log(`  ✅ 평균 CPU 사용률 일치: ${data.avgCpu}%`);
    }

    if (memoryDiff > 10) {
      console.log(
        `  ⚠️ 평균 메모리 사용률 차이: ${data.avgMemory}% vs ${dashboardData.avgMemory}% (차이: ${memoryDiff.toFixed(1)}%)`
      );
      issues.push(
        `${data.source}: 평균 메모리 사용률 차이 (${memoryDiff.toFixed(1)}%)`
      );
    } else {
      console.log(`  ✅ 평균 메모리 사용률 일치: ${data.avgMemory}%`);
    }

    if (diskDiff > 10) {
      console.log(
        `  ⚠️ 평균 디스크 사용률 차이: ${data.avgDisk}% vs ${dashboardData.avgDisk}% (차이: ${diskDiff.toFixed(1)}%)`
      );
      issues.push(
        `${data.source}: 평균 디스크 사용률 차이 (${diskDiff.toFixed(1)}%)`
      );
    } else {
      console.log(`  ✅ 평균 디스크 사용률 일치: ${data.avgDisk}%`);
    }
  });

  // 최종 결과
  console.log('\n🎯 최종 검증 결과');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (issues.length === 0) {
    console.log('✅ 모든 데이터 소스가 일치합니다!');
    console.log(
      '🎉 서버 모니터링 프론트엔드와 서버 데이터 생성기가 동일한 데이터를 사용하고 있습니다.'
    );
  } else {
    console.log(`❌ ${issues.length}개의 데이터 불일치 문제가 발견되었습니다:`);
    issues.forEach((issue, index) => {
      console.log(`  ${index + 1}. ${issue}`);
    });

    console.log('\n💡 해결 방안:');
    console.log(
      '  1. 모든 컴포넌트가 /api/dashboard를 기본 데이터 소스로 사용하도록 수정'
    );
    console.log(
      '  2. 서버 데이터 스토어(serverDataStore.ts)에서 대시보드 API 사용 확인'
    );
    console.log(
      '  3. UnifiedDataGeneratorModule 대신 RealServerDataGenerator 직접 사용'
    );
  }

  return issues.length === 0;
}

// 🚀 메인 검증 함수
async function main() {
  console.log('🔍 OpenManager Vibe v5 - 데이터 일치성 검증 시작');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📡 대상 서버: ${BASE_URL}`);
  console.log(`⏰ 시작 시간: ${new Date().toLocaleString()}\n`);

  const results = [];

  // 1. 대시보드 API 데이터 수집 (기준 데이터)
  try {
    console.log('📊 1. 대시보드 API 데이터 수집 중...');
    const dashboardResponse = await fetchAPI(API_ENDPOINTS.dashboard);

    let servers = [];
    if (dashboardResponse.data && dashboardResponse.data.servers) {
      servers = dashboardResponse.data.servers;
    } else if (Array.isArray(dashboardResponse.servers)) {
      servers = dashboardResponse.servers;
    }

    const normalizedServers = normalizeServerData(servers, 'dashboard');
    const stats = calculateStats(normalizedServers, 'dashboard');

    console.log(
      `  ✅ 대시보드: ${stats.total}개 서버 (정상: ${stats.healthyPercent}%, 경고: ${stats.warningPercent}%, 심각: ${stats.criticalPercent}%)`
    );
    console.log(
      `  📊 평균 리소스: CPU ${stats.avgCpu}%, 메모리 ${stats.avgMemory}%, 디스크 ${stats.avgDisk}%`
    );

    results.push(stats);
  } catch (error) {
    console.log(`  ❌ 대시보드 API 호출 실패: ${error.message}`);
    return;
  }

  // 2. 기타 API 엔드포인트들 검증
  for (const [name, endpoint] of Object.entries(API_ENDPOINTS)) {
    if (name === 'dashboard') continue; // 이미 처리됨

    try {
      console.log(`\n📈 ${name} API 데이터 수집 중...`);
      const response = await fetchAPI(endpoint);

      let servers = [];

      // 응답 구조에 따른 서버 데이터 추출
      if (response.data && Array.isArray(response.data.servers)) {
        servers = response.data.servers;
      } else if (response.data && Array.isArray(response.data)) {
        servers = response.data;
      } else if (Array.isArray(response.servers)) {
        servers = response.servers;
      } else if (Array.isArray(response)) {
        servers = response;
      }

      const normalizedServers = normalizeServerData(servers, name);
      const stats = calculateStats(normalizedServers, name);

      console.log(
        `  ✅ ${name}: ${stats.total}개 서버 (정상: ${stats.healthyPercent}%, 경고: ${stats.warningPercent}%, 심각: ${stats.criticalPercent}%)`
      );
      console.log(
        `  📊 평균 리소스: CPU ${stats.avgCpu}%, 메모리 ${stats.avgMemory}%, 디스크 ${stats.avgDisk}%`
      );

      results.push(stats);
    } catch (error) {
      console.log(`  ❌ ${name} API 호출 실패: ${error.message}`);
    }
  }

  // 3. 데이터 일치성 검증
  const isConsistent = verifyDataConsistency(results);

  // 4. 요약 리포트
  console.log('\n📋 검증 요약 리포트');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🎯 검증 대상: ${results.length}개 API 엔드포인트`);
  console.log(`⏰ 완료 시간: ${new Date().toLocaleString()}`);
  console.log(
    `🎭 결과: ${isConsistent ? '✅ 데이터 일치' : '❌ 데이터 불일치'}`
  );

  if (isConsistent) {
    console.log('\n🎉 축하합니다! 모든 데이터 소스가 일치합니다.');
    console.log(
      '서버 모니터링 프론트엔드와 서버 데이터 생성기가 동일한 데이터를 제공하고 있습니다.'
    );
  } else {
    console.log('\n⚠️ 데이터 불일치 문제가 발견되었습니다.');
    console.log(
      '서버 모니터링 컴포넌트들이 서로 다른 데이터 소스를 사용하고 있을 가능성이 있습니다.'
    );
  }

  // 5. 권장사항
  console.log('\n💡 권장사항:');
  console.log(
    '  1. 모든 프론트엔드 컴포넌트에서 /api/dashboard를 기본 데이터 소스로 사용'
  );
  console.log(
    '  2. RealServerDataGenerator를 단일 진실 소스(Single Source of Truth)로 활용'
  );
  console.log('  3. 데이터 변환 로직을 통합하여 일관성 보장');
  console.log('  4. 정기적인 데이터 일치성 검증 실행');

  process.exit(isConsistent ? 0 : 1);
}

// 스크립트 실행
main().catch(error => {
  console.error('❌ 검증 스크립트 실행 중 오류 발생:', error);
  process.exit(1);
});
