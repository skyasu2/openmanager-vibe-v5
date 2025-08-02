#!/usr/bin/env node

/**
 * 🚀 ESLint 성능 벤치마크 도구
 * 
 * 다양한 린트 설정과 모드의 성능을 측정하고 비교합니다.
 * 개선 전후의 성능 차이를 정량적으로 분석할 수 있습니다.
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// 색상 정의
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  benchmark: (msg) => console.log(`${colors.cyan}📊 ${msg}${colors.reset}`),
};

// 벤치마크 설정
const BENCHMARK_CONFIG = {
  iterations: 3, // 각 테스트 3회 반복
  warmup: 1, // 워밍업 1회
  timeout: 120000, // 2분 타임아웃
};

// 린트 명령어 설정
const LINT_COMMANDS = {
  'default': 'npm run lint',
  'fast': 'npm run lint:fast',
  'quick': 'npm run lint:quick',
  'incremental': 'npm run lint:incremental',
  'changed': 'npm run lint:changed',
};

class LintBenchmark {
  constructor() {
    this.results = {};
    this.startTime = Date.now();
  }

  /**
   * 단일 명령어 실행 시간 측정
   */
  async measureCommand(commandName, command) {
    log.info(`측정 중: ${commandName}`);
    
    const times = [];
    
    // 워밍업
    if (BENCHMARK_CONFIG.warmup > 0) {
      log.info(`워밍업 실행 중...`);
      try {
        await this.executeCommand(command);
      } catch (error) {
        log.warning(`워밍업 중 오류 발생 (정상적임): ${error.message}`);
      }
    }

    // 실제 측정
    for (let i = 0; i < BENCHMARK_CONFIG.iterations; i++) {
      log.info(`${commandName} - 시도 ${i + 1}/${BENCHMARK_CONFIG.iterations}`);
      
      const startTime = Date.now();
      try {
        await this.executeCommand(command);
        const duration = Date.now() - startTime;
        times.push(duration);
        log.success(`완료: ${duration}ms`);
      } catch (error) {
        const duration = Date.now() - startTime;
        times.push(duration);
        log.warning(`오류와 함께 완료: ${duration}ms`);
      }
    }

    return {
      times,
      average: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
      min: Math.min(...times),
      max: Math.max(...times),
      stdDev: this.calculateStdDev(times),
    };
  }

  /**
   * 명령어 실행
   */
  executeCommand(command) {
    return new Promise((resolve, reject) => {
      const child = spawn('sh', ['-c', command], {
        stdio: 'pipe',
        timeout: BENCHMARK_CONFIG.timeout,
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        // 린트 오류가 있어도 시간 측정은 유효
        resolve({ code, stdout, stderr });
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * 표준편차 계산
   */
  calculateStdDev(values) {
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
    return Math.round(Math.sqrt(variance));
  }

  /**
   * 파일 수 계산
   */
  countFiles() {
    try {
      const result = execSync(
        'find src -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | wc -l',
        { encoding: 'utf8' }
      );
      return parseInt(result.trim());
    } catch (error) {
      log.warning('파일 수 계산 실패');
      return 0;
    }
  }

  /**
   * Git 변경 파일 수 계산
   */
  countChangedFiles() {
    try {
      const result = execSync(
        'git diff --cached --name-only --diff-filter=ACMR | grep -E "\\.(ts|tsx|js|jsx)$" | wc -l',
        { encoding: 'utf8' }
      );
      return parseInt(result.trim());
    } catch (error) {
      return 0;
    }
  }

  /**
   * 전체 벤치마크 실행
   */
  async runBenchmark() {
    log.benchmark('🚀 ESLint 성능 벤치마크 시작');
    log.info(`반복 횟수: ${BENCHMARK_CONFIG.iterations}, 워밍업: ${BENCHMARK_CONFIG.warmup}`);

    const totalFiles = this.countFiles();
    const changedFiles = this.countChangedFiles();

    log.info(`총 파일 수: ${totalFiles}`);
    log.info(`변경된 파일 수: ${changedFiles}`);

    console.log('\n' + '='.repeat(60));

    for (const [name, command] of Object.entries(LINT_COMMANDS)) {
      try {
        const result = await this.measureCommand(name, command);
        this.results[name] = result;
      } catch (error) {
        log.error(`${name} 측정 실패: ${error.message}`);
        this.results[name] = { error: error.message };
      }
      
      console.log(''); // 구분선
    }

    this.generateReport(totalFiles, changedFiles);
    this.saveResults();
  }

  /**
   * 결과 리포트 생성
   */
  generateReport(totalFiles, changedFiles) {
    console.log('\n' + '🎯 성능 벤치마크 결과'.padStart(40, '='));
    console.log(`총 실행 시간: ${Math.round((Date.now() - this.startTime) / 1000)}초`);
    console.log(`파일 통계: 총 ${totalFiles}개, 변경 ${changedFiles}개\n`);

    // 결과 테이블
    console.log('┌' + '─'.repeat(15) + '┬' + '─'.repeat(10) + '┬' + '─'.repeat(10) + '┬' + '─'.repeat(15) + '┐');
    console.log('│' + ' 명령어'.padEnd(14) + '│' + ' 평균(ms)'.padEnd(9) + '│' + ' 최소(ms)'.padEnd(9) + '│' + ' 편차(±ms)'.padEnd(14) + '│');
    console.log('├' + '─'.repeat(15) + '┼' + '─'.repeat(10) + '┼' + '─'.repeat(10) + '┼' + '─'.repeat(15) + '┤');

    const sortedResults = Object.entries(this.results)
      .filter(([_, result]) => !result.error)
      .sort(([, a], [, b]) => a.average - b.average);

    for (const [name, result] of sortedResults) {
      const avgStr = result.average.toString().padStart(8);
      const minStr = result.min.toString().padStart(8);
      const stdDevStr = result.stdDev.toString().padStart(12);
      
      console.log(`│ ${name.padEnd(13)}│${avgStr} │${minStr} │${stdDevStr} │`);
    }

    console.log('└' + '─'.repeat(15) + '┴' + '─'.repeat(10) + '┴' + '─'.repeat(10) + '┴' + '─'.repeat(15) + '┘');

    // 성능 분석
    this.analyzePerformance(sortedResults, totalFiles);
  }

  /**
   * 성능 분석 및 권장사항
   */
  analyzePerformance(sortedResults, totalFiles) {
    console.log('\n📈 성능 분석');
    console.log('─'.repeat(40));

    if (sortedResults.length >= 2) {
      const fastest = sortedResults[0];
      const slowest = sortedResults[sortedResults.length - 1];
      
      const improvement = Math.round(
        ((slowest[1].average - fastest[1].average) / slowest[1].average) * 100
      );

      log.success(`가장 빠른 명령어: ${fastest[0]} (${fastest[1].average}ms)`);
      log.warning(`가장 느린 명령어: ${slowest[0]} (${slowest[1].average}ms)`);
      log.benchmark(`성능 개선 효과: ${improvement}% 향상 가능`);

      // 파일당 처리 시간
      const filesPerSecond = Math.round((totalFiles * 1000) / fastest[1].average);
      log.info(`처리 속도: ${filesPerSecond}파일/초`);
    }

    console.log('\n💡 권장사항');
    console.log('─'.repeat(20));

    if (this.results.quick && this.results.default) {
      const improvement = Math.round(
        ((this.results.default.average - this.results.quick.average) / this.results.default.average) * 100
      );
      console.log(`• 일상적 개발: lint:quick 사용 (${improvement}% 더 빠름)`);
    }

    console.log('• Pre-commit: lint:incremental 또는 lint:changed 사용');
    console.log('• CI/CD: lint:fast 또는 기본 lint 사용');
    console.log('• 대규모 변경: lint 전체 검사 사용');
  }

  /**
   * 결과를 JSON 파일로 저장
   */
  saveResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `lint-benchmark-${timestamp}.json`;
    const filepath = path.join(__dirname, '../../reports', filename);

    // reports 디렉토리 생성
    const reportsDir = path.dirname(filepath);
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const report = {
      timestamp: new Date().toISOString(),
      config: BENCHMARK_CONFIG,
      environment: {
        node: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      results: this.results,
    };

    try {
      fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
      log.success(`결과 저장: ${filepath}`);
    } catch (error) {
      log.error(`결과 저장 실패: ${error.message}`);
    }
  }
}

// 메인 실행
if (require.main === module) {
  const benchmark = new LintBenchmark();
  benchmark.runBenchmark().catch((error) => {
    log.error(`벤치마크 실패: ${error.message}`);
    process.exit(1);
  });
}

module.exports = LintBenchmark;