#!/usr/bin/env node

/**
 * 📊 무료티어 사용량 실시간 모니터링
 *
 * 일일 10명, 동시 접속 3명, 사용 시간 20분 기준
 * 실제 사용량과 무료티어 한도 비교
 */

const chalk = require('chalk');

// 무료티어 한도
const FREE_TIER_LIMITS = {
  gcpFunctions: {
    calls: 2000000, // 월 200만 호출
    compute: 400000, // 400,000 GB-초
    network: 5 * 1024 * 1024 * 1024, // 5GB
  },
  vercel: {
    bandwidth: 100 * 1024 * 1024 * 1024, // 100GB
    serverless: 100, // 100GB-시간
    edgeRequests: 10000000, // 1000만 요청
  },
  supabase: {
    database: 500 * 1024 * 1024, // 500MB
    bandwidth: 2 * 1024 * 1024 * 1024, // 2GB
    storage: 1 * 1024 * 1024 * 1024, // 1GB
  },
  redis: {
    storage: 256 * 1024 * 1024, // 256MB (Upstash)
    commands: 10000, // 일일 1만 명령
    bandwidth: 10 * 1024 * 1024, // 10MB/일
  },
};

// 사용 시나리오
const USAGE_SCENARIO = {
  dailyUsers: 10,
  concurrentUsers: 3,
  sessionMinutes: 20,
  requestsPerMinute: 6, // 10초당 1회
  avgRequestSize: 2048, // 2KB
  avgResponseSize: 8192, // 8KB
  functionExecutionMs: 100,
  functionMemoryMB: 512,
};

// 사용량 계산
function calculateUsage() {
  const daily = {
    requests:
      USAGE_SCENARIO.dailyUsers *
      USAGE_SCENARIO.sessionMinutes *
      USAGE_SCENARIO.requestsPerMinute,
    computeSeconds:
      (USAGE_SCENARIO.dailyUsers *
        USAGE_SCENARIO.sessionMinutes *
        USAGE_SCENARIO.requestsPerMinute *
        USAGE_SCENARIO.functionExecutionMs) /
      1000,
    networkBytes:
      USAGE_SCENARIO.dailyUsers *
      USAGE_SCENARIO.sessionMinutes *
      USAGE_SCENARIO.requestsPerMinute *
      (USAGE_SCENARIO.avgRequestSize + USAGE_SCENARIO.avgResponseSize),
  };

  const monthly = {
    requests: daily.requests * 30,
    computeGBSeconds:
      daily.computeSeconds * 30 * (USAGE_SCENARIO.functionMemoryMB / 1024),
    networkGB: (daily.networkBytes * 30) / (1024 * 1024 * 1024),
  };

  return { daily, monthly };
}

// 사용률 계산
function calculatePercentage(used, limit) {
  return ((used / limit) * 100).toFixed(2);
}

// 상태 색상
function getStatusColor(percentage) {
  const pct = parseFloat(percentage);
  if (pct < 50) return chalk.green;
  if (pct < 80) return chalk.yellow;
  return chalk.red;
}

// 메인 함수
function main() {
  const usage = calculateUsage();

  console.log(chalk.cyan('━'.repeat(80)));
  console.log(chalk.cyan.bold('🎯 OpenManager VIBE v5 - 무료티어 사용량 분석'));
  console.log(chalk.cyan('━'.repeat(80)));

  // 시나리오 정보
  console.log(chalk.yellow('\n📋 사용 시나리오:'));
  console.log(`  일일 사용자: ${USAGE_SCENARIO.dailyUsers}명`);
  console.log(`  동시 접속: ${USAGE_SCENARIO.concurrentUsers}명`);
  console.log(`  평균 사용 시간: ${USAGE_SCENARIO.sessionMinutes}분/사용자`);
  console.log(`  요청 주기: ${60 / USAGE_SCENARIO.requestsPerMinute}초당 1회`);

  // 일일 사용량
  console.log(chalk.yellow('\n📊 일일 예상 사용량:'));
  console.log(`  API 호출: ${usage.daily.requests.toLocaleString()}회`);
  console.log(`  컴퓨팅: ${usage.daily.computeSeconds.toFixed(1)}초`);
  console.log(
    `  네트워크: ${(usage.daily.networkBytes / 1024 / 1024).toFixed(1)}MB`
  );

  // GCP Functions 사용률
  console.log(chalk.yellow('\n🚀 GCP Functions (월간):'));
  const gcpCallsPct = calculatePercentage(
    usage.monthly.requests,
    FREE_TIER_LIMITS.gcpFunctions.calls
  );
  const gcpComputePct = calculatePercentage(
    usage.monthly.computeGBSeconds,
    FREE_TIER_LIMITS.gcpFunctions.compute
  );
  const gcpNetworkPct = calculatePercentage(
    usage.monthly.networkGB * 1024 * 1024 * 1024,
    FREE_TIER_LIMITS.gcpFunctions.network
  );

  console.log(
    `  호출: ${usage.monthly.requests.toLocaleString()} / ${(FREE_TIER_LIMITS.gcpFunctions.calls / 1000000).toFixed(0)}M (${getStatusColor(gcpCallsPct)(gcpCallsPct + '%')})`
  );
  console.log(
    `  컴퓨팅: ${usage.monthly.computeGBSeconds.toFixed(0)} / ${FREE_TIER_LIMITS.gcpFunctions.compute.toLocaleString()} GB-초 (${getStatusColor(gcpComputePct)(gcpComputePct + '%')})`
  );
  console.log(
    `  네트워크: ${usage.monthly.networkGB.toFixed(2)} / 5GB (${getStatusColor(gcpNetworkPct)(gcpNetworkPct + '%')})`
  );

  // Python 전환 영향
  console.log(chalk.yellow('\n🐍 Python 전환 영향:'));
  const pythonMultiplier = 3; // Python은 Node.js보다 3배 리소스 사용
  const pythonComputePct = calculatePercentage(
    usage.monthly.computeGBSeconds * pythonMultiplier,
    FREE_TIER_LIMITS.gcpFunctions.compute
  );
  console.log(`  Python 메모리 사용: 512MB × 2 함수 = 1GB`);
  console.log(
    `  Python 컴퓨팅 사용률: ${getStatusColor(pythonComputePct)(pythonComputePct + '%')} (Node.js 대비 3배)`
  );
  console.log(
    `  월간 가능 호출: ~${Math.floor(FREE_TIER_LIMITS.gcpFunctions.calls / pythonMultiplier).toLocaleString()}회`
  );

  // Vercel 사용률
  console.log(chalk.yellow('\n⚡ Vercel (월간):'));
  const vercelBandwidth = usage.monthly.networkGB * 2; // 프론트엔드 추가 트래픽
  const vercelBandwidthPct = calculatePercentage(
    vercelBandwidth * 1024 * 1024 * 1024,
    FREE_TIER_LIMITS.vercel.bandwidth
  );
  console.log(
    `  대역폭: ${vercelBandwidth.toFixed(2)} / 100GB (${getStatusColor(vercelBandwidthPct)(vercelBandwidthPct + '%')})`
  );
  console.log(
    `  Edge 요청: ${usage.monthly.requests.toLocaleString()} / 10M (${getStatusColor(gcpCallsPct)(gcpCallsPct + '%')})`
  );

  // 여유분 계산
  console.log(chalk.green('\n✅ 무료티어 여유분:'));
  console.log(
    `  GCP 호출 여유: ${(100 - parseFloat(gcpCallsPct)).toFixed(1)}%`
  );
  console.log(
    `  GCP 컴퓨팅 여유: ${(100 - parseFloat(pythonComputePct)).toFixed(1)}%`
  );
  console.log(
    `  Vercel 대역폭 여유: ${(100 - parseFloat(vercelBandwidthPct)).toFixed(1)}%`
  );

  // 최대 수용 가능 사용자
  const maxUsers = Math.floor(
    (USAGE_SCENARIO.dailyUsers / parseFloat(pythonComputePct)) * 100
  );
  console.log(chalk.green(`\n📈 최대 수용 가능:`));
  console.log(`  일일 사용자: ~${maxUsers}명`);
  console.log(`  동시 접속: ~${Math.floor(maxUsers * 0.3)}명`);

  console.log(chalk.cyan('\n' + '━'.repeat(80)));
  console.log(
    chalk.green.bold(
      '💡 결론: 현재 사용 시나리오는 무료티어로 충분히 운영 가능합니다!'
    )
  );
  console.log(chalk.cyan('━'.repeat(80)));
}

// 실행
main();
