#!/usr/bin/env node

/**
 * 🎭 Mock 시스템 통계 수집 스크립트
 * 
 * 모든 Mock 서비스의 사용 통계를 수집하고 리포트
 */

const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');

async function collectMockStats() {
  console.log(chalk.blue.bold('📊 Mock 시스템 통계 수집 중...\n'));

  const stats = {
    googleAI: { calls: 0, errors: 0, lastUsed: null },
    supabase: { calls: 0, errors: 0, lastUsed: null },
    redis: { calls: 0, errors: 0, lastUsed: null },
    gcpFunctions: { calls: 0, errors: 0, lastUsed: null },
  };

  // Mock 통계 파일 경로들
  const statsFiles = {
    googleAI: '.mock-stats-google-ai.json',
    supabase: '.mock-stats-supabase.json',
    redis: '.redis-mock-data/stats.json',
    gcpFunctions: '.mock-stats-gcp-functions.json',
  };

  // 각 서비스의 통계 파일 읽기
  for (const [service, filePath] of Object.entries(statsFiles)) {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      const fileContent = await fs.readFile(fullPath, 'utf8');
      const serviceStats = JSON.parse(fileContent);
      
      stats[service] = {
        ...stats[service],
        ...serviceStats,
      };
    } catch (error) {
      // 파일이 없거나 읽기 실패 시 기본값 유지
    }
  }

  // 통계 출력
  console.log(chalk.yellow('📈 Mock 서비스별 사용 통계:\n'));

  const services = [
    { name: 'Google AI', key: 'googleAI', icon: '🤖' },
    { name: 'Supabase', key: 'supabase', icon: '🗄️' },
    { name: 'Redis', key: 'redis', icon: '🔴' },
    { name: 'GCP Functions', key: 'gcpFunctions', icon: '☁️' },
  ];

  let totalCalls = 0;
  let totalErrors = 0;

  services.forEach(({ name, key, icon }) => {
    const stat = stats[key];
    totalCalls += stat.calls;
    totalErrors += stat.errors;

    console.log(`${icon} ${chalk.bold(name)}`);
    console.log(`   호출 횟수: ${chalk.green(stat.calls.toLocaleString())}`);
    console.log(`   에러 횟수: ${stat.errors > 0 ? chalk.red(stat.errors) : chalk.green(0)}`);
    console.log(`   성공률: ${stat.calls > 0 ? chalk.cyan((((stat.calls - stat.errors) / stat.calls) * 100).toFixed(1) + '%') : chalk.gray('N/A')}`);
    console.log(`   마지막 사용: ${stat.lastUsed ? chalk.gray(new Date(stat.lastUsed).toLocaleString()) : chalk.gray('사용 기록 없음')}`);
    console.log();
  });

  // 전체 통계
  console.log(chalk.yellow.bold('📊 전체 통계:'));
  console.log(`   총 호출 횟수: ${chalk.green(totalCalls.toLocaleString())}`);
  console.log(`   총 에러 횟수: ${totalErrors > 0 ? chalk.red(totalErrors) : chalk.green(0)}`);
  console.log(`   평균 성공률: ${totalCalls > 0 ? chalk.cyan((((totalCalls - totalErrors) / totalCalls) * 100).toFixed(1) + '%') : chalk.gray('N/A')}`);

  // Mock으로 절약한 예상 비용
  console.log('\n' + chalk.yellow.bold('💰 예상 비용 절감:'));
  
  const costEstimate = {
    googleAI: stats.googleAI.calls * 0.0001, // $0.0001/요청 (추정)
    supabase: stats.supabase.calls * 0.00001, // $0.00001/요청 (추정)
    redis: stats.redis.calls * 0.000001, // $0.000001/요청 (추정)
    gcpFunctions: stats.gcpFunctions.calls * 0.00002, // $0.00002/요청 (추정)
  };

  let totalSaved = 0;
  services.forEach(({ name, key }) => {
    const saved = costEstimate[key];
    totalSaved += saved;
    console.log(`   ${name}: ${chalk.green('$' + saved.toFixed(4))}`);
  });

  console.log(`   ${chalk.bold('총 절감액')}: ${chalk.green.bold('$' + totalSaved.toFixed(2))}`);

  // Mock 파일 크기 분석
  console.log('\n' + chalk.yellow.bold('📦 Mock 파일 크기:'));
  
  const mockFiles = [
    { path: 'src/lib/ai/dev-mock-google-ai.ts', name: 'Google AI Mock' },
    { path: 'src/lib/supabase/dev-mock-supabase.ts', name: 'Supabase Mock' },
    { path: 'src/lib/redis/dev-mock-redis.ts', name: 'Redis Mock' },
    { path: 'src/lib/gcp/dev-mock-gcp-functions.ts', name: 'GCP Functions Mock' },
  ];

  let totalSize = 0;
  for (const { path: filePath, name } of mockFiles) {
    try {
      const stat = await fs.stat(path.join(process.cwd(), filePath));
      const sizeKB = (stat.size / 1024).toFixed(1);
      totalSize += stat.size;
      console.log(`   ${name}: ${chalk.cyan(sizeKB + ' KB')}`);
    } catch (error) {
      console.log(`   ${name}: ${chalk.gray('파일 없음')}`);
    }
  }

  console.log(`   ${chalk.bold('총 크기')}: ${chalk.cyan((totalSize / 1024).toFixed(1) + ' KB')}`);

  // 권장사항
  console.log('\n' + chalk.blue.bold('💡 권장사항:'));
  
  if (totalCalls === 0) {
    console.log(chalk.gray('   • Mock 시스템이 아직 사용되지 않았습니다.'));
    console.log(chalk.gray('   • npm run dev:mock 으로 Mock 모드 개발을 시작하세요.'));
  } else {
    if (totalErrors / totalCalls > 0.1) {
      console.log(chalk.red('   • 에러율이 10%를 초과합니다. Mock 구현을 점검하세요.'));
    }
    if (totalSaved > 1) {
      console.log(chalk.green(`   • Mock 사용으로 $${totalSaved.toFixed(2)} 절약했습니다!`));
    }
    
    // 가장 많이 사용된 서비스
    const mostUsed = services.reduce((prev, curr) => 
      stats[prev.key].calls > stats[curr.key].calls ? prev : curr
    );
    console.log(chalk.cyan(`   • 가장 많이 사용된 Mock: ${mostUsed.name} (${stats[mostUsed.key].calls}회)`));
  }

  console.log('\n' + chalk.green('✨ 통계 수집 완료!'));
}

// 스크립트 실행
collectMockStats().catch(error => {
  console.error(chalk.red('❌ 오류 발생:'), error);
  process.exit(1);
});