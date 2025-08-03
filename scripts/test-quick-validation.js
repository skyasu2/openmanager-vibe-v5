#!/usr/bin/env node

/**
 * 🚀 빠른 테스트 검증 스크립트
 * 테스트 시스템이 제대로 작동하는지 확인
 */

const { spawn } = require('child_process');
const chalk = require('chalk') || { red: s => s, green: s => s, yellow: s => s, blue: s => s };

console.log('🧪 테스트 시스템 검증 시작...\n');

// 테스트 실행 함수
function runTest(command, args, testName, timeout = 15000) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    console.log(`▶️  ${testName} 실행 중...`);
    
    const child = spawn(command, args, { 
      shell: true, 
      stdio: 'pipe',
      env: { ...process.env, USE_REAL_REDIS: 'false' }
    });
    
    let output = '';
    let errorOutput = '';
    
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    // 타임아웃 설정
    const timer = setTimeout(() => {
      child.kill();
      const duration = Date.now() - startTime;
      console.log(`❌ ${testName}: 타임아웃 (${duration}ms)`);
      resolve({ success: false, duration, reason: 'timeout' });
    }, timeout);
    
    child.on('close', (code) => {
      clearTimeout(timer);
      const duration = Date.now() - startTime;
      
      if (code === 0) {
        console.log(`✅ ${testName}: 성공 (${duration}ms)`);
        resolve({ success: true, duration });
      } else {
        console.log(`❌ ${testName}: 실패 (${duration}ms)`);
        if (errorOutput) console.log(`   에러: ${errorOutput.split('\n')[0]}`);
        resolve({ success: false, duration, reason: 'failed' });
      }
    });
  });
}

// 메인 실행
async function main() {
  const tests = [
    {
      name: 'minimal-test.js',
      command: 'node',
      args: ['scripts/minimal-test.js'],
      timeout: 1000, // 1초
    },
    {
      name: '환경 설정 테스트',
      command: 'npx',
      args: ['vitest', 'run', 'src/test/env.test.ts', '--reporter=default', '--no-coverage'],
      timeout: 15000, // 15초
    },
    {
      name: 'TypeScript 타입 체크',
      command: 'npm',
      args: ['run', 'type-check'],
      timeout: 30000, // 30초
    },
  ];
  
  const results = [];
  
  for (const test of tests) {
    const result = await runTest(test.command, test.args, test.name, test.timeout);
    results.push({ ...test, ...result });
  }
  
  // 결과 요약
  console.log('\n' + '='.repeat(60));
  console.log('📊 테스트 결과 요약:\n');
  
  let totalDuration = 0;
  let successCount = 0;
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const reason = result.reason ? ` (${result.reason})` : '';
    console.log(`${status} ${result.name}: ${result.duration}ms${reason}`);
    totalDuration += result.duration;
    if (result.success) successCount++;
  });
  
  console.log('\n' + '='.repeat(60));
  console.log(`✅ 성공: ${successCount}/${results.length}`);
  console.log(`⏱️  전체 실행 시간: ${totalDuration}ms`);
  
  if (successCount === results.length) {
    console.log('\n🎉 모든 테스트가 성공했습니다!');
    console.log('💡 테스트 시스템이 정상적으로 작동합니다.');
    process.exit(0);
  } else {
    console.log('\n⚠️  일부 테스트가 실패했습니다.');
    console.log('💡 타임아웃이 발생한 경우 vitest 설정을 추가로 최적화해야 합니다.');
    process.exit(1);
  }
}

// 실행
main().catch(error => {
  console.error('💥 스크립트 실행 중 오류:', error);
  process.exit(1);
});