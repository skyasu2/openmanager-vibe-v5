#!/usr/bin/env node

/**
 * 지능형 Pre-push 검증 스크립트  
 * @description Push 전 최종 검증 (더 엄격한 기준)
 * @created 2025-08-09
 */

const { runIntelligentValidation } = require('./validation/intelligent-validator');
const { execSync } = require('child_process');

/**
 * Push 대상 브랜치 정보 수집
 */
function collectPushInfo() {
  try {
    // 현재 브랜치
    const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
    
    // Push 대상 원격 브랜치
    const remoteBranch = execSync(`git rev-parse --abbrev-ref --symbolic-full-name @{u}`, { encoding: 'utf-8' }).trim();
    
    // 원격과의 커밋 차이
    const aheadCount = parseInt(execSync(`git rev-list --count HEAD ^${remoteBranch}`, { encoding: 'utf-8' }).trim()) || 0;
    
    // Push될 커밋 목록
    const commits = execSync(`git log ${remoteBranch}..HEAD --oneline --no-merges`, { encoding: 'utf-8' })
      .split('\n')
      .filter(line => line.trim())
      .slice(0, 10); // 최대 10개 커밋만
    
    return {
      currentBranch,
      remoteBranch,
      aheadCount,
      commits,
      isPushRequired: aheadCount > 0
    };
    
  } catch (error) {
    console.warn('⚠️  Push 정보 수집 실패:', error.message);
    return {
      currentBranch: 'unknown',
      remoteBranch: 'unknown',
      aheadCount: 0,
      commits: [],
      isPushRequired: true
    };
  }
}

/**
 * Push 특화 검증 전략
 */
function getPushValidationStrategy(pushInfo, baseStrategy) {
  // Push는 pre-commit보다 더 엄격
  const pushStrategies = {
    STRICT: {
      ...baseStrategy,
      globalTimeout: 240000, // 4분 (더 길게)
      skipTypes: [], // 아무것도 스킵하지 않음
      runFullTests: true
    },
    
    ENHANCED: {
      ...baseStrategy,
      globalTimeout: 180000, // 3분
      skipTypes: [], // 아무것도 스킵하지 않음
      runFullTests: pushInfo.aheadCount > 3
    },
    
    STANDARD: {
      ...baseStrategy,
      globalTimeout: 120000, // 2분
      skipTypes: ['prettier'],
      runFullTests: pushInfo.aheadCount > 5
    },
    
    FAST: {
      ...baseStrategy,
      globalTimeout: 90000, // 1.5분
      skipTypes: ['prettier', 'spell-check'],
      runFullTests: false
    }
  };
  
  return pushStrategies[baseStrategy.strategyName] || pushStrategies.STANDARD;
}

/**
 * 메인 실행 함수
 */
async function main() {
  const startTime = Date.now();
  
  // 환경변수 체크
  if (process.env.HUSKY === '0') {
    console.log('⏭️  HUSKY=0 설정으로 검증을 건너뜁니다.');
    process.exit(0);
  }
  
  console.log('🚀 지능형 Pre-push 검증 시작');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    // Push 정보 수집
    const pushInfo = collectPushInfo();
    
    console.log(`📤 Push 대상: ${pushInfo.currentBranch} → ${pushInfo.remoteBranch}`);
    console.log(`📊 대기 중 커밋: ${pushInfo.aheadCount}개`);
    
    if (pushInfo.commits.length > 0) {
      console.log('📝 Push될 커밋:');
      pushInfo.commits.forEach((commit, i) => {
        console.log(`   ${i + 1}. ${commit}`);
      });
    }
    
    if (!pushInfo.isPushRequired) {
      console.log('ℹ️  Push할 변경사항이 없습니다.');
      process.exit(0);
    }
    
    // 지능형 검증 실행 (Push 모드)
    const result = await runIntelligentValidation({
      verbose: true,
      interactive: true,
      mode: 'pre-push',
      pushInfo
    });
    
    if (result.skipped) {
      console.log(`ℹ️  검증 스킵: ${result.reason}`);
      process.exit(0);
    }
    
    if (result.success) {
      console.log('✅ 지능형 Pre-push 검증 완료!');
      console.log(`📊 성과: ${Math.round((Date.now() - startTime) / 1000)}초 실행`);
      
      // Push 관련 추가 정보
      if (result.stats) {
        console.log(`   • Push 커밋: ${pushInfo.aheadCount}개`);
        console.log(`   • 변경 파일: ${result.stats.changedFiles}개`);
        console.log(`   • 평균 리스크: ${result.stats.avgRiskScore}점`);
        console.log(`   • 전략: ${result.strategy} (Push 강화)`);
      }
      
      // 성공적인 Push 준비 완료 메시지
      console.log('🎯 Push 준비 완료! 안전하게 Push할 수 있습니다.');
      process.exit(0);
      
    } else {
      console.log('❌ 지능형 Pre-push 검증 실패!');
      
      if (result.decision && result.decision.action === 'continue_with_warnings') {
        console.log('⚠️  경고가 있지만 계속 진행합니다.');
        process.exit(0);
      }
      
      if (result.fallbackRequired) {
        console.log('🔄 기본 검증으로 폴백합니다.');
        // Pre-push는 폴백이 더 중요 (원격에 영향)
        try {
          console.log('📋 기본 pre-push 검증 실행 중...');
          execSync('npm run test:pre-push', { stdio: 'inherit' });
          console.log('✅ 기본 검증 통과');
          process.exit(0);
        } catch (fallbackError) {
          console.error('❌ 기본 검증도 실패:', fallbackError.message);
          process.exit(1);
        }
      }
      
      console.log('💡 Push 전 해결 방법:');
      console.log('   1. npm run lint:fix - ESLint 오류 자동 수정');
      console.log('   2. npm run type-check - TypeScript 오류 확인'); 
      console.log('   3. npm run test - 전체 테스트 실행');
      console.log('   4. git commit --amend - 마지막 커밋 수정');
      console.log('   5. HUSKY=0 git push - 이번만 스킵 (주의!)');
      
      // Push 실패는 더 심각하므로 상세한 피드백
      if (result.validationResult && result.validationResult.results) {
        const criticalErrors = result.validationResult.results.filter(r => !r.success && r.critical !== false);
        if (criticalErrors.length > 0) {
          console.log('\n🔥 주요 실패 원인:');
          criticalErrors.forEach((error, i) => {
            console.log(`   ${i + 1}. ${error.taskName}: ${error.error}`);
          });
        }
      }
      
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ 지능형 Pre-push 검증 시스템 오류:', error.message);
    
    // 디버그 정보
    if (process.env.DEBUG) {
      console.error('Stack trace:', error.stack);
    }
    
    console.log('🔄 기본 pre-push 검증으로 폴백합니다.');
    
    try {
      execSync('npm run test:pre-push', { stdio: 'inherit' });
      console.log('✅ 기본 검증 통과');
      process.exit(0);
    } catch (fallbackError) {
      console.error('❌ 모든 검증 실패');
      process.exit(1);
    }
  }
}

// 프로세스 신호 처리
process.on('SIGINT', () => {
  console.log('\n⚠️  사용자가 중단했습니다.');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n⚠️  시스템이 종료를 요청했습니다.');
  process.exit(1);
});

// 메인 실행
if (require.main === module) {
  main();
}

module.exports = { main, collectPushInfo, getPushValidationStrategy };