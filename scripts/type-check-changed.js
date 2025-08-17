#!/usr/bin/env node
/**
 * 변경된 파일만 TypeScript 검사하는 스마트 검사기
 * Git 기반으로 변경된 TypeScript 파일만 선별하여 빠른 타입 체크 수행
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const SMART_MODE = process.argv.includes('smart');
const DRY_RUN = process.argv.includes('--dry-run');

/**
 * Git에서 변경된 TypeScript 파일 목록 가져오기
 */
function getChangedTsFiles() {
  try {
    // Staged와 unstaged 파일 모두 포함
    const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf8' }).trim();
    const unstagedFiles = execSync('git diff --name-only', { encoding: 'utf8' }).trim();
    
    const allFiles = [...stagedFiles.split('\n'), ...unstagedFiles.split('\n')]
      .filter(file => file && (file.endsWith('.ts') || file.endsWith('.tsx')))
      .filter(file => fs.existsSync(file))
      .filter((file, index, arr) => arr.indexOf(file) === index); // 중복 제거

    return allFiles;
  } catch (error) {
    console.log('🔍 Git 변경사항을 찾을 수 없습니다. 전체 검사로 진행합니다.');
    return [];
  }
}

/**
 * TypeScript 컴파일러 실행
 */
function runTypeCheck(files = []) {
  const isSmartMode = SMART_MODE && files.length > 0;
  
  console.log(isSmartMode 
    ? `🚀 스마트 타입 체크: ${files.length}개 파일 검사`
    : '📊 전체 타입 체크 실행');

  if (DRY_RUN) {
    console.log('🔍 검사할 파일들:');
    files.forEach(file => console.log(`  - ${file}`));
    return true;
  }

  try {
    if (isSmartMode) {
      // 변경된 파일만 체크 (빠른 검사)
      const tscCommand = `npx tsc --noEmit --skipLibCheck ${files.join(' ')}`;
      execSync(tscCommand, { stdio: 'pipe' });
      console.log('✅ 스마트 타입 체크 통과');
    } else {
      // 전체 프로젝트 체크
      execSync('npx tsc --noEmit', { stdio: 'pipe' });
      console.log('✅ 전체 타입 체크 통과');
    }
    return true;
  } catch (error) {
    console.error('❌ TypeScript 에러 발견:');
    console.error(error.stdout?.toString() || error.message);
    return false;
  }
}

/**
 * 메인 실행 로직
 */
function main() {
  console.log('🔧 TypeScript 스마트 검사기 시작...');
  
  const changedFiles = getChangedTsFiles();
  
  if (SMART_MODE && changedFiles.length === 0) {
    console.log('📝 변경된 TypeScript 파일이 없습니다. 스킵합니다.');
    return process.exit(0);
  }

  const success = runTypeCheck(changedFiles);
  
  if (!success) {
    console.log('\n💡 해결 방법:');
    console.log('  - npm run type-check     # 전체 타입 체크');
    console.log('  - npm run lint:fix       # 자동 수정 가능한 문제 해결');
    console.log('  - git commit [skip ci]   # 긴급 시 CI 스킵');
    process.exit(1);
  }
  
  process.exit(0);
}

// 스크립트 직접 실행 시에만 메인 함수 호출
if (require.main === module) {
  main();
}

module.exports = { getChangedTsFiles, runTypeCheck };