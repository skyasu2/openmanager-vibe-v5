#!/usr/bin/env node

/**
 * 지능형 Pre-commit 검증 스크립트
 * @description 리스크 기반 적응형 검증 시스템
 * @created 2025-08-09
 */

const { runIntelligentValidation } = require('./validation/intelligent-validator');

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
  
  // 지능형 검증 실행
  try {
    const result = await runIntelligentValidation({
      verbose: true,
      interactive: true
    });
    
    if (result.skipped) {
      console.log(`ℹ️  검증 스킵: ${result.reason}`);
      process.exit(0);
    }
    
    if (result.success) {
      console.log('✅ 지능형 Pre-commit 검증 완료!');
      console.log(`📊 성과: ${Math.round((Date.now() - startTime) / 1000)}초 실행`);
      
      // 성능 통계 출력
      if (result.stats) {
        console.log(`   • 변경 파일: ${result.stats.changedFiles}개`);
        console.log(`   • 영향 파일: ${result.stats.affectedFiles}개`);
        console.log(`   • 평균 리스크: ${result.stats.avgRiskScore}점`);
        console.log(`   • 전략: ${result.strategy}`);
      }
      
      process.exit(0);
    } else {
      console.log('❌ 지능형 Pre-commit 검증 실패!');
      
      if (result.decision && result.decision.action === 'continue_with_warnings') {
        console.log('⚠️  경고가 있지만 계속 진행합니다.');
        process.exit(0);
      }
      
      if (result.fallbackRequired) {
        console.log('🔄 기본 검증으로 폴백합니다.');
        // 여기서 process.exit(1)을 하면 husky가 폴백 로직 실행
        process.exit(1);
      }
      
      console.log('💡 해결 방법:');
      console.log('   1. npm run lint:fix - ESLint 오류 자동 수정');  
      console.log('   2. npm run type-check - TypeScript 오류 확인');
      console.log('   3. npm test - 테스트 실행');
      console.log('   4. HUSKY=0 git commit - 이번만 스킵');
      
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ 지능형 검증 시스템 오류:', error.message);
    
    // 디버그 정보
    if (process.env.DEBUG) {
      console.error('Stack trace:', error.stack);
    }
    
    console.log('🔄 기본 검증으로 폴백합니다.');
    process.exit(1); // husky가 폴백 로직 실행
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

module.exports = { main };