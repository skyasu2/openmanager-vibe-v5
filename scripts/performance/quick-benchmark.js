#!/usr/bin/env node

/**
 * ⚡ 빠른 성능 벤치마크 도구
 * 
 * 현실적인 시간 내에 린트 성능을 측정합니다.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  benchmark: (msg) => console.log(`${colors.cyan}📊 ${msg}${colors.reset}`),
};

// 빠른 린트 명령어들만 테스트
const QUICK_COMMANDS = {
  'lint:quick': 'npm run lint:quick',
  'lint:fast': 'npm run lint:fast',
  'lint:incremental': 'npm run lint:incremental',
};

class QuickBenchmark {
  async measureCommand(name, command) {
    log.info(`측정 중: ${name}`);
    
    const startTime = Date.now();
    try {
      await this.executeCommand(command, 30000); // 30초 타임아웃
      const duration = Date.now() - startTime;
      log.success(`${name}: ${duration}ms`);
      return { success: true, duration };
    } catch (error) {
      const duration = Date.now() - startTime;
      log.warning(`${name}: ${duration}ms (오류와 함께 완료)`);
      return { success: false, duration, error: error.message };
    }
  }

  executeCommand(command, timeout = 30000) {
    return new Promise((resolve, reject) => {
      const child = spawn('sh', ['-c', command], {
        stdio: 'pipe',
        timeout,
      });

      child.on('close', (code) => {
        resolve({ code });
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  async run() {
    log.benchmark('⚡ 빠른 성능 벤치마크 시작');
    
    const results = {};
    
    for (const [name, command] of Object.entries(QUICK_COMMANDS)) {
      const result = await this.measureCommand(name, command);
      results[name] = result;
    }

    console.log('\n🎯 빠른 벤치마크 결과');
    console.log('─'.repeat(40));
    
    Object.entries(results).forEach(([name, result]) => {
      const status = result.success ? '✅' : '⚠️';
      console.log(`${status} ${name}: ${result.duration}ms`);
    });

    // 가장 빠른/느린 명령어
    const sortedResults = Object.entries(results)
      .filter(([, result]) => result.success)
      .sort(([, a], [, b]) => a.duration - b.duration);

    if (sortedResults.length > 1) {
      const fastest = sortedResults[0];
      const slowest = sortedResults[sortedResults.length - 1];
      
      console.log(`\n💡 권장사항:`);
      console.log(`  가장 빠름: ${fastest[0]} (${fastest[1].duration}ms)`);
      console.log(`  가장 느림: ${slowest[0]} (${slowest[1].duration}ms)`);
      
      const improvement = Math.round(
        ((slowest[1].duration - fastest[1].duration) / slowest[1].duration) * 100
      );
      console.log(`  성능 개선: ${improvement}% 향상 가능`);
    }

    return results;
  }
}

// 메인 실행
if (require.main === module) {
  const benchmark = new QuickBenchmark();
  benchmark.run().catch((error) => {
    console.error(`❌ 벤치마크 실패: ${error.message}`);
    process.exit(1);
  });
}

module.exports = QuickBenchmark;