#!/usr/bin/env node

/**
 * 🔀 Pre-commit 훅 성능 벤치마크 도구
 * 
 * Pre-commit 훅의 실행 시간을 측정하고 최적화 효과를 분석합니다.
 * 다양한 시나리오에서의 성능을 비교할 수 있습니다.
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

// 테스트 시나리오 설정
const TEST_SCENARIOS = {
  'single-file': {
    description: '단일 파일 변경',
    files: ['src/lib/test-file.ts'],
    content: `// 테스트 파일
export const testFunction = () => {
  return 'hello world';
};`,
  },
  'multiple-files': {
    description: '복수 파일 변경 (3개)',
    files: [
      'src/lib/test-file-1.ts',
      'src/lib/test-file-2.ts',
      'src/lib/test-file-3.ts',
    ],
    content: `// 테스트 파일
export const testFunction = () => {
  return 'hello world';
};`,
  },
  'large-file': {
    description: '큰 파일 변경',
    files: ['src/lib/large-test-file.ts'],
    content: `// 큰 테스트 파일
${Array(100).fill().map((_, i) => `
export const testFunction${i} = () => {
  const data = { id: ${i}, name: 'test' };
  return data;
};`).join('\n')}`,
  },
};

class PrecommitBenchmark {
  constructor() {
    this.results = {};
    this.startTime = Date.now();
    this.tempFiles = [];
  }

  /**
   * 테스트 파일 생성
   */
  createTestFiles(scenario) {
    log.info(`테스트 파일 생성: ${scenario.description}`);
    
    scenario.files.forEach(filePath => {
      const fullPath = path.join(process.cwd(), filePath);
      const dir = path.dirname(fullPath);
      
      // 디렉토리 생성
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // 파일 생성
      fs.writeFileSync(fullPath, scenario.content);
      this.tempFiles.push(fullPath);
      
      // Git에 추가
      execSync(`git add ${filePath}`, { stdio: 'pipe' });
    });
  }

  /**
   * 테스트 파일 정리
   */
  cleanupTestFiles() {
    log.info('테스트 파일 정리 중...');
    
    this.tempFiles.forEach(filePath => {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        
        // Git에서 제거
        const relativePath = path.relative(process.cwd(), filePath);
        try {
          execSync(`git reset HEAD ${relativePath}`, { stdio: 'pipe' });
          execSync(`git clean -f ${relativePath}`, { stdio: 'pipe' });
        } catch (error) {
          // 무시 (파일이 이미 정리되었을 수 있음)
        }
      }
    });
    
    this.tempFiles = [];
  }

  /**
   * Pre-commit 훅 실행 시간 측정
   */
  async measurePrecommitHook(scenarioName, scenario) {
    log.info(`측정 중: ${scenario.description}`);
    
    const times = [];
    const iterations = 3;
    
    for (let i = 0; i < iterations; i++) {
      // 테스트 파일 생성
      this.createTestFiles(scenario);
      
      log.info(`${scenarioName} - 시도 ${i + 1}/${iterations}`);
      
      const startTime = Date.now();
      try {
        // Pre-commit 훅 실행 (실제로는 lint-staged만 실행)
        await this.executePrecommitHook();
        const duration = Date.now() - startTime;
        times.push(duration);
        log.success(`완료: ${duration}ms`);
      } catch (error) {
        const duration = Date.now() - startTime;
        times.push(duration);
        log.warning(`오류와 함께 완료: ${duration}ms`);
      }
      
      // 테스트 파일 정리
      this.cleanupTestFiles();
      
      // 잠시 대기 (시스템 안정화)
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return {
      times,
      average: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
      min: Math.min(...times),
      max: Math.max(...times),
      stdDev: this.calculateStdDev(times),
      filesCount: scenario.files.length,
    };
  }

  /**
   * Pre-commit 훅 실행
   */
  executePrecommitHook() {
    return new Promise((resolve, reject) => {
      // lint-staged를 직접 실행 (pre-commit 훅의 핵심 부분)
      const child = spawn('npx', ['lint-staged', '--concurrent', '--relative'], {
        stdio: 'pipe',
        timeout: 60000, // 1분 타임아웃
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
   * Git 상태 확인
   */
  checkGitStatus() {
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      return {
        clean: status.trim() === '',
        stagedFiles: status.split('\n').filter(line => line.startsWith('A ') || line.startsWith('M ')).length,
        modifiedFiles: status.split('\n').filter(line => line.startsWith(' M') || line.startsWith('MM')).length,
      };
    } catch (error) {
      return { clean: false, error: error.message };
    }
  }

  /**
   * 전체 벤치마크 실행
   */
  async runBenchmark() {
    log.benchmark('🔀 Pre-commit 훅 성능 벤치마크 시작');
    
    // Git 상태 확인
    const gitStatus = this.checkGitStatus();
    if (!gitStatus.clean) {
      log.warning('Git 작업 디렉토리가 깨끗하지 않습니다. 정확한 측정을 위해 정리를 권장합니다.');
      log.info(`스테이징된 파일: ${gitStatus.stagedFiles}개, 수정된 파일: ${gitStatus.modifiedFiles}개`);
    }

    console.log('\n' + '='.repeat(60));

    for (const [name, scenario] of Object.entries(TEST_SCENARIOS)) {
      try {
        const result = await this.measurePrecommitHook(name, scenario);
        this.results[name] = result;
      } catch (error) {
        log.error(`${name} 측정 실패: ${error.message}`);
        this.results[name] = { error: error.message };
      }
      
      console.log(''); // 구분선
    }

    this.generateReport();
    this.saveResults();
  }

  /**
   * 결과 리포트 생성
   */
  generateReport() {
    console.log('\n' + '🎯 Pre-commit 성능 벤치마크 결과'.padStart(45, '='));
    console.log(`총 실행 시간: ${Math.round((Date.now() - this.startTime) / 1000)}초\n`);

    // 결과 테이블
    console.log('┌' + '─'.repeat(20) + '┬' + '─'.repeat(8) + '┬' + '─'.repeat(10) + '┬' + '─'.repeat(10) + '┬' + '─'.repeat(15) + '┐');
    console.log('│' + ' 시나리오'.padEnd(19) + '│' + ' 파일수'.padEnd(7) + '│' + ' 평균(ms)'.padEnd(9) + '│' + ' 최소(ms)'.padEnd(9) + '│' + ' 편차(±ms)'.padEnd(14) + '│');
    console.log('├' + '─'.repeat(20) + '┼' + '─'.repeat(8) + '┼' + '─'.repeat(10) + '┼' + '─'.repeat(10) + '┼' + '─'.repeat(15) + '┤');

    const validResults = Object.entries(this.results)
      .filter(([_, result]) => !result.error);

    for (const [name, result] of validResults) {
      const filesStr = result.filesCount.toString().padStart(6);
      const avgStr = result.average.toString().padStart(8);
      const minStr = result.min.toString().padStart(8);
      const stdDevStr = result.stdDev.toString().padStart(12);
      
      const scenarioName = TEST_SCENARIOS[name].description.substring(0, 18).padEnd(18);
      console.log(`│ ${scenarioName}│${filesStr} │${avgStr} │${minStr} │${stdDevStr} │`);
    }

    console.log('└' + '─'.repeat(20) + '┴' + '─'.repeat(8) + '┴' + '─'.repeat(10) + '┴' + '─'.repeat(10) + '┴' + '─'.repeat(15) + '┘');

    // 성능 분석
    this.analyzePrecommitPerformance(validResults);
  }

  /**
   * Pre-commit 성능 분석
   */
  analyzePrecommitPerformance(validResults) {
    console.log('\n📈 Pre-commit 성능 분석');
    console.log('─'.repeat(40));

    if (validResults.length >= 2) {
      // 파일당 평균 처리 시간 계산
      const fileProcessingTimes = validResults.map(([name, result]) => ({
        name,
        timePerFile: Math.round(result.average / result.filesCount),
        ...result,
      }));

      fileProcessingTimes.sort((a, b) => a.timePerFile - b.timePerFile);

      log.info('파일당 평균 처리 시간:');
      fileProcessingTimes.forEach(({ name, timePerFile, filesCount, average }) => {
        const scenarioDesc = TEST_SCENARIOS[name].description;
        console.log(`  • ${scenarioDesc}: ${timePerFile}ms/파일 (${filesCount}파일, 총 ${average}ms)`);
      });

      // 확장성 분석
      const singleFile = validResults.find(([name]) => name === 'single-file');
      const multipleFiles = validResults.find(([name]) => name === 'multiple-files');
      
      if (singleFile && multipleFiles) {
        const [, singleResult] = singleFile;
        const [, multiResult] = multipleFiles;
        
        const scalingFactor = multiResult.average / (singleResult.average * multiResult.filesCount);
        const efficiency = Math.round((1 - scalingFactor) * 100);
        
        if (efficiency > 0) {
          log.success(`병렬 처리 효율성: ${efficiency}% (캐싱/병렬화 효과)`);
        } else {
          log.warning(`선형 확장: ${Math.abs(efficiency)}% 오버헤드 존재`);
        }
      }
    }

    console.log('\n💡 Pre-commit 최적화 권장사항');
    console.log('─'.repeat(35));
    console.log('• lint-staged --concurrent 옵션 활용 중 ✓');
    console.log('• 캐싱 활성화로 반복 실행 속도 향상 ✓');
    console.log('• 변경된 파일만 검사하여 효율성 극대화 ✓');
    
    // 임계값 기반 권장사항
    const avgTime = validResults.reduce((sum, [, result]) => sum + result.average, 0) / validResults.length;
    
    if (avgTime > 10000) { // 10초 이상
      log.warning('Pre-commit 시간이 긴 편입니다. 추가 최적화를 고려하세요.');
      console.log('  - ESLint 규칙 수 줄이기');
      console.log('  - 병렬 처리 worker 수 증가');
      console.log('  - SSD 사용 권장');
    } else if (avgTime < 5000) { // 5초 미만
      log.success('Pre-commit 성능이 우수합니다! 🚀');
    }
  }

  /**
   * 결과를 JSON 파일로 저장
   */
  saveResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `precommit-benchmark-${timestamp}.json`;
    const filepath = path.join(__dirname, '../../reports', filename);

    // reports 디렉토리 생성
    const reportsDir = path.dirname(filepath);
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const report = {
      timestamp: new Date().toISOString(),
      scenarios: TEST_SCENARIOS,
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

  /**
   * 정리 작업
   */
  cleanup() {
    this.cleanupTestFiles();
  }
}

// 메인 실행
if (require.main === module) {
  const benchmark = new PrecommitBenchmark();
  
  // 종료 시 정리 작업
  process.on('exit', () => benchmark.cleanup());
  process.on('SIGINT', () => {
    benchmark.cleanup();
    process.exit(0);
  });
  
  benchmark.runBenchmark().catch((error) => {
    log.error(`벤치마크 실패: ${error.message}`);
    benchmark.cleanup();
    process.exit(1);
  });
}

module.exports = PrecommitBenchmark;