#!/usr/bin/env node

/**
 * 지능형 검증 파이프라인 테스트 스크립트
 * @description 모든 컴포넌트의 기능과 성능을 테스트
 * @created 2025-08-09
 */

const { 
  calculateRiskScore, 
  calculateBatchRiskScore, 
  analyzeProjectRisk 
} = require('./validation/risk-calculator');

const { 
  analyzeDependencyTree,
  calculateImpactScope,
  determineTestFiles,
  getCacheStats,
  clearCache
} = require('./validation/dependency-analyzer');

const { 
  runParallelTasks, 
  ValidationTaskBuilder, 
  VALIDATION_PRESETS 
} = require('./validation/parallel-runner');

const { 
  runIntelligentValidation,
  collectGitInfo,
  determineBranchStrategy
} = require('./validation/intelligent-validator');

const fs = require('fs');
const path = require('path');

/**
 * 테스트 결과 수집
 */
class TestResults {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }
  
  add(testName, success, duration, details = {}) {
    this.results.push({
      testName,
      success,
      duration,
      timestamp: new Date().toISOString(),
      details
    });
  }
  
  getReport() {
    const totalDuration = Date.now() - this.startTime;
    const successCount = this.results.filter(r => r.success).length;
    const failureCount = this.results.length - successCount;
    
    return {
      summary: {
        total: this.results.length,
        success: successCount,
        failure: failureCount,
        successRate: Math.round((successCount / this.results.length) * 100),
        totalDuration
      },
      results: this.results,
      failures: this.results.filter(r => !r.success)
    };
  }
}

/**
 * 테스트 1: 리스크 계산 엔진
 */
async function testRiskCalculator(testResults) {
  console.log('📊 테스트 1: 리스크 계산 엔진');
  console.log('───────────────────────────────────────');
  
  const startTime = Date.now();
  
  try {
    // 샘플 파일들로 테스트
    const testFiles = [
      'src/app/page.tsx',           // 고위험
      'src/components/Button.tsx',  // 중위험  
      'src/styles/globals.css',     // 저위험
      'README.md',                  // 무위험
      'package.json',               // 고위험
      'next.config.js'              // 고위험
    ];
    
    console.log('🔍 개별 파일 리스크 계산...');
    const individualScores = testFiles.map(file => {
      const score = calculateRiskScore(file, 'mock git diff with 50 lines of changes');
      console.log(`   ${file}: ${score.totalScore}점 (${score.riskLevel})`);
      return score;
    });
    
    console.log('\n📈 배치 리스크 분석...');
    const batchScores = calculateBatchRiskScore(testFiles, {
      'src/app/page.tsx': 'major changes with 100+ lines',
      'package.json': 'dependency updates'
    });
    
    console.log('\n🎯 프로젝트 리스크 분석...');
    const projectRisk = analyzeProjectRisk(batchScores);
    console.log(`   평균 스코어: ${projectRisk.averageScore}`);
    console.log(`   권장 전략: ${projectRisk.recommendation.strategy}`);
    console.log(`   타임아웃: ${projectRisk.recommendation.timeout}초`);
    
    const duration = Date.now() - startTime;
    testResults.add('Risk Calculator', true, duration, {
      testedFiles: testFiles.length,
      avgScore: projectRisk.averageScore,
      strategy: projectRisk.recommendation.strategy
    });
    
    console.log(`✅ 리스크 계산 테스트 통과 (${duration}ms)`);
    
  } catch (error) {
    const duration = Date.now() - startTime;
    testResults.add('Risk Calculator', false, duration, { error: error.message });
    console.log(`❌ 리스크 계산 테스트 실패: ${error.message}`);
  }
  
  console.log();
}

/**
 * 테스트 2: 의존성 분석기
 */
async function testDependencyAnalyzer(testResults) {
  console.log('🔗 테스트 2: 의존성 분석기');
  console.log('───────────────────────────────────────');
  
  const startTime = Date.now();
  
  try {
    // 캐시 초기화
    clearCache();
    
    console.log('📂 테스트 파일 의존성 분석...');
    const testFile = 'src/app/page.tsx';
    
    if (fs.existsSync(testFile)) {
      console.log(`🔍 분석 대상: ${testFile}`);
      
      const dependencyTree = analyzeDependencyTree(testFile, process.cwd());
      console.log(`   의존성 파일: ${dependencyTree.dependencies.length}개`);
      console.log(`   순환 참조: ${dependencyTree.circularRef ? '감지됨' : '없음'}`);
      
      if (dependencyTree.directDependencies) {
        console.log(`   내부 의존성: ${dependencyTree.directDependencies.internal.length}개`);
        console.log(`   외부 패키지: ${dependencyTree.directDependencies.external.length}개`);
      }
    } else {
      console.log(`⚠️  테스트 파일 없음: ${testFile}`);
    }
    
    console.log('\n🎯 영향 범위 분석...');
    const mockChangedFiles = ['src/app/page.tsx', 'src/components/Header.tsx'];
    const impactScope = calculateImpactScope(mockChangedFiles, process.cwd());
    console.log(`   영향받는 파일: ${impactScope.totalFiles}개`);
    console.log(`   외부 패키지: ${impactScope.externalPackages.size}개`);
    console.log(`   추천사항: ${impactScope.recommendations.length}개`);
    
    console.log('\n🧪 테스트 파일 결정...');
    const testFiles = determineTestFiles(mockChangedFiles, process.cwd());
    console.log(`   대상 테스트: ${testFiles.length}개`);
    
    console.log('\n💾 캐시 상태...');
    const cacheStats = getCacheStats();
    console.log(`   캐시 엔트리: ${cacheStats.size}개`);
    
    const duration = Date.now() - startTime;
    testResults.add('Dependency Analyzer', true, duration, {
      impactFiles: impactScope.totalFiles,
      testFiles: testFiles.length,
      cacheEntries: cacheStats.size
    });
    
    console.log(`✅ 의존성 분석 테스트 통과 (${duration}ms)`);
    
  } catch (error) {
    const duration = Date.now() - startTime;
    testResults.add('Dependency Analyzer', false, duration, { error: error.message });
    console.log(`❌ 의존성 분석 테스트 실패: ${error.message}`);
  }
  
  console.log();
}

/**
 * 테스트 3: 병렬 실행 엔진
 */
async function testParallelRunner(testResults) {
  console.log('⚡ 테스트 3: 병렬 실행 엔진');
  console.log('───────────────────────────────────────');
  
  const startTime = Date.now();
  
  try {
    console.log('🏗️  테스트 작업 구성...');
    
    // 빠른 테스트 작업들
    const testTasks = [
      {
        name: 'Fast Task 1',
        command: 'echo "Task 1 complete"',
        timeout: 5000
      },
      {
        name: 'Fast Task 2', 
        command: 'sleep 0.5 && echo "Task 2 complete"',
        timeout: 5000
      },
      {
        name: 'Fast Task 3',
        command: 'echo "Task 3 complete"',
        timeout: 5000
      },
      // 의도적 실패 작업
      {
        name: 'Failing Task',
        command: 'exit 1',
        timeout: 5000,
        critical: false
      }
    ];
    
    console.log('🚀 병렬 실행...');
    const result = await runParallelTasks(testTasks, {
      maxConcurrency: 4,
      globalTimeout: 15000,
      failFast: false,
      verbose: true
    });
    
    console.log('\n📊 실행 결과:');
    console.log(`   전체 작업: ${result.totalTasks}개`);
    console.log(`   성공: ${result.successCount}개`);
    console.log(`   실패: ${result.failureCount}개`);
    console.log(`   실행 시간: ${result.totalDuration}ms`);
    console.log(`   진행 가능: ${result.summary.canProceed ? '예' : '아니오'}`);
    
    // ValidationTaskBuilder 테스트
    console.log('\n🏗️  TaskBuilder 테스트...');
    const builder = new ValidationTaskBuilder();
    const builtTasks = builder
      .addLintTask(['src/app/page.tsx'], { skipTypes: ['prettier'] })
      .addTypeCheckTask()
      .addTestTask([], { testType: 'quick' })
      .build();
    
    console.log(`   구성된 작업: ${builtTasks.length}개`);
    
    const duration = Date.now() - startTime;
    testResults.add('Parallel Runner', true, duration, {
      tasksExecuted: result.totalTasks,
      successRate: Math.round((result.successCount / result.totalTasks) * 100),
      executionTime: result.totalDuration
    });
    
    console.log(`✅ 병렬 실행 테스트 통과 (${duration}ms)`);
    
  } catch (error) {
    const duration = Date.now() - startTime;
    testResults.add('Parallel Runner', false, duration, { error: error.message });
    console.log(`❌ 병렬 실행 테스트 실패: ${error.message}`);
  }
  
  console.log();
}

/**
 * 테스트 4: 통합 지능형 검증
 */
async function testIntelligentValidation(testResults) {
  console.log('🧠 테스트 4: 통합 지능형 검증');
  console.log('───────────────────────────────────────');
  
  const startTime = Date.now();
  
  try {
    console.log('📋 Git 정보 수집...');
    const gitInfo = collectGitInfo();
    console.log(`   현재 브랜치: ${gitInfo.currentBranch}`);
    console.log(`   변경 파일: ${gitInfo.allChangedFiles.length}개`);
    console.log(`   커밋되지 않은 변경: ${gitInfo.hasUncommittedChanges ? '있음' : '없음'}`);
    
    console.log('\n🎯 브랜치 전략 결정...');
    const strategy = determineBranchStrategy(gitInfo.currentBranch);
    console.log(`   전략: ${strategy.strategyName}`);
    console.log(`   설명: ${strategy.description}`);
    console.log(`   타임아웃: ${Math.round(strategy.preset.globalTimeout / 1000)}초`);
    
    // 실제 검증 실행 (비대화형 모드)
    console.log('\n🔄 지능형 검증 실행...');
    const validationResult = await runIntelligentValidation({
      verbose: false,
      interactive: false
    });
    
    console.log('\n📊 검증 결과:');
    console.log(`   성공: ${validationResult.success ? '예' : '아니오'}`);
    console.log(`   실행 시간: ${validationResult.totalDuration}ms`);
    console.log(`   스킵됨: ${validationResult.skipped ? '예' : '아니오'}`);
    
    if (validationResult.stats) {
      console.log(`   변경 파일: ${validationResult.stats.changedFiles}개`);
      console.log(`   영향 파일: ${validationResult.stats.affectedFiles}개`);
      console.log(`   평균 리스크: ${validationResult.stats.avgRiskScore}점`);
    }
    
    const duration = Date.now() - startTime;
    testResults.add('Intelligent Validation', true, duration, {
      validationSuccess: validationResult.success,
      executionTime: validationResult.totalDuration,
      strategy: validationResult.strategy,
      changedFiles: validationResult.stats?.changedFiles || 0
    });
    
    console.log(`✅ 통합 검증 테스트 통과 (${duration}ms)`);
    
  } catch (error) {
    const duration = Date.now() - startTime;
    testResults.add('Intelligent Validation', false, duration, { error: error.message });
    console.log(`❌ 통합 검증 테스트 실패: ${error.message}`);
  }
  
  console.log();
}

/**
 * 성능 벤치마크
 */
async function runPerformanceBenchmark(testResults) {
  console.log('⚡ 성능 벤치마크');
  console.log('───────────────────────────────────────');
  
  const startTime = Date.now();
  
  try {
    // 1. 리스크 계산 성능 (1000회)
    console.log('📊 리스크 계산 성능 테스트...');
    const riskStart = Date.now();
    
    for (let i = 0; i < 100; i++) {
      calculateRiskScore('src/app/page.tsx', `mock diff ${i}`);
    }
    
    const riskDuration = Date.now() - riskStart;
    const riskPerOp = riskDuration / 100;
    console.log(`   100회 실행: ${riskDuration}ms (평균 ${riskPerOp.toFixed(2)}ms/회)`);
    
    // 2. 병렬 실행 성능
    console.log('⚡ 병렬 실행 성능 테스트...');
    const parallelStart = Date.now();
    
    const quickTasks = Array.from({ length: 8 }, (_, i) => ({
      name: `Quick Task ${i + 1}`,
      command: 'echo "done"',
      timeout: 1000
    }));
    
    await runParallelTasks(quickTasks, {
      maxConcurrency: 4,
      verbose: false
    });
    
    const parallelDuration = Date.now() - parallelStart;
    console.log(`   8개 작업 병렬 실행: ${parallelDuration}ms`);
    
    const duration = Date.now() - startTime;
    testResults.add('Performance Benchmark', true, duration, {
      riskCalculationSpeed: riskPerOp,
      parallelExecutionTime: parallelDuration,
      totalBenchmarkTime: duration
    });
    
    console.log(`✅ 성능 벤치마크 통과 (${duration}ms)`);
    
  } catch (error) {
    const duration = Date.now() - startTime;
    testResults.add('Performance Benchmark', false, duration, { error: error.message });
    console.log(`❌ 성능 벤치마크 실패: ${error.message}`);
  }
  
  console.log();
}

/**
 * 메인 실행 함수
 */
async function main() {
  const testResults = new TestResults();
  
  console.log('🧪 지능형 검증 파이프라인 테스트 시작');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log();
  
  // 모든 테스트 실행
  await testRiskCalculator(testResults);
  await testDependencyAnalyzer(testResults);
  await testParallelRunner(testResults);
  await testIntelligentValidation(testResults);
  await runPerformanceBenchmark(testResults);
  
  // 최종 리포트
  const report = testResults.getReport();
  
  console.log('📊 최종 테스트 리포트');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`총 테스트: ${report.summary.total}개`);
  console.log(`성공: ${report.summary.success}개`);
  console.log(`실패: ${report.summary.failure}개`);
  console.log(`성공률: ${report.summary.successRate}%`);
  console.log(`전체 실행 시간: ${Math.round(report.summary.totalDuration / 1000)}초`);
  
  if (report.failures.length > 0) {
    console.log('\n❌ 실패한 테스트:');
    report.failures.forEach(failure => {
      console.log(`   • ${failure.testName}: ${failure.details.error}`);
    });
  }
  
  console.log('\n📈 성능 지표:');
  report.results.forEach(result => {
    if (result.details && Object.keys(result.details).length > 0) {
      console.log(`   ${result.testName}: ${result.duration}ms`);
      Object.entries(result.details).forEach(([key, value]) => {
        if (typeof value === 'number' && !key.includes('error')) {
          console.log(`     ${key}: ${value}`);
        }
      });
    }
  });
  
  // 결과 파일 저장
  const reportPath = path.join(process.cwd(), 'reports', 'intelligent-validation-test-report.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 상세 리포트 저장: ${reportPath}`);
  
  // 종료 코드 결정
  const success = report.summary.successRate >= 80;
  console.log(`\n${success ? '✅' : '❌'} 테스트 ${success ? '통과' : '실패'}`);
  
  process.exit(success ? 0 : 1);
}

// 실행
if (require.main === module) {
  main();
}

module.exports = { main };