/**
 * 지능형 검증 파이프라인 - 메인 검증 엔진
 * @description 리스크 분석과 의존성 분석을 통한 적응형 검증 시스템
 * @created 2025-08-09
 */

const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const { calculateBatchRiskScore, analyzeProjectRisk } = require('./risk-calculator');
const { calculateImpactScope, determineTestFiles } = require('./dependency-analyzer');
const { runParallelTasks, ValidationTaskBuilder, VALIDATION_PRESETS } = require('./parallel-runner');

/**
 * Git 정보 수집
 */
function collectGitInfo() {
  try {
    // 현재 브랜치
    const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
    
    // 변경된 파일 목록 (staged + unstaged)
    const stagedFiles = execSync('git diff --cached --name-only --diff-filter=ACMR', { encoding: 'utf-8' })
      .split('\n')
      .filter(f => f.trim() && (f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js') || f.endsWith('.jsx')));
    
    const unstagedFiles = execSync('git diff --name-only --diff-filter=ACMR', { encoding: 'utf-8' })
      .split('\n')
      .filter(f => f.trim() && (f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js') || f.endsWith('.jsx')));
    
    const allChangedFiles = [...new Set([...stagedFiles, ...unstagedFiles])];
    
    // 변경 내용 수집 (diff)
    const gitDiffs = {};
    for (const file of allChangedFiles) {
      try {
        const diff = execSync(`git diff HEAD -- "${file}"`, { encoding: 'utf-8' });
        gitDiffs[file] = diff;
      } catch (error) {
        gitDiffs[file] = '';
      }
    }
    
    // 커밋 정보
    const hasUncommittedChanges = stagedFiles.length > 0 || unstagedFiles.length > 0;
    const lastCommitHash = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
    
    return {
      currentBranch,
      stagedFiles,
      unstagedFiles,
      allChangedFiles,
      gitDiffs,
      hasUncommittedChanges,
      lastCommitHash,
      projectRoot: process.cwd()
    };
    
  } catch (error) {
    console.error('❌ Git 정보 수집 실패:', error.message);
    return {
      currentBranch: 'unknown',
      stagedFiles: [],
      unstagedFiles: [],
      allChangedFiles: [],
      gitDiffs: {},
      hasUncommittedChanges: false,
      lastCommitHash: '',
      projectRoot: process.cwd()
    };
  }
}

/**
 * 브랜치별 검증 전략 결정
 */
function determineBranchStrategy(branchName) {
  if (branchName === 'main' || branchName === 'master') {
    return {
      strategyName: 'STRICT',
      preset: VALIDATION_PRESETS.STRICT,
      description: '메인 브랜치 - 엄격한 검증'
    };
  }
  
  if (branchName === 'develop' || branchName === 'dev') {
    return {
      strategyName: 'ENHANCED',
      preset: VALIDATION_PRESETS.ENHANCED,
      description: '개발 브랜치 - 강화된 검증'
    };
  }
  
  if (branchName.startsWith('feature/') || branchName.startsWith('feat/')) {
    return {
      strategyName: 'STANDARD',
      preset: VALIDATION_PRESETS.STANDARD,
      description: '기능 브랜치 - 표준 검증'
    };
  }
  
  if (branchName.startsWith('hotfix/') || branchName.startsWith('fix/')) {
    return {
      strategyName: 'FAST',
      preset: VALIDATION_PRESETS.FAST,
      description: '수정 브랜치 - 빠른 검증'
    };
  }
  
  // 기본값
  return {
    strategyName: 'STANDARD',
    preset: VALIDATION_PRESETS.STANDARD,
    description: '기본 브랜치 - 표준 검증'
  };
}

/**
 * 사용자 상호작용 (실패 시 선택)
 */
async function promptUserChoice(failures, strategy) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  console.log('\n⚠️  검증 실패 감지');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  failures.forEach((failure, index) => {
    console.log(`${index + 1}. ${failure.taskName}: ${failure.error}`);
  });
  
  console.log('\n📋 선택 옵션:');
  console.log('1. ❌ 중단하고 수정하기 (권장)');
  console.log('2. ⚠️  경고로 처리하고 계속');
  console.log('3. ⏭️  이번만 스킵');
  console.log('4. 🚫 항상 스킵 (HUSKY=0 설정)');
  
  return new Promise((resolve) => {
    rl.question('\n선택하세요 (1-4): ', (answer) => {
      rl.close();
      resolve(parseInt(answer) || 1);
    });
  });
}

/**
 * 검증 결과 처리
 */
async function handleValidationResult(result, strategy, gitInfo) {
  const { success, summary } = result;
  
  if (success) {
    console.log('✅ 모든 검증 통과!');
    console.log(`📊 실행 시간: ${result.totalDuration}ms`);
    return { proceed: true, action: 'continue' };
  }
  
  // 실패 분석
  const criticalFailures = result.results.filter(r => !r.success && r.critical !== false);
  const warnings = result.results.filter(r => !r.success && r.critical === false);
  
  if (criticalFailures.length === 0) {
    // 경고만 있는 경우
    console.log(`⚠️  ${warnings.length}개 경고 발생 (실행 계속)`);
    warnings.forEach(w => console.log(`   • ${w.taskName}: ${w.error}`));
    return { proceed: true, action: 'continue_with_warnings' };
  }
  
  // 브랜치 전략에 따른 자동 결정
  if (strategy.strategyName === 'STRICT') {
    // 엄격 모드: 무조건 실패
    console.log('❌ 엄격 모드 - 검증 실패로 중단');
    return { proceed: false, action: 'abort' };
  }
  
  if (strategy.strategyName === 'FAST' && criticalFailures.length === 1) {
    // 빠른 모드: 단일 실패는 경고로 처리 가능
    console.log('⚠️  빠른 모드 - 단일 실패를 경고로 처리');
    return { proceed: true, action: 'continue_with_warnings' };
  }
  
  // 대화형 선택
  try {
    const choice = await promptUserChoice(criticalFailures, strategy);
    
    switch (choice) {
      case 1:
        return { proceed: false, action: 'abort' };
      case 2:
        console.log('⚠️  경고로 처리하여 계속 진행');
        return { proceed: true, action: 'continue_with_warnings' };
      case 3:
        console.log('⏭️  이번만 스킵');
        return { proceed: true, action: 'skip_once' };
      case 4:
        console.log('🚫 HUSKY=0 설정으로 항상 스킵 (env 설정)');
        // 실제로는 사용자가 수동으로 설정해야 함
        return { proceed: true, action: 'always_skip' };
      default:
        return { proceed: false, action: 'abort' };
    }
  } catch (error) {
    console.error('사용자 입력 처리 오류:', error.message);
    return { proceed: false, action: 'abort' };
  }
}

/**
 * 메인 지능형 검증 실행
 */
async function runIntelligentValidation(options = {}) {
  const startTime = Date.now();
  const { verbose = true, interactive = true } = options;
  
  if (verbose) {
    console.log('🧠 지능형 검증 파이프라인 시작');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
  
  try {
    // 1. Git 정보 수집
    const gitInfo = collectGitInfo();
    
    if (verbose) {
      console.log(`📋 브랜치: ${gitInfo.currentBranch}`);
      console.log(`📁 변경 파일: ${gitInfo.allChangedFiles.length}개`);
    }
    
    // 변경사항이 없으면 스킵
    if (gitInfo.allChangedFiles.length === 0) {
      console.log('ℹ️  변경된 파일이 없습니다. 검증을 건너뜁니다.');
      return { success: true, skipped: true, reason: 'no_changes' };
    }
    
    // 2. 브랜치 전략 결정
    const strategy = determineBranchStrategy(gitInfo.currentBranch);
    
    if (verbose) {
      console.log(`🎯 검증 전략: ${strategy.description}`);
    }
    
    // 3. 리스크 분석
    const riskScores = calculateBatchRiskScore(gitInfo.allChangedFiles, gitInfo.gitDiffs);
    const projectRisk = analyzeProjectRisk(riskScores);
    
    if (verbose) {
      console.log(`🎲 리스크 분석: 평균 ${projectRisk.averageScore}점`);
      console.log(`   • CRITICAL: ${projectRisk.distribution.CRITICAL}개`);
      console.log(`   • HIGH: ${projectRisk.distribution.HIGH}개`);
      console.log(`   • MEDIUM: ${projectRisk.distribution.MEDIUM}개`);
    }
    
    // 4. 의존성 분석
    const impactScope = calculateImpactScope(gitInfo.allChangedFiles, gitInfo.projectRoot);
    const testFiles = determineTestFiles(gitInfo.allChangedFiles, gitInfo.projectRoot);
    
    if (verbose) {
      console.log(`🔗 영향 범위: ${impactScope.totalFiles}개 파일`);
      console.log(`🧪 대상 테스트: ${testFiles.length}개 파일`);
    }
    
    // 5. 최적화된 검증 전략 결합
    const riskRecommendation = projectRisk.recommendation;
    const finalStrategy = {
      ...strategy.preset,
      skipTypes: [...strategy.preset.skipTypes, ...riskRecommendation.skipTypes],
      timeout: Math.min(strategy.preset.globalTimeout, riskRecommendation.timeout * 1000)
    };
    
    // 6. 고위험 파일이 많으면 더 적극적인 최적화
    if (projectRisk.distribution.CRITICAL > 3) {
      finalStrategy.skipTypes.push('prettier', 'unused-imports');
      finalStrategy.maxConcurrency = 1; // 순차 실행으로 안정성 확보
      console.log('⚡ 고위험 모드: 순차 실행으로 전환');
      
      // 응급 상황: 매우 많은 고위험 파일
      if (projectRisk.distribution.CRITICAL > 4) {
        finalStrategy.skipTypes.push('eslint'); // ESLint도 스킵
        finalStrategy.timeout = 60000; // 1분으로 단축
        console.log('🚨 응급 모드: ESLint 스킵, TypeScript만 검사');
      }
    }
    
    if (verbose) {
      console.log(`⚡ 최적화 전략: ${Math.round(finalStrategy.timeout/1000)}초 타임아웃`);
      if (finalStrategy.skipTypes.length > 0) {
        console.log(`   • 스킵: ${finalStrategy.skipTypes.join(', ')}`);
      }
    }
    
    // 6. 병렬 검증 작업 구성
    const taskBuilder = new ValidationTaskBuilder();
    
    taskBuilder
      .addLintTask(gitInfo.allChangedFiles.slice(0, 10), { // 최대 10개 파일만
        timeout: Math.min(45000, finalStrategy.timeout * 0.4),
        skipTypes: finalStrategy.skipTypes
      })
      .addTypeCheckTask(gitInfo.allChangedFiles, {
        timeout: Math.min(60000, finalStrategy.timeout * 0.5)
      })
      .addTestTask(testFiles.slice(0, 5), { // 최대 5개 테스트 파일만
        timeout: Math.min(90000, finalStrategy.timeout * 0.6),
        testType: testFiles.length === 0 ? 'quick' : 'targeted'
      })
      .addSecurityTask({
        timeout: Math.min(20000, finalStrategy.timeout * 0.2),
        skipTypes: finalStrategy.skipTypes
      });
    
    const tasks = taskBuilder.build();
    
    if (verbose) {
      console.log(`🚀 실행: ${tasks.length}개 병렬 작업`);
    }
    
    // 7. 병렬 검증 실행
    const result = await runParallelTasks(tasks, {
      ...finalStrategy,
      verbose
    });
    
    // 8. 결과 처리
    const decision = interactive 
      ? await handleValidationResult(result, strategy, gitInfo)
      : { proceed: result.success, action: result.success ? 'continue' : 'abort' };
    
    const totalDuration = Date.now() - startTime;
    
    if (verbose) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`⏱️  총 실행 시간: ${totalDuration}ms`);
      console.log(`📊 작업 성공률: ${result.successCount}/${result.totalTasks}`);
      console.log(`🎯 최종 결정: ${decision.proceed ? '✅ 진행' : '❌ 중단'}`);
    }
    
    return {
      success: decision.proceed,
      totalDuration,
      strategy: strategy.strategyName,
      riskAnalysis: projectRisk,
      impactAnalysis: impactScope,
      validationResult: result,
      decision,
      gitInfo,
      stats: {
        changedFiles: gitInfo.allChangedFiles.length,
        affectedFiles: impactScope.totalFiles,
        testFiles: testFiles.length,
        avgRiskScore: projectRisk.averageScore
      }
    };
    
  } catch (error) {
    console.error('❌ 지능형 검증 실행 중 오류:', error.message);
    
    return {
      success: false,
      error: error.message,
      totalDuration: Date.now() - startTime,
      fallbackRequired: true
    };
  }
}

module.exports = {
  runIntelligentValidation,
  collectGitInfo,
  determineBranchStrategy,
  handleValidationResult
};