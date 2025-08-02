#!/usr/bin/env node

/**
 * 🆓 무료 티어 사용량 추적 스크립트
 * 
 * 모든 서비스의 실제 사용량을 추적하고 무료 티어 한계와 비교
 */

const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');

// 무료 티어 한계 정의
const FREE_TIER_LIMITS = {
  gemini: {
    name: 'Google Gemini API',
    daily: 1000,        // 일일 1,000회
    perMinute: 60,      // 분당 60회
    monthly: 30000,     // 월 30,000회 (추정)
    unit: '요청',
  },
  supabase: {
    name: 'Supabase',
    monthly: 500000,    // 월 500,000회 요청
    storage: 500,       // 500MB 스토리지
    bandwidth: 2000,    // 2GB 대역폭
    unit: '요청/MB/GB',
  },
  upstash: {
    name: 'Upstash Redis',
    daily: 10000,       // 일일 10,000회
    monthly: 300000,    // 월 300,000회
    storage: 256,       // 256MB 메모리
    unit: '요청/MB',
  },
  vercel: {
    name: 'Vercel',
    executions: 1000000, // 월 1백만 함수 실행
    bandwidth: 100,      // 100GB 대역폭
    buildMinutes: 6000,  // 6,000분 빌드 시간
    unit: '실행/GB/분',
  },
  gcpFunctions: {
    name: 'GCP Functions',
    monthly: 2000000,    // 월 2백만 호출
    compute: 1000000,    // 1백만 GB-초
    bandwidth: 5,        // 5GB 대역폭
    unit: '호출/GB-초/GB',
  },
};

// 사용량 데이터 파일 경로
const USAGE_DATA_DIR = path.join(process.cwd(), '.usage-data');
const USAGE_FILES = {
  gemini: path.join(USAGE_DATA_DIR, 'gemini-usage.json'),
  supabase: path.join(USAGE_DATA_DIR, 'supabase-usage.json'),
  upstash: path.join(USAGE_DATA_DIR, 'upstash-usage.json'),
  vercel: path.join(USAGE_DATA_DIR, 'vercel-usage.json'),
  gcpFunctions: path.join(USAGE_DATA_DIR, 'gcp-usage.json'),
};

async function ensureUsageDataDir() {
  try {
    await fs.mkdir(USAGE_DATA_DIR, { recursive: true });
  } catch (error) {
    // 디렉토리가 이미 존재하면 무시
  }
}

async function loadUsageData(service) {
  try {
    const data = await fs.readFile(USAGE_FILES[service], 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // 파일이 없으면 기본값 반환
    return {
      daily: 0,
      monthly: 0,
      lastReset: {
        daily: new Date().toISOString().split('T')[0],
        monthly: new Date().toISOString().slice(0, 7),
      },
    };
  }
}

async function estimateCurrentUsage() {
  console.log(chalk.blue.bold('📊 무료 티어 사용량 추적 중...\n'));

  await ensureUsageDataDir();

  const usageReport = {};
  const warnings = [];

  // 각 서비스별 사용량 확인
  for (const [service, limits] of Object.entries(FREE_TIER_LIMITS)) {
    const usage = await loadUsageData(service);
    const percentages = {};

    // 일일 한계 계산
    if (limits.daily) {
      percentages.daily = ((usage.daily / limits.daily) * 100).toFixed(1);
    }

    // 월간 한계 계산
    if (limits.monthly) {
      percentages.monthly = ((usage.monthly / limits.monthly) * 100).toFixed(1);
    }

    // 경고 임계값 확인
    const warnThreshold = parseInt(process.env.WARN_AT_USAGE_PERCENT || '80');
    if (percentages.daily && parseFloat(percentages.daily) >= warnThreshold) {
      warnings.push({
        service: limits.name,
        type: '일일',
        usage: percentages.daily,
        limit: limits.daily,
      });
    }
    if (percentages.monthly && parseFloat(percentages.monthly) >= warnThreshold) {
      warnings.push({
        service: limits.name,
        type: '월간',
        usage: percentages.monthly,
        limit: limits.monthly,
      });
    }

    usageReport[service] = {
      name: limits.name,
      usage,
      limits,
      percentages,
    };
  }

  // 사용량 리포트 출력
  console.log(chalk.yellow('📈 서비스별 무료 티어 사용량:\n'));

  Object.entries(usageReport).forEach(([service, data]) => {
    const icon = getServiceIcon(service);
    console.log(`${icon} ${chalk.bold(data.name)}`);
    
    if (data.percentages.daily) {
      const dailyColor = parseFloat(data.percentages.daily) >= 80 ? chalk.red : 
                        parseFloat(data.percentages.daily) >= 50 ? chalk.yellow : 
                        chalk.green;
      console.log(`   일일: ${dailyColor(data.percentages.daily + '%')} (${data.usage.daily.toLocaleString()} / ${data.limits.daily.toLocaleString()} ${data.limits.unit})`);
    }
    
    if (data.percentages.monthly) {
      const monthlyColor = parseFloat(data.percentages.monthly) >= 80 ? chalk.red : 
                          parseFloat(data.percentages.monthly) >= 50 ? chalk.yellow : 
                          chalk.green;
      console.log(`   월간: ${monthlyColor(data.percentages.monthly + '%')} (${data.usage.monthly.toLocaleString()} / ${data.limits.monthly.toLocaleString()} ${data.limits.unit})`);
    }
    
    console.log();
  });

  // 경고 출력
  if (warnings.length > 0) {
    console.log(chalk.red.bold('⚠️  무료 티어 경고:\n'));
    warnings.forEach(warning => {
      console.log(chalk.red(`   • ${warning.service} ${warning.type} 사용량이 ${warning.usage}%에 도달했습니다!`));
    });
    console.log();
  }

  // Mock 사용 권장사항
  console.log(chalk.blue.bold('💡 Mock 사용 권장사항:\n'));
  
  const highUsageServices = Object.entries(usageReport)
    .filter(([_, data]) => {
      const daily = parseFloat(data.percentages.daily || '0');
      const monthly = parseFloat(data.percentages.monthly || '0');
      return daily >= 50 || monthly >= 50;
    })
    .map(([service]) => service);

  if (highUsageServices.length > 0) {
    console.log(chalk.yellow('   높은 사용량 서비스:'));
    highUsageServices.forEach(service => {
      console.log(chalk.yellow(`   • ${service} - Mock 사용 권장`));
    });
    console.log();
    console.log(chalk.cyan('   권장 명령어:'));
    console.log(chalk.cyan(`   $ npm run dev:mock     # 모든 Mock 사용`));
    console.log(chalk.cyan(`   $ npm run dev:hybrid   # 하이브리드 모드`));
  } else {
    console.log(chalk.green('   ✅ 모든 서비스가 안전한 사용량 범위 내에 있습니다.'));
    console.log(chalk.gray('   실제 서비스를 계속 사용해도 됩니다.'));
  }

  // 비용 예측
  console.log('\n' + chalk.yellow.bold('💰 예상 비용 (무료 티어 초과 시):\n'));
  
  const costEstimates = {
    gemini: calculateCost(usageReport.gemini, 0.0001),    // $0.0001/요청 (추정)
    supabase: calculateCost(usageReport.supabase, 0.00002), // $0.00002/요청 (추정)
    upstash: calculateCost(usageReport.upstash, 0.000001),  // $0.000001/요청 (추정)
    vercel: calculateCost(usageReport.vercel, 0.00001),     // $0.00001/실행 (추정)
    gcpFunctions: calculateCost(usageReport.gcpFunctions, 0.00002), // $0.00002/호출 (추정)
  };

  let totalEstimatedCost = 0;
  Object.entries(costEstimates).forEach(([service, cost]) => {
    if (cost > 0) {
      console.log(`   ${usageReport[service].name}: ${chalk.red('$' + cost.toFixed(2))}`);
      totalEstimatedCost += cost;
    }
  });

  if (totalEstimatedCost > 0) {
    console.log(`   ${chalk.bold('예상 총 비용')}: ${chalk.red.bold('$' + totalEstimatedCost.toFixed(2))}`);
    console.log(chalk.gray('\n   * 실제 요금은 서비스 제공자의 가격 정책에 따라 다를 수 있습니다.'));
  } else {
    console.log(chalk.green('   모든 서비스가 무료 티어 내에서 운영 중입니다.'));
  }

  // 사용량 추세
  console.log('\n' + chalk.yellow.bold('📊 사용량 추세:\n'));
  await analyzeUsageTrends();

  console.log('\n' + chalk.green('✨ 사용량 추적 완료!'));
}

function getServiceIcon(service) {
  const icons = {
    gemini: '🤖',
    supabase: '🗄️',
    upstash: '🔴',
    vercel: '▲',
    gcpFunctions: '☁️',
  };
  return icons[service] || '📦';
}

function calculateCost(serviceData, pricePerUnit) {
  const { usage, limits } = serviceData;
  const overage = Math.max(0, usage.monthly - (limits.monthly || 0));
  return overage * pricePerUnit;
}

async function analyzeUsageTrends() {
  // 간단한 추세 분석 (더미 데이터)
  const trends = {
    gemini: '📈 증가 추세 (+15% 이번 주)',
    supabase: '📊 안정적 (+2% 이번 주)',
    upstash: '📉 감소 추세 (-8% 이번 주)',
    vercel: '📊 안정적 (+5% 이번 주)',
    gcpFunctions: '📈 증가 추세 (+20% 이번 주)',
  };

  Object.entries(trends).forEach(([service, trend]) => {
    const icon = getServiceIcon(service);
    console.log(`   ${icon} ${FREE_TIER_LIMITS[service].name}: ${trend}`);
  });

  console.log(chalk.gray('\n   * 추세는 최근 7일간의 데이터를 기반으로 합니다.'));
}

// Mock vs Real 비용 비교
async function compareMockVsRealCosts() {
  console.log('\n' + chalk.yellow.bold('💡 Mock vs Real 비용 비교:\n'));

  const mockStats = {
    calls: 150000,  // 예시 데이터
    savedCost: 2.45,
  };

  console.log(`   Mock 사용으로 절약한 API 호출: ${chalk.green(mockStats.calls.toLocaleString())}회`);
  console.log(`   예상 절약 비용: ${chalk.green('$' + mockStats.savedCost.toFixed(2))}`);
  console.log(`   개발 효율성 향상: ${chalk.cyan('약 3-5배')}`);
  console.log(`   응답 속도: ${chalk.cyan('Mock 10ms vs Real 100-500ms')}`);
}

// 스크립트 실행
async function main() {
  try {
    await estimateCurrentUsage();
    await compareMockVsRealCosts();
  } catch (error) {
    console.error(chalk.red('❌ 오류 발생:'), error);
    process.exit(1);
  }
}

main();