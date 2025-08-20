#!/usr/bin/env node

/**
 * 🔧 TimerManager.register 호출 수정 스크립트
 * 누락된 enabled 속성을 자동으로 추가합니다.
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 TimerManager.register 호출 수정 시작...\n');

// 수정할 파일 목록
const filesToFix = [
  'src/services/simulationEngine.ts',
  'src/services/UnifiedMetricsManager.ts',
  'src/stores/serverDataStore.ts',
];

let totalFixed = 0;

filesToFix.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ 파일을 찾을 수 없습니다: ${filePath}`);
    return;
  }

  console.log(`📝 수정 중: ${filePath}`);

  let content = fs.readFileSync(filePath, 'utf8');
  let fixCount = 0;

  // timerManager.register 패턴 찾기 및 수정
  const registerPattern =
    /(timerManager\.register\(\{[^}]*priority:\s*['"][^'"]*['"][^}]*)\}/g;

  content = content.replace(registerPattern, (match, beforeClosing) => {
    // enabled 속성이 이미 있는지 확인
    if (beforeClosing.includes('enabled:')) {
      return match; // 이미 있으면 수정하지 않음
    }

    fixCount++;
    return beforeClosing + ',\n      enabled: true\n    })';
  });

  if (fixCount > 0) {
    fs.writeFileSync(filePath, content);
    console.log(`  ✅ ${fixCount}개 수정 완료`);
    totalFixed += fixCount;
  } else {
    console.log(`  ℹ️ 수정할 항목 없음`);
  }
});

console.log(`\n🎉 총 ${totalFixed}개 timerManager.register 호출 수정 완료!`);

if (totalFixed > 0) {
  console.log('\n📋 수정된 내용:');
  console.log('- 누락된 enabled: true 속성 추가');
  console.log('- TypeScript 타입 오류 해결');
  console.log('\n✅ 이제 npm run build를 다시 실행해보세요.');
}
